---
name: brainstormar-ideia
description: Oferece menu de 15 técnicas de brainstorming adaptadas ao contexto brasileiro (Seis Chapéus, SCAMPER, 5 Porquês, Pre-mortem, Crazy 8s, Inversão, First Principles, Yes-And, Worst Possible Idea, Reverse Brainstorming, Brainwriting, Mind Map, Six Universal Questions, Random Stimulation, Round Robin). Use sempre que o usuário precisar expandir/refinar ideia e não souber qual técnica aplicar. Skill orquestra escolha + execução guiada.
---

# brainstormar-ideia

Quando o usuário pede "me ajude a pensar em...", "como abordo...", "que opções tenho pra...", esta skill oferece menu numerado de técnicas adaptadas ao contexto BR (e em PT-BR) e executa a escolhida com prompt estruturado.

## Quando usar

- Início de PRD/brief (`/inicio`, `/prd`).
- Refinamento de épico (`/epico`).
- Definição de escopo / non-goals.
- Pre-mortem antes de lançar feature.
- Brainstorming de nome/marca/posicionamento.
- Inversão de problema (não consegue resolver direto).

## Como usar

Pergunte ao usuário o tópico. Depois apresente o menu numerado (use `AskUserQuestion` ou texto se single-turn):

```
Qual técnica você quer aplicar pra "<tópico>"?

DIVERGIR (gerar ideias):
  1. Brainwriting silencioso (6-3-5) — 6 ideias em 3 min, cada um propõe 5 alternativas
  2. Crazy 8s — 8 ideias diferentes em 8 minutos (timeboxing forte)
  3. SCAMPER — Substitui, Combina, Adapta, Modifica, Põe em outro uso, Elimina, Reverte
  4. Random Stimulation — palavra/imagem aleatória força conexão
  5. Reverse Brainstorming — "como GARANTIR que isso falhe?" → inverter respostas
  6. Worst Possible Idea — proponha a pior ideia possível pra liberar criatividade

CONVERGIR (escolher / refinar):
  7. Seis Chapéus do Pensamento (de Bono) — 6 perspectivas obrigatórias
  8. Round Robin — cada participante crítica 1 ideia, sem repetir
  9. Mind Map — relação visual hierárquica
  10. Six Universal Questions — quem/o quê/quando/onde/por quê/como

ANALISAR (diagnóstico / risco):
  11. 5 Porquês (Toyota) — descobre causa raiz perguntando "por quê?" 5x
  12. Pre-mortem — "imagine que falhou em 6 meses; por quê?"
  13. First Principles — quebra problema até axiomas, reconstrói
  14. Inversão — "qual é o oposto da pergunta? como evitar fracasso?"

DECIDIR:
  15. Yes-And construtivo — cada nova ideia ESTENDE a anterior, sem matar
```

Quando escolher, execute o protocolo da técnica (ver `templates/.specify/data/kb-brainstorming-pt-br.md` pra detalhes de cada).

## Output esperado

Sempre PT-BR. Sempre com **resumo final em bullets** (não parede de texto). Sempre com:

1. **Técnica aplicada** + por que essa.
2. **Resultado**: lista de ideias / análises / decisões.
3. **Próximo passo recomendado** (ex: "passe pra `/prd` com escopo: X").

## Anti-padrões

- Não inventar técnica nova quando 15 já cobrem.
- Não pular o menu se o usuário pediu ajuda genérica — escolher por ele perde a chance de aprendizado.
- Não usar técnica anglo (Six Hats) sem traduzir os "chapéus" pro PT-BR (Branco=fatos, Vermelho=emoção, Preto=crítica, Amarelo=otimismo, Verde=criatividade, Azul=processo).

## Integração

Knowledge base: `templates/.specify/data/kb-brainstorming-pt-br.md`
Pode ser invocada por: `analista`, `gerente-produto`, `ux-designer`, `tech-lead`.
