---
tipo: story
id: US-127
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: M
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-117, US-118, US-119, US-120, US-121, US-122, US-123, US-124, US-125, US-126]
aprovacoes: []
---

# US-127 — Onda 11: Buffer + polimento + MIGRATION-v3.md + release

## Como, quero, para

**Como** Roldao publicando major bump v3.0.0,
**quero** documento de migracao claro + buffer pra hotfix imprevisto + retroformatacao de regras antigas com `origem:`
**para** publicar com tranquilidade e dar ao mercado caminho explicito de update.

## Criterios de aceitacao

- **AC-127-1** — `MIGRATION-v3.md` criado em raiz. Cobre: (a) flag `ROLDAO_METHOD_LEGACY_MARKERS=1` continua valida (estende ADR-021); (b) pipeline-state-<US>.json coexiste com sentinels; (c) audit-finding-*.jsonl opcional v3.0.0, obrigatorio v3.1.0; (d) hooks novos modo warning v3.0.0, block v3.1.0; (e) frontmatter `tags:` opcional v3.0.0, obrigatorio v3.2.0 (memoria); (f) MEMORY.md continua funcionando; (g) ciclo de deprecation por capacidade.
- **AC-127-2** — Retroformatacao de regras antigas: todas as 49 regras existentes em REGRAS-INEGOCIAVEIS.md ganham campo `origem:` preenchido (best effort via git log + ADRs + retros). Hook `require-origem-on-new-rule.js` (AC-121-2) so passa a bloquear apos retroformatacao completa.
- **AC-127-3** — `docs/learning/2026-MM.md` (primeiro diario mensal) publicado. Camila gera baseline pos-release v3.0.0.
- **AC-127-4** — `/explicar-update v2.0.0 v3.0.0` testado em 3 projetos sandbox (sandbox-greenfield + sandbox-brownfield + sandbox-electron). Saida PT-BR clara em todos.
- **AC-127-5** — Release notes em `docs/releases/v3.0.0.md` em PT-BR claro pra dono de produto. Camila modo REL. Topicos: "O que muda pra voce (nao-programador)" + "Por que importa" + "Como aplicar" + "Atencao (breaking changes conceituais — mesmo sendo aditivo)".
- **AC-127-6** — `README.md` do framework ganha badge `v3.0.0` + bloco "Novidades v3.0" com 7-10 bullets.
- **AC-127-7** — `AGENTS.md` do framework ganha entradas pros 5 agentes novos (`documentation-master`, `audit-arbiter`, `meta-cetico` Otavio, `memory-skeptic`, `vigia-fluxo` Olivia) na tabela §4 Modelo de agentes.
- **AC-127-8** — Buffer de 1 semana pra hotfix paralelo identificado durante canary (US-126 AC-126-7 cobre canary).
- **AC-127-9** — `gh release create v3.0.0` publicado com release notes em PT-BR + tarball + assets. **Autorizado explicitamente pelo Roldao** conforme INV-AGENT-005 (mudanca publica).
- **AC-127-10** — Memoria `project-v3-framework-aprendiz.md` atualizada apos release com status entregue + lessons learned.
- **AC-127-11** — `npm publish` final apos canary 5 dias OK — autorizado explicitamente pelo Roldao com credenciais (memoria `feedback-npm-publish.md`).
- **AC-127-12** — Anuncio publico (post + tweet) em PT-BR claro pro mercado BR de donos de produto. Camila modo ANN.

## Non-goals

- NAO publicar npm sem autorizacao explicita do Roldao com credencial dele
- NAO mudar visibilidade publica do repo
- NAO comprar dominio/plano/qualquer gasto sem autorizacao
- NAO criar comunidade Discord/Slack ainda (release tecnico — comunidade fica pra v3.1)
- NAO migrar projetos terceiros automaticamente (fornecer MIGRATION-v3.md como guia)

## Contexto tecnico

- **Depende de:** TODAS as outras 10 stories
- **Arquivos afetados:** `MIGRATION-v3.md` (novo), `REGRAS-INEGOCIAVEIS.md` (retrofit), `README.md`, `AGENTS.md`, `docs/releases/v3.0.0.md`, `package.json` (bump), `CHANGELOG.md`

## Tasks

- [ ] **T-127-001** — `MIGRATION-v3.md` em raiz
- [ ] **T-127-002** — Retroformatacao de 49 regras com `origem:` (1 commit por categoria: INV, SEC, TST, LGPD, FISCAL, PIX, INV-AGENT)
- [ ] **T-127-003** — Primeiro `docs/learning/2026-MM.md` (Camila)
- [ ] **T-127-004** — Testar `/explicar-update v2.0.0 v3.0.0` em 3 sandbox + ajustes
- [ ] **T-127-005** — Release notes `docs/releases/v3.0.0.md` em PT-BR (Camila modo REL)
- [ ] **T-127-006** — Atualizar `README.md` (badge + novidades)
- [ ] **T-127-007** — Atualizar `AGENTS.md` §4 (5 agentes novos)
- [ ] **T-127-008** — Bump package.json `3.0.0-next.0` + CHANGELOG bloco
- [ ] **T-127-009** — `/release 3.0.0 --canary` (publica npm tag next)
- [ ] **T-127-010** — Soak 5 dias em sandbox-greenfield + sandbox-brownfield + sandbox-electron
- [ ] **T-127-011** — Buffer pra hotfix paralelo (1 semana)
- [ ] **T-127-012** — `enforce-canary-soak.js` aprova → `npm dist-tag add roldao-method@3.0.0 latest`
- [ ] **T-127-013** — `gh release create v3.0.0` (Roldao autoriza explicitamente)
- [ ] **T-127-014** — Atualizar memoria `project-v3-framework-aprendiz.md` com release entregue
- [ ] **T-127-015** — Anuncio publico (post + tweet) — Camila modo ANN

## Testes esperados

- **Unitario:** parser de retroformatacao de regras (verifica `origem:` em cada)
- **Integracao:** Sandbox completo em 3 projetos diferentes; canary 5 dias verde; `/explicar-update` em PT-BR
- **Regressao:** ZERO capacidade da v2.0.0 perdida (suite de US-126 confirma)
- **Validacao humana:** Roldao confirma 8 tarefas-tipo (PRD-004 secao 6.1)

## Regulamentacao BR aplicavel

- **INV-AGENT-005** — Roldao autoriza npm publish + gh release
- **ADR-016** (SemVer) — major bump com MIGRATION-v3.md
- **ADR-031** — preservacao validada
- **ADR-032** — canary soak respeitado

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 11) |
