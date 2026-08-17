#!/usr/bin/env bash
# template: .claude/hooks/block-destructive.sh
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C9b
# orçamento: <300ms
# protocolo: lê JSON do stdin (Claude Code PreToolUse), exit 2 = bloqueia.
# severidade: CRÍTICO
#
# LIMITACAO CONHECIDA — defesa em profundidade, NAO barreira absoluta.
# A cobertura e "best-effort" contra padroes destrutivos diretos. Ofuscacao
# trivial PASSA pelo hook, por exemplo:
#   - Variavel indireta:   X=rm; $X -rf /tmp/algo
#   - Eval com decodificacao:  eval "$(echo 'cm0gLXJmIC8=' | base64 -d)"
#   - Heredoc / pipe:      bash <<< 'rm -rf /tmp/algo'
#   - Alias:               alias del='rm -rf'; del /tmp/algo
#   - Caminho absoluto:    /bin/rm -rf  (parcialmente coberto via \brm\b)
#   - Comando em script:   bash ./script.sh  (onde script.sh contem o rm)
#
# Este hook protege contra erro/desatencao, NAO contra adversario determinado.
# Decisoes criticas (push em main, drop em prod, rotacao de credencial) exigem
# 4-eyes — segunda pessoa humana revisa antes de executar. NUNCA confie no hook
# como unica barreira contra acao destrutiva intencional.

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "BLOCKED: dependencia 'jq' ausente — instale jq para o hook funcionar." >&2; exit 2; }

# timeout 1s evita travamento se nada chegar pelo stdin. Em Git Bash minimo sem coreutils,
# `timeout` pode nao existir — fallback para cat puro.
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

# normaliza espacos multiplos (regex fica robusta a "rm   -rf" etc.)
CMD=$(echo "$CMD" | tr -s ' ')

# ALLOW-LIST: liberar push --force-with-lease (seguro, recomendado).
# IMPORTANTE: marca como liberado mas continua avaliando o restante do comando,
# para nao deixar passar `git push --force-with-lease && drop table x` por causa do allowlist.
LEASE_OK=0
if echo "$CMD" | grep -qE '\bgit[[:space:]]+push[[:space:]]+.*--force-with-lease\b'; then
  # mas se tiver --force "puro" no mesmo comando, bloqueia mesmo assim
  if echo "$CMD" | grep -qE '\bgit[[:space:]]+push[[:space:]]+.*(--force([^-]|$)|[[:space:]]-f[[:space:]])'; then
    echo "BLOCKED: --force junto de --force-with-lease — use apenas --force-with-lease." >&2
    exit 2
  fi
  LEASE_OK=1
fi

# Le motivo registrado em .claude/.override-reason. Override-reason permite uso de comandos
# da lista "destrutiva mas autorizavel" (npm publish, gh repo delete, git reset --hard local,
# rotacao programada). Bloqueio absoluto permanece para rm -rf /, mkfs, dd of=/dev/, fork bomb.
OVERRIDE_REASON=""
OVERRIDE_FILE=".claude/.override-reason"
if [[ -f "$OVERRIDE_FILE" ]]; then
  OVERRIDE_REASON=$(tr -d '\r' < "$OVERRIDE_FILE" | head -c 500 || true)
fi

# Detecta branch atual para diferenciar regra em main vs branch propria.
CURRENT_BRANCH=""
if command -v git >/dev/null 2>&1; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)
fi
IS_PROTECTED_BRANCH=0
if [[ "$CURRENT_BRANCH" =~ ^(main|master|release/.*)$ ]]; then
  IS_PROTECTED_BRANCH=1
fi

# CATEGORIA 1: bloqueio ABSOLUTO (sem override possivel — operacoes irreversiveis catastroficas).
PATTERNS_ABSOLUTE=(
  # rm recursivo+force em qualquer combinacao tocando raiz/home/wildcards
  '\brm[[:space:]]+(-[a-zA-Z]*[rR][a-zA-Z]*[fF][a-zA-Z]*|-[a-zA-Z]*[fF][a-zA-Z]*[rR][a-zA-Z]*)\b'
  '\brm[[:space:]]+(-r[[:space:]]+-f|-f[[:space:]]+-r|-R[[:space:]]+-f|-f[[:space:]]+-R)\b'
  '\brm[[:space:]]+--recursive[[:space:]]+--force\b'
  '\brm[[:space:]]+--force[[:space:]]+--recursive\b'
  '\brm[[:space:]]+-rf[[:space:]]+/'
  '\brm[[:space:]]+-rf[[:space:]]+~'
  '\brm[[:space:]]+-rf[[:space:]]+\*'
  '\brm[[:space:]]+-rf[[:space:]]+("?\$HOME"?|\./|\.\b)'
  '\brm[[:space:]]+-rf[[:space:]]+"?/[a-zA-Z]'
  # git destrutivos puros (sem lease)
  '\bgit[[:space:]]+push[[:space:]]+.*(--force([^-]|$)|[[:space:]]-f([[:space:]]|$))'
  '\bgit[[:space:]]+push[[:space:]]+[^|;&]+[[:space:]]:[a-zA-Z0-9_./-]+'
  '\bgit[[:space:]]+update-ref[[:space:]]+-d\b'
  '\bgit[[:space:]]+clean[[:space:]]+-[a-zA-Z]*f[a-zA-Z]*d[a-zA-Z]*\b'
  '\bgit[[:space:]]+clean[[:space:]]+-[a-zA-Z]*d[a-zA-Z]*f[a-zA-Z]*\b'
  '\bgit[[:space:]]+branch[[:space:]]+-D\b'
  # NOTA: `git add .` / `git add -A` NAO sao destrutivos (apenas stagam mudancas).
  # Higiene de stage seletivo e responsabilidade do auditor-commit-hygiene
  # (WARNING, nao block). Aqui so bloqueamos o que destroi dado.
  # SQL destrutivo
  '\bdrop[[:space:]]+database\b'
  '\bdrop[[:space:]]+table\b'
  '\bdrop[[:space:]]+schema\b'
  '\bdrop[[:space:]]+index\b'
  '\btruncate[[:space:]]+table\b'
  '\bdelete[[:space:]]+from[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*;'
  '\bdelete[[:space:]]+from[[:space:]]+[a-zA-Z_][a-zA-Z0-9_]*[[:space:]]*$'
  '\balter[[:space:]]+table[[:space:]]+.*[[:space:]]drop[[:space:]]+column\b'
  # SO / disco / fork bomb (NUNCA permitir override)
  '\bmkfs\b'
  '\bmkfs\.[a-z0-9]+\b'
  '\bdd[[:space:]]+.*if=.*of=/dev/'
  '\bchmod[[:space:]]+-R[[:space:]]+777\b'
  '\bshred\b'
  '\bwipefs\b'
  ':\(\)\{[[:space:]]*:\|:&[[:space:]]*\};:'
  # privilegio
  '\bsudo[[:space:]]+'
)

# CATEGORIA 2: bloqueio AUTORIZAVEL (passa se .claude/.override-reason existe).
PATTERNS_OVERRIDABLE=(
  '\bgit[[:space:]]+reset[[:space:]]+--hard\b'
  '\bgh[[:space:]]+repo[[:space:]]+delete\b'
  '\bgh[[:space:]]+repo[[:space:]]+edit[[:space:]]+.*--visibility\b'
  '\bnpm[[:space:]]+publish\b'
  '\bcargo[[:space:]]+publish\b'
  '\bcargo[[:space:]]+yank\b'
  '\bpnpm[[:space:]]+publish\b'
  '\byarn[[:space:]]+publish\b'
  '\btwine[[:space:]]+upload\b'
)

for p in "${PATTERNS_ABSOLUTE[@]}"; do
  # Pula o pattern de `git push --force` se LEASE_OK=1.
  if [[ "$LEASE_OK" -eq 1 && "$p" == *'git[[:space:]]+push[[:space:]]+.*(--force'* ]]; then
    # Mas se for branch protegida (main/master/release), lease tambem precisa de override.
    if [[ "$IS_PROTECTED_BRANCH" -eq 1 && -z "$OVERRIDE_REASON" ]]; then
      echo "BLOCKED: --force-with-lease em branch protegida ($CURRENT_BRANCH) exige .claude/.override-reason." >&2
      exit 2
    fi
    continue
  fi
  if echo "$CMD" | grep -iE -- "$p" >/dev/null 2>&1; then
    echo "BLOCKED: comando destrutivo nao-autorizavel (padrao: $p)" >&2
    echo "Comando: $CMD" >&2
    echo "Operacao irreversivel catastrofica. NAO ha override possivel via hook." >&2
    echo "Decisoes desse tipo exigem 4-eyes humano + autorizacao explicita do dono fora do agente." >&2
    exit 2
  fi
done

for p in "${PATTERNS_OVERRIDABLE[@]}"; do
  if echo "$CMD" | grep -iE -- "$p" >/dev/null 2>&1; then
    if [[ -z "$OVERRIDE_REASON" ]]; then
      echo "BLOCKED: comando autorizavel detectado (padrao: $p)" >&2
      echo "Comando: $CMD" >&2
      echo "Crie .claude/.override-reason com o motivo (uso unico, sera consumido pelo override-consume.sh apos executar)." >&2
      echo "Exemplo: echo 'release 1.2.3 conforme runbook' > .claude/.override-reason" >&2
      exit 2
    fi
    # Override presente: libera. O override-ledger.sh ja rodou antes e fez o log (sem
    # apagar o arquivo). O .override-reason de uso unico so e apagado pelo
    # override-consume.sh (PostToolUse), depois do comando executar.
    echo "INFO: comando autorizavel liberado por override-reason: $OVERRIDE_REASON" >&2
  fi
done

exit 0
