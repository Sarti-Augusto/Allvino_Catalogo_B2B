import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando semeadura do banco de dados...");

  // 1. Criar Usuário Administrador
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword || adminPassword.length < 12) {
    throw new Error(
      "ADMIN_EMAIL e ADMIN_PASSWORD devem ser definidos; a senha deve possuir pelo menos 12 caracteres.",
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administrador Allvino",
        password: hashedPassword,
        role: "ADMIN",
      },
    });
    console.log(`✓ Usuário admin criado: ${adminEmail}`);
  } else {
    console.log("✓ Usuário admin já existente.");
  }

  // 2. Criar Templates Base
  // Template Clássico
  const templateClassicoStyles = {
    primaryColor: "#80282d",
    secondaryColor: "#c5a880",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    fontFamily: "Playfair Display",
    headerTitle: "ALLVINO - CATÁLOGO DE VINHOS",
    footerText: "Allvino Importadora de Vinhos B2B - contato@allvino.com.br",
    coverImageUrl: "",
  };

  const templateClassicoHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{headerTitle}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;500;600&display=swap');
    
    :root {
      --primary-color: {{primaryColor}};
      --secondary-color: {{secondaryColor}};
      --bg-color: {{backgroundColor}};
      --text-color: {{textColor}};
      --font-family: {{fontFamily}}, serif;
    }
    
    body {
      font-family: 'Inter', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      margin: 0;
      padding: 0;
    }
    
    .page {
      padding: 40px;
      page-break-after: always;
      box-sizing: border-box;
    }
    
    .header {
      border-bottom: 2px solid var(--secondary-color);
      padding-bottom: 15px;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .header h1 {
      font-family: var(--font-family);
      color: var(--primary-color);
      margin: 0;
      font-size: 28px;
      letter-spacing: 2px;
    }
    
    .header p {
      margin: 5px 0 0 0;
      font-size: 12px;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat({{gridColumns}}, 1fr);
      gap: 30px;
    }
    
    .wine-card {
      border: 1px solid #e2e8f0;
      padding: 20px;
      border-radius: 4px;
      display: flex;
      flex-direction: row;
      gap: 15px;
      background-color: #fafafa;
    }
    
    .wine-img-container {
      width: 80px;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border-radius: 4px;
      padding: 5px;
    }
    
    .wine-img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    
    .wine-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .wine-name {
      font-family: var(--font-family);
      font-size: 16px;
      font-weight: bold;
      color: var(--primary-color);
      margin: 0 0 5px 0;
    }
    
    .wine-meta {
      font-size: 11px;
      color: #718096;
      margin-bottom: 10px;
    }
    
    .wine-desc {
      font-size: 11px;
      color: var(--text-color);
      margin: 0 0 10px 0;
      line-height: 1.4;
      flex-grow: 1;
    }
    
    .wine-price-container {
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      display: flex;
      align-items: baseline;
      gap: 10px;
    }
    
    .price-original {
      font-size: 14px;
      font-weight: bold;
      color: var(--text-color);
    }
    
    .price-promo {
      font-size: 16px;
      font-weight: bold;
      color: var(--primary-color);
    }
    
    .price-dashed {
      font-size: 12px;
      color: #a0aec0;
      text-decoration: line-through;
    }
    
    .footer {
      position: fixed;
      bottom: 20px;
      left: 40px;
      right: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
      text-align: center;
      font-size: 10px;
      color: #a0aec0;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>{{headerTitle}}</h1>
      <p>Catálogo Exclusivo B2B</p>
    </div>
    <div class="grid">
      {{productsList}}
    </div>
    <div class="footer">
      {{footerText}}
    </div>
  </div>
</body>
</html>
  `;

  // Template Moderno
  const templateModernoStyles = {
    primaryColor: "#0f0f11",
    secondaryColor: "#b48d56",
    backgroundColor: "#f9f9fb",
    textColor: "#2d3748",
    fontFamily: "Inter",
    headerTitle: "ALLVINO | DESIGN SELECTION",
    footerText: "allvino.com.br | B2B Portal",
    coverImageUrl: "",
  };

  const templateModernoHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{headerTitle}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
    
    :root {
      --primary-color: {{primaryColor}};
      --secondary-color: {{secondaryColor}};
      --bg-color: {{backgroundColor}};
      --text-color: {{textColor}};
      --font-family: 'Inter', sans-serif;
    }
    
    body {
      font-family: var(--font-family);
      background-color: var(--bg-color);
      color: var(--text-color);
      margin: 0;
      padding: 0;
    }
    
    .page {
      padding: 50px;
      page-break-after: always;
      box-sizing: border-box;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 3px solid var(--primary-color);
      padding-bottom: 20px;
      margin-bottom: 40px;
    }
    
    .header h1 {
      color: var(--primary-color);
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .header .subtitle {
      font-size: 11px;
      font-weight: 600;
      color: var(--secondary-color);
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat({{gridColumns}}, 1fr);
      gap: 40px;
    }
    
    .wine-card {
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 20px;
    }
    
    .wine-img-container {
      width: 100%;
      height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      margin-bottom: 15px;
      border-radius: 8px;
    }
    
    .wine-img {
      max-height: 190px;
      object-fit: contain;
    }
    
    .wine-name {
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-color);
      margin: 0 0 5px 0;
    }
    
    .wine-meta {
      font-size: 11px;
      color: var(--secondary-color);
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 10px;
      letter-spacing: 0.5px;
    }
    
    .wine-desc {
      font-size: 12px;
      color: #4a5568;
      margin: 0 0 15px 0;
      line-height: 1.5;
    }
    
    .wine-price-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .price-original {
      font-size: 15px;
      font-weight: 700;
      color: var(--primary-color);
    }
    
    .price-promo {
      font-size: 17px;
      font-weight: 700;
      color: #c53030;
    }
    
    .price-dashed {
      font-size: 13px;
      color: #a0aec0;
      text-decoration: line-through;
    }
    
    .footer {
      position: fixed;
      bottom: 30px;
      left: 50px;
      right: 50px;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>{{headerTitle}}</h1>
      <span class="subtitle">B2B Portfolio</span>
    </div>
    <div class="grid">
      {{productsList}}
    </div>
    <div class="footer">
      <span>{{footerText}}</span>
      <span>Página 1</span>
    </div>
  </div>
</body>
</html>
  `;

  // Template Ofertas
  const templateOfertasStyles = {
    primaryColor: "#b81c20",
    secondaryColor: "#2d3748",
    backgroundColor: "#ffffff",
    textColor: "#2d3748",
    fontFamily: "Inter",
    headerTitle: "ALLVINO - CAMPANHA DE OFERTAS",
    footerText: "Estoque Limitado. Preços sujeitos a alterações sem aviso prévio.",
    coverImageUrl: "",
  };

  const templateOfertasHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{headerTitle}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    
    :root {
      --primary-color: {{primaryColor}};
      --secondary-color: {{secondaryColor}};
      --bg-color: {{backgroundColor}};
      --text-color: {{textColor}};
      --font-family: 'Inter', sans-serif;
    }
    
    body {
      font-family: var(--font-family);
      background-color: var(--bg-color);
      color: var(--text-color);
      margin: 0;
      padding: 0;
    }
    
    .page {
      padding: 40px;
      page-break-after: always;
      box-sizing: border-box;
    }
    
    .header {
      background-color: var(--primary-color);
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .header p {
      margin: 5px 0 0 0;
      font-size: 13px;
      font-weight: 700;
      color: #fffff0;
      letter-spacing: 2px;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat({{gridColumns}}, 1fr);
      gap: 20px;
    }
    
    .wine-card {
      border: 2px solid var(--primary-color);
      border-radius: 8px;
      padding: 15px;
      position: relative;
      background-color: #fffaf0;
    }
    
    .promo-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: var(--primary-color);
      color: white;
      font-size: 10px;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    
    .wine-content {
      display: flex;
      gap: 15px;
    }
    
    .wine-img-container {
      width: 70px;
      height: 160px;
      background: white;
      border-radius: 4px;
      padding: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .wine-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
    
    .wine-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .wine-name {
      font-size: 15px;
      font-weight: 700;
      color: var(--secondary-color);
      margin: 0 0 3px 0;
    }
    
    .wine-meta {
      font-size: 11px;
      color: #718096;
      margin-bottom: 5px;
    }
    
    .wine-desc {
      font-size: 11px;
      color: #4a5568;
      margin: 0 0 10px 0;
      line-height: 1.3;
    }
    
    .price-box {
      background: white;
      border: 1px solid #fed7d7;
      padding: 8px;
      border-radius: 4px;
    }
    
    .price-label {
      font-size: 9px;
      color: #e53e3e;
      font-weight: 700;
      text-transform: uppercase;
    }
    
    .price-original {
      font-size: 13px;
      text-decoration: line-through;
      color: #a0aec0;
      margin-right: 5px;
    }
    
    .price-promo {
      font-size: 18px;
      font-weight: 900;
      color: var(--primary-color);
    }
    
    .footer {
      position: fixed;
      bottom: 20px;
      left: 40px;
      right: 40px;
      border-top: 2px solid var(--primary-color);
      padding-top: 10px;
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      color: var(--secondary-color);
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>{{headerTitle}}</h1>
      <p>Oportunidades Imperdíveis - Lote Limitado</p>
    </div>
    <div class="grid">
      {{productsList}}
    </div>
    <div class="footer">
      {{footerText}}
    </div>
  </div>
</body>
</html>
  `;

  // Upsert os Templates
  await prisma.template.upsert({
    where: { id: "classico-template-id" },
    update: {},
    create: {
      id: "classico-template-id",
      nome: "Clássico",
      htmlContent: templateClassicoHtml,
      cssStyles: JSON.stringify(templateClassicoStyles),
      isActive: true, // Clássico será o ativo por padrão
    },
  });

  await prisma.template.upsert({
    where: { id: "moderno-template-id" },
    update: {},
    create: {
      id: "moderno-template-id",
      nome: "Moderno",
      htmlContent: templateModernoHtml,
      cssStyles: JSON.stringify(templateModernoStyles),
      isActive: false,
    },
  });

  await prisma.template.upsert({
    where: { id: "ofertas-template-id" },
    update: {},
    create: {
      id: "ofertas-template-id",
      nome: "Ofertas",
      htmlContent: templateOfertasHtml,
      cssStyles: JSON.stringify(templateOfertasStyles),
      isActive: false,
    },
  });

  console.log("✓ Templates padrão criados (Clássico, Moderno, Ofertas)");

  // 3. Criar Vinhos (Produtos) de Demonstração
  const sampleProducts = [
    {
      id: "vinho-01",
      name: "Château Haut-Brion 2018",
      vinicola: "Château Haut-Brion",
      uva: "Cabernet Sauvignon, Merlot, Cabernet Franc",
      teorAlcoolico: 14.5,
      safra: "2018",
      paisOrigem: "França",
      regiao: "Pessac-Léognan, Bordeaux",
      notasDegustacao: "Notas complexas de frutas negras, fumo de corda, cacau e couro. Corpo encorpado, com taninos aveludados e final de boca extremamente persistente. Um clássico de Bordeaux de altíssima elegância.",
      precoOriginal: 5200.0,
      precoPromocional: 4800.0,
      status: true,
      imagemUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop", // imagem geral elegante
      estoque: 12,
    },
    {
      id: "vinho-02",
      name: "Brunello di Montalcino Biondi-Santi 2016",
      vinicola: "Biondi-Santi",
      uva: "Sangiovese Grosso",
      teorAlcoolico: 14.0,
      safra: "2016",
      paisOrigem: "Itália",
      regiao: "Toscana",
      notasDegustacao: "Aroma refinado com notas de cerejas pretas, especiarias secas, pétalas de rosa e terra molhada. Acidez viva vibrante e taninos perfeitamente polidos. Vinho histórico com espetacular potencial de guarda.",
      precoOriginal: 2800.0,
      precoPromocional: null,
      status: true,
      imagemUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=300&auto=format&fit=crop",
      estoque: 18,
    },
    {
      id: "vinho-03",
      name: "Alma Única Cabernet Franc Gran Reserva",
      vinicola: "Alma Única",
      uva: "Cabernet Franc",
      teorAlcoolico: 13.8,
      safra: "2020",
      paisOrigem: "Brasil",
      regiao: "Vale dos Vinhedos",
      notasDegustacao: "Exibe frutas vermelhas frescas combinadas a nuances de pimenta verde e especiarias doces originadas pelo carvalho francês. Boca de acidez média-alta, refrescante e gastronômica.",
      precoOriginal: 195.0,
      precoPromocional: 175.0,
      status: true,
      imagemUrl: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=300&auto=format&fit=crop",
      estoque: 120,
    },
    {
      id: "vinho-04",
      name: "Catena Zapata Malbec Argentino 2021",
      vinicola: "Catena Zapata",
      uva: "Malbec",
      teorAlcoolico: 14.0,
      safra: "2021",
      paisOrigem: "Argentina",
      regiao: "Mendoza",
      notasDegustacao: "Aroma exuberante de violetas, mirtilos maduros e toque de baunilha. Paladar opulento e concentrado com taninos ultra-doces e final expressivo. O expoente máximo da Malbec.",
      precoOriginal: 1100.0,
      precoPromocional: 980.0,
      status: true,
      imagemUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=300&auto=format&fit=crop",
      estoque: 24,
    },
    {
      id: "vinho-05",
      name: "Champagne Dom Pérignon Vintage 2013",
      vinicola: "Moët & Chandon",
      uva: "Chardonnay, Pinot Noir",
      teorAlcoolico: 12.5,
      safra: "2013",
      paisOrigem: "França",
      regiao: "Champagne",
      notasDegustacao: "Aromas de damasco, menta fresca e brioche tostado. Textura na boca com cremosidade ímpar, perlage finíssima e mineralidade calcária persistente. Um espumante lendário.",
      precoOriginal: 2400.0,
      precoPromocional: null,
      status: true,
      imagemUrl: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=300&auto=format&fit=crop",
      estoque: 8,
    },
  ];

  for (const prod of sampleProducts) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {},
      create: prod,
    });
  }

  console.log(`✓ ${sampleProducts.length} vinhos de demonstração inseridos.`);
  console.log("Semeadura concluída com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro na semeadura:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
