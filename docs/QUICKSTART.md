# Quickstart — ROLDAO-METHOD

5 minutos do zero ao primeiro `/feature`.

## 1. Instale

Na raiz do seu projeto:

```bash
npx roldao-method install
```

Confirme com `s`. O comando vai copiar:

- `AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md` — documentos-contrato
- `.specify/memory/constitution.md` — 6 princípios universais
- `.agent/CURRENT.md` — estado da sessão
- `.claude/agents/` — 8 especialistas virtuais
- `.claude/hooks/` — 5 regras automáticas (segurança/qualidade) + 1 runner de testes
- `.claude/commands/` — 5 workflows (`/inicio`, `/feature`, `/bug`, `/refactor`, `/auditoria`)
- `.claude/output-styles/pt-br-conciso.md` — estilo de resposta PT-BR
- `.claude/settings.json` — permissões + hooks registrados

## 2. Personalize

Abra `AGENTS.md` e preencha os campos `_(preencher)_`:

- Identidade do projeto (nome, escopo, cliente).
- Stack (backend, banco, frontend, etc.).
- Comandos (setup, subir, testar, etc.).

Esse arquivo é a **fonte da verdade** que todo agente lê primeiro. Bem preenchido = agente alinhado.

## 3. Valide os hooks

```bash
bash .claude/hooks/_test-runner.sh
```

Deve mostrar `Total: 15  |  OK: 15  |  FAIL: 0`. Se falhar, abra issue.

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
| `/inicio` | Começar um projeto novo |
| `/feature <descrição>` | Implementar funcionalidade nova |
| `/bug <descrição>` | Corrigir comportamento errado (investigador obrigatório) |
| `/refactor <descrição>` | Reorganizar sem mudar comportamento |
| `/auditoria <escopo>` | Rodar os 3 auditores (segurança, qualidade, produto) |

## 6. Use no ChatGPT / Claude.ai (chat web)

Cole o conteúdo de `AGENTS.md` + o agente que você quer usar (`.claude/agents/<nome>.md`) como **system prompt**. Em seguida, descreva sua demanda normalmente.

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

---

**Tem dúvida?** Abra issue em https://github.com/roldaobatista/roldao-method/issues
