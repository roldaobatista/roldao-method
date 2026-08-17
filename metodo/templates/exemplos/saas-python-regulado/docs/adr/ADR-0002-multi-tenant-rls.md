---
id: ADR-0002
titulo: Multi-tenant por linha com RLS no PostgreSQL (em vez de schema-per-tenant)
status: aceita
data-proposta: 2026-02-18
data-aceite: 2026-02-22
depende-de: [ADR-0001]
bloqueia-fase: F-A
superseded-by:
owner: <DEV-1>
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 140
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0002: Multi-tenant por linha com RLS no PostgreSQL (em vez de schema-per-tenant)

## Contexto

O conciliab e SaaS multi-tenant: cada PME cliente e um tenant isolado. Vazamento
entre tenants e o pior cenario possivel (mata o produto, gera incidente LGPD,
quebra contrato). Isolamento e tratado como **premissa** na constitution.

Volume esperado: 100 tenants em 12 meses, ate 2.000 em 36 meses. Cada tenant
tem entre 50 e 5.000 transacoes/mes. Sem necessidade de customizar schema por
cliente.

Time pequeno (3 devs) — operacao tem que ser simples. Migrations rodam em todos
os tenants ao mesmo tempo.

## Opcoes consideradas

### Opcao 1: Multi-tenant por linha (`tenant_id` em toda tabela) com RLS

- **Pros:** uma migration roda em todos os tenants atomicamente; backup unico;
  query simples; RLS no PG e mecanismo defensivo (se app errar e esquecer
  filtro, banco bloqueia); facil onboarding de tenant novo (insert linha).
- **Contras:** uma query mal feita pode vazar dado (mitigado por RLS); um tenant
  grande pode afetar performance dos outros (mitigado por particionamento futuro);
  exige disciplina no padrao de nomenclatura (`_tenanted`).
- **Custo:** baixo. ~3 dias para configurar RLS + middleware FastAPI que seta
  `SET LOCAL app.current_tenant_id`.

### Opcao 2: Schema-per-tenant

- **Pros:** isolamento "fisico" (schemas separados); facil exportar dado de
  um tenant especifico; impossivel cross-tenant por acidente.
- **Contras:** migration explode (precisa rodar N vezes — em 1000 tenants vira
  problema operacional); cada tenant novo exige `CREATE SCHEMA` + criar todas
  as tabelas; pool de conexoes complica; analytics cross-tenant impossivel
  sem agregador externo.
- **Custo:** medio. ~1 semana de setup + custo operacional crescente.

### Opcao 3: Database-per-tenant

- **Pros:** isolamento maximo; pode hospedar em region/instancia diferente
  por tenant (util para enterprise).
- **Contras:** custo de infra cresce linear com tenant (RDS por cliente
  inviavel); operacao pesada; over-engineer para PME segment.
- **Custo:** alto. Inviavel para o segmento.

## Decisao

Escolhemos a **Opcao 1: Multi-tenant por linha (`tenant_id`) com RLS**.

Decisao guiada por: simplicidade operacional, suporte de primeira classe no
PostgreSQL, custo previsivel ate 5.000 tenants. RLS adiciona camada defensiva
que sobrevive a bug aplicacional (defense-in-depth).

**Padrao adotado:**
- Tabela que tem dado de tenant termina em `_tenanted` (ex: `transacao_tenanted`,
  `conciliacao_tenanted`).
- Toda `_tenanted` tem coluna `tenant_id uuid NOT NULL` + index.
- Toda `_tenanted` tem RLS habilitada + policy que filtra por
  `app.current_tenant_id` da sessao.
- Middleware FastAPI seta `SET LOCAL app.current_tenant_id = <uuid>` no inicio
  de cada request, baseado no JWT do Cognito.
- Hook `migration-rls-check.sh` falha CI se migration cria `_tenanted` sem RLS.

Tabelas globais (catalogos, `tenant` em si, `audit_log`) nao tem sufixo e nao
tem RLS — ficam visiveis a aplicacao com role superuser.

## Consequencias

### Positivas
- Defesa em camadas: bug aplicacional sozinho nao vaza dado.
- Migrations simples (uma rodada por release).
- Query agregada cross-tenant (para painel interno) e possivel com role separada.
- Padrao `_tenanted` auditavel automaticamente (hook).

### Negativas
- Performance: cada query carrega o overhead do RLS (~5-10% conforme testes
  internos). Aceitavel.
- Disciplina obrigatoria: dev tem que lembrar do sufixo `_tenanted`. Mitigado
  por hook.
- Pool de conexoes precisa garantir que `SET LOCAL` nao vaza entre requests
  (mitigado por `transaction-scoped session`).

### Reversibilidade
**Baixa**. Migrar para schema-per-tenant exige reescrever toda camada de dados
+ migracao destrutiva. Custo estimado: 2 meses de trabalho. Por isso a decisao
e tomada antes de qualquer codigo de produto.

## Non-goals

Esta ADR NAO decide:
- Como sera implementado o `SET LOCAL` no middleware (detalhe vai em
  `docs/dominios/financas/modulos/conciliacao/plan.md`).
- Particionamento de tabelas grandes (assunto de ADR futura quando atingirmos
  500 tenants).

## Como validar (gates)

- [x] `migration-rls-check.sh` ativo no pre-commit + CI.
- [x] Suite `tests/isolation/` cobre 100% das tabelas `_tenanted` com teste de
      vazamento.
- [x] Auditor-seguranca configurado com golden cases positivo (RLS ativa) +
      negativo (RLS ausente).
- [x] Codigo de aplicacao nao usa `BYPASSRLS` nem `SET LOCAL ROLE` (INV-TENANT-003).
- [x] Documentado em `docs/governanca/padrao-tabela-tenanted.md`.

## Referencias

- ADR-0001 (stack).
- INV-TENANT-001..003 em REGRAS-INEGOCIAVEIS.md.
- https://www.postgresql.org/docs/16/ddl-rowsecurity.html
- https://docs.sqlalchemy.org/en/20/orm/queryguide/select.html#using-set-local
