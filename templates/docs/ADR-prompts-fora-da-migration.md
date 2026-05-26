---
owner: tech-lead
revisado-em: AAAA-MM-DD
status: proposta
decidido-em: _(quando aceito)_
decidido-por: _(quem aprovou)_
prd: PRD-NNN
epico: EP-NNN
supersedes: []
superseded-by: null
origem:
  data: AAAA-MM-DD
  incidente-ou-feedback: _(auditoria que mostrou padrao "prompt em migration")_
  sintoma-observado: "65% das migrations sao re-prompt de agente — prompt virou schema mutavel do banco"
---

# ADR-NNN — Prompt de agente nao vai pra migration

> Template especifico pra projeto que detectou padrao "prompt em migration" — anti-padrao classico em apps que orquestram agentes IA via banco. Inspirado na licao do lionclaw (cascata v50→v71 de migrations). Codifica TST-005 do framework.

---

## Contexto

Auditoria em `<projeto/repo>` identificou que `N` migrations (`<percentual>%`) no range `<vNN..vMM>` foram updates de campos de agente (system_prompt, model, effort, allowed_tools, etc.) em vez de DDL real.

Padrao de cascata "fix the fix" recorrente:
- migration vM altera campo X
- migration v(M+1) corrige drift de v(M-1) pra DBs antigos
- migration v(M+2) realinha campos que v(M+1) nao tocou
- ...

R10 ("edita o `.ts` + escreve migration espelhada") virou ritual operacional.

Snapshots OLD inline em migrations crescem indefinidamente (em casos extremos: 50-80KB de prompt colado dentro de arquivo `.ts` de migration).

---

## Decisao

**`system_prompt`, `model`, `effort`, `thinking_budget`, `max_turns`, `allowed_tools`, `description` de seed agent residem APENAS no arquivo `.ts` (ou equivalente) em `seed-agents/`. Migration so pode tocar essas colunas pra INSERT inicial de agente novo (`INSERT OR IGNORE`). UPDATE de campo de agente existente e responsabilidade do boot reconciler.**

### Estrutura

```
seed-agents/
├── _shared/
│   ├── pt-br-block.ts
│   ├── critical-rules.ts
│   └── git-restrictions.ts
├── investigador.ts        # exporta {id, name, model, effort, ...systemPrompt}
├── tech-lead.ts
└── ...

db/
├── migrations/
│   ├── v50-add-thinking-budget-column.ts   # DDL real
│   ├── v51-add-fk-cascade.ts                # DDL real
│   └── v60-INSERT-doc-agents.ts             # INSERT OR IGNORE — agente novo
└── reconcile-seed-agents.ts                 # roda no boot apos migrations
```

### Reconciler no boot

`reconcile-seed-agents.ts` (roda em SessionStart ou no init do app):

1. Le todos `seed-agents/*.ts`
2. Pra cada agente: UPDATE no banco respeitando matriz por campo:

| Campo | reconcileMode |
|---|---|
| `system_prompt` | `preserve-customization` (se usuario customizou via UI, mantem) OU `force-canonical` (sobrescreve sempre) — declarado no `_meta` do agente |
| `model` | `force-canonical` (modelo trocado intencionalmente em release) |
| `effort` | `force-canonical` |
| `allowed_tools` | `merge` (uniao com customizacoes) |
| `description` | `force-canonical` |

3. Marca em log local quais agentes foram atualizados.

### Hook `block-prompt-in-migration.js` (TST-005)

Bloqueia em PreToolUse Write/Edit se migration contem:
- `UPDATE agents SET (system_prompt|prompt|instructions|description|allowed_tools|model|effort|thinking|thinking_budget|max_turns)`
- String literal > 2000 chars dentro do arquivo de migration
- Nome de arquivo bate `v\d+-(prompts|agents|.*-onda\d+|.*-realign|.*-preserve-existing).*`

---

## Alternativas consideradas

### Alternativa 1 — Migration continua updando prompt (status quo)

**Recusada:** cascata "fix the fix" identificada como causa raiz.

### Alternativa 2 — Prompt em arquivo JSON separado lido em runtime

Vantagens: hot-reload sem deploy.
Desvantagens: prompt fora do controle de versao normal; sem type-safety.
**Recusada:** `.ts` versionado em git e melhor.

### Alternativa 3 — Reescrever migrations existentes (refactor massivo)

**Adiada:** v3 nao mexe em historico; nova politica vale pra migrations daqui pra frente. Migrations historicas ficam como estao ate proximo major bump.

---

## Skill `extrair-prompt-de-migration` (recomendada)

Refactor automatizado quando projeto adota esta ADR:

1. Le migration que faz `UPDATE agents SET system_prompt = '<grande string>'`
2. Detecta ID do agente (`WHERE id = 'foo'`)
3. Extrai a string literal
4. Cria/atualiza `seed-agents/<id>.ts`
5. Reescreve migration pra apenas DDL (ou remove se so tinha update de prompt)
6. Gera teste validando que `.ts` corresponde ao prompt esperado

CLI: `npx <projeto> extract-prompt-migration <path/to/migration.ts>`

---

## Consequencias

### Positivas

- Diff de PR mostra mudanca de prompt em 1 arquivo (`.ts`), nao em 2
- Fim da cascata "fix the fix"
- Snapshot OLD vira git history, nao payload da migration
- Reconciler reaplica em DB existente (drift resolvido no boot)

### Negativas

- Reconciler precisa de matriz de modos por campo (custo unico de implementacao)
- Migrations historicas (legacy) ficam — refactor incremental via skill `extrair-prompt-de-migration`

### Compativel com

- INV-001 (`.ts` versionado = doc/estado compartilhado)
- INV-002 (spec gera codigo — `.ts` e a spec do agente)
- INV-006 (causa raiz — atacar onde prompt e definido, nao onde e persistido)
- TST-005 (regra inegociavel)
- _(outros ADRs relevantes)_

---

## Gatilhos de reabertura

- Reconciler causar > 5 problemas em 30 dias → revisar matriz `reconcileMode`
- Usuario customizar prompt via UI e perder ao atualizar → mudar default pra `preserve-customization`

---

## Como verificar

- `git log --oneline db/migrations/ | grep -E '(prompt|onda|realign)'` retorna vazio (apos politica)
- `npx <projeto> extract-prompt-migration <path>` em migration legada → gera seed file correspondente
- Teste de drift compara TODOS os campos do seed vs banco (TST-006)

---

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | proposta inicial |
