import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { resolveBrowserlessPdfEndpoint } from "@/lib/browserless";

const clamp = (val: any, min: number = -350, max: number = 350): number => {
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

    return `data:image/webp;base64,${output.toString("base64")}`;
  } catch (error) {
    console.warn("Não foi possível otimizar uma imagem do catálogo:", error);
    return source;
  }
};

const safeCssValue = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim();
  return /^[#a-z0-9(),.%\s-]+$/i.test(normalized) ? normalized : fallback;
};

// Vercel serverless config: extend timeout for PDF generation
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET() {
  let browser;
  try {
    // 1. Fetch active template
    const activeTemplate = await prisma.template.findFirst({
      where: { isActive: true },
    });

    if (!activeTemplate) {
      return NextResponse.json(
        { error: "Nenhum template ativo foi configurado no painel administrativo." },
        { status: 400 }
      );
    }

    // 2. Fetch active wines
    const products = await prisma.product.findMany({
      where: { status: true },
      orderBy: { name: "asc" },
    });

    if (products.length === 0) {
      return NextResponse.json(
        { error: "Não há vinhos ativos no catálogo para exportar." },
        { status: 400 }
      );
    }

    // 3. Parse template styles
    let styles: any;
    try {
      styles = JSON.parse(activeTemplate.cssStyles);
    } catch {
      return NextResponse.json(
        { error: "Erro nas definições de estilo do template." },
        { status: 500 }
      );
    }

    // 4. Read logos (black and white variants) and convert to base64
    let logoBlackBase64 = "";
    let logoWhiteBase64 = "";
    try {
      const blackPath = path.join(process.cwd(), "public", "logo-black.png");
      if (fs.existsSync(blackPath)) {
        logoBlackBase64 = `data:image/png;base64,${fs.readFileSync(blackPath).toString("base64")}`;
      } else {
        const defaultPath = path.join(process.cwd(), "public", "logo.png");
        logoBlackBase64 = `data:image/png;base64,${fs.readFileSync(defaultPath).toString("base64")}`;
      }
    } catch {
      console.warn("Logo preta não encontrada em /public/logo-black.png");
    }

    try {
      const whitePath = path.join(process.cwd(), "public", "logo-white.png");
      if (fs.existsSync(whitePath)) {
        logoWhiteBase64 = `data:image/png;base64,${fs.readFileSync(whitePath).toString("base64")}`;
      }
    } catch {
      console.warn("Logo branca não encontrada em /public/logo-white.png");
    }

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
    const coverFooterYOffset = clamp(styles.coverFooterYOffset);
    const coverVerticalOffset = clamp(styles.coverVerticalOffset);

    // ── LAYOUT PRESET & ALIGNMENTS ──
    const productLayoutPreset = ["classic", "side-right", "side-left", "price-top"].includes(styles.productLayoutPreset)
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

    // 8. Generate product pages HTML
    let productPagesHtml = "";
    const productImageUrls = await Promise.all(
      products.map((product) =>
        optimizeImageSource(product.imagemUrl, 800, 1200, 78)
      )
    );
    const productPageBackgroundCSS = backgroundImageUrl
      ? `background-image:url('${backgroundImageUrl}');background-size:cover;background-position:center;`
      : `background-color:${backgroundColor};`;

    products.forEach((product, idx) => {
      const productName = escapeHtml(product.name);
      const productOrigin = escapeHtml(`${product.paisOrigem} · ${product.regiao}`);
      const productSpecs = escapeHtml(
        `${product.vinicola} · ${product.uva} · Safra ${product.safra} · ${product.teorAlcoolico}% vol`,
      );
      const productImageUrl = productImageUrls[idx];
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

      // Price block HTML (position absolute full-canvas autonomy)
      const priceBadgeHtml = `
      <div class="prod-price-badge-free" style="position:absolute; left:calc(50% + ${productPriceXOffset}px); top:calc(45% + ${productPriceYOffset}px); transform:translate(-50%, -50%) rotate(${productPriceAngle}deg); text-align:${priceAlignCSS}; z-index:20;">
        <p class="prod-price-label" style="color:${productPriceLabelColor}; font-size:${productPriceLabelFontSize}px;">Preço Unitário B2B</p>
        <p class="prod-price-info" style="color:${productPriceInfoColor}; font-size:${productPriceInfoFontSize}px;">Caixa c/ 6 garrafas</p>
        <div class="prod-price-row ${priceAlignCSS === 'center' ? 'flex-center' : priceAlignCSS === 'right' ? 'flex-end' : 'flex-start'}">${priceHtml}</div>
      </div>`;

      if (productLayoutPreset === "side-right" || productLayoutPreset === "side-left") {
        const isReverse = productLayoutPreset === "side-left";
        productPagesHtml += `
        <div class="prod-page">
          <div class="prod-top" style="transform: translate(${productNameXOffset}px, ${productNameYOffset}px);">
            <h2 class="prod-name" style="color:${productNameColor}; font-size:${productNameFontSize}px;">${productName}</h2>
            <p class="prod-origin" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px; transform: translateY(${productOriginYOffset}px);">${productOrigin}</p>
            <div class="prod-line" style="background:${productSpecsColor};"></div>
          </div>

          <div class="prod-body-side ${isReverse ? 'side-reverse' : ''}">
            <div class="side-col-bottle" style="transform: translate(${productImgXOffset}px, ${productImgYOffset}px) rotate(${productImgAngle}deg);">
              <img src="${escapeHtml(productImageUrl)}" class="prod-img-side" style="max-height: min(${productImgHeight}px, 100%);" />
            </div>

            <div class="side-col-content">
              <!-- Specs & Tasting Notes in side column -->
              <div class="prod-desc-block" style="transform: translate(${productDescXOffset}px, ${productDescYOffset}px) rotate(${productDescAngle}deg); text-align: ${productDescAlign}; max-width:${productTextMaxWidth}px;">
                <p class="prod-specs" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px; margin-bottom: 8px;">${productSpecs}</p>
                <p class="prod-desc" style="color:${productDescColor}; font-size:${productDescFontSize}px;">${notasText}</p>
              </div>
            </div>
          </div>

          <!-- Fully Autonomous Price Element -->
          ${priceBadgeHtml}

          <div class="page-foot">
            <span>${footerText}</span>
            <span>Página ${idx + 2}</span>
          </div>
        </div>`;
      } else {
        // CLASSIC & PRICE-TOP LAYOUTS
        productPagesHtml += `
        <div class="prod-page">
          <div class="prod-top" style="transform: translate(${productNameXOffset}px, ${productNameYOffset}px);">
            <h2 class="prod-name" style="color:${productNameColor}; font-size:${productNameFontSize}px;">${productName}</h2>
            <p class="prod-origin" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px; transform: translateY(${productOriginYOffset}px);">${productOrigin}</p>
            <div class="prod-line" style="background:${productSpecsColor};"></div>
          </div>

          <div class="prod-middle">
            <div class="prod-img-area" style="transform: translate(${productImgXOffset}px, ${productImgYOffset}px) rotate(${productImgAngle}deg);">
              <img src="${escapeHtml(productImageUrl)}" class="prod-img" style="max-height: min(${productImgHeight}px, 100%); max-width:${productImgMaxWidth}px;" />
            </div>
          </div>

          <div class="prod-bottom" style="transform: translate(${productDescXOffset}px, ${productDescYOffset}px) rotate(${productDescAngle}deg); text-align: ${productDescAlign};">
            <p class="prod-specs" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px;">${productSpecs}</p>
            <p class="prod-desc" style="color:${productDescColor}; font-size:${productDescFontSize}px;">${notasText}</p>
          </div>

          <!-- Fully Autonomous Price Element -->
          ${priceBadgeHtml}

          <div class="page-foot">
            <span>${footerText}</span>
            <span>Página ${idx + 2}</span>
          </div>
        </div>`;
      }
    });

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
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700&family=Cinzel:wght@400;600;700&display=swap');

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
  transform: translateY(${coverFooterYOffset}px);
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
  ${hasCoverBg ? '<div class="cover-dim"></div>' : '<div class="cover-brd cover-brd-t"></div><div class="cover-brd cover-brd-b"></div>'}
  <div class="cover-inner">
    ${selectedLogoBase64 ? `<img src="${selectedLogoBase64}" class="cover-logo"/>` : ""}
    <div class="cover-line"></div>
    <h1 class="cover-h1">${headerTitle}</h1>
    <p class="cover-sub">${coverSubtitle}</p>
  </div>
  <div class="cover-foot">${footerText}</div>
</div>

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
