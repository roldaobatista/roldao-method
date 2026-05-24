---
tipo: story
id: US-111
versao: 1
status: draft
prd: PRD-003
epico: EP-002
tamanho: G
owner: gerente-produto
revisado-em: 2026-05-24
depende-de: []
aprovacoes: []
sprint: 1
esforco-dias-uteis: 7.5
premissas:
  - "Os 4 bloqueadores (B1..B5, A1..A6, G1..G4 e ajustes movidos) cabem em 1 commit por T-NNN — auditor 3 já validou consolidação B4+J6+J7 em commit único."
  - "Mapeamento B/A/C/D/E/F/G/H/I/J → T-NNN vai num arquivo de tradução em docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md mantido pela própria US."
  - "Flag ROLDAO_METHOD_LEGACY_MARKERS=1 só reativa o caminho de arquivo vazio aprovar; não reativa nada mais. Documentado no MIGRATION-v2.md."
adrs-decorrentes:
  - ADR-020 (Contrato audit_sha em markers de aprovação)
  - ADR-021 (Janela de compatibilidade ROLDAO_METHOD_LEGACY_MARKERS)
---

# US-111 — Sprint 1: Bloqueadores + alta-prioridade leigo

> Story file gerado pelo `/epico` em Modo DECOMP. Vive em disco (INV-001).

---

## Como, quero, para

**Como** dono de produto que não programa (Roldão),
**quero** que o framework respeite as próprias regras que prega (INV-003, INV-004, INV-AGENT-006) e que os bypasses ensinados na stderr dos hooks sejam fechados,
**para** confiar que "aprovação" significa aprovação de verdade e ver impacto visível já na primeira semana de release v2.0.0.

---

## Critérios de aceitação

> Todos verificáveis por comando ou teste. Sem "ficou melhor".

- **AC-111-1** — Markers de auditor exigem `audit_sha` válido. Verificação: `node tests/hooks/require-auditors-pass.test.js` retorna exit 0; teste adversarial cobre 3 cenários (arquivo vazio reprova, arquivo com `audit_sha` válido aprova, arquivo com `audit_sha` inválido reprova).
- **AC-111-2** — `xdescribe` bloqueado pelo `anti-mascaramento.js` junto com `xit`, `fit`, `fdescribe`. Verificação: `node tests/hooks/anti-mascaramento.test.js` retorna exit 0 com 2 casos novos (passa + bloqueia).
- **AC-111-3** — `plugin.json` marca `"version": "2.0.0"` e `docs/migrations/MIGRATION-v2.md` existe. Verificação: `node -e "process.exit(require('./plugin.json').version === '2.0.0' ? 0 : 1)"` retorna 0 + `test -f docs/migrations/MIGRATION-v2.md`.
- **AC-111-4** — Flag `ROLDAO_METHOD_LEGACY_MARKERS=1` reativa comportamento antigo (arquivo vazio aprova). Verificação: `ROLDAO_METHOD_LEGACY_MARKERS=1 node tests/hooks/legacy-markers.test.js` retorna 0.
- **AC-111-5** — Arquivo `docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md` lista cada ação B/A/C/D/E/F/G/H/I/J/K/L → T-NNN da story correspondente. Verificação: `grep -E '^\| (B|A|C|D|E|F|G|H|I|J|K|L)' docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md | wc -l` retorna ≥ 70.
- **AC-111-6** — 9 ações de alto impacto leigo movidas pro Sprint 1 entregues (G7, F1, J10, J12, J16, J19, J1, J2, I7). Verificação por arquivo: ver tasks T-016..T-024.
- **AC-111-7** — Commit T-004 (B4 + J6 + J7) é atômico em `anti-mascaramento.js`. Verificação: `git log --oneline --grep='T-004'` retorna 1 commit; `git show <sha> --stat` toca apenas `.claude/hooks/anti-mascaramento.js` e seu teste irmão.
- **AC-111-8** — ADR-020 e ADR-021 com `status: aceito`. Verificação: `grep -l 'status: aceito' docs/decisions/ADR-020-*.md docs/decisions/ADR-021-*.md` retorna 2 caminhos.

---

## Non-goals (INV-003)

- **Não** reescreve `analista.md`, `devops-infra.md`, `dba-dados.md` — fica pra US-112/US-114.
- **Não** muda Maestro nem statusline — fica pra US-113/US-115.
- **Não** cria `/o-que-aconteceu`, `npx roldao-method status`, `npx roldao-method undo` — fica pra US-116.
- **Não** publica no npm — Roldão roda `npm publish` manualmente após release fechada (US-116).
- **Não** refaz release notes antigas (v0.15.x) — J20 removido por scope creep.

---

## Contexto técnico

_(Investigador preenche antes de Bruno codar. Não inventar agora.)_

- **Arquivos afetados (esperado):** `.claude/hooks/require-auditors-pass-before-commit.js`, `.claude/hooks/require-checkpoint-before-merge.js`, `.claude/hooks/require-investigador-before-fix.js`, `.claude/hooks/anti-mascaramento.js`, `.claude/hooks/_lib.js`, `.claude/hooks/block-jargon-pt-br.js`, `plugin.json`, `continue/config.yaml`, `docs/migrations/MIGRATION-v2.md` (novo), `docs/PRIMEIRO-DIA.md` (novo), `docs/COMO-PEDIR-AJUDA.md` (novo), `docs/GLOSSARIO-IDS.md` (novo), `CHANGELOG.md`, `README.md`, `bin/roldao-method.js`, `docs/decisions/ADR-020-*.md` (novo), `docs/decisions/ADR-021-*.md` (novo).
- **Migrations necessárias:** Sim — formato de marker de auditor passa a exigir `audit_sha`. Flag `LEGACY_MARKERS` mantém compatibilidade 1 release.
- **ADRs relacionados:** ADR-020 (formato), ADR-021 (janela compat).

---

## Tasks

> Cada task vira 1 commit atômico citando o ID. Ordem sugerida na lista.

**Bloco B — Bypasses fechados:**

- [ ] **T-001** — B1: marker de aprovação de auditor exige `audit_sha` válido (não aceita arquivo vazio). Editar `require-auditors-pass-before-commit.js` linhas 108-111 (caminho que ensinava `touch`). + 2 testes adversariais.
- [ ] **T-002** — B2: marker de checkpoint exige SHA + `audit_sha` (refatorar `require-checkpoint-before-merge.js` linha 54). + testes.
- [ ] **T-003** — B3: GATE 2 do `require-investigador-before-fix.js` linha 68 deixa de ensinar bypass (mensagem de erro reescrita sem "basta criar arquivo X"). + teste.
- [ ] **T-004** — B4+J6+J7 consolidados: adicionar `xdescribe`, `fit`, `fdescribe` aos patterns do `anti-mascaramento.js` (commit atômico — AC-111-7). + 2 testes adversariais.
- [ ] **T-005** — B5: adicionar `audit_sha` ao shape canônico de marker em `_lib.js` (helper `parseAuditMarker`). + teste unitário.

**Bloco A — Versionamento e janela de compatibilidade:**

- [ ] **T-006** — A1: bump versão pra `2.0.0` em `plugin.json` e `continue/config.yaml` (sincronizado).
- [ ] **T-007** — A2: criar `docs/migrations/MIGRATION-v2.md` cobrindo: shape novo de marker, flag `LEGACY_MARKERS`, ações pra projetos terceiros atualizarem.
- [ ] **T-008** — A3: implementar flag `ROLDAO_METHOD_LEGACY_MARKERS=1` em `_lib.js` (helper `useLegacyMarkers()`) — quando ativa, hooks de aprovação aceitam arquivo vazio (comportamento v1). + teste.
- [ ] **T-009** — A4: statusline mostra aviso `[LEGACY MARKERS ATIVO]` quando flag ligada. Editar `statusline.js`.
- [ ] **T-010** — A5: escrever ADR-020 (contrato `audit_sha` — formato canônico do marker).
- [ ] **T-011** — A6: escrever ADR-021 (janela de compatibilidade `LEGACY_MARKERS` por 1 release).

**Bloco G — Outros bloqueadores do plano original (G1..G4):**

- [ ] **T-012** — G1: criar `docs/auditorias/2026-05-24-auditoria-10-agentes/MAPEAMENTO-T-NNN.md` com mapeamento B/A/C/D/E/F/G/H/I/J/K/L → T-NNN da story correspondente (AC-111-5).
- [ ] **T-013** — G2: adicionar seção `## Non-goals` neste arquivo (já feito — confirmar).
- [ ] **T-014** — G3: revisar `commit-message-validator.js` pra **não** colidir com hook existente; documentar interação no comentário do hook.
- [ ] **T-015** — G4: validar que decisões obrigatórias do Roldão estão pré-tomadas no cabeçalho do PRD-003 (já feito — confirmar com `grep`).

**Ações movidas pro Sprint 1 (alto impacto leigo — AC-111-6):**

- [ ] **T-016** — G7: prefixo padronizado em mensagens de erro do `_lib.js` (helper `logBlocked(motivo, comoCorrigir)` — pré-req de B5 e H6).
- [ ] **T-017** — F1: regex de jargão expandida em `block-jargon-pt-br.js` cobrindo termos do `kb-traduzir-jargao` (lista inicial — termos restantes ficam pra US-114). + teste.
- [ ] **T-018** — J10: `audit_sha` padronizado em todas as aprovações (genericamente — não só auditor; aplica também a `validate-story-approvals.js`).
- [ ] **T-019** — J12: adicionar GIF/vídeo demonstrativo no topo do README.md (link pra asset versionado em `docs/assets/`).
- [ ] **T-020** — J16: `npx roldao-method` (sem argumento) mostra menu PT-BR com 5 opções principais (`install`, `update`, `doctor`, `search`, `help`). Editar `bin/roldao-method.js`. + teste.
- [ ] **T-021** — J19: CHANGELOG.md ganha bloco modelo pro leigo (exemplo no topo: "como ler este arquivo" + bullets em linguagem de impacto pro cliente).
- [ ] **T-022** — J1: criar `docs/PRIMEIRO-DIA.md` — guia de 1 página em PT-BR claro pra Roldão usar o framework no primeiro dia.
- [ ] **T-023** — J2: criar `docs/COMO-PEDIR-AJUDA.md` — receitas curtas em PT-BR pra reportar bug, pedir feature, fechar release.
- [ ] **T-024** — I7: criar `docs/GLOSSARIO-IDS.md` — explica o que é T-NNN, US-NNN, AC-NNN-N, EP-NNN, PRD-NNN, ADR-NNN em PT-BR (pra Roldão ler commit `feat(T-031): ...` e entender).

**Cobertura adicional (auditor 1):**

- [ ] **T-025** — K3: bloco "este arquivo é pro assistente de IA" no topo de `AGENTS.md` e `CLAUDE.md` (avisar Roldão que o conteúdo é pra IA, não pra ele).

---

## Testes esperados

- **Unitário:** cada hook tocado (T-001..T-005, T-008, T-009, T-017, T-020) ganha 2 testes adversariais (passa + bloqueia) em `tests/hooks/*.test.js`.
- **Integração:** `tests/integration/legacy-markers.test.js` — fluxo completo `/feature` com `ROLDAO_METHOD_LEGACY_MARKERS=1` ainda aprova; sem flag, exige `audit_sha`.
- **E2E:** N/A nesta story (E2E vive em US-114/US-116).

---

## Regulamentação BR aplicável

- **INV-003** — Non-goals declarados (seção própria + PRD §5).
- **INV-004** — Mapeamento B/A/C/... → T-NNN em T-012 (AC-111-5) garante que `commit-message-validator.js` não bloqueia.
- **INV-AGENT-004** — Verificar antes de afirmar. T-001..T-004 fecham bypass que permitia aprovação fake.
- **INV-AGENT-006** — Executar, não passar pro usuário. T-003 reescreve mensagem de erro que ensinava bypass (que era forma indireta de passar decisão pro usuário "fugir do hook").
- **TST-001** — Nunca mascarar teste que falha. T-004 fecha `xdescribe` + `fit` + `fdescribe`.
- **SEC-002** — Nenhum comando destrutivo executado pelo agente nesta story.

---

## Status

- [x] draft
- [ ] aprovada (gerente-produto OK)
- [ ] em implementação (dev-senior em ação)
- [ ] revisão (revisor avaliando)
- [ ] entregue (auditores OK ou dispensados)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-24 | gerente-produto (Sofia) | criação a partir de EP-002 / PRD-003 §4.US-111 |

---

## Dev Agent Record (preencher ao implementar)

- **Agente principal:** _(a definir — dev-senior — Bruno)_
- **Modelo usado:** _(a registrar)_
- **Custo aproximado:** _(a registrar)_
- **Tempo total:** _(a registrar)_
- **Arquivos tocados:** _(a registrar com `git diff --stat`)_
- **Tasks concluídas:** _(T-001..T-025 — preencher na entrega)_
- **Hooks que bloquearam:** _(registrar quais hooks dispararam)_
- **Decisões fora do PRD:** _(se houve, virar ADR)_
- **Skills invocadas:** _(brainstormar-ideia, validar-cpf-cnpj, gerar-test-fixture-br)_
- **Subagentes invocados:** _(investigador → tech-lead → dev-senior → revisor → 3 auditores)_
- **Bloqueios encontrados:** _(input pra `/retro`)_
