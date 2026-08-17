#!/usr/bin/env bash
# template: .claude/hooks/post-claim-evidence.sh
# referência: INV-AGENT-005 (validar antes de afirmar "pronto/implementado/corrigido")
# evento: Stop (fim de turno)
# severidade: MÉDIO (warn)
# protocolo: ao fim de cada turno, inspeciona transcript (se disponível via
#            CLAUDE_PROJECT_DIR/.claude/transcripts/) procurando por afirmações
#            "pronto/implementado/corrigido/funcionando" sem evidência de
#            execução de teste/lint/build no mesmo turno. Emite warning.
#
# Limitação: sem acesso ao transcript live, hook só registra um lembrete
# genérico ao fim do turno. Implementação completa exige integração com
# .claude/transcripts/ (formato JSONL do Claude Code) — quando disponível.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
TRANSCRIPT_DIR="$PROJECT_DIR/.claude/transcripts"

# Sem transcript acessível, sai silencioso (não atrapalha fim de turno)
if [[ ! -d "$TRANSCRIPT_DIR" ]]; then
  exit 0
fi

# Pega transcript mais recente
LATEST=$(ls -t "$TRANSCRIPT_DIR"/*.jsonl 2>/dev/null | head -n 1 || true)
if [[ -z "$LATEST" || ! -f "$LATEST" ]]; then
  exit 0
fi

# Pega últimas N linhas (turno atual aproximado)
TAIL_CONTENT=$(tail -n 200 "$LATEST" 2>/dev/null || true)
[[ -z "$TAIL_CONTENT" ]] && exit 0

# Procura afirmações de "pronto"
CLAIMS=$(echo "$TAIL_CONTENT" | grep -iE "(pronto|implementado|corrigido|funcionando|resolvido|finalizado|conclu[íi]do|done|fixed|completed)" | wc -l)
[[ "$CLAIMS" -eq 0 ]] && exit 0

# Procura evidência de execução
EVIDENCE=$(echo "$TAIL_CONTENT" | grep -iE "(npm test|pytest|cargo test|go test|jest|vitest|tsc|eslint|ruff|mypy|cargo check|cargo build|npm run build|pre-commit run|gh pr checks)" | wc -l)

if [[ "$CLAIMS" -gt 0 && "$EVIDENCE" -eq 0 ]]; then
  echo "" >&2
  echo "WARNING (INV-AGENT-005): turno teve $CLAIMS afirmação(ões) de 'pronto/corrigido/funcionando'" >&2
  echo "  mas zero execução de teste/lint/build detectada." >&2
  echo "  Antes de afirmar 'pronto', rode o gate apropriado e mostre o resultado." >&2
  echo "  Evidência > afirmação." >&2
  echo "" >&2
fi

exit 0
