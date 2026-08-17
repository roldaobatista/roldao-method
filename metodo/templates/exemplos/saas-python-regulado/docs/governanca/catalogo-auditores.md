---
owner: Ana Silva
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 130
proposito: catalogo unico dos 8 auditores ativos no conciliab (subagentes Claude Code que validam codigo e docs)
---

<!-- destino: docs/governanca/catalogo-auditores.md (preenchido no exemplo saas-python-regulado) -->

# Catalogo de Auditores — conciliab

## 1. Como ler este catalogo

> **Auditor** = subagente Claude Code (ou script) que olha o codigo/docs e aponta problema antes do commit ou do merge.

Cada linha descreve um auditor ativo: funcao, gatilho, severidade default, owner, arquivo de definicao.

Referenciados em [`AGENTS.md`](../../AGENTS.md) §5 e em INVs de [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md).

## 2. Auditores ativos

| ID | Nome | Funcao | Quando roda (gatilho) | Severidade default | Owner | Arquivo de definicao |
|---|---|---|---|---|---|---|
| A-001 | `auditor-seguranca` | procura segredo hardcoded (gitleaks), dep com CVE (pip-audit), sanitizacao ausente, PII em logs, INV-TENANT-* | pre-commit + scan semanal agendado | CRITICO | Ana Silva | `.claude/agents/auditor-seguranca.md` |
| A-002 | `auditor-qualidade` | TST-001 (sem skip/xfail sem motivo), INV-AGENT-006 (anti-mascaramento), cobertura por AC | pre-commit em `tests/**` + pre-merge | ALTO | Ana Silva | `.claude/agents/auditor-qualidade.md` |
| A-003 | `auditor-lgpd` | INV-LGPD-001/002/003, consistencia codigo↔ROPA, base legal valida (Art. 7 V/IX/II), PII handling | pre-commit em codigo que toca tabelas com PII OU `docs/conformidade/lgpd/**` | CRITICO | Carlos Mendes | `.claude/agents/auditor-lgpd.md` |
| A-004 | `auditor-fiscal-audit` | INV-AUDIT-001/002/003 (WORM `audit_log`, hash em export fiscal) | pre-commit em codigo que toca `audit_log`/`fiscal_*` + pre-merge | CRITICO | Bruno Costa | `.claude/agents/auditor-fiscal-audit.md` |
| A-005 | `auditor-doc-quality` | INV-AGENT-003/010 (jargao, investigacao antes de editar), placeholders nao resolvidos, links quebrados, frontmatter | pre-commit em `**/*.md` + pre-merge | ALTO | Diego Tavares | `.claude/agents/auditor-doc-quality.md` |
| A-006 | `limites-agente-ia` | INV-AGENT-001/002/004 (proibido deletar dado prod sem confirmacao, sem `--no-verify`, pro-atividade vs lista destrutiva) | toda interacao do agente (PreToolUse hook) | CRITICO | Ana Silva | `.claude/agents/limites-agente-ia.md` |
| A-007 | `auditor-revisao` | INV-AGENT-005 (validar antes de afirmar — evidencia obrigatoria), checa relatorios do agente | Stop hook opt-in (`post-claim-evidence.sh`) + pre-merge | ALTO | Ana Silva | `.claude/agents/auditor-revisao.md` |
| A-008 | `auditor-processo` | INV-AGENT-011 (alteracao de INV exige PR dedicado + aprovacao dono + ledger), valida mudancas em `REGRAS-INEGOCIAVEIS.md` | pre-commit em `REGRAS-INEGOCIAVEIS.md` + `.claude/agents/**` | CRITICO | Roldao | `.claude/agents/auditor-processo.md` |
| A-009 | `auditor-tenant` | valida isolamento multi-tenant — query sem `WHERE tenant_id`, sufixo `_tenanted` consistente com `tenant_id`, `SET LOCAL ROLE` proibido em codigo | pre-commit em `conciliab/**/*.py` + `migrations/**` | CRITICO | Ana Silva | `.claude/agents/auditor-tenant.md` |

> A-001 a A-008 estao listados em AGENTS.md §5. A-009 (`auditor-tenant`) foi adicionado em 2026-05-27 para isolar a responsabilidade tenant que estava sobrecarregando `auditor-seguranca` (ADR-0006 a criar).

> **Amostras completas materializadas neste exemplo:** [`.claude/agents/auditor-lgpd.md`](../../.claude/agents/auditor-lgpd.md) e [`.claude/agents/auditor-tenant.md`](../../.claude/agents/auditor-tenant.md) — ambos com regras + golden cases positivos e negativos. Os outros 7 auditores listados sao referenciados conceitualmente — criar a partir de `templates/auditor.template.md` no projeto real (cada um com seus proprios golden cases).

## 3. Processo de adicionar / remover auditor

Toda mudanca no catalogo (entrada, saida, alteracao de severidade ou gatilho) exige:

1. **ADR** justificando a decisao (`docs/adr/ADR-NNNN-<slug>.md`).
2. **Pull request** com:
   - definicao do novo auditor em `.claude/agents/<nome>.md` (seguindo `templates/auditor.template.md`),
   - golden cases (positivos e negativos) por regra declarada,
   - atualizacao desta tabela (linha nova ou edicao),
   - se for remocao, mover linha para §4 (aposentados) com data e motivo.
3. **Aprovacao** do owner do dominio afetado + Ana Silva (tech lead).
4. **Validacao** do `auditor-processo` (A-008) antes do merge.

## 4. Auditores aposentados (historico)

| ID antigo | Nome | Aposentado em | Motivo | Sucessor |
|---|---|---|---|---|
| (vazio — projeto jovem) | | | | |

Quando auditor for aposentado:
- arquivo de definicao move para `docs/governanca/aposentados/<nome>.md`.
- golden cases arquivados ou migrados para o sucessor (decisao em ADR).
- regras orfas reavaliadas: ou viram novo auditor, ou viram guideline humano com justificativa.

## 5. Convencoes

- **ID** segue padrao `A-NNN` (numerico, sequencial, nao reutilizado).
- **Severidade default** = nivel atribuido sem contexto extra. Pode ser elevada em regras especificas.
- **Owner** e pessoa, nao time. Quem assume manutencao e golden cases.
- Severidades validas: `CRITICO`, `ALTO`, `MEDIO`, `BAIXO`.

## 6. Historico de revisoes

| Data | Revisor | Mudanca |
|---|---|---|
| 2026-02-28 | Ana Silva | criacao inicial com 8 auditores (A-001..A-008) |
| 2026-05-27 | Ana Silva | adicionado A-009 `auditor-tenant` (separado de `auditor-seguranca` apos finding recorrente de RLS) |
