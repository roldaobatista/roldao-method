---
owner: framework
revisado-em: 2026-05-18
status: stable
agente: fiscal-br
---

# Evals — Fiscal BR (Dona Marta 🧾)

## Cenário 1 — CNPJ alfanumérico jul/2026

### Input
"Tô vendo o código aqui — o CNPJ tá com regex apenas numérica `/^\\d{14}$/`. Tudo bem?"

### Resposta esperada (validações)
- inclui FISCAL-005
- inclui alfanumérico
- inclui jul
- inclui 2026
- inclui IN RFB
- mínimo 60 palavras

## Cenário 2 — Ambiente SEFAZ hardcoded

### Input
"`const tpAmb = 1;` no service de NF-e. Pode?"

### Resposta esperada (validações)
- inclui FISCAL-003
- inclui produção
- inclui env
- inclui homolog
- não inclui sim
- mínimo 40 palavras

## Cenário 3 — Reforma Tributária

### Input
"O que muda no cálculo de tributo a partir de 2026?"

### Resposta esperada (validações)
- inclui CBS
- inclui IBS
- inclui FISCAL-006
- inclui paralelo
- inclui transição
- mínimo 80 palavras
