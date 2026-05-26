---
tipo: epico
id: EP-003
versao: 1
status: draft
prd: PRD-004
owner: gerente-produto
revisado-em: 2026-05-26
tamanho: XG
---

# EP-003 — v3.0.0 Framework Aprendiz

> Arquivo de epico gerado a partir do PRD-004. Vive em disco, nao na conversa (INV-001).
>
> **Origem:** consolida 3 auditorias paralelas de 2026-05-26 (lionclaw geral + pipelines do lionclaw + fluxo interno do ROLDAO-METHOD) — 76+ propostas concretas organizadas em 11 ondas de entrega.

---

## Resumo em 1 frase

Transformar o ROLDAO-METHOD num **framework que observa o proprio uso e propoe melhorias proativas** ao Roldao, sem perder nenhuma capacidade da v2.0.0.

---

## Stories filhas

> Tabela autoritativa. Cada US-NNN vive em `docs/stories/US-NNN-*.md`. Ordem respeitada pelo `enforce-pipeline-completion.js`.

| US     | Titulo                                                    | Depende de | Tamanho | Status |
|--------|-----------------------------------------------------------|------------|---------|--------|
| US-117 | Onda 1 — Performance + Visibilidade imediata              | -          | M       | draft  |
| US-118 | Onda 2 — Onboarding sem armadilha + Memoria tag-based     | US-117     | G       | draft  |
| US-119 | Onda 3 — Pipeline com payload + retomada universal        | US-118     | G       | draft  |
| US-120 | Onda 4 — Auditoria com findings rastreaveis + ADRs filme  | US-119     | G       | draft  |
| US-121 | Onda 5 — Framework Aprendiz + telemetria + meta-cetico    | US-119     | G       | draft  |
| US-122 | Onda 6 — Regras INV/SEC/TST/LGPD codificadas em hook      | US-119     | M       | draft  |
| US-123 | Onda 7 — Addon `electron-br` materializado                | US-119     | G       | draft  |
| US-124 | Onda 8 — Workflow `/documentar-repo` + documentation-master| US-120    | G       | draft  |
| US-125 | Onda 9 — Skills core novas + templates de doc             | US-124     | M       | draft  |
| US-126 | Onda 10 — Hardening de testes + canary + mutation         | US-122 + US-125 | M  | draft  |
| US-127 | Onda 11 — Buffer + polimento + MIGRATION-v3.md + release  | todas      | M       | draft  |

**Caminho critico:** US-117 → US-118 → US-119 → US-124 → US-125 → US-126 → US-127 (10 semanas serial).
**Paralelizaveis:** US-120, US-121, US-122, US-123 podem rodar simultaneas apos US-119 fechar (poupa 3-4 semanas com worktrees).

---

## ADRs bloqueantes

Decisoes arquiteturais que precisam estar **aceitas** antes da primeira story comecar:

- [ ] **ADR-023** — Framework aprendiz: telemetria local opt-in + meta-cetico nunca aplica sozinho
- [ ] **ADR-024** — Pipeline state como JSON consolidado convive com sentinel files legados (estende ADR-021)
- [ ] **ADR-025** — Handoff payload tipado entre agentes — contrato JSON minimo + schema versionado
- [ ] **ADR-026** — Memory router com tag-based RAG local — Node puro zero-deps (sustenta ADR-001)
- [ ] **ADR-027** — Manifest de hook + fast-path por path + frontmatter `@hook-meta`
- [ ] **ADR-028** — ADR-Lite (DN-NNN) coexiste com ADR completo — escala de overhead
- [ ] **ADR-029** — Tabela `audit_findings` + ciclo finding-fix-re-audit como contrato
- [ ] **ADR-030** — Addon `electron-br` como cidadao de primeira classe (primeiro addon com agentes/hooks/templates completos)
- [ ] **ADR-031** — Principio de preservacao de capacidade na v3 (nunca perder, pode refatorar)
- [ ] **ADR-032** — Canary release via `npm publish --tag next` + 5 dias de soak

> ADR-023, ADR-024, ADR-027 sao **bloqueantes da US-117**. Os demais sao bloqueantes das stories correspondentes.

---

## Readiness (gate mecanico)

Estado do gate `/readiness EP-003` — preenchido pelo comando, lido pelo hook `require-readiness-before-feature.js`.

- **Ultima verificacao:** _(pendente — rodar `/readiness EP-003` antes de comecar US-117)_
- **Resultado:** _(pendente)_
- **Arquivo de status:** `docs/readiness/EP-003-status.md`

Sem `status: PRONTO` em `docs/readiness/EP-003-status.md`, nenhuma `/feature` deste epico avanca.

**Pre-requisitos pra readiness:**

- PRD-003 (v2.0.0) entregue e validado
- ADR-023, ADR-024, ADR-027 escritos e aceitos
- Memoria do Roldao verificada: `project-stack.md` confirma Node puro, `project-paridade-speckit.md` confirma v0.13+
- 3 arquivos de analise lidos pelo gerente-produto: `licoes-do-lionclaw.md`, `auditoria-pipelines-lionclaw.md`, `melhorias-fluxo-roldao.md`

---

## Non-goals (INV-003)

O que esse epico explicitamente NAO faz (deixa pra epico futuro):

- **Telemetria cross-usuario.** Local-first sempre. Compartilhamento entre Roldao e outros usuarios fica pra EP-004 ou nunca.
- **Daemon de fundo / cron real.** Tarefas periodicas via `/loop` existente OU gatilho manual.
- **Addon `fintech-br`, `fiscal-br-completo`, `lgpd-compliance` aprimorados.** Esses ja existem como addons — `EP-003` so adiciona `electron-br`.
- **Remocao de qualquer capacidade da v2.0.0.** Refatoracao sim, remocao nao (ADR-031).
- **Reescrever Maestro.** Maestro existente da v2.0.0 continua valido (ADR-019). v3 adiciona orquestracao por handoff payload, nao substitui.
- **Mudar visibilidade publica do repo, comprar dominio, gastar dinheiro.** INV-AGENT-005.

---

## Metricas de sucesso

Como o epico sabera que foi bem-sucedido:

1. **Roldao completa 8 tarefas-tipo sozinho** (ver PRD-004 secao 6.1 — lista das 8 tarefas).
2. **Latencia mediana de PreToolUse Write/Edit cai de ~1000ms pra ≤ 250ms.**
3. **Cobertura comportamental de hooks bloqueadores sai de ~30% pra 100%.**
4. **5 skills BR criticas ganham vetores canonicos** (CPF/CNPJ/NFe/Boleto/Pix).
5. **Mutation kill rate ≥ 4/5** em 3 hooks criticos (`anti-mascaramento`, `block-destructive`, `secrets-scanner`).
6. **Zero capacidade da v2.0.0 perdida** — validado por suite de testes de regressao em US-126.
7. **`/explicar-update v2.0.0 v3.0.0` produz saida PT-BR clara** validada em 3 projetos sandbox.
8. **v3.0.0 publicada em `npm tag next` com 5 dias de soak completados** antes de promover pra `latest`.

---

## Regulamentacao BR aplicavel

IDs do REGRAS-INEGOCIAVEIS.md tocados pelo epico inteiro:

- **LGPD-002** — `~/.claude/memory-cross-project/` permite exclusao via `/memoria-esquecer`
- **LGPD-004** — `audit-finding-*.jsonl` virou trilha de auditoria de qualidade
- **LGPD-011 (NOVA)** — codificada em US-122 (mascaramento em log livre + retencao em tabela `*_messages`)
- **INV-AGENT-005** — preservada integralmente; `gh release create`, `npm publish` exigem autorizacao explicita
- **SEC-006 (NOVA)** — Working tree limpo de `.tmp*`/`*.snapshot`/`*.bak`/`*.log >1MB` nao gitignored
- **SEC-007 (NOVA)** — `dangerouslySkipPermissions:true` so via perfil declarado
- **SEC-008 (NOVA)** — Comando restrito por agente via frontmatter `restricted-to:` (opt-in)
- **TST-005 (NOVA)** — Orcamento de skip + prompt nunca em migration
- **TST-006 (NOVA)** — Migration nova exige teste full-chain
- **INV-007..012, INV-AGENT-007..011 (NOVAS)** — 11 IDs novos codificados em US-122

---

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir do PRD-004 |
