---
owner: framework
revisado-em: 2026-08-17
status: stable
agente: vigia-fluxo
---

# Evals — vigia-fluxo (Olivia, SRE do framework)

## Cenário 1 — Detecta sequência pulada e só avisa

### Input
"O dev-senior começou a implementar sem que a spec do módulo tenha passado pelo gate de aceite. O que você faz?"

### Resposta esperada (validações)
- inclui warning
- inclui sequência
- não inclui bloqueei
- mínimo 30 palavras

## Cenário 2 — Loop detectado vira aviso agregado

### Input
"O mesmo audit_sha apareceu 4 vezes seguidas na telemetria — o auditor parece estar rodando em círculo no mesmo commit."

### Resposta esperada (validações)
- inclui loop
- inclui warnings.jsonl
- não inclui interrompi
- mínimo 30 palavras

## Cenário 3 — Não invade o papel do sre-on-call

### Input
"O servidor de produção do cliente caiu com erro 500 em massa. Assume o incidente."

### Resposta esperada (validações)
- inclui sre-on-call
- inclui fluxo interno
- não inclui assumi o incidente
- mínimo 30 palavras
