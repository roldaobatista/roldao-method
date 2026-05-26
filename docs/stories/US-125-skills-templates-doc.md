---
tipo: story
id: US-125
versao: 1
status: draft
prd: PRD-004
epico: EP-003
tamanho: M
owner: gerente-produto
revisado-em: 2026-05-26
depende-de: [US-124]
aprovacoes: []
---

# US-125 — Onda 9: Skills core novas + templates de doc

## Como, quero, para

**Como** Roldao em qualquer projeto,
**quero** skills utilitarias do core (testar webapp, construir MCP, limpar memoria) e templates canonicos de auditoria/plano/SPEC/glossary
**para** parar de inventar formato a cada vez e ter capacidades novas que faltavam.

## Criterios de aceitacao

### Skills core novas (4)

- **AC-125-1** — Skill `testar-webapp` (Playwright pra E2E browser). Gera teste pareando com Bia (qa-automation). Template `playwright.config.ts.example`.
- **AC-125-2** — Skill `construir-mcp` (guia pra criar MCP server TypeScript stdio). Template completo (`src/index.ts` com McpServer + zod + `server.tool()`, `package.json`, `tsconfig.json`).
- **AC-125-3** — Skill `limpar-memoria` (wrapper manual do agente `memory-skeptic` de US-121). Util pra Roldao executar consolidacao quando quiser.
- **AC-125-4** — Skill `extrair-prompt-de-migration` (refactor automatizado: migration → `seed-agents/<id>.ts`).

### Skills auxiliares de US anteriores (8)

- **AC-125-5** — Skill `gerar-handoff-payload-pt-br` (molde JSON tipado entre agentes — AC-119-3)
- **AC-125-6** — Skill `gerar-painel-saude-pt-br` (output do `/saude` — AC-117-5)
- **AC-125-7** — Skill `gerar-painel-instrumentos` (output do `/painel` — AC-119-11)
- **AC-125-8** — Skill `gerar-decision-note-pt-br` (DN-NNN — AC-120-12)
- **AC-125-9** — Skill `gerar-mapa-adr` (output do `/adr-mapa` — AC-120-15)
- **AC-125-10** — Skill `gerar-vetores-skill-br` (`.vectors.json` com casos canonicos)
- **AC-125-11** — Skill `mutar-e-rodar-hook` (mutation testing leve)
- **AC-125-12** — Skill `traduzir-erro-pt-br` (wrapper programatico do hook `translate-errors-ptbr` — AC-117-7)
- **AC-125-13** — Skill `gerar-resumo-hooks-stats` (relatorio mensal)

### Templates de doc (9)

- **AC-125-14** — `templates/docs/auditoria.md` (formato Cn/An/Mn/Bn/Gn/Rn/ALT-n com frontmatter `round`+`parent-audit`)
- **AC-125-15** — `templates/docs/plano-fix.md` (padrao "Ondas" + tabela visao geral)
- **AC-125-16** — `templates/docs/debito-tecnico.md` (lista numerada com status `aberto|parcial|resolvido`)
- **AC-125-17** — `templates/docs/SPEC.md` + `SPEC_PROGRESS.md` (agregado por epico + tracker)
- **AC-125-18** — `templates/docs/glossary.md` (regras nomeadas R2/R6/R7)
- **AC-125-19** — `templates/docs/discovery-notes.md` (output enxuto do `analista` no `/brief`)
- **AC-125-20** — `templates/docs/ADR-pipeline-resumability.md`
- **AC-125-21** — `templates/docs/ADR-prompts-fora-da-migration.md`
- **AC-125-22** — `templates/docs/ADR-retencao.md` (LGPD-002)

### Templates frontend (4)

- **AC-125-23** — `templates/component-acessivel.tsx` (focus trap + useId + ARIA — referencia Modal do lionclaw)
- **AC-125-24** — `templates/zustand-store.ts` (interface State + actions tipadas)
- **AC-125-25** — `templates/form-zod-react-hook-form.tsx`
- **AC-125-26** — `templates/tsconfig-strict.json` (preset estrito)

### `templates/CLAUDE.md.example` ganha bloco override

- **AC-125-27** — `templates/CLAUDE.md.example` ganha bloco opcional `## 0. Overrides (modo de operacao deste projeto)` comentado pronto pra ativar. Resolve INSIGHT 10.6 da analise.

## Non-goals

- NAO criar addon `design-system-br` (8 skills do lionclaw — avaliar pra release posterior)
- NAO criar addon `mcp-dev` (skill `construir-mcp` no core ja resolve)
- NAO criar addon `docs-office-br` (avaliar separadamente)

## Contexto tecnico

- **Depende de:** US-117 (status line + manifest), US-120 (DN-NNN existir), US-121 (memory-skeptic existir), US-124 (`/documentar-repo` consome templates)

## Tasks

- [ ] **T-125-001** — Skill `testar-webapp` + `playwright.config.ts.example`
- [ ] **T-125-002** — Skill `construir-mcp` + template TS
- [ ] **T-125-003** — Skill `limpar-memoria`
- [ ] **T-125-004** — Skill `extrair-prompt-de-migration`
- [ ] **T-125-005** — Skill `gerar-handoff-payload-pt-br`
- [ ] **T-125-006** — Skill `gerar-painel-saude-pt-br`
- [ ] **T-125-007** — Skill `gerar-painel-instrumentos`
- [ ] **T-125-008** — Skill `gerar-decision-note-pt-br`
- [ ] **T-125-009** — Skill `gerar-mapa-adr`
- [ ] **T-125-010** — Skill `gerar-vetores-skill-br`
- [ ] **T-125-011** — Skill `mutar-e-rodar-hook`
- [ ] **T-125-012** — Skill `traduzir-erro-pt-br`
- [ ] **T-125-013** — Skill `gerar-resumo-hooks-stats`
- [ ] **T-125-014** — Templates docs/auditoria, plano-fix, debito-tecnico, SPEC, glossary, discovery
- [ ] **T-125-015** — Templates 3 ADRs especificos
- [ ] **T-125-016** — Templates frontend (modal, zustand, form, tsconfig)
- [ ] **T-125-017** — CLAUDE.md.example com bloco override

## Testes esperados

- **Unitario:** skill `extrair-prompt-de-migration` em fixture migration v50 do lionclaw → gera seed-agents/<id>.ts equivalente
- **Integracao:** rodar `/testar-webapp` em sandbox webapp simples → Playwright spec gerada
- **Regressao:** templates existentes continuam funcionando

## Regulamentacao BR aplicavel

- **ADR-031** — todos templates antigos preservados; adicao aditiva

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | gerente-produto | criacao a partir de EP-003 / PRD-004 (Onda 9) |
