#!/usr/bin/env bash
# no-test-data-in-fixtures.sh — bloqueia dado pessoal real em fixture/seed/teste.
# Hook PreToolUse, matcher: Write|Edit.
# TST-004 — fixture/seed/test usam dados sinteticos, nunca dados reais de producao.

set -u

INPUT=$(cat)

TMPF=$(mktemp 2>/dev/null) || TMPF="${TMPDIR:-/tmp}/no-real-data.$$"
trap 'rm -f "$TMPF"' EXIT

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

# Aplica apenas se path indica fixture/seed/test/mock data
case "$FILE_PATH" in
  *fixture*|*fixtures*|*seed*|*seeds*|*mock-data*|*mockdata*|*test-data*|*testdata*|*sample*|*samples*) ;;
  *.test.*|*.spec.*|*test/*|*tests/*|*spec/*|*specs/*) ;;
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

# CPF real: 11 digitos com DV matematicamente valido nao deve aparecer em fixture
# Detectamos CPFs em formato comum (XXX.XXX.XXX-XX ou 11 digitos) que NAO sao os tipicos sinteticos
# CPFs sinteticos comuns aceitos: 00000000000, 11111111111 ... 99999999999, 12345678909 (teste oficial)
while IFS= read -r line || [ -n "$line" ]; do
  # CPF formatado: 000.000.000-00
  while read -r cpf_match; do
    [ -z "$cpf_match" ] && continue
    # extrair so digitos
    digits=$(printf '%s' "$cpf_match" | tr -cd '0-9')
    [ ${#digits} -ne 11 ] && continue
    # sinteticos comuns: todos iguais (00000... 99999...) ou CPF teste 12345678909
    first_digit=${digits:0:1}
    all_same=true
    for ((i=0; i<11; i++)); do
      if [ "${digits:$i:1}" != "$first_digit" ]; then all_same=false; break; fi
    done
    [ "$all_same" = "true" ] && continue
    [ "$digits" = "12345678909" ] && continue
    [ "$digits" = "12345678900" ] && continue
    # se nao for tipico de teste, avisar
    if printf '%s\n' "$line" | grep -qE 'TST-004-exception|sintetico|synthetic|fake-data'; then
      continue
    fi
    VIOLATIONS+=("CPF aparente em fixture: $cpf_match  ->  $line")
  done < <(printf '%s\n' "$line" | grep -oE '[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}' || true)
done < "$TMPF"

# Emails com dominio real (gmail, hotmail, yahoo, outlook, icloud, uol, terra, ig)
while IFS= read -r line || [ -n "$line" ]; do
  while read -r email_match; do
    [ -z "$email_match" ] && continue
    # sinteticos aceitos: example.com, test.com, fake.com, localhost, exemplo.com
    domain=$(printf '%s' "$email_match" | sed 's/.*@//' | tr '[:upper:]' '[:lower:]')
    case "$domain" in
      example.com|example.com.br|test.com|test.local|fake.com|exemplo.com|exemplo.com.br|localhost|*.test|*.local|*.example) continue ;;
    esac
    if printf '%s\n' "$line" | grep -qE 'TST-004-exception|sintetico|synthetic|fake-data'; then
      continue
    fi
    case "$domain" in
      gmail.com|hotmail.com|yahoo.com|yahoo.com.br|outlook.com|icloud.com|live.com|uol.com.br|terra.com.br|ig.com.br|bol.com.br)
        VIOLATIONS+=("Email de provedor real em fixture: $email_match  ->  $line")
        ;;
    esac
  done < <(printf '%s\n' "$line" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' || true)
done < "$TMPF"

# Telefone real BR formatado: (XX) 9XXXX-XXXX onde DDD e celular sao plausíveis
# Sinteticos comuns: (00) 00000-0000, (11) 99999-9999 (ok, sintetico claro), (11) 91234-5678
while IFS= read -r line || [ -n "$line" ]; do
  while read -r tel_match; do
    [ -z "$tel_match" ] && continue
    digits=$(printf '%s' "$tel_match" | tr -cd '0-9')
    [ ${#digits} -lt 10 ] && continue
    # sinteticos: todos iguais
    first_digit=${digits:0:1}
    all_same=true
    for ((i=0; i<${#digits}; i++)); do
      if [ "${digits:$i:1}" != "$first_digit" ]; then all_same=false; break; fi
    done
    [ "$all_same" = "true" ] && continue
    # 11 99999-9999 e tipico de teste
    [ "$digits" = "11999999999" ] && continue
    if printf '%s\n' "$line" | grep -qE 'TST-004-exception|sintetico|synthetic|fake-data'; then
      continue
    fi
    VIOLATIONS+=("Telefone BR aparente em fixture: $tel_match  ->  $line")
  done < <(printf '%s\n' "$line" | grep -oE '\([0-9]{2}\)\s?9[0-9]{4}-[0-9]{4}' || true)
done < "$TMPF"

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[no-test-data-in-fixtures] BLOQUEADO: dado pessoal aparentemente real em fixture/seed/teste.

Arquivo: $FILE_PATH

Violacoes encontradas:
EOF
  for v in "${VIOLATIONS[@]}"; do
    printf '  - %s\n' "$v" >&2
  done
  cat >&2 <<EOF

Regra: TST-004 — fixtures, seeds e testes usam dados sinteticos. Dados reais
de cliente em fixture vazam pra repo, CI, ambiente de dev e por log de teste.

Use:
  - CPF/CNPJ: validos por algoritmo mas com padrao sintetico claro (ex: 12345678909)
  - Email: dominios reservados — example.com, test.local, exemplo.com.br
  - Telefone: (11) 99999-9999 ou variacoes obviamente fake
  - Nomes: "Fulano de Tal", "Maria Teste", "Empresa Exemplo Ltda"

Excecao: se MESMO assim precisa do dado real (caso reproduzido pra debug pontual),
adicione na mesma linha ou no header:
  // TST-004-exception: <razao clara e tempo de retencao>
EOF
  exit 2
fi

exit 0
