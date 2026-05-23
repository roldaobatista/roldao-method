#!/usr/bin/env bash
# no-test-data-in-fixtures.sh — bloqueia dado pessoal real em fixture/seed/teste.
# Hook PreToolUse, matcher: Write|Edit.
# TST-004 — fixture/seed/test usam dados sinteticos, nunca dados reais de producao.
#
# v0.5.0: reescrito sem ${var:i:1} / for ((i...)) — compativel com bash 3.2 (macOS default).

set -uo pipefail
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

# Helper portátil pra detectar "todos os dígitos iguais" (cross-shell, sem bash 4 substring)
all_same_digits() {
  printf '%s' "$1" | perl -e '
    local $/;
    my $s = <STDIN>;
    chomp $s;
    exit 1 if length($s) == 0;
    my $first = substr($s, 0, 1);
    exit 0 if $s =~ /^\Q$first\E+$/;
    exit 1;
  '
}

VIOLATIONS=()

# CPF formatado: 000.000.000-00 — só CPFs reais (não sintéticos óbvios)
while IFS= read -r line || [ -n "$line" ]; do
  # extrair CPFs formatados da linha (compatível com bash 3)
  CPFS=$(printf '%s\n' "$line" | grep -oE '[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}' || true)
  [ -z "$CPFS" ] && continue
  while IFS= read -r cpf_match; do
    [ -z "$cpf_match" ] && continue
    digits=$(printf '%s' "$cpf_match" | tr -cd '0-9')
    [ "${#digits}" -ne 11 ] && continue
    # sintéticos comuns: todos iguais OU CPF de teste oficial
    if all_same_digits "$digits"; then continue; fi
    [ "$digits" = "12345678909" ] && continue
    [ "$digits" = "12345678900" ] && continue
    if printf '%s\n' "$line" | grep -qE 'TST-004-exception|sintetico|synthetic|fake-data'; then
      continue
    fi
    VIOLATIONS+=("CPF aparente em fixture: $cpf_match  ->  $line")
  done <<< "$CPFS"
done < "$TMPF"

# CPF NÃO formatado: 11 dígitos seguidos que passam no dígito verificador real.
# Só flag se for CPF algoritmicamente válido (evita falso positivo em ID aleatório).
cpf_dv_ok() {
  printf '%s' "$1" | perl -e '
    local $/; my $c = <STDIN>; chomp $c;
    exit 1 unless $c =~ /^\d{11}$/;
    my @d = split //, $c;
    exit 1 if (join("",@d) =~ /^(\d)\1{10}$/);
    for my $t (9,10) {
      my $s = 0; $s += $d[$_] * (($t+1)-$_) for (0..$t-1);
      my $r = ($s * 10) % 11; $r = 0 if $r == 10;
      exit 1 if $r != $d[$t];
    }
    exit 0;
  '
}
while IFS= read -r line || [ -n "$line" ]; do
  # Usa while em vez de for $(...) pra evitar word-splitting com paths/linhas
  # que contêm espaços ou metacaracteres (Revisor B9).
  while IFS= read -r cand; do
    [ -z "$cand" ] && continue
    all_same_digits "$cand" && continue
    [ "$cand" = "12345678909" ] && continue
    [ "$cand" = "12345678900" ] && continue
    cpf_dv_ok "$cand" || continue
    if printf '%s\n' "$line" | grep -qE 'TST-004-exception|sintetico|synthetic|fake-data'; then
      continue
    fi
    VIOLATIONS+=("CPF nao-formatado aparente em fixture: $cand  ->  $line")
  done < <(printf '%s\n' "$line" | grep -oE '[0-9]{11}' || true)
done < "$TMPF"

# Emails com domínio real de provedor pessoal
while IFS= read -r line || [ -n "$line" ]; do
  EMAILS=$(printf '%s\n' "$line" | grep -oE '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' || true)
  [ -z "$EMAILS" ] && continue
  while IFS= read -r email_match; do
    [ -z "$email_match" ] && continue
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
  done <<< "$EMAILS"
done < "$TMPF"

# Telefone BR formatado: (XX) 9XXXX-XXXX
while IFS= read -r line || [ -n "$line" ]; do
  TELS=$(printf '%s\n' "$line" | grep -oE '\([0-9]{2}\)[[:space:]]?9[0-9]{4}-[0-9]{4}' || true)
  [ -z "$TELS" ] && continue
  while IFS= read -r tel_match; do
    [ -z "$tel_match" ] && continue
    digits=$(printf '%s' "$tel_match" | tr -cd '0-9')
    [ "${#digits}" -lt 10 ] && continue
    if all_same_digits "$digits"; then continue; fi
    [ "$digits" = "11999999999" ] && continue
    if printf '%s\n' "$line" | grep -qE 'TST-004-exception|sintetico|synthetic|fake-data'; then
      continue
    fi
    VIOLATIONS+=("Telefone BR aparente em fixture: $tel_match  ->  $line")
  done <<< "$TELS"
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
  - Geracao programatica: use a skill 'gerar-test-fixture-br' (CPF/CNPJ/CEP/E.164 validos).

Excecao: se MESMO assim precisa do dado real (caso reproduzido pra debug pontual),
adicione na mesma linha ou no header:
  // TST-004-exception: <razao clara e tempo de retencao>
EOF
  exit 2
fi

exit 0
