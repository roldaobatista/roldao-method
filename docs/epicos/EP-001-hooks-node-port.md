---
tipo: epico
id: EP-001
versao: 1
status: aprovado
prd: PRD-001
owner: Roldão
revisado-em: 2026-05-24
tamanho: XG
---

# EP-001 — Port dos 26 hooks bloqueadores pra Node.js

> Concretiza o **caminho A** do [PRD-001](../prd/PRD-001-windows-sem-bash.md). Zero shell, zero perl, roda em Windows puro / Linux / macOS / container minimal sem dependência externa.

---

## Resumo em 1 frase

Todo dev BR roda os 26 hooks bloqueadores **sem precisar instalar Git Bash, perl ou bash 3.2+** — basta Node 18 (já requisito do framework).

---

## Stories filhas

> Ordem é importante: US-101 entrega a infra que as demais consomem. US-107 é o gate final.

| US      | Título                                                                  | Depende de | Tamanho | Status   |
|---------|--------------------------------------------------------------------------|------------|---------|----------|
| US-101  | Infra de hook Node — loader, JSON parser, helpers (_lib.js)              | -          | G       | entregue |
| US-102  | Port grupo destrutivo (block-destructive, no-amend-after-push)           | US-101     | M       | entregue |
| US-103  | Port grupo segredos (secrets-scanner, block-secrets-in-commit-message)   | US-101     | M       | entregue |
| US-104  | Port grupo testes (anti-mascaramento, block-mock-in-integration, no-test-data-in-fixtures, validate-test-pyramid) | US-101 | M | entregue |
| US-105  | Port grupo fiscal/Pix (no-hardcoded-env-urls, fiscal-br-validator, no-log-pix-key, lgpd-base-legal-reminder) | US-101 | M | entregue |
| US-106  | Port grupo pipeline (enforce-pipeline-completion, require-investigador-before-fix, require-readiness-before-feature, require-agent-sequence-before-dev, require-checkpoint-before-merge, require-auditors-pass-before-commit, validate-quick-dev-scope, validate-story-dependencies, validate-story-approvals, commit-message-validator) | US-101 | G | entregue |
| US-107  | Port grupo lifecycle/util (auto-format-on-write, context-budget, session-snapshot, session-snapshot-restore, subagent-handoff-audit, paths-frontmatter-validator, block-todo-without-issue, block-jargon-pt-br, block-confirmation-questions, mcp-validator, regra-zero-reminder) | US-101 | G | entregue |
| US-108  | Migration da suite de testes — _test-runner.sh → run-tests.js (Node test runner nativo) | US-102..US-107 | M | entregue |
| US-109  | CI cross-OS — adicionar matriz `windows-latest sem bash` ao validar.yml + remover `shell: bash` dos steps | US-108 | P | entregue |
| US-110  | Deprecação dos .sh — README/CHANGELOG sinalizam .sh como legado, doctor warn quando .sh ainda presente | US-109 | P | entregue |

**Total esperado:** 6-10 semanas calendário (1 dev senior em meio período).

---

## ADRs bloqueantes

- [x] **[ADR-012](../decisions/ADR-012-hooks-node-port.md)** — Port pra Node aprovado, revoga ADR-002.
- [x] **[ADR-013](../decisions/ADR-013-convencao-hook-node.md)** — Convenção: `.js` puro + shebang `#!/usr/bin/env node` + `settings.json` chama `node <arquivo>` explicitamente.
- [x] **[ADR-014](../decisions/ADR-014-addons-hooks-node.md)** — Addons portam junto, sem coexistência longa, semver bump v1.0.

---

## Readiness (gate mecânico)

- **Última verificação:** —
- **Resultado:** NAO_PRONTO (épico recém-criado)
- **Arquivo de status:** `docs/readiness/EP-001-status.md` (a criar)

---

## Non-goals (INV-003)

- Reescrever agentes/skills/commands — escopo é exclusivamente `templates/.claude/hooks/`.
- Suportar Node < 18 — gate `bin/install.js` já exige 18+.
- Manter `.sh` em paralelo após v1.0 — coexistência só durante transição.
- Hooks PowerShell ou outras linguagens — Node é a única alvo.
- Mudar comportamento dos hooks — paridade byte-a-byte nos vereditos (block/exit 2 em mesmas condições).

---

## Métricas de sucesso

- **Taxa de instalação completada em Windows sem Git Bash:** 0% hoje → ≥80% após release.
- **Tempo médio de execução por hook:** ≤200ms (medido em 95% das chamadas no `_test-runner` portado).
- **Cobertura de testes:** mantém 179/179 cenários verdes na suite portada.
- **Zero regressão de comportamento:** suite de equivalência (US-108) garante que cada hook portado retorna o MESMO veredito que o `.sh` legado pros mesmos inputs.

---

## Regulamentação BR aplicável

- INV-005 (conciso vence completo — arquivos `.js` devem manter ≤150 linhas onde possível, sem perder funcionalidade).
- INV-AGENT-002 (REGRA #0): port preserva 100% da lógica original; nenhuma "melhoria de oportunidade" sem ADR.
- TST-001/TST-002: suite de equivalência (US-108) bloqueia merge se algum hook portado divergir do `.sh` legado.

---

## Risco e mitigação

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Performance degradada (cold start Node) | Média | Benchmark em US-108 com timeout de 500ms por hook; se > 200ms, otimizar antes de US-109 |
| Comportamento divergente de regex bash (`grep -E`) vs JS | Alta | US-101 inclui helper `bashEquivalentRegex(pattern)` testado contra os 26 hooks |
| Addons quebrarem na transição | Alta | US-110 marca como breaking, semver bump v1.0; comunicar em CHANGELOG.md + release notes |
| Mantenedor solo sem tempo pra 6-10 semanas focadas | Alta | Stories são independentes pós US-101 — podem ser feitas em paralelo por contribuidores; cabe issue no GitHub pra cada US |

---

## Histórico

| Data       | Quem    | Mudança                                              |
|------------|---------|------------------------------------------------------|
| 2026-05-23 | Roldão  | criação a partir de PRD-001 caminho A aprovado       |
| 2026-05-24 | Roldão  | tabela de stories reconciliada — todas entregues (v1.0.0-rc1/rc2 saiu) |
