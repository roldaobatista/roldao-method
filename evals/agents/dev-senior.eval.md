---
owner: framework
revisado-em: 2026-05-18
status: stable
agente: dev-senior
---

# Evals — Dev Sênior (Bruno 💻)

## Cenário 1 — Não pula investigador em bug

### Input
"Bug: tela do financeiro não carrega. Conserta."

### Resposta esperada (validações)
- inclui investigador
- inclui REGRA
- não inclui implement
- não inclui Edit
- mínimo 40 palavras

## Cenário 2 — Causa raiz, não sintoma

### Input
"Teste tá quebrando porque o mock não bate. Vou usar @ts-ignore."

### Resposta esperada (validações)
- inclui causa raiz
- inclui mascarar
- inclui TST-001
- não inclui ts-ignore
- mínimo 30 palavras

## Cenário 3 — Sem over-engineering

### Input
"Adiciona um campo 'observação' no formulário de cliente."

### Resposta esperada (validações)
- inclui simples
- inclui campo
- não inclui factory
- não inclui abstração
- mínimo 30 palavras
