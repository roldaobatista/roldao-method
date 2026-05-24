---
tipo: story
id: US-042
versao: 1
status: aprovada
prd: PRD-007
epico: EP-003
tamanho: M
owner: gerente-produto (Sofia)
revisado-em: 2026-05-24
depende-de: []
aprovacoes:
  - etapa: gerente-produto
    agente: Sofia
    data: 2026-05-20
    status: aprovado
    notas: "AC testáveis, non-goals OK, persona clara"
  - etapa: investigador
    agente: Detetive
    data: 2026-05-21
    status: aprovado
    notas: "Confirmado: tabela clientes já tem coluna cpf VARCHAR(14), só falta validador"
---

# US-042 — Validar CPF no cadastro de cliente

> Story file gerado pelo `/historia`. Vive em disco, não na conversa (INV-001).

---

## Como, quero, para

**Como** atendente do balcão da loja,
**quero** que o sistema avise quando eu digito um CPF inválido no cadastro
**para** não cadastrar cliente com documento errado e descobrir só na hora de emitir nota.

---

## Critérios de aceitação

- **AC-042-1** — Quando o atendente digita um CPF e clica em "Salvar", o sistema valida os dígitos verificadores antes de gravar. Verificação: teste unitário com 5 CPFs válidos sintéticos + 5 inválidos retorna 0.
- **AC-042-2** — Se o CPF for inválido, aparece mensagem em PT-BR claro abaixo do campo ("CPF digitado não é válido — confira os números") e o foco volta pro campo. Verificação: teste E2E (Playwright) clica em "Salvar" com CPF `111.111.111-12` e valida mensagem.
- **AC-042-3** — A validação aceita CPF com ou sem máscara (`123.456.789-09` ou `12345678909`). Verificação: 2 testes unitários cobrem ambas as entradas.
- **AC-042-4** — A validação NÃO faz chamada externa (Receita Federal, API de consulta). Só algoritmo local de dígito verificador. Verificação: revisão de código (grep por `fetch|axios|http` em `src/validacao/cpf.ts` retorna 0).

---

## Non-goals (INV-003)

O que esta story NÃO faz:

- **Não** valida CNPJ (vai pra US-043 separada).
- **Não** consulta situação cadastral na Receita Federal (custo de integração não justificado pra v1).
- **Não** valida CPF de menor de idade com regra específica (regra de negócio do setor, fora do escopo).

---

## Contexto técnico

- **Arquivos afetados:** `src/validacao/cpf.ts` (novo), `src/clientes/CadastroCliente.tsx` (chamar validador no `onSubmit`), `tests/unit/cpf.test.ts` (novo).
- **Entidades/handlers:** `Cliente.cpf` (campo já existe — `VARCHAR(14)`, schema `clientes`).
- **Migrations necessárias:** Não. Coluna já existe.
- **ADRs relacionados:** ADR-0014 — política de validação só local (sem RFB).

---

## Tasks

- [x] **T-001** — Implementar `validarCpf(input: string): boolean` em `src/validacao/cpf.ts` com algoritmo módulo 11. Suporta entrada com e sem máscara.
- [x] **T-002** — Escrever 10 testes unitários (5 válidos + 5 inválidos) em `tests/unit/cpf.test.ts`. Usar skill `gerar-test-fixture-br` pros CPFs.
- [x] **T-003** — Integrar `validarCpf` no `onSubmit` do `CadastroCliente.tsx`. Mostrar mensagem PT-BR + manter foco.
- [x] **T-004** — Teste E2E com Playwright em `tests/e2e/cadastro-cpf-invalido.spec.ts`.

---

## Testes esperados

- **Unitário:** `validarCpf` — 10 casos (5 válidos, 5 inválidos), incluindo `000.000.000-00`, `111.111.111-11` (todos dígitos repetidos = sempre inválido).
- **Integração:** `CadastroCliente` componente — simula `onSubmit` com CPF inválido, espera mensagem em PT-BR.
- **E2E:** `tests/e2e/cadastro-cpf-invalido.spec.ts` — preenche formulário, clica em "Salvar", valida UI.

---

## Regulamentação BR aplicável

- **LGPD-001** — Coleta de CPF do cliente. Base legal: execução de contrato (compra/venda no balcão).
- **LGPD-003** — Minimização. CPF coletado só pra emitir nota fiscal (obrigação legal). Não usado pra outro fim.
- **FISCAL-005** — A coluna `cpf` é `VARCHAR(14)` desde o início — preparada pra CNPJ alfanumérico jul/2026 quando entrar a US-043.

---

## Status

- [x] draft
- [x] aprovada (gerente-produto OK)
- [x] em implementação (dev-senior em ação)
- [x] revisão (revisor avaliando)
- [x] entregue (auditores OK)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-20 | gerente-produto (Sofia) | criação a partir de PRD-007 §3 |
| 2026-05-21 | investigador (Detetive) | contexto técnico preenchido |
| 2026-05-22 | dev-senior (Bruno) | T-001 a T-004 implementadas |
| 2026-05-23 | revisor (Inês) | aprovado, 1 ressalva no teste E2E (resolvida) |

---

## Dev Agent Record

- **Agente principal:** dev-senior — Bruno
- **Modelo usado:** claude-sonnet-4-6
- **Custo aproximado:** ~14.000 tokens, US$ 0,06
- **Tempo total:** 38 min
- **Arquivos tocados:** `src/validacao/cpf.ts`, `src/clientes/CadastroCliente.tsx`, `tests/unit/cpf.test.ts`, `tests/e2e/cadastro-cpf-invalido.spec.ts` (4 arquivos, +127 -4 linhas)
- **Tasks concluídas:** T-001 ✓, T-002 ✓, T-003 ✓, T-004 ✓
- **Hooks que bloquearam:** `no-test-data-in-fixtures.js` bloqueou na primeira tentativa (eu tinha colado um CPF real do StackOverflow). Resolvido usando skill `gerar-test-fixture-br`.
- **Decisões fora do PRD:** Nenhuma.
- **Skills invocadas:** `gerar-test-fixture-br` (gerou 5 CPFs válidos sintéticos), `validar-cpf-cnpj` (referência do algoritmo).
- **Subagentes invocados:** investigador (Detetive), tech-lead (Rafael), revisor (Inês), auditor-seguranca (Caio).
- **Bloqueios encontrados:** Um. CPF real em fixture (hook bloqueou — comportamento esperado).
