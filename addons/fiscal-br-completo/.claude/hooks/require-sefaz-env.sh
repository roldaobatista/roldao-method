#!/usr/bin/env bash
# require-sefaz-env.sh — barra codigo que emite NF-e sem ler SEFAZ_AMBIENTE de env.
# Hook PreToolUse, matcher: Write|Edit.
# FISCAL-003 — ambiente SEFAZ vem de env, nunca hardcoded.

set -u

INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/sefaz-env.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

# So aplica a codigo
case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx|*.py|*.go|*.rb|*.java|*.kt|*.cs|*.php) ;;
  *) exit 0 ;;
esac

# So aplica a arquivos que tocam NF-e
case "$FILE_PATH" in
  *nfe*|*NFe*|*nf-e*|*nfse*|*NFSe*|*sefaz*|*SEFAZ*|*fiscal*|*emit*) ;;
  *) exit 0 ;;
esac

printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $content = $json->{tool_input}->{content} // $json->{tool_input}->{new_string} // "";
  print $content;
' > "$TMPF" 2>/dev/null

if [ ! -s "$TMPF" ]; then
  exit 0
fi

# Detecta tentativa de emissao (palavras-chave)
if ! grep -qiE 'autoriza|enviarLote|sefaz|tpAmb|ambiente.*sefaz|emit.*nfe' "$TMPF"; then
  exit 0
fi

# Se nao tem env de ambiente sefaz no arquivo, bloquear
if ! grep -qiE 'env.*SEFAZ_AMBIENTE|env\.SEFAZ|process\.env\.SEFAZ|os\.environ.*SEFAZ|getenv.*SEFAZ|config.*sefaz|ENV\[.SEFAZ' "$TMPF"; then
  if grep -qiE 'NFE-003-exception|FISCAL-003-exception' "$TMPF"; then
    exit 0
  fi
  cat >&2 <<EOF
[require-sefaz-env] BLOQUEADO: codigo fiscal sem leitura de SEFAZ_AMBIENTE da env.

Arquivo: $FILE_PATH

Regra: FISCAL-003 / NFE-003 — ambiente SEFAZ (1=producao, 2=homologacao) sempre
vem de variavel de ambiente. Nunca hardcoded.

Por que:
  - Voce nao pode trocar prod<->homolog sem deploy.
  - Voce arrisca emitir nota fiscal real em ambiente de teste (problema legal).
  - Voce arrisca testar em producao (multa).

Correto:
  const SEFAZ_AMBIENTE = process.env.SEFAZ_AMBIENTE;
  if (!SEFAZ_AMBIENTE || !['1', '2'].includes(SEFAZ_AMBIENTE)) {
    throw new Error('SEFAZ_AMBIENTE deve ser "1" (prod) ou "2" (homolog)');
  }

Excecao na primeira linha do arquivo:
  // FISCAL-003-exception: <razao>
EOF
  exit 2
fi

exit 0
