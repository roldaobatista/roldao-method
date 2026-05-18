#!/usr/bin/env bash
# mcp-validator.sh — valida .mcp.json contra allowlist de fornecedores conhecidos.
# Hook SessionStart.
# Reduz risco de MCP malicioso aderir credenciais sem o usuario perceber.

set -u

# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

PROJDIR=$(sanitize_projdir) || exit 2
MCP_FILE="$PROJDIR/.mcp.json"

[ -f "$MCP_FILE" ] || exit 0

# Servers MCP de fornecedores conhecidos (allowlist top-20 reais).
# v0.5.0: ampliada com integracoes mais comuns em projetos profissionais.
# Adicionar conforme catalogo oficial evolui.
ALLOWLIST=(
  # Oficiais Anthropic/MCP
  "modelcontextprotocol/"
  "anthropic-experimental/"
  "@modelcontextprotocol/"
  "@anthropic/"
  "@anthropic-ai/"
  "github.com/modelcontextprotocol"
  "github.com/anthropics"
  "anthropic.com"
  # Test/automation
  "@playwright/"
  "@vitest/"
  "@cypress/"
  # Comunicacao
  "@slack/mcp"
  "slack-mcp-server"
  "linear-mcp"
  "@linear/mcp"
  # Codigo / SCM
  "@github/mcp"
  "github-mcp-server"
  "@gitlab/mcp"
  # Pesquisa
  "@brave/brave-search-mcp"
  "brave-search-mcp"
  "@perplexity/mcp"
  # Produtividade
  "@notion/mcp"
  "notion-mcp"
  "@google/calendar-mcp"
  "@google/drive-mcp"
  # Banco de dados
  "@postgres/mcp"
  "postgres-mcp-server"
  "@sqlite/mcp"
  "mcp-server-sqlite"
  # Cloud / infra
  "@aws/mcp"
  "@cloudflare/mcp"
  # Filesystem / utilitarios
  "@filesystem/mcp"
  "mcp-server-filesystem"
  "@memory/mcp"
  "mcp-server-memory"
  "@fetch/mcp"
  "mcp-server-fetch"
)

# Le servers (com perl, sem dependencia externa de jq).
SERVERS=$(perl -MJSON::PP -e '
  local $/;
  my $f = shift;
  open(my $fh, "<", $f) or exit 0;
  my $json = decode_json(<$fh>);
  close($fh);
  my $s = $json->{mcpServers} // {};
  for my $name (keys %$s) {
    my $cfg = $s->{$name};
    my $cmd = $cfg->{command} // "";
    my @args = @{$cfg->{args} // []};
    print "$name|$cmd|@args\n";
  }
' "$MCP_FILE" 2>/dev/null)

[ -z "$SERVERS" ] && exit 0

DESCONHECIDOS=()
while IFS= read -r line; do
  [ -z "$line" ] && continue
  IFS='|' read -r name cmd args <<< "$line"
  FULL="$cmd $args"
  AUTHORIZED=0
  for allowed in "${ALLOWLIST[@]}"; do
    # Ancora no limite do nome de pacote — substring solta deixava
    # "@modelcontextprotocol/server-evil" casar "modelcontextprotocol/".
    # O token permitido tem que estar delimitado por inicio/espaco/@ e
    # terminar em fim/espaco/@versao (nao pode ter sufixo de nome).
    esc=$(printf '%s' "$allowed" | sed 's/[.[\*^$/]/\\&/g')
    if printf '%s' "$FULL" | grep -qE "(^|[[:space:]]|@)${esc}([[:space:]]|@|\$)"; then
      AUTHORIZED=1; break
    fi
  done
  if [ "$AUTHORIZED" -eq 0 ]; then
    DESCONHECIDOS+=("$name -> $FULL")
  fi
done <<< "$SERVERS"

if [ "${#DESCONHECIDOS[@]}" -gt 0 ]; then
  cat >&2 <<EOF
[mcp-validator] AVISO: MCP servers fora da allowlist conhecida.

Servers nao reconhecidos:
EOF
  for d in "${DESCONHECIDOS[@]}"; do
    printf '  - %s\n' "$d" >&2
  done
  cat >&2 <<EOF

Risco: MCP de terceiros pode receber prompt completo + chamadas de ferramenta.
Antes de continuar, confirme:
  1. Voce confia no autor do MCP?
  2. O server e oficial / open source verificado?
  3. As permissoes necessarias estao OK?

Doc: docs/MCP-GUIA-BR.md.
EOF
  # AVISO, nao bloqueio (SessionStart nao bloqueia execucao do harness)
fi

exit 0
