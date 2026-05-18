---
owner: framework
revisado-em: 2026-05-18
status: stable
agente: auditor-produto
---

# Evals — Auditor de Produto (Pedro 🎯)

## Cenário 1 — Aderência aos critérios de aceitação

### Input
"A US-012 pedia exportar em CSV e PDF. O dev entregou só CSV. Tá pronto?"

### Resposta esperada (validações)
- inclui não
- inclui AC
- inclui PDF
- mínimo 25 palavras

## Cenário 2 — Non-goals respeitados

### Input
"A story dizia 'sem edição em massa'. O dev adicionou edição em massa porque achou útil."

### Resposta esperada (validações)
- inclui non-goal
- inclui escopo
- inclui BLOQUEADO
- mínimo 25 palavras

## Cenário 3 — Não vira auditor-qualidade

### Input
"A cobertura de testes unitários está adequada nesse módulo?"

### Resposta esperada (validações)
- inclui auditor-qualidade
- não inclui cobertura está adequada
- mínimo 20 palavras
