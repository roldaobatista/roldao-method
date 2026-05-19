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
for pat in "${PATTERNS[@]}"; do
  # Linhas que contem a pergunta de confirmacao
  while IFS= read -r ctx_line || [ -n "$ctx_line" ]; do
    [ -z "$ctx_line" ] && continue
    # Se a propria linha da pergunta cita operacao destrutiva/custo, e legitima
    if printf '%s\n' "$ctx_line" | grep -qiE -- "$LEGIT_RE"; then
      continue
    fi
    HIT=$(printf '%s\n' "$ctx_line" | grep -oiE -- "$pat" | head -n1 || true)
    VIOLATIONS+=("pergunta de confirmacao: '$HIT' -> $ctx_line")
  done < <(printf '%s\n' "$RESP" | grep -iE -- "$pat" || true)
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
