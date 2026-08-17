#!/usr/bin/env bash
# Template: hook-staleness-checker.template.sh
# Destino: .claude/hooks/staleness-checker.sh
# Hook evento: SessionStart
# Matcher: *
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C9b, CONVENCOES-DOC
# orçamento: <2s (varredura unica por sessao)
# protocolo: SessionStart. Read-only. Varre docs criticos e alerta via stderr
#            quando `revisado-em` esta mais antigo que 365 dias. NUNCA bloqueia.
# severidade: BAIXO (informativo)
#
# POR QUE EXISTE:
# Docs criticos (constitution, CLAUDE, AGENTS, SECURITY, threat-model, ropa,
# retencao-dados) precisam ser revisados periodicamente — caso contrario viram
# "vetor de obsolescencia ativa": agentes seguem instrucao desatualizada com
# total confianca. O hook frontmatter-validator ALERTA (WARNING, nao bloqueia) na
# EDICAO de doc critico stale, mas isso so dispara se alguem TENTAR editar. Aqui,
# alertamos no inicio da sessao para que o usuario revise ANTES que o conteudo
# desatualizado oriente decisoes erradas. O bloqueio formal e responsabilidade do
# auditor-doc-quality em pre-merge, nao de hook no momento da edicao.
#
# LIMITACAO:
# - Roda uma vez por sessao. Se a sessao for longa e a data passar o limiar, nao
#   re-alerta. Aceitavel — limiar e 365 dias, jitter de horas e irrelevante.
# - Nao verifica conteudo, so a data declarada. Bypass: mudar `revisado-em` sem
#   revisar de fato.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

# CACHE — varredura completa custa 2-5s em projetos grandes. Cache em .claude/.staleness-cache
# com TTL de 24h. Se cache fresco existir, mostra alerta de cache e sai em ~10ms.
CACHE_FILE=".claude/.staleness-cache"
CACHE_TTL_SECONDS=$((24 * 3600))
if [[ -f "$CACHE_FILE" ]]; then
  CACHE_MTIME=""
  if CACHE_MTIME=$(stat -c %Y "$CACHE_FILE" 2>/dev/null); then
    : # GNU stat (Linux, Git Bash recente com coreutils)
  elif CACHE_MTIME=$(stat -f %m "$CACHE_FILE" 2>/dev/null); then
    : # BSD/macOS stat
  elif command -v python3 >/dev/null 2>&1; then
    # Fallback universal — Git Bash minimo no Windows pode nao ter stat completo.
    CACHE_MTIME=$(CACHE_FILE="$CACHE_FILE" python3 -c '
import os, sys
try:
  print(int(os.path.getmtime(os.environ["CACHE_FILE"])))
except Exception:
  pass
' 2>/dev/null || true)
  fi
  NOW_FOR_CACHE=$(date -u +%s 2>/dev/null || echo 0)
  if [[ -n "$CACHE_MTIME" && "$NOW_FOR_CACHE" -gt 0 ]]; then
    CACHE_AGE=$(( NOW_FOR_CACHE - CACHE_MTIME ))
    if [[ "$CACHE_AGE" -lt "$CACHE_TTL_SECONDS" ]]; then
      # Cache valido — mostra conteudo e sai.
      if [[ -s "$CACHE_FILE" ]]; then
        cat "$CACHE_FILE" >&2
      fi
      exit 0
    fi
  fi
fi

# Padroes de arquivos criticos (case-insensitive no basename).
CRITICAL_PATTERNS=(
  'constitution'
  'REGRAS-INEGOCIAVEIS'
  'SECURITY'
  'threat-model'
  'AGENTS'
  'CLAUDE'
  'ropa'
  'retencao-dados'
  'MAINTAINERS'
)

# Coleta todos os .md candidatos. find pode nao existir em Windows nativo, mas
# em Git Bash sim. Limita profundidade para evitar varrer node_modules etc.
if ! command -v find >/dev/null 2>&1; then
  exit 0
fi

# Calcula timestamp de "hoje" em UTC, segundos epoch.
NOW_TS=""
if NOW_TS_TRY=$(TZ=UTC date -u +%s 2>/dev/null); then
  NOW_TS="$NOW_TS_TRY"
elif command -v python3 >/dev/null 2>&1; then
  NOW_TS=$(python3 -c 'import datetime; print(int(datetime.datetime.now(datetime.timezone.utc).timestamp()))' 2>/dev/null || true)
fi

if [[ -z "$NOW_TS" ]]; then
  # Sem forma de calcular data — sai silenciosamente. Nao queremos quebrar sessao.
  exit 0
fi

# Funcao auxiliar: converte YYYY-MM-DD para epoch UTC.
to_epoch() {
  local d="$1"
  local ts=""
  if ts=$(TZ=UTC date -u -d "$d" +%s 2>/dev/null); then
    echo "$ts"
    return
  fi
  if command -v python3 >/dev/null 2>&1; then
    REV="$d" python3 -c '
import os, datetime
try:
  d = datetime.datetime.strptime(os.environ["REV"], "%Y-%m-%d").replace(tzinfo=datetime.timezone.utc)
  print(int(d.timestamp()))
except Exception:
  pass
' 2>/dev/null
  fi
}

STALE_COUNT=0
# Buffer para escrever no cache
CACHE_BUFFER=""

# Varre cada padrao critico
for pat in "${CRITICAL_PATTERNS[@]}"; do
  # find case-insensitive (-iname). Excluir paths conhecidos (node_modules, .git).
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    [[ ! -f "$f" ]] && continue

    # Le primeiras ~30 linhas (frontmatter normalmente fica no topo).
    HEAD_CONTENT=$(head -n 30 "$f" 2>/dev/null || true)
    REV=$(echo "$HEAD_CONTENT" | grep -E '^revisado-em:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -n 1 | sed -E 's/^revisado-em:[[:space:]]*([0-9]{4}-[0-9]{2}-[0-9]{2}).*$/\1/')

    if [[ -z "$REV" ]]; then
      continue
    fi

    REV_TS=$(to_epoch "$REV")
    if [[ -z "$REV_TS" ]]; then
      continue
    fi

    AGE_DAYS=$(( (NOW_TS - REV_TS) / 86400 ))
    if [[ "$AGE_DAYS" -gt 365 ]]; then
      if [[ "$STALE_COUNT" -eq 0 ]]; then
        CACHE_BUFFER+=$'\n=== STALENESS WARNING — docs criticos desatualizados ===\n'
      fi
      CACHE_BUFFER+="  - $f (revisado-em=$REV, $AGE_DAYS dias)"$'\n'
      STALE_COUNT=$(( STALE_COUNT + 1 ))
    fi
  done < <(find . -type f -iname "*${pat}*.md" \
            -not -path './node_modules/*' \
            -not -path './.git/*' \
            -not -path './dist/*' \
            -not -path './build/*' \
            -not -path './.next/*' \
            -not -path './target/*' \
            2>/dev/null)
done

if [[ "$STALE_COUNT" -gt 0 ]]; then
  CACHE_BUFFER+=$'\n'
  CACHE_BUFFER+="Total: $STALE_COUNT doc(s) critico(s) com revisao > 365 dias."$'\n'
  CACHE_BUFFER+="Revise antes de tomar decisoes baseadas nesses arquivos."$'\n'
  CACHE_BUFFER+="Edicoes futuras nesses arquivos serao ALERTADAS pelo frontmatter-validator (WARNING, nao bloqueia); o bloqueio formal e do auditor-doc-quality em pre-merge."$'\n'
  CACHE_BUFFER+="========================================================"$'\n\n'
fi

# Escreve cache (mesmo vazio — atualiza mtime e evita re-varrer por 24h)
mkdir -p "$(dirname "$CACHE_FILE")" 2>/dev/null || true
printf '%s' "$CACHE_BUFFER" > "$CACHE_FILE" 2>/dev/null || true

# Imprime para stderr (sessao atual)
if [[ -n "$CACHE_BUFFER" ]]; then
  printf '%s' "$CACHE_BUFFER" >&2
fi

exit 0
