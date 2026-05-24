---
tipo: epico
id: EP-002
versao: 1
status: draft
prd: PRD-003
owner: gerente-produto
revisado-em: 2026-05-24
tamanho: XG
---

# EP-002 — v2.0.0 Auditoria 10 de 10

> Concretiza o [PRD-003](../prd/PRD-003-v2-0-auditoria-10-de-10.md). Fecha o gap entre **doutrina** (regras INV/SEC/TST/LGPD) e **prática** (34 hooks + 17 agentes + 26 comandos + 13 skills), entregue como release **v2.0.0** em 10 semanas (5 sprints + 1 buffer).
>
> **Diferença para PRD:** PRD descreve a iniciativa (problema, personas, métricas, riscos). Épico é a unidade operacional — agrupa as 6 stories filhas, declara ordem de execução, dependências, ADRs bloqueantes e o gate de "épico pronto" (5 tarefas-tipo do Roldão passam).

---

## Resumo em 1 frase

O Roldão completa as **5 tarefas-tipo** do produto (iniciar projeto, adotar legado, reportar bug, pedir feature, fechar release) **sozinho, sem chamar tradutor humano**, porque o framework passa a respeitar as próprias regras nas entranhas — e não só na vitrine.

---

## Valor pro usuário (5 tarefas-tipo — métrica oficial)

> Cada tarefa abaixo é **binária** (passou / não passou). Não tem "quase". Validada ao vivo na US-116 antes do release.

| # | Tarefa-tipo do Roldão | Hoje | Depois |
|---|---|---|---|
| 1 | **Iniciar projeto novo do zero** | Chama dev pra preencher AGENTS.md | Completa sozinho via `/inicio` |
| 2 | **Adotar repo legado** | Recebe diagnóstico com 32+ jargões | Diagnóstico 1 página em PT-BR claro |
| 3 | **Reportar um bug** | Recebe "quer que eu investigue?" | Investigador roda automático; agente entrega causa raiz |
| 4 | **Pedir feature pequena** | Pipeline para no meio pedindo decisão técnica | Pipeline 7 etapas completo sem pergunta evitável |
| 5 | **Fechar release** | CHANGELOG cheio de "refactor", "lint", "build" | CHANGELOG em linguagem de impacto pro cliente |

---

## Stories filhas

> Tabela autoritativa. Cada US vive em `docs/stories/US-NNN-*.md`. Ordem: Sprint 1 destrava todos; Sprint 2A destrava 2B; depois Sprints 3-4-5 rodam em paralelo.

| US      | Título                                                      | Sprint | Depende de       | Tamanho | Status |
|---------|-------------------------------------------------------------|--------|------------------|---------|--------|
| US-111  | Sprint 1 — Bloqueadores + alta-prioridade leigo             | 1      | -                | G       | draft  |
| US-112  | Sprint 2A — Autonomia dos agentes (C1-C7)                   | 2A     | US-111           | M       | draft  |
| US-113  | Sprint 2B — Orquestração Maestro multi-modo (D1-D8)         | 2B     | US-111, US-112   | G       | draft  |
| US-114  | Sprint 3 — Auto-preenchimento + PT-BR (E + F2-F6)           | 3      | US-113           | M       | draft  |
| US-115  | Sprint 4 — UX Terminal + Descoberta (H + I)                 | 4      | US-113           | M       | draft  |
| US-116  | Sprint 5 — Docs leigo + L1-L4 + K1-K9 + polimento           | 5      | US-113           | G       | draft  |

**Paralelismo após Sprint 2B:** US-114, US-115 e US-116 podem rodar simultaneamente (worktrees separados — ver `docs/PLAN-MODE-E-SESSOES.md`).

---

## ADRs bloqueantes

> Decisões arquiteturais que precisam estar **aceitas** antes da story correspondente começar.

- [ ] **ADR-019** — Maestro multi-modo (PRD / BROWNFIELD / AR). Bloqueia US-113.
- [ ] **ADR-020** — Contrato `audit_sha` em markers de aprovação (formato canônico). Bloqueia US-111 AC-111-1.
- [ ] **ADR-021** — Janela de compatibilidade `ROLDAO_METHOD_LEGACY_MARKERS=1` (1 release). Bloqueia US-111 AC-111-4.

---

## Readiness (gate mecânico)

- **Última verificação:** —
- **Resultado:** NAO_PRONTO (épico recém-criado)
- **Arquivo de status:** `docs/readiness/EP-002-status.md` (a criar)

Sem `status: PRONTO` em `docs/readiness/EP-002-status.md`, nenhuma `/feature` deste épico avança (hook `require-readiness-before-feature.js`).

---

## Non-goals (INV-003)

O épico explicitamente NÃO faz (herdados do PRD-003 §5):

- Não cria addon novo (escopo é core: `.claude/`, `.specify/`, `templates/`, `docs/`).
- Não toca MCP nem runtime do Claude Code global.
- Não renomeia comando público (`/qa` continua `/qa`; sem alias `/adotar`).
- Não publica no npm (Roldão roda `npm publish` manualmente).
- Não promete +nota se re-auditoria for mesmo modelo/dia.
- Não reescreve `.specify/templates/` core (adaptações vão em `.specify/overrides/`).
- Não adiciona dependência runtime (zero deps mantida — ADR-001).
- Não cobre split payment (FISCAL-010) nem regra fiscal nenhuma — vive nos addons.
- Não endurece `lgpd-base-legal-reminder` de soft pra bloqueador.
- Não refaz release notes antigas (v0.15.x — J20 removido).
- Não troca runtime de hooks pra bash (Node é decisão firmada — ADR-012/013).

---

## Critério de "épico pronto"

Épico só fecha quando **todas as 4 condições** estão verdadeiras:

1. **6 stories filhas (US-111..US-116) com `status: entregue`** no frontmatter + audit trail completo em `aprovacoes:` (validado por `validate-story-approvals.js`).
2. **5 tarefas-tipo passam ao vivo** (US-116 AC-116-7): Roldão executa cada uma sozinho, sem ajuda humana, e cada verificação binária retorna 0.
3. **`v2.0.0` taggeada** + `MIGRATION-v2.md` publicado + flag `ROLDAO_METHOD_LEGACY_MARKERS=1` documentada e testada.
4. **3 ADRs aceitos** (ADR-019, ADR-020, ADR-021) com status `aceito`.

---

## Métricas de sucesso

| Métrica | Valor atual | Meta |
|---|---|---|
| 5 tarefas-tipo do Roldão | 0/5 sozinho | 5/5 sozinho |
| Taxa de bypass de auditor via `touch` | 100% | 0% |
| Jargões em `devops-infra.md` | 32+ | 0 |
| Placeholders `_(preencher)_` em template core sem helper | 15+ | 0 |
| Comandos públicos longos sem orquestrador | 3 (`/prd`, `/brownfield`, `/auditoria-reversa`) | 0 |
| Pergunta evitável devolvida por agente | 7 (analista 3 + devops-infra 2 + dba-dados 2) | 0 |

Detalhamento de como medir: ver PRD-003 §6.

---

## Prazo agregado

**10 semanas** (5 sprints + 1 semana buffer pra hotfix paralelo / recalibração — auditor 7).

| Sprint | Story  | Duração      | Janela calendário (aproximada) |
|--------|--------|--------------|--------------------------------|
| 1      | US-111 | 1.5 semanas  | semana 1-2                     |
| 2A     | US-112 | 1.5 semanas  | semana 3-4                     |
| 2B     | US-113 | 2 semanas    | semana 5-6                     |
| 3      | US-114 | 1.5 semanas  | semana 7-8 (paralelo a 4 e 5)  |
| 4      | US-115 | 1 semana     | semana 7 (paralelo a 3 e 5)    |
| 5      | US-116 | 1.5 semanas  | semana 7-8 (paralelo a 3 e 4)  |
| Buffer | —      | 1 semana     | semana 9-10                    |

---

## Regulamentação BR aplicável

> Nenhuma regra precisa ser criada ou modificada. O épico **fortalece o cumprimento mecânico** de regras existentes.

- **INV-001** — Documento é estado compartilhado. Este épico + 6 stories + 3 ADRs são o estado canônico.
- **INV-002** — Spec gera código. US-111..US-116 geram o código.
- **INV-003** — Non-goals explícitos. PRD §5 (12 itens) + cada story tem `Non-goals` próprio.
- **INV-004** — IDs rastreáveis. PRD-003 → EP-002 → US-111..US-116 → AC-NNN-N → T-NNN → commit.
- **INV-005** — Conciso vence completo. AGENTS.md ≤ 200 linhas / CLAUDE.md ≤ 150 linhas (US-116 valida).
- **INV-006** — Causa raiz, nunca sintoma. US-111 fecha bypass no ponto raiz (marker exige `audit_sha`).
- **INV-AGENT-001** — Sem jargão. US-114.
- **INV-AGENT-003** — Pró-atividade. US-112.
- **INV-AGENT-004** — Verificar antes de afirmar. US-111.
- **INV-AGENT-006** — Executar, não passar pro usuário. US-112.
- **TST-001/002** — Mascaramento de teste. US-111 AC-111-2.
- **LGPD-009** — Mensagem clara pro titular começa em mensagem clara pro dev. US-114.
- **SEC-002** — `npx roldao-method undo` usa `git revert`, nunca `--hard`. US-116 AC-116-3.
- **SEC-005** — URLs externas via env. Possível impacto em E5 (auditar em US-115).

**Fora de escopo:** FISCAL-001..010, PIX-001..005 (vivem nos addons).

---

## Risco e mitigação

> Consolidado do PRD-003 §7. Detalhamento por story nas próprias US.

| # | Risco | Story que mitiga |
|---|---|---|
| R1 | Plano viola próprias regras | US-111 (mapeamento T-NNN + non-goals + decisões pré-tomadas) |
| R2 | Breaking change quebra terceiros | US-111 (v2.0.0 + MIGRATION-v2.md + flag LEGACY) |
| R3 | Ordem invertida vs valor pro leigo | US-111 (9 ações de alto impacto leigo movidas pro Sprint 1) |
| R4 | Sprint 2 era épico disfarçado | US-112 + US-113 (quebrado em 2A e 2B) |
| R5 | `/o-que-aconteceu` e `npx roldao-method status` viram surface area nova não testada | US-116 (cada comando novo entra com 2 testes) |
| R6 | `npx roldao-method undo` revert errado | US-116 AC-116-3 (filtro `--author=Claude`, `git revert`, confirma antes) |
| R7 | Reescrita em PT-BR muda comportamento dos agentes | US-114 (eval comportamental antes/depois) |
| R8 | 10 semanas otimista se Sprint 2B atrasar | Buffer de 1 semana contratado + ADR-019 antes de codar |

---

## Histórico

| Data       | Quem                       | Mudança                                              |
|------------|----------------------------|------------------------------------------------------|
| 2026-05-24 | gerente-produto (Sofia)    | criação a partir de PRD-003, modo DECOMP             |
