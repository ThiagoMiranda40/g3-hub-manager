# Plan — Módulo 1 V1: Controle de Tour + Rider Técnico Digital

## 1. Abordagem Técnica e Arquitetura

O Módulo 1 V1 é construído sobre a arquitetura já estabelecida e validada em produção no repositório:
- **Frontend / SSR:** TanStack Start (React 19) com Nitro (`cloudflare-module`), empacotado via Vite 8.
- **Roteamento:** TanStack Router (`@tanstack/react-router`) com arquivos de rota em `src/routes/` e tipagem em tempo de compilação via `routeTree.gen.ts`.
- **Estilização e Design System:** Tailwind CSS v4 com sistema visual definitivo **Nocturne** (acento roxo/lilás `#9184d9`, Inter para toda a hierarquia tipográfica, cantos de 8px a 14px, hairlines e transições suaves de 0.18s), espelhando o artefato de referência `package_ux_ui/Hub Manager Tour (standalone).html`.
- **Backend e Persistência:** Supabase (PostgreSQL 15+, Auth, Storage para PDFs e imagens de comprovantes no bucket `documentos`), com Row Level Security (RLS) mandatória em todas as tabelas.
- **Server Functions e RPC:** Rotas públicas (`/p/$token` e `/r/$token`) utilizam funções de servidor seguras (`createServerFn` / Nitro handlers) com validação de tokens e tipagem Zod, impedindo exposição de dados sensíveis ou acesso não autorizado ao banco.
- **Estratégia de Testes e TDD:** Introdução de suíte de testes unitários com `vitest` para validação isolada do cálculo de pendências individuais, regras de transição de status do rider e helpers de formatação.

---

## 2. Arquivos e Interfaces Afetados

### 2.1 Banco de Dados e Migrações
- `[NEW]` [supabase/migrations/20260904100000_modulo1_v1_schema.sql](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/supabase/migrations/20260904100000_modulo1_v1_schema.sql): Criação das tabelas `people`, `person_artists`, `show_requirements`, `artist_rider_template_items`, `show_rider_items`, colunas novas em `shows` (`rider_public_token`) e `cast_members` (`person_id`), índices e políticas de RLS completas.

### 2.2 Sistema Visual e Design System (Direção "Nocturne")
- `[MODIFY]` [src/styles.css](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/styles.css): Atualização das variáveis `@theme` e tokens CSS (substituição da paleta quente/laranja pelo sistema Nocturne: acento lilás/roxo `#9184d9`, superfícies dark `#161826` e light refinado, border-radius 8–14px, microinterações e transições de 0.18s).
- `[MODIFY]` [src/components/AppShell.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/components/AppShell.tsx): Navegação principal atualizada com links para Agenda, Pessoas & Equipe, e Configurações, aplicando os tokens visuais Nocturne.
- `[NEW]` [src/components/StatusBadge.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/components/StatusBadge.tsx): Componente padronizado para os 4 estados visuais: Confirmado, Pendente, Exceção, e o estado sutil "Sem exigência configurada" (itálico sem badge colorido).

### 2.3 Núcleo de Lógica e Cálculos (TDD)
- `[MODIFY]` [src/lib/g3.ts](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/lib/g3.ts): Refatoração de `computeShowProgress` para calcular progresso e pendências estritamente baseado na tabela `show_requirements` (pessoa + show específico), adição de funções de estatísticas de rider e helpers de status.
- `[NEW]` [src/lib/g3.test.ts](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/lib/g3.test.ts): Bateria de testes unitários cobrindo todos os casos de cálculo de pendência individual, pessoa sem exigência, documentos excedentes e balanço de itens do rider.
- `[MODIFY]` [package.json](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/package.json): Adição de script `"test": "vitest run"` e dependência de desenvolvimento `vitest`.

### 2.4 Telas e Rotas Administrativas
- `[NEW]` [src/routes/people.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/people.tsx): Rota para gerenciamento do catálogo de pessoas, telefones, funções e vínculos com artistas ou equipe geral.
- `[MODIFY]` [src/routes/shows.$id.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/shows.$id.tsx): Atualização completa da prancheta do show:
  - Adição de abas ou seções: Elenco & Exigências, Documentos, Rider Técnico, Reembolsos e Ações Rápidas.
  - Carregamento automático de elenco com base em vínculos ao criar o show.
  - Gerenciador de exigências individuais (modal ou linha expansível por integrante).
  - Visualização de itens do rider do show, status de resposta da casa e notas de exceção.
  - Aba de reembolsos com somatório financeiro consolidado.
- `[MODIFY]` [src/routes/shows.$id_.ficha.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/shows.$id_.ficha.tsx): Adaptação da Ficha de Produção para impressão A4 com dados da nova estrutura de pessoas e resumo do rider.
- `[MODIFY]` [src/routes/settings.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/settings.tsx): Adição da gestão do Rider Padrão por Artista (categorias, itens, especificações e ordenação).
- `[MODIFY]` [src/routes/index.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/index.tsx): Dashboard de shows exibindo progresso individual de pendências e badges de status do rider.

### 2.5 Rotas Públicas (Sem Login)
- `[MODIFY]` [src/routes/p.$token.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/p.$token.tsx): Página de envio de documentos pelo integrante:
  - Exibe exigências específicas da pessoa selecionada.
  - Checkbox para marcar solicitação de reembolso com valor em moeda.
  - Feedback visual e design Nocturne.
- `[NEW]` [src/routes/r.$token.tsx](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/src/routes/r.$token.tsx): Página pública de confirmação do rider para a casa de show / promotor:
  - Lista categorizada (Backline, Camarim, etc.).
  - Ação de "Confirmar" com badge verde.
  - Ação de "Sinalizar Exceção" que revela suavemente (`fade + slide-up 0.18s`) o campo de texto para a nota/justificativa.
  - Salvamento imediato via Server Function autenticada por token.

---

## 3. Modelo de Dados

A especificação completa das tabelas, constraints, índices e políticas de segurança RLS está documentada detalhadamente no arquivo anexo:
👉 [specs/001-modulo-1-v1/data-model.md](file:///c:/Users/conta/OneDrive/Documentos/Tríade%20Tecnologia%20e%20Soluções/Desenvolvimento%20de%20Sistemas/Hub%20Manager%20Tour/hub-manager-tour/specs/001-modulo-1-v1/data-model.md).

---

## 4. Contratos de API e Funções de Servidor

### 4.1 Server Functions para Acesso Público com Validação de Token
1. **`getPublicShowByToken(token: string)`**:
   - Retorna: `{ showId, artistName, city, showDate, venue, members: [{ id, name, role }] }`.
   - Regra: Valida se o `public_token` existe na tabela `shows`.
2. **`getPublicRiderByToken(riderToken: string)`**:
   - Retorna: `{ showId, artistName, city, showDate, venue, items: [{ id, category, itemName, specification, quantity, isMandatory, status, exceptionNote }] }`.
   - Regra: Valida se o `rider_public_token` existe e retorna apenas os itens de rider do show correspondente.
3. **`updateRiderItemStatus(riderToken: string, itemId: string, status: 'confirmed' | 'exception', note?: string)`**:
   - Valida o token contra o item e atualiza as colunas `status`, `exception_note` e `confirmed_by_venue_at`.

### 4.2 Lógica de IA para Extração de Documentos (Stretch Goal)
- Server Function `extractDocumentData(filePath: string)` acionada opcionalmente via Supabase Edge Function ou chamada Gemini multimodal com prompt especializado para reconhecer:
  - Passagens aéreas: Companhia, código da reserva (PNR), número do voo, data/hora e trecho.
  - Notas Fiscais / Comprovantes: Valor total, data de emissão, CNPJ/Razão Social.
  - Rider Técnico legado: Extração de tabela/texto em categorias e itens.

---

## 5. Riscos Técnicos e Premissas

1. **Premissa de Retrocompatibilidade:** Shows já cadastrados no protótipo em produção não podem perder vínculos com arquivos existentes no Supabase Storage (`bucket: documentos`). A migration mantém a tabela `cast_members` intacta, adicionando a coluna opcional `person_id`, permitindo convivência perfeita com dados anteriores.
2. **Performance em Dispositivos Móveis no Palco:** A página do rider e o upload público serão acessados frequentemente por smartphones em conexões 4G instáveis de casas de evento. O payload das server functions deve ser enxuto (sem carregar base64 desnecessário no HTML inicial).
3. **Prevenção de Falso Positivo em Pendências:** O cálculo de pendências nunca deve marcar uma pessoa sem exigência configurada como "pendente". Isso é garantido por constraint de teste unitário e por representação de estado distinta (`hasRequirement: false`).
4. **Isolamento de Concorrência no Rider:** A casa de show pode preencher o rider em momentos distintos; cada alteração é salva por item com debounce e atualização atômica no banco.

---

## 6. Fora de Escopo Técnico desta Implementação

- Não será implementado envio de notificações ativas por WhatsApp ou e-mail nesta etapa (depende da infraestrutura do Módulo 3 / Módulo 5).
- Não haverá suporte offline com IndexedDB (o app continuará operando via SSR + React Query com cache de curta duração).
- Não haverá edição colaborativa em tempo real com WebSockets tipo Google Docs para o rider; atualizações são refletidas por invalidação de query do React Query.
