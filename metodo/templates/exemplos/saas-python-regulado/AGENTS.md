---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 300
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: AGENTS.md (preenchido no exemplo saas-python-regulado)
referencia: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C0
-->

# AGENTS.md — conciliab

> **Hierarquia de precedencia (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence. CLAUDE.md e o mais especifico (canal Claude Code) e o mais facil de mudar.

**Status:** stable · **Ultima revisao:** 2026-05-27

## 1. Identidade do produto

- Nome: conciliab
- Escopo: SaaS B2B multi-tenant que automatiza conciliacao bancaria para PMEs
  brasileiras (faturamento R$ 500k–50M/ano). Conecta a um banco (Open Finance
  no roadmap; CSV/OFX no MVP) e cruza extratos com contas a pagar/receber
  do ERP do cliente.
- Modelo de negocio: SaaS B2B, mensalidade por tenant (R$ 149-499/mes
  conforme volume de transacoes).
- Cliente piloto: 3 PMEs do varejo (sudeste), confirmadas em contrato de
  beta pago (R$ 49/mes por 6 meses).

## 2. Stack candidata

| Camada | Escolha | Notas |
|---|---|---|
| Backend | Python 3.12 + FastAPI 0.110 | ADR-0001 aceita |
| ORM | SQLAlchemy 2.0 + Alembic (migrations) | ADR-0001 |
| Banco | PostgreSQL 16 com RLS por `tenant_id` | ADR-0002 + ADR-0003 |
| Fila / async | Celery 5 + Redis 7 | ADR-0001 |
| Auth | AWS Cognito (user pools por tenant) | ADR-0001 |
| Storage de arquivos | S3 (`s3://conciliab-uploads-saeast1`) | ADR-0003 |
| Hospedagem | AWS sa-east-1 (ECS Fargate + RDS) | ADR-0001 |
| Observabilidade | CloudWatch Logs + Sentry + Datadog APM | ADR-0001 |
| Frontend | Next.js 14 (repositorio separado: `conciliab-web`) | fora deste repo |

## 3. Principios nao-negociaveis

Detalhes completos (regra, motivacao, hook, auditor) em
[`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md). Resumo dos IDs vigentes:

- **INV-AGENT-001..011** — invariantes universais de agente IA (ver template).
- **INV-TENANT-001** — RLS ativo em toda tabela `_tenanted`.
- **INV-TENANT-002** — toda query a tabela com `tenant_id` filtra explicitamente.
- **INV-TENANT-003** — proibido `SET LOCAL ROLE` que pule RLS sem ADR.
- **INV-LGPD-001** — toda operacao nova que toca PII entra no ROPA antes do deploy.
- **INV-LGPD-002** — pedido de eliminacao do titular (Art. 18, VI) atendido em ≤ 15 dias.
- **INV-LGPD-003** — incidente de seguranca com PII comunicado a ANPD em ≤ 72h.
- **INV-AUDIT-001** — toda mutacao em tabela financeira gera linha em `audit_log` (WORM).
- **INV-AUDIT-002** — `audit_log` so admite INSERT (nunca UPDATE/DELETE).
- **INV-AUDIT-003** — relatorio fiscal exportado preserva hash do snapshot.

## 4. Decisoes fundadoras (D-NNN)

| ID | Decisao | Status |
|---|---|---|
| D-001 | Multi-tenant por linha (`tenant_id`) com RLS — nao schema-per-tenant | aceita |
| D-002 | Conciliacao roda em job assincrono (Celery), nunca sincrono no request | aceita |
| D-003 | Beta pago por 6 meses antes de abrir self-service | aceita |
| D-004 | Hospedagem regional (sa-east-1) — sem transferencia internacional default | aceita |

## 5. Modelo de agentes

Subagentes ativos em `.claude/agents/`:

- `auditor-seguranca` — INV-TENANT-*, INV-AGENT-008, INV-AGENT-009, SEC-001.
- `auditor-qualidade` — TST-001, INV-AGENT-006 (anti-mascaramento).
- `auditor-lgpd` — INV-LGPD-*, consistencia codigo↔ROPA.
- `auditor-fiscal-audit` — INV-AUDIT-*, WORM em `audit_log`.
- `auditor-doc-quality` — INV-AGENT-003, INV-AGENT-010 (jargao).
- `limites-agente-ia` — INV-AGENT-001, INV-AGENT-002, INV-AGENT-004.
- `auditor-revisao` — INV-AGENT-005 (evidencia antes de afirmar).
- `auditor-processo` — INV-AGENT-011 (mudanca de INV).

Catalogo em [`docs/governanca/catalogo-auditores.md`](./docs/governanca/catalogo-auditores.md).

## 6. Comandos canonicos

| Operacao | Comando |
|---|---|
| Rodar dev | `poetry run uvicorn conciliab.main:app --reload --port 8000` |
| Rodar worker | `poetry run celery -A conciliab.worker worker -l info` |
| Rodar testes | `poetry run pytest` |
| Testes de isolamento tenant | `poetry run pytest tests/isolation -v` |
| Migration nova | `poetry run alembic revision --autogenerate -m "<msg>"` |
| Aplicar migration | `poetry run alembic upgrade head` |
| Lint + types | `poetry run ruff check . && poetry run mypy conciliab` |
| Auditores locais | `poetry run pre-commit run --all-files` |
| Seed dev | `poetry run python -m conciliab.scripts.seed_dev` |

## 7. Politica de commits

- Atomicos, mensagem citando `T-<MOD>-NNN`.
- `--no-verify` PROIBIDO (ver INV-AGENT-002).
- `git push --force` em `main` PROIBIDO (ver INV-AGENT-002).
- Stage seletivo por arquivo; nada de `git add .` cego quando ha outras frentes
  dirty (INV-AGENT-007).
- Mensagens em PT-BR. Codigo, nomes de variaveis e identificadores em ingles.

## 8. Convencoes

- Idioma: PT-BR para docs/commit; ingles para identificadores no codigo.
- Estilo Python: `ruff` (com regras `E,F,I,N,UP,B,A,C4,DTZ,T20,SIM,RUF`),
  `mypy --strict` em modulos novos.
- Ver [`docs/CONVENCOES-DOC.md`](./docs/CONVENCOES-DOC.md).

## 9. Seguranca/dados

- **Multi-tenant:** RLS habilitado em toda tabela `_tenanted` (sufixo obrigatorio).
  Sessao do PG seta `app.current_tenant_id` via middleware FastAPI antes de cada
  query. Hook `migration-rls-check.sh` falha CI se tabela `_tenanted` for criada
  sem policy RLS.
- **Secrets:** AWS Secrets Manager. Rotacao 90 dias para tokens, 180 dias para
  senhas de banco. Nunca em `.env` versionado.
- **WORM:** tabela `audit_log` e `fiscal_export_snapshot` — so INSERT (trigger
  `prevent_update_delete` ativa). Backup separado, retencao 5 anos (fiscal).
- **PII em logs:** PROIBIDO (INV-AGENT-008). Mascarador `mask_pii()` aplicado
  em todo log estruturado antes do `json.dumps`. Testes em `tests/unit/test_pii_masker.py`.
- **Criptografia:** TLS 1.3 em transito; RDS storage encryption + S3 SSE-KMS em repouso.

## 10. ADRs ativas

ADRs vivem em [`docs/adr/`](./docs/adr/). Status validos: `proposta | aceita | substituida | deprecada`.

| # | Tema | Arquivo | Status | Bloqueia fase | Depende de |
|---|---|---|---|---|---|
| 0000 | Uso de IA | [`docs/adr/ADR-0000-uso-de-ia.md`](./docs/adr/ADR-0000-uso-de-ia.md) | aceita | — | — |
| 0001 | Stack Python + FastAPI | [`docs/adr/ADR-0001-stack-python-fastapi.md`](./docs/adr/ADR-0001-stack-python-fastapi.md) | aceita | F-A | — |
| 0002 | Multi-tenant via RLS | [`docs/adr/ADR-0002-multi-tenant-rls.md`](./docs/adr/ADR-0002-multi-tenant-rls.md) | aceita | F-A | ADR-0001 |
| 0003 | Storage em PostgreSQL + S3 | [`docs/adr/ADR-0003-storage-postgres.md`](./docs/adr/ADR-0003-storage-postgres.md) | aceita | F-A | ADR-0001 |

## 11. Pendencias (GATEs)

- GATE-OPEN-FINANCE-1: integracao com Bacen Open Finance requer certificacao
  ICP-Brasil — nao iniciar antes da homologacao (esperada Q3/2026).
- GATE-PCI-1: storage de PAN nao acontece (so 4-ultimos via gateway); revisar
  se mudar (gatilho: pedido de billing recorrente direto).

## 12. ROPA / LGPD

Registro das Operacoes de Tratamento de Dados Pessoais. Obrigatorio porque
o conciliab trata PII de pessoas fisicas no Brasil (LGPD Art. 37).

- ROPA preenchido: [`docs/conformidade/lgpd/ropa.md`](./docs/conformidade/lgpd/ropa.md).
- Encarregado (DPO): `<DPO-nome>` (terceirizado, contrato em vigor).
- Base legal padrao para clientes: execucao de contrato (Art. 7, V).
- Retencao: ver [`docs/conformidade/lgpd/retencao-dados.md`](./docs/conformidade/lgpd/retencao-dados.md).
- Direitos do titular: canal `lgpd@conciliab.com.br` + rota `POST /v1/lgpd/pedidos`.
- Plano de incidente: ver [`docs/conformidade/lgpd/ropa.md`](./docs/conformidade/lgpd/ropa.md) §5.
  Comunicacao a ANPD em ≤ 72h (INV-LGPD-003).

PII em logs/prints e proibido (INV-AGENT-008 + INV-LGPD-001). Mascarar/tokenizar antes de logar.

## 13. Pro-atividade e autorizacao

O agente IA opera com pro-atividade ampla. Ver INV-AGENT-004.

**Acoes que o agente FAZ sem perguntar** (reversiveis, sem custo financeiro, sem perda de dado):

- Editar/criar/atualizar arquivos, configs, docs, memorias.
- Rodar testes, lint, build, type-check, auditores locais.
- Criar branch, fazer commit atomico, abrir PR via `gh`.
- Criar issue, comentar em PR via `gh`.
- `git push origin <branch>` em fast-forward (nao force) **apenas em branches feature/fix/* — NUNCA push direto em main/master/release/***. Em main, o fluxo e: branch + PR + revisao + merge via `gh pr merge` (que tambem exige confirmacao humana, ver §13 abaixo). Contraste com perfil solo (ex: cli-rust-solo), onde push direto em main e permitido.
- Aplicar correcoes identificadas em auditoria.
- Continuar o proximo passo logico de qualquer sequencia iniciada.

**Acoes que o agente tambem faz sem perguntar** (revertiveis ou compliance continuo):

- `gh release create` / `gh release delete` (release e revertivel).
- Rotacao de credencial PROGRAMADA dentro da janela documentada (90 dias para
  tokens, 180 dias para senhas de banco) via runbook automatizado — compliance
  continuo. Agente roda, registra evento em audit_log e notifica owner depois
  (nao bloqueante). Distingue de rotacao por incidente (que exige confirmacao).

**Acoes que EXIGEM confirmacao humana explicita** (destrutivas, custosas ou irreversiveis):

- `alembic downgrade` (migration destrutiva).
- `DROP TABLE`, `TRUNCATE`, `DELETE` sem `WHERE tenant_id` em producao.
- `git push --force` puro em qualquer branch.
- `git push --force-with-lease` em `main`/`master`/`release/*` (exige `.claude/.override-reason`); em branch propria (feature/*, fix/*) passa direto.
- `git reset --hard origin/*` PROIBIDO. `git reset --hard` em ref local exige `.claude/.override-reason`.
- `rm -rf`, `git branch -D` em branch compartilhada.
- Deletar dado de producao de qualquer tenant (INV-AGENT-001).
- Rotacao de credencial FORA DE JANELA ou POR INCIDENTE (resposta a
  comprometimento ou auditoria fora do cronograma) — exige confirmacao do
  owner do servico.
- Gasto financeiro (compra de dominio, aumentar instancia RDS, etc.).
- Mudanca de visibilidade do repositorio (publico ↔ privado).
- Apagar repositorio.
- Restaurar backup sobre producao (runbook destrutivo, exige 2-eyes).

Qualquer override desta politica exige entrada em
[`docs/governanca/override-ledger.md`](./docs/governanca/override-ledger.md).
