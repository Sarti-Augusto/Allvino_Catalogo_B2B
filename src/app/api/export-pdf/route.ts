import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";

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

    // 2. Fetch active wines (products)
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

    // 3. Parse Styles
    let styles;
    try {
      styles = JSON.parse(activeTemplate.cssStyles);
    } catch (e) {
      return NextResponse.json(
        { error: "Erro nas definições de estilo do template." },
        { status: 500 }
      );
    }

    // 4. Generate products HTML dynamically based on template type
    let productsHtml = "";
    for (const product of products) {
      if (activeTemplate.nome === "Moderno") {
        let priceHtml = "";
        if (product.precoPromocional) {
          priceHtml = `
            <span class="price-promo">R$ ${product.precoPromocional.toFixed(2)}</span>
            <span class="price-dashed">R$ ${product.precoOriginal.toFixed(2)}</span>
          `;
        } else {
          priceHtml = `<span class="price-original">R$ ${product.precoOriginal.toFixed(2)}</span>`;
        }

        productsHtml += `
          <div class="wine-card">
            <div class="wine-img-container">
              <img src="${product.imagemUrl}" class="wine-img" />
            </div>
            <h3 class="wine-name">${product.name}</h3>
            <div class="wine-meta">${product.vinicola} • ${product.paisOrigem} (${product.regiao}) • Safra ${product.safra} • ${product.teorAlcoolico}% vol</div>
            <p class="wine-desc">${product.notasDegustacao}</p>
            <div class="wine-price-container">
              ${priceHtml}
            </div>
          </div>
        `;
      } else if (activeTemplate.nome === "Ofertas") {
        let priceHtml = "";
        if (product.precoPromocional) {
          priceHtml = `
            <span class="price-original">R$ ${product.precoOriginal.toFixed(2)}</span>
            <span class="price-promo">R$ ${product.precoPromocional.toFixed(2)}</span>
          `;
        } else {
          priceHtml = `<span class="price-promo">R$ ${product.precoOriginal.toFixed(2)}</span>`;
        }

        productsHtml += `
          <div class="wine-card">
            <div class="promo-badge">Oferta Especial</div>
            <div class="wine-content">
              <div class="wine-img-container">
                <img src="${product.imagemUrl}" class="wine-img" />
              </div>
              <div class="wine-info">
                <h3 class="wine-name">${product.name}</h3>
                <div class="wine-meta">${product.vinicola} • ${product.paisOrigem} • Safra ${product.safra} • ${product.teorAlcoolico}% vol</div>
                <p class="wine-desc">${product.notasDegustacao}</p>
                <div class="price-box">
                  <div class="price-label">Preço B2B</div>
                  <div class="wine-price-container">
                    ${priceHtml}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Clássico
        let priceHtml = "";
        if (product.precoPromocional) {
          priceHtml = `
            <span class="price-promo">R$ ${product.precoPromocional.toFixed(2)}</span>
            <span class="price-dashed">R$ ${product.precoOriginal.toFixed(2)}</span>
          `;
        } else {
          priceHtml = `<span class="price-original">R$ ${product.precoOriginal.toFixed(2)}</span>`;
        }

        productsHtml += `
          <div class="wine-card">
            <div class="wine-img-container">
              <img src="${product.imagemUrl}" class="wine-img" />
            </div>
            <div class="wine-info">
              <h3 class="wine-name">${product.name}</h3>
              <div class="wine-meta">${product.vinicola} • ${product.paisOrigem} (${product.regiao}) • Safra ${product.safra} • ${product.teorAlcoolico}% vol</div>
              <p class="wine-desc">${product.notasDegustacao}</p>
              <div class="wine-price-container">
                ${priceHtml}
              </div>
            </div>
          </div>
        `;
      }
    }

    // 5. Interpolate placeholders in raw HTML content
    let finalHtml = activeTemplate.htmlContent;
    finalHtml = finalHtml.replace(/{{primaryColor}}/g, styles.primaryColor || "#80282d");
    finalHtml = finalHtml.replace(/{{secondaryColor}}/g, styles.secondaryColor || "#c5a880");
    finalHtml = finalHtml.replace(/{{backgroundColor}}/g, styles.backgroundColor || "#ffffff");
    finalHtml = finalHtml.replace(/{{textColor}}/g, styles.textColor || "#1f2937");
    finalHtml = finalHtml.replace(/{{fontFamily}}/g, styles.fontFamily || "Playfair Display");
    finalHtml = finalHtml.replace(/{{gridColumns}}/g, styles.gridColumns || "2");
    finalHtml = finalHtml.replace(/{{headerTitle}}/g, styles.headerTitle || "ALLVINO");
    finalHtml = finalHtml.replace(/{{footerText}}/g, styles.footerText || "");
    finalHtml = finalHtml.replace(/{{productsList}}/g, productsHtml);

    // Inject explicit CSS rules to prevent splitting wine-cards across page borders
    const pageBreakStyles = `
      <style>
        .wine-card {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 20px;
        }
        /* Ensure responsive font sizing rendering inside Puppeteer */
        img {
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }
      </style>
    `;
    finalHtml = finalHtml.replace("</head>", `${pageBreakStyles}</head>`);

    // 6. Launch Puppeteer to generate high-fidelity PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(finalHtml, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "15mm",
        right: "15mm",
      },
    });

    await browser.close();

    // 7. Send PDF file buffer to client
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
