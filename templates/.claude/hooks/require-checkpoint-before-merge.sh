#!/usr/bin/env bash
# require-checkpoint-before-merge.sh — exige que /checkpoint tenha rodado
# antes de git commit ou git merge fechando uma feature.
# Hook PreToolUse, matcher: Bash.
#
# Resolve gap auditado em 2026-05-18 (auditor 6/10):
# /checkpoint era documentado mas sem hook bloqueando merge sem ele.
#
# Marcador criado pelo /checkpoint etapa 4 ao final do walkthrough:
#   .claude/.runtime/checkpoint-done-<sess>

set -u

# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

COMMAND=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{command} // "";
' 2>/dev/null)

[ -z "$COMMAND" ] && exit 0

# So aplica a git commit, git merge, git push em sessao com feature ativa.
case "$COMMAND" in
  *"git commit"*|*"git merge"*|*"git push"*) ;;
  *) exit 0 ;;
esac

# git commit -m com mensagens nao-feature (docs, chore, ci) passam livres.
# So bloqueia commit que parece encerrar trabalho de feature.
case "$COMMAND" in
  *"docs:"*|*"chore:"*|*"ci:"*|*"build:"*|*"style:"*) exit 0 ;;
esac

PROJDIR=$(sanitize_projdir) || exit 2
SESSION_HASH=$(sanitize_session_hash)
MARK_FEATURE="$PROJDIR/.claude/.runtime/feature-active-${SESSION_HASH}"
MARK_CHECKPOINT="$PROJDIR/.claude/.runtime/checkpoint-done-${SESSION_HASH}"

# So bloqueia se sessao /feature esta ativa
[ -f "$MARK_FEATURE" ] || exit 0

# Se ja rodou checkpoint, libera
[ -f "$MARK_CHECKPOINT" ] && exit 0

US_HINT=$(head -1 "$MARK_FEATURE" 2>/dev/null | perl -ne 'print $1 if /\b(US-\d+)\b/')

cat >&2 <<EOF
[require-checkpoint-before-merge] BLOQUEADO: tentativa de commit/merge/push
em sessao /feature ativa sem /checkpoint executado.

Story alvo: ${US_HINT:-(nao identificada)}
Comando bloqueado: $COMMAND

ANTES de subir a mudanca, rode:
  /checkpoint

Isso gera docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md com:
  - Proposito em 1 frase (linguagem leiga)
  - O que muda pro cliente final + non-goals
  - Tabela de riscos
  - Plano de rollback se ha migracao
  - Decisoes consolidadas dos auditores

Pular o checkpoint reintroduz o erro classico:
  - Merge sem walkthrough = surpresa em producao
  - Cliente nao-tecnico nao entende o que mudou
  - Auditor disse RESSALVA e ninguem leu

Se voce esta certo que o commit NAO encerra feature (so atualiza doc/teste),
use prefixo conventional commit que pula esse hook:
  docs:, chore:, ci:, build:, style:

Para liberar manualmente (sob sua responsabilidade):
  mkdir -p "$PROJDIR/.claude/.runtime" && touch "$MARK_CHECKPOINT"

Aplica regras: INV-AGENT-006 (walkthrough antes de subir), INV-006 (verificar antes de afirmar).
EOF
exit 2
