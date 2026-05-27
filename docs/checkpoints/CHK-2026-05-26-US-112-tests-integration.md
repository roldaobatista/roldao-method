---
owner: dev-senior
revisado-em: 2026-05-26
status: stable
story: US-112
ac-fechados-nesta-sessao: [AC-112-4, AC-112-5]
audit_sha: 7d264271cb96252a50b02c960489caddd5b6b59b46ee86ecd84c5091012e6689
session: default
---

# CHK-2026-05-26 — US-112 fecha AC-112-4 + AC-112-5 (tests integration)

## Proposito em 1 frase

Codificar em teste property-based que os 4 agentes que poderiam devolver pergunta evitavel (analista, dba-dados, devops-infra, gerente-produto) declaram protocolo anti-pergunta-evitavel + que `/prd` dispara `AskUserQuestion` automatico a partir de premissas.

## O que muda pro cliente (nao-programador)

- **Antes:** o contrato "agente nao devolve pergunta evitavel" vivia so como doutrina no doc do agente. Se alguem editasse o doc removendo a parte (acidente ou regressao), nada barrava.
- **Depois:** test/integration valida automaticamente que cada agente continua honrando o contrato. Doc sem `INV-AGENT-006` ou com antipattern "perguntas pendentes pro PM" falha o teste.

## Non-goals respeitados

- Nao mexe em codigo de producao.
- Nao chama LLM — property-based puro.
- Nao adiciona dependencia.
- Nao cobra acentuacao (compat ASCII).

## Riscos

| Risco | Mitigacao |
|---|---|
| Teste rigido demais quebrar refactor legitimo do agente | Mecanismo P1 aceita 5 sinonimos (premissa OU assume OU investiga OU "escolhe pelo contexto" OU "aplica direto") |
| Falso positivo em antipattern | Regex especifica: "perguntas pendentes pro PM" e "pergunta padrao de X" — frases canonicas do bug original (auditoria 2026-05-24) |

## Decisoes dos auditores

- **Caio (auditor-seguranca):** APROVADO. So tests, zero secret/PII/path-traversal.
- **Julia (auditor-qualidade):** APROVADO. 10/10 + 5/5 OK. Pattern consistente com evals/agent-behavior. Zero mascaramento.
- **Pedro (auditor-produto):** APROVADO PRO CLIENTE. Cumpre AC-112-4 + AC-112-5 + K7. Mensagens PT-BR claras.

## Status final

| AC | Status |
|---|---|
| AC-112-4 | **ENTREGUE** — test + 10 propriedades validadas |
| AC-112-5 | **ENTREGUE** — test + 5 propriedades validadas |
