#!/usr/bin/env bash
# require-agent-sequence-before-dev.sh — exige Sofia (gerente-produto), Detetive (investigador)
# e (quando aplicavel) Rafael (tech-lead) ANTES de Edit/Write em codigo de negocio durante /feature.
# Hook PreToolUse, matcher: Write|Edit.
#
# Resolve gap auditado em 2026-05-18 (auditor 2/10):
# Pipeline 3 etapas do /feature antes era so convencional — agora e mecanico (16o bloqueador).
#
# Marcadores criados pelo /feature em cada etapa:
#   .claude/.runtime/sofia-done-<sess>      — gerente-produto rodou
#   .claude/.runtime/detetive-done-<sess>   — investigador rodou
#   .claude/.runtime/rafael-done-<sess>     — tech-lead rodou
#   .claude/.runtime/rafael-skipped-<sess>  — tech-lead dispensado (feature trivial — INV-AGENT-005)

set -u

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
[ -f "$MARK_SOFIA" ] || MISSING+=("Etapa 1 — Sofia (gerente-produto) — define US-NNN, AC testaveis, non-goals")
[ -f "$MARK_DETETIVE" ] || MISSING+=("Etapa 2 — Detetive (investigador) — le codigo existente, mapeia impacto SEM escrever")

# Rafael (tech-lead) e condicional — etapa 3 do /feature pode pular se for trivial
if [ ! -f "$MARK_RAFAEL" ] && [ ! -f "$MARK_RAFAEL_SKIPPED" ]; then
  MISSING+=("Etapa 3 — Rafael (tech-lead) — ADR se feature exige decisao arquitetural (OU crie marker rafael-skipped se trivial)")
fi

[ "${#MISSING[@]}" -eq 0 ] && exit 0

cat >&2 <<EOF
[require-agent-sequence-before-dev] BLOQUEADO: tentativa de Edit/Write em codigo de negocio
sem ter passado pela sequencia obrigatoria do /feature.

Arquivo: $FILE_PATH

Etapas pendentes antes do Dev Senior:
EOF
for m in "${MISSING[@]}"; do
  printf '  ✗ %s\n' "$m" >&2
done
cat >&2 <<EOF

Pular essas etapas reintroduz os 3 erros classicos que o framework resolve:
  - Codigo sem AC testavel (Sofia)         → entrega errada, retrabalho
  - Codigo sem entender o sistema (Detetive) → fix no sintoma, nao na raiz (REGRA #0)
  - Decisao arquitetural sem ADR (Rafael)  → divida tecnica silenciosa

Volte ao /feature e complete as etapas. Cada subagente cria seu marker ao terminar.
Se Rafael for dispensavel (feature trivial sem decisao arquitetural), execute:
  mkdir -p "$PROJDIR/.claude/.runtime" && touch "$MARK_RAFAEL_SKIPPED"

Aplica regras: INV-AGENT-005, INV-AGENT-006.
EOF
exit 2
