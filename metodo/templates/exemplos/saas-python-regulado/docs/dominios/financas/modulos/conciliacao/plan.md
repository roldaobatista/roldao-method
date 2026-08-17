---
modulo: conciliacao
owner: <DEV-1>
revisado-em: 2026-05-27
status: stable
origem: spec.md
proximo: tasks.md
idioma: pt-BR
limite-linhas: 150
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: docs/dominios/financas/modulos/conciliacao/plan.md
(preenchido no exemplo saas-python-regulado)
-->

# Plano — conciliacao

## Estrategia

O fluxo da US-CONC-001 quebra em 3 estagios bem definidos: **ingestao**
(upload + parse), **matching** (motor de regras), **persistencia** (gravar
matches/divergencias + audit_log). Cada estagio e isolavel em testes, e o
motor de matching e o coracao do produto — vamos investir em testabilidade
dele.

A escolha-chave de arquitetura: o `POST /v1/conciliacoes` **nao processa
sincronamente**. Ele faz: (1) sobe o CSV para S3, (2) grava linha em
`arquivo_recebido_tenanted`, (3) enfileira tarefa Celery `processa_conciliacao`,
(4) responde HTTP 202 com `conciliacao_id`. O cliente faz `GET
/v1/conciliacoes/<id>` para acompanhar o status (websocket fica para US futura).
Decisao guiada por D-002 (conciliacao roda em job async, nunca sincrono).

Motor de matching e um pipeline de **regras encadeadas**, do mais
especifico para o mais permissivo:

1. `match-exato-valor-data` — valor exato + data ± 1 dia util.
2. `match-parcial-tolerancia-taxa` — valor com diferenca ≤ R$ 5,00 OU ≤ 1%
   E data ± 1 dia util.
3. `match-por-historico-contraparte` — match por nome/CNPJ presente no
   historico (futuro, fora desta US — placeholder de extensao).

Se nenhuma regra casa, linha vai para `status = "divergencia"`. Esta US implementa
apenas as regras 1 e 2 (regra 3 vira em US-CONC-004).

Alternativas descartadas:
- **Motor probabilistico (ML)**: prematuro. Cliente precisa entender por que
  bateu; modelo black-box quebra R-PROD-002. Reavaliar em 12 meses com dados
  reais.
- **Match em SQL puro (CTE)**: ilegivel, dificulta teste, dificulta auditoria
  (a regra aplicada precisa ficar explicita em codigo Python para o detalhe
  da linha em `conciliacao_tenanted.regra_aplicada`).

## Modelos/migrations

- `migrations/0007_create_arquivo_recebido_tenanted.py` — tabela `arquivo_recebido_tenanted`
  (`id`, `tenant_id`, `s3_path`, `sha256`, `tamanho_bytes`, `mime_type`,
  `recebido_em`, `parsed_em`, `parse_status`).
- `migrations/0008_create_conciliacao_tenanted.py` — tabela `conciliacao_tenanted`
  (`id`, `tenant_id`, `arquivo_id`, `status` enum `pendente|processando|concluida|erro`,
  `total_linhas`, `total_matches`, `total_divergencias`, `iniciado_em`, `concluido_em`).
- `migrations/0009_create_match_tenanted.py` — tabela `match_tenanted` (`id`,
  `tenant_id`, `conciliacao_id`, `linha_csv_id`, `conta_id`, `regra_aplicada`,
  `valor_diferenca`, `created_at`).
- `migrations/0010_audit_log_triggers.py` — trigger `prevent_update_delete` em
  `audit_log` + trigger `audit_trail_match` que insere em `audit_log` a cada
  INSERT em `match_tenanted`.

Toda tabela `_tenanted` tem RLS habilitada conforme ADR-0002. Migration valida
no pre-commit via `migration-rls-check.sh`.

## Endpoints/views

- `POST /v1/conciliacoes` — multipart com `arquivo` (CSV ≤ 5MB) e
  `nome_referencia` (string). Retorna HTTP 202 + `{conciliacao_id, status}`.
- `GET /v1/conciliacoes/<id>` — retorna status + sumario (total_matches,
  total_divergencias).
- `GET /v1/conciliacoes/<id>/matches?status=<match|divergencia>&limit=100&offset=0`
  — listagem paginada das linhas.

## Hooks que vao validar

- `migration-rls-check.sh` — confere que toda `_tenanted` criada nesta US tem
  RLS + policy.
- `secrets-scanner.sh` (+gitleaks) — confere que nenhum CSV de teste vazou na PR.
- `anti-mascaramento.sh` — bloqueia `pytest.mark.skip` sem ADR nos testes da US.
- `ropa-consistency.sh` — confere que a operacao "ingestao de CSV bancario"
  esta listada em `docs/conformidade/lgpd/ropa.md` antes do merge.
- `frontmatter-validator` — confere cabecalho deste arquivo + spec + tasks.

## Testes 1:1 com ACs

- `tests/unit/financas/test_conciliacao_happy.py::test_50_matches_exatos` — **AC-CONC-001-1**.
- `tests/unit/financas/test_conciliacao_parcial.py::test_match_diferenca_centavos` — **AC-CONC-001-2**.
- `tests/unit/financas/test_conciliacao_divergencia.py::test_sem_match_vira_divergencia` — **AC-CONC-001-3**.
- `tests/unit/financas/test_conciliacao_csv_invalido.py::test_422_para_csv_quebrado` — **AC-CONC-001-4**.
- `tests/isolation/test_conciliacao_tenant_isolation.py::test_t1_nao_match_em_conta_de_t2` — **AC-CONC-001-5**.
- `tests/unit/test_pii_masker.py::test_conciliacao_logs_mascarados` — **AC-CONC-001-6**.
- `tests/integration/financas/test_audit_log_worm.py::test_update_em_audit_log_bloqueado` — **AC-CONC-001-7**.

## Riscos de implementacao

Riscos TECNICOS — banco, performance, deploy, integracao. Riscos de produto
ficam em `spec.md`.

- **R-IMPL-001 — Variabilidade de CSV entre bancos (Itau, Santander, Bradesco
  exportam delimitador e header diferentes).**
  Mitigacao: parser modular com 1 strategy por banco; deteccao automatica do
  banco pelo padrao do header das 3 primeiras linhas. Adapter por banco mora
  em `conciliab/financas/csv_parsers/<banco>.py`.

- **R-IMPL-002 — Job Celery pode estourar memoria com CSV grande (>10k linhas).**
  Mitigacao: limite hard de 5MB no upload + parse streaming (linha a linha,
  nao carrega tudo em memoria); job worker com `--max-memory-per-child=300MB`.

- **R-IMPL-003 — Trigger `audit_trail_match` pode virar gargalo em conciliacao
  grande (cada match dispara INSERT em `audit_log`).**
  Mitigacao: usar trigger AFTER STATEMENT (uma vez por batch) em vez de
  AFTER ROW; benchmark documentado em `docs/governanca/bench-audit-trigger.md`.

- **R-IMPL-004 — Reconciliacao S3 ↔ PG pode ter orphan (arquivo subiu mas
  linha nao foi inserida).**
  Mitigacao: gravar S3 com retry idempotente; transacao explicita para
  `arquivo_recebido_tenanted`; job mensal `orphan-detector` listado em
  `docs/operacao/runbooks/reconciliar-s3-pg.md`.

## Subagentes convocados pra review

- [x] `auditor-seguranca` (RLS, isolamento tenant, mask_pii em logs)
- [x] `auditor-lgpd` (operacao nova de PII no ROPA)
- [x] `auditor-fiscal-audit` (audit_log WORM cobrindo match)
- [x] `auditor-qualidade` (testes cobrem ACs 1:1)
- [x] `auditor-doc-quality` (jargao traduzido, frontmatter)
- [ ] `ux-designer` (esta US nao tem tela — fica para US-CONC-003)

---
> Termos tecnicos: ver `docs/glossario.md`.
