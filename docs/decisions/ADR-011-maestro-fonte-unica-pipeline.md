---
id: ADR-011
titulo: Maestro como fonte única do pipeline mecânico (feature.md vira shim)
status: aceito
data: 2026-05-23
owner: framework
revisado-em: 2026-05-23
---

# ADR-011 — Maestro como fonte única do pipeline mecânico

## Contexto

A 6ª auditoria identificou que `templates/.claude/commands/feature.md` (197 linhas) e `templates/.claude/agents/maestro.md` (200 linhas) descreviam **o mesmo pipeline** em prosa: SESSION_HASH, 7 etapas com markers, paralelismo dos auditores, hash do diff, limpeza. O próprio `feature.md` admitia (linha 22): "O conteudo eh equivalente — o maestro so automatiza a sequencia".

Quando dois artefatos descrevem o mesmo procedimento em prosa, eles divergem com o tempo. Quem mantém qual? Mudar markers num lugar e esquecer o outro vira bug silencioso (hook reclama "auditor-X-pass faltando" mas o doc diz que está OK). Viola INV-001 (documento é estado compartilhado — único).

## Decisão

**`feature.md` vira shim curto (~35 linhas)** com:
- Delegação explícita ao Maestro via `Task subagent_type=maestro`.
- REGRA #0 inline (informa o agente principal antes de delegar).
- Lista curta de hooks que aplicam.
- Ponteiro pro Maestro como fonte canônica.

**`maestro.md` é a fonte única** do pipeline mecânico:
- 7 etapas com markers.
- SESSION_HASH, audit_sha, paralelismo.
- Modos FT (feature), BUG (bug), AUDIT (re-auditar).
- Limpeza pós-checkpoint.

Outros workflows que orquestram pipeline parcial (`/bug`, `/hotfix`, `/qa`) continuam descrevendo seu próprio fluxo no command, mas o `/feature` (pipeline completo) delega ao Maestro.

## Consequências

**Positivas:**
- INV-001 restaurado — uma fonte de verdade pro pipeline mecânico.
- Mudança em markers/etapas exige editar 1 arquivo (`maestro.md`), não 2.
- `feature.md` fica enxuto: agente principal lê 35 linhas, delega, e o Maestro executa.
- Onboarding de contribuidor: ler o Maestro pra entender o pipeline — sem ambiguidade "qual dos dois é o real?".

**Negativas:**
- Usuário que rodar `/feature` e quiser orquestrar manualmente (debug do pipeline) precisa abrir o Maestro. Mitigado: `feature.md` aponta `Detalhes mecanicos completos em .claude/agents/maestro.md`.
- Quebra de hábito: contribuidor acostumado a editar `feature.md` precisa lembrar de editar `maestro.md`. Mitigado: este ADR + comentário no topo do feature.md (futuro).

## Non-goals

- **Não unifica outros workflows com agentes** — só `/feature` ↔ `maestro` tinha duplicação 80%. `/bug`, `/qa`, `/hotfix` ficam no command.
- **Não muda o comportamento mecânico** — markers, hooks, paralelismo dos auditores seguem idênticos.
- **Não cria abstração `_maestro-lib.sh`** — bash boilerplate (SESSION_HASH, audit_sha) fica inline no maestro pra simplicidade. Refator de extração fica pra ADR futuro se 3+ agentes precisarem do mesmo helper.

## Alternativas descartadas

- **Manter os 2 com sincronização manual:** descartado. Drift já apareceu (auditor citou "Etapa 4/7" com nomes diferentes em cada doc).
- **Unificar invertendo (feature.md fica grande, maestro fica shim):** descartado. O Maestro É o agente que executa via `Task` — ele precisa do prompt completo.
- **Extrair pipeline pra `docs/workflows/feature-pipeline.md`:** descartado. Adicionaria 3º arquivo no caminho da fonte de verdade — pior.

## Como aplicar

- Mudança em SESSION_HASH/audit_sha/etapas/markers: editar `.claude/agents/maestro.md` (canônico) + `templates/.claude/agents/maestro.md` (sincronizado por dogfood).
- Mudança no fluxo de delegação (`/feature` chama Maestro de jeito diferente): editar `.claude/commands/feature.md`.
- Mudança em outro workflow (`/bug`, `/hotfix`, `/qa`): segue editando o command direto — sem refator obrigatório.

## Relacionado

- [[ADR-005]] dogfooding (templates/ vs .claude/ raiz).
- INV-001 (documento é estado compartilhado — único).
