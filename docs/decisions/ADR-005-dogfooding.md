---
id: ADR-005
titulo: Dogfooding — o próprio repo aplica suas regras
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-005 — Dogfooding (o próprio repo aplica suas regras)

## Contexto

Framework que prega regras pra projetos cliente mas não aplica em si mesmo perde credibilidade rapidamente. Pior: drift silencioso entre o que o template entrega e o que o código real do framework usa.

## Decisão

O repositório `roldao-method` **se instala em si próprio**. A raiz tem:

- `.claude/` (instalado a partir de `templates/.claude/`) — agentes, hooks, commands, skills, rules, settings, statusline aplicados ao próprio desenvolvimento do framework.
- `.specify/` (instalado a partir de `templates/.specify/`) — memory, overrides, templates, checklists, data.
- `AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md` na raiz — mesmas regras pra quem desenvolve o framework.

Os arquivos da raiz em `.claude/` e `.specify/` ficam **não-versionados** (`.gitignore` cobre) — são output do `install`, não fonte. Fonte canônica é `templates/`.

## Consequências

**Positivas:**
- Hook `block-destructive.sh` impede `git push --force` no próprio repo.
- `auditor-seguranca` audita o framework com a mesma régua que aplicaria em cliente.
- Drift template↔real-world é zero — se template muda, dogfood quebra primeiro.
- PR rodando no GitHub usa os mesmos workflows que clientes usam.

**Negativas:**
- Contribuidor novo precisa rodar `npm run install` antes de trabalhar (pra `.claude/` aparecer). Mitigado em `CONTRIBUTORS.md`.
- 2 caminhos pra mesma coisa (`.claude/` na raiz vs `templates/.claude/`). Mitigado: raiz é gerada, template é fonte. `git status` mostra `.claude/` como ignorado.
- Workflows GH que leem `.claude/agents/` quebram em fork limpo. **Mitigação:** workflows usam `templates/.claude/agents/` como fallback (ver `.github/workflows/claude-headless-lgpd.yml` e `claude-review.yml`).

## Alternativas descartadas

- **Sem dogfood:** descartado. Drift fica invisível até cliente reclamar.
- **Symlink `.claude/` → `templates/.claude/`:** descartado. Windows tem problemas com symlink + git.
- **Hardlink:** mesma issue.

## Non-goals

- **Não exige que addons sejam dogfooded no próprio repo** — addons são código de domínio, não precisam aplicar regras de si mesmos.
- **Não suporta uninstall do dogfood** — sempre reinstala via `npm run install`. Estado intermediário não é coberto.
- **Não cobre Windows sem Git Bash** (igual ADR-002 — hooks ficam silenciosos no PowerShell puro).

## Como aplicar

`npm run install` (ou `node bin/install.js` na raiz) copia `templates/.claude/` → `.claude/` e `templates/.specify/` → `.specify/`. `.gitignore` cobre os destinos. Workflows GH usam `templates/.claude/agents/` como fallback quando `.claude/` não existe (fork/CI fresh).
