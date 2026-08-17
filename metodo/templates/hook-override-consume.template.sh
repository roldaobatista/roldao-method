#!/usr/bin/env bash
# Template: hook-override-consume.template.sh
# Destino: .claude/hooks/override-consume.sh
# Hook evento: PostToolUse
# Matcher: Bash
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C9b, matriz-harness.md §1
# orçamento: <100ms
# protocolo: PostToolUse Bash. Consome (apaga) o .claude/.override-reason de uso unico
#            DEPOIS que o comando ja passou por TODOS os hooks PreToolUse e executou.
# severidade: BAIXO (read/cleanup; nunca bloqueia)
#
# POR QUE ESTE HOOK EXISTE (causa-raiz do bug corrigido em 2026-05-28):
# Antes, o override-ledger.sh (1o hook em PreToolUse/Bash) apagava o .override-reason
# AINDA no PreToolUse, ANTES de block-destructive.sh e no-verify-bypass.sh lerem o
# mesmo arquivo. Resultado: `git push --force-with-lease` em branch protegida COM
# override, ou `git commit --no-verify` COM override, eram BLOQUEADOS — o ledger ja
# tinha apagado o arquivo que os hooks seguintes precisam ler para LIBERAR.
#
# Correcao: o override-ledger so LOGA (nao apaga). O consumo de uso unico vira
# responsabilidade DESTE hook PostToolUse, que roda UMA vez DEPOIS de todo o pipeline
# PreToolUse passar e o comando rodar. Assim:
#   - todos os hooks PreToolUse leem o .override-reason de forma consistente;
#   - o override e consumido so quando uma operacao realmente executou (uso unico real);
#   - se algum hook PreToolUse BLOQUEAR (exit 2), o PostToolUse NAO roda e o arquivo
#     sobrevive — o usuario pode reexecutar a MESMA operacao legitima sem reescrever
#     o motivo. Isto e conservador: nunca abre brecha (todo comando seguinte continua
#     passando por block-destructive e no-verify-bypass; o ledger loga cada match),
#     e prefere preservar o override a queima-lo num bloqueio.
#
# NAO ha unico-consumidor ambiguo: ha DOIS hooks que liberam com override
# (block-destructive para --force-with-lease em branch protegida; no-verify-bypass
# para --no-verify). Se cada um apagasse o arquivo, quem rodasse primeiro derrubaria
# a leitura do outro — recriando o bug para comandos que disparam ambos. Por isso o
# consumo fica centralizado aqui, fora do pipeline de decisao.

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
REASON_FILE="$PROJECT_DIR/.claude/.override-reason"

# Sem override pendente: nada a consumir.
[[ -f "$REASON_FILE" ]] || exit 0

# CAUSA-RAIZ do bug corrigido em 2026-05-28 (parte 2): este hook roda em TODO
# PostToolUse Bash. Se apagasse o .override-reason incondicionalmente, qualquer
# comando inocente intercalado (`ls`, `git status`, `npm run lint`) entre a criacao
# do motivo e o comando que precisa dele QUEIMARIA o override — e a operacao
# legitima seguinte (`git push --force-with-lease`, `git commit --no-verify`,
# `npm publish`...) seria bloqueada por falta de motivo. Por isso o consumo so
# acontece quando o comando que ACABOU de rodar e, de fato, um comando que
# CONSOME override (os mesmos padroes que block-destructive.sh e no-verify-bypass.sh
# liberam com motivo). Comando inocente nao toca no arquivo.

if command -v timeout >/dev/null 2>&1; then
  INPUT=$(timeout 1 cat || true)
else
  INPUT=$(cat || true)
fi
[[ -z "${INPUT:-}" ]] && exit 0

CMD=""
if command -v jq >/dev/null 2>&1; then
  CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || true)
fi
[[ -z "$CMD" ]] && exit 0
CMD=$(echo "$CMD" | tr -s ' ')

# Padroes que CONSOMEM override (espelham block-destructive PATTERNS_OVERRIDABLE,
# --force-with-lease, e a familia no-verify-bypass). Se o comando casa qualquer um,
# o override foi usado e deve ser queimado (uso unico). Caso contrario, preserva.
CONSUMES_OVERRIDE=0
OVERRIDE_PATTERNS=(
  '\bgit[[:space:]]+reset[[:space:]]+--hard\b'
  '\bgit[[:space:]]+push[[:space:]]+.*--force-with-lease\b'
  '\bgit[[:space:]]+push[[:space:]]+.*(--force([^-]|$)|[[:space:]]-f([[:space:]]|$))'
  '\bgh[[:space:]]+repo[[:space:]]+delete\b'
  '\bgh[[:space:]]+repo[[:space:]]+edit[[:space:]]+.*--visibility\b'
  '\bnpm[[:space:]]+publish\b'
  '\bcargo[[:space:]]+publish\b'
  '\bcargo[[:space:]]+yank\b'
  '\bpnpm[[:space:]]+publish\b'
  '\byarn[[:space:]]+publish\b'
  '\btwine[[:space:]]+upload\b'
  '(^|[[:space:]])git[[:space:]]+(commit|push|merge|rebase|cherry-pick|am)[^|;&]*--no-verify'
  '(^|[[:space:]])git[[:space:]]+commit[^|;&]*[[:space:]]-[a-zA-Z]*n[a-zA-Z]*([[:space:]]|$)'
  '(^|[[:space:]])git[[:space:]]+[^|;&]*--no-gpg-sign'
  '(^|[[:space:]])git[[:space:]]+-c[[:space:]]+core\.hooksPath='
  '(^|[[:space:]])git[[:space:]]+-c[[:space:]]+commit\.gpgsign=false'
  '(^|[[:space:]])HUSKY=(0|false)([[:space:]]|=)'
  '(^|[[:space:]])SKIP=[^[:space:]]+[[:space:]]+(git|pre-commit)'
  '(^|[[:space:]])PRE_COMMIT_ALLOW_NO_CONFIG=(1|true)'
)
for p in "${OVERRIDE_PATTERNS[@]}"; do
  if echo "$CMD" | grep -iE -- "$p" >/dev/null 2>&1; then
    CONSUMES_OVERRIDE=1
    break
  fi
done

# Uso unico: apaga o arquivo SO quando o comando que executou consumiu o override,
# forcando justificativa nova para o proximo. NUNCA bloqueia.
if [[ "$CONSUMES_OVERRIDE" -eq 1 ]]; then
  rm -f "$REASON_FILE" || true
fi

exit 0
