#!/usr/bin/env bash
# validate-esocial-prazo.sh — alerta sobre evento eSocial sendo gravado fora de prazo legal.
# Hook PreToolUse, matcher: Write|Edit.
# ESOCIAL-001.

set -u

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

# So aplica a codigo que toca eSocial
case "$FILE_PATH" in
  *esocial*|*e-social*|*ESocial*|*eSocial*) ;;
  *.js|*.ts|*.py|*.go|*.java|*.cs|*.rb|*.php|*.rs)
    # le content e procura keywords
    CONTENT=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
      local $/;
      my $json = decode_json(<STDIN>);
      print $json->{tool_input}->{content} // $json->{tool_input}->{new_string} // "";
    ' 2>/dev/null)
    if ! printf '%s\n' "$CONTENT" | grep -qiE 'S-?[0-9]{4}|esocial|admissao|desligamento|cat-acid'; then
      exit 0
    fi
    ;;
  *) exit 0 ;;
esac

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/esocial-prazo.$$"
trap 'rm -f "$TMPF"' EXIT

printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{content} // $json->{tool_input}->{new_string} // "";
' > "$TMPF" 2>/dev/null

[ -s "$TMPF" ] || exit 0

WARNINGS=()

# S-2200 (admissao) — prazo: dia anterior ao inicio
if grep -qiE 'S-?2200|admiss' "$TMPF"; then
  # Procura padrao de "agendamento" / "enviar depois" / "amanha" / "no dia"
  if ! grep -qiE 'antes.{0,30}(inicio|admiss|dia[[:space:]]+anterior)' "$TMPF"; then
    WARNINGS+=("Codigo toca S-2200 (admissao) mas nao parece validar prazo 'dia anterior ao inicio'. ESOCIAL-001.")
  fi
fi

# S-2299 (desligamento) — prazo: 10 dia subsequente OR envio TRCT
if grep -qiE 'S-?2299|desligamento|rescis' "$TMPF"; then
  if ! grep -qiE '10.{0,30}(dia|days)|TRCT|trct|recibo' "$TMPF"; then
    WARNINGS+=("Codigo toca S-2299 (desligamento) mas nao parece validar prazo 10 dias ou TRCT. ESOCIAL-001.")
  fi
fi

# S-2210 (CAT) — prazo: 1 dia util (imediato se fatal)
if grep -qiE 'S-?2210|CAT|acidente' "$TMPF"; then
  if ! grep -qiE '1.{0,30}(dia|day)|imediato|primeiro[[:space:]]+dia' "$TMPF"; then
    WARNINGS+=("Codigo toca S-2210 (CAT) mas nao parece validar prazo 1 dia util. ESOCIAL-001 (multa alta).")
  fi
fi

# Verifica ambiente hardcoded (ESOCIAL-003)
if grep -qiE 'ESOCIAL_AMBIENTE.{0,10}=.{0,5}["\047]?1["\047]?' "$TMPF"; then
  if ! grep -qiE 'env|process\.env|os\.environ|getenv' "$TMPF"; then
    WARNINGS+=("ESOCIAL-003: ambiente eSocial=1 (producao) hardcoded. Use env.")
  fi
fi

if [ "${#WARNINGS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[validate-esocial-prazo] AVISO: integracao com eSocial sem validacao explicita de prazo legal.

Arquivo: $FILE_PATH

Pontos detectados:
EOF
  for w in "${WARNINGS[@]}"; do
    printf '  - %s\n' "$w" >&2
  done
  cat >&2 <<EOF

Prazos legais eSocial (ESOCIAL-001):
  S-2200 admissao -> dia anterior ao inicio das atividades
  S-2299 desligamento -> 10 dia subsequente OU envio TRCT
  S-2210 CAT -> 1 dia util (imediato se fatal)
  S-2230 afastamento -> dia 15 do mes seguinte
  S-1200/1210/1299 folha -> dia 15 do mes seguinte

Multa por atraso: R\$ 500 a R\$ 24.000 por evento (Decreto 8.373/2014).

NAO e BLOQUEIO — e AVISO. Confirme que ha controle de prazo (alerta, fila com agendamento) antes de seguir.
EOF
  # Aviso, nao bloqueio
fi

exit 0
