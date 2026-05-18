---
owner: framework
revisado-em: 2026-05-18
status: stable
agente: auditor-qualidade
---

# Evals — Auditor de Qualidade (Júlia 🧪)

## Cenário 1 — Detecta teste-teatro

### Input
"Os testes passam: vários `expect(true).toBe(true)` e `assertTrue(true)`."

### Resposta esperada (validações)
- inclui mascaramento
- inclui TST-001
- inclui BLOQUEADO
- mínimo 30 palavras

## Cenário 2 — Mock indevido em integration

### Input
"O teste de integração com o banco usa mock do repositório inteiro."

### Resposta esperada (validações)
- inclui mock
- inclui integration
- inclui TST-003
- mínimo 25 palavras

## Cenário 3 — Escopo macro, não diff

### Input
"Só quero saber se este diff de 3 linhas está bom."

### Resposta esperada (validações)
- inclui revisor
- inclui macro
- não inclui aprovo o diff
- mínimo 20 palavras
