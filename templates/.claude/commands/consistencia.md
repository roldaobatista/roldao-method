---
description: Verifica coerência cruzada entre PRD ↔ arquitetura ↔ stories ↔ tasks ↔ código. Acha órfãos (task sem story, story sem PRD) e contradições. Use antes de release, antes de checkpoint, ou quando suspeitar que doc e código divergiram.
argument-hint: "[escopo: \"EP-NNN\" | \"US-NNN\" | \"módulo X\" | vazio = tudo]"
disable-model-invocation: true
---

# /consistencia — cross-check de artefatos

Codifica o Princípio 2 (spec gera código) e o Princípio 5 (IDs rastreáveis): se o código não rastreia até uma decisão documentada, ou se a decisão documentada não virou código, **a cadeia quebrou**.

Use `$ARGUMENTS` como escopo (ex: "EP-012", "módulo financeiro"). Vazio = projeto inteiro.

## Etapa 1 — Investigador levanta o mapa real

Invoque `investigador`:
- Lista os artefatos no escopo: PRD (`docs/prd/`), épicos (`docs/epicos/`), stories (`docs/stories/`), ADRs (`docs/decisions/`), tasks (T-NNN nas stories), e o código que cita esses IDs.
- Monta a cadeia de rastreabilidade real: `US-NNN → AC-NNN-N → T-NNN → commit/arquivo`.
- **Não opina ainda** — só reporta o que existe e o que referencia o quê.

## Etapa 2 — Três verificações em paralelo

Invoque em **uma única mensagem** os 3 auditores, cada um com um recorte:

- `auditor-produto` — **órfãos de produto**: story sem PRD/épico que a justifique; AC sem story; feature no código que nenhuma story pediu; non-goal sendo implementado.
- `auditor-qualidade` — **órfãos de execução**: T-NNN sem AC; story marcada entregue sem teste; commit `feat:`/`fix:` sem T-NNN rastreável; teste que não cobre nenhum AC.
- `auditor-seguranca` — **deriva regulatória**: regra com ID (`LGPD-`, `FISCAL-`, `PIX-`, `SEC-`) citada na spec mas não no código, ou ao contrário; ADR de segurança sem implementação correspondente.

## Etapa 3 — Consolidação

Monte a tabela de inconsistências, ordenada por gravidade (bloqueante primeiro):

```
RELATÓRIO DE CONSISTÊNCIA — escopo: <$ARGUMENTS ou "tudo">

Cadeia rastreada: <N> stories, <N> tasks, <N> ADRs, <N> arquivos

INCONSISTÊNCIAS
| Gravidade | Tipo            | Artefato A          | Artefato B          | O quê                          |
|-----------|-----------------|---------------------|---------------------|--------------------------------|
| 🔴 bloq.  | órfão produto   | (nenhum PRD)        | US-014              | story sem épico/PRD que peça   |
| 🟡 médio  | órfão execução  | AC-009-2            | (nenhuma task)      | critério sem T-NNN cobrindo    |
| 🟢 baixo  | doc desatualiz. | ADR-003             | código              | decisão não reflete o código   |

VEREDITO: CONSISTENTE | INCONSISTENTE (N bloqueantes)

Ações obrigatórias (se INCONSISTENTE), priorizadas:
1. <ação — qual doc/código alinhar e em que direção>
```

**Regra de bloqueio:** qualquer inconsistência 🔴 → veredito INCONSISTENTE. Não "arredonde para CONSISTENTE" porque a maioria está OK.

## Etapa 4 — Correção dirigida (só se INCONSISTENTE)

Para cada item 🔴/🟡, aplique a **direção correta** do Princípio 2:
- Spec certa, código divergiu → corrigir código (vai pra `/bug` ou `/feature` conforme o caso).
- Código revelou furo na spec → atualizar a spec primeiro, depois alinhar código.
- Órfão real (ninguém pediu) → remover ou abrir story que o justifique. **Decida e execute** — não pergunte "quer que eu remova?".

## Anti-padrões PROIBIDOS neste workflow

- Marcar CONSISTENTE com inconsistência 🔴 aberta "porque é pouca coisa".
- "Resolver" órfão de produto criando story retroativa que só descreve o código (isso é spec gerada por código — viola Princípio 2).
- Apagar T-NNN da story pra "sumir" com órfão de execução em vez de escrever o teste/código que falta.
- Relaxar a cadeia de rastreabilidade pra não acusar inconsistência.

Relacionado: rode `/consistencia` antes de `/checkpoint` e antes de `/auditoria` em release.
