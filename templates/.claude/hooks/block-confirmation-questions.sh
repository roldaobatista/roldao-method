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
  '\bquer que eu\b'
  '\bposso (fazer|criar|gerar|continuar|seguir|aplicar|adicionar|remover|implementar)\b'
  '\bdevo (continuar|seguir|fazer|criar|aplicar)\b'
  '\bvoce prefere\b.*\b(ou|/)\b'
  '\bse voce quiser\b'
  '\bse desejar\b'
  '\bgostaria que eu\b'
  '\bdeseja que eu\b'
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

# Se a resposta menciona algo destrutivo/custo, confirmacao e legitima
for excep in "${LEGIT_EXCEPTIONS[@]}"; do
  if printf '%s\n' "$RESP" | grep -qiE -- "$excep"; then
    exit 0
  fi
done

# Olha primeiros 8 padroes
VIOLATIONS=()
for pat in "${PATTERNS[@]}"; do
  HIT=$(printf '%s\n' "$RESP" | grep -oiE -- "$pat" | head -n1 || true)
  if [ -n "$HIT" ]; then
    CTX=$(printf '%s\n' "$RESP" | grep -iE -- "$pat" | head -n1 || true)
    VIOLATIONS+=("pergunta de confirmacao: '$HIT' -> $CTX")
  fi
done

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  # Gera JSON via perl encode_json — VIOLATIONS contem texto livre da resposta
  # do agente, que pode ter aspas/newlines que quebram heredoc cru.
  VIOLATIONS_STR=$(printf '  - %s\n' "${VIOLATIONS[@]}")
  REASON_TEXT="[block-confirmation-questions] resposta contem pergunta de confirmacao que poderia ser executada direto (INV-AGENT-006).

O usuario nao programa. Pergunta como 'quer que eu...?' empurra tarefa de volta. Execute o melhor caminho e reporte depois.

Violacoes:
${VIOLATIONS_STR}

Excecao legitima: operacao destrutiva, gasto financeiro, mudanca publica, credenciais. Se for um desses casos, mencione explicitamente o motivo da confirmacao."
  printf '%s' "$REASON_TEXT" | perl -MJSON::PP -e '
    local $/;
    my $reason = <STDIN>;
    print encode_json({ decision => "block", reason => $reason });
  '
  exit 0
fi

exit 0
