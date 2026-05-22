---
description: Questionamento estruturado ANTES de implementar — tira ambiguidade de uma ideia/story antes do /feature. Reduz retrabalho. Use quando o pedido ainda está vago, ou antes de /prd e /feature em iniciativa não-trivial.
argument-hint: "[ideia, story ou US-NNN a clarificar]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Task
---

# /clarificar — tirar ambiguidade antes de codar

Roda **antes** de `/feature` (e idealmente antes de `/prd`). Diferente do `investigador` da REGRA #0 — aquele investiga *estado real antes de corrigir bug*; este afina *o que vai ser construído antes de construir*.

Princípio: pergunta barata agora economiza 10 idas e voltas depois. O usuário conhece o produto melhor que ninguém — extrair o que está implícito na cabeça dele é trabalho, não interrupção.

Use `$ARGUMENTS` como a ideia/story a clarificar.

## Etapa 1 — Gerente de Produto mapeia a ambiguidade

Invoque `gerente-produto`:
- Lê `$ARGUMENTS` e os docs relacionados (PRD/épico/story se já existirem).
- Usa a KB `.specify/data/kb-elicitation-pt-br.md` pra escolher 2-3 métodos adequados ao caso (default pra story nova: **Acceptance Test First** + **Non-Goals Drill** + **Five Whys**).
- Lista os **pontos cegos**: o que está ambíguo, o que tem mais de uma interpretação, o que ninguém definiu (escopo, edge cases, regra de negócio, dado regulatório BR aplicável — CPF/CNPJ, LGPD, fiscal, Pix).

## Etapa 2 — Perguntar ao usuário (estruturado, sequencial)

Para cada ponto cego material, use `AskUserQuestion` com 2-4 opções concretas e mutuamente exclusivas. Regras:

- **Uma rodada enxuta.** Agrupe perguntas relacionadas; não faça 12 perguntas soltas.
- **Opções concretas, não "como você quer?".** Ex.: "CPF inválido no cadastro: (a) bloqueia o salvamento (b) salva e marca pra revisão (c) avisa mas deixa salvar".
- **Sempre inclua o default recomendado** como primeira opção quando houver um caminho óbvio pro negócio.
- **Sem jargão** — pergunta em linguagem de produto, não de implementação.
- Se o usuário não souber, ofereça a recomendação do `gerente-produto` e siga.

## Etapa 3 — Consolidar em spec clarificada

```
SPEC CLARIFICADA — <$ARGUMENTS>

Objetivo (1 frase): <o que resolve, pra quem>

Critérios de aceite (testáveis):
- AC-1: <dado / quando / então>
- AC-2: ...

Decisões tomadas nesta sessão:
- <ponto ambíguo> → <decisão do usuário> (ou <recomendação aceita>)

Non-goals (o que NÃO entra):
- NÃO <…>

Regras BR aplicáveis: <LGPD-/FISCAL-/PIX- ou "nenhuma">

Pronto para: /historia (criar US-NNN) ou /feature (se story já existe)
```

Se a story já existe (`US-NNN`), **atualize o doc dela** com a spec clarificada — documento é estado compartilhado (Princípio 1), não deixe a clareza só no chat.

## Anti-padrões PROIBIDOS neste workflow

- Seguir pra `/feature` com AC vago ("funcionar bem", "ser rápido") — AC vago = story vaga (KB Acceptance Test First).
- Inventar a resposta de um ponto cego pra não incomodar o usuário, quando a decisão muda o produto.
- Fazer 10+ perguntas numa rodada só (cansa, derruba qualidade da resposta).
- Pular Non-Goals — sem non-goal explícito o escopo expande até virar monstro (Princípio 4).

Fluxo natural: `/clarificar` → `/historia` → `/feature`. Em iniciativa grande: `/clarificar` → `/prd` → `/epico`.
