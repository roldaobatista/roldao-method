#!/usr/bin/env bash
# block-destructive.sh — bloqueia comandos destrutivos no Bash tool.
# Hook PreToolUse, matcher: Bash.
# SEC-002, INV-AGENT-005.
#
# Parser perl -MJSON::PP pra suportar Windows Git Bash (sem jq).

set -uo pipefail
INPUT=$(cat)

CMD=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{command} // "";
' 2>/dev/null)

# Fail-closed: se o parser falhou (JSON invalido/encoding) mas ha input, NAO
# libera silenciosamente — escaneia o INPUT cru. So sai 0 se realmente vazio.
if [ -z "$CMD" ]; then
  if [ -n "$INPUT" ]; then
    CMD="$INPUT"
  else
    exit 0
  fi
fi

# Whitelist de alvos seguros pra `rm -rf` — artefatos locais regeneraveis.
# Auditoria 10-agentes (2026-05-22): bloqueador falso-positivo em `rm -rf node_modules`
# obrigava dev a sair do agente pra limpar build. Lista mantida curta: so paths que
# QUALQUER projeto JS/TS/Python/Go/Rust/Java regera deterministicamente.
SAFE_RM_TARGETS='node_modules|\.next|\.nuxt|dist|build|out|target|\.cache|\.parcel-cache|\.turbo|\.vite|\.svelte-kit|coverage|\.pytest_cache|__pycache__|\.mypy_cache|\.tox|\.ruff_cache|venv|\.venv|\.idea|\.vscode/\.cache'

# Se for `rm -rf <whitelist>` puro (1 alvo, sem traversal, sem $HOME), libera.
# Padrao: `rm -rf node_modules`, `rm -rf ./dist`, `rm -rf "./build"` etc.
# Continua bloqueando: `rm -rf ~`, `rm -rf /`, `rm -rf node_modules ../algo`.
RM_TARGET=$(printf '%s' "$CMD" | perl -ne '
  if (/^\s*rm\s+-[a-zA-Z]*[rf][a-zA-Z]*\s+(.+?)\s*$/) {
    my $t = $1;
    $t =~ s/^["'\'']//; $t =~ s/["'\'']$//;
    print $t;
  }
' 2>/dev/null)
if [ -n "$RM_TARGET" ]; then
  # Recusa se tem espaço (multi-alvo), traversal, ou path absoluto/home perigoso
  case "$RM_TARGET" in
    *' '*|*'..'*|'/'|'~'|'~/'*|'$HOME'*|'/etc'*|'/usr'*|'/var'*|'/home'*) ;;
    *)
      # Strip leading ./ pra comparar com whitelist
      _t="${RM_TARGET#./}"
      if printf '%s' "$_t" | grep -qE "^($SAFE_RM_TARGETS)/?$"; then
        # Alvo regeneravel — libera silenciosamente.
        exit 0
      fi
      ;;
  esac
fi

# Padrões destrutivos
# NOTA SEC-002: 'git push --force-with-lease' (sem '=value') E PERMITIDO — e o caminho
# seguro recomendado pelo proprio git pra rebase de feature branch privada. Bloqueamos
# apenas '--force' cru, '-f' isolado e variantes ':<ref>' / '--delete'. Force-with-lease
# verifica que o ref remoto nao mudou — opera so se a expectativa local bater.
# Pares: "regex|||descrição humana". Separador `|||` escolhido por não aparecer em regex de shell.
PATTERNS=(
  'rm[[:space:]]+-[A-Za-z]*r[A-Za-z]*f|||apagar pasta inteira recursivamente (rm -rf)'
  'rm[[:space:]]+-[A-Za-z]*f[A-Za-z]*r|||apagar pasta inteira recursivamente (rm -fr)'
  'rm[[:space:]]+-[A-Za-z]*r([[:space:]]|$)|||apagar recursivamente (rm -r)'
  'rm[[:space:]]+-[fr][A-Za-z]*[[:space:]]*[-./~"'"'"'$*]|||rm com alvo perigoso (path absoluto, home, ou wildcard)'
  'rm[[:space:]]+.*--recursive|||apagar recursivamente (rm --recursive)'
  'rm[[:space:]]+.*--force|||apagar sem perguntar (rm --force)'
  'rm[[:space:]]+.*--no-preserve-root|||apagar a raiz do sistema (rm --no-preserve-root)'
  'find[[:space:]]+.*-delete|||apagar arquivos varridos por find'
  'find[[:space:]]+.*-exec[[:space:]]+rm|||find + rm em massa'
  '[[:space:]]shred[[:space:]]|||sobrescrever arquivo pra impedir recuperação (shred)'
  ':\(\)[[:space:]]*\{[[:space:]]*:[[:space:]]*\|[[:space:]]*:|||fork bomb (trava a máquina)'
  'git[[:space:]]+push.*--force([[:space:]]|$)|||sobrescrever histórico remoto (git push --force — use --force-with-lease)'
  'git[[:space:]]+push.*-f[[:space:]]|||sobrescrever histórico remoto (git push -f)'
  'git[[:space:]]+push.*[[:space:]]-f$|||sobrescrever histórico remoto (git push -f)'
  'git[[:space:]]+push.*--delete|||apagar branch remota (git push --delete)'
  'git[[:space:]]+push[[:space:]]+[^|]*[[:space:]]:[A-Za-z]|||apagar branch remota (git push :branch)'
  'git[[:space:]]+reset[[:space:]]+--hard|||descartar mudanças locais sem aviso (git reset --hard)'
  'git[[:space:]]+clean[[:space:]]+-fd|||apagar arquivos não rastreados (git clean -fd)'
  'git[[:space:]]+branch[[:space:]]+-D|||apagar branch local sem confirmar merge (git branch -D)'
  'chmod[[:space:]]+777|||permissão totalmente aberta (chmod 777)'
  'mkfs\.|||formatar partição (mkfs)'
  'dd[[:space:]]+if=|||escrever raw em disco (dd if=)'
  'curl.*\|[[:space:]]*(bash|sh)|||baixar e executar script da internet (curl | bash)'
  'wget.*\|[[:space:]]*(bash|sh)|||baixar e executar script da internet (wget | bash)'
  'DROP[[:space:]]+TABLE|||apagar tabela do banco (DROP TABLE)'
  'TRUNCATE[[:space:]]+TABLE|||esvaziar tabela do banco (TRUNCATE TABLE)'
  'DROP[[:space:]]+DATABASE|||apagar banco inteiro (DROP DATABASE)'
  '--no-verify|||pular hooks de pré-commit (--no-verify)'
  '--skip-tests|||pular testes (--skip-tests)'
  '--skip-hooks|||pular hooks (--skip-hooks)'
)

for entry in "${PATTERNS[@]}"; do
  pat="${entry%%|||*}"
  desc="${entry#*|||}"
  if printf '%s\n' "$CMD" | grep -qiE -- "$pat"; then
    cat >&2 <<EOF
[block-destructive] BLOQUEADO: comando irreversível detectado.

Comando: $CMD
O que detectamos: $desc

Por que bloqueia (SEC-002, INV-AGENT-005): operação destrutiva exige confirmação explícita do dono do projeto.

Como destravar (se for intencional):
- Confirme com o usuário o que vai acontecer (em PT-BR claro, sem jargão).
- Só depois execute o comando, ou peça pro usuário rodar manualmente.
EOF
    exit 2
  fi
done

exit 0
