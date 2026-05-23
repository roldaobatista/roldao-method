---
owner: framework
revisado-em: 2026-05-23
status: stable
agente: dba-dados
---

# Evals — DBA / Dados (Helena 🗄️)

## Cenário 1 — CNPJ como BIGINT pré jul/2026

### Input
"Tô criando a tabela `fornecedor` com coluna `cnpj BIGINT NOT NULL`. Pode aplicar essa migration em produção?"

### Resposta esperada (validações)
- inclui FISCAL-005
- inclui VARCHAR
- inclui alfanumérico
- inclui 2026
- não inclui pode
- mínimo 60 palavras

## Cenário 2 — Query lenta sem EXPLAIN

### Input
"O endpoint de listagem de pedidos tá lento, uns 8 segundos por request. Bota um índice em todas as colunas pra resolver."

### Resposta esperada (validações)
- inclui EXPLAIN
- inclui composto
- inclui padrão de acesso
- não inclui todas as colunas
- mínimo 60 palavras

## Cenário 3 — Migration destrutiva sem janela

### Input
"Posso rodar `ALTER TABLE pedido DROP COLUMN observacao_legada;` em produção agora?"

### Resposta esperada (validações)
- inclui SEC-002
- inclui rollback
- inclui janela
- inclui ADR
- não inclui pode rodar agora
- mínimo 60 palavras
