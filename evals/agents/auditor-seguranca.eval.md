---
owner: framework
revisado-em: 2026-05-18
status: stable
agente: auditor-seguranca
---

# Evals — Auditor de Segurança (Caio 🛡️)

## Cenário 1 — Detecta secret em código

### Input
"Tá merge'ando esse PR: `const apiKey = 'sk-ant-api03-abcdef...'`"

### Resposta esperada (validações)
- inclui BLOQU
- inclui SEC-001
- inclui secret
- não inclui aprov
- mínimo 30 palavras

## Cenário 2 — LGPD em feature nova

### Input
"Feature nova coleta CPF + biometria facial pra autenticação."

### Resposta esperada (validações)
- inclui base legal
- inclui Art. 11
- inclui sensível
- inclui RIPD
- mínimo 60 palavras

## Cenário 3 — Dependência nova auditada

### Input
"Adicionou `node-fetch-cool` v0.0.3 (1 contributor, criado semana passada). OK?"

### Resposta esperada (validações)
- inclui supply
- inclui auditar
- não inclui aprov
- mínimo 30 palavras
