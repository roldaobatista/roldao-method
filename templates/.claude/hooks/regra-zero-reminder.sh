#!/usr/bin/env bash
# regra-zero-reminder.sh — injeta lembrete da REGRA #0 quando o prompt menciona bug.
# Hook UserPromptSubmit.
# INV-006, INV-AGENT-002.
#
# Output via stdout vira contexto adicional pro Claude (não bloqueia).

set -u

# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

PROMPT=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{prompt} // "";
' 2>/dev/null)

if [ -z "$PROMPT" ]; then
  exit 0
fi

# Palavras-gatilho que sugerem investigação de bug
TRIGGERS='\b(bug|erro|problema|n[aã]o[[:space:]]+funciona|n[aã]o[[:space:]]+sai|n[aã]o[[:space:]]+aparece|n[aã]o[[:space:]]+salva|tela[[:space:]]+errada|c[aá]lculo[[:space:]]+errado|valor[[:space:]]+errado|deveria|esperava|estranho|travou|quebrou)\b'

if printf '%s' "$PROMPT" | grep -qiE -- "$TRIGGERS"; then
  # Marcador pra require-investigador-before-fix.sh
  PROJDIR=$(sanitize_projdir) || exit 0
  SESSION_HASH=$(sanitize_session_hash)
  RUNTIME_DIR=$(safe_runtime_dir "$PROJDIR")
  touch "$RUNTIME_DIR/bug-trigger-${SESSION_HASH}" 2>/dev/null

  cat <<'EOF'

[ROLDAO-METHOD — REGRA #0 ativada]

O prompt parece descrever um bug/comportamento errado. Antes de propor solução:

1. NÃO mexa no código ainda.
2. Leia o ESTADO REAL: banco (SELECT direto), logs, payload, console, config.
3. Rastreie o fluxo: onde o dado é gerado, salvo, lido. Há caminhos duplicados?
4. Se houver ambiguidade no relato, PERGUNTE antes de implementar (use AskUserQuestion).
5. Só então corrija — no ponto RAIZ, não no sintoma.

Considere invocar o subagente `investigador` (Task tool) antes de qualquer Edit/Write.
O hook `require-investigador-before-fix` foi armado e vai bloquear edits em código
de negócio até o investigador rodar.

Aplica regras: INV-006, INV-AGENT-002.
EOF
fi

exit 0
