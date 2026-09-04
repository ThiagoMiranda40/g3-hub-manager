# Spec — Módulo 1 V1: Controle de Tour + Rider Técnico Digital

## O quê e por quê

O Módulo 1 do Hub Manager Tour consolida o núcleo operacional de logística e produção para turnês musicais. Ele substitui controles manuais e planilhas dispersas por uma plataforma centralizada onde o produtor gerencia artistas, datas de shows, elenco fixo e volante, e exigências documentais críticas para viagens (passagens aéreas, vouchers de hotel, notas fiscais e comprovantes de reembolso). Adicionalmente, incorpora o Rider Técnico Digital, digitalizando o checklist de equipamentos de palco (backline) e camarim/catering para que a casa de show ou contratante confirme antecipadamente o atendimento de cada item, prevenindo surpresas no dia da apresentação.

Na versão inicial (protótipo validado), o loop de cadastro de show e link público para envio de documentos provou sua eficácia com dados reais de turnê. No entanto, o uso prático revelou duas limitações estruturais: (1) os integrantes precisavam ser digitados repetidamente a cada nova data cadastrada; e (2) a exigência de documentos era tratada como regra genérica por tipo de documento, quando na realidade cada pessoa em cada show possui demandas logísticas individuais (por exemplo, um integrante local não precisa de hotel ou passagem, enquanto um músico de outra cidade necessita de ambos). O V1 corrige essa base cadastral (pessoa cadastrada uma vez com vínculos de artista ou equipe geral, e exigências definidas por pessoa + show), adiciona a confirmação digital antecipada do rider pela casa de show e implementa a linguagem visual definitiva de alta legibilidade e sofisticação.

---

## Requisitos de Negócio

### RF-01 — Cadastro Centralizado de Pessoas e Vínculos
Como administrador de produção,  
quero manter um catálogo único de pessoas com seus contatos, função padrão e vínculos com artistas ou equipe geral,  
para não precisar redigitar dados e nomes de integrantes a cada novo show cadastrado.

**Critério de aceite:**
- **Dado** que o administrador acessa o módulo de Pessoas/Equipe,  
  **quando** cadastra uma nova pessoa informando nome completo, telefone de contato, função padrão e indica se ela pertence a artistas específicos ou à "equipe geral",  
  **então** a pessoa fica disponível permanentemente para ser escalada em qualquer data desses artistas ou turnês.
- **Dado** uma pessoa já existente,  
  **quando** seus dados de contato ou função forem atualizados,  
  **então** as informações refletem em todas as consultas cadastrais sem duplicar registros.

---

### RF-02 — Sugestão e Ajuste de Elenco por Show
Como administrador de produção,  
quero que ao criar um show para um determinado artista o elenco seja automaticamente sugerido com base nos vínculos cadastrados,  
para agilizar a montagem da escala permitindo ajustes específicos para a data.

**Critério de aceite:**
- **Dado** a criação de um novo show para o Artista A,  
  **quando** a data é salva,  
  **então** o sistema pré-carrega no elenco do show todas as pessoas vinculadas ao Artista A mais as pessoas marcadas como "equipe geral".
- **Dado** a lista de elenco sugerido no show,  
  **quando** o administrador adiciona uma pessoa avulsa ou remove um integrante daquela data específica,  
  **então** a escala daquele show é modificada sem alterar o cadastro permanente da pessoa nem os demais shows.

---

### RF-03 — Exigência Individual de Documentos por Pessoa e por Show
Como administrador de produção,  
quero definir individualmente quais documentos são obrigatórios para cada pessoa em um show específico e estipular prazos,  
para que o cálculo de pendências reflita exatamente o que foi acordado para cada integrante naquela viagem.

**Critério de aceite:**
- **Dado** um integrante escalado no Show X,  
  **quando** o administrador configura que ele necessita de "Passagem" e "Hotel", enquanto outro integrante local não necessita de nenhum documento,  
  **então** o status do primeiro passa a monitorar esses 2 itens e o segundo é classificado expressamente como "Sem exigência configurada".
- **Dado** uma pessoa em um show,  
  **quando** nenhum documento foi configurado como obrigatório para ela,  
  **então** a interface exibe o estado textual "Sem exigência configurada" (itálico suave, sem badge colorido), diferenciando-se explicitamente do estado "Pendente".
- **Dado** uma exigência com prazo de entrega configurado,  
  **quando** a data limite for ultrapassada sem o envio do documento correspondente,  
  **então** a pendência é sinalizada com alerta visual de prazo expirado.

---

### RF-04 — Envio Público de Documentos por Link Seguro (Sem Login)
Como pessoa do elenco ou equipe de produção,  
quero acessar um link seguro sem necessidade de criar conta ou senha,  
para selecionar meu nome, anexar os arquivos solicitados e indicar se o item representa uma despesa reembolsável.

**Critério de aceite:**
- **Dado** que o integrante recebe o link público de documentos daquele show,  
  **quando** acessa a página,  
  **então** visualiza apenas o cabeçalho do show (artista, data, local), a lista de nomes do elenco escalado e as orientações de envio.
- **Dado** que o integrante seleciona seu próprio nome na lista,  
  **quando** anexa um arquivo válido (PDF ou imagem de até 20MB), seleciona o tipo de documento, opcionalmente preenche o valor e marca a opção "Solicitar reembolso",  
  **então** o envio é confirmado com feedback visual claro e o documento é anexado ao registro daquele show.
- **Dado** um link com token inválido, expirado ou inexistente,  
  **quando** acessado,  
  **então** uma tela amigável informa que a página não foi encontrada ou não está mais ativa, orientando contato com a produção.

---

### RF-05 — Painel de Monitoramento de Pendências e Reembolsos do Show
Como administrador de produção,  
quero visualizar no detalhe do show o progresso percentual, o status individual de cada pessoa e a lista de despesas reembolsáveis,  
para agir prontamente sobre quem ainda não enviou passagens ou vouchers e ter clareza dos valores a reembolsar.

**Critério de aceite:**
- **Dado** um show com exigências configuradas,  
  **quando** o painel do show é aberto,  
  **então** o indicador de progresso exibe a contagem consolidada (ex: "8 de 10 documentos recebidos - 80%") e a lista de integrantes com seus respectivos badges (Confirmado, Pendente, Exceção, Sem exigência).
- **Dado** documentos enviados marcados como reembolso,  
  **quando** o administrador acessa a aba ou seção de Reembolsos,  
  **então** visualiza a relação de comprovantes com nome da pessoa, tipo, valor em moeda local, observação e link para visualização do comprovante, com o total consolidado da data.

---

### RF-06 — Catálogo de Rider Padrão por Artista
Como administrador de produção,  
quero cadastrar o rider técnico padrão de cada artista dividido em categorias (Backline/Palco e Camarim/Catering),  
para estabelecer a especificação oficial de equipamentos e necessidades que servirá de base para todas as turnês do artista.

**Critério de aceite:**
- **Dado** o cadastro de um Artista,  
  **quando** o administrador acessa a seção de Rider Técnico,  
  **então** pode cadastrar itens organizados por categoria (ex.: Backline / Som / Iluminação / Camarim), informando nome do item, especificação detalhada, quantidade e se é mandatório.
- **Dado** um rider padrão cadastrado,  
  **quando** um item for editado ou removido do catálogo padrão,  
  **então** os shows futuros assumem o novo padrão, mantendo inalterados os shows passados ou já confirmados com contratantes.

---

### RF-07 — Rider do Show e Confirmação Pública pela Casa/Promotor
Como casa de show, contratante ou promotor local,  
quero acessar um link público exclusivo do rider daquela data sem precisar de login,  
para confirmar item por item o que será atendido ou sinalizar exceções acompanhadas de justificativa.

**Critério de aceite:**
- **Dado** a criação de um show,  
  **quando** o show é salvo,  
  **então** o sistema instancia o rider do show a partir do rider padrão do artista e gera um link público único de confirmação do rider.
- **Dado** o acesso da casa de show pelo link público,  
  **quando** a casa clica em "Confirmar" em um item,  
  **então** o item assume status "Confirmado" (badge verde).
- **Dado** um item que a casa não pode atender integralmente,  
  **quando** a casa seleciona "Sinalizar Exceção",  
  **então** é revelado suavemente um campo para inclusão de nota/justificativa (ex: "Possuímos modelo alternativo X") e o item assume o status "Exceção" (badge de alerta).
- **Dado** o preenchimento das confirmações pela casa,  
  **quando** o administrador abre o painel do show,  
  **então** visualiza em tempo real o balanço do rider (total de itens, confirmados, exceções com notas visíveis e itens não respondidos).

---

### RF-08 — Conferência Física no Dia do Show (Check-in Presencial do Rider)
Como equipe técnica da produção no dia do evento,  
quero realizar a conferência presencial dos itens entregues no palco e camarim,  
para registrar se o equipamento foi entregue conforme o prometido ou se houve divergência no local.

**Critério de aceite:**
- **Dado** o dia do show,  
  **quando** a equipe técnica acessa a checagem do rider,  
  **então** pode marcar cada item confirmado pela casa como "Recebido Conforme" ou "Com Divergência" (anotando a divergência encontrada).
- **Dado** o encerramento da conferência,  
  **quando** os itens são checados,  
  **então** o histórico fica registrado na ficha técnica do show para auditoria e controle pós-show.

---

### RF-09 — Ficha de Produção Consolidada para Impressão e Compartilhamento
Como administrador de produção,  
quero gerar uma Ficha de Produção completa do show em formato limpo e pronto para impressão (A4) ou exportação,  
para distribuir à equipe e afixar no camarim com contatos, cronograma, elenco e pendências sanadas.

**Critério de aceite:**
- **Dado** um show com elenco e documentos preenchidos,  
  **quando** o administrador clica em "Ficha de Produção",  
  **então** uma visão condensada exibe dados da cidade, local, data, contatos de emergência, lista de elenco com funções e status de logística, com formatação otimizada para papel/PDF sem elementos de navegação do sistema.

---

### RF-10 — Extração Automatizada de Dados por Inteligência Artificial (Stretch Goal)
Como administrador de produção,  
quero que o sistema analise comprovantes enviados ou documentos de rider em PDF e sugira o preenchimento automático dos dados,  
para eliminar digitação manual de número de voo, hotel, valor de nota ou checklist de rider legado.

**Critério de aceite:**
- **Dado** o upload de um comprovante em PDF ou imagem legível (ex: bilhete de passagem aérea ou nota fiscal),  
  **quando** o processamento inteligente atua,  
  **então** sugere automaticamente ao produtor campos extraídos (nº voo, hotel, valor em moeda, emissor) para confirmação com um clique.
- **Dado** o upload de um arquivo de rider técnico legado (PDF/DOCX) nas configurações do artista,  
  **quando** solicitada a importação por inteligência,  
  **então** o sistema estrutura os itens em categorias e quantidades pré-preenchidas para revisão e aprovação do produtor.

---

## Fora de Escopo do Módulo 1 (Produto)

Os seguintes itens pertencem explicitamente às fases futuras e **não** fazem parte do Módulo 1 V1:
1. **Contratos e Assinatura Digital (Módulo 6a - Fase 2):** Geração de minutas jurídicas, análise de cláusulas por IA e integração com a plataforma Autentique.
2. **Cotação e Reserva de Passagens/Hospedagem (Módulo 2 - Fase 3):** Agentes de busca autônoma em companhias aéreas ou OTAs e catálogo de fornecedores locais.
3. **CRM e Marketing de Audiência (Módulo 3 - Fase 4):** Importação de listas de fãs, disparos via WhatsApp e segmentação de público.
4. **Venda e Checkout de Ingressos (Módulos 4a e 4b - Fases 5 e 6):** Conexão com plataformas de bilheteria e processamento de pagamentos (Asaas/AbacatePay).
5. **Agente Conversacional por Voz/WhatsApp (Módulo 5 - Fase 7):** Operação do sistema por comandos de áudio ou mensagens diretas.
6. **Módulo Financeiro Integral (Módulo 6b - Fase 8):** Fluxo de caixa corporativo, split de cachê entre integrantes e conciliação bancária via Open Finance.
7. **Contas de Acesso com Login para Integrantes ou Promotores:** O acesso externo continua operando por links seguros com token exclusivo por show, sem atrito de autenticação.

---

## Cenários-Chave de Validação Ponta a Ponta

Estes cenários representam os fluxos críticos de uso real que atestam a conclusão e a integridade da entrega:

### Cenário 1: Ciclo Completo de Show com Elenco Sugerido e Exigência Individual
1. O administrador cadastra o Artista "Banda Alpha" e cadastra 3 pessoas no banco de equipe: João (Vocalista, vinculado à Banda Alpha), Maria (Técnica de Som, vinculada à Banda Alpha) e Carlos (Produtor Geral, marcado como Equipe Geral).
2. O administrador cria o show "Banda Alpha em Curitiba - 15/Outubro".
3. O sistema carrega automaticamente João, Maria e Carlos no elenco do show.
4. O administrador ajusta as exigências:
   - João: Passagem e Hotel (obrigatórios).
   - Maria: Apenas Passagem (obrigatório).
   - Carlos: Nenhum documento exigido (estado "Sem exigência configurada").
5. O painel do show calcula o progresso com base em 3 documentos esperados (2 de João + 1 de Maria). Carlos não adiciona pendência ao cálculo.
6. Carlos aparece visualmente destacado com a indicação textual em itálico "Sem exigência configurada", enquanto João e Maria exibem a contagem de pendências.

### Cenário 2: Envio Público por Integrante com Solicitação de Reembolso
1. João recebe o link público do show de Curitiba (`/p/[token]`).
2. Sem realizar login, João seleciona seu nome no seletor de integrantes.
3. João anexa o bilhete aéreo (PDF de 2MB), seleciona o tipo "Passagem", não marca reembolso e confirma.
4. O sistema confirma o envio e atualiza a exigência de Passagem de João para "Recebido".
5. Em seguida, João anexa um cupom fiscal de alimentação de R$ 85,00, seleciona "Nota fiscal", marca "Solicitar reembolso" e informa o valor.
6. O administrador abre o painel do show e constata:
   - Progresso do show atualizado.
   - João com Passagem concluída e Hotel pendente.
   - Na aba "Reembolsos", aparece o lançamento de João no valor de R$ 85,00 com link direto para o cupom.

### Cenário 3: Confirmação Antecipada do Rider Técnico pela Casa de Show
1. No cadastro da "Banda Alpha", o administrador registrou 2 itens de Rider: "Amplificador de Baixo Ampeg SVT" (Backline) e "Água Mineral sem gás 24 un" (Camarim).
2. Ao criar o show de Curitiba, esses 2 itens são automaticamente vinculados ao show.
3. O produtor envia o link público do rider (`/r/[token]`) ao gerente da casa de eventos.
4. O gerente abre a página do rider, confirma a Água Mineral com 1 clique (badge verde) e na linha do Amplificador clica em "Sinalizar Exceção".
5. Ao selecionar exceção, o campo de nota surge suavemente; ele digita: "Não temos Ampeg SVT, dispomos de Hartke 3500 com caixa 4x10".
6. O produtor da banda recarrega o painel do show e visualiza de imediato: 1 item confirmado, 1 exceção com a nota do promotor visível, permitindo negociação dias antes do embarque.
