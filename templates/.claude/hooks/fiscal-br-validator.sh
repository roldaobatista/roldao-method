#!/usr/bin/env bash
# fiscal-br-validator.sh — bloqueia padroes que violam regras fiscais BR.
# Hook PreToolUse, matcher: Write|Edit.
# FISCAL-001 (imutabilidade NF-e), FISCAL-002 (certificado), FISCAL-003 (ambiente).

set -u

INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/fiscal-validator.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

# Nao se aplica a docs/testes
case "$FILE_PATH" in
  *.md|*docs/*|*README*|*CHANGELOG*) exit 0 ;;
  *test*|*spec*|*fixture*) exit 0 ;;
esac

# So aplica a codigo
case "$FILE_PATH" in
  *.js|*.jsx|*.ts|*.tsx|*.py|*.go|*.rb|*.java|*.kt|*.cs|*.php|*.rs) ;;
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

VIOLATIONS=()
LINE_NUM=0

while IFS= read -r line || [ -n "$line" ]; do
  LINE_NUM=$((LINE_NUM + 1))
  trimmed=$(printf '%s' "$line" | sed -e 's/^[[:space:]]*//')

  # ignora comentarios
  case "$trimmed" in
    //*|\#*) continue ;;
  esac

  # ignora linha com excecao explicita
  if printf '%s\n' "$line" | grep -qE 'FISCAL-[0-9]+-exception'; then
    continue
  fi

  # FISCAL-001: regerar XML autorizado
  if printf '%s\n' "$line" | grep -qiE '(regenerate|regerar|rebuild|recreate|overwrite).{0,30}(nfe|nf-e|xml).{0,30}(autorizad|authorized|emitida)'; then
    VIOLATIONS+=("linha $LINE_NUM [FISCAL-001]: regeracao de XML autorizado: $line")
  fi
  if printf '%s\n' "$line" | grep -qiE '(nfe|nf-e|xml).{0,30}(autorizad|authorized|emitida).{0,30}(update|alter|modify|edit|rewrite)'; then
    VIOLATIONS+=("linha $LINE_NUM [FISCAL-001]: alteracao de XML autorizado: $line")
  fi

  # FISCAL-002: certificado hardcoded em codigo
  if printf '%s\n' "$line" | grep -qE '(certificate|certificado|pfx|p12|cert_path).{0,30}=.{0,30}["\047][^"\047]+\.(pfx|p12|pem)["\047]'; then
    if ! printf '%s\n' "$line" | grep -qiE 'env\.|process\.env|os\.environ|getenv|ENV\[|secret|vault'; then
      VIOLATIONS+=("linha $LINE_NUM [FISCAL-002]: caminho de certificado hardcoded: $line")
    fi
  fi

  # FISCAL-002: senha de certificado em texto puro
  if printf '%s\n' "$line" | grep -qiE '(cert_pass|cert_password|certificado_senha|pfx_pass|p12_pass).{0,5}=.{0,5}["\047][^"\047]{3,}["\047]'; then
    if ! printf '%s\n' "$line" | grep -qiE 'env\.|process\.env|os\.environ|getenv|ENV\[|secret|vault'; then
      VIOLATIONS+=("linha $LINE_NUM [FISCAL-002]: senha de certificado em texto puro: $line")
    fi
  fi

  # FISCAL-003: ambiente=1 (producao) hardcoded em codigo
  # v0.5.0: nao dispara se ha comentario na mesma linha mencionando homolog/dev/teste
  # OR se a linha aparenta ser constante de documentacao (`const tpAmb_PROD = 1`)
  if printf '%s\n' "$line" | grep -qE '(tpAmb|ambiente|environment).{0,10}=.{0,5}["\047]?1["\047]?'; then
    if ! printf '%s\n' "$line" | grep -qiE 'env\.|process\.env|os\.environ|getenv|ENV\[|config\.|settings\.'; then
      # ignora se linha tem comentario explicativo de homolog/dev/desenvolvimento/teste
      if printf '%s\n' "$line" | grep -qiE '(//|#|/\*).{0,80}(homolog|sandbox|desenvolvimento|dev|teste|test|exemplo|example|comentario|documenta)'; then
        :  # tudo bem, e comentario explicativo
      # ignora se a constante e claramente nomeada como producao (declaracao referencial)
      elif printf '%s\n' "$line" | grep -qiE '^[[:space:]]*(const|let|var|final|static)[[:space:]]+(tpAmb_PROD|TP_AMB_PROD|AMBIENTE_PRODUCAO|SEFAZ_PRODUCAO|PROD_ENV)'; then
        :  # declaracao de constante referencial OK (uso depende de env)
      else
        VIOLATIONS+=("linha $LINE_NUM [FISCAL-003]: ambiente SEFAZ=1 (producao) hardcoded: $line")
      fi
    fi
  fi

  # FISCAL-005: regex/coluna CNPJ apenas numerica
  # Detecta regex que aceita SO digitos pra CNPJ
  if printf '%s\n' "$line" | grep -qiE 'cnpj.{0,30}=.{0,30}/\^?\[0-9\]\{14\}\$?/'; then
    VIOLATIONS+=("linha $LINE_NUM [FISCAL-005]: regex CNPJ apenas numerica (pos jul/2026 aceita letras): $line")
  fi
  if printf '%s\n' "$line" | grep -qiE 'cnpj.{0,30}=.{0,30}/\^?\\\\d\{14\}\$?/'; then
    VIOLATIONS+=("linha $LINE_NUM [FISCAL-005]: regex CNPJ apenas numerica (pos jul/2026 aceita letras): $line")
  fi

done < "$TMPF"

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  MAX=3
  cat >&2 <<EOF
[fiscal-br-validator] Bloqueei a escrita: padrao que viola regra fiscal BR.

Arquivo: $FILE_PATH

Violacoes (ate $MAX):
EOF
  i=0
  for v in "${VIOLATIONS[@]}"; do
    [ "$i" -ge "$MAX" ] && break
    printf '  - %s\n' "$v" >&2
    i=$((i+1))
  done
  if [ "${#VIOLATIONS[@]}" -gt "$MAX" ]; then
    printf '  (... e mais %d ocorrencia(s))\n' "$((${#VIOLATIONS[@]} - MAX))" >&2
  fi
  cat >&2 <<EOF

Como destravar (caso a caso):
  FISCAL-001: NF-e autorizada nao pode ser alterada. Cancele ou emita CC-e.
  FISCAL-002: tire o certificado/senha do codigo. Coloque em variavel de ambiente.
  FISCAL-003: ambiente SEFAZ (1=producao, 2=homolog) vem de env, nunca do codigo.
  FISCAL-005: jul/2026: CNPJ aceita letras. Use [0-9A-Z]{14}, nao [0-9]{14}.

Detalhe: REGRAS-INEGOCIAVEIS.md (FISCAL-001..007).
Excecao por linha: // FISCAL-NNN-exception: <razao + responsavel>.
EOF
  exit 2
fi

exit 0
