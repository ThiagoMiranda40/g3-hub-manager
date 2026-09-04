# UI/UX — Módulo 1 V1 (Hub Manager Tour)

> Entregável de handoff para a `sdd-produto-digital`. Passo 9 (revisão de handoff externo) e Pente Fino de Usabilidade aplicados: o pacote final incorpora o sistema visual definitivo "Nocturne", calibrado contra as 10 Heurísticas de Nielsen e acessibilidade WCAG 2.2 AA.

## Personas (herdadas do PRD)
1. **Administrador de Produção (logado)**: Jeff e produtores — gerenciam catálogo de pessoas, artistas, shows, exigências, rider técnico e reembolsos.
2. **Pessoa do elenco/equipe (sem conta, acesso por link seguro)**: Integrantes e técnicos — acessam para verificar pendências pessoais e enviar documentos/comprovantes.
3. **Casa de show / promotor local (sem conta, acesso por link seguro do rider)**: Gerentes e técnicos das casas de evento — confirmam o atendimento técnico ou sinalizam exceções.

---

## Fluxos Mapeados e Refinamentos de Usabilidade (Pente Fino)

1. **Montagem de Show e Exigências em Lote:**
   - Ao cadastrar show, o elenco sugerido é carregado automaticamente com base nos vínculos de artista e equipe geral.
   - O produtor conta com **presets em lote** (ex.: "Aplicar Passagem + Hotel para toda a banda" com 1 clique), eliminando cliques repetitivos.
   - Contadores discriminam claramente: ativos (concluídos vs pendentes) e pessoas sem exigência nesta data.
2. **Envio Público do Integrante com Checklist Dinâmica (`/p/$token`):**
   - O integrante seleciona seu nome e visualiza instantaneamente sua **checklist pessoal dinâmica**:
     - Itens já entregues: badge verde "Recebido", com nome do arquivo e data (evita envio duplex).
     - Itens pendentes: botão de anexo direto.
   - Opção de marcar "Solicitar reembolso deste item" informando o valor em R$.
3. **Confirmação do Rider com Auto-Save e Impressão Local (`/r/$token`):**
   - A casa de show confirma item a item ou sinaliza exceções com justificativa.
   - **Auto-save visível em tempo real** com indicador de timestamp ("Salvo às HH:MM").
   - **Reversibilidade imediata**: clicar de volta em "Confirmar" reverte o status de exceção sem travas.
   - Botão "Imprimir cópia de atendimento": gera via física limpa para o operador local de palco.
4. **Liquidação Ágil de Reembolsos com Chave Pix:**
   - O cadastro de pessoas guarda Chave Pix (`pix_type`, `pix_key`).
   - Na aba de Reembolsos do show, o produtor tem botão de 1 toque **"Copiar Pix"** e switch para marcar "Reembolsado".
5. **Conferência Presencial de Palco ("Modo Palco"):**
   - No dia do show, a aba de Rider oferece visualização mobile com cards amplos e botões grandes de polegar (>= 48px: "OK Recebido" / "Divergência") para operar em palco com luz baixa.

---

## Arquitetura de Informação
- **Agenda** (`/`) → **Show** (`/shows/$id`):
  - Aba 1: Elenco & Exigências (com presets em lote).
  - Aba 2: Documentos Recebidos.
  - Aba 3: Rider Técnico (com alternância para "Modo Palco").
  - Aba 4: Reembolsos (com somatório financeiro e cópia de Pix).
  - Aba 5: Ficha de Produção (formatação limpa para impressão A4).
- **Pessoas & Equipe** (`/people`): Catálogo centralizado de integrantes, contatos, Pix e vínculos.
- **Configurações** (`/settings`): Tipos de documento, funções e Rider Padrão por Artista.
- **Rotas Públicas Sem Login**:
  - `📱 /p/$token`: Envio de documentos com checklist pessoal.
  - `🏛️ /r/$token`: Confirmação técnica pela casa de show com auto-save.

---

## Componentes Nomeados (Atomic Design)
- **Átomos**:
  - Botão Primário (com micro-scale no clique: 0.98), Botão Secundário (outline), Botão de Ação Rápida ("Copiar Pix", "Preset").
  - Badge de Status (4 estados): `Confirmado` (verde), `Pendente` (amarelo/alerta), `Exceção` (roxo/alerta) e `Sem exigência configurada` (texto itálico sutil sem badge colorido).
  - Campo de Upload com preview, Campo de Nota Expansível.
- **Moléculas**:
  - Linha de Integrante com badges de exigência, Linha de Item de Rider com botões Confirmar/Exceção, Card de Checklist Pessoal.
- **Organismos**:
  - Card de Elenco com cabeçalho discriminado, Card de Reembolsos com totalizador e Pix, Painel de Rider Categorizado, Cards de Compartilhamento de Links com toasts semânticos.

---

## Decisões de Acessibilidade (WCAG 2.2, Nível AA)
1. **Calibração de Contraste no Sistema Nocturne:**
   - No tema escuro (`#161826`), o acento lilás `#9184d9` atinge ratio ~6.5:1 (aprovado).
   - No tema claro, textos interativos e ícones utilizam a variante profunda `#5f4eb8` (ratio > 5.5:1), garantindo conformidade estrita com o critério 1.4.3 do WCAG AA.
2. **Operabilidade e Touch Targets:**
   - Todos os botões e interações touch em ambiente mobile (upload e confirmação do rider) possuem altura mínima de 48px.
3. **Informação Multissensorial:**
   - Status nunca dependem apenas de cor; são sempre acompanhados de ícones distintos e rótulos textuais visíveis.
4. **Mensagens e Feedbacks com ARIA:**
   - Indicador de auto-save e toasts de cópia utilizam `aria-live="polite"`.

---

## Sistema Visual — Direção "Nocturne"
- Acento roxo/lilás único (`#9184d9` dark / `#5f4eb8` light).
- Tipografia: Inter (títulos e corpo) com JetBrains Mono para códigos/tokens/valores.
- Cantos arredondados de 8px a 14px, hairlines e elevações sutis em vez de sombras pesadas.
- Microinterações de 0.18s em hover/clique e transição `fade + slide-up (0.18s)` na revelação de campos.

---

## Artefatos do Pacote
- `Hub Manager Tour (standalone).html`: Fonte de verdade visual de alta fidelidade do Claude Design.
- `specs/001-modulo-1-v1/`: Especificação técnica completa (spec.md, plan.md, data-model.md, tasks.md).
