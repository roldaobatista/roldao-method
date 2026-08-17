#!/usr/bin/env bash
# template: .claude/hooks/inject-context.sh
# referência: matriz-harness.md §1, INV-AGENT-003/004/010
# evento: UserPromptSubmit
# severidade: BAIXO
# protocolo: lê JSON do stdin (Claude Code UserPromptSubmit) e injeta lembrete
#            curto via stdout. NÃO bloqueia (exit 0 sempre).
#
# Por que existe: reforça regras-chave no momento do prompt para evitar
# regressão em sessões longas. Custo ~50 tokens/turno, ganho de consistência.

set -euo pipefail

# Drena o stdin (UserPromptSubmit entrega JSON aqui). Não usamos o conteúdo, mas
# consumir evita SIGPIPE/erro quando o harness tenta escrever num pipe sem leitor —
# higiene consistente com os demais hooks. timeout como rede de segurança.
if command -v timeout >/dev/null 2>&1; then
  timeout 1 cat >/dev/null 2>&1 || true
else
  cat >/dev/null 2>&1 || true
fi

OWNER_NAME="${PROJECT_OWNER_NAME:-dono do produto}"

cat <<EOF
<reminder>
${OWNER_NAME} não programa: linguagem acessível, sem jargão sem tradução (INV-AGENT-010).
Investigue antes de editar lógica de negócio (banco/log/payload) — INV-AGENT-003.
Reversível + custo zero → FAZ sem perguntar. Confirma só irreversível/custo>0 — INV-AGENT-004 / AGENTS.md §13.1.
</reminder>
EOF

exit 0
