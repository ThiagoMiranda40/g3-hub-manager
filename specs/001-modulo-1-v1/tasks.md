# Tasks — Módulo 1 V1: Controle de Tour + Rider Técnico Digital

## Sequenciamento de Execução por Dependência

```
T-01 (Setup Vitest / TDD) ──► T-03 (Lógica TDD g3.ts) ──┐
                                                         │
T-02 (Migration Schema & RLS) ──────────────────────────┼──► T-05 (Catálogo de Pessoas) ──► T-06 (Criação de Show & Sugestão Elenco)
                                                         │                                           │
T-04 (Design System Nocturne) ───────────────────────────┴──► T-07 (Painel Show & Exigências) ◄─────┘
                                                                 │
                                                                 ├──► T-08 (Envio Público de Documentos)
                                                                 ├──► T-09 (Catálogo Rider Padrão)
                                                                 ├──► T-10 (Confirmação Pública de Rider)
                                                                 └──► T-11 (Conferência Física & Ficha A4)
                                                                          │
                                                                 ┌────────┴───────────────────────────┐
                                                                 ▼                                    ▼
                                                          T-12 (Extração IA - Stretch)      T-13 (Validação E2E & Build)
```

---

## T-01 — Infraestrutura de Testes Automatizados com Vitest
- **Depende de:** Nenhuma
- **Arquivos afetados:**
  - `package.json`
  - `vite.config.ts`
- **Fazer:**
  1. Instalar `vitest` como dependência de desenvolvimento: `npm install -D vitest`.
  2. Adicionar o script `"test": "vitest run"` no `package.json`.
  3. Criar um teste rápido de sanidade para garantir que a suíte executa e valida asserções básicas.
- **Verificação técnica:** `npm test`
- **Tradução em linguagem simples:** "O ambiente de testes foi configurado: o Antigravity agora pode escrever e executar testes unitários sozinho com um comando, garantindo que a lógica de negócios não quebre ao longo do desenvolvimento."

---

## T-02 — Banco de Dados: Migração das Novas Entidades e Políticas RLS
- **Depende de:** Nenhuma
- **Arquivos afetados:**
  - `[NEW] supabase/migrations/20260904100000_modulo1_v1_schema.sql`
- **Fazer:**
  1. Escrever o script SQL com as tabelas: `people`, `person_artists`, `show_requirements`, `artist_rider_template_items`, `show_rider_items`.
  2. Adicionar as colunas `rider_public_token` na tabela `shows` e `person_id` na tabela `cast_members`.
  3. Criar constraints (`UNIQUE`, `CHECK`), chaves estrangeiras com `ON DELETE CASCADE/SET NULL` e índices de performance descritos em `data-model.md`.
  4. Habilitar RLS em todas as tabelas com políticas para administradores autenticados e permissões pontuais para os tokens públicos de envio de documentos e confirmação de rider.
  5. Incluir rotina de migração/backfill de pessoas únicas a partir dos dados existentes em `cast_members` para não quebrar dados do protótipo em produção.
- **Verificação técnica:** Script SQL validado com sintaxe PostgreSQL rigorosa e aplicado via Supabase CLI ou checagem estática de integridade.
- **Tradução em linguagem simples:** "O banco de dados recebeu a estrutura para guardar pessoas uma só vez, definir exigências por pessoa e show, e armazenar os itens do rider técnico, com proteção total para cada produtor ver apenas seus próprios dados."

---

## T-03 — Ciclo TDD: Lógica de Cálculo de Pendências Individuais e Estatísticas do Rider
- **Depende de:** T-01
- **Arquivos afetados:**
  - `[NEW] src/lib/g3.test.ts`
  - `[MODIFY] src/lib/g3.ts`
- **Fazer:**
  1. **Escrever testes unitários que falham** em `src/lib/g3.test.ts` baseados nos critérios do `spec.md`:
     - Teste 1: Membro com exigências pendentes (Passagem + Hotel) -> contabiliza 2 pendências.
     - Teste 2: Membro sem nenhuma exigência configurada -> `hasRequirement: false`, não adiciona pendência ao total do show e retorna status textual específico.
     - Teste 3: Documento enviado que não estava na lista de obrigatórios -> registrado no total de documentos sem quebrar a contagem percentual.
     - Teste 4: Cálculo de progresso percentual exato (arredondamento e teto).
     - Teste 5: Cálculo do balanço do rider (total de itens, confirmados, exceções, pendentes).
  2. **Implementar em `src/lib/g3.ts`** a nova assinatura de `computeShowProgress` aceitando `requirements: ShowRequirement[]` e os helpers de status de rider até todos os testes passarem.
  3. Rodar a suíte completa e assegurar 100% de sucesso.
- **Verificação técnica:** `npm test -- src/lib/g3.test.ts`
- **Tradução em linguagem simples:** "Testei os cálculos do sistema: se uma pessoa não precisa de passagem, ela não é contada como pendente; se enviar um comprovante extra, o sistema aceita sem distorcer o percentual do show. Todos os cálculos matemáticos e regras de status foram provados."

---

## T-04 — Sistema Visual Definitivo: Direção "Nocturne" e Componentes Base
- **Depende de:** Nenhuma
- **Arquivos afetados:**
  - `[MODIFY] src/styles.css`
  - `[MODIFY] src/components/AppShell.tsx`
  - `[NEW] src/components/StatusBadge.tsx`
- **Fazer:**
  1. Atualizar `src/styles.css` com os tokens da direção **Nocturne** inspirados em `Hub Manager Tour (standalone).html`:
     - Cores principais: acento roxo/lilás único (`#9184d9` / `oklch(0.68 0.15 285)`), tema dark sofisticado (`#161826`) e tema light limpo.
     - Tipografia: Inter para títulos e corpo, monospace refinado para códigos/valores.
     - Cantos arredondados de 8px a 14px (substituindo o visual reto de 0px).
     - Microanimações: `transition: all 0.18s ease` para hover/foco de cards/botões e animação `fade + slide-up` (0.18s) para expansões.
  2. Criar o componente `StatusBadge.tsx` com ícone + texto (WCAG 2.2 AA) cobrindo os 4 estados:
     - `confirmado` (badge verde com ícone de check)
     - `pendente` (badge amarelo/alerta com ícone de relógio)
     - `excecao` (badge roxo/vermelho com ícone de aviso)
     - `sem_exigencia` (texto em itálico sutil, sem badge colorido, visualmente inconfundível com pendente).
  3. Atualizar `AppShell.tsx` com a nova navegação para Agenda, Pessoas & Equipe, e Configurações no padrão visual Nocturne.
- **Verificação técnica:** `npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "O design do sistema foi atualizado para a direção visual definitiva Nocturne: cores elegantes em tons de lilás e grafite, cantos suaves, ícones acessíveis e animações de 0.18s, conforme o modelo aprovado no protótipo de alta fidelidade."

---

## T-05 — Catálogo Centralizado de Pessoas e Vínculos com Artistas
- **Depende de:** T-02, T-04
- **Arquivos afetados:**
  - `[NEW] src/routes/people.tsx`
  - `src/routeTree.gen.ts`
- **Fazer:**
  1. Criar a rota protegida `/people` com a lista de integrantes e equipe sob a conta do administrador.
  2. Implementar formulário/modal para criar e editar pessoa: nome, telefone com máscara, e-mail, função padrão e observações.
  3. Implementar seção de vínculos: checkboxes para marcar os artistas aos quais a pessoa pertence ou checkbox "Equipe Geral" (participa de todas as turnês).
  4. Adicionar filtros por função, artista ou termo de busca.
- **Verificação técnica:** `npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "Agora o produtor pode cadastrar seus músicos e técnicos uma única vez, informando telefone e indicando a quais bandas eles pertencem ou se fazem parte da equipe geral da produtora."

---

## T-06 — Criação de Show com Elenco Sugerido Automaticamente e Instanciação do Rider
- **Depende of:** T-02, T-05
- **Arquivos afetados:**
  - `[MODIFY] src/routes/index.tsx`
- **Fazer:**
  1. No modal de criação de show da Agenda (`/`), ao selecionar um Artista, consultar automaticamente as pessoas vinculadas a esse artista mais as marcadas como "Equipe Geral".
  2. Ao salvar o show:
     - Inserir o show em `shows` (gerando `public_token` e `rider_public_token`).
     - Inserir os registros correspondentes em `cast_members` pré-populando o elenco.
     - Inserir os itens do rider do show em `show_rider_items` clonando o rider padrão daquele artista.
  3. Atualizar o card do show na Agenda com o visual Nocturne, exibindo progresso de documentos e resumo do rider.
- **Verificação técnica:** `npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "Ao cadastrar um novo show para uma banda, o elenco e o rider técnico padrão são carregados automaticamente sem que o produtor precise redigitar tudo do zero."

---

## T-07 — Prancheta do Show: Gestão de Exigências Individuais e Reembolsos
- **Depende de:** T-03, T-04, T-06
- **Arquivos afetados:**
  - `[MODIFY] src/routes/shows.$id.tsx`
- **Fazer:**
  1. Atualizar a tela de detalhe do show com abas ou seções claras: Elenco & Exigências, Documentos Recebidos, Rider Técnico, Reembolsos e Ações Rápidas.
  2. Implementar controle de exigência individual: para cada integrante da lista, o produtor pode marcar quais documentos são obrigatórios para aquela data e definir prazo de entrega (`deadline_date`).
  3. Integrar a nova função `computeShowProgress` para que pessoas sem exigência apareçam com o status sutil "Sem exigência configurada" e não onerem a contagem de pendências.
  4. Adicionar a aba "Reembolsos" filtrando os documentos enviados marcados com `is_reimbursement = true`, somando o valor total em BRL e permitindo visualizar o recibo.
- **Verificação técnica:** `npm test && npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "No painel do show, o produtor agora define exatamente o que cada integrante precisa entregar para aquela viagem e tem uma visão dedicada de todos os pedidos de reembolso com valor total somado."

---

## T-08 — Página Pública de Envio de Documentos com Solicitação de Reembolso
- **Depende de:** T-04, T-07
- **Arquivos afetados:**
  - `[MODIFY] src/routes/p.$token.tsx`
- **Fazer:**
  1. Atualizar a tela pública `/p/$token` para a identidade visual Nocturne.
  2. Ao selecionar um integrante no seletor de nomes, exibir claramente a lista de documentos esperados especificamente para ele naquele show.
  3. No formulário de anexo de arquivo, incluir campo opcional de valor em R$ e checkbox "Solicitar reembolso deste item".
  4. Ao enviar o documento, salvar as colunas `amount` e `is_reimbursement: true` e disparar feedback de confirmação com animação suave.
  5. Tratar estados de token inválido com mensagem clara e amigável orientando contato com a produção.
- **Verificação técnica:** `npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "O integrante acessa o link seguro do show pelo celular, vê os documentos que foram pedidos para ele, anexa o arquivo e pode solicitar o reembolso informando o valor do gasto."

---

## T-09 — Catálogo de Rider Padrão por Artista nas Configurações
- **Depende de:** T-02, T-04
- **Arquivos afetados:**
  - `[MODIFY] src/routes/settings.tsx`
- **Fazer:**
  1. Adicionar na página de Configurações a gestão de Rider Padrão agrupado por Artista.
  2. Permitir cadastrar itens divididos por categorias (`backline`, `som`, `iluminacao`, `camarim`, `outros`), informando nome do item, especificação detalhada, quantidade e se é obrigatório.
  3. Permitir editar, excluir e reordenar itens do rider padrão do artista.
- **Verificação técnica:** `npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "O produtor cadastra a lista oficial de equipamentos de palco e exigências de camarim de cada artista uma vez só, para servir de modelo em todos os shows futuros."

---

## T-10 — Página Pública de Confirmação do Rider pela Casa de Show
- **Depende de:** T-04, T-06, T-09
- **Arquivos afetados:**
  - `[NEW] src/routes/r.$token.tsx`
  - `src/routeTree.gen.ts`
- **Fazer:**
  1. Criar a rota pública `/r/$token` acessada pela casa de show/promotor sem necessidade de login.
  2. Exibir o cabeçalho do evento (artista, data, local) e a lista categorizada de itens do rider com design Nocturne de alta fidelidade.
  3. Implementar interação item a item:
     - Botão "Confirmar": marca o item como atendido (badge verde).
     - Botão "Sinalizar Exceção": revela com transição `fade + slide-up (0.18s)` uma caixa de texto para a casa informar o motivo ou alternativa.
  4. Salvar as alterações em tempo real via Server Function segura validando o token do rider.
  5. Refletir o status e notas de exceção no painel do administrador no detalhe do show.
- **Verificação técnica:** `npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "A casa de show recebe um link exclusivo do rider, confirma item a item o que consegue fornecer e pode apontar exceções com justificativa, para o produtor não ter surpresas no dia do show."

---

## T-11 — Conferência Física no Dia do Show e Atualização da Ficha de Produção A4
- **Depende de:** T-07, T-10
- **Arquivos afetados:**
  - `[MODIFY] src/routes/shows.$id.tsx`
  - `[MODIFY] src/routes/shows.$id_.ficha.tsx`
- **Fazer:**
  1. Na aba de Rider Técnico de `shows.$id.tsx`, adicionar a funcionalidade de conferência presencial (check-in no dia do evento): botão para marcar item como "Recebido Conforme" ou "Com Divergência" com campo para anotação de ocorrência.
  2. Atualizar a rota `shows.$id_.ficha.tsx` para incorporar a nova estrutura de pessoas e o balanço do rider técnico, preservando o layout de impressão A4 livre de botões de navegação.
- **Verificação técnica:** `npm test && npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "No dia do show, a equipe técnica confere fisicamente os equipamentos no palco marcando se foram entregues conforme o combinado. A Ficha de Produção para impressão A4 foi atualizada com os novos dados."

---

## T-12 — Extração Inteligente de Comprovantes e Rider por IA (Stretch Goal)
- **Depende de:** T-07, T-09
- **Arquivos afetados:**
  - `[NEW] src/lib/ai-extraction.ts`
  - `src/routes/shows.$id.tsx`
  - `src/routes/settings.tsx`
- **Fazer:**
  1. Implementar helper `ai-extraction.ts` para conectar a modelo multimodal (Gemini Flash) via chave de API configurada em ambiente seguro.
  2. Função 1: Analisar imagem/PDF de comprovante de viagem (passagem ou nota) e sugerir preenchimento automático de valor, data e número de voo.
  3. Função 2: Importar PDF/DOCX de rider técnico legado e transformá-lo automaticamente em lista estruturada de itens para aprovação do produtor.
- **Verificação técnica:** `npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "Funcionalidade avançada de IA: ao subir um arquivo PDF de passagem ou rider legado, o sistema lê o documento e preenche os campos automaticamente para o produtor apenas revisar e aprovar."

---

## T-13 — Verificação Ponta a Ponta dos Cenários de Aceite e Build de Produção
- **Depende de:** T-01 até T-12
- **Arquivos afetados:** Todos os componentes e rotas do Módulo 1 V1
- **Fazer:**
  1. Executar os 3 cenários-chave ponta a ponta definidos em `spec.md`:
     - Cenário 1: Cadastro de pessoas, criação de show com elenco sugerido e exigência individual configurada.
     - Cenário 2: Envio público de documento por integrante com pedido de reembolso de R$ 85,00 refletindo na aba de reembolsos.
     - Cenário 3: Confirmação do rider pela casa via link público, sinalizando exceção com nota e conferindo reflexo no painel do produtor.
  2. Rodar a suíte de testes unitários: `npm test`.
  3. Executar typecheck estrito: `npx tsc --noEmit`.
  4. Gerar o build de produção: `npm run build` e validar pacote para deploy Cloudflare Workers.
- **Verificação técnica:** `npm test && npx tsc --noEmit && npm run build`
- **Tradução em linguagem simples:** "Todos os 3 fluxos completos do Módulo 1 foram executados de ponta a ponta, todos os testes unitários passaram e o build final foi compilado com 100% de integridade para publicação."
