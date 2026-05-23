#!/usr/bin/env bash
# require-agent-sequence-before-dev.sh — exige Sofia (gerente-produto), Detetive (investigador)
# e (quando aplicavel) Rafael (tech-lead) ANTES de Edit/Write em codigo de negocio durante /feature.
# Hook PreToolUse, matcher: Write|Edit.
#
# **Ordem temporal entre Sofia e Detetive nao e validada** — feature que muda
# comportamento existente pode rodar Detetive ANTES de Sofia (REGRA #0:
# investigar antes de propor solucao). O hook so checa presenca dos 3 markers
# antes de liberar dev. Rafael e condicional.
#
# Resolve gap auditado em 2026-05-18 (auditor 2/10):
# Pipeline 3 etapas do /feature antes era so convencional — agora e mecanico (16o bloqueador).
#
# Marcadores criados pelo /feature em cada etapa:
#   .claude/.runtime/sofia-done-<sess>      — gerente-produto rodou
#   .claude/.runtime/detetive-done-<sess>   — investigador rodou
#   .claude/.runtime/rafael-done-<sess>     — tech-lead rodou
#   .claude/.runtime/rafael-skipped-<sess>  — tech-lead dispensado (feature trivial — INV-AGENT-005)

set -uo pipefail
# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

# So aplica a codigo de negocio (mesmo escopo dos outros bloqueadores)
case "$FILE_PATH" in
  *.md|*docs/*|*README*|*CHANGELOG*|*ROADMAP*) exit 0 ;;
  *test/*|*tests/*|*spec/*|*specs/*|*.test.*|*.spec.*) exit 0 ;;
  *.json|*.yaml|*.yml|*.toml|*.ini|*.env*) exit 0 ;;
  *.sh|*.ps1|*.bat) exit 0 ;;
  *.claude/.runtime/*) exit 0 ;;
  *.js|*.jsx|*.ts|*.tsx|*.py|*.go|*.rb|*.java|*.kt|*.cs|*.php|*.rs|*.swift|*.dart) ;;
  *) exit 0 ;;
esac

PROJDIR=$(sanitize_projdir) || exit 2
SESSION_HASH=$(sanitize_session_hash)
MARK_FEATURE="$PROJDIR/.claude/.runtime/feature-active-${SESSION_HASH}"
MARK_SOFIA="$PROJDIR/.claude/.runtime/sofia-done-${SESSION_HASH}"
MARK_DETETIVE="$PROJDIR/.claude/.runtime/detetive-done-${SESSION_HASH}"
MARK_RAFAEL="$PROJDIR/.claude/.runtime/rafael-done-${SESSION_HASH}"
MARK_RAFAEL_SKIPPED="$PROJDIR/.claude/.runtime/rafael-skipped-${SESSION_HASH}"

# So se aplica quando ha sessao /feature ativa
[ -f "$MARK_FEATURE" ] || exit 0

MISSING=()
[ -f "$MARK_SOFIA" ] || MISSING+=("rodar /feature → Sofia (define o que entregar)")
[ -f "$MARK_DETETIVE" ] || MISSING+=("rodar /feature → Detetive (le o codigo atual antes de mexer)")

# Rafael (tech-lead) e condicional — etapa 3 do /feature pode pular se for trivial
if [ ! -f "$MARK_RAFAEL" ] && [ ! -f "$MARK_RAFAEL_SKIPPED" ]; then
  MISSING+=("rodar /feature → Rafael (so se houver decisao arquitetural; senao crie rafael-skipped)")
fi

[ "${#MISSING[@]}" -eq 0 ] && exit 0

cat >&2 <<EOF
[require-agent-sequence-before-dev] Bloqueei Edit/Write em codigo de negocio.

Arquivo: $FILE_PATH
Motivo: voce esta no /feature mas pulou etapas obrigatorias.

Falta:
EOF
for m in "${MISSING[@]}"; do
  printf '  - %s\n' "$m" >&2
done
cat >&2 <<EOF

Como destravar: volte ao /feature em ordem. Sem isso o codigo sai sem AC testavel
ou trata sintoma em vez de causa raiz (REGRA #0). Regras: INV-AGENT-005/006.
EOF
exit 2
