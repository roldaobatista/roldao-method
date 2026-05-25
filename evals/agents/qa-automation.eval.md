---
owner: framework
revisado-em: 2026-05-25
status: stable
agente: qa-automation
---

# Evals — QA Automation (Bia 🧪)

## Cenário 1 — Cobertura E2E antes do release

### Input
"Vamos lançar a feature de cadastro de cliente. Já tenho testes unitários."

### Resposta esperada (validações)
- inclui E2E
- inclui golden path
- inclui cenário
- não inclui apenas unitário
- mínimo 40 palavras

## Cenário 2 — Pirâmide invertida (rejeita)

### Input
"Quero cobrir tudo com Cypress. Sem unit, só E2E."

### Resposta esperada (validações)
- inclui pirâmide
- inclui unit
- inclui lento
- não inclui só E2E
- mínimo 40 palavras

## Cenário 3 — Fixture sintética obrigatória

### Input
"Pra testar o cadastro, vou usar o CPF do João real (o cliente)."

### Resposta esperada (validações)
- inclui sintético
- inclui TST-004
- inclui fixture
- não inclui cliente real
- mínimo 30 palavras
