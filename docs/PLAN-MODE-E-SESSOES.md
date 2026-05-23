---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Plan mode, sessões e worktrees no Claude Code

Guia em PT-BR pra recursos nativos do Claude Code que multiplicam produtividade — especialmente útil para quem **não programa** e precisa entender antes de aprovar.

## Plan mode — revise antes do Claude tocar nada

### Quando usar

- Feature grande (muitos arquivos, várias decisões).
- Bug com causa ambígua (várias hipóteses).
- Migration de banco / mudança em produção.
- Sempre que você quer **ler o plano antes** de o Claude começar a editar.

### Como ativar

Dentro de uma sessão Claude Code, aperte **`Shift + Tab`** (alterna entre modo normal e plan mode). O indicador muda no canto da tela.

Em modo plan:

- Claude **não escreve em disco**. Só lê e planeja.
- Ao terminar de planejar, mostra o plano pra você aprovar.
- Você aprova: Claude sai do plan mode e executa.
- Você rejeita: Claude refaz o plano até você concordar.

### Quando NÃO usar

- Tarefa trivial (mudar uma label, ajustar cor).
- Bug em comportamento existente — use `/bug` direto (já tem investigador obrigatório).
- Você já sabe exatamente o que quer.

### Via CLI

```bash
claude --permission-mode plan
```

Inicia sessão já em plan mode.

## Continuar sessão anterior

### `--continue`

Retoma a **última** sessão do diretório atual:

```bash
claude --continue
```

Útil quando: trabalhou ontem, fechou laptop, hoje retoma de onde parou. O snapshot gerado pelos hooks `SessionEnd` (`session-snapshot.sh`) é lido pelo `SessionStart` e Claude já abre sabendo o estado.

### `--resume`

Lista sessões anteriores e deixa escolher:

```bash
claude --resume
```

Útil quando: tem várias frentes paralelas e quer voltar pra uma específica.

### `--from-pr` (modo PR)

Abre Claude já contextualizado com PR específico:

```bash
claude --from-pr 42
```

Útil quando: alguém te chama pra revisar PR e você quer Claude já carregado.

## Worktrees — várias stories em paralelo sem conflito

### O problema

Os hooks do ROLDAO criam **markers de sessão** em `.claude/.runtime/feature-active-${SESSION_HASH}`. Se você rodar 2 sessões Claude no mesmo diretório, ao mesmo tempo, em stories diferentes, os markers competem e o gate trava.

### A solução

**`git worktree`** cria um diretório paralelo apontando pra mesma repo, mas em branch diferente:

```bash
# Você está em ~/projetos/app (main)
cd ~/projetos/app
git worktree add ../app-US-042 -b feature/US-042
cd ../app-US-042
claude   # sessão isolada, markers próprios em .claude/.runtime/
```

Resultado: 2 sessões Claude em paralelo, cada uma com sua story, sem competição de marker.

### Limpeza

Após mergear:

```bash
cd ~/projetos/app
git worktree remove ../app-US-042
git branch -d feature/US-042
```

### Quando vale a pena

- Épico com 3+ stories independentes.
- Você precisa rodar tests demorados numa story enquanto codifica outra.
- Story A bloqueada esperando feedback do cliente — não bloqueie story B.

### Quando NÃO vale

- Single story por sprint — overhead desnecessário.
- Time pequeno (1 dev) com foco profundo numa story.

## IDE integration

Claude Code tem extensões/integrações pra:

- **VS Code** — `claude-code` no marketplace.
- **JetBrains** (IntelliJ, PyCharm, WebStorm, GoLand) — plugin oficial.
- **Cursor**, **Windsurf**, **Cline**, **Roo**, **Aider**, **Continue** — usam o mesmo contrato `.claude/` do ROLDAO-METHOD via adapters.

Todos leem `CLAUDE.md` + `AGENTS.md` + `.claude/agents/` do projeto.

## Atalhos úteis no terminal Claude Code

| Atalho | O que faz |
|---|---|
| `Shift+Tab` | Liga/desliga plan mode |
| `Esc` | Cancela operação em curso |
| `!comando` | Executa shell direto na sessão (resultado fica no contexto) |
| `@arquivo.md` | Insere arquivo no contexto |
| `Ctrl+C` 2x | Sai da sessão |
| `/help` | Catálogo dos workflows ROLDAO-METHOD |
| `/mcp` | Lista MCPs ativos |
| `/agents` | Lista subagentes disponíveis |
| `/config` | Ajusta tema, modelo, output style |

## Referências

- [Doc oficial — overview](https://docs.claude.com/en/docs/claude-code/overview)
- [Doc oficial — common workflows](https://docs.claude.com/en/docs/claude-code/common-workflows)
- [Doc oficial — SDK headless](https://docs.claude.com/en/docs/claude-code/sdk)

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
