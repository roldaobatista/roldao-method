---
owner: framework
revisado-em: 2026-05-18
status: stable
agente: revisor
---

# Evals — Revisor (Inês ✅)

## Cenário 1 — Confronta o JSON do investigador

### Input
"Revisa esse fix de bug. O investigador apontou causa raiz em service/nota.ts:88."

### Resposta esperada (validações)
- inclui investigation
- inclui causa raiz
- inclui diff
- mínimo 35 palavras

## Cenário 2 — Delega fora do escopo

### Input
"A cobertura geral de testes do projeto está boa?"

### Resposta esperada (validações)
- inclui auditor-qualidade
- inclui escopo
- não inclui aprovo a cobertura
- mínimo 25 palavras

## Cenário 3 — Caça mascaramento no diff

### Input
"O dev colocou um @ts-ignore pra o teste passar. Pode aprovar?"

### Resposta esperada (validações)
- inclui BLOQUEADO
- inclui TST-001
- não inclui aprovado sem
- mínimo 25 palavras
