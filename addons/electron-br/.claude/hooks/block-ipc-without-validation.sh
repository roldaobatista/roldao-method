#!/usr/bin/env bash
# block-ipc-without-validation.sh — barra ipcMain.handle sem validacao de schema na primeira linha.
# Hook PreToolUse, matcher: Write|Edit.
# ELECTRON-002 — IPC handler valida schema na primeira linha.

set -u

INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/ipc-val.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

# So agir em arquivos de main process
case "$FILE_PATH" in
  *src/main/*|*main/ipc/*|*/electron/main/*) ;;
  *) exit 0 ;;
esac

printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $content = $json->{tool_input}->{content} // $json->{tool_input}->{new_string} // "";
  print $content;
' > "$TMPF" 2>/dev/null

[ ! -s "$TMPF" ] && exit 0

# Procura ipcMain.handle('xxx', async/function() {  e ve as 3 linhas seguintes
VIOLATIONS=()
LINE_NUM=0
in_handler=0
handler_start=0
handler_line=""
while IFS= read -r line || [ -n "$line" ]; do
  LINE_NUM=$((LINE_NUM + 1))
  if [ "$in_handler" -eq 0 ] && printf '%s' "$line" | grep -qE 'ipcMain\.handle\('; then
    in_handler=1
    handler_start=$LINE_NUM
    handler_line="$line"
    body_check=""
    continue
  fi
  if [ "$in_handler" -eq 1 ]; then
    body_check="$body_check $line"
    # Pegamos 4 linhas do corpo do handler
    if [ "$((LINE_NUM - handler_start))" -ge 4 ]; then
      # Verifica se as primeiras linhas tem validacao
      if ! printf '%s' "$body_check" | grep -qE '(\.parse\(|\.safeParse\(|validate\(|ajv\.|Joi\.|assertSchema|zod\.|z\.)'; then
        VIOLATIONS+=("L$handler_start: $handler_line  ->  handler sem validacao Zod/Ajv/Joi nas 4 primeiras linhas")
      fi
      in_handler=0
    fi
  fi
done < "$TMPF"

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[block-ipc-without-validation] BLOQUEADO: IPC handler sem validacao de schema.

Arquivo: $FILE_PATH

Violacoes:
EOF
  for v in "${VIOLATIONS[@]}"; do
    printf '  - %s\n' "$v" >&2
  done
  cat >&2 <<EOF

Regra: ELECTRON-002 — IPC handler valida payload do renderer ANTES de executar.

Renderer e nao-confiavel. Sem validacao = canal aberto pra injecao.

Exemplo:
  ipcMain.handle('cliente:cadastrar', async (e, payload) => {
    const data = MeuSchema.parse(payload);  // <-- obrigatorio
    // resto do handler
  });
EOF
  exit 2
fi

exit 0
