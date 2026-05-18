# Constituição — princípios não-negociáveis

> 6 princípios universais que todo agente (humano ou IA) deve respeitar neste projeto.
>
> **Relação com `REGRAS-INEGOCIAVEIS.md`:** este arquivo é o **manifesto** (didático, explica o "por quê"). O `REGRAS-INEGOCIAVEIS.md` é a versão **operacional** com IDs citáveis (`INV-001`, `SEC-001`, etc.) pra usar em código, ADR, commit. Os dois são complementares, não redundantes.

---

## Princípio 1 — Documento é estado compartilhado

Decisões precisam estar em doc versionado. Memória de conversa não conta. Agente que decide sem doc inventa diferente toda vez.

**Aplica em:** ADRs, specs, regras, convenções.

---

## Princípio 2 — Spec gera código (spec-as-source)

A especificação é a verdade. Código é derivado. Quando código e spec discordam:
- Se a spec está certa: ajustar o código.
- Se o código revelou problema na spec: atualizar a spec primeiro, depois ajustar o código.

**Aplica em:** User stories, ADRs, REGRAS-INEGOCIAVEIS.

---

## Princípio 3 — Conciso vence completo

Doc longo ninguém lê. Doc curto e citável funciona.

**Limites (alinhados com recomendação oficial Anthropic):**
- AGENTS.md ≤ 200 linhas
- CLAUDE.md ≤ 150 linhas
- ADR ≤ 1 página por seção
- REGRA: 1 ID = 1-3 frases

---

## Princípio 4 — Non-goals explícitos

Toda spec/ADR declara o que NÃO está no escopo. Sem isso, o agente expande indefinidamente e o produto vira monstro.

**Exemplo:**
> **Escopo:** validação de CPF brasileiro.
> **Non-goals:** validação de CNPJ (fica em outra task), validação offline (não necessário agora).

---

## Princípio 5 — IDs rastreáveis

Cadeia de rastreabilidade obrigatória:

```
US-NNN  →  AC-NNN-N  →  T-NNN  →  commit
(user      (acceptance  (task)     (commit message
 story)     criteria)              cita o T-NNN)
```

**Por que:** quando algo quebra, dá pra rastrear da linha de código até a decisão original.

---

## Princípio 6 — Negócio vence conveniência do agente

Otimizar pelo produto/cliente, **não** pelo que o agente IA erra menos.

Critério "agentes dominam tecnologia X melhor que Y" é tiebreaker, nunca principal. Se Y é melhor pro negócio, escolher Y e investir em doc/regras pra ajudar o agente.

---

## Regra mestre

**Regra crítica vira hook, não só doc.** Documento sozinho não para o agente — código executável para.

Ver `.claude/hooks/` pra hooks ativos neste projeto.

---

## Mapa princípio → ID operacional → hook

Cada princípio acima tem contraparte **citável** em `REGRAS-INEGOCIAVEIS.md` (use o ID em commit, ADR, comentário) e, quando aplicável, um hook que o **barra mecanicamente** (exit 2):

| Princípio | ID em `REGRAS-INEGOCIAVEIS.md` | Hook que barra |
|---|---|---|
| 1 — Documento é estado | `INV-001` | `paths-frontmatter-validator.sh` |
| 2 — Spec gera código | `INV-002` | `require-readiness-before-feature.sh` |
| 3 — Conciso vence completo | `INV-005` | `context-budget.sh` (aviso) |
| 4 — Non-goals explícitos | `INV-003` | — (revisão / `/clarificar`) |
| 5 — IDs rastreáveis | `INV-004` | `commit-message-validator.sh`, `paths-frontmatter-validator.sh`, `validate-story-approvals.sh` |
| 6 — Negócio vence conveniência do agente | `INV-AGENT-001..006` | `block-confirmation-questions.sh` |
| Regra #0 — causa raiz, investigar antes | `INV-006`, `INV-AGENT-003` | `require-investigador-before-fix.sh`, `regra-zero-reminder.sh` |

> **Como usar:** ao escrever um commit ou ADR que materializa um princípio, cite o ID — ex.: `fix: valida CPF antes de salvar (INV-002)`. O manifesto explica o *porquê*; o ID dá rastreabilidade; o hook garante que não passa batido.

Verificar consistência manifesto ↔ regras ↔ código: rode `/consistencia`.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method). Inspirado em Spec Kit._
