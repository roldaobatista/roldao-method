#!/usr/bin/env bash
# enforce-pipeline-completion.sh — Stop hook que recusa encerrar a sessao
# quando ha pipeline /feature ATIVO sem checkpoint salvo.
#
# Hook Stop. Retorna JSON {"decision":"block","reason":"..."} pra forcar
# o agente principal a fechar o ciclo antes de encerrar.
#
# Regras codificadas:
#   - INV-002 (spec-driven): feature sem checkpoint nao tem audit trail.
#   - INV-AGENT-004 (verificar antes de afirmar): "feito" sem checkpoint e mentira.
#   - INV-AGENT-006: encerrar antes de fechar empurra trabalho residual pro usuario.
#
# Gatilho: marker .claude/.runtime/feature-active-<SESS> existe E nao existe
# checkpoint-done-<SESS>. Se ambos existem, deixa encerrar normalmente.
#
# Excecao com janela: se o usuario pediu encerrar explicitamente OU se a sessao
# falhou no /readiness (sem sofia-done nem detetive-done — pipeline nao chegou
# a comecar), nao bloqueia. Bloqueio so quando pipeline COMECOU mas nao
# terminou — caso classico de "agente parou no meio".

set -u

# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

PROJDIR=$(sanitize_projdir) || exit 0  # Stop hook nao deve falhar duro
SESSION_HASH=$(sanitize_session_hash)
RUNTIME="$PROJDIR/.claude/.runtime"

MARK_FEATURE="$RUNTIME/feature-active-${SESSION_HASH}"
MARK_CHECKPOINT="$RUNTIME/checkpoint-done-${SESSION_HASH}"
MARK_SOFIA="$RUNTIME/sofia-done-${SESSION_HASH}"
MARK_DETETIVE="$RUNTIME/detetive-done-${SESSION_HASH}"

# Sem feature ativa = nao se aplica
[ -f "$MARK_FEATURE" ] || exit 0

# Checkpoint feito = pipeline fechou = OK
[ -f "$MARK_CHECKPOINT" ] && exit 0

# Pipeline nem comecou (sem Sofia nem Detetive) = sessao abortada cedo, deixa encerrar
if [ ! -f "$MARK_SOFIA" ] && [ ! -f "$MARK_DETETIVE" ]; then
  exit 0
fi

# Pipeline COMECOU mas nao fechou — bloqueia o Stop com mensagem clara
US_ID=$(head -1 "$MARK_FEATURE" 2>/dev/null | tr -d '\r\n')
[ -z "$US_ID" ] && US_ID="(US nao identificada)"

# Lista o que falta pra fechar
FALTAM=()
[ -f "$RUNTIME/auditor-seg-pass-${SESSION_HASH}" ] || FALTAM+=("auditor-seguranca (Caio)")
[ -f "$RUNTIME/auditor-qual-pass-${SESSION_HASH}" ] || FALTAM+=("auditor-qualidade (Julia)")
[ -f "$RUNTIME/auditor-prod-pass-${SESSION_HASH}" ] || FALTAM+=("auditor-produto (Pedro)")
[ -f "$MARK_CHECKPOINT" ] || FALTAM+=("checkpoint (walkthrough do diff)")

REASON_LIST=""
for item in "${FALTAM[@]}"; do
  REASON_LIST+="  - ${item}"$'\n'
done

REASON="[enforce-pipeline-completion] Pipeline /feature aberto sem checkpoint.

US ativa: ${US_ID}

Falta fechar:
${REASON_LIST}
Antes de encerrar, rode o restante do pipeline (auditores + checkpoint) — ou delegue ao maestro:
  Task subagent_type=maestro prompt=\"Modo FT continuacao: ${US_ID}, retomar do ponto atual ate checkpoint.\"

Encerrar agora deixa US-NNN sem audit trail (viola INV-002 + INV-AGENT-004).
Se voce REALMENTE quer abortar (decisao consciente), apague o marker:
  rm .claude/.runtime/feature-active-${SESSION_HASH}
e rode Stop de novo."

# Stop hook: JSON com decision:block forca o agente a continuar
printf '%s' "$REASON" | perl -MJSON::PP -e '
  local $/;
  my $reason = <STDIN>;
  print encode_json({ decision => "block", reason => $reason });
'

exit 0
