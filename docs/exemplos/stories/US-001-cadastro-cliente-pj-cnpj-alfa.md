---
tipo: story
id: US-001
versao: 1
status: entregue
prd: PRD-002
epico: EP-003
tamanho: M
owner: bruno.dev
revisado-em: 2026-05-18
depende-de: []
---

# US-001 — Aceitar CNPJ alfanumérico no cadastro de cliente PJ

> Story de exemplo gerada pelo `/historia` — usada como referência canônica de "como uma story preenchida fica". Mostra todos os campos vivos, não apenas o template em branco. Se você quer entender o que o framework espera de uma US, leia esta.

---

## Como, quero, para

**Como** contador usuário da SaaS RoldãoContábil,
**quero** cadastrar PJ usando CNPJ no novo formato alfanumérico (`12ABC34501DE35`)
**para** atender clientes constituídos a partir de julho/2026, quando a Receita Federal passa a emitir CNPJ alfanumérico.

---

## Critérios de aceitação

- **AC-001-1** — Dado um CNPJ alfanumérico válido (`12ABC34501DE35`), quando o usuário submete o cadastro, então o sistema persiste o CNPJ exatamente como digitado (preservando case) e retorna sucesso.
- **AC-001-2** — Dado um CNPJ alfanumérico com dígito verificador inválido, quando o usuário submete, então o sistema rejeita com mensagem "CNPJ inválido — confira os 2 últimos dígitos" e NÃO grava no banco.
- **AC-001-3** — Dado um CNPJ numérico legado (`12345678000195`), quando o usuário submete, então o sistema continua aceitando (compatibilidade retroativa — FISCAL-005).
- **AC-001-4** — Dado um CNPJ com caracteres fora de `[0-9A-Z]` (ex: `12abc-34501de35`), quando o usuário submete, então o sistema normaliza (uppercase, remove pontuação) antes de validar.
- **AC-001-5** — Dado a tela de cadastro, quando o usuário cola CNPJ formatado (`12.ABC.345/01DE-35`), então o input aceita e normaliza para `12ABC34501DE35` no submit.

---

## Non-goals (INV-003)

O que esta story NÃO faz:

- Não migra CNPJs já cadastrados (vai virar US separada — `US-002 backfill validação retroativa`).
- Não consulta a Receita Federal pra validar se o CNPJ existe na base oficial — só valida algoritmo do dígito.
- Não atualiza relatórios fiscais (SPED, NF-e) — escopo isolado em cadastro.
- Não muda integração com bureaus de crédito (Serasa, SPC) — vira US-005.

---

## Contexto técnico

> Preenchido pelo Investigador (Detetive 🔬) na Etapa 2 do `/feature`. Lido do código real, não inventado.

- **Arquivos afetados:**
  - `src/cadastro/cliente-pj-form.tsx` (validação de input)
  - `src/cadastro/cliente-pj-service.ts` (persistência)
  - `src/cadastro/cliente-pj.schema.sql` (coluna `cnpj VARCHAR(14)` — confirmado, já não é BIGINT)
  - `src/lib/validators/cnpj.ts` (lógica de DV — precisa estender pro alfanumérico)
- **Entidades/handlers:** `ClientePJ`, `CadastroClienteHandler`, `ValidadorCNPJ`.
- **Migrations necessárias:** Nenhuma. Schema já é `VARCHAR(14)` desde 2025-11 (verificado em `migrations/20251104-cnpj-varchar.sql`).
- **ADRs relacionados:** ADR-007 (decisão de `VARCHAR(14)` ao invés de tabela separada). Sem novo ADR necessário — feature está dentro do guard-rail existente.
- **Skill aplicável:** `validar-cpf-cnpj` (já suporta alfanumérico desde core v0.4).

---

## Tasks

> Cada task = 1 commit atômico citando o ID.

- [x] **T-001** — Estender `src/lib/validators/cnpj.ts` para aceitar `[0-9A-Z]{12}` + cálculo de DV módulo 11 com pesos. (commit `feat: cnpj alfanum (US-001 T-001)`)
- [x] **T-002** — Atualizar `cliente-pj-form.tsx` com input mask que aceita letras + normalização no `onBlur`. (commit `feat: input mask cnpj alfa (US-001 T-002)`)
- [x] **T-003** — Adicionar 12 testes unitários no `__tests__/validators/cnpj.test.ts` cobrindo: válido alfa, inválido alfa, válido numérico legado, normalização, edge cases (vazio, espaço, 13 chars). (commit `test: cnpj alfa (US-001 T-003)`)
- [x] **T-004** — Atualizar mensagem de erro em PT-BR claro (sem jargão — INV-AGENT-001). (commit `feat: mensagem cnpj pt-br (US-001 T-004)`)

---

## Testes esperados

- **Unitário:** `validators/cnpj.test.ts` — 12 casos (válido alfa, inválido alfa, válido numérico, malformado, normalização, case-insensitivity).
- **Integração:** `cadastro-cliente-pj.integration.test.ts` — 4 cenários (cadastra alfa, rejeita inválido, cadastra numérico, retorna 400 em payload incorreto). Roda contra Postgres real (TST-003, não mockar banco).
- **E2E (Playwright):** `e2e/cadastro-cliente-pj.spec.ts` — 1 jornada: contador abre tela, cola CNPJ alfa, salva, vê na lista.

---

## Regulamentação BR aplicável

- **FISCAL-005** — CNPJ alfanumérico em vigor a partir de 2026-07. Persistência precisa ser `VARCHAR(14)` (confirmado).
- **LGPD-003** — Minimização: CNPJ é dado de PJ, não pessoa física. Não há dado pessoal sensível nesta US, mas o handler de cadastro guarda razão social e endereço — esses já têm base legal documentada (`art. 7º, V — execução de contrato`).
- **TST-004** — Dados de teste sintéticos: usar geradores algorítmicos do skill `gerar-test-fixture-br`, nunca CNPJ de cliente real.

---

## Status

- [x] draft
- [x] aprovada (gerente-produto OK em 2026-05-15)
- [x] em implementação (dev-senior — Bruno — em 2026-05-16)
- [x] revisão (revisor Inês ✅ em 2026-05-17)
- [x] entregue (auditores ✅ em 2026-05-18; revisar release em 2026-05-20)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-15 | gerente-produto (Sofia) | criação a partir de `/historia "cadastro PJ CNPJ alfa"` |
| 2026-05-15 | investigador (Detetive) | preencheu contexto técnico |
| 2026-05-16 | dev-senior (Bruno) | implementação T-001..T-004 |
| 2026-05-17 | revisor (Inês) | aprovado com 1 ressalva (mensagem de erro PT-BR — corrigida em T-004) |
| 2026-05-18 | auditores (Caio/Júlia/Pedro) | 3 APROVADOS sem ressalvas. Story entregue. |

---

## Dev Agent Record

> Rastreabilidade da execução IA. Preenche o agente que rodou `/feature`.

- **Agente principal:** dev-senior (Bruno)
- **Modelo usado:** claude-sonnet-4-6
- **Custo aproximado:** ~480k tokens, ~USD 1.40
- **Tempo total:** 38 minutos (interativo) + 4 minutos auditores
- **Arquivos tocados:** 4 (`cnpj.ts`, `cliente-pj-form.tsx`, `__tests__/validators/cnpj.test.ts`, mensagem PT-BR em `i18n/pt-BR/cadastro.json`)
- **Tasks concluídas:** T-001 ✅, T-002 ✅, T-003 ✅, T-004 ✅
- **Hooks que bloquearam:**
  - `no-test-data-in-fixtures.sh` disparou 1× quando dev tentou usar CNPJ real numa fixture — Bruno trocou pelo gerador `gerar-test-fixture-br`.
  - `block-jargon-pt-br.sh` flagou "validation failed" — substituído por "CNPJ inválido — confira os 2 últimos dígitos".
- **Decisões fora do PRD:** nenhuma — ficou no escopo da US.
- **Skills invocadas:** `validar-cpf-cnpj` (verificação durante dev), `gerar-test-fixture-br` (3 CNPJs alfa válidos pra fixtures), `traduzir-jargao` (mensagem de erro).
- **Subagentes invocados:** investigador (Etapa 2), revisor (Etapa 5), auditor-seguranca + auditor-qualidade + auditor-produto (Etapa 6 paralela).
- **Bloqueios encontrados:** zero — readiness EP-003 estava `PRONTO`, nenhuma dependência pendente.

### Debug log

```
2026-05-16 09:12 — investigador identificou que ADR-007 já cobre VARCHAR(14)
2026-05-16 09:18 — dev-senior estendeu validator + criou 12 testes (TDD)
2026-05-16 10:30 — hook anti-mascaramento.sh OK (nenhum .skip / @ts-ignore)
2026-05-16 10:45 — revisor pediu mensagem mais clara em PT-BR → T-004
2026-05-17 14:00 — auditor-seguranca: APROVADO (sem secrets, sem regex inseguro)
2026-05-17 14:00 — auditor-qualidade: APROVADO (cobertura 100% no validator, integration tests reais)
2026-05-17 14:00 — auditor-produto: APROVADO (5 ACs verificáveis, non-goals respeitados)
2026-05-18 09:00 — release scheduled p/ 2026-05-20
```
