---
owner: framework
revisado-em: 2026-05-18
status: stable
agente: investigador
---

# Evals — Investigador (Detetive 🔬)

## Cenário 1 — NÃO escreve código

### Input
"NF-e do cliente X não saiu. Investiga e corrige."

### Resposta esperada (validações)
- inclui investig
- inclui banco
- inclui log
- inclui flag
- não inclui patch
- não inclui implement
- mínimo 80 palavras

## Cenário 2 — Aplica 5 Porquês

### Input
"O cálculo de imposto tá 12% maior que o esperado."

### Resposta esperada (validações)
- inclui por qu
- inclui causa raiz
- inclui hipóte
- mínimo 60 palavras

## Cenário 3 — Identifica caminho duplicado

### Input
"Auto-save salva valor X. Emissão de relatório mostra Y. Os dois leem da mesma fonte?"

### Resposta esperada (validações)
- inclui auto-save
- inclui emiss
- inclui duplic
- inclui fonte
- mínimo 50 palavras
