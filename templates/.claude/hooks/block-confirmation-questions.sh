#!/usr/bin/env bash
# block-confirmation-questions.sh — bloqueia respostas do tipo "quer que eu...?", "posso X?".
# Hook PostToolUse / Stop — analisa texto de resposta.
# INV-AGENT-006 — executar, nao passar pro usuario nao-programador.

set -u

INPUT=$(cat)

RESP=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $r = $json->{response} // $json->{message} // "";
  if (!$r && ref($json->{tool_response}) eq "HASH") {
    $r = $json->{tool_response}->{content} // $json->{tool_response}->{text} // "";
  } elsif (!$r && ref($json->{tool_response}) eq "") {
    $r = $json->{tool_response} // "";
  }
  print ref($r) ? "" : $r;
' 2>/dev/null)

[ -z "$RESP" ] && exit 0

# Padroes proibidos quando o agente PODE fazer (tem a ferramenta, nao e destrutivo)
# Lista cobre PT-BR + EN
PATTERNS=(
  '\bquer (que eu|q eu)\b'
  '\bposso (fazer|criar|gerar|continuar|seguir|aplicar|adicionar|remover|implementar|prosseguir|avancar|avan[cç]ar|encerrar|finalizar|parar|editar|refatorar|mexer|ajustar|mudar|atualizar|deletar|apagar|rodar|executar)\b'
  '\bdevo (continuar|seguir|fazer|criar|aplicar|prosseguir|avancar|avan[cç]ar|encerrar|finalizar|parar|implementar|mexer|ajustar)\b'
  '\b(voce|voc[eê]) prefere\b.*\b(ou|/)\b'
  '\bqual (voce|voc[eê]) (prefere|quer|acha|gostaria)\b'
  '\bse (voce|voc[eê]) (quiser|preferir|desejar|achar melhor)\b'
  '\bse desejar\b'
  '\b(gostaria|deseja|desejaria|gostarias) que eu\b'
  '\b(quer|deseja|gostaria|prefere) que eu (faca|fa[cç]a|continue|prossiga|implemente|crie|aplique)\b'
  '\b(deixa|deixo|posso deixar) eu\b'
  '\b(continuo|prossigo|avan[cç]o|sigo|encerro|paro|fa[cç]o) (ou|e) (paro|aguardo|espero|fico|deixo|volto)\b'
  '\bte (pergunto|consulto)\b'
  '\baguardo (sua|seu) (confirma[cç][aã]o|resposta|aval|ok|sinal)\b'
  '\bshould I (continue|proceed|create|make|apply|generate|add|remove)\b'
  '\bdo you want me to\b'
  '\bwould you like me to\b'
)

# Excecoes: confirmacoes legitimas em situacao destrutiva ou que custa $$
LEGIT_EXCEPTIONS=(
  '\bnpm publish\b'
  '\bdrop (table|database)\b'
  '\bgit push --force\b'
  '\brm -rf\b'
  '\breset --hard\b'
  '\brotacion(ar|ado) credencial'
  '\bdeletar (producao|prod|dados)\b'
  '\bcobrar\b|\bgastar\b|\bpagar\b'
  '\bcredencial\b'
  '\bgastos com terceiros\b'
)

# Monta o regex combinado das excecoes legitimas (destrutivo / custo / credencial).
# A excecao so vale se estiver NA MESMA LINHA da pergunta de confirmacao —
# mencionar "credencial" em outro paragrafo NAO pode desligar a checagem inteira.
LEGIT_RE=$(IFS='|'; printf '%s' "${LEGIT_EXCEPTIONS[*]}")

VIOLATIONS=()
# Perl scan: pra cada linha que bate com algum padrao proibido, olha as
# 3 linhas anteriores. Se qualquer uma das 4 (3 acima + a propria) cita
# operacao destrutiva/gasto/credencial, considera legitima e libera.
PERL_PATS=$(printf '%s\n' "${PATTERNS[@]}" | paste -sd '|' -)
PERL_LEGIT="$LEGIT_RE"

while IFS= read -r vline || [ -n "$vline" ]; do
  [ -z "$vline" ] && continue
  VIOLATIONS+=("$vline")
done < <(
  printf '%s' "$RESP" | PAT="$PERL_PATS" LEGIT="$PERL_LEGIT" perl -e '
    my $pat   = $ENV{PAT};
    my $legit = $ENV{LEGIT};
    my @buf;
    while (my $line = <STDIN>) {
      chomp $line;
      push @buf, $line;
      shift @buf if @buf > 4;  # mantem janela de 4 (3 acima + atual)
      if ($line =~ /$pat/i) {
        my $ctx = join("\n", @buf);
        next if $ctx =~ /$legit/i;
        my ($hit) = ($line =~ /($pat)/i);
        print "pergunta de confirmacao: \x27$hit\x27 -> $line\n";
      }
    }
  '
)

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  # Limita a 3 violacoes pra nao vomitar resposta inteira de volta.
  MAX=3
  VIOLATIONS_STR=$(printf '  - %s\n' "${VIOLATIONS[@]:0:$MAX}")
  EXTRA=""
  if [ "${#VIOLATIONS[@]}" -gt "$MAX" ]; then
    EXTRA="  (... e mais $((${#VIOLATIONS[@]} - MAX)) ocorrencia(s))"
  fi

  # Mensagem clara em stderr (para humanos lerem nos logs) +
  # JSON estruturado em stdout (para o harness bloquear a resposta).
  cat >&2 <<EOF
[block-confirmation-questions] resposta empurrou decisao pro usuario (INV-AGENT-006).

O usuario nao programa. Pergunta como "quer que eu...?" / "posso X?" / "devo continuar?"
quebra o fluxo. Voce tem a ferramenta — execute o melhor caminho e reporte depois.

Violacoes (limite $MAX):
${VIOLATIONS_STR}
${EXTRA}

Como corrigir: refaca a resposta executando direto. Se for operacao destrutiva
(rm -rf, push --force, drop table, npm publish, gasto financeiro, credencial),
cite isso EXPLICITAMENTE na mesma linha da pergunta.
EOF

  REASON_TEXT="Resposta contem pergunta de confirmacao que poderia ser executada direto (INV-AGENT-006). Execute e reporte depois."
  printf '%s' "$REASON_TEXT" | perl -MJSON::PP -e '
    local $/;
    my $reason = <STDIN>;
    print encode_json({ decision => "block", reason => $reason });
  '
  exit 0
fi

exit 0
