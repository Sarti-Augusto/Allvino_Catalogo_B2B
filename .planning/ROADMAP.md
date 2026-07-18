# Roadmap: Catálogo B2B Allvino

## Overview

A jornada de desenvolvimento será dividida em 5 fases sequenciais. Iniciamos pelo setup do projeto e modelagem de banco de dados, progredindo pela implementação do Painel Administrativo (com login e gestão de vinhos), pelo Editor de Design de Templates, pela construção do Motor de Geração de PDF no backend e, finalmente, pela Vitrine Pública de consulta com filtros e exportação do catálogo completo.

## Phases

- [x] **Phase 1: Setup do Projeto e Modelagem do Banco de Dados** - Configurar o Next.js, Prisma, PostgreSQL e carregar templates padrão no seed.
- [ ] **Phase 2: Painel Administrativo, Login e CRUD de Vinhos** - Implementar NextAuth e o gerenciamento completo de vinhos com upload de imagens.
- [ ] **Phase 3: Editor de Design e Controle de Templates (Admin)** - Desenvolver o painel de edição de estilos visuais e ativação de templates.
- [ ] **Phase 4: Motor de PDF (API e Geração)** - Criar o backend de injeção dinâmica e renderização do PDF com alta definição usando Puppeteer.
- [ ] **Phase 5: Vitrine Pública, Filtros e Acesso ao PDF** - Desenvolver a tela principal pública, filtros de pesquisa e o botão de exportação.

## Phase Details

### Phase 1: Setup do Projeto e Modelagem do Banco de Dados
**Goal**: Inicializar a fundação técnica do projeto com as tabelas de banco corretas e o seed pronto.
**Depends on**: Nothing (first phase)
**Requirements**: [TEMP-01]
**Success Criteria**:
  1. O projeto Next.js inicia e roda sem erros localmente.
  2. O banco de dados PostgreSQL é modelado e migrado com sucesso via Prisma ORM (tabelas User, Product e Template).
  3. O script de seed popula o banco com os 3 templates iniciais (Clássico, Moderno, Ofertas) e vinhos de exemplo.
**Plans**: 1 plan

Plans:
- [x] 01-01: Inicialização do Next.js, Prisma schema, migrações e seed script.

### Phase 2: Painel Administrativo, Login e CRUD de Vinhos
**Goal**: Criar a área administrativa segura para gerenciar a lista de vinhos disponíveis no catálogo.
**Depends on**: Phase 1
**Requirements**: [AUTH-01, AUTH-02, PROD-01, PROD-02]
**Success Criteria**:
  1. O login de administrador bloqueia acessos não autorizados.
  2. O admin consegue criar, ler, atualizar e excluir vinhos do catálogo.
  3. O upload de imagens possui pré-visualização e armazena os dados devidamente.
**Plans**: 2 plans

Plans:
- [ ] 02-01: Autenticação via NextAuth.js com Credenciais e proteção de rotas admin.
- [ ] 02-02: Páginas e formulários de CRUD de Vinhos com simulação de upload de imagens.

### Phase 3: Editor de Design e Controle de Templates (Admin)
**Goal**: Permitir que o administrador edite a estilização visual do catálogo exportado sem alterar o código.
**Depends on**: Phase 2
**Requirements**: [TEMP-02, TEMP-03]
**Success Criteria**:
  1. O administrador consegue selecionar um template base.
  2. O formulário do editor salva cores (primária, secundária), fontes e grade do PDF no banco de dados.
  3. Apenas um template pode estar marcado como ativo por vez.
**Plans**: 1 plan

Plans:
- [ ] 03-01: Interface do Editor de Templates no painel do administrador e salvamento na tabela `Template`.

### Phase 4: Motor de PDF (API e Geração)
**Goal**: Desenvolver o motor de backend que compila vinhos e estilos em um PDF de alto impacto.
**Depends on**: Phase 3
**Requirements**: [PDF-01, PDF-02, PDF-03]
**Success Criteria**:
  1. A API `/api/export-pdf` consome os dados e estilos corretos do banco de dados.
  2. O HTML compilado reflete fielmente as customizações do administrador.
  3. O Puppeteer renderiza o arquivo PDF com alta fidelidade visual e tempo de resposta aceitável.
**Plans**: 2 plans

Plans:
- [ ] 04-01: Desenvolvimento da rota de injeção dinâmica de dados e estilos no template HTML.
- [ ] 04-02: Integração com Puppeteer para renderizar a página em PDF e retornar o arquivo para download.

### Phase 5: Vitrine Pública, Filtros e Acesso ao PDF
**Goal**: Disponibilizar o catálogo online e integrado para os clientes finais.
**Depends on**: Phase 4
**Requirements**: [PUB-01, PUB-02, PUB-03]
**Success Criteria**:
  1. A vitrine pública exibe a lista de vinhos ativos em uma interface premium e responsiva.
  2. Filtros por uva, preço, país e vinícola atualizam os resultados instantaneamente.
  3. O botão de baixar catálogo funciona, baixando o PDF correspondente ao template ativo estilizado.
**Plans**: 1 plan

Plans:
- [ ] 05-01: Vitrine pública com Tailwind, filtros de consulta e botão de chamada da API do PDF.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Setup e DB | 1/1 | Complete | 2026-07-18 |
| 2. Admin & CRUD | 0/2 | Not started | - |
| 3. Template Editor | 0/1 | Not started | - |
| 4. PDF Engine | 0/2 | Not started | - |
| 5. Vitrine & Filtros | 0/1 | Not started | - |
