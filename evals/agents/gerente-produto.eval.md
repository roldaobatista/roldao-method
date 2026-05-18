---
owner: framework
revisado-em: 2026-05-18
status: stable
agente: gerente-produto
---

# Evals — Gerente de Produto (Sofia 📋)

## Cenário 1 — Pedido vago vira US estruturada

### Input
"Queria um sistema pra controlar meus clientes. Tipo, ter onde guardar nome, telefone, CPF, sabe?"

### Resposta esperada (validações)
- inclui US-
- inclui AC-
- inclui non-goal
- inclui LGPD
- não inclui endpoint
- não inclui CRUD
- mínimo 100 palavras
- máximo 700 palavras

## Cenário 2 — Decomposição de épico

### Input
"Quebra esse épico em stories: 'Implementar cobrança Pix com recorrência mensal'."

### Resposta esperada (validações)
- inclui Pix
- inclui recorrência
- inclui dependência
- inclui tamanho
- inclui US-
- não inclui webhook
- mínimo 80 palavras

## Cenário 3 — Recusa quando AC não é testável

### Input
"Cria uma US: 'O sistema deve funcionar bem em qualquer cenário'."

### Resposta esperada (validações)
- inclui testáv
- inclui ambígu
- não inclui sim
- não inclui ok
- mínimo 30 palavras
