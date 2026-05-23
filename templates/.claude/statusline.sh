#!/usr/bin/env bash
# Status line ROLDAO-METHOD — exibe versão do framework, modelo, branch e agente ativo.
# Recebe JSON via stdin do Claude Code (session_id, model, workspace, cwd, transcript_path, version, output_style, cost, etc.).

set -euo pipefail

INPUT="$(cat 2>/dev/null || echo '{}')"

# --- Modelo ativo (display_name do JSON) -------------------------------------
MODELO=$(
  printf '%s' "$INPUT" | python -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('model', {}).get('display_name', '?'))
except Exception:
    print('?')
" 2>/dev/null || echo '?'
)

# --- Versão do framework (lê package.json se aplicável) ----------------------
VERSAO_FRAMEWORK="?"
if [ -f "${CLAUDE_PROJECT_DIR:-.}/package.json" ]; then
  VERSAO_FRAMEWORK=$(
    python -c "
import json
try:
    print(json.load(open('${CLAUDE_PROJECT_DIR:-.}/package.json', encoding='utf-8')).get('version', '?'))
except Exception:
    print('?')
" 2>/dev/null || echo '?'
  )
fi

# --- Branch git --------------------------------------------------------------
BRANCH=$(git -C "${CLAUDE_PROJECT_DIR:-.}" branch --show-current 2>/dev/null || echo '—')

# --- Agente ativo (último marker em .claude/.runtime) ------------------------
AGENTE="—"
RUNTIME="${CLAUDE_PROJECT_DIR:-.}/.claude/.runtime"
if [ -d "$RUNTIME" ]; then
  MARKER=$(ls -1t "$RUNTIME"/*-done-* 2>/dev/null | head -1 || true)
  if [ -n "$MARKER" ]; then
    SLUG=$(basename "$MARKER" | sed -E 's/-done-.*$//')
    # Mapa slug → nome + ícone (mantém em sincronia com .claude/agents/MAPA-VISUAL.md)
    case "$SLUG" in
      maestro)            AGENTE="🎼 Maestro" ;;
      analista)           AGENTE="🔎 Mariana" ;;
      gerente-produto)    AGENTE="📋 Sofia" ;;
      ux-designer)        AGENTE="🎨 Lia" ;;
      tech-lead)          AGENTE="🏛️ Rafael" ;;
      investigador)       AGENTE="🔬 Detetive" ;;
      dev-senior)         AGENTE="💻 Bruno" ;;
      dba-dados)          AGENTE="🗄️ Helena" ;;
      revisor)            AGENTE="✅ Inês" ;;
      auditor-seguranca)  AGENTE="🛡️ Caio" ;;
      auditor-qualidade)  AGENTE="🧪 Julia" ;;
      auditor-produto)    AGENTE="🎯 Pedro" ;;
      fiscal-br)          AGENTE="🧾 Dona Marta" ;;
      tech-writer)        AGENTE="📝 Camila" ;;
      *)                  AGENTE="$SLUG" ;;
    esac
  fi
fi

# --- Story em foco (marker feature-active) -----------------------------------
STORY=""
if [ -d "$RUNTIME" ]; then
  FEAT=$(ls -1t "$RUNTIME"/feature-active-* 2>/dev/null | head -1 || true)
  [ -n "$FEAT" ] && STORY=" · 📌 $(cat "$FEAT" 2>/dev/null | head -c 12)"
fi

# --- Metricas do dia (hooks que bloquearam) ----------------------------------
# Le metrics.jsonl e conta linhas {"kind":"block"} cujo ts comeca com hoje.
# Sem o file ou em sessao nova, mostra 0 — prova de valor passa a ser visivel
# ("ROLDAO me protegeu 3 vezes hoje") sem precisar abrir log.
HOJE_BLOCKS=0
METRICS="$RUNTIME/metrics.jsonl"
if [ -f "$METRICS" ]; then
  HOJE=$(date -u +%Y-%m-%d)
  HOJE_BLOCKS=$(grep -c "\"ts\":\"$HOJE" "$METRICS" 2>/dev/null || echo 0)
fi
SHIELD=""
[ "$HOJE_BLOCKS" -gt 0 ] && SHIELD=" · 🛡️ ${HOJE_BLOCKS}"

printf '📍 v%s · 🤖 %s · 🌿 %s%s%s · 👤 %s' "$VERSAO_FRAMEWORK" "$MODELO" "$BRANCH" "$STORY" "$SHIELD" "$AGENTE"
