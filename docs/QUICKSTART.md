---
owner: framework
revisado-em: 2026-05-18
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
- `.claude/agents/` — 11 especialistas (analista, PM, UX, tech-lead, investigador, dev-senior, revisor, 3 auditores, fiscal-BR).
- `.claude/hooks/` — 7 bloqueadores + 5 auxiliares.
- `.claude/commands/` — 11 workflows.
- `.claude/skills/` — 6 skills BR (CPF/CNPJ alfanum, Pix, CEP, LGPD, ADR, traduzir jargão).
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
bash .claude/hooks/_test-runner.sh
```

Deve mostrar `Total: 124  |  OK: 124  |  FAIL: 0`. Se falhar, abra issue.

## 4. Ative o estilo PT-BR conciso

O output style **não ativa sozinho**. No Claude Code, rode:

```
/output-style
```

E escolha `pt-br-conciso`. Alternativa: edite `.claude/settings.local.json` adicionando `"outputStyle": "pt-br-conciso"`.

Sem isso, o framework está instalado mas o Claude continua respondendo no estilo padrão (geralmente em inglês).

## 5. Use no Claude Code

Abra o Claude Code na raiz do projeto e digite um dos comandos:

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

## 7. Próximos passos

- Leia `REGRAS-INEGOCIAVEIS.md` e ajuste regras específicas do seu projeto.
- Mantenha `.agent/CURRENT.md` atualizado entre sessões.
- Quando padrão repetir 3 vezes, considere criar uma skill em `.claude/skills/`.
- Para casos BR reais (NF-e, Pix, telemedicina, eSocial), ver `docs/CASOS-DE-USO-BR.md`.

---

**Tem dúvida?** Veja `docs/FAQ.md` e `docs/TROUBLESHOOTING.md`. Ainda não resolveu? Abra issue em https://github.com/roldaobatista/roldao-method/issues.
