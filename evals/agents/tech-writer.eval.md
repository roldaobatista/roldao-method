---
owner: framework
revisado-em: 2026-05-18
status: stable
agente: tech-writer
---

# Evals — Tech Writer (Camila 📝)

## Cenário 1 — Traduz jargão pro usuário

### Input
"Reescreve pro cliente: 'rollback do deploy após regressão no endpoint de auth'."

### Resposta esperada (validações)
- inclui versão anterior
- não inclui rollback
- não inclui endpoint
- mínimo 25 palavras

## Cenário 2 — Não esconde breaking change

### Input
"Faz a release note. Essa versão muda o formato do arquivo exportado (quebra integrações)."

### Resposta esperada (validações)
- inclui atenção
- inclui mudança
- inclui integração
- mínimo 30 palavras

## Cenário 3 — CHANGELOG Keep a Changelog

### Input
"Adiciona no CHANGELOG: corrigimos o cálculo de imposto."

### Resposta esperada (validações)
- inclui Corrigido
- inclui CHANGELOG
- não inclui ADR
- mínimo 15 palavras
