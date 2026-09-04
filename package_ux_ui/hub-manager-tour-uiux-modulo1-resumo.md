# UI/UX — Módulo 1 V1 (Hub Manager Tour)

> Entregável de handoff para a `sdd-produto-digital`. Passo 9 (revisão de handoff externo) foi aplicado no refino feito pelo Claude Design — o pacote final já incorpora as três correções encontradas nessa revisão (estado "sem exigência configurada", interação de sinalizar exceção com nota, e movimento/transições).

## Personas (herdadas do PRD)
Administrador (logado), Pessoa do elenco/equipe (sem conta, acessa por link), Casa de show/promotor (sem conta, acessa por link do rider — perfil novo).

## Fluxos mapeados
1. Administrador cadastra show → elenco sugerido automaticamente → confirma/ajusta → define exigência por pessoa → rider padrão sugerido → ajusta se necessário → show pronto (dois links gerados).
2. Pessoa acessa link do show → seleciona nome → escolhe tipo de documento → anexa arquivo → marca reembolso se aplicável → confirmação visual. Estados de erro (link inválido) e vazio cobertos.
3. Casa de show acessa link do rider → confirma ou sinaliza exceção item a item (com nota, capturada em campo de texto revelado ao clicar) → status reflete no painel do administrador. Estado vazio (rider não configurado) coberto.

## Arquitetura de informação
Agenda → Show (Elenco, Documentos, Rider, Reembolsos, Ficha de Produção) → Configurações (Funções, Tipos de documento, Rider padrão por artista). Dois pontos de acesso público sem login: envio de documento e confirmação de rider, ambos por show.

## Componentes nomeados
- **Átomos**: botão primário, botão secundário (contorno), badge de status (confirmado / pendente / exceção / sem exigência — quatro estados, não três), campo de upload, campo de texto longo (nota de exceção).
- **Moléculas**: linha de pessoa, linha de documento, linha de item de rider.
- **Organismos**: card de elenco, card de documentos, card de rider, card de reembolsos — todos construídos sobre o mesmo "card de lista".

## Regras de negócio que a interface precisa preservar
- Pendência é sempre por **pessoa + show**, nunca um status único da pessoa sem indicar a qual show pertence.
- O estado "sem exigência configurada" é visualmente distinto de "pendente" (hoje: texto itálico sem badge colorido, diferente das pills usadas nos outros três estados) — não pode virar um "pendente" disfarçado.
- Reembolso é marcado no momento do envio pela própria pessoa, não pré-configurado pelo tipo de documento.

## Decisões de acessibilidade (WCAG 2.2, nível AA)
Status nunca depende só de cor (sempre acompanhado de ícone + texto). Todo campo com rótulo visível, não só placeholder. Ordem de navegação por teclado segue a ordem visual. Mensagens de erro descrevem o quê e como corrigir.

## Decisões conscientes de não-escopo (V1)
Sem atalho de teclado dedicado. Sem "desfazer" pós-exclusão (mitigado por confirmação prévia já existente). Sem seção de ajuda formal (telas autoexplicativas pelo rótulo).

## Sistema visual final — direção "Nocturne"
Escolhida entre 7 direções exploradas pelo Claude Design (2 sistemas, "Turno 1" e "Turno 2"). Características: acento roxo/lilás único, tema claro e escuro com alternância suave, tipografia Inter, ícones Phosphor, cantos de 8–14px, hairlines em vez de sombra pesada. Tokens completos de cor, espaçamento e componente vivem no design system embutido no artefato final (ver Artefatos abaixo) — não duplicar aqui, referenciar o arquivo.

## Movimento (adicionado na correção do Passo 9)
Transição de 0.18s em hover de card/botão (cor de fundo, borda, sombra, transform). Feedback de clique nos botões primários (leve encolhimento). Animação de entrada (`fade + slide-up`, 0.18s) na revelação do campo de nota de exceção e nas trocas de tela.

## Artefatos do pacote final
- `Hub Manager Tour (standalone).html` — o artefato de alta fidelidade definitivo, autocontido (design system, fontes e ícones embutidos), já com as três correções do Passo 9 aplicadas. Esta é a fonte de verdade visual para a SDD referenciar em `plan.md`.
- `hub-manager-tour-uiux-modulo1.jsx` — rascunho estrutural inicial (paleta âmbar, anterior à escolha do Claude Design); mantido só como referência histórica de conteúdo/campos, não de estilo.

## Pendência conhecida, não bloqueante
Nenhuma identificada nesta revisão além do que já está registrado no PRD (extração de documento por IA como stretch da Fase 1, login Google já corrigido).
