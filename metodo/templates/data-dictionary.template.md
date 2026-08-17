---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 250
proposito: dicionário de dados — campos físicos, tipos, restrições, semântica.
---

<!--
template: data-dictionary.md
destino: docs/dados/dicionario.md
uso: nível FÍSICO. Distinguir de modelo-canonico (lógico) e de migration (DDL real).
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §5
limite: ≤250 linhas. Se passar, fatiar por domínio em docs/dominios/<dom>/dicionario.md.
-->

# Dicionário de dados — <NomeDoProjeto>

## Convenções

- **Naming**: `snake_case`, plural em tabelas (`customers`, `transactions`).
- **PK**: sempre `id uuid` (não bigserial — evita enumeração e facilita merge).
- **Auditoria**: toda tabela tem `created_at`, `updated_at` (`timestamptz`, default `now()`).
- **Soft delete**: `deleted_at timestamptz NULL` quando aplicável.
- **Multi-tenant**: tabelas sufixadas `_tenanted` têm `tenant_id uuid NOT NULL` + RLS policy.
- **Dinheiro**: `bigint` (cents). Nunca `float`/`real`/`numeric` solto.
- **Datas**: `timestamptz` UTC. Nunca `timestamp` sem fuso.
- **Strings**: `text` por padrão. Limite por CHECK constraint, não por VARCHAR(N).
- **JSON**: `jsonb` (não `json`). Indexar com GIN se filtro frequente.

## Tabelas

### customers (DAT-001)

| Campo | Tipo | Default | Constraint | Notas |
|---|---|---|---|---|
| id | uuid | `gen_random_uuid()` | PK | |
| tenant_id | uuid | — | NOT NULL, FK tenants | RLS |
| name | text | — | NOT NULL, length >=2 | PII (mascarar) |
| tax_id | text | — | NOT NULL, UNIQUE(tenant_id, tax_id), CHECK regex CPF/CNPJ | PII |
| email | text | NULL | CHECK email regex | PII |
| phone | text | NULL | — | PII |
| status | text | `'active'` | CHECK IN ('active', 'inactive', 'suspended') | |
| created_at | timestamptz | `now()` | NOT NULL | |
| updated_at | timestamptz | `now()` | NOT NULL | gatilho atualiza |
| deleted_at | timestamptz | NULL | — | soft delete |

**Índices**:
- `idx_customers_tenant_id` em (tenant_id) — RLS otimização.
- `idx_customers_tax_id` em (tenant_id, tax_id) — unicidade + busca.

**Trigger**:
- `trg_customers_updated_at` — atualiza `updated_at` em UPDATE.

**Policy RLS**:
```sql
CREATE POLICY tenant_isolation ON customers
  FOR ALL TO app_user
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

### transactions (DAT-002)

| Campo | Tipo | Default | Constraint | Notas |
|---|---|---|---|---|
| id | uuid | `gen_random_uuid()` | PK | |
| tenant_id | uuid | — | NOT NULL, FK tenants | RLS |
| customer_id | uuid | — | NOT NULL, FK customers | |
| account_id | uuid | — | NOT NULL, FK accounts | |
| amount_cents | bigint | — | NOT NULL, CHECK <> 0 | dinheiro em cents |
| currency | text | `'BRL'` | NOT NULL, length=3 | ISO 4217 |
| status | text | `'pending'` | CHECK IN ('draft', 'pending', 'reconciled', 'failed', 'discarded', 'reversed') | máquina de estado |
| occurred_at | timestamptz | — | NOT NULL | quando o dinheiro mudou |
| reconciled_at | timestamptz | NULL | — | preenche em status=reconciled |
| created_at | timestamptz | `now()` | NOT NULL | |
| updated_at | timestamptz | `now()` | NOT NULL | |

**Índices**:
- `idx_transactions_tenant_customer` em (tenant_id, customer_id).
- `idx_transactions_status_occurred` em (tenant_id, status, occurred_at DESC).

---

### audit_log (DAT-003, WORM)

| Campo | Tipo | Default | Constraint | Notas |
|---|---|---|---|---|
| id | bigserial | — | PK | append-only |
| tenant_id | uuid | — | NOT NULL | |
| user_id | uuid | NULL | — | quem agiu (NULL = sistema) |
| action | text | — | NOT NULL | ex.: 'transaction.reconcile' |
| target_table | text | — | NOT NULL | |
| target_id | uuid | — | NOT NULL | |
| payload | jsonb | `'{}'` | — | snapshot do estado |
| ip_address | inet | NULL | — | |
| user_agent | text | NULL | — | |
| occurred_at | timestamptz | `now()` | NOT NULL | |

**Trigger WORM**:
```sql
CREATE FUNCTION prevent_audit_modify() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is WORM — INSERT only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_log_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modify();
```

**Retenção**: 5 anos (fiscal). Backup separado, glaciar/cold storage após 2 anos.

---

## Anti-padrões a evitar

- ❌ `VARCHAR(255)` — usar `text` + CHECK quando precisar limite.
- ❌ `NUMERIC` para dinheiro sem definir precisão — usar `bigint` em cents.
- ❌ `BOOLEAN` em campo de máquina de estado — usar `text` com CHECK IN.
- ❌ ENUM no Postgres — difícil migrar. Usar `text` com CHECK constraint.
- ❌ `CASCADE` em FK de tabela com PII — risco de delete acidental.
- ❌ Coluna sem comentário em `COMMENT ON COLUMN` quando o nome não é óbvio.

## Critério para promover de `draft` para `stable`

- [ ] Toda tabela tem ID (DAT-NNN) único.
- [ ] PII identificada em todas as colunas relevantes.
- [ ] RLS declarada para todas as `_tenanted`.
- [ ] Triggers de auditoria/WORM definidos onde aplicável.
- [ ] Anti-padrões revisados.
