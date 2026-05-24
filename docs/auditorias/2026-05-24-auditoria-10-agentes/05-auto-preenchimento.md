---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: auto-preenchimento
nota: 5/10
---

# Auditoria Auto-Preenchimento — 2026-05-24

## Resumo executivo
**Nota: 5/10.** O framework tem boas inferências em poucos pontos (brownfield varre stack; gerente-produto "resolve sozinho" assume premissas; dev-senior tem skills de validação BR no frontmatter), mas **falha grave nos templates** (15+ `_(preencher)_` literais sem botão de ajuda), **em IDs rastreáveis** (sem helper que conta o próximo `US-NNN`/`T-NNN`/`ADR-NNNN`), e **na sugestão proativa de addon** (zero gatilho ao detectar "NFe"/"Pix"/"LGPD" no projeto).

## Inferências que JÁ acontecem (manter)
- `/brownfield` varre `package.json`, `requirements.txt`, `pom.xml`, `go.mod`, `Cargo.toml`, prisma/migrations, Docker/workflows pra detectar stack — `brownfield.md:18-29`. Bem feito.
- `gerente-produto` tem regra explícita "**resolva sozinho na maioria dos casos** — assume premissas razoáveis e documenta em `premissas:` no frontmatter" — `gerente-produto.md:66-76`.
- `dev-senior` declara `skills: [validar-cpf-cnpj, validar-pix, validar-cep, validar-boleto, gerar-test-fixture-br]` no frontmatter — então o agente sabe que essas skills existem para invocar.
- `/clarificar` instrui usar **AskUserQuestion com 2-4 opções concretas e mutuamente exclusivas** + "sempre inclua o default recomendado como primeira opção". Padrão correto, mas só é seguido em 6 arquivos.

## Perguntas evitáveis (P0 — agente deveria inferir)
- **`/inicio` Etapa 4** ("Preencher os campos `_(preencher)_` em AGENTS.md") — manda preencher mas **não invoca brownfield-style detection nem auto-preenche §6 a partir do que `dev-senior` acabou de criar no esqueleto**. Stack acabou de ser decidida no Etapa 2, comandos foram criados no Etapa 3 — Etapa 4 só precisa ler `package.json` e colar na tabela. Hoje empurra esse trabalho braçal pro Roldão.
- **Slug + número de US/ADR/T** — `historia.md:14-21` manda "liste `docs/stories/` e identifique o maior `US-NNN`". Devia ser um helper único (`.claude/lib/next-id.js`) chamado por todos os workflows. Hoje cada workflow reimplementa.
- **Frontmatter `revisado-em: AAAA-MM-DD`** — `.specify/templates/story.md:11`, `decision-log.md:7`, `prd.md`, `epico.md` — placeholder literal `AAAA-MM-DD`. Agente deveria substituir por `new Date().toISOString().slice(0,10)` ao escrever. Hoje fica no doc se ele esquecer, e `paths-frontmatter-validator.js` aceita (não valida o valor).
- **`/bug` Etapa 2** — `investigador.md:96` já documenta `pendencias[]`. Falta o pipeline ler `pendencias.length > 0` e disparar `AskUserQuestion` **automático**.

## Placeholders sem ajuda (P1)
- `templates/AGENTS.md:13-31, 132-138` — 12× `_(preencher)_` em **identidade + stack + comandos**. Sem menu, sem default, sem detecção. Sugestão: na primeira execução pós-install, rodar mini-scan (`package.json`/`pyproject.toml`/`Dockerfile`/`vercel.json`) e pre-preencher com `(detectado: <valor>)`.
- `.specify/templates/story.md:9, 21, 27, 39-77` — `owner`, "título curto", `(persona)`, `(ação concreta)` — `gerente-produto` em Modo STORY preenche, mas o template não traz **exemplos in-line**.
- `templates/CLAUDE.local.md.example:7-27` — 13 placeholders sem detecção. Pelo menos `OS` (`process.platform`), `git user.email`, branch atual são triviais de auto-preencher.

## Defaults faltando (P1)
- **"Rodar testes antes de commit?"** — repetido em `dev-senior`, `revisor`, `auditor-qualidade`. Deveria ser PostToolUse hook que roda `npm test` automaticamente após Edit em `**/*.test.*` — Roldão configura uma vez em settings.json (`autoRunTestsOnCodeChange: true`).
- **Pipeline `/feature` reuso** — `enforce-pipeline-completion.js` exige todos os 7 passos, mas não há default "pula a etapa X se o repo já tem evidência de Y". Ex: se já existe ADR-NNN cobrindo o tema, `tech-lead` deveria reconhecer e pular ao invés de gerar ADR duplicado.
- **`owner` no frontmatter** — sempre `Roldão Batista` (lido de `git config user.name`). Hoje pede a cada doc.

## Skills/addons que poderiam ser auto-sugeridos (P2)
- **Detectar termos no projeto e sugerir addon** — nenhum hook faz isso. Sugestão: hook `SessionStart` que `grep -ri "nfe\|nfse\|sped\|sefaz" --include="*.{js,ts,py,md}" -l | head -1` → se achou e `fiscal-br-completo` não está instalado → soft message "detectei termos fiscais; rodar `npx roldao-method add fiscal-br-completo`?". Mesma lógica pra `pix|endtoendid|psp` → `fintech-br`; `dado pessoal|titular|anpd` → `lgpd-compliance`.
- **Auto-invocar `validar-cpf-cnpj` em payload de teste** — `dev-senior` lista a skill, mas nenhum hook detecta input parecido com CPF/CNPJ e força validação.
- **Auto-invocar `gerar-test-fixture-br` quando criar fixture** — mesma lógica.

## Veredito
Hoje **Roldão preenche ~60% sozinho, framework preenche ~40%**. O salto fácil pra inverter (80/20 a favor do framework) é: (1) helper `next-id.js` único, (2) auto-data ISO no frontmatter ao escrever, (3) `/inicio` Etapa 4 chamar a varredura do brownfield em vez de só "manda preencher", (4) hook `SessionStart` que detecta termos BR e sugere addon, (5) injetar exemplos in-line nos templates ao invés de só `_(preencher)_`. Os 5 são código de < 1 dia cada e atacam o gargalo central: o framework já SABE muita coisa (brownfield, skills, gerente-produto que assume premissas) mas **não conecta esses pedaços**.
