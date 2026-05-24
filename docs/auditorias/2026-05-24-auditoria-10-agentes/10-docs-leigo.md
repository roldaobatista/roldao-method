---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: docs-leigo
nota: 7.5/10
---

# Auditoria Docs pra Leigo — 2026-05-24

## Resumo executivo
**Nota 7,5/10.** A doc avançou muito na v1.0.3 (GLOSSARIO, PARA-DONO-DE-PRODUTO, README com pitch leigo). **Melhor doc:** `docs/PARA-DONO-DE-PRODUTO.md` — narrativa "os 5 momentos que você vai viver" é exatamente o que o dono precisa. **Pior doc pro leigo:** `docs/PLAN-MODE-E-SESSOES.md` — promete ser pra leigo mas mergulha em `git worktree`, `SESSION_HASH`, `--from-pr` sem mediação.

## Docs que JÁ servem o leigo (manter)
- **`README.md:3,10-25`** — primeira frase agora sem siglas, bloco `npx roldao-method demo` antes do install. Excelente onboarding 30s.
- **`docs/PARA-DONO-DE-PRODUTO.md`** — tom respeitoso, 5 cenários reais, seção "Quando precisa pedir ajuda humana" (contador/advogado) brilha.
- **`docs/GLOSSARIO.md`** — 3 tabelas (dia-a-dia, framework, mensagens do assistente). Cobre commit/push/CI/migration. Tradução literal e curta.
- **`docs/CASOS-DE-USO-BR.md`** — exemplos concretos ("PME contadora quer emitir NF-e").
- **`docs/releases/v1.0.0.md`** — estrutura "O que mudou / Por que importa / Como aplicar / Atenção" respeitada.

## Docs problemáticas pro leigo (P0)
- **`docs/PLAN-MODE-E-SESSOES.md:80-105`** — promete servir o não-programador mas exige fluência em `git worktree add ../app-US-042 -b feature/US-042`, `SESSION_HASH`, `--from-pr 42`. Citação literal linha 84: *"Os hooks do ROLDAO criam **markers de sessão** em `.claude/.runtime/feature-active-${SESSION_HASH}`."* — Roldão não sabe o que é marker, hash de sessão, nem por que isso importa. **Reescrita:** abrir com bloco "Pra quem não programa: pule pra seção 'Quando o Claude pergunta se pode planejar antes' — o resto é só pro seu dev". Mover worktrees pra `docs/AVANCADO/`.
- **`CHANGELOG.md:5-39` (v1.0.3 e abaixo)** — formato Keep-a-Changelog atrai jargão: *"`bin/install.js` — caixa de versão hardcoded em 52 colunas quebrava com `1.10.0`. `drawBox()` agora calcula largura..."* — leigo lê e desiste. **Reescrita sugerida** pra cada bullet: 1 frase do impacto visível ("Versão `1.10` agora aparece bonita no terminal — antes quebrava a borda") e mover detalhe técnico pra sub-bullet. **Adicionar** seção `### O que muda pra você (não-programador)` no topo de cada release.

## Docs faltando que o leigo precisa (P1)
- **`docs/PRIMEIRO-DIA.md`** — manual "instalei, e agora?" com transcrição literal do primeiro `/inicio`. QUICKSTART tem viés de dev. Linkar do README acima do bloco "Instalação".
- **`docs/COMO-PEDIR-AJUDA.md`** — Roldão precisa saber: "Abriu issue, e agora?", "Quanto tempo demora?", "Como reportar bug sem stack trace?".
- **`docs/SEU-DEV-PRECISA-LER-ISSO.md`** — onboarding curto pra quando Roldão contratar dev. Hoje ele teria que mandar o cara ler 67 docs.

## Links quebrados ou docs órfãs (P1)
- **`docs/PARA-DONO-DE-PRODUTO.md` é doc órfã do contrato.** `CLAUDE.md` referencia "`docs/PARA-DONO.md`" (sem `-DE-PRODUTO`) em "templates/CLAUDE.md.example" — apenas `README.md:25` linka pro nome real. `docs/README.md` (índice) **não lista** `PARA-DONO-DE-PRODUTO.md` nem `GLOSSARIO.md`. **Fix:** adicionar ambos no topo do `docs/README.md` na seção "🚀 Começando".
- **`docs/REGRESSIONS.md:8`** menciona `_test-runner.sh` como se ativo — a v1.0 deletou. Doc desatualizada apesar do `revisado-em: 2026-05-20`.
- **`docs/EXTENDENDO/README.md`** é shard quase vazio (só frontmatter + título) — sombra de `docs/EXTENDENDO.md`. Decidir: deletar o shard ou popular.

## CHANGELOG / release notes ruins (P1)
- **`CHANGELOG.md:32`** (v1.0.3 Corrigido): *"`templates/.claude/hooks/no-amend-after-push.js` — fail-closed quando `git` ausente no PATH..."* — 4 jargões em 1 frase (fail-closed, PATH, amend, commit publicado). **Reescrita:** *"Proteção contra reescrever versão já enviada agora funciona mesmo quando o sistema não acha o `git`. Antes, em máquinas sem `git` no caminho, a proteção falhava em silêncio."*
- **`CHANGELOG.md:20`** (v1.0.3): *"GATE 2 em `require-investigador-before-fix.js` — quando `bug-active` ativo, além do marker `investigator-invoked`, exige também `.claude/.runtime/investigation-*.json` com prova mecânica..."* — incompreensível. **Reescrita:** *"REGRA #0 (investigar antes de consertar) ficou mais rigorosa: o assistente precisa deixar evidência escrita do que leu (banco/log), não basta dizer que investigou."*
- Releases v0.15.3..v0.20.0 sem seção "Preservado" — `v1.0.0` em diante tem. Padronizar.

## Frontmatter ausente ou desatualizado (P2)
- **`README.md`, `CHANGELOG.md`, `AGENTS.md`, `REGRAS-INEGOCIAVEIS.md`** — raiz, sem frontmatter. Aceitável (raiz é canônica), mas seria útil `revisado-em` no README pra leigo saber se está atualizado.
- **`docs/REGRESSIONS.md`** `revisado-em: 2026-05-20` mas conteúdo descreve infra deletada na v1.0.0-rc1 (2026-05-23). **Atualizar ou marcar `status: deprecated`.**
- **`docs/EXTENDENDO/README.md`** sem `owner`/conteúdo — frontmatter existe mas o doc é vazio.
- **`docs/PLAN-MODE-E-SESSOES.md:1-5`** — `owner: framework` está ok, mas falta um campo "público-alvo: dev" porque está vendido como leigo.

## Veredito
**Roldão consegue se virar SOZINHO em 80% dos casos** lendo `README` + `PARA-DONO-DE-PRODUTO` + `GLOSSARIO` + `/help`. Os 20% restantes (plan mode, worktrees, troubleshooting de install no Windows, CHANGELOG técnico) ele ainda precisaria de tradução. A v1.0.3 fechou o gap crítico de onboarding leigo; falta só (a) tornar `PARA-DONO` visível no `docs/README.md`, (b) reescrever CHANGELOG com bullet de impacto, e (c) marcar `PLAN-MODE-E-SESSOES` como conteúdo de dev. Sem programador como interlocutor permanente, ele consegue rodar o framework — não consegue ainda **debuggar** o framework, mas isso é razoável.
