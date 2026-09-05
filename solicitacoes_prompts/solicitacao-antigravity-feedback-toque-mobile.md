# Solicitação para o Antigravity — Feedback visual de toque no mobile

## Problema

No protótipo atual (versão zero), a navegação inteira depende de estados `:hover` do CSS pra dar feedback visual de clique — funciona bem no desktop (o cursor passa por cima, o botão muda de cor). Em dispositivos móveis, **não existe hover** — o dedo toca e solta, sem estado intermediário — então botões, itens de menu e cards clicáveis não mostram nenhuma reação visual ao toque. A navegação funciona (a tela muda), mas o usuário não tem confirmação de que o toque foi registrado antes da troca de tela acontecer.

## Correção pedida

Adicionar um estado `:active` (que funciona em touch, ao contrário do `:hover`) em **todo elemento clicável** da interface — não só nos botões que já têm:

1. **Botões primários e secundários**: já existe um exemplo de tratamento correto em partes pontuais da interface (o `style-active="transform:scale(0.95)"` usado no fluxo de sinalizar exceção do rider) — replicar esse mesmo padrão de "leve encolhimento ao pressionar" em **todos** os botões do sistema, não só onde já foi aplicado.
2. **Itens de navegação** (menu lateral: Agenda / Detalhe do show / Configurações, e qualquer outro link de navegação): precisa de uma mudança visível de fundo ou cor ao ser tocado, mesmo que rapidamente, antes da navegação acontecer.
3. **Cards clicáveis** (linha de show na Agenda, que leva pro detalhe do show): mesma lógica — leve mudança de fundo ou escala ao toque.
4. **Badges e outros elementos interativos**, se houver algum além dos já citados.

## Critério de pronto

- Testar em um dispositivo móvel real (não só no emulador do navegador): tocar em qualquer botão, item de menu ou card deve produzir uma reação visual perceptível (mudança de cor, fundo ou leve escala) durante o toque, antes da navegação ou ação acontecer.
- A transição deve ser rápida (na casa de 100–150ms) — o objetivo é sensação de resposta imediata, não uma animação lenta.
- Não remover nem alterar os estados de `:hover` já existentes para desktop — é aditivo, não substituição.
