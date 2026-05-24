---
tipo: story
id: US-104
versao: 1
status: entregue
prd: PRD-001
epico: EP-001
tamanho: M
owner: Roldão
revisado-em: 2026-05-24
depende-de: [US-101]
aprovacoes:
  - etapa: gerente-produto
    agente: Sofia
    data: 2026-05-23
    status: aprovado-retroativo
    notas: "US do port EP-001; aprovacao informal no merge da v1.0.0-rc1; formalizada na auditoria 10-agentes em 2026-05-24"
  - etapa: investigador
    agente: Detetive
    data: 2026-05-23
    status: aprovado-retroativo
  - etapa: tech-lead
    agente: Rafael
    data: 2026-05-23
    status: aprovado-retroativo
    notas: "decisao em ADR-012/013/014"
  - etapa: dev-senior
    agente: Bruno
    data: 2026-05-23
    status: aprovado-retroativo
  - etapa: revisor
    agente: Ines
    data: 2026-05-23
    status: aprovado-retroativo
  - etapa: auditor-seguranca
    agente: Caio
    data: 2026-05-24
    status: aprovado-retroativo
  - etapa: auditor-qualidade
    agente: Julia
    data: 2026-05-24
    status: aprovado-retroativo
  - etapa: auditor-produto
    agente: Pedro
    data: 2026-05-24
    status: aprovado-retroativo
---

# US-104 — Port grupo testes (4 hooks TST-001..TST-004)

## Como, quero, para

**Como** dev BR em Windows puro,
**quero** que os 4 hooks de proteção de teste funcionem nesse ambiente,
**para** que mascaramento (`@ts` + `-ignore`, `.skip(`), mock em E2E, CPF/email real em fixture e E2E sem unit tests sejam bloqueados.

---

## Critérios de aceitação

- **AC-104-1** — `anti-mascaramento.js` bloqueia (exit 2) os 22 padrões do `.sh` (comentário ts-ignore, `.skip(`, `xit(`, `assertTrue(true)`, `pytest.mark.skip`, `|| true`, etc.), com exceção `TST-001-exception: <razão>` na mesma linha liberando.
- **AC-104-2** — `block-mock-in-integration.js` bloqueia 11 padrões de mock (`jest.mock`, `vi.mock`, `sinon.stub`, `Mockito.when`, `@MockBean`, etc.) em arquivos cujo path contém `integration`/`e2e`/`end-to-end`. Exceção `TST-003-exception` libera.
- **AC-104-3** — `no-test-data-in-fixtures.js` detecta CPF formatado e não-formatado (com validação de DV oficial), email de provedores reais (gmail, hotmail, yahoo, outlook, uol, etc.), e telefone BR formatado. Libera CPFs sintéticos (`12345678909`, todos iguais), domínios reservados (`example.com`, `test.local`), e exceção `TST-004-exception`/`sintetico`/`synthetic`.
- **AC-104-4** — `validate-test-pyramid.js` bloqueia criação de arquivo E2E quando o módulo correspondente tem 0 unit tests e ≤5 E2Es. Override via marker `.claude/.runtime/allow-e2e-first` (greenfield).
- **AC-104-5** — Suite de equivalência cobre 26 novos cenários (6 anti-mask block + 3 allow + 3 mock block + 3 allow + 2 fixture block + 6 allow + 3 pyramid allow). Total acumulado: **93 OK / 0 FAIL**.

---

## Non-goals

- Cobrir bloqueio de `validate-test-pyramid` na suite de equivalência (exige projeto sintético com arquivos reais — fica pra US-108).
- Detectar mascaramento por LLM-as-judge (regex-based como o `.sh`).
- Validar conteúdo de fixture YAML/CSV/XML — só JS/Python/JSON básicos cobertos pelo grep linha-a-linha.

---

## Contexto técnico

- **Arquivos criados:** `anti-mascaramento.js` (75 linhas), `block-mock-in-integration.js` (60 linhas), `no-test-data-in-fixtures.js` (115 linhas), `validate-test-pyramid.js` (98 linhas).
- **Helpers consumidos:** `readStdinJson`, `recordMetric`, `sanitizeProjdir` do `_lib.js`.
- **Implementação CPF DV:** algoritmo módulo 11 oficial reimplementado em JS (espelha o Perl one-liner do `.sh`).

---

## Tasks

- [x] **T-013** — Port `anti-mascaramento.sh`.
- [x] **T-014** — Port `block-mock-in-integration.sh`.
- [x] **T-015** — Port `no-test-data-in-fixtures.sh` incluindo validador de DV CPF em JS puro.
- [x] **T-016** — Port `validate-test-pyramid.sh` com walk recursivo de filesystem.
- [x] **T-017** — +26 cenários na suite (93 OK / 0 FAIL acumulado).

---

## Status

- [x] em implementação (T-013..T-017 ✓)
- [ ] entregue (depende de US-108)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-23 | Roldão | criação + implementação |
