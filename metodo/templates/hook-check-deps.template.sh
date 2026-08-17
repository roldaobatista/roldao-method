#!/usr/bin/env bash
# Template: hook-check-deps.template.sh
# Destino: .claude/hooks/check-deps.sh
# Hook evento: SessionStart
# Matcher: *
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C9b
# orçamento: <500ms
# protocolo: SessionStart. Read-only. Verifica dependencias dos demais hooks
#            (jq, bash, python3, grep, find, date). NUNCA bloqueia — apenas
#            alerta via stderr quando algo falta.
# severidade: BAIXO (informativo, mas critico para confiabilidade)
#
# POR QUE EXISTE:
# Hooks em bash dependem de `jq`, `python3`, `grep -E`, `date -d`, etc. Em Windows
# nativo (CMD/PowerShell sem Git Bash) ou em Git Bash sem `jq` instalado, os hooks
# falham SILENCIOSAMENTE — exit 2 do shebang `#!/usr/bin/env bash` quando bash nao
# existe, ou exit 2 do proprio hook quando jq nao existe. Em ambos os casos, o
# Claude Code apenas recebe "block" e o usuario nao sabe POR QUE.
#
# Pior: se o hook nao for sequer invocado (Claude Code nao encontra o interpretador),
# a sessao roda SEM PROTECAO e o usuario tem falsa sensacao de seguranca — o
# `settings.json` declara hooks que nao estao rodando.
#
# Este hook expoe o problema na primeira mensagem da sessao.
#
# LIMITACAO:
# - SessionStart so dispara se o harness conseguir achar bash. Em ambiente
#   completamente sem bash, este hook tambem nao roda. Mitigacao: README do
#   projeto-modelo instrui instalacao de Git Bash + jq como pre-requisito.

set -euo pipefail

MISSING=()
WARN=()

# Dependencias obrigatorias (hooks usam diretamente)
REQUIRED=("jq" "bash" "grep" "sed" "awk" "head" "tr" "cat")
# Dependencias opcionais (fallbacks existem, mas degradam funcionalidade)
OPTIONAL=("python3" "find" "date" "timeout" "git")

for dep in "${REQUIRED[@]}"; do
  if ! command -v "$dep" >/dev/null 2>&1; then
    MISSING+=("$dep")
  fi
done

for dep in "${OPTIONAL[@]}"; do
  if ! command -v "$dep" >/dev/null 2>&1; then
    WARN+=("$dep")
  fi
done

# Deteccao de plataforma para mensagens uteis
PLATFORM="unknown"
case "${OSTYPE:-}" in
  linux*)   PLATFORM="linux" ;;
  darwin*)  PLATFORM="macos" ;;
  msys*|cygwin*|win32) PLATFORM="windows-gitbash" ;;
  *) [[ "${OS:-}" == "Windows_NT" ]] && PLATFORM="windows" ;;
esac

if [[ "${#MISSING[@]}" -eq 0 && "${#WARN[@]}" -eq 0 ]]; then
  exit 0
fi

echo "" >&2
echo "=== CHECK-DEPS — dependencias de hooks ===" >&2

if [[ "${#MISSING[@]}" -gt 0 ]]; then
  echo "FALTANDO (hooks vao falhar silenciosamente):" >&2
  for d in "${MISSING[@]}"; do
    echo "  - $d" >&2
  done
fi

if [[ "${#WARN[@]}" -gt 0 ]]; then
  echo "OPCIONAIS ausentes (funcionalidade degradada):" >&2
  for d in "${WARN[@]}"; do
    echo "  - $d" >&2
  done
fi

echo "" >&2
echo "Plataforma detectada: $PLATFORM" >&2

case "$PLATFORM" in
  windows|windows-gitbash)
    echo "" >&2
    echo "Como instalar no Windows:" >&2
    echo "  1) Instale Git for Windows (vem com Git Bash): https://git-scm.com/download/win" >&2
    echo "  2) Instale Chocolatey: https://chocolatey.org/install" >&2
    echo "  3) Instale jq: choco install jq" >&2
    echo "  4) Instale Python 3: choco install python" >&2
    echo "  5) Configure Claude Code para usar bash de C:\\Program Files\\Git\\bin\\bash.exe" >&2
    echo "" >&2
    echo "ATENCAO: sem essas dependencias, .claude/settings.json declara hooks que" >&2
    echo "NAO ESTAO RODANDO — voce esta com FALSA SENSACAO de protecao." >&2
    ;;
  linux)
    echo "" >&2
    echo "Como instalar no Linux:" >&2
    echo "  Debian/Ubuntu: sudo apt install jq python3 git" >&2
    echo "  Fedora/RHEL:   sudo dnf install jq python3 git" >&2
    echo "  Arch:          sudo pacman -S jq python git" >&2
    ;;
  macos)
    echo "" >&2
    echo "Como instalar no macOS (com Homebrew):" >&2
    echo "  brew install jq python3 git" >&2
    ;;
  *)
    echo "" >&2
    echo "Instale as ferramentas acima via gerenciador de pacotes da sua plataforma." >&2
    ;;
esac

echo "===========================================" >&2
echo "" >&2

# NUNCA bloqueia — SessionStart hook informativo.
exit 0
