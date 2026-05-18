#!/usr/bin/env bash
# block-jargon-pt-br.sh — bloqueia resposta do agente com jargao tecnico ao usuario nao-programador.
# Hook PostToolUse (no Stop / Notification — depende de configuracao).
# INV-AGENT-001 — sem jargao tecnico sem traduzir, quando o usuario nao programa.
#
# Estrategia: olha a resposta gerada pelo Claude (campo response no input do hook).
# Se houver termos tecnicos sem traducao adjacente, bloqueia (PostToolUse pode retornar decision: block).

set -u

INPUT=$(cat)

# Tenta extrair texto da resposta. Pode vir em campos diferentes dependendo do tipo de hook.
RESP=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $r = $json->{response} // $json->{tool_response} // $json->{message} // "";
  print ref($r) ? "" : $r;
' 2>/dev/null)

[ -z "$RESP" ] && exit 0

# Termos jargao que devem ser traduzidos (lista nao exaustiva)
# Cada termo: regex case-insensitive
JARGON_TERMS=(
  '\bcommit(s|ar|ed|ado|ei|ou)?\b'
  '\bbranch(es|ar|ado)?\b'
  '\bpush(es|ar|ado|ei|ou)?\b'
  '\bpull(s|ed|ar|ado|ei|ou)?\b'
  '\bmerge(s|ar|ado|ei|ou|ado)?\b'
  '\brebase(s|ar|ado|ei|ou)?\b'
  '\bdeploy(s|ar|ado|ei|ou)?\b'
  '\brollback(s|ar|ado)?\b'
  '\brevert(s|er|ido|i|eu)?\b'
  '\bendpoint(s)?\b'
  '\brefactor(s|ar|ado|ei|ou)?\b'
  '\blint(s|ar|ado)?\b'
  '\bbuild(s|ar|ado)?\b'
  '\bCI\b'
  '\bPR\b'
  '\bMR\b'
  '\brepo(s|sitorio)?\b'
  '\bcheckout(s|ar|ado)?\b'
  '\bstash(es|ar|ado)?\b'
  '\bcherry-pick(s|ed|ar|ado)?\b'
  '\bbisect(s|ar|ado)?\b'
  '\bhook(s|ar|ado)?\b'
)

# Termos OK quando vem traduzidos OU dentro de bloco de codigo, OU acompanhados de explicacao
# Estrategia simples: detectar se ha pelo menos 1 termo SEM explicacao adjacente

# Remove blocos de codigo (markdown ``` ... ```)
CLEAN=$(printf '%s\n' "$RESP" | perl -0777 -pe 's/```.*?```//gs' | perl -pe 's/`[^`]*`//g')

VIOLATIONS=()
for pat in "${JARGON_TERMS[@]}"; do
  MATCHES=$(printf '%s\n' "$CLEAN" | grep -oiE -- "$pat" | head -n3 || true)
  [ -z "$MATCHES" ] && continue
  # se a linha tem traducao adjacente, ignora
  while IFS= read -r m; do
    [ -z "$m" ] && continue
    # contexto: pega a linha que contem o termo
    CTX=$(printf '%s\n' "$CLEAN" | grep -iE -- "$m" | head -n1 || true)
    # ignora se a linha tem parenteses explicativos ou aspas com termo PT
    if printf '%s\n' "$CTX" | grep -qiE '\(.{0,80}(salv|enviei|atualiz|servidor|cliente|sistema|arquivo|versao|configura).{0,80}\)'; then
      continue
    fi
    if printf '%s\n' "$CTX" | grep -qiE '"[^"]{3,40}"'; then
      continue  # ja tem aspas, provavel explicacao
    fi
    if printf '%s\n' "$CTX" | grep -qiE '\bou seja\b|\bsignific|isso e|isto e|i\.e\.|ex:'; then
      continue
    fi
    VIOLATIONS+=("jargao sem traducao: '$m' em -> $CTX")
  done <<< "$MATCHES"
done

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  # PostToolUse pode bloquear via JSON output:
  cat <<EOF
{
  "decision": "block",
  "reason": "[block-jargon-pt-br] resposta usa jargao tecnico sem traduzir (INV-AGENT-001).\n\nUsuario nao-programador. Reescrever em PT-BR claro.\n\nViolacoes:\n$(printf '  - %s\n' "${VIOLATIONS[@]}")\n\nTabela de traducao:\n  - commit/push -> 'salvei a correcao no sistema'\n  - CI verde -> 'esta funcionando, validei'\n  - rollback -> 'voltar pra versao anterior'\n  - deploy -> 'subir pro servidor'\n  - refactor -> 'reorganizar (sem mudar o que aparece pro usuario)'\n  - migration -> 'mudanca na estrutura dos dados salvos'\n  - mock/fixture -> 'dados falsos pros testes'\n\nExcecao: se o usuario E programador (declarado em AGENTS.md), peca pra ajustar a regra."
}
EOF
  exit 0
fi

exit 0
