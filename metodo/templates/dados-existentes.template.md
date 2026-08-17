---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 14/17
proximo: docs/descoberta/integracoes-externas.md
idioma: pt-BR
limite-linhas: 180
proposito: inventário de dados legados a migrar.
---

<!--
template: dados-existentes.md
destino: docs/descoberta/dados-existentes.md
uso: condicional — só se migra dados de sistema legado. Marque N/A em nao-aplica.md se greenfield.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3 (condicional, 🔵)
limite: ≤180 linhas.
-->

# Dados existentes (migração legado) — <NomeDoProjeto>

> Se o produto é greenfield (sem migração), marcar N/A em `docs/nao-aplica.md`.

## 1. Inventário de fontes

| Fonte | Sistema | Volume aproximado | Formato | Qualidade percebida |
|---|---|---|---|---|
| F-001 | <ex.: SAP do cliente piloto> | <50k linhas / 2 anos> | <CSV exportado> | <alta / média / baixa> |
| F-002 | <ex.: planilhas Excel> | <12 arquivos, ~1k linhas cada> | <XLSX> | <média> |
| F-003 | <ex.: banco MySQL legado> | <500k linhas / 5 anos> | <SQL dump> | <baixa — sem constraints> |

## 2. Mapeamento campo-a-campo (high-level)

> Mapear PROPRIEDADES, não tabelas — abstração do domínio. Detalhamento técnico fica em `docs/dados/dicionario.md` em C3.

| Entidade-alvo (V1) | Fonte | Campo origem | Campo destino | Transformação |
|---|---|---|---|---|
| Cliente | F-001 | `customer_name` | `customer.name` | trim |
| Cliente | F-001 | `cpf_cnpj` | `customer.tax_id` | normalizar (sem máscara) |
| Transação | F-003 | `amount_cents` / `amount` | `transaction.amount` | converter para cents inteiros |

## 3. Qualidade dos dados

### Problemas conhecidos
- <ex.: 15% dos CPFs sem máscara, 5% com erro de checksum>
- <ex.: datas em formatos misturados (DD/MM/YYYY e YYYY-MM-DD)>
- <ex.: valores monetários em string com vírgula e ponto misturados>

### Plano de limpeza
- <ex.: script de normalização em `scripts/migracao/limpar-cpfs.py`>
- <ex.: revisão manual de outliers > 3σ>
- <ex.: validação anti-checksum bloqueia ingestão de CPF inválido>

## 4. Volume e performance

- **Total estimado**: <N registros>
- **Tempo estimado de migração**: <X horas em hardware Y>
- **Janela de migração aceitável**: <produção off por N horas>
- **Estratégia**: <one-shot | rolling | dual-write durante transição>

## 5. Conformidade na migração

- **PII envolvida?**: <sim/não>
- **Consentimento original cobre uso novo?**: <verificar com DPO>
- **Crypto-shredding necessário?**: <se LGPD exigir>
- **Logs de auditoria da migração**: <retenção 5 anos para dados fiscais>

## 6. Plano B se migração falhar

- **Rollback**: <como reverter — snapshot anterior, dual-write>
- **Custo de rollback**: <horas, R$>
- **Critério de "go/no-go" na migração**: <% de registros migrados com sucesso ≥ X% antes de commitar>

## 7. Cronograma

- **Análise + amostra**: até <YYYY-MM-DD>
- **Script de migração pronto**: até <YYYY-MM-DD>
- **Dry-run em ambiente de teste**: até <YYYY-MM-DD>
- **Migração em produção**: <YYYY-MM-DD>
- **Validação pós-migração**: <YYYY-MM-DD + 7 dias>

## Critério para promover de `draft` para `stable`

- [ ] ≥1 fonte inventariada com volume e qualidade.
- [ ] Mapeamento de pelo menos as entidades-âncora.
- [ ] Plano de limpeza para os ≥3 problemas conhecidos.
- [ ] Plano B definido.
