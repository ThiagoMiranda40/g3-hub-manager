# PRD Completo — Hub Manager Tour (Visão de Produto)

> Nome de trabalho atualizado: **Hub Manager Tour** — o nome anterior ("G3 Hub") fazia alusão direta à Oficina G3 e foi descartado por risco de direito de marca. **Esta troca ainda é só no papel**: o app em produção, o repositório (`g3-hub-manager`) e o domínio (`g3hubmanager.triadetecnologiaesolucoes.com.br`) continuam com o nome antigo até renomearmos de fato — isso entra como tarefa da Fase 1 (MVP V1), não precisa ser feito antes de continuar o PRD.
>
> Este é o PRD de visão integral do produto, escrito depois da validação prática do protótipo (Módulo 1) hoje em produção. Ele parte de decisões já testadas com uso real (não hipóteses), e serve de base para o desenvolvimento via Spec-Driven Development no Antigravity, além de um documento comercial/roadmap para apresentar ao Jeff.

## 1. Visão do Produto

O Hub Manager Tour nasce resolvendo um problema concreto e caro — falha de controle logístico de tour (o caso do integrante que esqueceu de comprar passagem, gerando prejuízo) — mas a ambição é maior: ser o **sistema operacional de uma produtora de eventos musicais**, cobrindo do controle interno de logística até a venda de ingresso ao público final e a gestão financeira/jurídica da operação, com IA aplicada em cada ponto onde ela reduz trabalho manual repetitivo sem tirar a decisão final das mãos de quem responde pelo negócio.

O produto nasceu para o Jeff (produtor de Oficina G3, Rodox, Rodolfo Abrantes, Pregador Luo), mas o desenho — cada conta isolada por `user_id`, com cadastro de administrador autoatendido — já suporta desde o V1 a venda para outras produtoras, sem mudança estrutural.

## 2. O que o protótipo já validou (base real, não suposição)

- O loop central (cadastrar show → elenco → link sem login → upload de documento → painel de pendência) funciona e foi testado com dado real.
- A modelagem de "documento obrigatório" **precisa** ser individual (pessoa + show + tipo), não uma regra global por tipo de documento — isso ficou evidente testando com elenco real, não foi suposição de design.
- Elenco hoje é recadastrado a cada show; precisa virar cadastro único de pessoa, vinculada a artista(s) ou "equipe geral".
- **Login social (Google) já corrigido e funcionando** — a dependência da biblioteca proprietária do Lovable foi eliminada, substituída pelo método padrão do Supabase, com app OAuth configurado no Google Cloud Console. Login por e-mail/senha e cadastro autoatendido também já validados em produção.
- Custo de hospedagem ficou em zero (Cloudflare Workers + domínio que a Tríade já possuía).

## 3. Personas

- **Administrador de produção** (Jeff, e futuros clientes): cria a própria conta, gerencia artistas, tours, shows, elenco, e acompanha pendências.
- **Integrante/equipe de produção**: sem conta própria no MVP; acessa por link do show para enviar documentos.
- **Comprador de ingresso** (a partir da Fase 5): pessoa física que compra ingresso para um show; começa como dado importado de plataforma terceira, e passa a comprar direto pelo Hub a partir da Fase 6.
- **Futuro cliente do Hub Manager Tour** (a partir da fase comercial): qualquer produtora/produtor de eventos que se cadastre sozinho, sem intervenção de Thiago — trazido, em boa parte, pela própria rede de contatos do Jeff (ver Seção 6).

## 4. Mapa de Módulos

| Módulo | Fase | Status | Resolve |
|---|---|---|---|
| 1 — Controle de Tour (+ Rider Técnico) | 0 (protótipo) → 1 (MVP V1) | ✅ Protótipo validado; V1 em desenvolvimento | Pendência de documentos, elenco, Ficha de Produção, rider técnico |
| 6a — Contratos & Assinatura | 2 | Planejado, adiantado nesta revisão | Geração/análise de contrato por IA, assinatura digital via Autentique |
| 2 — Logística Inteligente (+ Fornecedores) | 3 | Planejado | Pesquisa/comparação de passagem, hospedagem e fornecedor local |
| 3 — CRM & Marketing de Audiência | 4 | Planejado | Reativação de base de compradores por cidade/show |
| 4a — Importação de Venda de Ingressos | 5 | Planejado | Consolidar dados de venda já existentes em plataformas terceiras |
| 4b — Checkout Próprio | 6 | Planejado | Venda de ingresso direta pelo Hub — motor de monetização |
| 5 — Agente Operacional Conversacional | 7 | Planejado | Jeff opera o sistema por voz/texto/imagem |
| 6b — Financeiro | 8 | Planejado | Contas a pagar/receber, fluxo de caixa, gráficos, recomendações por IA |

### 4.1 Módulo 1 — Controle de Tour + Rider Técnico Digital (Protótipo validado → MVP V1)

**Revisão de escopo pro V1 (correção estrutural, não feature nova):**

- **Pessoa cadastrada uma vez**: banco de pessoas do administrador, cada uma vinculada a um ou mais artistas, ou marcada como "equipe geral". Ao criar um show, o elenco sugerido vem desse vínculo; o administrador ajusta por show.
- **Exigência individual**: por pessoa + show específico, o administrador define quais tipos de documento são esperados e se são reembolsáveis. Pendência sempre calculada por show, nunca globalmente pela pessoa.
- **Reembolso** marcado no momento do envio pela própria pessoa.
- **Cadastro de pessoa** guarda contato (telefone) — pré-requisito de dado para o Módulo 5.
- Edição/exclusão de show, remoção de elenco, exclusão de documento, Ficha de Produção — já implementados, mantidos.
- **Rebranding**: renomear app, repositório e domínio para o nome definitivo.

**Rider Técnico Digital (novo, incorporado ao Módulo 1):**

Resolve um problema clássico de produção que nenhuma ferramenta do mercado cobre bem: o rider (lista de exigência de equipamento de palco/som e de camarim) hoje é um PDF mandado por e-mail e ignorado — as surpresas só aparecem no dia do show.

Funcionamento: o administrador cadastra o **rider padrão de cada artista uma vez** (mesma lógica de "cadastrar uma vez" já usada para pessoa) — backline, itens de camarim. Ao criar um show, esse rider é sugerido automaticamente, ajustável por show. Um **link do rider desse show** (mesmo padrão sem login do link de documento) é enviado à casa/promotor, que confirma item a item o que consegue prover, sinalizando exceção onde não pode. No painel, o administrador vê o status de cada item **antes do dia do show** — não descobre em cima da hora. No dia, a equipe técnica confere fisicamente e marca "recebido conforme" ou "com divergência", criando histórico auditável.

**Onde a IA atua:** extração automática de um rider já existente em PDF/Word (que o administrador provavelmente já tem) para popular o checklist estruturado sem digitação manual — reaproveita a mesma extração de documento do restante do módulo.

**Onde a IA já atua ou deveria atuar no restante do módulo:** extração automática de dados do documento enviado (nº de voo, valor, hotel) a partir da imagem/PDF — ficou como *stretch* no protótipo por orçamento de crédito. Prioridade alta para o V1.

### 4.2 Módulo 6a — Contratos & Assinatura (adiantado nesta revisão)

Movido para logo após o MVP, porque não depende de receita de ingresso circulando pelo sistema (diferente do financeiro completo) e é uma necessidade desde o primeiro show cadastrado — todo show precisa de contrato com casa/promotor.

- Geração de contrato por IA (venda de ingresso, contratação de banda/equipe, acordo com casa de show) a partir de um briefing curto.
- Análise e feedback por IA de contrato recebido de terceiro (ex.: contrato pronto que a casa ou contratante envia) — sinaliza cláusula de risco antes da assinatura.
- Assinatura digital automatizada via **Autentique** (API pública documentada, com SDKs de comunidade em PHP e Python já existentes — integração de baixo risco técnico).

### 4.3 Módulo 2 — Logística Inteligente + Fornecedores Locais

Quando uma data de show é criada, um agente pesquisa e compara preços de passagem aérea e hospedagem para a cidade do show, cruzando com a origem de cada pessoa do elenco. Traz opções ordenadas, prontas para aprovação com um clique — nunca fecha a compra sozinho.

**Fornecedores locais (novo, sugerido nesta revisão):** o mesmo motor de busca/comparação se estende a fornecedores locais (equipamento, transporte) por cidade — quando um show é cadastrado numa praça nova, o agente já sugere opções por proximidade e histórico de uso, em vez de o administrador ter que pesquisar do zero a cada vez.

Depende de: Módulo 1 com modelo de pessoa/vínculo maduro.

**Onde a IA atua:** agente de busca/comparação (navegação automatizada ou parceria de afiliados), ranqueamento por critério configurável.

### 4.4 Módulo 3 — CRM & Marketing de Audiência

Reativação de base de compradores de ingresso por cidade/show, com comunicação segmentada para evitar bloqueio de número. Testar WhatsApp via Evolution API ou similar como alternativa de custo à API oficial da Meta.

**Risco documentado, não resolvido:** base legal de tratamento do dado de comprador vindo de plataforma terceira precisa validação jurídica antes de qualquer disparo real.

**Onde a IA atua:** geração de mensagem personalizada por segmento, classificação de resposta, otimização de horário de envio.

### 4.5 Módulo 4a — Importação de Venda de Ingressos

Importar/consumir dados de venda das plataformas que o Jeff usa hoje (Ticket Master, Ticket Agora), automatizando via API/webhook onde a plataforma permitir. Objetivo: parar de depender de relatório manual, alimentar o CRM com dado real, sem ainda mexer em pagamento. Sozinho, não resolve a taxa alta cobrada por essas plataformas — isso só é resolvido na Fase 6.

### 4.6 Módulo 4b — Checkout Próprio (motor de monetização)

O Hub Manager Tour processa a venda do ingresso diretamente — checkout, pagamento (via Asaas ou AbacatePay, nunca processando cartão diretamente), emissão de ingresso.

- **Reduz taxa, com dado real validado**: Sympla cobra 10% de serviço + 2 a 2,5% de processamento (mínimo R$ 3,99/ingresso); Ingresse chega a 17% (12% + 5%). Checkout próprio com taxa menor é argumento comercial concreto.
- Centraliza o dado de comprador, eliminando a fragmentação que hoje obriga o Módulo 4a a existir.
- **É a peça central do modelo de monetização** (Seção 6).

Exige: gateway parceiro (Asaas/AbacatePay), conformidade de meio de pagamento via checkout hospedado pelo gateway, split de repasse ao artista/casa.

### 4.7 Módulo 5 — Agente Operacional Conversacional

Jeff interage por voz, texto ou imagem (WhatsApp ou chat próprio) para: cadastrar show, delegar exigência individual com prazo, consultar status, receber lembretes automáticos — resolvendo de vez o problema original (a passagem esquecida).

Depende de: extração de dados por IA validada, modelo de exigência individual implementado.

**Onde a IA atua:** todo o módulo é IA — voz, interpretação de intenção, orquestração de ação, lembrete proativo.

### 4.8 Módulo 6b — Financeiro

- Contas a pagar e a receber por show/tour/artista.
- Fluxo de caixa consolidado, com projeção.
- Gráficos e relatórios (receita por show, custo de logística por tour, margem por artista).
- Recomendações por IA a partir de padrão de gasto/receita.
- **Split automático de cachê**: divisão do valor recebido por show entre integrantes/equipe/management por percentual pré-acordado.

**Posicionamento no roadmap:** mantido tarde (Fase 8) porque ganha muito mais valor quando o sistema já tem receita real fluindo por dentro dele (a partir do Módulo 4b) — puxa venda e despesa automaticamente, em vez de lançamento manual.

## 5. Modelo de dados consolidado (visão V1)

```
Administrador (conta isolada por user_id)
 └── Pessoa (cadastrada uma vez; telefone; vínculo com Artista(s) ou "equipe geral")
 └── Artista
      ├── Rider padrão (backline, camarim — reaproveitado por show)
      └── Tour
           └── Show (cidade, data, local)
                ├── Elenco do Show (sugerido do vínculo Pessoa↔Artista, ajustável)
                │      └── Exigência (pessoa + este show + tipo de documento +
                │          obrigatório/reembolsável + prazo)
                │             └── Documento (enviado pela pessoa, com valor
                │                 opcional e marcação de reembolso própria)
                ├── Rider do Show (herdado do padrão, com status de confirmação
                │   por item pela casa/promotor)
                └── link_publico (token de acesso sem login, por show)
```

## 6. Modelo de negócio — parceria, não licenciamento

O Hub Manager Tour **não é vendido ao Jeff como produto**. O modelo é **parceria com percentual sobre venda de ingresso**, nascendo com o Módulo 4b: Thiago fica com um percentual acordado de cada ingresso vendido através do Hub nas turnês do Jeff, em troca de manter e evoluir o sistema.

O conhecimento de mercado e a rede de contatos do Jeff entre outras produtoras grandes viram o canal de vendas natural do Hub para novos clientes — com Jeff também ganhando nessas parcerias futuras.

**Shows sem ingresso a monetizar** (contrato com prefeitura, evento fechado/corporativo): como não há venda de ingresso nesses casos, a remuneração por percentual sobre ingresso não se aplica. Nesses shows, negocia-se um percentual menor sobre o valor do **contrato do evento** (o cachê pago à produção/artista), mantendo a lógica de parceria mesmo quando não há bilheteria.

Até a Fase 6 (checkout próprio) existir, o sistema roda como investimento de relacionamento — sem cobrança. O V1 já suporta múltiplos administradores isolados nativamente, requisito técnico mínimo para esse modelo de expansão via indicação.

**Nota de posicionamento (do benchmarking, Seção 9):** um diferencial simples e barato de implementar é manter **preço público e transparente** desde o início da fase comercial — o principal concorrente indireto (MeEventos) esconde valores de plano atrás de contato com vendedor, o que já gerou reclamação pública de cliente sobre falta de transparência.

## 7. Arquitetura técnica

### 7.1 Base validada em produção

- **Stack**: TanStack Start (React 19) + Nitro + Supabase (Postgres, Auth, Storage), mesmo padrão do [[apoie-o-ballet]].
- **Hospedagem**: Cloudflare Workers, deploy automático via Git, sem custo no estágio atual.
- **Variáveis de build** (`VITE_*`) separadas das de runtime (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) — padrão documentado para os próximos módulos.
- **Segurança**: RLS habilitado em todas as tabelas, isolamento por `user_id`; upload público valida token e tipo/tamanho de arquivo no servidor.

### 7.2 Custo de hospedagem Cloudflare por estágio de crescimento

- **Gratuito**: 100 mil requisições/dia, 10ms de CPU por requisição (tempo de processamento, não de espera — chamadas ao Supabase que só aguardam resposta não consomem esse limite), 50 sub-requisições por invocação. Confortável para a fase atual de teste.
- **Pago**: a partir de US$ 5/mês (~R$ 27), incluindo 10 milhões de requisições e 30 milhões de "CPU-ms" por mês; acima disso, US$ 0,30/milhão de requisições e US$ 0,02/milhão de CPU-ms extra. Exemplo real de referência: 50 milhões de requisições/mês (uso bem além do inicial) ficaria em torno de US$ 24/mês.
- **Gatilho de migração recomendado**: não é técnico, é de responsabilidade — assim que uma produtora além de Jeff/Thiago passar a depender do sistema no dia a dia (por volta da Fase 4/5), vale migrar por segurança, não esperar bater o teto gratuito (erro 1027) na frente de um cliente.
- **Em aberto**: custo de produtos mais avançados (Browser Rendering, Containers) ainda não pesquisado — verificar quando os Módulos 2/5 estiverem próximos de construção.

### 7.3 A plataforma Cloudflare comporta o crescimento planejado

| Necessidade futura | Módulo | Produto Cloudflare |
|---|---|---|
| Agente de busca/comparação (OTA, fornecedor local) | 2 | **Browser Rendering** |
| Processo de várias etapas, que espera aprovação humana | 2, 4b | **Workflows** |
| Lembrete agendado, verificação periódica de prazo | 1, 5 | **Cron Triggers** |
| Fila de tarefa em segundo plano | 1 | **Queues** |
| Estado em tempo real (conversa do agente) | 5 | **Durable Objects** |
| Serviço que precisa rodar continuamente (bridge WhatsApp) | 3, 5 | **Containers** |
| Armazenamento de arquivo em maior volume | 1, 4 | **R2** |
| Chamada a gateway de pagamento ou assinatura digital | 4b, 6a | Worker comum (HTTP) |

**Limite técnico a ter em mente**: Cron Triggers, Queues e alarmes de Durable Object têm teto de 15 minutos por disparo — processo mais longo deve ser quebrado via Workflows.

## 8. Segurança e conformidade — riscos documentados

- **LGPD**: base legal de tratamento do dado de comprador de plataforma terceira não resolvida — bloqueia disparo de marketing real do Módulo 3.
- **Leaked Password Protection**: indisponível no plano Free do Supabase — lacuna aceita nesta fase.
- **Meio de pagamento** (Módulo 4b): conformidade PCI via gateway terceirizado, nunca cartão direto pelo servidor.
- **Contratos assinados digitalmente** (Módulo 6a): validade jurídica depende do nível de autenticação da Autentique — decidir caso a caso.

## 9. Benchmarking — panorama competitivo

### 9.1 Fora do Brasil

**Master Tour** (Eventric): referência do setor, +150 mil turnês, itinerário/logística/"tour accounting", a partir de US$ 60/mês. **Gigwell**: agências de booking, contratos, cobrança. **Prism.fm, ABOSS, Stagent, Overture, Muzeek, BandMGT, Back On Stage**: nichos menores. Nenhum é brasileiro, nenhum vende ingresso, nenhum tem IA operacional.

### 9.2 No Brasil — correção importante desta revisão

Não existe ferramenta brasileira **especializada** em turnê musical, mas a **MeEventos** ("usada em 1 a cada 10 eventos no Brasil") tem uma página de segmento "Bandas e Artistas" — vale reconhecer isso, embora o conteúdo dessa página seja genérico, reaproveitado do mesmo template usado para casamento, buffet e outros segmentos, não desenhado especificamente para a realidade de turnê.

**Comparação detalhada:**

| | MeEventos tem | Hub Manager Tour tem |
|---|---|---|
| Documento individual por pessoa do elenco por show (passagem, hotel, reembolso) | ❌ | ✅ (núcleo do produto) |
| Venda de ingresso pro público (checkout) | ❌ (foco em evento privado/corporativo) | ✅ (Módulo 4) |
| Agente de busca/comparação de passagem, hospedagem, fornecedor | ❌ | ✅ (Módulo 2) |
| Rider técnico estruturado com confirmação da casa | ❌ (só lista simples de material) | ✅ (Módulo 1) |
| Funil de vendas com rastreamento de proposta | ✅ | Não priorizado (Jeff não vende pra lead frio) |
| Área do cliente / portal do contratante | ✅ | Não priorizado no MVP |
| Cobrança via boleto/cartão com baixa automática | ✅ | Cobrimos diferente, via checkout do Módulo 4b |
| Atendimento omnichannel (MeChat) | ✅ | Nosso agente (Módulo 5) é operação interna, não atendimento a cliente |
| Conciliação bancária automática (OpenFinance) | ✅ | Candidato pro Módulo 6b |
| Contratos com template autopreenchido | ✅ | Vamos além: geração por IA + análise de risco (Módulo 6a) |
| Cadastro de fornecedores | ✅ (lista simples) | Vamos além: sugestão automática por IA (Módulo 2) |

**Preço**: não consegui confirmar valores exatos — o site esconde atrás de formulário de contato, e uma reclamação pública (Reclame Aqui) de cliente real confirma que o valor do plano só é revelado no atendimento. Isso é uma oportunidade de diferencial barata: manter preço público e transparente desde o início da fase comercial (ver Seção 6).

### 9.3 Venda de ingresso — taxas que validam o Módulo 4b

Sympla: 10% + 2 a 2,5% de processamento (mínimo R$ 3,99/ingresso). Ingresse: 12% + 5% = 17% no total.

### 9.4 Assinatura digital + IA — direção já validada

A D4Sign (concorrente direta da Autentique) já lançou "IA que resume, analisa e ajuda a gerenciar contratos" com envio via WhatsApp — confirma que a combinação é tendência validada, não risco de originalidade. Autentique tem API pública documentada, com SDKs de comunidade (PHP, Python).

### 9.5 Conclusão do benchmarking

O espaço em branco real está na **combinação**: nenhum concorrente (nacional ou internacional) junta logística de turnê específica pra banda + venda de ingresso com taxa menor + rider técnico + financeiro + contrato/assinatura + agente de IA operacional num produto só, pensado pro mercado brasileiro de produção musical.

## 10. Roadmap de fases

- **Fase 0 — Protótipo (concluída)**: validação do Módulo 1, hoje em produção própria, sem custo.
- **Fase 1 — MVP V1**: Módulo 1 revisado + Rider Técnico Digital, extração de documento por IA, rebranding, primeiro visual com Claude Design.
- **Fase 2**: Módulo 6a — Contratos & Assinatura (adiantado).
- **Fase 3**: Módulo 2 — Logística Inteligente + Fornecedores Locais.
- **Fase 4**: Módulo 3 — CRM/marketing, com validação jurídica de LGPD antes de disparo real.
- **Fase 5**: Módulo 4a — importação de venda de ingresso.
- **Fase 6**: Módulo 4b — checkout próprio — início da monetização real.
- **Fase 7**: Módulo 5 — agente conversacional operacional.
- **Fase 8**: Módulo 6b — financeiro completo.

## 11. Próximos passos

1. Atualizar o documento comercial/roadmap para o Jeff (Claude Design) com a estrutura de módulos revisada.
2. Entrar na `sdd-produto-digital` com o Módulo 1 V1 (Fase 1) — passando antes pela `ui-ux-produto-digital` e, ao longo do processo, `ciberseguranca-produto-digital` e `qa-tdd-produto-digital`.
3. Executar o rebranding como parte da Fase 1.
