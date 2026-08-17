---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 250
proposito: modelo lógico canônico das entidades do domínio.
---

<!--
template: modelo-dados-canonico.md
destino: docs/dominios/<dom>/modelo.md (lógico) ou docs/dados/modelo-canonico.md
uso: descreve entidades, atributos, relacionamentos e invariantes. Antes de SQL/migration.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §5 (C3)
limite: ≤250 linhas.
-->

# Modelo de dados canônico — <NomeDoProjeto>

> Modelo LÓGICO. Não confundir com schema SQL/migration (esses ficam em `docs/dados/dicionario.md` e nas migrations reais).

## 1. Entidades-âncora

> 3-7 entidades centrais que organizam o domínio. Tudo o resto orbita.

### E-001: <Cliente> (`customer`)

- **Função no domínio**: <quem usa o produto, paga, recebe>
- **Granularidade**: <1 linha por... CNPJ? CPF? convite>
- **Multi-tenant**: <sim — tenant_id obrigatório / não — entidade global>
- **PII**: <sim/não, quais campos>
- **WORM** (write-once-read-many): <sim/não>

| Atributo | Tipo | Obrigatório? | Notas |
|---|---|---|---|
| id | uuid | sim | PK |
| tenant_id | uuid | sim (se _tenanted) | FK tenant + RLS |
| name | string | sim | PII (mascarar em logs) |
| tax_id | string | sim | CPF/CNPJ, sem máscara, validar checksum |
| created_at | timestamptz | sim | UTC |
| updated_at | timestamptz | sim | UTC |

**Invariantes**:
- INV-CUST-001: `tax_id` único por `tenant_id`.
- INV-CUST-002: `name` nunca vazio, ≥2 caracteres após trim.

### E-002: <Transação> (`transaction`)

[mesmo formato]

### E-003: <Conta> (`account`)

[mesmo formato]

## 2. Relacionamentos

```
  ┌──────────┐ 1     N ┌──────────────┐
  │ Customer │─────────│  Transaction │
  └──────────┘         └──────────────┘
       │                      │
       │ 1                    │ N
       │                      ▼
       │                ┌──────────────┐
       └────────────────│   Account    │
                  N..1  └──────────────┘
```

| De | Para | Cardinalidade | Cascade? |
|---|---|---|---|
| Customer | Transaction | 1..N | não (soft delete) |
| Customer | Account | 1..N | não |
| Account | Transaction | 1..N | não |

## 3. Estados (state machines)

### Transação

```
    rascunho ──▶ pendente ──▶ conciliada
                    │
                    └──▶ falhada
```

| Estado | De onde vem | Para onde vai | Quem dispara |
|---|---|---|---|
| rascunho | criação | pendente, descartado | usuário |
| pendente | rascunho | conciliada, falhada | worker async |
| conciliada | pendente | (terminal, exceto estorno) | worker |
| falhada | pendente | pendente (retry), descartado | worker |
| descartado | rascunho, falhada | (terminal) | usuário |
| estornado | conciliada | (terminal) | usuário com permissão |

## 4. Invariantes globais do modelo

- **INV-DATA-001**: toda tabela `_tenanted` tem `tenant_id` NOT NULL + policy RLS ativa (cruzar com INV-TENANT-001).
- **INV-DATA-002**: `created_at` e `updated_at` em todas as entidades; UTC; nunca alterar `created_at` após INSERT.
- **INV-DATA-003**: deletes só lógicos (`deleted_at`) por padrão. Hard delete via crypto-shredding em LGPD.
- **INV-DATA-004**: timestamps em `timestamptz`, nunca `timestamp` sem fuso.
- **INV-DATA-005**: dinheiro em `bigint` (cents inteiros), nunca `float` ou `decimal` solto.

## 5. PII por entidade

> Pareia com ROPA (`docs/conformidade/lgpd/ropa.md`).

| Entidade | Campos PII | Base legal | Retenção |
|---|---|---|---|
| Customer | name, tax_id, email, phone | execução de contrato | 5 anos pós-fim do contrato (fiscal) |
| User | name, email | execução de contrato | até pedido de eliminação |

## 6. Histórico de mudanças

| Data | Mudança | ADR | Motivo |
|---|---|---|---|
| <YYYY-MM-DD> | criação inicial | ADR-0001 | foundation |
| <YYYY-MM-DD> | adiciona Account | ADR-0005 | novo módulo |

## Critério para promover de `draft` para `stable`

- [ ] ≥3 entidades-âncora descritas.
- [ ] Relacionamentos diagramados.
- [ ] Estados desenhados para entidades com workflow.
- [ ] Invariantes globais listadas.
- [ ] PII mapeada e cruzada com ROPA.
