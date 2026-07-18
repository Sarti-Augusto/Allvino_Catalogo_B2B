# Catálogo B2B Allvino

## What This Is

Aplicativo web responsivo de catálogo digital de vinhos para a Allvino. Ele é composto por uma área pública de vitrine digital de vinhos com filtros avançados e download do catálogo completo em PDF, e por um painel administrativo seguro para gerenciamento de vinhos (CRUD), upload de imagens e edição/customização de templates de design de PDF.

## Core Value

Clientes e distribuidores conseguem visualizar e baixar o catálogo de vinhos atualizado da Allvino em PDF com altíssima fidelidade gráfica a qualquer momento.

## Business Context

- **Customer**: Clientes corporativos B2B, parceiros comerciais e administradores da Allvino.
- **Revenue model**: Vendas diretas por catálogo e representação comercial B2B.
- **Success metric**: Taxa de download do PDF, tempo de geração do PDF dinâmico < 3s, e precisão de preços/estoque atualizados.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **AUTH-01**: Login seguro do administrador com email e senha.
- [ ] **AUTH-02**: Controle de sessão do administrador persistente nas APIs.
- [ ] **PROD-01**: CRUD completo de produtos (Vinhos) no painel admin.
- [ ] **PROD-02**: Upload de imagens de produtos com pré-visualização.
- [ ] **TEMP-01**: Cadastro inicial de templates padrão (Clássico, Moderno, Ofertas).
- [ ] **TEMP-02**: Painel editor de estilos do template ativo (cores, fontes, grade, cabeçalho/rodapé).
- [ ] **TEMP-03**: Alternar template de exportação ativo.
- [ ] **PDF-01**: API `/api/export-pdf` para buscar dados e aplicar estilos dinamicamente.
- [ ] **PDF-02**: Geração robusta do PDF usando Puppeteer ou @react-pdf/renderer.
- [ ] **PUB-01**: Grid responsivo elegante e mobile-friendly de exibição de vinhos.
- [ ] **PUB-02**: Filtros dinâmicos por uva, preço, vinícola e país de origem.
- [ ] **PUB-03**: Botão de download do catálogo completo gerado sob demanda.

### Out of Scope

- Autenticação externa de clientes (ex: Google, Facebook) — desnecessário para o MVP do catálogo B2B.
- Gateway de checkout de vendas ou pagamento — a plataforma é puramente de catálogo e captação B2B (não é e-commerce B2C).
- Edição de estrutura HTML livre pelo admin — o editor de templates manipula apenas estilos e configurações do formulário para evitar quebras visuais.

## Context

A Allvino distribui vinhos importados premium para restaurantes e empórios. Atualmente, os catálogos são gerados manualmente e atualizados por planilhas. Este projeto visa automatizar a geração de PDF dinamicamente a partir da base de dados e prover uma vitrine moderna de consulta, com um design refinado e premium que reflita a identidade sofisticada da marca (tons escuros, dourado, vinho, tipografia elegante).

## Constraints

- **Tech Stack**: Next.js App Router (React, Tailwind CSS), PostgreSQL (via Prisma ORM), NextAuth.js.
- **PDF Engine**: Puppeteer ou @react-pdf/renderer. Puppeteer é preferível por suportar estilizações Tailwind/CSS modernas e ricas de forma nativa.
- **Performance**: A renderização do catálogo em PDF de centenas de produtos ativos deve ser rápida e não estourar o limite de timeout do Vercel/servidor.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Permite Server Components rápidos na vitrine pública e rotas de API integradas para o motor de PDF. | — Pending |
| Prisma ORM & PostgreSQL | Facilidade de modelagem de relacionamentos (Vinhos x Templates) e integridade dos dados. | — Pending |
| Puppeteer para PDF | Suporta estilização HTML/CSS rica e variáveis CSS de forma muito mais flexível e robusta que @react-pdf/renderer. | — Pending |
| NextAuth.js Credentials | Autenticação administrativa robusta e de rápida implementação. | — Pending |

---
*Last updated: 2026-07-18 after initial project design*
