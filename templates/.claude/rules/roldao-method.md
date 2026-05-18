---
description: ROLDAO-METHOD — regras unificadas. No Claude Code, os 21 hooks bloqueadores codificam tudo isto. Este arquivo é referência rápida para revisar contrato sem abrir cada hook.
paths: ["**/*"]
status: stable
owner: framework
revisado-em: 2026-05-18
---

# ROLDAO-METHOD — regras unificadas

> No Claude Code os hooks em `.claude/hooks/` codificam estas regras mecanicamente (exit 2 = bloqueio). Este arquivo é referência rápida para auditar o contrato sem abrir 28 scripts.

## REGRA #0 — Investigar antes de mexer em lógica de negócio

Quando o usuário reportar bug:
1. **NÃO** mexer no código antes de entender a causa.
2. **Ler o estado real:** banco, logs, payload, console, config.
3. **Rastrear o fluxo:** origem → persistência → leitura.
4. **Confirmar entendimento** se houver ambiguidade.
5. **Só então:** implementar, no ponto raiz, não no sintoma.

Codificado em: `require-investigador-before-fix.sh`, `regra-zero-reminder.sh`, workflow `/bug`.

## Linguagem com o usuário não-programador

Sem jargão técnico sem tradução. Tabela canônica em `templates/CLAUDE.md`.

Codificado em: `block-jargon-pt-br.sh` (soft warning).

## Executar, não passar pro usuário (INV-AGENT-006)

Nunca perguntar "quer que eu...?", "posso fazer X?", "devo continuar?". Decida e reporte depois. Exceções (perguntar antes): operações destrutivas, gasto financeiro, mudança pública, credenciais.

Codificado em: `block-confirmation-questions.sh`.

## Bloqueios duros codificados em hook

| Regra | Hook | Exit |
|---|---|---|
| Sem `rm -rf`, `git push --force`, `--no-verify` | `block-destructive.sh` | 2 |
| Sem secret (AWS/PAT/PEM) em código ou commit | `secrets-scanner.sh`, `block-secrets-in-commit-message.sh` | 2 |
| Sem mascaramento (`@ts-ignore`, `.skip()`, `assertTrue(true)`, `\|\| true`) | `anti-mascaramento.sh` | 2 |
| Mock em integration/ ou e2e/ | `block-mock-in-integration.sh` | 2 |
| TODO sem ID rastreável | `block-todo-without-issue.sh` | 2 |
| Test fixture com CPF/email/telefone real | `no-test-data-in-fixtures.sh` | 2 |
| URL SEFAZ/Pix/gateway hardcoded | `no-hardcoded-env-urls.sh` | 2 |
| Ambiente SEFAZ=1 hardcoded | `fiscal-br-validator.sh` | 2 |
| `git commit --amend` após push | `no-amend-after-push.sh` | 2 |
| MCP fora da allowlist | `mcp-validator.sh` | 2 |
| Pirâmide de teste invertida (E2E sem unit) | `validate-test-pyramid.sh` | 2 |
| `/feature` sem readiness pronto | `require-readiness-before-feature.sh` | 2 |
| Story sem dependência entregue | `validate-story-dependencies.sh` | 2 |
| `/feature` sem Sofia → Detetive → Rafael | `require-agent-sequence-before-dev.sh` | 2 |
| `/quick-dev` > 3 arquivos | `validate-quick-dev-scope.sh` | 2 |
| `/bug` sem investigador | `require-investigador-before-fix.sh` | 2 |
| Commit feat/fix sem T-NNN | `commit-message-validator.sh` | 2 |
| Commit/merge sem checkpoint | `require-checkpoint-before-merge.sh` | 2 |
| Commit sem 3 auditores aprovados | `require-auditors-pass-before-commit.sh` | 2 |
| Story marcada entregue sem audit trail | `validate-story-approvals.sh` | 2 |
| Frontmatter de spec sem campos obrigatórios | `paths-frontmatter-validator.sh` | 2 |

## Spec-driven (INV-002)

Documento gera código, não o contrário:
- PRD em `docs/prd/PRD-NNN-*.md`
- Épico em `docs/epicos/EP-NNN-*.md`
- Story em `docs/stories/US-NNN-*.md`
- ADR em `docs/decisions/ADR-NNN-*.md`
- Frontmatter obrigatório (`owner`, `revisado-em`, `status`).

**Precedência de template/checklist/KB (override sem fork):** ao usar um molde, verifique `.specify/overrides/<area>/<nome>.md` **primeiro**; só use `.specify/<area>/<nome>.md` se não houver override. `.specify/overrides/` é do projeto — `update` nunca toca. Override adapta artefato ao domínio; **não** burla `REGRAS-INEGOCIAVEIS.md` (hook não lê override).

## Pipeline mental por feature

1. **Sofia** (`gerente-produto`) — US clara? AC testável?
2. **Detetive** (`investigador`) — leu o estado atual?
3. **Rafael** (`tech-lead`) — precisa ADR?
4. **Bruno** (`dev-senior`) — implementa com TDD na lógica crítica.
5. **Revisor** — aderência à US? anti-padrões?
6. **Auditores** — Caio (segurança) + Júlia (qualidade) + Pedro (produto).
7. **Checkpoint** — walkthrough antes do merge.

## Comunicação

Sempre PT-BR. Sempre verificável ("rodei o teste, deu OK"). Sempre commits atômicos. Sempre stage seletivo.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
