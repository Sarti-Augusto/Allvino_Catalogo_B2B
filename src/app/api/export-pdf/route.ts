import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { resolveBrowserlessPdfEndpoint } from "@/lib/browserless";
import { publicProductSelect } from "@/lib/product-select";
import { getCountryFlagUrl } from "@/lib/utils";
import {
  catalogSortToRule,
  filterCatalogProducts,
  normalizeCatalogSort,
  normalizeCatalogSortRules,
  parseCatalogLimit,
  parseCatalogProductIds,
  serializeCatalogSortRules,
  sortCatalogProductsByRules,
} from "@/lib/catalog-export";

const clamp = (val: any, min: number = -450, max: number = 450): number => {
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return 0;
  return Math.max(min, Math.min(max, num));
};

const escapeHtml = (value: unknown): string =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safeImageSource = (value: unknown): string => {
  if (typeof value !== "string" || !value.trim()) return "";
  const source = value.trim();

  if (!/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=\s]+$/i.test(source)) {
    try {
      if (new URL(source).protocol !== "https:") return "";
    } catch {
      return "";
    }
  }

  return source.replace(/'/g, "%27");
};

const MAX_IMAGE_CACHE_ENTRIES = 120;
const optimizedImageCache = new Map<string, string>();
let cachedLogos: { black: string; white: string } | null = null;

function getCachedLogos(): { black: string; white: string } {
  if (cachedLogos) return cachedLogos;

  let black = "";
  let white = "";

  try {
    const blackPath = path.join(process.cwd(), "public", "logo-black.png");
    if (fs.existsSync(blackPath)) {
      black = `data:image/png;base64,${fs.readFileSync(blackPath).toString("base64")}`;
    } else {
      const defaultPath = path.join(process.cwd(), "public", "logo.png");
      if (fs.existsSync(defaultPath)) {
        black = `data:image/png;base64,${fs.readFileSync(defaultPath).toString("base64")}`;
      }
    }
  } catch {
    console.warn("Logo preta não encontrada em /public/logo-black.png");
  }

  try {
    const whitePath = path.join(process.cwd(), "public", "logo-white.png");
    if (fs.existsSync(whitePath)) {
      white = `data:image/png;base64,${fs.readFileSync(whitePath).toString("base64")}`;
    }
  } catch {
    console.warn("Logo branca não encontrada em /public/logo-white.png");
  }

  cachedLogos = { black, white };
  return cachedLogos;
}

const optimizeImageSource = async (
  value: unknown,
  width: number,
  height: number,
  quality: number
): Promise<string> => {
  const source = safeImageSource(value);
  const match = source.match(
    /^data:image\/(?:png|jpe?g|webp);base64,([A-Za-z0-9+/=\s]+)$/i
  );

  if (!match) return source;

  const cacheKey = `${width}x${height}q${quality}:${source.length}:${source.slice(0, 64)}:${source.slice(-64)}`;
  const cached = optimizedImageCache.get(cacheKey);
  if (cached) return cached;

  try {
    const input = Buffer.from(match[1].replace(/\s/g, ""), "base64");
    const output = await sharp(input)
      .rotate()
      .resize({
        width,
        height,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality, alphaQuality: 90, effort: 4 })
      .toBuffer();

    const optimized = `data:image/webp;base64,${output.toString("base64")}`;
    if (optimizedImageCache.size >= MAX_IMAGE_CACHE_ENTRIES) {
      const oldestKey = optimizedImageCache.keys().next().value;
      if (oldestKey) optimizedImageCache.delete(oldestKey);
    }
    optimizedImageCache.set(cacheKey, optimized);
    return optimized;
  } catch (error) {
    console.warn("Não foi possível otimizar uma imagem do catálogo:", error);
    return source;
  }
};

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await mapper(items[current], current);
    }
  });

  await Promise.all(workers);
  return results;
}

const safeCssValue = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return /^[#a-z0-9(),.%\s-]+$/i.test(normalized) ? normalized : fallback;
};

// Vercel serverless config: extend timeout for PDF generation
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return generateCatalogPdfResponse(request);
}

async function generateCatalogPdfResponse(
  request: Request,
  previewStylesOverride?: Record<string, unknown>,
) {
  let browser;
  try {
    const { searchParams } = new URL(request.url);
    const sort = normalizeCatalogSort(searchParams.get("sort"));
    const sortRules = searchParams.has("sorts")
      ? normalizeCatalogSortRules(searchParams.get("sorts"))
      : [catalogSortToRule(sort)];
    const productLimit = parseCatalogLimit(searchParams.get("limit"));
    const rawProductIds = searchParams.get("ids");
    const selectedProductIds = parseCatalogProductIds(rawProductIds);
    const requestedTemplateId = searchParams.get("templateId")?.trim() || "";
    const hidePrices =
      searchParams.get("hidePrices") === "1" || searchParams.get("hidePrices") === "true";
    const includeIndex =
      searchParams.get("includeIndex") === "1" || searchParams.get("includeIndex") === "true";
    const filters = {
      search: searchParams.get("search") || "",
      grape: searchParams.get("grape") || "",
      country: searchParams.get("country") || "",
      winery: searchParams.get("winery") || "",
      category: searchParams.get("category") || "",
    };

    // 1. Fetch requested or active template (unless previewStylesOverride is supplied)
    let styles: any = previewStylesOverride || null;
    if (!styles) {
      const targetTemplate = requestedTemplateId
        ? await prisma.template.findUnique({ where: { id: requestedTemplateId } })
        : await prisma.template.findFirst({ where: { isActive: true } });

      const activeTemplate =
        targetTemplate ||
        (requestedTemplateId
          ? await prisma.template.findFirst({ where: { isActive: true } })
          : null);

      if (!activeTemplate) {
        return NextResponse.json(
          { error: "Nenhum template ativo foi configurado no painel administrativo." },
          { status: 400 }
        );
      }

      try {
        styles = JSON.parse(activeTemplate.cssStyles);
      } catch {
        return NextResponse.json(
          { error: "Erro nas definições de estilo do template." },
          { status: 500 }
        );
      }
    }

    // 2. Fetch active wines (push ID filter down to PostgreSQL when specified)
    const activeProducts = await prisma.product.findMany({
      where: {
        status: true,
        ...(rawProductIds !== null ? { id: { in: selectedProductIds } } : {}),
      },
      select: publicProductSelect,
    });
    const matchingProducts = filterCatalogProducts(activeProducts, filters);
    const products = sortCatalogProductsByRules(matchingProducts, sortRules).slice(
      0,
      productLimit ?? undefined,
    );

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Não há vinhos ativos que correspondam aos filtros para exportar." },
        { status: 400 }
      );
    }

    // 4. Read logos from in-memory cache
    const { black: logoBlackBase64, white: logoWhiteBase64 } = getCachedLogos();

    // 5. Extract style variables with defaults
    const primaryColor = safeCssValue(styles.primaryColor, "#80282d");
    const secondaryColor = safeCssValue(styles.secondaryColor, "#c5a880");
    const backgroundColor = safeCssValue(styles.backgroundColor, "#ffffff");
    const textColor = safeCssValue(styles.textColor, "#1f2937");
    const fontFamily = styles.fontFamily || "Playfair Display";
    const headerTitle = escapeHtml(styles.headerTitle || "ALLVINO");
    const footerText = escapeHtml(styles.footerText || "Allvino Importadora de Vinhos B2B");
    const [coverImageUrl, backgroundImageUrl] = await Promise.all([
      optimizeImageSource(styles.coverImageUrl, 1200, 1700, 80),
      optimizeImageSource(styles.backgroundImageUrl, 1200, 1700, 80),
    ]);

    // ── COVER DYNAMIC TUNING ────────────────────────
    const showCoverLogo = styles.showCoverLogo !== false;
    const showCoverDivider = styles.showCoverDivider !== false;
    const showCoverTitle = styles.showCoverTitle !== false;
    const showCoverSubtitle = styles.showCoverSubtitle !== false;
    const showCoverFooter = styles.showCoverFooter !== false;
    const coverSubtitle = escapeHtml(styles.coverSubtitle || "Catálogo Exclusivo B2B");
    const coverLogoHeight = typeof styles.coverLogoHeight === "number" ? styles.coverLogoHeight : 110;
    const coverLogoAngle = typeof styles.coverLogoAngle === "number" ? styles.coverLogoAngle : 0;
    const coverLogoXOffset = clamp(styles.coverLogoXOffset);
    const coverLogoYOffset = clamp(styles.coverLogoYOffset);
    const coverLogoVariant = styles.coverLogoVariant || "auto";
    
    const coverTitleColorCustom = safeCssValue(styles.coverTitleColor, "");
    const coverTitleFontSize = typeof styles.coverTitleFontSize === "number" ? styles.coverTitleFontSize : 30;
    const coverTitleAngle = typeof styles.coverTitleAngle === "number" ? styles.coverTitleAngle : 0;
    const coverTitleXOffset = clamp(styles.coverTitleXOffset);
    const coverTitleYOffset = clamp(styles.coverTitleYOffset);
    
    const coverSubtitleColorCustom = safeCssValue(styles.coverSubtitleColor, "");
    const coverSubtitleFontSize = typeof styles.coverSubtitleFontSize === "number" ? styles.coverSubtitleFontSize : 11;
    const coverSubtitleAngle = typeof styles.coverSubtitleAngle === "number" ? styles.coverSubtitleAngle : 0;
    const coverSubtitleXOffset = clamp(styles.coverSubtitleXOffset);
    const coverSubtitleYOffset = clamp(styles.coverSubtitleYOffset);

    const coverFooterColorCustom = safeCssValue(styles.coverFooterColor, "");
    const coverFooterFontSize = typeof styles.coverFooterFontSize === "number" ? styles.coverFooterFontSize : 9;
    const coverFooterXOffset = clamp(styles.coverFooterXOffset);
    const coverFooterYOffset = clamp(styles.coverFooterYOffset);
    const coverVerticalOffset = clamp(styles.coverVerticalOffset);

    // ── LAYOUT PRESET & ALIGNMENTS ──
    const showProductName = styles.showProductName !== false;
    const showProductOrigin = styles.showProductOrigin !== false;
    const showProductDivider = styles.showProductDivider !== false;
    const showProductBottle = styles.showProductBottle !== false;
    const showProductSpecs = styles.showProductSpecs !== false;
    const showProductDescription = styles.showProductDescription !== false;
    const showProductPrice = !hidePrices && styles.showProductPrice !== false;
    const showProductFooter = styles.showProductFooter !== false;
    const showProductBoxPrice = styles.showProductBoxPrice !== false;
    const showProductCategoryBadge = styles.showProductCategoryBadge !== false;
    const showProductDiscountBadge = styles.showProductDiscountBadge !== false;
    const showProductCountryFlag = styles.showProductCountryFlag !== false;
    const productLayoutPreset = [
      "classic",
      "side-right",
      "side-left",
      "price-top",
      "editorial-duo",
      "commercial-grid",
      "executive-table",
    ].includes(styles.productLayoutPreset)
      ? styles.productLayoutPreset
      : "classic";
    const productDescAngle = typeof styles.productDescAngle === "number" ? styles.productDescAngle : 0;
    const productDescAlign = ["left", "center", "right", "justify"].includes(styles.productDescAlign)
      ? styles.productDescAlign
      : "center";
    const productPriceAngle = typeof styles.productPriceAngle === "number" ? styles.productPriceAngle : 0;

    // ── PRODUCT PAGE BOTTLE & LAYOUT DYNAMIC TUNING ──
    const productImgHeight = typeof styles.productImgHeight === "number" ? styles.productImgHeight : 520;
    const productImgMaxWidth = Math.round(productImgHeight * 0.52);
    const productImgXOffset = clamp(styles.productImgXOffset);
    const productImgYOffset = clamp(styles.productImgYOffset);
    const productImgAngle = typeof styles.productImgAngle === "number" ? styles.productImgAngle : 0;

    // Product Header Tuning
    const productNameFontSize = typeof styles.productNameFontSize === "number" ? styles.productNameFontSize : 28;
    const productNameXOffset = clamp(styles.productNameXOffset);
    const productNameYOffset = clamp(styles.productNameYOffset);

    const productSpecsFontSize = typeof styles.productSpecsFontSize === "number" ? styles.productSpecsFontSize : 11;
    const productOriginYOffset = clamp(styles.productOriginYOffset);

    // Product Colors & Price Block Tuning (Unrestricted full-canvas X & Y positioning)
    const productNameColor = safeCssValue(styles.productNameColor, primaryColor);
    const productSpecsColor = safeCssValue(styles.productSpecsColor, secondaryColor);
    const productDescColor = safeCssValue(styles.productDescColor, textColor);
    const productPriceColor = safeCssValue(styles.productPriceColor, primaryColor);
    const productPriceLabelColor = safeCssValue(styles.productPriceLabelColor, "#777777");
    const productPriceInfoColor = safeCssValue(styles.productPriceInfoColor, secondaryColor);
    const productPriceSide = ["right", "left", "center"].includes(styles.productPriceSide)
      ? styles.productPriceSide
      : "right"; // "right" | "left" | "center"
    const productPriceXOffset = clamp(styles.productPriceXOffset, -350, 350);
    const productPriceYOffset = clamp(styles.productPriceYOffset, -450, 450);

    // Price Font Sizes
    const productPriceLabelFontSize = typeof styles.productPriceLabelFontSize === "number" ? styles.productPriceLabelFontSize : 9.5;
    const productPriceInfoFontSize = typeof styles.productPriceInfoFontSize === "number" ? styles.productPriceInfoFontSize : 10;
    const productPriceValueFontSize = typeof styles.productPriceValueFontSize === "number" ? styles.productPriceValueFontSize : 24;

    // Product Details & Description Tuning
    const productDescFontSize = typeof styles.productDescFontSize === "number" ? styles.productDescFontSize : 14.5;
    const productDescXOffset = clamp(styles.productDescXOffset);
    const productDescYOffset = clamp(styles.productDescYOffset, -150, 150);
    const productPagePadding = typeof styles.productPagePadding === "number" ? styles.productPagePadding : 28;
    const productTextMaxWidth = typeof styles.productTextMaxWidth === "number" ? styles.productTextMaxWidth : 560;

    // 6. Resolve font family CSS
    const fontCSS =
      fontFamily === "Inter"
        ? "'Inter', 'Helvetica Neue', sans-serif"
        : fontFamily === "Cinzel"
        ? "'Cinzel', Georgia, serif"
        : fontFamily === "Cormorant Garamond"
        ? "'Cormorant Garamond', Georgia, serif"
        : fontFamily === "Montserrat"
        ? "'Montserrat', 'Helvetica Neue', sans-serif"
        : "'Playfair Display', Georgia, serif";

    // 7. Cover page config & logo resolution
    const hasCoverBg = !!coverImageUrl;

    let selectedLogoBase64 = logoBlackBase64;
    if (coverLogoVariant === "white") {
      selectedLogoBase64 = logoWhiteBase64 || logoBlackBase64;
    } else if (coverLogoVariant === "black") {
      selectedLogoBase64 = logoBlackBase64;
    } else {
      selectedLogoBase64 = hasCoverBg ? (logoWhiteBase64 || logoBlackBase64) : logoBlackBase64;
    }

    const coverTitleColor = coverTitleColorCustom || (hasCoverBg ? "#ffffff" : primaryColor);
    const coverSubColor = coverSubtitleColorCustom || (hasCoverBg ? "rgba(255,255,255,0.78)" : secondaryColor);
    const coverFootColor = coverFooterColorCustom || (hasCoverBg ? "rgba(255,255,255,0.55)" : "#999999");
    const coverDivColor = coverSubtitleColorCustom || (hasCoverBg ? "rgba(255,255,255,0.35)" : secondaryColor);

    // Determine items per product page according to layout preset
    const itemsPerProductPage =
      productLayoutPreset === "editorial-duo"
        ? 2
        : productLayoutPreset === "commercial-grid"
        ? 4
        : productLayoutPreset === "executive-table"
        ? 12
        : 1;

    // 8. Generate optional Index (Sumário) and product pages HTML
    const ITEMS_PER_INDEX_PAGE = 22;
    const indexPagesCount = includeIndex
      ? Math.max(1, Math.ceil(products.length / ITEMS_PER_INDEX_PAGE))
      : 0;

    let indexPagesHtml = "";
    if (includeIndex) {
      for (let pageIdx = 0; pageIdx < indexPagesCount; pageIdx++) {
        const slice = products.slice(
          pageIdx * ITEMS_PER_INDEX_PAGE,
          (pageIdx + 1) * ITEMS_PER_INDEX_PAGE,
        );
        const rowsHtml = slice
          .map((item, itemIdx) => {
            const globalIdx = pageIdx * ITEMS_PER_INDEX_PAGE + itemIdx;
            const targetPage = Math.floor(globalIdx / itemsPerProductPage) + 2 + indexPagesCount;
            const itemEffectivePrice = item.precoPromocional ?? item.precoOriginal;
            const boxTotal = itemEffectivePrice * 6;
            const priceText = !hidePrices
              ? `<span style="color:${productPriceColor};font-weight:700;margin-left:8px;">R$ ${itemEffectivePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>${showProductBoxPrice ? `<span style="color:${productSpecsColor};font-size:9px;margin-left:6px;">(Cx 6: R$ ${boxTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})</span>` : ""}`
              : "";
            const categoryTag = showProductCategoryBadge
              ? `<span style="display:inline-block;padding:1px 6px;border-radius:3px;background:rgba(128,40,45,0.08);color:${productNameColor};font-size:8px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-left:6px;">${escapeHtml(item.categoria || "Tinto")}</span>`
              : "";
            return `
            <a href="#wine-anchor-${escapeHtml(item.id)}" style="display:flex;align-items:baseline;justify-content:space-between;padding:7px 4px;border-bottom:1px dashed rgba(0,0,0,0.14);font-size:11px;text-decoration:none;color:inherit;">
              <div style="min-width:0;padding-right:12px;">
                <span style="font-family:${fontCSS};font-weight:700;color:${productNameColor};font-size:12.5px;">${escapeHtml(item.name)}</span>
                ${categoryTag}
                <span style="color:${productSpecsColor};font-size:9.5px;text-transform:uppercase;letter-spacing:1px;margin-left:8px;">${escapeHtml(item.vinicola)} · ${escapeHtml(item.paisOrigem)} · Safra ${escapeHtml(item.safra)}</span>
              </div>
              <div style="white-space:nowrap;flex-shrink:0;font-size:10.5px;color:${textColor};">
                ${priceText}
                <span style="display:inline-block;min-width:52px;text-align:right;color:${secondaryColor};font-weight:700;">Pág. ${targetPage}</span>
              </div>
            </a>`;
          })
          .join("");

        indexPagesHtml += `
        <div class="prod-page" style="justify-content:flex-start;">
          <div class="prod-top" style="margin-bottom:18px;">
            <h2 class="prod-name" style="color:${productNameColor};font-size:24px;">SUMÁRIO DE RÓTULOS</h2>
            <p class="prod-origin" style="color:${productSpecsColor};font-size:10px;">${products.length} rótulo${products.length === 1 ? "" : "s"} selecionado${products.length === 1 ? "" : "s"}${indexPagesCount > 1 ? ` · Parte ${pageIdx + 1}/${indexPagesCount}` : ""} · Clique no vinho para ir à página</p>
            <div class="prod-line" style="background:${productSpecsColor};"></div>
          </div>
          <div style="width:100%;flex:1;">
            ${rowsHtml}
          </div>
          ${showProductFooter ? `<div class="page-foot">
            <span>${footerText}</span>
            <span>Página ${pageIdx + 2}</span>
          </div>` : ""}
        </div>`;
      }
    }

    let productPagesHtml = "";
    const productImageUrls = await mapWithConcurrency(
      products,
      8,
      (product) => optimizeImageSource(product.imagemUrl, 800, 1200, 78)
    );
    const productPageBackgroundCSS = backgroundImageUrl
      ? `background-image:url('${backgroundImageUrl}');background-size:cover;background-position:center;`
      : `background-color:${backgroundColor};`;

    const buildBadgesRowHtml = (product: (typeof products)[number], align: string = "center") => {
      const parts: string[] = [];
      if (showProductCountryFlag && product.paisOrigem) {
        const flagUrl = getCountryFlagUrl(product.paisOrigem);
        parts.push(
          `<span class="meta-badge"><img src="${escapeHtml(flagUrl)}" alt="" class="flag-icon" />${escapeHtml(product.paisOrigem)}</span>`,
        );
      }
      if (showProductCategoryBadge) {
        parts.push(
          `<span class="meta-badge meta-badge-cat" style="border-color:${secondaryColor};color:${productNameColor};">${escapeHtml(product.categoria || "Tinto")}</span>`,
        );
      }
      if (
        showProductDiscountBadge &&
        !hidePrices &&
        product.precoPromocional &&
        product.precoOriginal > product.precoPromocional
      ) {
        const pct = Math.round((1 - product.precoPromocional / product.precoOriginal) * 100);
        if (pct > 0) {
          parts.push(
            `<span class="meta-badge meta-badge-promo" style="background:${primaryColor};color:#fff;">-${pct}% OFF</span>`,
          );
        }
      }
      if (parts.length === 0) return "";
      const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
      return `<div class="meta-badges-row" style="justify-content:${justify};">${parts.join("")}</div>`;
    };

    if (productLayoutPreset === "editorial-duo") {
      // ── 2 PRODUCTS PER PAGE (EDITORIAL DUO) ──
      const totalDuoPages = Math.ceil(products.length / 2);
      for (let pageIdx = 0; pageIdx < totalDuoPages; pageIdx++) {
        const pageProducts = products.slice(pageIdx * 2, pageIdx * 2 + 2);
        const pageNumber = pageIdx + 2 + indexPagesCount;
        const cardsHtml = pageProducts
          .map((product, localIdx) => {
            const globalIdx = pageIdx * 2 + localIdx;
            const productImageUrl = productImageUrls[globalIdx];
            const effectiveUnit = product.precoPromocional ?? product.precoOriginal;
            const boxValue = effectiveUnit * 6;
            const notasText = escapeHtml(
              product.notasDegustacao ||
                "Vinho de excelente estrutura, aromas harmoniosos e notas marcantes.",
            );
            const discountPct =
              product.precoPromocional && product.precoOriginal > product.precoPromocional
                ? Math.round((1 - product.precoPromocional / product.precoOriginal) * 100)
                : 0;

            return `
            <div id="wine-anchor-${escapeHtml(product.id)}" class="duo-card ${localIdx === 1 ? "duo-card-second" : ""}" style="border-color:${secondaryColor};">
              ${showProductBottle ? `
              <div class="duo-bottle-wrap">
                <img src="${escapeHtml(productImageUrl)}" class="duo-bottle-img" alt="${escapeHtml(product.name)}" />
              </div>` : ""}
              <div class="duo-content">
                ${buildBadgesRowHtml(product, "left")}
                ${showProductName ? `<h3 class="duo-title" style="font-family:${fontCSS};color:${productNameColor};">${escapeHtml(product.name)}</h3>` : ""}
                ${showProductOrigin ? `<p class="duo-origin" style="color:${productSpecsColor};">${escapeHtml(product.vinicola)} · ${escapeHtml(product.paisOrigem)} (${escapeHtml(product.regiao)})</p>` : ""}
                ${showProductDivider ? `<div class="duo-divider" style="background:${secondaryColor};"></div>` : ""}
                ${showProductSpecs ? `
                <div class="spec-grid">
                  <div class="spec-cell"><span class="spec-lbl">UVA / BLEND</span><span class="spec-val" style="color:${textColor};">${escapeHtml(product.uva)}</span></div>
                  <div class="spec-cell"><span class="spec-lbl">SAFRA</span><span class="spec-val" style="color:${textColor};">${escapeHtml(product.safra)}</span></div>
                  <div class="spec-cell"><span class="spec-lbl">TEOR ALC.</span><span class="spec-val" style="color:${textColor};">${product.teorAlcoolico}% vol</span></div>
                </div>` : ""}
                ${showProductDescription ? `<p class="duo-desc" style="color:${productDescColor};">${notasText}</p>` : ""}
                ${showProductPrice ? `
                <div class="duo-price-bar" style="border-top-color:rgba(197,168,128,0.35);">
                  <div>
                    <span class="duo-price-lbl" style="color:${productPriceLabelColor};">PREÇO UNITÁRIO B2B</span>
                    <div class="duo-price-vals">
                      <span class="duo-price-main" style="color:${productPriceColor};">R$ ${effectiveUnit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      ${product.precoPromocional ? `<span class="duo-price-old">R$ ${product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>` : ""}
                      ${showProductDiscountBadge && discountPct > 0 ? `<span class="promo-chip" style="background:${primaryColor};">-${discountPct}%</span>` : ""}
                    </div>
                  </div>
                  <div style="text-align:right;">
                    <span class="duo-price-lbl" style="color:${productPriceInfoColor};">${showProductBoxPrice ? "CAIXA C/ 6 GARRAFAS" : "EMBALAGEM B2B"}</span>
                    <span class="duo-box-total" style="color:${secondaryColor};">${showProductBoxPrice ? `R$ ${boxValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Caixa c/ 6 un."}</span>
                  </div>
                </div>` : ""}
              </div>
            </div>`;
          })
          .join("");

        productPagesHtml += `
        <div class="prod-page" style="justify-content:space-between;">
          <div class="multi-page-header" style="border-bottom-color:${secondaryColor};">
            <span style="font-family:${fontCSS};color:${productNameColor};font-weight:700;font-size:13px;letter-spacing:2px;">${headerTitle}</span>
            <span style="color:${productSpecsColor};font-size:9.5px;letter-spacing:2px;text-transform:uppercase;">${coverSubtitle}</span>
          </div>
          <div class="duo-container">
            ${cardsHtml}
          </div>
          ${showProductFooter ? `<div class="page-foot">
            <span>${footerText}</span>
            <span>Página ${pageNumber}</span>
          </div>` : ""}
        </div>`;
      }
    } else if (productLayoutPreset === "commercial-grid") {
      // ── 4 PRODUCTS PER PAGE (2x2 COMMERCIAL B2B GRID) ──
      const totalGridPages = Math.ceil(products.length / 4);
      for (let pageIdx = 0; pageIdx < totalGridPages; pageIdx++) {
        const pageProducts = products.slice(pageIdx * 4, pageIdx * 4 + 4);
        const pageNumber = pageIdx + 2 + indexPagesCount;
        const cardsHtml = pageProducts
          .map((product, localIdx) => {
            const globalIdx = pageIdx * 4 + localIdx;
            const productImageUrl = productImageUrls[globalIdx];
            const effectiveUnit = product.precoPromocional ?? product.precoOriginal;
            const boxValue = effectiveUnit * 6;
            const notasText = escapeHtml(
              product.notasDegustacao ||
                "Vinho de excelente estrutura, aromas harmoniosos e notas marcantes.",
            );

            return `
            <div id="wine-anchor-${escapeHtml(product.id)}" class="grid4-card" style="border-color:rgba(197,168,128,0.45);">
              <div class="grid4-top" style="border-bottom-color:${secondaryColor};">
                ${buildBadgesRowHtml(product, "center")}
                ${showProductBottle ? `
                <div class="grid4-img-wrap">
                  <img src="${escapeHtml(productImageUrl)}" class="grid4-img" alt="${escapeHtml(product.name)}" />
                </div>` : ""}
              </div>
              <div class="grid4-body">
                ${showProductOrigin ? `<p class="grid4-origin" style="color:${productSpecsColor};">${escapeHtml(product.vinicola)} · ${escapeHtml(product.paisOrigem)}</p>` : ""}
                ${showProductName ? `<h3 class="grid4-title" style="font-family:${fontCSS};color:${productNameColor};">${escapeHtml(product.name)}</h3>` : ""}
                ${showProductSpecs ? `<p class="grid4-specs" style="color:${productSpecsColor};">${escapeHtml(product.uva)} · Safra ${escapeHtml(product.safra)} · ${product.teorAlcoolico}% vol</p>` : ""}
                ${showProductDescription ? `<p class="grid4-desc" style="color:${productDescColor};">${notasText}</p>` : ""}
              </div>
              ${showProductPrice ? `
              <div class="grid4-foot" style="border-top-color:rgba(197,168,128,0.3);">
                <div>
                  <span class="grid4-price-lbl" style="color:${productPriceLabelColor};">Unitário B2B</span>
                  <div style="display:flex;align-items:baseline;gap:6px;">
                    <span class="grid4-price-val" style="color:${productPriceColor};">R$ ${effectiveUnit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    ${product.precoPromocional ? `<span class="grid4-price-old">R$ ${product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>` : ""}
                  </div>
                </div>
                <div style="text-align:right;">
                  <span class="grid4-price-lbl" style="color:${productPriceInfoColor};">Caixa c/ 6</span>
                  <span class="grid4-box-val" style="color:${secondaryColor};">${showProductBoxPrice ? `R$ ${boxValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "6 garrafas"}</span>
                </div>
              </div>` : ""}
            </div>`;
          })
          .join("");

        productPagesHtml += `
        <div class="prod-page" style="justify-content:space-between;">
          <div class="multi-page-header" style="border-bottom-color:${secondaryColor};">
            <span style="font-family:${fontCSS};color:${productNameColor};font-weight:700;font-size:13px;letter-spacing:2px;">${headerTitle}</span>
            <span style="color:${productSpecsColor};font-size:9.5px;letter-spacing:2px;text-transform:uppercase;">${coverSubtitle}</span>
          </div>
          <div class="grid4-container">
            ${cardsHtml}
          </div>
          ${showProductFooter ? `<div class="page-foot">
            <span>${footerText}</span>
            <span>Página ${pageNumber}</span>
          </div>` : ""}
        </div>`;
      }
    } else if (productLayoutPreset === "executive-table") {
      // ── 12 PRODUCTS PER PAGE (EXECUTIVE B2B TABLE) ──
      const totalTablePages = Math.ceil(products.length / 12);
      for (let pageIdx = 0; pageIdx < totalTablePages; pageIdx++) {
        const pageProducts = products.slice(pageIdx * 12, pageIdx * 12 + 12);
        const pageNumber = pageIdx + 2 + indexPagesCount;
        const rowsHtml = pageProducts
          .map((product, localIdx) => {
            const globalIdx = pageIdx * 12 + localIdx;
            const productImageUrl = productImageUrls[globalIdx];
            const effectiveUnit = product.precoPromocional ?? product.precoOriginal;
            const boxValue = effectiveUnit * 6;
            return `
            <tr id="wine-anchor-${escapeHtml(product.id)}" class="exec-tr">
              ${showProductBottle ? `<td class="exec-td exec-td-img"><img src="${escapeHtml(productImageUrl)}" class="exec-thumb" alt="" /></td>` : ""}
              <td class="exec-td">
                <div style="font-family:${fontCSS};font-weight:700;color:${productNameColor};font-size:12px;">${escapeHtml(product.name)}</div>
                <div style="font-size:9.5px;color:${productSpecsColor};">${escapeHtml(product.vinicola)} · ${escapeHtml(product.regiao)}</div>
              </td>
              <td class="exec-td" style="font-size:10px;color:${textColor};">${escapeHtml(product.categoria || "Tinto")}</td>
              <td class="exec-td" style="font-size:10px;color:${textColor};">${escapeHtml(product.paisOrigem)}</td>
              <td class="exec-td" style="font-size:9.5px;color:${textColor};">${escapeHtml(product.uva)}</td>
              <td class="exec-td" style="font-size:10px;font-weight:600;color:${textColor};text-align:center;">${escapeHtml(product.safra)}</td>
              ${showProductPrice ? `
              <td class="exec-td" style="text-align:right;white-space:nowrap;">
                <span style="font-weight:800;color:${productPriceColor};font-size:11.5px;">R$ ${effectiveUnit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                ${product.precoPromocional ? `<div style="font-size:8.5px;color:#999;text-decoration:line-through;">R$ ${product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>` : ""}
              </td>
              <td class="exec-td" style="text-align:right;white-space:nowrap;font-weight:700;color:${secondaryColor};font-size:10.5px;">
                ${showProductBoxPrice ? `R$ ${boxValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "6 un."}
              </td>` : ""}
            </tr>`;
          })
          .join("");

        productPagesHtml += `
        <div class="prod-page" style="justify-content:flex-start;">
          <div class="multi-page-header" style="border-bottom-color:${secondaryColor};margin-bottom:14px;">
            <span style="font-family:${fontCSS};color:${productNameColor};font-weight:700;font-size:14px;letter-spacing:2px;">${headerTitle} — TABELA EXECUTIVA B2B</span>
            <span style="color:${productSpecsColor};font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;">Página ${pageIdx + 1}/${totalTablePages}</span>
          </div>
          <table class="exec-table">
            <thead>
              <tr style="border-bottom:1.5px solid ${secondaryColor};color:${productNameColor};font-size:9px;text-transform:uppercase;letter-spacing:1px;">
                ${showProductBottle ? `<th class="exec-th" style="width:36px;"></th>` : ""}
                <th class="exec-th">Rótulo & Vinícola</th>
                <th class="exec-th">Tipo</th>
                <th class="exec-th">País</th>
                <th class="exec-th">Uva / Blend</th>
                <th class="exec-th" style="text-align:center;">Safra</th>
                ${showProductPrice ? `<th class="exec-th" style="text-align:right;">Unitário B2B</th><th class="exec-th" style="text-align:right;">Caixa c/ 6</th>` : ""}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          ${showProductFooter ? `<div class="page-foot">
            <span>${footerText}</span>
            <span>Página ${pageNumber}</span>
          </div>` : ""}
        </div>`;
      }
    } else {
      // ── 1 PRODUCT PER PAGE (CLASSIC, SIDE-RIGHT, SIDE-LEFT, PRICE-TOP) ──
      products.forEach((product, idx) => {
        const pageNumber = idx + 2 + indexPagesCount;
        const productName = escapeHtml(product.name);
        const productOrigin = escapeHtml(`${product.paisOrigem} · ${product.regiao}`);
        const productSpecs = escapeHtml(
          `${product.vinicola} · ${product.uva} · Safra ${product.safra} · ${product.teorAlcoolico}% vol`,
        );
        const productImageUrl = productImageUrls[idx];
        const effectiveUnit = product.precoPromocional ?? product.precoOriginal;
        const boxTotalValue = effectiveUnit * 6;
        let priceHtml: string;
        if (product.precoPromocional) {
          priceHtml = `
            <span class="price-val" style="color:${productPriceColor}; font-size:${productPriceValueFontSize}px;">R$ ${product.precoPromocional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            <span class="price-old" style="font-size:${Math.round(productPriceValueFontSize * 0.55)}px;">R$ ${product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>`;
        } else {
          priceHtml = `<span class="price-val" style="color:${productPriceColor}; font-size:${productPriceValueFontSize}px;">R$ ${product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>`;
        }

        const notasText = escapeHtml(
          product.notasDegustacao || "Vinho de excelente estrutura, aromas harmoniosos e notas marcantes.",
        );

        const priceAlignCSS = productPriceSide === "left" ? "right" : productPriceSide === "center" ? "center" : "left";
        const productPriceBaseTop = productLayoutPreset === "price-top" ? 18 : 45;
        const boxInfoText = showProductBoxPrice
          ? `Caixa c/ 6: R$ ${boxTotalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
          : "Caixa c/ 6 garrafas";

        // Price block HTML (position absolute full-canvas autonomy)
        const priceBadgeHtml = showProductPrice ? `
        <div class="prod-price-badge-free" style="position:absolute; left:calc(50% + ${productPriceXOffset}px); top:calc(${productPriceBaseTop}% + ${productPriceYOffset}px); transform:translate(-50%, -50%) rotate(${productPriceAngle}deg); text-align:${priceAlignCSS}; z-index:20;">
          <p class="prod-price-label" style="color:${productPriceLabelColor}; font-size:${productPriceLabelFontSize}px;">Preço Unitário B2B</p>
          <p class="prod-price-info" style="color:${productPriceInfoColor}; font-size:${productPriceInfoFontSize}px;">${boxInfoText}</p>
          <div class="prod-price-row ${priceAlignCSS === 'center' ? 'flex-center' : priceAlignCSS === 'right' ? 'flex-end' : 'flex-start'}">${priceHtml}</div>
        </div>` : "";

        const badgesHtml = buildBadgesRowHtml(product, "center");

        if (productLayoutPreset === "side-right" || productLayoutPreset === "side-left") {
          const isReverse = productLayoutPreset === "side-left";
          productPagesHtml += `
          <div id="wine-anchor-${escapeHtml(product.id)}" class="prod-page">
            <div class="prod-top" style="transform: translate(${productNameXOffset}px, ${productNameYOffset}px);">
              ${badgesHtml}
              ${showProductName ? `<h2 class="prod-name" style="color:${productNameColor}; font-size:${productNameFontSize}px;">${productName}</h2>` : ""}
              ${showProductOrigin ? `<p class="prod-origin" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px; transform: translateY(${productOriginYOffset}px);">${productOrigin}</p>` : ""}
              ${showProductDivider ? `<div class="prod-line" style="background:${productSpecsColor};"></div>` : ""}
            </div>

            <div class="prod-body-side ${isReverse ? 'side-reverse' : ''}">
              ${showProductBottle ? `<div class="side-col-bottle" style="transform: translate(${productImgXOffset}px, ${productImgYOffset}px) rotate(${productImgAngle}deg);">
                <img src="${escapeHtml(productImageUrl)}" class="prod-img-side" style="max-height: min(${productImgHeight}px, 100%);" />
              </div>` : ""}

              <div class="side-col-content"${showProductBottle ? "" : ' style="flex:1 1 100%;"'}>
                <!-- Specs & Tasting Notes in side column -->
                <div class="prod-desc-block" style="transform: translate(${productDescXOffset}px, ${productDescYOffset}px) rotate(${productDescAngle}deg); text-align: ${productDescAlign}; max-width:${productTextMaxWidth}px;">
                  ${showProductSpecs ? `<p class="prod-specs" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px; margin-bottom: 8px;">${productSpecs}</p>` : ""}
                  ${showProductDescription ? `<p class="prod-desc" style="color:${productDescColor}; font-size:${productDescFontSize}px;">${notasText}</p>` : ""}
                </div>
              </div>
            </div>

            <!-- Fully Autonomous Price Element -->
            ${priceBadgeHtml}

            ${showProductFooter ? `<div class="page-foot">
              <span>${footerText}</span>
              <span>Página ${pageNumber}</span>
            </div>` : ""}
          </div>`;
        } else {
          // CLASSIC & PRICE-TOP LAYOUTS
          productPagesHtml += `
          <div id="wine-anchor-${escapeHtml(product.id)}" class="prod-page">
            <div class="prod-top" style="transform: translate(${productNameXOffset}px, ${productNameYOffset}px);">
              ${badgesHtml}
              ${showProductName ? `<h2 class="prod-name" style="color:${productNameColor}; font-size:${productNameFontSize}px;">${productName}</h2>` : ""}
              ${showProductOrigin ? `<p class="prod-origin" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px; transform: translateY(${productOriginYOffset}px);">${productOrigin}</p>` : ""}
              ${showProductDivider ? `<div class="prod-line" style="background:${productSpecsColor};"></div>` : ""}
            </div>

            <div class="prod-middle">
              ${showProductBottle ? `<div class="prod-img-area" style="transform: translate(${productImgXOffset}px, ${productImgYOffset}px) rotate(${productImgAngle}deg);">
                <img src="${escapeHtml(productImageUrl)}" class="prod-img" style="max-height: min(${productImgHeight}px, 100%); max-width:${productImgMaxWidth}px;" />
              </div>` : ""}
            </div>

            <div class="prod-bottom" style="transform: translate(${productDescXOffset}px, ${productDescYOffset}px) rotate(${productDescAngle}deg); text-align: ${productDescAlign};">
              ${showProductSpecs ? `<p class="prod-specs" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px;">${productSpecs}</p>` : ""}
              ${showProductDescription ? `<p class="prod-desc" style="color:${productDescColor}; font-size:${productDescFontSize}px;">${notasText}</p>` : ""}
            </div>

            <!-- Fully Autonomous Price Element -->
            ${priceBadgeHtml}

            ${showProductFooter ? `<div class="page-foot">
              <span>${footerText}</span>
              <span>Página ${pageNumber}</span>
            </div>` : ""}
          </div>`;
        }
      });
    }

    // 9. Assemble full HTML document
    const coverBgCSS = hasCoverBg
      ? `background-image:url('${coverImageUrl}');background-size:cover;background-position:center;`
      : `background-color:${backgroundColor};`;

    const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${headerTitle}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700;800&display=swap');

@page{size:A4;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter','Helvetica Neue',sans-serif;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
img{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}

/* ── COVER ────────────────────────────── */
.cover{
  width:210mm;height:297mm;
  position:relative;
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  overflow:hidden;
  page-break-after:always;
}
.cover-dim{
  position:absolute;inset:0;z-index:1;
  background:linear-gradient(180deg,rgba(0,0,0,.32) 0%,rgba(0,0,0,.08) 38%,rgba(0,0,0,.42) 100%);
}
.cover-inner{
  position:relative;z-index:2;
  text-align:center;padding:60px 50px;
  transform: translateY(${coverVerticalOffset}px);
}
.cover-logo{
  height:${coverLogoHeight}px;width:auto;margin-bottom:35px;
  transform: translate(${coverLogoXOffset}px, ${coverLogoYOffset}px) rotate(${coverLogoAngle}deg);
  transition: transform 0.2s ease;
}
.cover-line{
  width:70px;height:1.5px;margin:0 auto 28px;
  background:${coverDivColor};
}
.cover-h1{
  font-family:${fontCSS};
  font-size:${coverTitleFontSize}px;font-weight:700;
  color:${coverTitleColor};
  letter-spacing:4px;text-transform:uppercase;
  margin-bottom:14px;
  transform: translate(${coverTitleXOffset}px, ${coverTitleYOffset}px) rotate(${coverTitleAngle}deg);
  ${hasCoverBg ? "text-shadow:0 2px 12px rgba(0,0,0,.25);" : ""}
}
.cover-sub{
  font-size:${coverSubtitleFontSize}px;font-weight:500;
  color:${coverSubColor};
  letter-spacing:6px;text-transform:uppercase;
  transform: translate(${coverSubtitleXOffset}px, ${coverSubtitleYOffset}px) rotate(${coverSubtitleAngle}deg);
}
.cover-foot{
  position:absolute;bottom:38px;left:0;right:0;
  text-align:center;z-index:2;
  font-size:${coverFooterFontSize}px;color:${coverFootColor};letter-spacing:1px;
  transform: translate(${coverFooterXOffset}px, ${coverFooterYOffset}px);
}
.cover-brd{
  position:absolute;left:35px;right:35px;
  height:1px;background:${secondaryColor};opacity:.3;z-index:2;
}
.cover-brd-t{top:35px}
.cover-brd-b{bottom:75px}

/* ── PRODUCT PAGE (Flexible A4 layout with Presets) ── */
.prod-page{
  width:210mm;height:297mm;
  ${productPageBackgroundCSS}
  padding:${productPagePadding}px 45px 38px;
  display:flex;flex-direction:column;
  align-items:center;justify-content:space-between;
  position:relative;
  overflow:hidden;
  page-break-after:always;
}
.prod-top{
  text-align:center;width:100%;padding-top:2px;
  flex-shrink:0;
  z-index:2;
  transition: transform 0.15s ease;
}
.prod-name{
  font-family:${fontCSS};
  font-weight:700;
  letter-spacing:1px;margin-bottom:4px;
  line-height:1.2;
}
.prod-origin{
  text-transform:uppercase;letter-spacing:3px;font-weight:600;
  transition: transform 0.15s ease;
}
.prod-line{
  width:50px;height:1.5px;
  margin:8px auto;
}

/* Badges Row (Country Flag, Category, Discount) */
.meta-badges-row{
  display:flex;align-items:center;gap:6px;flex-wrap:wrap;
  margin-bottom:6px;
}
.meta-badge{
  display:inline-flex;align-items:center;gap:4px;
  padding:2px 8px;border-radius:999px;
  font-size:8.5px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;
  background:rgba(255,255,255,0.86);
  border:1px solid rgba(197,168,128,0.45);
  color:${textColor};
}
.flag-icon{
  width:13px;height:9px;object-fit:cover;border-radius:1.5px;
}

/* Classic Layout Middle Container */
.prod-middle{
  flex:1 1 0%;
  width:100%;
  display:flex;align-items:center;justify-content:center;
  position:relative;
  padding:4px 0;
  min-height:0;
  overflow:visible;
}
.prod-img-area{
  display:flex;align-items:center;justify-content:center;
  height:100%;max-height:100%;
  transition: transform 0.15s ease;
}
.prod-img{
  height:auto;
  max-width:${productImgMaxWidth}px;
  object-fit:contain;
  filter:drop-shadow(0 10px 30px rgba(0,0,0,.14));
}

/* Side-by-Side Magazine Layout */
.prod-body-side{
  flex:1 1 0%;
  width:100%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:24px;
  min-height:0;
  overflow:visible;
  padding:10px 0;
}
.prod-body-side.side-reverse{
  flex-direction:row-reverse;
}
.side-col-bottle{
  flex:1 1 45%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:center;
  transition: transform 0.15s ease;
}
.prod-img-side{
  max-height:100%;
  max-width:100%;
  object-fit:contain;
  filter:drop-shadow(0 10px 30px rgba(0,0,0,.14));
}
.side-col-content{
  flex:1 1 55%;
  display:flex;
  flex-direction:column;
  justify-content:center;
  gap:18px;
}

/* Fully Autonomous Free Price Element */
.prod-price-badge-free{
  position:absolute !important;
  background:transparent !important;
  border:none !important;
  box-shadow:none !important;
  padding:0 !important;
  white-space:nowrap;
  z-index:20;
  transition: transform 0.15s ease;
}
.prod-price-label{
  text-transform:uppercase;
  letter-spacing:2px;font-weight:700;margin-bottom:2px;
}
.prod-price-info{
  font-weight:600;margin-bottom:4px;
}
.prod-price-row{
  display:flex;align-items:baseline;
  gap:10px;
}
.prod-price-row.flex-center{
  justify-content:center;
}
.prod-price-row.flex-end{
  justify-content:flex-end;
}
.prod-price-row.flex-start{
  justify-content:flex-start;
}
.price-val{
  font-weight:800;
}
.price-old{
  color:#bbb;text-decoration:line-through;
}
.prod-bottom{
  text-align:center;width:100%;
  max-width:${productTextMaxWidth}px;
  flex-shrink:0;
  margin-top:auto;
  margin-bottom:8px;
  z-index:2;
  transition: transform 0.15s ease;
}
.prod-specs{
  text-transform:uppercase;letter-spacing:1.5px;
  margin-bottom:6px;
  line-height:1.35;
}
.prod-desc{
  line-height:1.6;font-weight:400;
  margin-bottom:8px;
  word-wrap:break-word;
}

/* ── MULTI-PRODUCT PAGE HEADER ── */
.multi-page-header{
  width:100%;
  display:flex;align-items:baseline;justify-content:space-between;
  border-bottom:1px solid ${secondaryColor};
  padding-bottom:8px;
  margin-bottom:14px;
  flex-shrink:0;
}

/* ── EDITORIAL DUO (2 PER PAGE) ── */
.duo-container{
  flex:1;width:100%;
  display:flex;flex-direction:column;
  justify-content:space-between;
  gap:18px;
  padding-bottom:18px;
}
.duo-card{
  flex:1;
  display:flex;align-items:center;gap:24px;
  background:rgba(255,255,255,0.88);
  border:1px solid rgba(197,168,128,0.45);
  border-radius:8px;
  padding:20px 24px;
  box-shadow:0 4px 18px rgba(0,0,0,0.04);
}
.duo-bottle-wrap{
  width:135px;height:360px;
  flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
}
.duo-bottle-img{
  max-width:100%;max-height:100%;object-fit:contain;
  filter:drop-shadow(0 8px 18px rgba(0,0,0,0.14));
}
.duo-content{
  flex:1;min-width:0;
  display:flex;flex-direction:column;justify-content:center;
}
.duo-title{
  font-size:21px;font-weight:700;line-height:1.2;margin-bottom:3px;
}
.duo-origin{
  font-size:10px;text-transform:uppercase;letter-spacing:2px;font-weight:600;margin-bottom:8px;
}
.duo-divider{
  width:42px;height:1.5px;margin-bottom:10px;
}
.spec-grid{
  display:grid;grid-template-columns:repeat(3,1fr);gap:8px;
  background:rgba(246,243,242,0.85);
  border:1px solid rgba(197,168,128,0.25);
  border-radius:5px;padding:7px 10px;margin-bottom:10px;
}
.spec-cell{display:flex;flex-direction:column;}
.spec-lbl{font-size:7.5px;font-weight:700;letter-spacing:1.2px;color:#877272;text-transform:uppercase;}
.spec-val{font-size:10px;font-weight:600;margin-top:1px;}
.duo-desc{
  font-size:11.5px;line-height:1.55;margin-bottom:12px;
  display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;
}
.duo-price-bar{
  margin-top:auto;padding-top:10px;border-top:1px solid rgba(197,168,128,0.35);
  display:flex;align-items:flex-end;justify-content:space-between;
}
.duo-price-lbl{display:block;font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:2px;}
.duo-price-vals{display:flex;align-items:baseline;gap:8px;}
.duo-price-main{font-size:20px;font-weight:800;}
.duo-price-old{font-size:11px;color:#aaa;text-decoration:line-through;}
.promo-chip{font-size:8.5px;font-weight:800;color:#fff;padding:2px 6px;border-radius:4px;}
.duo-box-total{font-size:13px;font-weight:800;}

/* ── COMMERCIAL GRID (4 PER PAGE) ── */
.grid4-container{
  flex:1;width:100%;
  display:grid;grid-template-columns:repeat(2,1fr);grid-template-rows:repeat(2,1fr);
  gap:16px;padding-bottom:18px;
}
.grid4-card{
  background:rgba(255,255,255,0.92);
  border:1px solid rgba(197,168,128,0.45);
  border-radius:8px;
  padding:14px 16px;
  display:flex;flex-direction:column;justify-content:space-between;
  box-shadow:0 3px 14px rgba(0,0,0,0.03);
}
.grid4-top{
  border-bottom:1px solid ${secondaryColor};
  padding-bottom:8px;margin-bottom:8px;
  display:flex;flex-direction:column;align-items:center;
}
.grid4-img-wrap{
  height:165px;width:100%;
  display:flex;align-items:center;justify-content:center;
}
.grid4-img{
  max-height:100%;max-width:100%;object-fit:contain;
  filter:drop-shadow(0 6px 14px rgba(0,0,0,0.12));
}
.grid4-body{flex:1;display:flex;flex-direction:column;}
.grid4-origin{font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:2px;}
.grid4-title{font-size:14.5px;font-weight:700;line-height:1.2;margin-bottom:3px;}
.grid4-specs{font-size:9px;font-weight:600;margin-bottom:6px;}
.grid4-desc{
  font-size:9.5px;line-height:1.45;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;
}
.grid4-foot{
  margin-top:8px;padding-top:8px;border-top:1px solid rgba(197,168,128,0.3);
  display:flex;align-items:flex-end;justify-content:space-between;
}
.grid4-price-lbl{display:block;font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;}
.grid4-price-val{font-size:15px;font-weight:800;}
.grid4-price-old{font-size:9.5px;color:#aaa;text-decoration:line-through;}
.grid4-box-val{font-size:11px;font-weight:800;}

/* ── EXECUTIVE B2B TABLE (12 PER PAGE) ── */
.exec-table{
  width:100%;border-collapse:collapse;
  background:rgba(255,255,255,0.92);
  border-radius:6px;overflow:hidden;
}
.exec-th{
  text-align:left;padding:8px 8px;font-weight:800;
}
.exec-tr{
  border-bottom:1px solid rgba(197,168,128,0.25);
}
.exec-td{
  padding:7px 8px;vertical-align:middle;
}
.exec-td-img{
  width:36px;text-align:center;
}
.exec-thumb{
  height:48px;width:24px;object-fit:contain;
}

.page-foot{
  position:absolute;bottom:14px;left:45px;right:45px;
  border-top:1px solid #eee;padding-top:4px;
  display:flex;justify-content:space-between;
  font-size:8px;color:#bbb;letter-spacing:.5px;
}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover" style="${coverBgCSS}">
  ${hasCoverBg ? '<div class="cover-dim"></div>' : showCoverDivider ? '<div class="cover-brd cover-brd-t"></div><div class="cover-brd cover-brd-b"></div>' : ''}
  <div class="cover-inner">
    ${showCoverLogo && selectedLogoBase64 ? `<img src="${selectedLogoBase64}" class="cover-logo"/>` : ""}
    ${showCoverDivider ? '<div class="cover-line"></div>' : ''}
    ${showCoverTitle ? `<h1 class="cover-h1">${headerTitle}</h1>` : ""}
    ${showCoverSubtitle ? `<p class="cover-sub">${coverSubtitle}</p>` : ""}
  </div>
  ${showCoverFooter ? `<div class="cover-foot">${footerText}</div>` : ""}
</div>

<!-- INDEX / SUMMARY -->
${indexPagesHtml}

<!-- PRODUCTS -->
${productPagesHtml}

</body>
</html>`;

    // 10. Launch Puppeteer (Vercel serverless or local)
    const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
    const browserlessPdfEndpoint = resolveBrowserlessPdfEndpoint(
      process.env.BROWSERLESS_CONNECT_URL
    );

    if (browserlessPdfEndpoint) {
      const abortController = new AbortController();
      const abortTimeout = setTimeout(() => abortController.abort(), 50_000);
      const requestBody = JSON.stringify({
        html: fullHtml,
        options: {
          format: "A4",
          printBackground: true,
          margin: { top: "0", bottom: "0", left: "0", right: "0" },
        },
      });
      const requestSize = Buffer.byteLength(requestBody);

      if (requestSize > 10 * 1024 * 1024) {
        console.error(
          `Catálogo otimizado ainda excede o limite do Browserless: ${requestSize} bytes.`
        );
        return NextResponse.json(
          { error: "As imagens do catálogo excedem o limite para geração do PDF." },
          { status: 413 }
        );
      }

      console.info(`Payload do PDF otimizado: ${requestSize} bytes.`);

      try {
        const response = await fetch(browserlessPdfEndpoint, {
          method: "POST",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
          body: requestBody,
          cache: "no-store",
          signal: abortController.signal,
        });

        if (!response.ok) {
          const details = (await response.text()).slice(0, 500);
          console.error(
            `Browserless PDF API respondeu ${response.status}: ${details}`
          );
          return NextResponse.json(
            { error: "O serviço de geração de PDF não respondeu corretamente." },
            { status: 502 }
          );
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("application/pdf")) {
          console.error(
            `Browserless PDF API retornou conteúdo inesperado: ${contentType}`
          );
          return NextResponse.json(
            { error: "O serviço de geração retornou um arquivo inválido." },
            { status: 502 }
          );
        }

        const pdfBuffer = await response.arrayBuffer();
        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="catalogo-allvino.pdf"',
          },
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.error("Browserless PDF API excedeu o limite de 50 segundos.");
          return NextResponse.json(
            { error: "O serviço de geração de PDF excedeu o tempo limite." },
            { status: 504 }
          );
        }
        throw error;
      } finally {
        clearTimeout(abortTimeout);
      }
    }

    if (isVercel) {
      // Vercel serverless: use @sparticuz/chromium
      chromium.setGraphicsMode = false;
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: {
          deviceScaleFactor: 1,
          hasTouch: false,
          height: 1080,
          isLandscape: false,
          isMobile: false,
          width: 1920,
        },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      // Local development: try common Chrome paths
      const possiblePaths = [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        "/usr/bin/google-chrome",
        "/usr/bin/chromium-browser",
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      ];
      let localChromePath = "";
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          localChromePath = p;
          break;
        }
      }
      if (!localChromePath) {
        return NextResponse.json(
          { error: "Chrome não encontrado. Instale o Google Chrome para gerar PDFs localmente." },
          { status: 500 }
        );
      }
      browser = await puppeteerCore.launch({
        headless: true,
        executablePath: localChromePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "domcontentloaded", timeout: 15000 });

    // Wait for Google Fonts to load with a max 2-second timeout to prevent serverless function hangs
    try {
      await Promise.race([
        page.evaluateHandle('document.fonts.ready'),
        new Promise((resolve) => setTimeout(resolve, 2000))
      ]);
    } catch (e) {
      console.warn("Timeout ao carregar fontes do Google:", e);
    }

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    await browser.close();

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="catalogo-allvino.pdf"',
      },
    });
  } catch (error: any) {
    console.error("Erro na geração do PDF:", error);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Erro ao fechar o navegador Puppeteer:", closeError);
      }
    }
    return NextResponse.json(
      { error: "Erro interno do servidor ao gerar o PDF." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;

  try {
    const parsedPayload: unknown = await request.json();
    if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) {
      throw new Error("Invalid payload");
    }
    payload = parsedPayload as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Os dados da exportação são inválidos." },
      { status: 400 },
    );
  }

  const forwardedUrl = new URL(request.url);
  const searchParams = new URLSearchParams();

  if (Object.prototype.hasOwnProperty.call(payload, "selectedProductIds")) {
    searchParams.set(
      "ids",
      parseCatalogProductIds(payload.selectedProductIds).join(","),
    );
  }

  if (typeof payload.limit === "number" && Number.isInteger(payload.limit) && payload.limit > 0) {
    searchParams.set("limit", String(Math.min(payload.limit, 200)));
  }

  if (typeof payload.templateId === "string" && payload.templateId.trim()) {
    searchParams.set("templateId", payload.templateId.trim());
  }

  searchParams.set(
    "sorts",
    serializeCatalogSortRules(normalizeCatalogSortRules(payload.sortRules)),
  );

  if (payload.hidePrices === true) {
    searchParams.set("hidePrices", "1");
  }
  if (payload.includeIndex === true) {
    searchParams.set("includeIndex", "1");
  }

  if (payload.filters && typeof payload.filters === "object" && !Array.isArray(payload.filters)) {
    const filters = payload.filters as Record<string, unknown>;
    const allowedFilters = ["search", "grape", "country", "winery", "category"];

    for (const filterName of allowedFilters) {
      const value = filters[filterName];
      if (typeof value === "string" && value.trim()) {
        searchParams.set(filterName, value.trim().slice(0, 160));
      }
    }
  }

  const previewStylesOverride =
    payload.previewStyles &&
    typeof payload.previewStyles === "object" &&
    !Array.isArray(payload.previewStyles)
      ? (payload.previewStyles as Record<string, unknown>)
      : undefined;

  forwardedUrl.search = searchParams.toString();
  return generateCatalogPdfResponse(
    new Request(forwardedUrl, { headers: request.headers }),
    previewStylesOverride,
  );
}
