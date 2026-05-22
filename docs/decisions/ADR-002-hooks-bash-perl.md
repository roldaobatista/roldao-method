---
id: ADR-002
titulo: Hooks em bash + perl, não Node
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-002 — Hooks em bash + perl (não Node)

## Contexto

Claude Code dispara hooks a cada evento (`PreToolUse`, `PostToolUse`, `Stop`, `SubagentStop`, `PreCompact`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`). Um projeto sob ROLDAO-METHOD pode disparar 50-200 hooks por sessão de trabalho. O custo de boot do Node (≈80-150ms por invocação) é pago em cada um. Para hooks que leem JSON via stdin e decidem `exit 0`/`exit 2`, esse custo é proibitivo.

Adicionalmente, Node tem dependência de versão (≥18) e instalação opcional. Bash 3.2+ vem nativo em macOS/Linux e via Git for Windows no Windows. Perl 5.12+ vem junto com Git Bash, macOS, e quase toda distro Linux.

## Decisão

Hooks são **scripts shell (`*.sh`)** que delegam parsing de JSON ao **perl** via `perl -MJSON::PP`. Sem dependência de `jq`, sem dependência de Node. O wrapper `_lib.sh` centraliza helpers (sanitização de path, hash de sessão, leitura de stdin).

## Consequências

**Positivas:**
- Latência de hook em ~5-15ms (bash + perl) vs 100ms+ (Node).
- Nenhum hook quebra se o projeto cliente não usa Node.
- Wrapper único (`_lib.sh`) reaproveitado por 34 hooks.

**Negativas:**
- Sintaxe shell tem armadilhas (aspas, expansão de variáveis). Mitigado por `set -u` + shellcheck no CI + helpers em `_lib.sh`.
- Perl é considerado "legado" por contribuidor moderno. Aceito — `JSON::PP` é estável há 15+ anos e vem com Git Bash.
- **Windows sem Git Bash não roda hooks** (PowerShell puro não executa `*.sh`). Documentado em `docs/TROUBLESHOOTING.md` e checado por hook `windows-git-bash-check.sh`.

## Alternativas descartadas

- **Node nos hooks:** descartado por latência (100ms × 200 hooks = 20s de overhead/sessão).
- **`jq` em vez de perl:** descartado porque `jq` não vem nativo no Git Bash (Windows seria quebrado).
- **PowerShell + shell:** descartado por dobrar manutenção e quebrar paridade.

## Como aplicar

Novo hook segue o esqueleto em `templates/.claude/hooks/_lib.sh` (load helpers + `set -u`). Parsing de JSON usa `perl -MJSON::PP -e`. Testes em `_test-runner.sh` via `run_case`. Cobertura validada por `tools/validar-cobertura-hooks.js`.
