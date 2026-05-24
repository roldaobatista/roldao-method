---
owner: tech-writer
revisado-em: 2026-05-24
status: stable
publico-alvo: desenvolvedor-contratado-pelo-dono
---

# Seu desenvolvedor precisa ler isso

> **Pra quem é este documento:** desenvolvedor profissional contratado pelo dono do produto (Roldão) que vai dar manutenção, adicionar features ou diagnosticar o framework. Se você é dono do produto e não programa, este doc **não é pra você** — pega o link, manda pro seu dev e pula pro [`PARA-DONO-DE-PRODUTO.md`](PARA-DONO-DE-PRODUTO.md).

---

## Em 5 minutos — o que esse framework é

ROLDAO-METHOD é um **harness opinativo pra Claude Code** (e adaptadores pra Cursor/Cline/Aider/Continue) que codifica fluxo agentic em PT-BR pro mercado BR.

3 vantagens reais:
1. **Hooks bloqueadores em Node puro** (zero deps, roda em Windows sem Git Bash). 26 hooks no core fazem `exit 2` ou `decision:block` quando o agente tenta operação perigosa (`rm -rf`, secret no commit, teste mascarado, jargão técnico com leigo, bug "consertado" sem investigar banco/log).
2. **Spec-driven com IDs rastreáveis** (`INV-`, `SEC-`, `TST-`, `LGPD-`, `FISCAL-`, `PIX-`, `INV-AGENT-`). Cada commit cita ID; cada PR rastreia até a regra.
3. **15 agentes com persona PT-BR** orquestrados pelo Maestro com markers de etapa em `.claude/.runtime/` (JSON canônico — ADR-020). Pipeline `/feature` fail-closed: sem auditor aprovado (audit_sha bate com diff atual), commit é bloqueado.

## Arquitetura essencial

```
.claude/
├── settings.json     ← permissões + hooks ativos + outputStyle
├── statusline.js     ← status PT-BR (versão, modelo, branch, etapa N/T, agente)
├── agents/           ← 15 especialistas (.md com frontmatter + corpo)
├── hooks/            ← 34 scripts Node (26 bloqueadores + 2 soft + 5 lifecycle + _lib.js)
├── commands/         ← 28 slash commands (workflows)
├── skills/           ← 13 skills BR (validar-cpf-cnpj, gerar-br-code, etc)
└── lib/              ← next-id.js helper (T-301)

docs/
├── prd/              ← PRDs PRD-NNN
├── epicos/           ← Épicos EP-NNN
├── stories/          ← User stories US-NNN
├── decisions/        ← ADRs ADR-NNN
└── readiness/        ← Status de épico (gate pra /feature)

templates/
├── .claude/          ← versão canônica do .claude/ (dogfood instala daqui)
├── AGENTS.md         ← template AGENTS.md do projeto
└── CLAUDE.md         ← template harness Claude Code
```

**Fonte canônica é `templates/`.** O `.claude/` da raiz é regenerado por `npm run dogfood-sync` (ADR-005 — dogfooding).

## Convenções que você precisa respeitar

### 1. Hooks são contrato, não sugestão

- `commit-message-validator.js` exige `T-NNN` em `feat(...)`/`fix(...)`. Sem isso, commit barrado.
- `require-auditors-pass-before-commit.js` exige 3 markers JSON canônicos (ADR-020). Bypass por `touch` foi fechado.
- `block-destructive.js` barra `rm -rf`, `git push --force`, flag de pular validação. Sem exceção em CI.
- Em emergência: setar `ROLDAO_METHOD_LEGACY_MARKERS=1` (ADR-021) aceita markers vazios — válido só de v2.0.0 a v2.1.0.

### 2. Toda mudança não-trivial passa pelo pipeline /feature

```
Sofia (PM) → Detetive (investiga) → Rafael (arquitetura)
    → Bruno (implementa) → Inês (revisa)
    → Caio + Júlia + Pedro (3 auditores paralelos)
    → /checkpoint (walkthrough)
```

Pular etapa = hook bloqueia commit. `/quick-dev` (≤3 arquivos) tem pipeline reduzido (Bruno → Revisor). `/bug` exige `investigation-*.json` em disco (REGRA #0 / INV-006).

### 3. PT-BR é contrato — não estética

Mensagens de erro de hook, docs internas, mensagens de commit: PT-BR. `block-jargon-pt-br.js` é soft-block — tem tabela canônica em `traduzir-jargao` skill. Quando você precisa usar jargão técnico legítimo (ex: documentação Node interna), adicione tradução inline em parênteses.

Acentuação correta é obrigatória. Script `scripts/normalizar-acentos-frontmatter.js` corrige frontmatters automaticamente.

### 4. Spec gera código (INV-002)

Não invente API sem PRD ou US. Sequência:

```
/prd PRD-NNN → /epico EP-NNN → /historia US-NNN → /feature US-NNN
```

Cada arquivo tem frontmatter obrigatório (`owner`, `revisado-em`, `status: draft|stable|deprecated`). Hook `paths-frontmatter-validator.js` barra docs sem frontmatter.

### 5. Non-goals explícitos (INV-003)

Toda spec, ADR, story declara **o que NÃO faz**. Sem non-goals, agente expande indefinidamente. Auditor-produto reprova spec sem non-goals.

## Onde estão as decisões importantes

| Pergunta | Onde está |
|---|---|
| "Por que zero deps runtime?" | ADR-001 |
| "Por que hooks em Node, não bash?" | ADR-012, ADR-013 |
| "Como sobrescrever template sem fork?" | ADR-003, `.specify/overrides/` |
| "Por que Maestro como agente único?" | ADR-011, ADR-019 (multi-modo) |
| "Shape canônico de marker?" | ADR-020 |
| "Política de SemVer + breaking change?" | ADR-016, ADR-021 |
| "Stack do framework?" | `package.json`, `templates/AGENTS.md §2` |
| "Tabela completa de regras?" | `REGRAS-INEGOCIAVEIS.md` |
| "Mapa hook → regra?" | `templates/.claude/rules/roldao-method.md` |
| "Auditoria de qualidade interna?" | `docs/auditorias/AAAA-MM-DD-*` |

## Quando você precisa estender

| Quero criar | Onde + esqueleto |
|---|---|
| Agente novo | `templates/.claude/agents/<nome>.md` — guia em `docs/EXTENDENDO.md` |
| Hook bloqueador | `templates/.claude/hooks/<nome>.js` — use `_lib.js` (`hookPrefix`, `failClosedMessage`, `sanitizeProjdir`) |
| Skill BR | `templates/.claude/skills/<nome>/SKILL.md` + opcionalmente Python |
| Comando workflow | `templates/.claude/commands/<nome>.md` |
| Addon vertical | `addons/<nome>/` — guia em `docs/EXTENDENDO.md` |
| ADR | use o helper `node templates/.claude/lib/next-id.js ADR` pra próximo número |

Quando criar arquivo novo, rode `npm run test:dogfood-sync` pra regenerar `.claude/` raiz.

## Suite de testes (validar antes de PR)

```bash
npm test  # roda TUDO: validar templates, hooks-node-only, lib-contract,
          # install, addons, adapters, agents-commands-statusline,
          # skills, e os novos testes adversariais por hook reescrito
```

Tempo: ~30s. Cada hook reescrito tem teste adversarial dedicado (ex: `test/hooks-auditors-pass.test.js`). Hooks novos exigem teste novo no mesmo commit.

## Workflow ao adicionar feature ao framework

1. `npx roldao-method status` (você está no projeto do framework) → vê estado atual.
2. `/historia` ou `/feature` se a mudança é grande. Se trivial, `/quick-dev`.
3. Implementar + testes adversariais.
4. `npm test` verde.
5. Rodar `node tools/sincronizar-dogfood.js --write` se mexeu em template.
6. Rodar `node tools/sincronizar-claude-md.js --write` se mexeu em CLAUDE.md ou AGENTS.md.
7. Commit citando T-NNN.

## Quando algo não parece funcionar

1. `npx roldao-method doctor` — checa instalação.
2. `ls .claude/.runtime/` — markers de sessão (efêmeros). Hook session-cleanup limpa em SessionEnd, mas se travou no meio, pode precisar limpar manualmente.
3. `cat .claude/.runtime/metrics.jsonl | tail -20` — últimos bloqueios. Cada hook que bloqueou loga aqui.
4. Setar `ROLDAO_METHOD_LEGACY_MARKERS=1` na sessão se está em migração de v1.x.

## Princípios filosóficos que não estão no código

- **Documento é estado compartilhado.** Memória de conversa não conta. Se a decisão não está em arquivo versionado, foi esquecida.
- **Executar, não passar pro usuário** (INV-AGENT-006). Agente decide e reporta. Roldão aprova por sprint, não por ação.
- **Investigar antes de mexer** (REGRA #0 / INV-006). Bug em comportamento = ler banco/log/payload ANTES de editar código.
- **Negócio vence conveniência do agente.** Se a regra atrapalha o agente mas protege o cliente, a regra fica.

## Como você pode contribuir de volta

1. Issues em [github.com/roldaobatista/roldao-method/issues](https://github.com/roldaobatista/roldao-method/issues).
2. PRs sempre com `T-NNN` no commit + testes adversariais.
3. Discord da comunidade (link em `docs/COMO-PEDIR-AJUDA.md`).

---

_Este doc é resumo executivo. Pra fundo: `docs/ARQUITETURA.md`, `docs/COMO-FUNCIONA.md`, `REGRAS-INEGOCIAVEIS.md`, `docs/decisions/`._
