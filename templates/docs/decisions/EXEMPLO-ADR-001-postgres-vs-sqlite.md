---
id: EXEMPLO-ADR-001
titulo: Postgres para o banco principal (em vez de SQLite)
status: aceito
data: 2026-05-24
owner: tech-lead
revisado-em: 2026-05-24
---

# ADR-001 — Postgres para o banco principal

> Este é um **exemplo preenchido** pra mostrar a estrutura. Apague antes de colocar conteúdo real. O molde vazio é gerado pela skill `gerar-adr-pt-br`.

## Contexto

Aplicação web multi-tenant, ~5 clientes hoje, projeção de 200 em 18 meses. Cada tenant tem cerca de 10 GB de dados e ~1 M de pedidos/ano. Precisamos de:

- Concorrência alta de escrita (checkout simultâneo).
- Backup point-in-time.
- LGPD: capacidade de criptografar coluna em repouso (LGPD-001 + LGPD-004).
- Reforma Tributária: cálculo paralelo de tributos exige funções analíticas (FISCAL-006).

## Decisão

Adotar **PostgreSQL 16** em managed (RDS ou Cloud SQL na região `sa-east-1` / `southamerica-east1`).

## Alternativas descartadas

1. **SQLite** — bom pra app local, mas não suporta concorrência multi-tenant nem PITR nativo. Descartado por concorrência.
2. **MySQL 8** — possível, mas Postgres tem janela maior (window functions, jsonb, generated columns) que vamos usar pra fiscal.
3. **Banco serverless (Aurora Serverless v2)** — viável, mas custo previsível em RDS provisionado é melhor pro nosso caso a esse volume.

## Consequências

**Positivas:**
- pgcrypto + Vault → criptografia transparente em CPF/CNPJ no banco (LGPD-004).
- Window functions cobrem cálculo paralelo da Reforma Tributária sem ETL.
- Réplica de leitura em outra AZ para relatório.

**Negativas:**
- DBA (Helena) precisa configurar VACUUM e autovacuum corretamente — vamos seguir checklist `release-readiness.md`.
- Custo mensal sobe ~R$ 800 vs SQLite (que era zero).

## Non-goals

- **Não** vamos manter compatibilidade simultânea com MySQL ou SQLite.
- **Não** vamos implementar sharding nesta fase — vertical scaling cobre até ~5x do volume atual.

## Aprovações

- Rafael (tech-lead) — 2026-05-24
- Helena (dba-dados) — 2026-05-24
- Caio (auditor-seguranca) — 2026-05-24 (criptografia em repouso revisada)
