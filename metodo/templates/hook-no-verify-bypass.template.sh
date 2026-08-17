#!/usr/bin/env bash
# Template: hook-no-verify-bypass.template.sh
# Destino: .claude/hooks/no-verify-bypass.sh
# Hook evento: PreToolUse
# Matcher: Bash
# referência: REGRAS-INEGOCIAVEIS INV-AGENT-002, AGENTS.md §7
# orçamento: <100ms
# protocolo: PreToolUse Bash. Bloqueia tentativas de pular pre-commit/pre-push hooks.
# severidade: CRÍTICO
#
# Por que existe: o pre-commit valida segredos, frontmatter, anti-mascaramento. Desligar
# via --no-verify ou HUSKY=0 ou core.hooksPath=/dev/null contorna o piso de segurança.
# O block-destructive.sh já cobre `git push --force` e similares; este hook é específico
# para o vetor de "skip hooks" que não é destrutivo per se, mas neutraliza a defesa.
#
# Padrões bloqueados:
#   git commit --no-verify          → -n também
#   git push --no-verify
#   git ... --no-gpg-sign
#   git -c core.hooksPath=          → redireciona hooks
#   git -c commit.gpgsign=false     → desliga assinatura
#   HUSKY=0 git ...                 → desliga husky pre-commit
#   SKIP=... git commit             → pre-commit framework skip
#   PRE_COMMIT_ALLOW_NO_CONFIG=
#
# Override consciente: criar .claude/.override-reason com motivo. O override-ledger.sh
# que roda ANTES deste hook apenas LOGA o uso (nao apaga o arquivo). Este hook le o
# mesmo .override-reason e, se houver motivo, libera a passagem. O arquivo de uso unico
# so e apagado pelo override-consume.sh (PostToolUse), depois do comando executar.

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "BLOCKED: dependencia 'jq' ausente." >&2; exit 2; }

if command -v timeout >/dev/null 2>&1; then
  INPUT=$(timeout 1 cat || true)
else
  INPUT=$(cat || true)
fi
[[ -z "${INPUT:-}" ]] && exit 0

CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[[ -z "$CMD" ]] && exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"

# override-ledger.sh já registrou o motivo (sem apagar) — se o arquivo existe com
# motivo, liberamos a passagem. O consumo de uso unico fica no override-consume.sh
# (PostToolUse), nao aqui.
if [[ -f "$PROJECT_DIR/.claude/.override-reason" ]]; then
  REASON=$(cat "$PROJECT_DIR/.claude/.override-reason" 2>/dev/null || true)
  if [[ -n "$REASON" ]]; then
    exit 0
  fi
fi

REASON=""

# Detecta flags sobre uma versao do comando SEM o conteudo entre aspas. Assim:
#  - `git commit -m "documenta o --no-verify"` NAO bloqueia (a flag esta na mensagem,
#    nao na linha de comando) — eliminava uso legitimo;
#  - a deteccao continua valendo para a flag REAL fora das aspas.
CMD_SCAN=$(echo "$CMD" | sed -E "s/\"[^\"]*\"//g; s/'[^']*'//g")

# Padrões diretos (avaliados sobre CMD_SCAN, sem strings)
if echo "$CMD_SCAN" | grep -qE '(^|[[:space:]])(git[[:space:]]+(commit|push|merge|rebase|cherry-pick|am)[^|;&]*--no-verify)'; then
  REASON="--no-verify em git desliga pre-commit/pre-push"
elif echo "$CMD_SCAN" | grep -qE '(^|[[:space:]])git[[:space:]]+commit[^|;&]*[[:space:]]-[a-zA-Z]*n[a-zA-Z]*([[:space:]]|$)'; then
  # cobre `-n`, `-nm`, `-mn`, `-an` etc. (grupos de flags curtas que contem n=no-verify;
  # em `git commit` a unica flag curta com 'n' e -n/--no-verify).
  REASON="-n em git commit é alias de --no-verify (inclui flags agrupadas, ex.: -nm)"
elif echo "$CMD_SCAN" | grep -qE '(^|[[:space:]])git[[:space:]]+[^|;&]*--no-gpg-sign'; then
  REASON="--no-gpg-sign pula validação de assinatura"
elif echo "$CMD_SCAN" | grep -qE '(^|[[:space:]])git[[:space:]]+-c[[:space:]]+core\.hooksPath='; then
  REASON="-c core.hooksPath= redireciona hooks (geralmente para /dev/null)"
elif echo "$CMD_SCAN" | grep -qE '(^|[[:space:]])git[[:space:]]+-c[[:space:]]+commit\.gpgsign=false'; then
  REASON="-c commit.gpgsign=false desliga assinatura"
elif echo "$CMD_SCAN" | grep -qE '(^|[[:space:]])HUSKY=(0|false)([[:space:]]|=)'; then
  REASON="HUSKY=0 desliga husky pre-commit"
elif echo "$CMD_SCAN" | grep -qE '(^|[[:space:]])SKIP=[^[:space:]]+[[:space:]]+(git|pre-commit)'; then
  REASON="SKIP=... pula hooks específicos do pre-commit framework"
elif echo "$CMD_SCAN" | grep -qE '(^|[[:space:]])PRE_COMMIT_ALLOW_NO_CONFIG=(1|true)'; then
  REASON="PRE_COMMIT_ALLOW_NO_CONFIG ignora ausência de config"
elif echo "$CMD_SCAN" | grep -qE 'pre-commit[[:space:]]+install[^|;&]*--allow-missing-config'; then
  REASON="--allow-missing-config permite commit sem hooks instalados"
fi

if [[ -n "$REASON" ]]; then
  cat >&2 <<EOF
BLOCKED por no-verify-bypass: comando tenta pular hooks de validação.

Comando bloqueado: $CMD
Motivo: $REASON

Hooks de pre-commit/pre-push validam: segredos, frontmatter, anti-mascaramento,
PII brasileira, política de commits. Desligá-los neutraliza o piso de segurança
do método.

Ver REGRAS-INEGOCIAVEIS INV-AGENT-002 (proibido --no-verify, --force em main)
e AGENTS.md §7 (política de commits).

Como destravar:
  (a) deixar o hook rodar — se falhar, corrigir a causa raiz (causa-raiz vs sintoma
      é o anti-padrão central — ver INV-AGENT-006), OU
  (b) override consciente: criar .claude/.override-reason com motivo justificável,
      o override-ledger.sh registra em .claude/overrides.log.
EOF
  exit 2
fi

exit 0
