# Requirements: Catálogo B2B Allvino

**Defined:** 2026-07-18
**Core Value:** Clientes e distribuidores conseguem visualizar e baixar o catálogo de vinhos atualizado da Allvino em PDF com altíssima fidelidade gráfica a qualquer momento.

## v1 Requirements

Requirements for the initial release. Each maps to roadmap phases.

### Authentication (AUTH)

- [ ] **AUTH-01**: O administrador pode logar de forma segura utilizando email e senha no painel administrativo.
- [ ] **AUTH-02**: Sessão do administrador persiste em requisições seguras ao painel e às APIs do sistema.

### Products (PROD)

- [ ] **PROD-01**: CRUD completo de produtos (Vinhos) contendo: nome, vinícola, tipo/blend de uva (Tinto, Branco, Rosé, Espumante), teor alcoólico, safra, país de origem, região, notas de degustação (ficha técnica descritiva), preço original, preço promocional, status (ativo/inativo), imagem URL e estoque.
- [ ] **PROD-02**: Interface do painel de administração permite simular ou fazer upload de imagem do produto para um serviço local ou remoto com pré-visualização.

### Templates (TEMP)

- [ ] **TEMP-01**: Cadastro inicial no banco de dados de pelo menos 3 templates base ("Clássico", "Moderno", "Ofertas").
- [ ] **TEMP-02**: Formulário no painel de administração para alterar as configurações visuais do template ativo (cor primária, cor secundária, fontes, tamanho da grade de produtos [1x2, 2x2], cabeçalho e rodapé personalizados com a marca Allvino).
- [ ] **TEMP-03**: O administrador pode alternar qual template está marcado como ativo (`Is_Active`), definindo-o como padrão para exportação.

### PDF Engine (PDF)

- [ ] **PDF-01**: Rota de API backend `/api/export-pdf` que busca dinamicamente todos os produtos ativos e as configurações do template ativo.
- [ ] **PDF-02**: O motor de PDF injeta os dados dos vinhos e as estilizações customizadas salvas pelo admin no HTML base do template.
- [ ] **PDF-03**: O motor gera e retorna um PDF completo e elegante pronto para download rápido pelo usuário final.

### Public Vitrine (PUB)

- [ ] **PUB-01**: Tela pública com grade de produtos responsiva e visual sofisticado otimizada para dispositivos móveis e desktops.
- [ ] **PUB-02**: Filtros dinâmicos na vitrine por tipo de uva, faixa de preço, vinícola e país de origem.
- [ ] **PUB-03**: Botão de fácil acesso na vitrine: "Baixar Catálogo Completo em PDF" que aciona a API de exportação e inicia o download do arquivo.

## v2 Requirements

Deferred to future releases.

- **NOTF-01**: Envio automático do PDF atualizado via WhatsApp ou Email para clientes cadastrados.
- **INTEG-01**: Sincronização automática de preços e estoques com sistema ERP externo.
- **INTEG-02**: Upload de imagens de produtos direto para Amazon S3 ou Cloudinary integrado nativamente.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Gateway de Pagamento | O aplicativo é apenas para consulta e geração de catálogo comercial, não um e-commerce com checkout. |
| Cadastro de Clientes Públicos | Sem necessidade de login por parte dos clientes na vitrine pública para simplificar a jornada do usuário. |
| Edição de Código HTML base | O admin manipula apenas estilos (CSS) e opções controladas via formulário para evitar quebras visuais e de segurança. |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 2 | Pending |
| PROD-01 | Phase 2 | Pending |
| PROD-02 | Phase 2 | Pending |
| TEMP-01 | Phase 1 | Pending |
| TEMP-02 | Phase 3 | Pending |
| TEMP-03 | Phase 3 | Pending |
| PDF-01 | Phase 4 | Pending |
| PDF-02 | Phase 4 | Pending |
| PDF-03 | Phase 4 | Pending |
| PUB-01 | Phase 5 | Pending |
| PUB-02 | Phase 5 | Pending |
| PUB-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-18*
*Last updated: 2026-07-18 after initial definition*
