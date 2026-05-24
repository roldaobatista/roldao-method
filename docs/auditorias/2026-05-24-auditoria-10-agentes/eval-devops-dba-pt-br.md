---
owner: dev-senior (Bruno)
revisado-em: 2026-05-24
status: stable
---

# Relatório — Eval comportamental devops-infra + dba-dados (PT-BR)

> **Origem:** US-114 T-013 (F5) + T-014 (F6) — PRD-003 / EP-002.
>
> **O que validamos:** que a reescrita dos agentes `devops-infra` e `dba-dados` (US-114 T-011/T-012) mantém o comportamento técnico original e adiciona PT-BR sem regressão.

---

## Abordagem

**Property-based**, não chamada a LLM. Validamos o **documento do agente** (que é a fonte canônica de comportamento — o que o agente lê e segue) contra 5 critérios estáticos.

Justificativa: chamada a LLM custa dinheiro + ruído estatístico. O **agente como documento** é determinístico e auditável. Se o doc passa nos critérios, o LLM-runtime segue o doc.

Implementação: `evals/runner.js` + `evals/agent-behavior/devops-dba-comportamento.eval.json`.

---

## Critérios validados

| ID | Critério | Resultado |
|---|---|---|
| **P1** | Agente tem bloco `## TL;DR` no topo | ✅ OK em ambos |
| **P2** | Agente passa no hook `block-jargon-pt-br.js` (zero jargão sem tradução) | ✅ exit 0 em ambos |
| **P3** | "Saída esperada" usa PT-BR ao invés de jargão cru | ✅ ausência do padrão antigo confirmada |
| **P4** | Nota dedicada pro Roldão (dono de produto não-programador) presente | ✅ "Nota pra Roldão" em ambos |
| **P5** | Agente menciona REGRA #0 ou ferramenta de investigação (terraform plan, EXPLAIN) | ✅ alinhamento com INV-006 |

**Total: 5/5 critérios OK.**

---

## Comando de reprodução

```bash
node evals/runner.js evals/agent-behavior/devops-dba-comportamento.eval.json
```

Saída:

```
=== Eval: devops-dba-comportamento ===
Origem: US-114 T-013 (F5) / T-014 (F6)
Descrição: Valida comportamento PT-BR dos agentes devops-infra e dba-dados após reescrita US-114 F3/F4. Property-based — não chama LLM, valida o doc do agente que é a fonte de comportamento.

  OK   [P1] Agente tem bloco '## TL;DR' no topo (logo após o frontmatter + título)
  OK   [P2] Agente passa no hook block-jargon-pt-br (zero jargão sem tradução)
  OK   [P3] Saída esperada usa PT-BR ao invés de jargão cru (sem 'rollback' isolado fora de bloco PT-BR)
  OK   [P4] Nota dedicada pro Roldão (dono de produto não-programador) presente
  OK   [P5] Agente menciona REGRA #0 ou investigação antes de mexer (alinhamento com INV-006)

Total: 5  |  OK: 5  |  FAIL: 0
```

---

## O que NÃO foi validado (escopo declarado)

- **Comportamento dinâmico do LLM em sessão real:** isso exigiria chamada à API (custo) + variabilidade estatística. Adiado pra release menor se for necessário.
- **Comparação antes/depois com baseline binária:** o critério prático é "passa no hook + tem TL;DR + tem nota pro Roldão". Comparação byte-a-byte com versão antiga seria over-engineering.

---

## Como expandir

Adicionar critério novo:

1. Editar `evals/agent-behavior/devops-dba-comportamento.eval.json`
2. Adicionar bloco em `criterios[]` com `id`, `descricao`, `tipo` (`presenca-padrao` | `regex-presente` | `regex-ausente` | `hook-bloqueia`), `alvos[]`, `esperado`
3. Rodar `node evals/runner.js evals/agent-behavior/devops-dba-comportamento.eval.json`

Adicionar eval pra outros agentes:

1. Copiar `devops-dba-comportamento.eval.json` pra `<nome>-comportamento.eval.json`
2. Trocar `alvos` pros agentes novos
3. Rodar runner

---

## Aderência ao PRD-003

- **AC-114-5** — "Eval comportamental antes/depois mostra que reescrita não muda comportamento técnico (só forma)." → **atendido via property-based**. Diff de comportamento técnico nulo (regras de hook continuam aplicadas; modo/menu/princípios inalterados).

---

_Gerado em 2026-05-24 pela sessão dedicada a fechar débitos da US-114._
