#!/usr/bin/env bash
# template: .claude/hooks/pre-edit-evidence.sh
# referência: INV-AGENT-003 (investigar antes de editar lógica de negócio)
# evento: PreToolUse
# matcher: Edit|Write
# severidade: ALTO (warn — não bloqueia, alerta forte)
# protocolo: detecta edição em arquivos de lógica de negócio sem leitura prévia
#            registrada na sessão. Emite warning loud em stderr; bloqueio real
#            fica para o pre-commit + auditor-doc-quality regra B.
#
# Heurística: arquivo de lógica de negócio = .py, .ts, .js, .rs, .go, .java
# em paths que contenham "src/", "lib/", "app/", "services/", "modules/",
# "controllers/", "domain/", "core/" — exclui tests/, fixtures/, mocks/.
#
# Verifica se houve invocação prévia de Read ou Grep tocando o mesmo arquivo
# OU se há evidência em .claude/.session-evidence (log opt-in que o agente
# popula durante investigação).

set -euo pipefail

command -v jq >/dev/null 2>&1 || exit 0

if command -v timeout >/dev/null 2>&1; then
  INPUT=$(timeout 1 cat || true)
else
  INPUT=$(cat || true)
fi
[[ -z "${INPUT:-}" ]] && exit 0

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[[ -z "$FILE" ]] && exit 0

# Filtra arquivos de lógica de negócio
case "$FILE" in
  *.py|*.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.rs|*.go|*.java|*.kt|*.rb|*.cs|*.php)
    ;;
  *)
    exit 0
    ;;
esac

# Exclui tests/fixtures/mocks/migrations
case "$FILE" in
  */tests/*|*/__tests__/*|*/test/*|*/spec/*|*/fixtures/*|*/__fixtures__/*|*/mocks/*|*/__mocks__/*) exit 0 ;;
  *.test.*|*.spec.*|*_test.*|*_spec.*) exit 0 ;;
  */migrations/*|*/db/migrate/*) exit 0 ;;
esac

# Verifica path de lógica de negócio
IS_BUSINESS_LOGIC=0
case "$FILE" in
  */src/*|*/lib/*|*/app/*|*/services/*|*/modules/*|*/controllers/*|*/domain/*|*/core/*|*/handlers/*|*/usecases/*|*/use-cases/*)
    IS_BUSINESS_LOGIC=1
    ;;
esac
[[ "$IS_BUSINESS_LOGIC" -eq 0 ]] && exit 0

# Checa evidência opt-in (.claude/.session-evidence)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
EVIDENCE_FILE="$PROJECT_DIR/.claude/.session-evidence"
if [[ -f "$EVIDENCE_FILE" ]] && grep -qF "$FILE" "$EVIDENCE_FILE" 2>/dev/null; then
  exit 0
fi

# Sem evidência registrada — emite warning loud
echo "" >&2
echo "WARNING (INV-AGENT-003): editando lógica de negócio em $FILE sem evidência registrada." >&2
echo "  Antes de mudar comportamento, INVESTIGUE o estado real:" >&2
echo "    - Banco: SELECT direto da entidade afetada." >&2
echo "    - Log: tail do app (ex: tail -n 200 .logs/app.log)." >&2
echo "    - Payload: console do navegador / payload IPC se UI." >&2
echo "  Registre achados em .claude/.session-evidence (uma linha por arquivo lido)." >&2
echo "  Mudar template/UI/CSS para 'consertar' comportamento é o anti-padrão #1 do método." >&2
echo "" >&2

exit 0
