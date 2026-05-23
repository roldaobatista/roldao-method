#!/usr/bin/env bash
# validate-story-approvals.sh — bloqueia Edit/Write em docs/stories/US-NNN.md
# que mude `status: entregue` sem o bloco `aprovacoes:` preenchido com TODAS
# as etapas do /feature concluidas.
# Hook PreToolUse, matcher: Write|Edit.
#
# Resolve gap auditado em 2026-05-18 (auditor 4/10):
# Marcadores em .runtime/ sao efemeros (limpos ao fim do /feature). Nao havia
# audit trail PERSISTENTE de "Sofia aprovou em X data". Agora vive no proprio
# arquivo da story.

set -uo pipefail
INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

NEW_CONTENT=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $t = $json->{tool_input};
  print $t->{content} // $t->{new_string} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0
[ -z "$NEW_CONTENT" ] && exit 0

# So aplica a stories
case "$FILE_PATH" in
  *docs/stories/US-*.md) ;;
  *) exit 0 ;;
esac

# So bloqueia transicao para status: entregue
printf '%s\n' "$NEW_CONTENT" | grep -qE '^status:[[:space:]]*entregue\b' || exit 0

# Etapas que DEVEM aparecer em aprovacoes para fechar como entregue
REQUIRED=(
  "gerente-produto"
  "investigador"
  "dev-senior"
  "revisor"
  "auditor-seguranca"
  "auditor-qualidade"
  "auditor-produto"
)

MISSING=()
for etapa in "${REQUIRED[@]}"; do
  # procura linha "etapa: X" no bloco aprovacoes
  printf '%s\n' "$NEW_CONTENT" | grep -qE "^[[:space:]]*-[[:space:]]*etapa:[[:space:]]*${etapa}\b" || MISSING+=("$etapa")
done

# Tech-lead e opcional (pode estar como "dispensado" mas precisa aparecer)
printf '%s\n' "$NEW_CONTENT" | grep -qE "^[[:space:]]*-[[:space:]]*etapa:[[:space:]]*tech-lead\b" || MISSING+=("tech-lead (pode ser 'dispensado' para features triviais)")

# Conta aprovacoes com status reprovado/bloqueado. Usa perl pra evitar pitfalls
# de grep multiline e de variaveis com whitespace.
HAS_BLOCK=$(printf '%s\n' "$NEW_CONTENT" | perl -ne '
  $c++ if /^\s*status:\s*(reprovado|bloqueado)\s*$/;
  END { print $c // 0 }
')
HAS_BLOCK=${HAS_BLOCK:-0}

[ "${#MISSING[@]}" -eq 0 ] && [ "$HAS_BLOCK" -eq 0 ] && exit 0

US_ID=$(printf '%s\n' "$NEW_CONTENT" | grep -oE '^id:[[:space:]]*US-[0-9]+' | head -1 | grep -oE 'US-[0-9]+')

cat >&2 <<EOF
[validate-story-approvals] BLOQUEADO: tentativa de marcar story como
'status: entregue' sem audit trail completo no bloco \`aprovacoes:\`.

Story: ${US_ID:-(nao identificada)}
Arquivo: $FILE_PATH

EOF

if [ "${#MISSING[@]}" -gt 0 ]; then
  printf '%s\n' "Etapas FALTANDO no bloco aprovacoes:" >&2
  for e in "${MISSING[@]}"; do printf '  ✗ %s\n' "$e" >&2; done
  echo "" >&2
fi

if [ "${HAS_BLOCK:-0}" -gt 0 ]; then
  cat >&2 <<EOF
Existem aprovacoes com status 'reprovado' ou 'bloqueado'. Resolva (corrigir
no codigo + re-rodar etapa correspondente do /feature + atualizar a entrada
para status: aprovado) antes de marcar entregue.

EOF
fi

cat >&2 <<EOF
Formato esperado no frontmatter:

aprovacoes:
  - etapa: gerente-produto
    agente: Sofia
    data: AAAA-MM-DD
    status: aprovado
    notas: "AC testaveis, non-goals OK"
  - etapa: investigador
    agente: Detetive
    data: AAAA-MM-DD
    status: aprovado
  - etapa: tech-lead          # ou status: dispensado se trivial
    agente: Rafael
    data: AAAA-MM-DD
    status: aprovado
  - etapa: dev-senior
    agente: Bruno
    data: AAAA-MM-DD
    status: aprovado
  - etapa: revisor
    data: AAAA-MM-DD
    status: aprovado
  - etapa: auditor-seguranca
    agente: Caio
    data: AAAA-MM-DD
    status: aprovado
  - etapa: auditor-qualidade
    agente: Julia
    data: AAAA-MM-DD
    status: aprovado
  - etapa: auditor-produto
    agente: Pedro
    data: AAAA-MM-DD
    status: aprovado

Sem audit trail completo, nao ha como auditar 6 meses depois quem decidiu
o que. Marcador efemero em .runtime/ nao serve — limpo ao fim da sessao.

Aplica regras: INV-001 (documento e estado compartilhado), INV-AGENT-006.
EOF
exit 2
