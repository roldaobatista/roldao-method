# Presets MCP — fornecedores BR

> Cada preset é um `.mcp.json` pronto para um fornecedor brasileiro auditado. Copie o que precisa pra `.mcp.json` (raiz do projeto), preencha credenciais via variável de ambiente e o Claude Code carrega no próximo start.

## Como usar

1. Escolha o preset (`pix-asaas.json`, `nfe-focus.json`, `erp-omie.json`, `postgres-readonly-br.json`).
2. Copie pra raiz: `cp templates/.mcp.json.examples/pix-asaas.json .mcp.json`
3. Exporte as credenciais necessárias no `~/.bashrc`, `.envrc` ou setup local **fora do repo**:
   ```bash
   export ASAAS_API_KEY="$aas_xxxxxxxx"
   ```
4. No Claude Code, rode `/mcp` pra confirmar o server ativo.

## Por que esses fornecedores

- **Auditados em allowlist** — `.claude/hooks/mcp-validator.sh` reconhece. MCPs fora dela disparam aviso na sessão start.
- **PT-BR nativo** — integram com SEFAZ, Bacen, Receita Federal sem adaptação.
- **LGPD-friendly** — dados não saem do Brasil (LGPD-005). Cada preset declara o regime de tratamento no campo `_lgpd`.

## Mesclar múltiplos

Pode combinar mais de um — copie os blocos `mcpServers` num único `.mcp.json`:

```json
{
  "mcpServers": {
    "asaas": { "command": "npx", "args": ["-y", "asaas-mcp"], "env": {"ASAAS_API_KEY": "${ASAAS_API_KEY}"} },
    "omie":  { "command": "npx", "args": ["-y", "omie-mcp"],  "env": {"OMIE_APP_KEY": "${OMIE_APP_KEY}", "OMIE_APP_SECRET": "${OMIE_APP_SECRET}"} }
  }
}
```

## Manter `.mcp.json` fora do versionamento?

- **Versionar** se o time todo usa as mesmas integrações (e credenciais ficam só em env var).
- **Não versionar** se cada dev tem MCP diferente — adicione `.mcp.json` ao `.gitignore` e use `claude mcp add` por sessão.

Detalhes em `docs/MCP-GUIA-BR.md`.
