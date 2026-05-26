---
tipo: story
id: US-126
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: M
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-122, US-125]
aprovacoes: []
---

# US-126 — Onda 10: Hardening de testes + canary release + mutation testing

## Como, quero, para

**Como** Roldao publicando v3.0.0 e mantenedor de addons que dependem do core,
**quero** ter prova de que os hooks bloqueiam o que deveriam E nao bloqueiam o que nao deveriam
**para** confiar que upgrade nao quebra projetos clientes.

## Criterios de aceitacao

- **AC-126-1** — `templates/.claude/hooks/__tests__/<hook>.test.js` obrigatorio pra cada hook bloqueador. Minimo 3 casos: (a) deve bloquear → exit 2; (b) nao deve bloquear (caso adjacente); (c) degenerado → exit 0 ou erro controlado. Script `tools/validar-cobertura-hooks-comportamento.js` falha CI se hook bloqueador sem `__tests__/`.
- **AC-126-2** — `evals/skill-vectors/<skill>.vectors.json` criado pra 5 skills BR criticas (validar-cpf-cnpj, validar-chave-acesso-nfe, validar-boleto, mascarar-dado-pessoal, gerar-br-code). Casos canonicos: 5 CPFs validos reais publicos, 5 invalidos por motivo, CNPJ alfanumerico Manual RF, BR Code Manual Bacen 03.34. Runner em `evals/run-vectors.js`.
- **AC-126-3** — `evals/hooks-perf.test.js` mede tempo de PreToolUse tipico. Falha CI se > 250ms (PreToolUse mediano) ou > 500ms (Stop/SubagentStop). `evals/perf-baseline.json` versionado — regressao > 30% bloqueia merge.
- **AC-126-4** — `evals/agent-snapshot/<agente>.snapshot.eval.md` pra cada 1 dos 17+ agentes. 1 prompt canonico + frases-ancora obrigatorias (Sofia tem que escrever `AC-`; Detetive tem que mencionar "li o estado real"; Camila tem que produzir `### O que muda pra voce`). Runner usa Claude SDK headless (CI ja tem `claude-headless-lgpd.yml`).
- **AC-126-5** — `test/regressao-pt-br.test.js` varre templates/agents/skills/commands e falha se aparecem strings claramente EN ("Please ", "Make sure to", "Note that", "Workflow ", "Step ", "Check that", "Output"). Allowlist por palavra tecnica intraduzivel (SDK, commit, npm).
- **AC-126-6** — `test/install-idempotencia.test.js` cobre 3 cenarios: (a) install em pasta com `.claude/settings.json` customizado → preservar; (b) `update` em projeto com hooks customizados em `.claude/hooks/<custom>.js` → nao apagar; (c) reinstall consecutivo (idempotencia).
- **AC-126-7** — Canary release: `npm publish --tag next` publica `3.0.0-next.0`. 5 dias de soak obrigatorios. Hook `enforce-canary-soak.js` (manual, pre-promocao) verifica idade da tag `next` antes de `npm dist-tag add latest`. Documentado em ADR-032.
- **AC-126-8** — Mutation testing leve em 3 hooks criticos (anti-mascaramento, block-destructive, secrets-scanner). Script `tools/mutar-e-rodar.js` (~80 linhas Node puro): aplica 5 mutacoes simples, roda `__tests__/<hook>.test.js`, exige ≥ 4/5 detectadas.
- **AC-126-9** — `tools/validar-templates.js` existente reforcado: valida que cada ID novo (INV-007..012, INV-AGENT-007..011, SEC-006/007/008, TST-005/006, LGPD-011) tem (a) entrada em REGRAS-INEGOCIAVEIS.md com `origem:`, (b) hook correspondente em `.claude/hooks/`, (c) entrada na tabela em `.claude/rules/roldao-method.md`.
- **AC-126-10** — Suite `__tests__/regressao-v2-hooks.test.js` (T-117-015 expandida): cada um dos 35 hooks bloqueadores da v2.0.0 tem teste que confirma que continua bloqueando o cenario original. Falha CI se um hook deixa de bloquear cenario v2.

## Non-goals

- NAO migrar pra Vitest (Node puro zero-deps e diferencial — manter)
- NAO usar Stryker (mutation testing usa script Node puro proprio)
- NAO testar Playwright/E2E do framework em si (framework e CLI + arquivos, sem UI)
- NAO ampliar cobertura pra todos os 44 hooks (so 35 bloqueadores + 3 criticos com mutation)

## Contexto tecnico

- **ADRs bloqueantes:** ADR-032 (canary release)
- **Depende de:** US-117 (manifest pra cruzar com testes), US-122 (regras novas implementadas pra testar), US-125 (skill `gerar-vetores-skill-br` + `mutar-e-rodar-hook`)
- **Arquivos afetados:** `evals/` (novo diretorio), `tools/`, `__tests__/`, CI

## Tasks

- [ ] **T-126-001** — `evals/run-vectors.js` runner
- [ ] **T-126-002** — `evals/skill-vectors/validar-cpf-cnpj.vectors.json` (10 CPFs + 10 CNPJs + 1 CNPJ alfa)
- [ ] **T-126-003** — `evals/skill-vectors/validar-chave-acesso-nfe.vectors.json`
- [ ] **T-126-004** — `evals/skill-vectors/validar-boleto.vectors.json`
- [ ] **T-126-005** — `evals/skill-vectors/mascarar-dado-pessoal.vectors.json`
- [ ] **T-126-006** — `evals/skill-vectors/gerar-br-code.vectors.json` (com saida EMV byte-a-byte do Manual Bacen)
- [ ] **T-126-007** — `evals/hooks-perf.test.js` + `evals/perf-baseline.json`
- [ ] **T-126-008** — `evals/agent-snapshot/` pra cada 1 dos 17 agentes
- [ ] **T-126-009** — `test/regressao-pt-br.test.js`
- [ ] **T-126-010** — `test/install-idempotencia.test.js`
- [ ] **T-126-011** — `tools/mutar-e-rodar.js`
- [ ] **T-126-012** — `tools/validar-cobertura-hooks-comportamento.js`
- [ ] **T-126-013** — Reforco em `tools/validar-templates.js` (validar IDs novos)
- [ ] **T-126-014** — `tools/release/enforce-canary-soak.js`
- [ ] **T-126-015** — Estender workflow `/release` com flag `--canary`
- [ ] **T-126-016** — Suite `__tests__/regressao-v2-hooks.test.js` ampliada pra 35 hooks bloqueadores
- [ ] **T-126-017** — Atualizar CI (`.github/workflows/validar.yml`) pra rodar evals + mutation
- [ ] **T-126-018** — Adicionar `__tests__/hook-<id>.test.js` pros hooks bloqueadores que ainda nao tem (auditar ~25 hooks faltantes da v2)

## Testes esperados

- **Unitario:** runner de vetores; runner de perf
- **Integracao:** CI completo verde com canary tag publicada
- **Regressao:** ZERO capacidade da v2.0.0 perdida — provado por `regressao-v2-hooks.test.js`

## Regulamentacao BR aplicavel

- **ADR-031** — preservacao validada por suite de regressao
- **ADR-032** — canary release
- **LGPD-001** — vetores com CPFs **publicos** (nao reais)

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 10) |
