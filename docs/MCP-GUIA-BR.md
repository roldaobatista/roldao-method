---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# MCP — Guia em PT-BR

Guia rápido pra entender e usar **MCP (Model Context Protocol)** no Claude Code, em linguagem acessível pra quem não é programador.

## O que é MCP em uma frase

> **MCP é um padrão que permite ao Claude usar "robôs auxiliares" (servers) pra ler/escrever em sistemas externos** — GitHub, banco de dados, planilha, Slack, etc.

Sem MCP, Claude só lê arquivos locais.
Com MCP, Claude pode (por exemplo):
- Criar issue/PR no GitHub
- Consultar uma tabela no PostgreSQL
- Abrir uma URL no navegador e clicar em coisas
- Ler documento no Google Drive

## Por que NÃO instalamos MCP por padrão

Por **segurança e simplicidade.** O `enableAllProjectMcpServers: false` no `settings.json` do ROLDAO-METHOD garante que **nenhum MCP roda automaticamente** ao clonar um projeto. Você precisa **ativar manualmente** cada MCP que quer usar.

Isso protege contra: clonar projeto malicioso que tenta sequestrar seu Claude.

## MCPs que recomendo pra dev BR (em 2026)

### Essenciais

- **`github-official`** — o MCP oficial da Anthropic pra GitHub. Cria issue, PR, comenta, lê código de qualquer repo. **Recomendado.**
- **`playwright`** — controla navegador (Chrome). Útil pra testar UI, fazer scraping, validar formulário visualmente.
- **`context7`** — busca documentação atualizada de bibliotecas (Django, React, etc). Evita o Claude inventar API que não existe.

### Stack de dados (se aplicável)

- **`supabase`** — se você usa Supabase como banco. Lê tabelas, executa queries em modo read-only.
- **`sentry`** — se você usa Sentry pra erros em produção. Claude lê os erros e propõe correção.

### Fornecedores BR (presets em `templates/.mcp.json.examples/`)

- **`asaas-mcp`** — cobrança Pix, boleto, cartão. Use sandbox antes de produção.
- **`focusnfe-mcp`** — emissão NF-e/NFC-e/NFS-e/CT-e/MDF-e. Comece em homologação (FISCAL-003).
- **`omie-mcp`** — ERP completo (cadastros, pedidos, financeiro, NFe via Omie).
- **`@modelcontextprotocol/server-postgres`** com role read-only — queries no banco do projeto (LGPD-004 trilha de acesso obrigatória).

Cada preset é um `.mcp.json` pronto em `templates/.mcp.json.examples/`. Veja README dessa pasta pra instalar.

### Cuidado com

- **`filesystem-mcp`** — redundante. Claude Code já tem Read/Edit/Write/Glob/Grep nativos. Instalar esse só consome contexto.
- **`postgres-mcp`** (comunidade) — tem CVE de SQL injection em 2026. Prefira Supabase MCP ou rodar em modo read-only com `--readonly`.
- **Qualquer MCP de fonte desconhecida** — MCP roda como código, e pode prompt-injectar o Claude. Confie só em fontes oficiais (Anthropic, vendor do produto).

## Como ativar um MCP

### Opção 1 — `.mcp.json` na raiz do projeto (compartilhado)

Crie um arquivo `.mcp.json` na raiz do projeto:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

Use **variável de ambiente** (`${GITHUB_TOKEN}`), nunca cole token direto no arquivo.

Veja `.mcp.json.example` na raiz do projeto pra começar.

### Opção 2 — Comando `/mcp` no Claude Code

Dentro do Claude Code, rode `/mcp` pra ver MCPs disponíveis e ativar interativamente.

### Opção 3 — CLI `claude mcp add`

A doc oficial do Claude Code também permite:

```bash
claude mcp add --transport stdio github npx -y @modelcontextprotocol/server-github
claude mcp add --transport http myremote https://api.exemplo.com.br/mcp
```

Escopos disponíveis:

- **`--scope local`** (default): só sua máquina, sua sessão.
- **`--scope project`**: grava no `.mcp.json` do projeto (versionado, time todo herda).
- **`--scope user`**: grava em `~/.claude.json` (todos seus projetos).

### Transports

Claude Code suporta 3:

- **`stdio`** — padrão. Server roda como processo local (npx, python, binário). Usado em 95% dos casos.
- **`sse`** — Server-Sent Events. Útil pra MCP remoto que precisa empurrar eventos.
- **`http`** — HTTP simples (POST). Pra MCP remoto stateless.

### Resources e prefixo de tool

- Tool de MCP aparece prefixada: `mcp__github__create_issue`, `mcp__asaas__create_charge`.
- Resource referenciado com `@server:protocol://path` — ex.: `@github:repo://owner/name/file/README.md`.
- Quando você adiciona um MCP novo, atualize o allowlist do hook `mcp-validator.sh` se o fornecedor for desconhecido — abra PR.

## Atenção LGPD

Se o MCP enviar dado pessoal (CPF, e-mail, nome) pra serviço estrangeiro:
- Documentar base legal (LGPD-001).
- Documentar transferência internacional (LGPD-005).
- Preferir MCPs com servidor BR ou self-hosted.

## Quer ajuda escolhendo?

No Claude Code, peça: "Use o subagente `tech-lead` pra recomendar MCPs pro meu stack: [descreva seu projeto]".

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
