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

    // 4. Read logo and convert to base64 for inline embedding
    let logoBase64 = "";
    try {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (e) {
      console.warn("Logo não encontrado em /public/logo.png — capa sem logotipo.");
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

    // 6. Resolve font family CSS
    const fontCSS =
      fontFamily === "Inter"
        ? "'Inter', 'Helvetica Neue', sans-serif"
        : fontFamily === "Cinzel"
        ? "'Cinzel', Georgia, serif"
        : "'Playfair Display', Georgia, serif";

    // 7. Cover page config
    const hasCoverBg = !!coverImageUrl;
    const coverTitleColor = hasCoverBg ? "#ffffff" : primaryColor;
    const coverSubColor = hasCoverBg ? "rgba(255,255,255,0.78)" : secondaryColor;
    const coverFootColor = hasCoverBg ? "rgba(255,255,255,0.55)" : "#999999";
    const coverDivColor = hasCoverBg ? "rgba(255,255,255,0.35)" : secondaryColor;

    // 8. Generate product pages HTML
    let productPagesHtml = "";
    products.forEach((product, idx) => {
      let priceHtml: string;
      if (product.precoPromocional) {
        priceHtml = `
          <span class="price-val">R$ ${product.precoPromocional.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span class="price-old">R$ ${product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>`;
      } else {
        priceHtml = `<span class="price-val">R$ ${product.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>`;
      }

      const pageBg = backgroundImageUrl
        ? `background-image:url('${backgroundImageUrl}');background-size:cover;background-position:center;`
        : `background-color:${backgroundColor};`;

      productPagesHtml += `
      <div class="prod-page" style="${pageBg}">
        <div class="prod-top">
          <h2 class="prod-name">${product.name}</h2>
          <p class="prod-origin">${product.paisOrigem} · ${product.regiao}</p>
          <div class="prod-line"></div>
        </div>

        <div class="prod-img-area">
          <img src="${product.imagemUrl}" class="prod-img" />
        </div>

        <div class="prod-bottom">
          <p class="prod-specs">${product.vinicola} · ${product.uva} · Safra ${product.safra} · ${product.teorAlcoolico}% vol</p>
          <p class="prod-desc">${product.notasDegustacao}</p>
          <div class="prod-price-box">
            <p class="prod-price-label">Preço Unitário B2B</p>
            <p class="prod-price-info">Caixa c/ 6 garrafas</p>
            <div class="prod-price-row">${priceHtml}</div>
          </div>
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
}
.cover-logo{
  height:110px;width:auto;margin-bottom:45px;
  ${hasCoverBg ? "filter:brightness(0) invert(1);opacity:.92;" : ""}
}
.cover-line{
  width:70px;height:1.5px;margin:0 auto 28px;
  background:${coverDivColor};
}
.cover-h1{
  font-family:${fontCSS};
  font-size:30px;font-weight:700;
  color:${coverTitleColor};
  letter-spacing:4px;text-transform:uppercase;
  margin-bottom:14px;
  ${hasCoverBg ? "text-shadow:0 2px 12px rgba(0,0,0,.25);" : ""}
}
.cover-sub{
  font-size:11px;font-weight:500;
  color:${coverSubColor};
  letter-spacing:6px;text-transform:uppercase;
}
.cover-foot{
  position:absolute;bottom:38px;left:0;right:0;
  text-align:center;z-index:2;
  font-size:9px;color:${coverFootColor};letter-spacing:1px;
}
/* decorative borders for plain covers */
.cover-brd{
  position:absolute;left:35px;right:35px;
  height:1px;background:${secondaryColor};opacity:.3;z-index:2;
}
.cover-brd-t{top:35px}
.cover-brd-b{bottom:75px}

/* ── PRODUCT PAGE ─────────────────────── */
.prod-page{
  width:210mm;height:297mm;
  padding:42px 52px 55px;
  display:flex;flex-direction:column;
  align-items:center;
  position:relative;
  page-break-after:always;
}
.prod-top{
  text-align:center;width:100%;padding-top:8px;
}
.prod-name{
  font-family:${fontCSS};
  font-size:24px;font-weight:700;
  color:${primaryColor};
  letter-spacing:1px;margin-bottom:10px;
}
.prod-origin{
  font-size:10px;color:${secondaryColor};
  text-transform:uppercase;letter-spacing:3px;font-weight:600;
}
.prod-line{
  width:45px;height:1.5px;
  background:${secondaryColor};
  margin:20px auto;
}
.prod-img-area{
  flex:1;display:flex;
  align-items:center;justify-content:center;
  padding:10px 0;
}
.prod-img{
  max-height:370px;max-width:170px;
  object-fit:contain;
  filter:drop-shadow(0 8px 24px rgba(0,0,0,.10));
}
.prod-bottom{
  text-align:center;width:100%;max-width:460px;
}
.prod-specs{
  font-size:8.5px;color:#999;
  text-transform:uppercase;letter-spacing:1.5px;
  margin-bottom:12px;
}
.prod-desc{
  font-size:10.5px;line-height:1.85;
  color:${textColor};font-weight:300;
  margin-bottom:20px;
}
.prod-price-box{
  border-top:1px solid #e4e4e4;padding-top:14px;
}
.prod-price-label{
  font-size:7.5px;text-transform:uppercase;
  letter-spacing:3px;color:#aaa;margin-bottom:2px;
}
.prod-price-info{
  font-size:8.5px;color:${secondaryColor};
  font-weight:600;margin-bottom:8px;
}
.prod-price-row{
  display:flex;align-items:baseline;
  justify-content:center;gap:10px;
}
.price-val{
  font-size:20px;font-weight:700;color:${primaryColor};
}
.price-old{
  font-size:12px;color:#bbb;text-decoration:line-through;
}
.page-foot{
  position:absolute;bottom:22px;left:52px;right:52px;
  border-top:1px solid #eee;padding-top:8px;
  display:flex;justify-content:space-between;
  font-size:7.5px;color:#bbb;letter-spacing:.5px;
}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover" style="${coverBgCSS}">
  ${hasCoverBg ? '<div class="cover-dim"></div>' : '<div class="cover-brd cover-brd-t"></div><div class="cover-brd cover-brd-b"></div>'}
  <div class="cover-inner">
    ${logoBase64 ? `<img src="${logoBase64}" class="cover-logo"/>` : ""}
    <div class="cover-line"></div>
    <h1 class="cover-h1">${headerTitle}</h1>
    <p class="cover-sub">Catálogo Exclusivo B2B</p>
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
