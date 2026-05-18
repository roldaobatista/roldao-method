#!/usr/bin/env bash
# require-auditors-pass-before-commit.sh — exige que os 3 auditores
# (seguranca, qualidade, produto) tenham aprovado antes de git commit/merge/push
# em sessao /feature ativa.
# Hook PreToolUse, matcher: Bash.
#
# Resolve gap auditado em 2026-05-18 (auditor 5/10):
# Auditores rodavam em paralelo no /feature etapa 6 mas nada impedia commit
# se algum retornasse BLOQUEADO — garantia era so processual.
#
# Marcadores criados pela etapa 6 do /feature:
#   .claude/.runtime/auditor-seg-pass-<sess>     — Caio (seguranca) aprovou
#   .claude/.runtime/auditor-seg-blocked-<sess>  — Caio BLOQUEOU
#   .claude/.runtime/auditor-qual-pass-<sess>    — Julia (qualidade) aprovou
#   .claude/.runtime/auditor-qual-blocked-<sess> — Julia BLOQUEOU
#   .claude/.runtime/auditor-prod-pass-<sess>    — Pedro (produto) aprovou
#   .claude/.runtime/auditor-prod-blocked-<sess> — Pedro BLOQUEOU
#
# **Pass marker contem JSON com hash do diff auditado** (audit_sha). Se o diff
# atual nao bater com audit_sha, marker e considerado stale (o codigo mudou
# depois da aprovacao) e exige re-auditoria. Isso fecha o vetor "agente da
# touch sem auditar de fato": pra criar o marker correto, o agente precisa
# computar o hash do diff atual.
#
# Formato esperado do PASS_MARK:
#   {"audit_sha":"<sha256-de-git-diff-HEAD>","auditor":"seg","ts":"<iso8601>"}

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

case "$COMMAND" in
  *"git commit"*|*"git merge"*|*"git push"*) ;;
  *) exit 0 ;;
esac

# Commits de doc/chore/ci nao precisam de auditor — passam livres.
case "$COMMAND" in
  *"docs:"*|*"chore:"*|*"ci:"*|*"build:"*|*"style:"*) exit 0 ;;
esac

PROJDIR=$(sanitize_projdir) || exit 2
SESSION_HASH=$(sanitize_session_hash)
MARK_FEATURE="$PROJDIR/.claude/.runtime/feature-active-${SESSION_HASH}"

# So aplica em sessao /feature ativa
[ -f "$MARK_FEATURE" ] || exit 0

# Auditores: 3 esperados. Usando case + variaveis simples para compatibilidade
# com bash 3.2 (macOS antigo) e Git Bash em Windows antigos — declare -A pode
# nao funcionar sob 'set -u' em algumas versoes.
auditor_label() {
  case "$1" in
    seg)  printf '%s' "auditor-seguranca (Caio) — secrets, LGPD, supply chain, OWASP" ;;
    qual) printf '%s' "auditor-qualidade (Julia) — testes, cobertura, anti-mascaramento" ;;
    prod) printf '%s' "auditor-produto (Pedro) — aderencia a US, non-goals" ;;
  esac
}

# Hash atual do diff (staged + working). Se git nao estiver disponivel ou nao
# for repo, hash fica vazio — nesse caso a checagem de stale e ignorada (volta
# ao comportamento antigo: presenca de marker basta).
CURRENT_SHA=""
if command -v git >/dev/null 2>&1 && git -C "$PROJDIR" rev-parse --git-dir >/dev/null 2>&1; then
  CURRENT_SHA=$(git -C "$PROJDIR" diff HEAD 2>/dev/null | shasum -a 256 2>/dev/null | awk '{print $1}')
  # Fallback se shasum nao existir (alguns Windows minimal)
  if [ -z "$CURRENT_SHA" ]; then
    CURRENT_SHA=$(git -C "$PROJDIR" diff HEAD 2>/dev/null | sha256sum 2>/dev/null | awk '{print $1}')
  fi
fi

BLOCKED=()
MISSING=()
STALE=()

for key in seg qual prod; do
  PASS_MARK="$PROJDIR/.claude/.runtime/auditor-${key}-pass-${SESSION_HASH}"
  BLOCK_MARK="$PROJDIR/.claude/.runtime/auditor-${key}-blocked-${SESSION_HASH}"

  if [ -f "$BLOCK_MARK" ]; then
    BLOCKED+=("$(auditor_label "$key")")
  elif [ ! -f "$PASS_MARK" ]; then
    MISSING+=("$(auditor_label "$key")")
  elif [ -n "$CURRENT_SHA" ] && [ -s "$PASS_MARK" ]; then
    # Marker tem conteudo JSON — checar se o hash bate com o diff atual.
    AUDIT_SHA=$(perl -MJSON::PP -e '
      local $/;
      eval { my $j = decode_json(<STDIN>); print $j->{audit_sha} // ""; } or print "";
    ' < "$PASS_MARK" 2>/dev/null)
    if [ -n "$AUDIT_SHA" ] && [ "$AUDIT_SHA" != "$CURRENT_SHA" ]; then
      STALE+=("$(auditor_label "$key")")
    fi
  fi
done

# Tudo verde — libera
[ "${#BLOCKED[@]}" -eq 0 ] && [ "${#MISSING[@]}" -eq 0 ] && [ "${#STALE[@]}" -eq 0 ] && exit 0

US_HINT=$(head -1 "$MARK_FEATURE" 2>/dev/null | perl -ne 'print $1 if /\b(US-\d+)\b/')

cat >&2 <<EOF
[require-auditors-pass-before-commit] BLOQUEADO: tentativa de commit/merge/push
em sessao /feature ativa sem aprovacao consolidada dos 3 auditores.

Story alvo: ${US_HINT:-(nao identificada)}
Comando bloqueado: $COMMAND

EOF

if [ "${#BLOCKED[@]}" -gt 0 ]; then
  printf '%s\n' "Auditores que BLOQUEARAM:" >&2
  for a in "${BLOCKED[@]}"; do printf '  ✗ %s\n' "$a" >&2; done
  echo "" >&2
fi

if [ "${#MISSING[@]}" -gt 0 ]; then
  printf '%s\n' "Auditores que ainda NAO rodaram:" >&2
  for a in "${MISSING[@]}"; do printf '  ⏳ %s\n' "$a" >&2; done
  echo "" >&2
fi

if [ "${#STALE[@]}" -gt 0 ]; then
  printf '%s\n' "Auditores cuja aprovacao esta STALE (codigo mudou depois):" >&2
  for a in "${STALE[@]}"; do printf '  ⚠  %s\n' "$a" >&2; done
  echo "" >&2
fi

cat >&2 <<EOF
ANTES de fechar a feature:
  - Volte ao /feature etapa 6 e rode os 3 auditores em paralelo.
  - Cada auditor cria seu marker: auditor-{seg|qual|prod}-pass-* (aprovou)
    ou auditor-{seg|qual|prod}-blocked-* (apontou ressalva bloqueante).
  - Se algum BLOQUEOU, volte pra Dev Senior (etapa 4), corrija, re-rode etapas 5 e 6.

Pular essa validacao reintroduz o erro classico:
  - Merge com auditor BLOQUEADO = vulnerabilidade/regressao subindo em producao
  - "Eu falo com o auditor depois" = o depois nunca chega

Override manual (so com autorizacao explicita do usuario nao-tecnico):
  mkdir -p "$PROJDIR/.claude/.runtime"
  touch "$PROJDIR/.claude/.runtime/auditor-seg-pass-${SESSION_HASH}"
  touch "$PROJDIR/.claude/.runtime/auditor-qual-pass-${SESSION_HASH}"
  touch "$PROJDIR/.claude/.runtime/auditor-prod-pass-${SESSION_HASH}"

Aplica regras: INV-AGENT-006, SEC-* (seguranca obrigatoria), TST-* (qualidade obrigatoria).
EOF
exit 2
