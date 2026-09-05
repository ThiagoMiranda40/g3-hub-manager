# Plan — Módulo 1 V1: Controle de Tour + Rider Técnico Digital

## 1. Abordagem Técnica e Arquitetura

O Módulo 1 V1 é construído sobre a arquitetura já estabelecida e validada em produção no repositório:
- **Frontend / SSR:** TanStack Start (React 19) com Nitro (`cloudflare-module`), empacotado via Vite 8.
- **Roteamento:** TanStack Router (`@tanstack/react-router`) com arquivos de rota em `src/routes/` e tipagem estrita gerada em `routeTree.gen.ts`.
- **Estilização e Design System (Nocturne Calibrado):** Tailwind CSS v4 com sistema visual definitivo **Nocturne**, adaptado com rigor WCAG 2.2 AA:
  - Fundo escuro elegante (`#161826`) com acento lilás `#9184d9` (contraste ~6.5:1).
  - No tema claro, textos interativos e ícones utilizam a variante calibrada profunda `#5f4eb8` (contraste > 5.5:1), mantendo o lilás suave para fundos de pills/badges.
  - Tipografia: Inter para toda a hierarquia, cantos suaves de 8–14px, hairlines e transições de 0.18s.
- **Backend e Persistência:** Supabase (PostgreSQL 15+, Auth, Storage para PDFs e imagens no bucket `documentos`), com Row Level Security (RLS) mandatória em todas as tabelas.
- **Server Functions e RPC:** Rotas públicas (`/p/$token` e `/r/$token`) utilizam funções de servidor seguras (`createServerFn` / Nitro handlers) com validação Zod, auto-save atômico e debounce, sem expor dados financeiros ou credenciais do sistema.
- **Estratégia de Testes e TDD:** Suíte de testes unitários com `vitest` cobrindo o cálculo de pendências individuais, presets de exigências e estados do rider.

---

## 2. Arquivos e Interfaces Afetados

### 2.1 Banco de Dados e Migrações
- `[NEW]` [supabase/migrations/20260904100000_modulo1_v1_schema.sql](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/supabase/migrations/20260904100000_modulo1_v1_schema.sql): Criação das tabelas `people` (com `pix_type`, `pix_key`), `person_artists`, `show_requirements`, `artist_rider_template_items`, `show_rider_items`, colunas novas em `shows` (`rider_public_token`) e `documents` (`is_reimbursed`, `reimbursed_at`), índices e RLS.

### 2.2 Sistema Visual e Design System (Direção "Nocturne" Calibrada)
- `[MODIFY]` [src/styles.css](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/styles.css): Atualização das variáveis `@theme` para a direção Nocturne, com calibração de contraste claro/escuro e animações de 0.18s (`fade + slide-up`).
- `[MODIFY]` [src/components/AppShell.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/components/AppShell.tsx): Navegação principal com links para Agenda, Pessoas & Equipe, e Configurações no padrão visual Nocturne.
- `[NEW]` [src/components/StatusBadge.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/components/StatusBadge.tsx): Componente acessível (ícone + texto) para os 4 estados: Confirmado, Pendente, Exceção, e "Sem exigência configurada" (texto itálico sutil, inconfundível com pendente).

### 2.3 Núcleo de Lógica e Cálculos (TDD)
- `[MODIFY]` [src/lib/g3.ts](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/lib/g3.ts): Refatoração de `computeShowProgress` para cálculo estrito por `show_requirements`, helpers para presets em lote e estatísticas do rider.
- `[NEW]` [src/lib/g3.test.ts](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/lib/g3.test.ts): Testes cobrindo exigências individuais, membro sem exigência, contadores detalhados e status do rider.
- `[MODIFY]` [package.json](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/package.json): Script `"test": "vitest run"` e dependência de desenvolvimento `vitest`.

### 2.4 Telas Administrativas
- `[NEW]` [src/routes/people.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/people.tsx): Gestão de pessoas, contatos com máscara, vínculos com artistas/equipe geral e cadastro de Chave Pix.
- `[MODIFY]` [src/routes/shows.$id.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/shows.$id.tsx): Prancheta do show:
  - Presets de exigência em lote ("Aplicar Passagem + Hotel para Músicos").
  - Aba de Reembolsos com cópia de Pix em 1 toque e switch de liquidação ("Reembolsado").
  - Cards de links separados (Elenco vs Rider) com toasts semânticos para evitar troca de destinatários.
  - Alternância para "Modo Palco" mobile com botões grandes de polegar (>= 48px).
- `[MODIFY]` [src/routes/shows.$id_.ficha.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/shows.$id_.ficha.tsx): Ficha de Produção para impressão A4 com dados da nova estrutura.
- `[MODIFY]` [src/routes/settings.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/settings.tsx): Gestão do Rider Padrão por Artista (categorias, itens, especificações).
- `[MODIFY]` [src/routes/index.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/index.tsx): Agenda com auto-sugestão de elenco e cópia do rider padrão ao cadastrar show.

### 2.5 Rotas Públicas (Sem Login)
- `[MODIFY]` [src/routes/p.$token.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/p.$token.tsx): Página de envio do integrante com checklist dinâmica pessoal (exibe o que já foi recebido e o que falta), checkbox de reembolso e feedback de envio.
- `[NEW]` [src/routes/r.$token.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/r.$token.tsx): Página pública de confirmação do rider para a casa de show com auto-save em tempo real, reversão de status de exceção para confirmado e botão para impressão de via de conferência.

---

## 3. Modelo de Dados

A especificação completa das tabelas, constraints, índices e políticas de segurança RLS está documentada no arquivo anexo:
👉 [specs/001-modulo-1-v1/data-model.md](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/specs/001-modulo-1-v1/data-model.md).

---

## 4. Contratos de API e Funções de Servidor

### 4.1 Server Functions com Validação de Token
1. **`getPublicShowByToken(token: string)`**:
   - Retorna: `{ showId, artistName, city, showDate, venue, members: [{ id, name, role }], documentsSummary: [{ castMemberId, docTypeId, fileName, createdAt }] }`.
   - Permite à tela `/p/$token` renderizar a checklist pessoal dinâmica instantaneamente ao selecionar o nome.
2. **`getPublicRiderByToken(riderToken: string)`**:
   - Retorna: `{ showId, artistName, city, showDate, venue, items: [{ id, category, itemName, specification, quantity, isMandatory, status, exceptionNote, confirmedAt }] }`.
3. **`updateRiderItemStatus(riderToken: string, itemId: string, status: 'confirmed' | 'exception', note?: string)`**:
   - Salva a alteração em tempo real (auto-save), atualiza `confirmed_by_venue_at` e permite reversão imediata de status.

---

## 5. Riscos Técnicos e Premissas

1. **Retrocompatibilidade:** Nenhum dado do protótipo em produção é perdido; pessoas são backfilled a partir do elenco existente.
2. **Conexões Móveis no Palco:** Páginas públicas são otimizadas para carregamento ultra-rápido (< 100KB gzipped) e touch targets confortáveis (>= 48px).
3. **Contraste de Acessibilidade:** Conformidade estrita com WCAG 2.2 AA através da calibração do tom lilás no tema claro.

---

## 6. Arquitetura de Segurança (OWASP Top 10:2025 & Padrões Seguros por Padrão)

O Módulo 1 incorpora segurança por padrão em todas as camadas da aplicação:

1. **A01:2025 — Prevenção de Controle de Acesso Quebrado (BOLA / IDOR):**
   - No painel administrativo: Todo acesso aos dados é protegido por Row Level Security no PostgreSQL (`user_id = auth.uid()`).
   - Nas rotas públicas anônimas (`/p/$token` e `/r/$token`): A verificação de permissão é validada exclusivamente no servidor. A atualização de itens de rider exige a amarração atômica de `show_id` e `rider_public_token`, impedindo manipulação de itens de outros shows.
2. **A02:2025 — Configuração Segura & Gestão de Segredos:**
   - Segredos administrativos (`SUPABASE_SERVICE_ROLE_KEY`) operam exclusivamente no backend (Nitro server handlers) e nunca são prefixados com `VITE_` nem enviados ao bundle do cliente.
   - Arquivo `.env` protegido no `.gitignore` desde a concepção.
3. **A04:2025 — Proteção de Dados Sensíveis e Entropia Criptográfica:**
   - Os tokens públicos (`public_token` e `rider_public_token`) utilizam `encode(gen_random_bytes(9), 'hex')`, gerando 72 bits de entropia criptográfica nativa no PostgreSQL — invulnerável a varredura ou ataques de força bruta.
   - Dados sensíveis de integrantes (como Chave Pix e CPF) **nunca são trafegados** para páginas públicas, ficando restritos à sessão autenticada do produtor.
4. **A05:2025 — Prevenção de Injeção de Código e SQL:**
   - Todas as operações utilizam o SDK do Supabase com consultas estritamente parametrizadas pelo PostgREST. Nenhuma consulta concatena dados de entrada do usuário.
5. **A08:2025 — Integridade de Dados & Proteção contra Stored XSS:**
   - Upload de comprovantes possui validação tripla no servidor: formato de extensão, tamanho máximo (20MB) e verificação do MIME type real nos metadados do storage. Formatos de risco de script (como `.svg`, `.html`, `.exe`) são terminantemente rejeitados.
6. **A10:2025 — Tratamento de Erros Seguro:**
   - Mensagens de erro visíveis ao usuário final são padronizadas e amigáveis via Zod, sem expor stack traces, caminhos de arquivo internos ou logs de infraestrutura.

---

## 7. Fora de Escopo Técnico desta Implementação

- Não será implementado envio de notificações ativas por WhatsApp ou e-mail nesta etapa (depende da infraestrutura do Módulo 3 / Módulo 5).
- Não haverá suporte offline com IndexedDB (o app continuará operando via SSR + React Query com cache de curta duração).
- Não haverá edição colaborativa em tempo real com WebSockets tipo Google Docs para o rider; atualizações são refletidas por invalidação de query do React Query.
