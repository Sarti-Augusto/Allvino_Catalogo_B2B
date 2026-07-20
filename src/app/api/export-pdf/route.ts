import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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
    } catch (e) {
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
    } catch (e) {
      console.warn("Logo preta não encontrada em /public/logo-black.png");
    }

    try {
      const whitePath = path.join(process.cwd(), "public", "logo-white.png");
      if (fs.existsSync(whitePath)) {
        logoWhiteBase64 = `data:image/png;base64,${fs.readFileSync(whitePath).toString("base64")}`;
      }
    } catch (e) {
      console.warn("Logo branca não encontrada em /public/logo-white.png");
    }

    // 5. Extract style variables with defaults
    const primaryColor = styles.primaryColor || "#80282d";
    const secondaryColor = styles.secondaryColor || "#c5a880";
    const backgroundColor = styles.backgroundColor || "#ffffff";
    const textColor = styles.textColor || "#1f2937";
    const fontFamily = styles.fontFamily || "Playfair Display";
    const headerTitle = styles.headerTitle || "ALLVINO";
    const footerText = styles.footerText || "Allvino Importadora de Vinhos B2B";
    const coverImageUrl = styles.coverImageUrl || "";
    const backgroundImageUrl = styles.backgroundImageUrl || "";

    // ── COVER DYNAMIC TUNING ────────────────────────
    const coverSubtitle = styles.coverSubtitle || "Catálogo Exclusivo B2B";
    const coverLogoHeight = typeof styles.coverLogoHeight === "number" ? styles.coverLogoHeight : 110;
    const coverLogoAngle = typeof styles.coverLogoAngle === "number" ? styles.coverLogoAngle : 0;
    const coverLogoXOffset = typeof styles.coverLogoXOffset === "number" ? styles.coverLogoXOffset : 0;
    const coverLogoYOffset = typeof styles.coverLogoYOffset === "number" ? styles.coverLogoYOffset : 0;
    const coverLogoVariant = styles.coverLogoVariant || "auto"; // "auto" | "black" | "white"
    
    const coverTitleColorCustom = styles.coverTitleColor || "";
    const coverTitleFontSize = typeof styles.coverTitleFontSize === "number" ? styles.coverTitleFontSize : 30;
    const coverTitleAngle = typeof styles.coverTitleAngle === "number" ? styles.coverTitleAngle : 0;
    const coverTitleXOffset = typeof styles.coverTitleXOffset === "number" ? styles.coverTitleXOffset : 0;
    const coverTitleYOffset = typeof styles.coverTitleYOffset === "number" ? styles.coverTitleYOffset : 0;
    
    const coverSubtitleColorCustom = styles.coverSubtitleColor || "";
    const coverSubtitleFontSize = typeof styles.coverSubtitleFontSize === "number" ? styles.coverSubtitleFontSize : 11;
    const coverSubtitleAngle = typeof styles.coverSubtitleAngle === "number" ? styles.coverSubtitleAngle : 0;
    const coverSubtitleXOffset = typeof styles.coverSubtitleXOffset === "number" ? styles.coverSubtitleXOffset : 0;
    const coverSubtitleYOffset = typeof styles.coverSubtitleYOffset === "number" ? styles.coverSubtitleYOffset : 0;

    const coverFooterColorCustom = styles.coverFooterColor || "";
    const coverFooterFontSize = typeof styles.coverFooterFontSize === "number" ? styles.coverFooterFontSize : 9;
    const coverFooterYOffset = typeof styles.coverFooterYOffset === "number" ? styles.coverFooterYOffset : 0;
    const coverVerticalOffset = typeof styles.coverVerticalOffset === "number" ? styles.coverVerticalOffset : 0;

    // ── PRODUCT PAGE BOTTLE & LAYOUT DYNAMIC TUNING ──
    const productImgHeight = typeof styles.productImgHeight === "number" ? styles.productImgHeight : 520;
    const productImgMaxWidth = Math.round(productImgHeight * 0.52);
    const productImgXOffset = typeof styles.productImgXOffset === "number" ? styles.productImgXOffset : 0;
    const productImgYOffset = typeof styles.productImgYOffset === "number" ? styles.productImgYOffset : 0;
    const productImgAngle = typeof styles.productImgAngle === "number" ? styles.productImgAngle : 0;

    // Product Header Tuning
    const productNameFontSize = typeof styles.productNameFontSize === "number" ? styles.productNameFontSize : 28;
    const productNameXOffset = typeof styles.productNameXOffset === "number" ? styles.productNameXOffset : 0;
    const productNameYOffset = typeof styles.productNameYOffset === "number" ? styles.productNameYOffset : 0;

    const productSpecsFontSize = typeof styles.productSpecsFontSize === "number" ? styles.productSpecsFontSize : 11;
    const productOriginYOffset = typeof styles.productOriginYOffset === "number" ? styles.productOriginYOffset : 0;

    // Product Colors & Price Block Tuning
    const productNameColor = styles.productNameColor || primaryColor;
    const productSpecsColor = styles.productSpecsColor || secondaryColor;
    const productDescColor = styles.productDescColor || textColor;
    const productPriceColor = styles.productPriceColor || primaryColor;
    const productPriceLabelColor = styles.productPriceLabelColor || "#777777";
    const productPriceInfoColor = styles.productPriceInfoColor || secondaryColor;
    const productPriceSide = styles.productPriceSide || "right"; // "right" | "left" | "center"
    const productPriceXOffset = typeof styles.productPriceXOffset === "number" ? styles.productPriceXOffset : 0;
    const productPriceYOffset = typeof styles.productPriceYOffset === "number" ? styles.productPriceYOffset : 0;
    const productPriceAngle = typeof styles.productPriceAngle === "number" ? styles.productPriceAngle : 0;

    // Price Font Sizes
    const productPriceLabelFontSize = typeof styles.productPriceLabelFontSize === "number" ? styles.productPriceLabelFontSize : 9.5;
    const productPriceInfoFontSize = typeof styles.productPriceInfoFontSize === "number" ? styles.productPriceInfoFontSize : 10;
    const productPriceValueFontSize = typeof styles.productPriceValueFontSize === "number" ? styles.productPriceValueFontSize : 24;

    // Product Details & Description Tuning
    const productDescFontSize = typeof styles.productDescFontSize === "number" ? styles.productDescFontSize : 14.5;
    const productDescXOffset = typeof styles.productDescXOffset === "number" ? styles.productDescXOffset : 0;
    const productDescYOffset = typeof styles.productDescYOffset === "number" ? styles.productDescYOffset : 0;
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
      // "auto": use white logo for cover background image, else black logo
      selectedLogoBase64 = hasCoverBg ? (logoWhiteBase64 || logoBlackBase64) : logoBlackBase64;
    }

    const coverTitleColor = coverTitleColorCustom || (hasCoverBg ? "#ffffff" : primaryColor);
    const coverSubColor = coverSubtitleColorCustom || (hasCoverBg ? "rgba(255,255,255,0.78)" : secondaryColor);
    const coverFootColor = coverFooterColorCustom || (hasCoverBg ? "rgba(255,255,255,0.55)" : "#999999");
    const coverDivColor = coverSubtitleColorCustom || (hasCoverBg ? "rgba(255,255,255,0.35)" : secondaryColor);

    // 8. Generate product pages HTML
    let productPagesHtml = "";
    products.forEach((product, idx) => {
      let priceHtml: string;
      if (product.precoPromocional) {
        priceHtml = `
          <span class="price-val" style="color:${productPriceColor}; font-size:${productPriceValueFontSize}px;">R$ ${product.precoPromocional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span class="price-old" style="font-size:${Math.round(productPriceValueFontSize * 0.55)}px;">R$ ${product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>`;
      } else {
        priceHtml = `<span class="price-val" style="color:${productPriceColor}; font-size:${productPriceValueFontSize}px;">R$ ${product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>`;
      }

      const pageBg = backgroundImageUrl
        ? `background-image:url('${backgroundImageUrl}');background-size:cover;background-position:center;`
        : `background-color:${backgroundColor};`;

      const notasText = product.notasDegustacao || "Vinho de excelente estrutura, aromas harmoniosos e notas marcantes.";

      productPagesHtml += `
      <div class="prod-page" style="${pageBg}">
        <div class="prod-top" style="transform: translate(${productNameXOffset}px, ${productNameYOffset}px);">
          <h2 class="prod-name" style="color:${productNameColor}; font-size:${productNameFontSize}px;">${product.name}</h2>
          <p class="prod-origin" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px; transform: translateY(${productOriginYOffset}px);">${product.paisOrigem} · ${product.regiao}</p>
          <div class="prod-line" style="background:${productSpecsColor};"></div>
        </div>

        <div class="prod-middle">
          <div class="prod-img-area" style="transform: translate(${productImgXOffset}px, ${productImgYOffset}px) rotate(${productImgAngle}deg);">
            <img src="${product.imagemUrl}" class="prod-img" style="max-height: min(${productImgHeight}px, 100%); max-width:${productImgMaxWidth}px;" />
          </div>

          <!-- Price text freely positionable anywhere on page -->
          <div class="prod-price-badge-side ${productPriceSide === 'left' ? 'price-left' : productPriceSide === 'center' ? 'price-center' : 'price-right'}" style="transform: translateY(${productPriceYOffset}px) rotate(${productPriceAngle}deg);">
            <p class="prod-price-label" style="color:${productPriceLabelColor}; font-size:${productPriceLabelFontSize}px;">Preço Unitário B2B</p>
            <p class="prod-price-info" style="color:${productPriceInfoColor}; font-size:${productPriceInfoFontSize}px;">Caixa c/ 6 garrafas</p>
            <div class="prod-price-row">${priceHtml}</div>
          </div>
        </div>

        <div class="prod-bottom" style="transform: translate(${productDescXOffset}px, ${productDescYOffset}px);">
          <p class="prod-specs" style="color:${productSpecsColor}; font-size:${productSpecsFontSize}px;">${product.vinicola} · ${product.uva} · Safra ${product.safra} · ${product.teorAlcoolico}% vol</p>
          <p class="prod-desc" style="color:${productDescColor}; font-size:${productDescFontSize}px;">${notasText}</p>
        </div>

        <div class="page-foot">
          <span>${footerText}</span>
          <span>Página ${idx + 2}</span>
        </div>
      </div>`;
    });

    // 9. Assemble full HTML document
    const coverBgCSS = hasCoverBg
      ? `background-image:url('${coverImageUrl}');background-size:cover;background-position:center;`
      : `background-color:${backgroundColor};`;

    const halfImgW = Math.round(productImgMaxWidth / 2);

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

/* ── PRODUCT PAGE (Strict Flexible A4 layout with zero text overflow) ── */
.prod-page{
  width:210mm;height:297mm;
  padding:${productPagePadding}px 42px 38px;
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

/* Price block freely positionable */
.prod-price-badge-side{
  position:absolute;bottom:10px;
  background:transparent !important;
  border:none !important;
  box-shadow:none !important;
  padding:0 !important;
  white-space:nowrap;
  z-index:10;
  transition: transform 0.15s ease;
}
.prod-price-badge-side.price-right{
  left:calc(50% + ${halfImgW + 14 + productPriceXOffset}px);
  text-align:left;
}
.prod-price-badge-side.price-left{
  right:calc(50% + ${halfImgW + 14 - productPriceXOffset}px);
  text-align:right;
}
.prod-price-badge-side.price-center{
  left:calc(50% + ${productPriceXOffset}px);
  transform: translateX(-50%);
  text-align:center;
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
  margin-bottom:4px;
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
  position:absolute;bottom:14px;left:42px;right:42px;
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

    // 10. Launch Puppeteer (local or remote Browserless)
    const browserWSEndpoint = process.env.BROWSERLESS_CONNECT_URL;
    if (browserWSEndpoint) {
      browser = await puppeteer.connect({ browserWSEndpoint });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
    }

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "load" });

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
