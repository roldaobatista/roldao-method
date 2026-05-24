---
owner: framework
revisado-em: 2026-05-24
status: stable
---

# Quickstart — ROLDAO-METHOD

5 minutos do zero ao primeiro `/feature`.

## 1. Instale

Na raiz do seu projeto:

```bash
npx roldao-method install
```

Confirme com `s`. O comando copia:

- `AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md` — documentos-contrato.
- `.specify/memory/constitution.md` — 6 princípios universais.
- `.specify/templates/` — moldes de PRD, story, architecture, decision-log.
- `.agent/CURRENT.md` — estado da sessão.
- `.claude/agents/` — 15 especialistas (analista, PM, UX, tech-lead, investigador, dev-senior, revisor, 3 auditores, fiscal-BR, tech-writer, DBA/dados, devops-infra).
- `.claude/hooks/` — 26 bloqueadores + 2 soft warnings + 5 lifecycle + 1 utilitário (`_lib.js`) = **34 hooks core** em Node.js puro.
- `.claude/commands/` — 26 workflows.
- `.claude/skills/` — 13 skills BR core (CPF/CNPJ alfanum, chave NF-e, codigo IBGE de municipio, Pix, CEP, IE, boleto, BR Code, LGPD, ADR, traduzir jargão, brainstorming, fixture BR). Addons trazem +16.
- `.claude/output-styles/pt-br-conciso.md`.
- `.claude/settings.json` — permissões + hooks.

Em CI use `--yes`. Para atualizar versão: `npx roldao-method update`. Para diagnosticar: `npx roldao-method doctor`.

## 2. Personalize

Abra `AGENTS.md` e preencha os campos `_(preencher)_`:

- Identidade do projeto (nome, escopo, cliente).
- Stack (backend, banco, frontend, etc.).
- Comandos (setup, subir, testar, etc.).

Esse arquivo é a **fonte da verdade** que todo agente lê primeiro. Bem preenchido = agente alinhado.

**Já tem projeto rodando?** Pule essa etapa e rode `/brownfield` no Claude Code — o investigador preenche por você.

## 3. Valide os hooks

```bash
npm run test:hooks-node-only   # 59 cenários cobrindo os 26 bloqueadores em Node puro
```

Deve terminar com `EXIT:0`. Em alternativa, `npx roldao-method doctor` confere que os 34 hooks estão instalados com permissão de execução. Se falhar, abra issue.

## 4. Output style PT-BR — já ativo

A partir da v0.15.0, o `.claude/settings.json` distribuído pelo `install` **já vem com `"outputStyle": "pt-br-conciso"`**. Não precisa rodar `/output-style` na mão.

Quer trocar (`dpo-lgpd` ou `fiscal-br` pra contexto especializado, ou `default` pra inglês)? Use `/config` ou edite `.claude/settings.local.json`.

## 4.1. Status line PT-BR — também ativa

O `settings.json` aponta pra `.claude/statusline.js` (Node puro desde a v1.0). No rodapé do Claude Code você verá:

```
ROLDAO v0.15.0 | Sonnet 4.6 | main | US-042 | dev-senior
```

(versão framework, modelo ativo, branch, story em foco, último agente que rodou).

## 5. Use no Claude Code

Abra o Claude Code na raiz do projeto. Antes de comandar:

- **Plan mode (`Shift+Tab`)** — revise o plano antes do Claude tocar disco. Detalhes em [`docs/PLAN-MODE-E-SESSOES.md`](PLAN-MODE-E-SESSOES.md).
- **Continuar sessão** — `claude --continue` retoma de onde parou. Snapshot é salvo automaticamente pelo hook `session-snapshot.js`.
- **Várias stories em paralelo** — use `git worktree`, um por story.

### Não sabe por onde começar? Use `/help`.

`/help` lista os 26 comandos com códigos curtos e cenários comuns. Digite `/help FT` pra ver detalhes do `/feature`, `/help BG` pra `/bug`.

### Seu primeiro comando

Se acabou de instalar:

- **Projeto novo do zero:** `/inicio` — Sofia define escopo, Rafael escolhe stack, Bruno monta esqueleto.
- **Projeto que já existe:** `/brownfield` — Detetive lê código, Rafael gera ARQ-001, Sofia preenche `AGENTS.md`.
- **Já tem AGENTS.md e quer codar a primeira feature:** `/historia "<descrição em 1 frase>"` cria US-001 em disco. Depois `/feature US-001`.

Digite um dos comandos:

| Comando | Quando |
|---|---|
| `/inicio` | Começar projeto novo |
| `/brownfield` | Adotar em projeto que já existe |
| `/prd <descrição>` | Iniciativa grande (várias semanas) |
| `/epico <descrição>` | Decompor coisa grande em stories |
| `/historia <descrição>` | Criar 1 user story em disco |
| `/feature <descrição>` | Implementar funcionalidade nova |
| `/bug <descrição>` | Corrigir comportamento (investigador obrigatório) |
| `/refactor <descrição>` | Reorganizar sem mudar comportamento |
| `/qa <área>` | Gerar/auditar testes |
| `/auditoria <escopo>` | Rodar os 3 auditores |
| `/retro <marco>` | Retrospectiva pós-marco |

## 6. Use no Cursor / Windsurf / ChatGPT

- **Cursor / Windsurf:** lê `AGENTS.md` e `CLAUDE.md` automaticamente. Hooks não rodam (limitação do harness).
- **ChatGPT / Claude.ai web:** cole conteúdo de `AGENTS.md` + agente desejado (`.claude/agents/<nome>.md`) como system prompt.

Exemplo:
```
<conteúdo de AGENTS.md>

<conteúdo de .claude/agents/investigador.md>

---

Reportei um bug: ao salvar pedido com valor zero, o sistema aceita.
```

## 7. Addons (extender pra domínios específicos)

O core entrega 15 agentes + 13 skills BR. Pra domínios profundos, instale addons:

```bash
npx roldao-method search        # listar addons disponíveis
npx roldao-method add fintech-br # instalar addon (ex: Pix, Open Finance)
```

Addons disponíveis hoje: `fintech-br` (Pix + Open Finance), `fiscal-br-completo` (NF-e, NFC-e, SAT), `electron-br` (SQLite seguro, balança/impressora), `lgpd-compliance`, `esocial-completo`, `varejo-pdv-br`.

## 8. Opcionais

Três extras que o `install` não copia automaticamente — só ative se for usar:

- **Preferências pessoais (não versionar):** copie `templates/CLAUDE.local.md.example` → `CLAUDE.local.md` na raiz. Use para apelido, modelo preferido, atalhos pessoais. O `.gitignore` já ignora.
- **MCP preset BR (servidores externos):** copie um dos arquivos em `.mcp.json.examples/` → `.mcp.json`. Os presets cobrem cenários típicos (fiscal, pagamento, dados públicos BR). Reinicie o Claude Code depois.
- **GitHub Action de code review:** copie `templates/.github/workflows/claude-review.yml` → `.github/workflows/claude-review.yml` e configure o secret `ANTHROPIC_API_KEY` no repositório. Roda Claude em cada PR.

## 9. Próximos passos

- Leia `REGRAS-INEGOCIAVEIS.md` e ajuste regras específicas do seu projeto.
- Mantenha `.agent/CURRENT.md` atualizado entre sessões.
- Quando padrão repetir 3 vezes, considere criar uma skill em `.claude/skills/`.
- Para casos BR reais (NF-e, Pix, telemedicina, eSocial), ver `docs/CASOS-DE-USO-BR.md`.
- Para um exemplo completo do `/feature` ponta-a-ponta, ver `docs/EXEMPLO-FEATURE-COMPLETA.md`.

---

**Tem dúvida?** Veja `docs/FAQ.md` e `docs/TROUBLESHOOTING.md`. Ainda não resolveu? Abra issue em https://github.com/roldaobatista/roldao-method/issues.
