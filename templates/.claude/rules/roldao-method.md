---
description: ROLDAO-METHOD — regras unificadas. No Claude Code, os 26 hooks bloqueadores codificam tudo isto. Este arquivo é referência rápida para revisar contrato sem abrir cada hook.
paths: ["**/*"]
status: stable
owner: framework
revisado-em: 2026-05-24
---

# ROLDAO-METHOD — regras unificadas

> No Claude Code os hooks em `.claude/hooks/` codificam estas regras mecanicamente. Bloqueio acontece de 2 jeitos: `exit 2` (PreToolUse) ou JSON `{"decision":"block"}` (PostToolUse/Stop). Este arquivo é referência rápida para auditar o contrato sem abrir os 34 scripts.

## REGRA #0 — Investigar antes de mexer em lógica de negócio

Quando o usuário reportar bug:
1. **NÃO** mexer no código antes de entender a causa.
2. **Ler o estado real:** banco, logs, payload, console, config.
3. **Rastrear o fluxo:** origem → persistência → leitura.
4. **Confirmar entendimento** se houver ambiguidade.
5. **Só então:** implementar, no ponto raiz, não no sintoma.

Codificado em: `require-investigador-before-fix.js`, `regra-zero-reminder.js`, workflow `/bug`.

## Linguagem com o usuário não-programador

Sem jargão técnico sem tradução. Tabela canônica em `templates/CLAUDE.md`.

Codificado em: `block-jargon-pt-br.js` (soft warning).

## Executar, não passar pro usuário (INV-AGENT-006)

Nunca perguntar "quer que eu...?", "posso fazer X?", "devo continuar?". Decida e reporte depois. Exceções (perguntar antes): operações destrutivas, gasto financeiro, mudança pública, credenciais.

Codificado em: `block-confirmation-questions.js`.

## Pró-atividade, não permissão (INV-AGENT-003)

Ao identificar gap/bug/débito: **resolver**. INV-AGENT-003 trata do GATILHO (o momento em que você decide se vai agir sobre algo que descobriu); INV-AGENT-006 trata da FORMA (não perguntar). Os 3 auditores aplicam fix trivial — ver seção "Correções que VOCÊ aplica sem pedir" em `auditor-seguranca`, `auditor-qualidade`, `auditor-produto`.

## Pix — chave Pix é dado pessoal (PIX-004 + LGPD-001/004)

Logs do projeto nunca devem ter chave Pix completa em texto puro. Mascarar (`***@***`, `***.***.***-99`). Acessos a chave Pix logados e auditados. Verificação operacional vive no addon `fintech-br`; aqui no core o lembrete é doutrinário pra qualquer projeto que integrar Pix.

## Bloqueios duros codificados em hook

| Regra | Hook | Exit |
|---|---|---|
| Sem `rm -rf`, `git push --force`, `--no-verify` | `block-destructive.js` | 2 |
| Sem secret (AWS/PAT/PEM) em código ou commit | `secrets-scanner.js`, `block-secrets-in-commit-message.js` | 2 |
| Sem mascaramento em teste (`@ts-ignore`, `.skip()`, `xit`, `assertTrue(true)`, `\|\| true` em comando de teste) | `anti-mascaramento.js` | 2 |
| Pergunta de confirmação na resposta ("quer que eu...?") — INV-AGENT-006 | `block-confirmation-questions.js` | block (JSON) |
| Jargão técnico sem tradução PT-BR — INV-AGENT-001 | `block-jargon-pt-br.js` | block (JSON) |
| `/feature` sem completar pipeline (Sofia → Detetive → Rafael → Bruno → Inês → 3 auditores) | `enforce-pipeline-completion.js` | block (JSON) |
| Mock em integration/ ou e2e/ | `block-mock-in-integration.js` | 2 |
| TODO sem ID rastreável | `block-todo-without-issue.js` | 2 |
| Test fixture com CPF/email/telefone real | `no-test-data-in-fixtures.js` | 2 |
| URL SEFAZ/Pix/gateway hardcoded | `no-hardcoded-env-urls.js` | 2 |
| Ambiente SEFAZ=1 hardcoded | `fiscal-br-validator.js` | 2 |
| `git commit --amend` após push | `no-amend-after-push.js` | 2 |
| MCP fora da allowlist | `mcp-validator.js` | 2 |
| Pirâmide de teste invertida (E2E sem unit) | `validate-test-pyramid.js` | 2 |
| `/feature` sem readiness pronto | `require-readiness-before-feature.js` | 2 |
| Story sem dependência entregue | `validate-story-dependencies.js` | 2 |
| `/feature` sem Sofia → Detetive → Rafael | `require-agent-sequence-before-dev.js` | 2 |
| `/quick-dev` > 3 arquivos | `validate-quick-dev-scope.js` | 2 |
| `/bug` sem investigador | `require-investigador-before-fix.js` | 2 |
| Commit feat/fix sem T-NNN | `commit-message-validator.js` | 2 |
| Commit/merge sem checkpoint | `require-checkpoint-before-merge.js` | 2 |
| Commit sem 3 auditores aprovados | `require-auditors-pass-before-commit.js` | 2 |
| Story marcada entregue sem audit trail | `validate-story-approvals.js` | 2 |
| Frontmatter de spec sem campos obrigatórios | `paths-frontmatter-validator.js` | 2 |
| Chave Pix logada em texto puro (PIX-004) | `no-log-pix-key.js` | 2 |
| Código toca dado pessoal sem base legal declarada (LGPD-001/007) | `lgpd-base-legal-reminder.js` | 0 (soft warning) |
| Lembrete REGRA #0 antes de bug — UserPromptSubmit | `regra-zero-reminder.js` | 0 (soft warning) |

**Total:** 26 hooks bloqueadores (23 via `exit 2` + 3 via JSON `decision:block`) + 2 soft warnings + 5 lifecycle/automação (`auto-format-on-write`, `context-budget`, `session-snapshot`, `session-snapshot-restore`, `subagent-handoff-audit`) + 1 utilitário interno (`_lib.js`) = **34 arquivos** em `.claude/hooks/`.

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
5. **Inês** (`revisor`) — aderência à US? anti-padrões? defeito no diff?
6. **Auditores** — Caio (segurança) + Júlia (qualidade) + Pedro (produto).
7. **Checkpoint** — walkthrough antes do merge.

**Precedência de correção** (quando 2 auditores tocam o mesmo arquivo):
1. Caio (segurança) tem prioridade sobre todos — SEC vence forma.
2. Pedro (produto) — UX/business affect cliente.
3. Júlia (qualidade) — code style, cobertura.
4. Inês (revisor) — defeito técnico do diff específico.

## Comunicação

Sempre PT-BR. Sempre verificável ("rodei o teste, deu OK"). Sempre commits atômicos. Sempre stage seletivo.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
