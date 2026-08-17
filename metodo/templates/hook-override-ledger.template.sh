#!/usr/bin/env bash
# Template: hook-override-ledger.template.sh
# Destino: .claude/hooks/override-ledger.sh
# Hook evento: PreToolUse
# Matcher: Bash
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C9b, REGRAS-INEGOCIAVEIS
# orçamento: <300ms
# protocolo: PreToolUse Bash. Exige motivo registrado para flags de override e loga.
# severidade: ALTO
#
# IMPORTANTE: ler motivo de ARQUIVO, nao de env var.
# Env vars exportadas no shell do usuario NAO sao herdadas pelo processo do hook
# disparado pelo Claude Code (subprocesso isolado). Em vez disso, o usuario cria
# `.claude/.override-reason` (gitignored) com o motivo ANTES de pedir o comando.
# O hook le, valida e loga em overrides.log. NAO apaga o arquivo aqui.
#
# CONSUMO DE USO UNICO — fica no override-consume.sh (PostToolUse), NAO aqui.
# Motivo (bug corrigido em 2026-05-28): este ledger e o 1o hook em PreToolUse/Bash.
# Se apagasse o .override-reason agora, os hooks seguintes (block-destructive.sh e
# no-verify-bypass.sh) nao achariam o arquivo que precisam LER para liberar
# `git push --force-with-lease` em branch protegida ou `git commit --no-verify`.
# Por isso o ledger so registra; o arquivo so e apagado pelo override-consume.sh
# DEPOIS que o comando passou por todo o pipeline PreToolUse e executou.
#
# AUDITORIA 7 — RASTREABILIDADE OBRIGATORIA:
# Cada override registrado em overrides.log precisa identificar QUEM autorizou.
# Capturamos: timestamp ISO8601 (UTC), usuario do SO (USER/USERNAME), nome+email
# do git config (se houver), flag detectada, motivo escrito e comando completo.
# Sem essa metadata, log de override perde valor forense — Auditoria 7 reclama
# que "override existe mas nao da pra responsabilizar ninguem".
#
# LIMITACAO CONHECIDA: usuario malicioso pode alterar git config localmente ou
# rodar como outro USER. Isto e log de boa-fe (deter erro/desatencao), nao prova
# legal. Para auditoria forense real, exigir 4-eyes humano + assinatura GPG.

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "BLOCKED: dependencia 'jq' ausente — instale jq para o hook funcionar." >&2; exit 2; }

if command -v timeout >/dev/null 2>&1; then
  INPUT=$(timeout 1 cat || true)
else
  INPUT=$(cat || true)
fi
if [[ -z "${INPUT:-}" ]]; then
  exit 0
fi

CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
if [[ -z "$CMD" ]]; then
  exit 0
fi

CMD_NORM=$(echo "$CMD" | tr -s ' ')

# Detecta branch atual para diferenciar regra em main vs branch propria.
CURRENT_BRANCH=""
if command -v git >/dev/null 2>&1; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
fi
IS_PROTECTED_BRANCH=0
if [[ "$CURRENT_BRANCH" =~ ^(main|master|release/.*)$ ]]; then
  IS_PROTECTED_BRANCH=1
fi

# Flags de override que exigem justificativa registrada.
# Regex refinada: `\bgit[[:space:]]+push[[:space:]]+(-[a-zA-Z]*f[a-zA-Z]*|--force)` casa
# `-f` puro / `-fu` / `--force` mas EXCLUI `--follow-tags` (que tambem tem `f`).
# `--force([^-]|$)` evita casar --force-with-lease (`--force` seguido de hifen).
OVERRIDE_PATTERNS=(
  '--force([^-]|$)'
  '\bgit[[:space:]]+push[[:space:]]+(--force[[:space:]]|-[a-zA-Z]*f([[:space:]]|$))'
  '--no-verify'
  '--no-gpg-sign'
  '--skip-tests'
  '--ignore-tests'
  '--allow-dirty'
  '--unsafe-perm'
)

# --force-with-lease tratado a parte: so exige override-reason em branch protegida.
# Em branch propria (feature/*, fix/*, etc), passa direto (pratica moderna segura).
LEASE_PATTERN='--force-with-lease'
LEASE_MATCH=0
if echo "$CMD_NORM" | grep -iE -- "$LEASE_PATTERN" >/dev/null 2>&1; then
  LEASE_MATCH=1
fi

MATCHED=""
for p in "${OVERRIDE_PATTERNS[@]}"; do
  if echo "$CMD_NORM" | grep -iE -- "$p" >/dev/null 2>&1; then
    # Evitar falso positivo: --follow-tags tem 'f' agrupado
    if echo "$CMD_NORM" | grep -E -- "--follow-tags" >/dev/null 2>&1; then
      # Re-checa se o match nao e exclusivamente o --follow-tags
      CMD_STRIPPED=$(echo "$CMD_NORM" | sed 's/--follow-tags//g')
      if ! echo "$CMD_STRIPPED" | grep -iE -- "$p" >/dev/null 2>&1; then
        continue
      fi
    fi
    MATCHED="$p"
    break
  fi
done

# Se for lease em branch protegida e sem outro match, registra para ledger.
if [[ -z "$MATCHED" && "$LEASE_MATCH" -eq 1 && "$IS_PROTECTED_BRANCH" -eq 1 ]]; then
  MATCHED="$LEASE_PATTERN (em branch protegida $CURRENT_BRANCH)"
fi

# Se for lease em branch propria, liberar sem ledger (pratica moderna).
if [[ -z "$MATCHED" && "$LEASE_MATCH" -eq 1 && "$IS_PROTECTED_BRANCH" -eq 0 ]]; then
  exit 0
fi

if [[ -z "$MATCHED" ]]; then
  exit 0
fi

# Comando usa flag de override — exigir motivo em .claude/.override-reason
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
REASON_FILE="$PROJECT_DIR/.claude/.override-reason"

if [[ ! -f "$REASON_FILE" ]]; then
  echo "BLOCKED: comando usa flag de override ($MATCHED) sem justificativa registrada." >&2
  echo "Comando: $CMD" >&2
  echo "" >&2
  echo "Para prosseguir, crie o arquivo de motivo ANTES de rodar o comando." >&2
  echo "Use aspas simples para evitar interpretacao de \$ ! \` etc:" >&2
  echo "  echo 'precisei --force-with-lease pq rebase do PR #42' > .claude/.override-reason" >&2
  echo "" >&2
  echo "O arquivo e de uso unico (apagado apos uso) e nao deve ser versionado." >&2
  echo "Garanta que '.claude/.override-reason' esta no .gitignore (ver templates/gitignore.template)." >&2
  echo "O motivo sera logado em .claude/overrides.log para auditoria." >&2
  exit 2
fi

OVERRIDE_REASON=$(head -c 2000 "$REASON_FILE" | tr -d '\r' | tr '\n' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

if [[ -z "$OVERRIDE_REASON" ]]; then
  echo "BLOCKED: arquivo .claude/.override-reason existe mas esta vazio." >&2
  echo "Escreva o motivo do override no arquivo antes de rodar o comando." >&2
  exit 2
fi

# Loga override em .claude/overrides.log
LOG_DIR="$PROJECT_DIR/.claude"
LOG_FILE="$LOG_DIR/overrides.log"

mkdir -p "$LOG_DIR"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Identificar quem rodou o override (Auditoria 7).
# Ordem de captura: USER env (unix), USERNAME env (Windows), fallback "desconhecido".
OS_USER="${USER:-${USERNAME:-desconhecido}}"

# git config user.name / user.email — fallback para "n/a" se git nao configurado
# ou diretorio fora de repo. `|| true` evita que set -e mate o script.
GIT_USER="n/a"
GIT_EMAIL="n/a"
if command -v git >/dev/null 2>&1; then
  GIT_USER_RAW=$(git config user.name 2>/dev/null || true)
  GIT_EMAIL_RAW=$(git config user.email 2>/dev/null || true)
  [[ -n "${GIT_USER_RAW:-}" ]] && GIT_USER="$GIT_USER_RAW"
  [[ -n "${GIT_EMAIL_RAW:-}" ]] && GIT_EMAIL="$GIT_EMAIL_RAW"
fi

# Linha unica formato pipe — facil de grepar e parsear (`awk -F' '`).
# Mantemos tambem o bloco YAML legivel logo abaixo, para inspecao humana.
echo "[$TIMESTAMP] [user=$OS_USER] [git=$GIT_USER] [email=$GIT_EMAIL] flag=$MATCHED reason=\"$OVERRIDE_REASON\" command=$CMD" >> "$LOG_FILE"

{
  echo "---"
  echo "timestamp: $TIMESTAMP"
  echo "os_user: $OS_USER"
  echo "git_user: $GIT_USER"
  echo "git_email: $GIT_EMAIL"
  echo "flag: $MATCHED"
  echo "reason: $OVERRIDE_REASON"
  echo "command: $CMD"
} >> "$LOG_FILE"

# NAO apaga o .override-reason aqui (causa-raiz do bug 2026-05-28): block-destructive.sh
# e no-verify-bypass.sh rodam DEPOIS deste e ainda precisam LER este arquivo para liberar
# operacoes legitimas com override. O consumo de uso unico fica no override-consume.sh
# (PostToolUse), que roda uma vez depois do comando executar.

# Permite o comando seguir (block-destructive.sh roda depois e ainda pode bloquear)
exit 0
