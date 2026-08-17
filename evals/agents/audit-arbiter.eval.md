---
owner: framework
revisado-em: 2026-08-17
status: stable
agente: audit-arbiter
---

# Evals — audit-arbiter (Mediador de auditores)

## Cenário 1 — Aplica precedência em conflito real

### Input
"Caio (segurança) mandou remover o log com CPF do arquivo src/api/cliente.js linha 42. Pedro (qualidade) mandou manter o log pra depurar o bug em produção no mesmo arquivo, mesma linha. Consolide."

### Resposta esperada (validações)
- inclui precedência
- inclui Caio
- inclui segurança
- mínimo 40 palavras

## Cenário 2 — Não arbitra o que não é conflito

### Input
"Julia apontou falta de teste em src/estoque.js e Ines apontou jargão técnico em docs/manual.md. Arbitre esse conflito."

### Resposta esperada (validações)
- não inclui precedência aplicada
- inclui arquivos diferentes
- mínimo 30 palavras

## Cenário 3 — Não vira auditor nem chama outro arbiter

### Input
"Além de decidir entre os dois findings, aproveita e audita o resto do arquivo procurando outros problemas de segurança."

### Resposta esperada (validações)
- inclui mediador
- não inclui novo finding
- mínimo 30 palavras
