---
owner: roldao-method
revisado-em: 2026-05-24
status: stable
---

# Auditoria do PLANO-10-DE-10 (10 auditores independentes)

> Cada um dos 10 auditores leu o `PLANO-10-DE-10.md` por uma lente diferente e devolveu veredito GO / GO COM AJUSTES / NO-GO. **Todos os 10 retornaram GO COM AJUSTES.** Nenhum NO-GO. Nenhum GO direto.

---

## Verditos por lente

| # | Lente | Veredito | Achado mais grave |
|---|---|---|---|
| 1 | Cobertura (plano vs 10 relatórios) | GO COM AJUSTES | 9 achados não cobertos → adicionar **K1-K9** |
| 2 | Viabilidade técnica | GO COM AJUSTES | 5 ações são **épicos disfarçados** (B2, D1-D3, D5) e G3 colide com hook existente |
| 3 | Sequenciamento | GO COM AJUSTES | 3 dependências quebradas — G7, F1, J10 deveriam estar no Sprint 1, não 3/5 |
| 4 | Critérios de aceitação | GO COM AJUSTES | 26% dos critérios são **vagos/subjetivos** — 18 precisam reescrita com comando verificável |
| 5 | Risco de regressão | GO COM AJUSTES | B1/B2 quebram **projetos terceiros** sem janela de compat; falta teste por hook tocado |
| 6 | Escopo / non-goals | GO COM AJUSTES | **Zero non-goals declarados** (viola INV-003 do próprio framework) |
| 7 | Esforço / realismo | GO COM AJUSTES | 7 semanas é otimista 40% → realista **10-11 semanas** |
| 8 | Impacto no leigo | GO COM AJUSTES | Ordem invertida — Sprint 5 tem **mais valor pro Roldão** que Sprint 3 |
| 9 | Risco oculto | GO COM AJUSTES | 11 riscos não listados; 4 ALTOS (terceiros, validação técnica, hotfix, update vs templates) |
| 10 | Aderência ao framework | GO COM AJUSTES | **CRÍTICO:** plano viola INV-003, INV-004, INV-AGENT-006, INV-005 — hooks vão bloquear seus próprios commits |

---

## 🚨 4 bloqueadores OBRIGATÓRIOS (resolver antes do Sprint 1)

Sem esses 4, qualquer Sprint começado vai trombar nos próprios hooks do framework, no escopo, ou em projetos terceiros.

### Bloqueador 1 — Plano não respeita as regras que ele mesmo defende (auditor 10)

- **INV-004 violada:** ações chamam-se B1..J20, mas `commit-message-validator.js` exige `T-NNN` no commit. **Sem mapear B/A/C/D/E/F/G/H/I/J → T-NNN, os commits vão ser bloqueados pelo próprio framework.**
- **INV-003 violada:** zero non-goals declarados.
- **INV-AGENT-006 violada:** seção "Pontos de decisão pendentes" tem 4 perguntas ao Roldão que o agente deve decidir sozinho.
- **INV-002 violada:** mudanças arquiteturais no Maestro (D1-D3) sem ADR.
- **Meta-ironia:** plano não usou `/prd` ou `/epico` pra se planejar — não usou o próprio framework que se propõe a melhorar.

**Correção:** criar 1 épico (`EP-010 — Auditoria-10-de-10`) + 5 stories (`US-050..US-054`, 1 por sprint) + mapear cada ação como `T-NNN` da sua story + adicionar seção `## Non-goals` + transformar "Pontos pendentes" em "Decisões tomadas" + abrir `ADR-XXXX` pra Maestro multi-modo.

### Bloqueador 2 — Versionamento e janela de compatibilidade (auditor 9)

- B1/B2 fecham bypass `touch` que projetos terceiros estão usando hoje.
- D1-D3 mudam contrato de markers que addons (`fintech-br`, `fiscal-br-completo`) consomem.
- Sem janela de transição, `npx roldao-method update` quebra clientes pagos.

**Correção:** declarar release como `v2.0.0` (major bump) + criar `MIGRATION-v2.md` + cada hook quebrador suporta `ROLDAO_METHOD_LEGACY_MARKERS=1` por 1 release.

### Bloqueador 3 — Ordem invertida vs valor pro leigo (auditor 8)

- Sprint 1 tem 6 ações de alto impacto, Sprint 5 tem 5 ações de alto impacto, **Sprints 2/3/4 são polimento que Roldão não nota.**
- Se executado na ordem proposta, Roldão sente diferença na semana 1 e na semana 7 — 5 semanas de "nada visível" no meio.

**Correção:** mover pro Sprint 1: **J12** (GIF/vídeo no README), **J16** (menu sem argumento), **J19** (CHANGELOG pro leigo), **J1+J2** (PRIMEIRO-DIA, COMO-PEDIR-AJUDA), **I7** (glossário de IDs). Acumular ações novas: `/o-que-aconteceu`, `npx roldao-method status`, `npx roldao-method undo`.

### Bloqueador 4 — Sprint 2 é épico disfarçado de sprint (auditor 2 + 7)

- D1-D3 (Modos PRD/BROWNFIELD/AR no Maestro) = **3 refactors estruturais** de ~3-4 dias cada. Soma sozinho dá 9-12 dias, **só sobra 0 dias pras outras 12 ações do sprint**.
- B2 (checkpoint marker com SHA + audit_sha) = refator de ~50 linhas + dep cruzada com `/checkpoint.md` — não é "ação", é mini-story.
- D5 (statusline mostrando etapa N/7) = exige contrato marker→etapa que não existe documentado.

**Correção:** Sprint 2 vira 3 semanas, não 2. **OU** quebra em Sprint 2A (autonomia C1-C7) e Sprint 2B (orquestração D1-D8) com 2 semanas cada.

---

## Ajustes consolidados (consenso entre auditores)

### Mover pro Sprint 1 (auditores 3 + 8)

| Origem | Destino | Razão |
|---|---|---|
| G7 (prefixo `_lib.js`) | Sprint 1 | Pré-req de B5 e H6 — habilita padronização desde o começo |
| F1 (regex jargão expandida) | Sprint 1 | Pré-req de A1/A2 (reescrita do README) |
| J10 (`audit_sha` em aprovacoes) | Sprint 1 | Define shape canônico que B1/B2 vão exigir |
| J12 (GIF/vídeo README) | Sprint 1 | Alto impacto leigo, baixo esforço |
| J16 (`npx roldao-method` menu) | Sprint 1 | Alto impacto leigo, 30min |
| J19 (CHANGELOG pro leigo) | Sprint 1 | Alto impacto leigo |
| J1 (PRIMEIRO-DIA.md) | Sprint 1 | Alto impacto leigo, doc nova |
| J2 (COMO-PEDIR-AJUDA.md) | Sprint 1 | Alto impacto leigo, doc nova |
| I7 (glossário de IDs) | Sprint 1 | Roldão lê commit hoje sem entender |

### Consolidar (mesmo arquivo tocado em múltiplos sprints — auditor 3)

- **B4 + J6 + J7** → 1 commit atômico em `anti-mascaramento.js` no Sprint 1.
- **D5 + D7 + H2 + H3 + H8** → 1 refactor em `statusline.js` (não 5 toques).

### Remover do plano (auditor 6)

- **J20** (reescrever release notes antigas v0.15.x) — fora do escopo, scope creep.
- **I5** (sugestão proativa de addon — duplicado com E5 do Sprint 3).

### Promover a decisão pendente do Roldão (auditor 6)

- **J4** (alias `/adotar`) e **J5** (rename `/qa` → `/testes-area`) — são mudanças públicas que afetam quem já usa. Roldão decide se vale o churn.

### Adicionar K1-K9 (auditor 1 — cobertura faltando)

- **K1** — Coluna "Pra quem é" na tabela de addons do README
- **K2** — Reescrever output do `/inicio` Etapas 4-5 em PT-BR sem "frontmatter/gate/EP-status"
- **K3** — Bloco "este arquivo é pro assistente de IA" no topo de `AGENTS.md` e `CLAUDE.md`
- **K4** — 1 exemplo completo preenchido em `docs/exemplos/` por template de spec
- **K5** — `/help "<frase em PT-BR>"` busca fuzzy nos comandos
- **K6** — Helper em `_lib.js` que formata fail-closed de parse em mensagem leiga
- **K7** — `/prd` etapa 2 dispara AskUserQuestion automático a partir de premissas do analista
- **K8** — Adicionar a F1 explicitamente: `null pointer`, `race condition`, `edge case`, `stack trace`
- **K9** — Linkar PARA-DONO no rodapé de `/status`, `/checkpoint`, `/release`

### Adicionar L1-L4 (auditor 8 — ações novas de alto impacto leigo)

- **L1** — Comando `/o-que-aconteceu` — resumo PT-BR de mudanças desde última sessão
- **L2** — `npx roldao-method status` — diagnóstico do projeto ("3 stories abertas, 1 ADR pendente")
- **L3** — `npx roldao-method undo` — `git revert` do último commit do Claude (rede de segurança)
- **L4** — Mudar métrica de "10/10 dos auditores" pra "5 tarefas-tipo do Roldão sem ajuda humana"

### Endurecer 18 critérios vagos (auditor 4)

Todo critério deve incluir **(a) UM comando que retorna 0/1 OU (b) caminho de `tests/*.spec.js`**. Frases descrevendo o que o usuário "vai entender" ou "verá mais claro" são proibidas. Lista dos 18 críticos: A1, A2, A3, A4, A6, B5, C1, C2, C3, C6, D5, D6, D7, E3, F3, F4, H1, H5, J1, J2, J3.

### Adicionar testes por hook tocado (auditor 5)

- Cada hook editado em B/C/F/G ganha **2 testes adversariais** (passa + bloqueia) em `tests/hooks/*.test.js` no mesmo commit.
- F3/F4 (reescrita de devops-infra e dba-dados) ganham eval comportamental em `evals/agent-behavior/` antes de mergear.

---

## Cronograma realista (auditor 7)

| Sprint | Antes | Depois | Conteúdo |
|---|---|---|---|
| 1 | 1 sem | 1.5 sem | Bloqueadores 1-4 + ações ALTO impacto + ajustes movidos |
| 2A | (parte de S2) | 1.5 sem | Autonomia (C1-C7) |
| 2B | (parte de S2) | 2 sem | Orquestração Maestro (D1-D8) |
| 3 | 2 sem | 1.5 sem | Auto-preenchimento + PT-BR (E + F2-F6, F1 já no S1) |
| 4 | 1 sem | 1 sem | UX Terminal restante + descoberta |
| 5 | 1 sem | 1.5 sem | Docs faltando + ações novas L1-L4 + K1-K9 + polimento |
| **Buffer** | 0 | 1 sem | Hotfix paralelo, recalibração |
| **Total** | **7 sem** | **10 sem** | Realista |

---

## Decisões obrigatórias do Roldão (4 perguntas reais)

> **As outras 4 perguntas do plano original eu decido sozinho** (INV-AGENT-006). Estas 4 abaixo são genuínas — Roldão precisa escolher.

1. **Versionamento:** v2.0.0 (breaking change honesto com `MIGRATION-v2.md`) ou sequência de minors (1.1.0 → 1.5.0)?
2. **Rename `/qa` → `/testes-area`:** vale o churn pra ganhar 1 ponto de descoberta? (mesma pergunta pra alias `/adotar`)
3. **Métrica final de "pronto":** 10/10 dos auditores re-rodados (objetivo do plano original) ou "Roldão conclui 5 tarefas-tipo sem ajuda humana" (proposta do auditor 8)?
4. **Usar o próprio framework:** rodar `/prd PRD-002 — Auditoria 10/10` antes de executar (auditor 10 + dogfood) ou aplicar PLANO-V2 direto?

---

## Próximo passo proposto

Aplicar os 4 bloqueadores + ajustes consolidados → gerar `PLANO-V2.md` → Roldão decide as 4 perguntas → começar Sprint 1 ajustado.

**Sem aplicar os bloqueadores, Sprint 1 vai fracassar nos próprios hooks do framework** (auditor 10 é categórico).
