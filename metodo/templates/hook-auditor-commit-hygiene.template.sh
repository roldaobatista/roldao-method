#!/usr/bin/env bash
# template: .claude/hooks/auditor-commit-hygiene.sh
# referência: INV-AGENT-007 (commits atômicos, sem git add . cego)
# evento: PreToolUse Bash (detecta git add/commit)
# severidade: MEDIO (warn — nao bloqueia. Higiene e diretriz, nao barreira.)
# protocolo: lê JSON do stdin, inspeciona comando git. Avisa sobre stage cego
#            e sobre commit que mistura mais de 3 áreas distintas.
#
# NOTA: este hook NAO bloqueia mais. `git add .` em projeto pessoal/solo e
# pratica aceitavel; bloqueio rigido travava fluxo trivial. A higiene fica
# como aviso e e cobrada formalmente pelo auditor-doc-quality em pre-merge
# quando o projeto define INV-AGENT-007 como CRITICO/ALTO.

set -euo pipefail

command -v jq >/dev/null 2>&1 || exit 0

if command -v timeout >/dev/null 2>&1; then
  INPUT=$(timeout 1 cat || true)
else
  INPUT=$(cat || true)
fi
[[ -z "${INPUT:-}" ]] && exit 0

CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[[ -z "$CMD" ]] && exit 0

CMD_NORM=$(echo "$CMD" | tr -s ' ')

# CATEGORIA A: stage cego — apenas WARNING
if echo "$CMD_NORM" | grep -qE '\bgit[[:space:]]+add[[:space:]]+(\.|-A|--all)([[:space:]]|$)'; then
  echo "WARNING (INV-AGENT-007): git add . / git add -A pode incluir arquivos nao-relacionados." >&2
  echo "  Prefira stage seletivo por arquivo nomeado:" >&2
  echo "    git status                    # ver o que esta dirty" >&2
  echo "    git diff <arquivo>            # ver mudanca especifica" >&2
  echo "    git add <arquivo1> <arquivo2> # stage so o que vai entrar no commit" >&2
  echo "  Nao bloqueia — em projeto solo/pessoal e aceitavel quando voce sabe o que esta dirty." >&2
fi

# CATEGORIA B: warning se commit mistura >3 áreas distintas
if echo "$CMD_NORM" | grep -qE '\bgit[[:space:]]+commit\b'; then
  if command -v git >/dev/null 2>&1; then
    # `|| true` em cada etapa evita que set -e mate o script em repo vazio sem HEAD.
    AREAS=0
    if git rev-parse --verify HEAD >/dev/null 2>&1; then
      AREAS=$(git diff --cached --name-only 2>/dev/null | awk -F'/' '{print $1"/"$2}' | sort -u | wc -l 2>/dev/null || echo 0)
      AREAS=${AREAS:-0}
    fi
    if [[ "$AREAS" -gt 3 ]]; then
      echo "WARNING (INV-AGENT-007): commit toca $AREAS areas distintas — considere fatiar." >&2
      echo "  Commits atomicos = uma intencao por commit. Veja: git diff --cached --name-only" >&2
    fi
  fi
fi

exit 0
