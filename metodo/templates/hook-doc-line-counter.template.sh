#!/usr/bin/env bash
# Template: hook-doc-line-counter.template.sh
# Destino: .claude/hooks/doc-line-counter.sh
# Hook evento: PreToolUse
# Matcher: Write|Edit
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C9b, CONVENCOES-DOC
# orçamento: <300ms
# protocolo: PreToolUse Write|Edit em *.md. Le `limite-linhas: N` do frontmatter
#            e bloqueia (exit 2) se o conteudo apos a operacao exceder N linhas
#            (excluindo o proprio bloco frontmatter).
# severidade: MÉDIO
#
# POR QUE EXISTE:
# Docs criticos (CLAUDE.md, AGENTS.md, REGRAS-INEGOCIAVEIS.md) tendem a crescer
# sem controle e perdem utilidade — agentes ignoram blocos longos. O frontmatter
# declara `limite-linhas: N` como contrato: ultrapassou, refatore antes de salvar.
# Forca disciplina de concisao no proprio momento da escrita, nao em revisao
# tardia onde o autor ja esqueceu o contexto.
#
# LIMITACAO CONHECIDA:
# - Bypass trivial: aumentar `limite-linhas` no proprio commit. Este hook detecta
#   abandono de contrato, nao impede que o autor reescreva o contrato.
# - Conta linhas brutas. Linhas em bloco de codigo nao tem peso diferente.
# - Edit: simula resultado via replace simples (primeira ocorrencia). Casos com
#   multiplas ocorrencias e replace_all=false podem divergir do real, mas a
#   contagem fica conservadora (tende a superestimar, nao subestimar).

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "BLOCKED: dependencia 'jq' ausente — instale jq para o hook funcionar." >&2; exit 2; }

if command -v timeout >/dev/null 2>&1; then
  INPUT=$(timeout 1 cat || true)
else
  INPUT=$(cat || true)
fi
if [[ -z "${INPUT:-}" ]]; then
  exit 0
fi

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
if [[ -z "$FILE" ]]; then
  exit 0
fi

# So aplica a *.md
case "$FILE" in
  *.md) ;;
  *) exit 0 ;;
esac

TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')

CONTENT=""
case "$TOOL" in
  Write)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
    ;;
  Edit)
    NEW_STRING=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
    OLD_STRING=$(echo "$INPUT" | jq -r '.tool_input.old_string // empty')
    REPLACE_ALL=$(echo "$INPUT" | jq -r '.tool_input.replace_all // false')
    if [[ -f "$FILE" ]]; then
      CURRENT=$(cat "$FILE")
      if command -v python3 >/dev/null 2>&1; then
        CONTENT=$(CURRENT="$CURRENT" OLD="$OLD_STRING" NEW="$NEW_STRING" RA="$REPLACE_ALL" python3 -c '
import os
cur = os.environ.get("CURRENT", "")
old = os.environ.get("OLD", "")
new = os.environ.get("NEW", "")
ra  = os.environ.get("RA", "false") == "true"
if old and old in cur:
    if ra:
        print(cur.replace(old, new), end="")
    else:
        print(cur.replace(old, new, 1), end="")
else:
    print(cur, end="")
')
      else
        # Fallback: sem python3, usa conteudo atual (conservador).
        CONTENT="$CURRENT"
      fi
    else
      CONTENT="$NEW_STRING"
    fi
    ;;
  *)
    exit 0
    ;;
esac

if [[ -z "$CONTENT" ]]; then
  exit 0
fi

# Verifica se ha frontmatter (precisa comecar com ---)
FIRST_LINE=$(echo "$CONTENT" | head -n 1)
if [[ "$FIRST_LINE" != "---" ]]; then
  # Sem frontmatter — frontmatter-validator.sh ja vai bloquear isso. Aqui passamos.
  exit 0
fi

# Extrai bloco frontmatter
FM=$(echo "$CONTENT" | awk 'NR==1 && /^---$/ {flag=1; next} flag && /^---$/ {exit} flag {print}')

if [[ -z "$FM" ]]; then
  exit 0
fi

# Procura `limite-linhas: N`
LIMIT=$(echo "$FM" | grep -E '^limite-linhas:[[:space:]]*[0-9]+[[:space:]]*$' | head -n 1 | sed -E 's/^limite-linhas:[[:space:]]*([0-9]+).*$/\1/')

if [[ -z "$LIMIT" ]]; then
  # Sem limite declarado — nada a fazer.
  exit 0
fi

# Conta linhas do CORPO (excluindo frontmatter: linha 1 ---, FM, linha de fechamento ---).
# Fronteiras: encontra a linha do segundo "---".
BODY=$(echo "$CONTENT" | awk '
  BEGIN {flag=0; closed=0}
  NR==1 && /^---$/ {flag=1; next}
  flag && !closed && /^---$/ {closed=1; next}
  closed {print}
')

BODY_LINES=$(echo "$BODY" | wc -l | tr -d ' ')
# wc -l conta linhas terminadas em \n; se nao houver \n final, subestima em 1.
# Para `echo "$BODY" | wc -l` o echo adiciona \n, entao tendencialmente correto.

if [[ "$BODY_LINES" -gt "$LIMIT" ]]; then
  echo "BLOCKED: $FILE excederia limite-linhas=$LIMIT — corpo teria $BODY_LINES linhas." >&2
  echo "" >&2
  echo "Refatore antes de salvar:" >&2
  echo "  - Mova secoes detalhadas para arquivos irmaos (link ao inves de embutir)." >&2
  echo "  - Corte exemplos redundantes." >&2
  echo "  - Se o limite e o problema (nao o conteudo), aumente 'limite-linhas' no" >&2
  echo "    frontmatter — mas justifique em ADR/PR." >&2
  exit 2
fi

exit 0
