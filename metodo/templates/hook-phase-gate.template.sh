#!/usr/bin/env bash
# Template: hook-phase-gate.template.sh
# Destino: .claude/hooks/phase-gate.sh
# Hook evento: PreToolUse
# Matcher: Write|Edit
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C7 (gate de marco), Princípio §1.5
# orçamento: <200ms
# protocolo: PreToolUse Write|Edit. Bloqueia escrita em código de produção enquanto
#            C1 Descoberta não estiver fechada e ADR-0001 (stack) não estiver aceita.
# severidade: CRÍTICO
#
# Por que existe: o método inteiro depende de spec gerar código, não código gerar spec.
# Sem este gate, o agente IA pula direto pra src/ antes de pensar no problema,
# personas, jornadas, métricas. É o anti-padrão #2 do §18 do manual.
#
# Como funciona:
#   1. Se o arquivo sendo escrito NÃO é código de produção, libera direto.
#   2. Se docs/descoberta/sintese-final.md tem status: stable, checa ADR-0001.
#   3. Se ADR-0001 (stack) tem status: aceita, libera.
#   4. Se override consciente: criar `.claude/.override-reason` com motivo, este hook
#      registra e libera (mas o override-ledger.sh espelha para auditoria).
#   5. Se projeto é micro (experimento ≤2d), criar `.claude/.phase-gate-disabled`
#      vazio na raiz do projeto destino; este hook respeita e libera.
#
# Limitação: detecta intent pelo PATH do arquivo. Renomear src/ para fonte/ contorna.
# Não é defesa criptográfica — é guardrail para o caso típico (esquecimento).

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "BLOCKED: dependencia 'jq' ausente — instale jq." >&2; exit 2; }

if command -v timeout >/dev/null 2>&1; then
  INPUT=$(timeout 1 cat || true)
else
  INPUT=$(cat || true)
fi
[[ -z "${INPUT:-}" ]] && exit 0

# Windows/Git Bash: file_path e CLAUDE_PROJECT_DIR podem chegar com barra invertida
# (C:\projetos\app\src\index.ts) E em convencoes de drive diferentes (`C:/...` via
# JSON do Claude Code vs `/c/...` no env do Git Bash). Sem canonicalizar, o strip do
# prefixo e o `case src/*` nao casam e o gate LIBERA codigo de producao sem ADR
# (false-negative perigoso) — ou bloqueia um doc por engano. canon_path() resolve:
#   1. \ -> /   (NOTA: o pattern PRECISA ser quotado "$BS"; backslash no pattern de
#      ${//} e escape mesmo vindo de variavel, e `${var//\\//}` e ambiguo: apaga `/`).
#   2. C:/... -> /c/...  (drive minusculo no estilo Git Bash, formato unico para ambos)
BS='\'; FWD='/'
canon_path() {
  local p="${1//"$BS"/"$FWD"}"
  case "$p" in
    [A-Za-z]:/*) local d="${p%%:*}"; p="/${d,,}${p#[A-Za-z]:}" ;;
  esac
  printf '%s' "$p"
}
PROJECT_DIR=$(canon_path "${CLAUDE_PROJECT_DIR:-$PWD}")

# Bypass global do projeto (experimento/solo): arquivo vazio na raiz desliga este hook
if [[ -f "$PROJECT_DIR/.claude/.phase-gate-disabled" ]]; then
  exit 0
fi

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[[ -z "$FILE" ]] && exit 0
FILE=$(canon_path "$FILE")

# Normaliza caminho — aceita relativo e absoluto
case "$FILE" in
  /*|[A-Za-z]:*) REL_FILE="${FILE#$PROJECT_DIR/}" ;;
  *) REL_FILE="$FILE" ;;
esac

# É código de produção? Conjunto canônico de pastas comuns
IS_PRODUCTION_CODE=0
case "$REL_FILE" in
  src/*|lib/*|app/*|packages/*|bin/*|cmd/*|internal/*|pkg/*|services/*|api/*|controllers/*|models/*|handlers/*|routes/*|domains/*|domain/*|core/*|backend/*|frontend/*|web/*|mobile/*|client/*|server/*|worker/*|jobs/*|migrations/*|database/migrations/*)
    IS_PRODUCTION_CODE=1
    ;;
esac

# Extensões que indicam código mesmo fora dos paths acima (linguagens compiladas/scripted)
if [[ $IS_PRODUCTION_CODE -eq 0 ]]; then
  case "$FILE" in
    *.py|*.js|*.ts|*.jsx|*.tsx|*.rs|*.go|*.java|*.kt|*.swift|*.rb|*.php|*.cs|*.cpp|*.c|*.h|*.hpp|*.scala|*.ex|*.exs|*.erl|*.clj|*.cljs|*.dart|*.lua|*.r|*.jl|*.zig|*.nim|*.cr)
      # Só bloqueia se NÃO está em pastas de teste/exemplo/tooling
      case "$REL_FILE" in
        test/*|tests/*|spec/*|specs/*|__tests__/*|e2e/*|examples/*|example/*|docs/*|scripts/*|tools/*|tooling/*|.github/*|.claude/*|build/*|dist/*|node_modules/*|target/*|venv/*|.venv/*)
          : # libera
          ;;
        *)
          IS_PRODUCTION_CODE=1
          ;;
      esac
      ;;
  esac
fi

[[ $IS_PRODUCTION_CODE -eq 0 ]] && exit 0

# Override consciente — registrado pelo override-ledger.sh paralelo
if [[ -f "$PROJECT_DIR/.claude/.override-reason" ]]; then
  REASON=$(cat "$PROJECT_DIR/.claude/.override-reason" 2>/dev/null || true)
  if [[ -n "$REASON" ]]; then
    # Permite, mas avisa via stderr (não bloqueia — exit 0)
    echo "[phase-gate] AVISO: override ativo — motivo: $REASON" >&2
    exit 0
  fi
fi

# Verifica existência e status de docs/descoberta/sintese-final.md
SINTESE="$PROJECT_DIR/docs/descoberta/sintese-final.md"
if [[ ! -f "$SINTESE" ]]; then
  cat >&2 <<EOF
BLOCKED por phase-gate: tentativa de escrever código de produção antes de C1 Descoberta.

Arquivo bloqueado: $FILE

C1 ainda não foi feita. O método exige:
  1. docs/descoberta/problema.md       (dor real, custo atual)
  2. docs/descoberta/personas.md       (quem usa)
  3. docs/descoberta/jornadas.md       (fluxo hoje vs depois)
  4. docs/descoberta/business-model-canvas.md
  5. docs/descoberta/value-proposition-canvas.md
  6. docs/descoberta/concorrentes.md
  7. docs/descoberta/nao-fazer.md
  8. docs/descoberta/riscos.md
  9. docs/descoberta/metricas-chave.md
  10. docs/descoberta/sintese-final.md  (status: stable destrava este gate)

Como destravar:
  (a) completar C1 até docs/descoberta/sintese-final.md ficar status: stable
      e aceitar docs/adr/ADR-0001-*.md (stack), OU
  (b) registrar override consciente em .claude/.override-reason com motivo, OU
  (c) projeto experimento ≤2d: criar .claude/.phase-gate-disabled vazio (desliga este hook).

Ver ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3 (C1 Descoberta) + §15 (modo enxuto §14.15).
EOF
  exit 2
fi

# sintese-final.md existe — checa status no frontmatter
STATUS=$(awk '/^---$/{f++; next} f==1 && /^status:/ {gsub(/^status:[[:space:]]*/, ""); print; exit}' "$SINTESE" 2>/dev/null || echo "")
STATUS=$(echo "$STATUS" | tr -d '[:space:]')

if [[ "$STATUS" != "stable" ]]; then
  cat >&2 <<EOF
BLOCKED por phase-gate: docs/descoberta/sintese-final.md existe mas status='${STATUS:-vazio}', esperado 'stable'.

Arquivo bloqueado: $FILE

C1 Descoberta ainda não está fechada. Para destravar:
  (a) completar checklist em docs/descoberta/sintese-final.md §11,
      mudar status para 'stable' e aceitar ADR-0001 (stack), OU
  (b) registrar override consciente em .claude/.override-reason com motivo, OU
  (c) projeto experimento ≤2d: criar .claude/.phase-gate-disabled vazio (desliga este hook).
EOF
  exit 2
fi

# C1 fechada — agora exige ADR-0001 (stack) aceita.
ADR_DIR="$PROJECT_DIR/docs/adr"
ADR_STACK=""
if [[ -d "$ADR_DIR" ]]; then
  ADR_STACK=$(find "$ADR_DIR" -maxdepth 1 -type f \( -iname "ADR-0001*.md" -o -iname "0001*.md" \) 2>/dev/null | head -n 1 || true)
fi

if [[ -z "$ADR_STACK" ]]; then
  cat >&2 <<EOF
BLOCKED por phase-gate: C1 está stable, mas ADR-0001 (stack) ainda não existe.

Arquivo bloqueado: $FILE

Antes da primeira linha de código de produto, registre a stack em:
  docs/adr/ADR-0001-<stack>.md

Status esperado no frontmatter:
  status: aceita

Alternativas:
  (a) abrir e aceitar ADR-0001, OU
  (b) registrar override consciente em .claude/.override-reason com motivo, OU
  (c) projeto experimento ≤2d: criar .claude/.phase-gate-disabled vazio.
EOF
  exit 2
fi

ADR_STATUS=$(awk '/^---$/{f++; next} f==1 && /^status:/ {gsub(/^status:[[:space:]]*/, ""); print; exit}' "$ADR_STACK" 2>/dev/null || echo "")
ADR_STATUS=$(echo "$ADR_STATUS" | tr -d '[:space:]')

case "$ADR_STATUS" in
  aceita|aceito|accepted) ;;
  *)
    cat >&2 <<EOF
BLOCKED por phase-gate: ADR-0001 existe mas status='${ADR_STATUS:-vazio}', esperado 'aceita'.

ADR encontrada: $ADR_STACK
Arquivo bloqueado: $FILE

Promova ADR-0001 para status: aceita antes de escrever código de produto.
EOF
    exit 2
    ;;
esac

# C1 fechada + ADR-0001 aceita — libera
exit 0
