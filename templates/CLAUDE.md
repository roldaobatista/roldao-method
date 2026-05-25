# Contrato Claude Code — projeto

@AGENTS.md
@REGRAS-INEGOCIAVEIS.md
@.claude/rules/roldao-method.md

> **Não programa?** Este arquivo é pro **assistente de IA Claude Code** ler. Pra entender o que o framework faz pra você, leia [`docs/PARA-DONO-DE-PRODUTO.md`](docs/PARA-DONO-DE-PRODUTO.md).
>
> Adendo do harness Claude Code. Conteúdo do produto/arquitetura está em `AGENTS.md`; regras com ID rastreável em `REGRAS-INEGOCIAVEIS.md`; tabela hook→regra em `.claude/rules/roldao-method.md`. Os 3 são carregados automaticamente via `@import`.
>
> Pessoal (não versionar): `CLAUDE.local.md` (copiar de [`templates/CLAUDE.local.md.example`](templates/CLAUDE.local.md.example)).

---

## Idioma

Comunicar em **Português (Brasil)**. Tabela de tradução PT-BR canônica em `AGENTS.md §8` e no `~/.claude/CLAUDE.md` global.

## Regras de conduta

- Perfil do usuário, pró-atividade, "executar não passar pro usuário" (INV-AGENT-006): canônicos em `REGRAS-INEGOCIAVEIS.md` (seção INV-AGENT) e `AGENTS.md`.
- **REGRA #0** — investigar antes de mexer em lógica de negócio: canônica em `REGRAS-INEGOCIAVEIS.md` (INV-006). Codificada nos hooks `require-investigador-before-fix.js` e `regra-zero-reminder.js`.
- Causa raiz, commits atômicos, perguntar antes de destruir: ver REGRAS (INV-006, SEC-002, TST-001/002).

---

## Estrutura `.claude/`

```
.claude/
├── settings.json          ← permissões + hooks + outputStyle + statusLine (versionado)
├── settings.local.json    ← pessoal (NÃO versionar)
├── statusline.js          ← status line PT-BR (versão, modelo, branch, agente)
├── agents/                ← 17 especialistas (+ MAPA-VISUAL.md + PERSONAS.md = 19 arquivos)
├── hooks/                 ← bloqueadores + auxiliares + lifecycle (PostToolUse, SubagentStop, PreCompact, SessionEnd)
├── output-styles/         ← pt-br-conciso, dpo-lgpd, fiscal-br
├── commands/              ← 28 slash commands (com `allowed-tools`)
├── skills/                ← 19 skills BR no core (criar quando padrão repetir 3x)
└── rules/                 ← com `paths:` frontmatter (lazy load)
```

## Plan mode, sessões e worktrees

- **Plan mode (`Shift+Tab`):** Claude planeja sem tocar disco. Use antes de feature grande ou bug com causa ambígua. Detalhes em `docs/PLAN-MODE-E-SESSOES.md`.
- **Continuar sessão:** `claude --continue` (última) ou `claude --resume` (escolher). Marker `feature-active-*` é preservado entre sessões.
- **Worktrees paralelos:** uma story por worktree pra evitar conflito de marker. Ver `docs/PLAN-MODE-E-SESSOES.md` pra fluxo recomendado.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
