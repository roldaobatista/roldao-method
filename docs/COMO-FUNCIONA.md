---
owner: framework
revisado-em: 2026-05-17
status: stable
---

# Como funciona — fluxos e estrutura

Documento operacional do framework. Para entender pelo exemplo, leia `EXEMPLO-FEATURE-COMPLETA.md`. Para troubleshooting, `TROUBLESHOOTING.md`.

## Estrutura instalada

```
seu-projeto/
├── AGENTS.md                      <- contrato canônico (você customiza)
├── CLAUDE.md                      <- adendo do Claude Code (importa @AGENTS.md)
├── REGRAS-INEGOCIAVEIS.md         <- regras com IDs rastreáveis
├── .claude/
│   ├── settings.json              <- permissões + hooks (versionado)
│   ├── settings.local.json        <- pessoal (não versionar)
│   ├── agents/                    <- 11 especialistas
│   ├── hooks/                     <- 6 hooks bloqueadores + 5 auxiliares
│   ├── commands/                  <- 11 workflows
│   ├── skills/                    <- 6 skills BR
│   ├── output-styles/
│   └── rules/                     <- regras com paths: (criar quando precisar)
├── .specify/
│   ├── memory/constitution.md     <- manifesto (6 princípios)
│   └── templates/                 <- PRD, story, architecture, decision-log
├── .mcp.json                      <- MCP servers (opcional)
└── docs/                          <- produtos do framework
    ├── prd/                       <- PRD-NNN-slug.md
    ├── stories/                   <- US-NNN-slug.md
    ├── adr/                       <- ADR-NNNN-slug.md
    ├── arquitetura/               <- ARQ-NNN.md
    ├── research/                  <- briefs do analista
    ├── ux/                        <- UX-NNN-slug.md (wireframes ASCII)
    ├── fiscal/                    <- FISC-NNN.md
    └── retros/                    <- AAAA-MM-DD-marco.md
```

## Fluxo dos comandos

### /inicio — projeto novo do zero

```
demanda informal
    ↓
gerente-produto (entende, escreve PRD/story)
    ↓
tech-lead (escolhe stack, escreve ADR-0001, cria ARQ-001)
    ↓
dev-senior (configura projeto, dependências mínimas)
    ↓
AGENTS.md preenchido com stack/comandos
```

### /brownfield — projeto que já existe

```
projeto existente sem doc
    ↓
investigador (varre código, banco, testes)
    ↓
tech-lead (gera ARQ-001 a partir do encontrado)
    ↓
gerente-produto (preenche AGENTS.md com inferências)
    ↓
auditor-seguranca (sweep inicial — secrets, CVEs)
    ↓
você confirma campos "inferido — confirmar"
```

### /prd — iniciativa grande (vários meses)

```
demanda exploratória
    ↓
analista modo brief (mercado, concorrentes, regulamentação BR)
    ↓
gerente-produto modo PRD (PRD-NNN em docs/prd/)
    ↓
tech-lead (ADRs bloqueantes + atualiza ARQ-001)
    ↓
ux-designer (se toca interface)
    ↓
gerente-produto modo decomposição (gera US-NNN filhas)
    ↓
arquivos skeleton em docs/stories/
```

### /epico — decompor coisa grande em stories

```
descrição de epic
    ↓
analista modo brief (opcional)
    ↓
gerente-produto modo PRD + modo decomposição
    ↓
tabela de stories com dependências
    ↓
arquivos skeleton em docs/stories/
```

### /historia — criar 1 story em disco

```
descrição informal
    ↓
gerente-produto modo C (preenche template story.md)
    ↓
investigador (preenche contexto técnico)
    ↓
docs/stories/US-NNN-slug.md persistido
```

### /feature — implementar funcionalidade

```
US-NNN (ou descrição informal → gera US)
    ↓
gerente-produto (estrutura/confirma US)
    ↓
investigador (lê código relacionado)
    ↓
tech-lead (se exige ADR novo)
    ↓
dev-senior (TDD onde aplicável; código + testes)
    ↓
revisor (aderência à US + anti-padrões)
    ↓
auditores em paralelo (segurança + qualidade + produto)
    ↓
"FEATURE ENTREGUE"
```

### /bug — corrigir comportamento (REGRA #0)

```
sintoma reportado
    ↓
investigador OBRIGATÓRIO
    ↓ (lê banco, log, payload, código)
relatório com causa raiz
    ↓
dev-senior (corrige no ponto raiz, não no sintoma)
    ↓
revisor
    ↓
"BUG RESOLVIDO"
```

### /refactor — reorganizar sem mudar comportamento

```
descrição da área
    ↓
tech-lead (decide se vale e como)
    ↓
dev-senior (refactor + testes existentes continuam verdes)
    ↓
revisor (confirma que comportamento não mudou)
```

### /qa — testes de uma área

```
área alvo
    ↓
investigador (mapa de testes existentes)
    ↓
auditor-qualidade (parecer de cobertura)
    ↓
dev-senior (escreve testes faltantes priorizados)
    ↓
revisor
```

### /auditoria — passar pelos 3 auditores

```
escopo (release / módulo / branch)
    ↓
auditor-seguranca + auditor-qualidade + auditor-produto (paralelo)
    ↓
relatório consolidado
```

### /retro — retrospectiva pós-marco

```
marco (release/sprint)
    ↓
levantar contexto (git log, stories entregues, ADRs)
    ↓
4L (liked/learned/lacked/longed for)
    ↓
ações com dono
    ↓
docs/retros/AAAA-MM-DD.md + atualiza AGENTS.md §10
```

## Os 11 agentes

| Agente | Papel | Modelo |
|---|---|---|
| `analista` | Pesquisa de mercado, brief, PRFAQ, regulamentação | haiku |
| `gerente-produto` | PRD, story, decomposição (4 modos) | haiku |
| `ux-designer` | Wireframe ASCII, estados, mensagens PT-BR | haiku |
| `tech-lead` | Arquitetura, ADR, ARQ, readiness check | sonnet |
| `investigador` | Lê estado real antes de mudar (REGRA #0) | sonnet |
| `dev-senior` | Implementa com TDD onde aplicável | sonnet |
| `revisor` | Aderência à US, anti-padrões | sonnet |
| `auditor-seguranca` | LGPD, secrets, OWASP | sonnet |
| `auditor-qualidade` | Cobertura, mocks indevidos, TST-* | sonnet |
| `auditor-produto` | Aderência ao pedido, non-goals | haiku |
| `fiscal-br` | NF-e, certificado, eSocial, reforma tributária | sonnet |

## Os 6 hooks bloqueadores

| Hook | Quando dispara | O que barra |
|---|---|---|
| `block-destructive` | PreToolUse Bash | `rm -rf`, `git push --force`, `DROP TABLE`, `curl | bash`, `--no-verify` |
| `secrets-scanner` | PreToolUse Write/Edit | `.env`, chaves, PEMs, tokens (AWS, OpenAI, Anthropic, GitHub, Slack) |
| `anti-mascaramento` | PreToolUse Write/Edit | `@ts-ignore`, `.skip`, `assertTrue(true)`, `|| true` (sem exceção) |
| `block-mock-in-integration` | PreToolUse Write/Edit | mock em arquivo de integration/e2e |
| `block-todo-without-issue` | PreToolUse Write/Edit | `TODO`/`FIXME` sem ID rastreável |
| `commit-message-validator` | PreToolUse Bash | commit misturando prefixos OU primeira linha > 72 chars |
| `no-amend-after-push` | PreToolUse Bash | `git commit --amend` em commit já pushado |

## Os 5 hooks auxiliares (avisam, não bloqueiam)

| Hook | Quando | O que faz |
|---|---|---|
| `context-budget` | SessionStart | avisa se AGENTS.md > 200 linhas ou CLAUDE.md > 150 |
| `mcp-validator` | SessionStart | avisa sobre MCP server fora da allowlist conservadora |
| `regra-zero-reminder` | UserPromptSubmit | injeta lembrete da REGRA #0 quando detecta gatilho de bug |
| `paths-frontmatter-validator` | PreToolUse Write/Edit | exige frontmatter em docs/*.md |
| `_test-runner` | manual | roda 35 casos contra os hooks |

## Os 6 skills BR

| Skill | Função |
|---|---|
| `gerar-adr-pt-br` | Cria ADR-NNNN-slug.md a partir do template |
| `traduzir-jargao` | Traduz texto técnico pra PT-BR sem jargão |
| `validar-cpf-cnpj` | Valida CPF e CNPJ numérico + alfanumérico (jul/2026) |
| `validar-pix` | Valida chave Pix + EndToEndId + TxId |
| `validar-cep` | Valida CEP (formato + opcional ViaCEP) |
| `checklist-lgpd` | Aplica árvore de decisão de base legal + 10 checks |

## A regra mestre

> **Regra crítica vira hook, não só doc.**

Doc explica o quê e o porquê. Hook impede o agente de fazer o errado. Os dois são complementares: REGRAS-INEGOCIAVEIS.md tem os IDs, settings.json registra os hooks que os fazem cumprir.
