---
modulo: conciliacao
owner: <DEV-1>
revisado-em: 2026-05-27
status: stable
origem: plan.md
proximo: CHECKLIST-PRONTO-PRA-CODAR.md
idioma: pt-BR
limite-linhas: 200
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: docs/dominios/financas/modulos/conciliacao/tasks.md
(preenchido no exemplo saas-python-regulado)
-->

# Tasks — conciliacao

> **Estimativa**: usar escala P/M/G (mesma de `kickoff-fase.md`).
> - **P**: ate 2h
> - **M**: meio dia (~4h)
> - **G**: dia ou mais (≥8h)
>
> **plan-passo**: secao do `plan.md` que esta task implementa.
> **ac-cobertos**: ACs do `spec.md` que esta task satisfaz.
> Tasks puramente de scaffold/infra podem ter `ac-cobertos: —`.

| ID | Descricao | plan-passo | ac-cobertos | Estimativa | Depende |
|---|---|---|---|---|---|
| T-CONC-001 | Scaffold: criar pacote `conciliab/financas/conciliacao/` + estrutura de testes (`tests/unit/financas/`, `tests/isolation/`, `tests/integration/financas/`). | Estrategia §1 | — | P | — |
| T-CONC-002 | Migration `0007_create_arquivo_recebido_tenanted.py` — tabela + RLS + index. | Modelos §1 | AC-CONC-001-5 | P | T-CONC-001 |
| T-CONC-003 | Migration `0008_create_conciliacao_tenanted.py` — tabela + RLS + enum status. | Modelos §1 | AC-CONC-001-1, AC-CONC-001-5 | P | T-CONC-002 |
| T-CONC-004 | Migration `0009_create_match_tenanted.py` — tabela + RLS + FK. | Modelos §1 | AC-CONC-001-1, AC-CONC-001-2 | P | T-CONC-003 |
| T-CONC-005 | Migration `0010_audit_log_triggers.py` — triggers `prevent_update_delete` e `audit_trail_match`. | Modelos §1 + Riscos R-IMPL-003 | AC-CONC-001-7 | M | T-CONC-004 |
| T-CONC-006 | Util `mask_pii()` — funcao + teste unit. Aplicada em todo log estruturado do modulo. | Estrategia §3 + INV-AGENT-008 | AC-CONC-001-6 | M | T-CONC-001 |
| T-CONC-007 | Parser CSV generico + strategy por banco (Itau, Santander, Bradesco). Streaming linha-a-linha (max 5MB upload). | Estrategia §1 + R-IMPL-001, R-IMPL-002 | AC-CONC-001-1, AC-CONC-001-4 | G | T-CONC-001 |
| T-CONC-008 | Servico `S3UploadService` — `put_object` idempotente com `Content-MD5`, retorna `s3_path` + `sha256`. | Estrategia §2 + R-IMPL-004 | AC-CONC-001-1 | M | T-CONC-001 |
| T-CONC-009 | Endpoint `POST /v1/conciliacoes` — multipart, valida, sobe S3, enfileira Celery, retorna HTTP 202. | Endpoints §1 | AC-CONC-001-1, AC-CONC-001-4 | M | T-CONC-007, T-CONC-008 |
| T-CONC-010 | Task Celery `processa_conciliacao` — orquestra parse + matching + persistencia + audit_log. | Estrategia §1 + Estrategia §2 | AC-CONC-001-1, AC-CONC-001-3 | G | T-CONC-007 |
| T-CONC-011 | Regra de match `match-exato-valor-data` — modulo `conciliab/financas/matching/regras/exato.py`. | Estrategia §"motor de matching" | AC-CONC-001-1 | M | T-CONC-010 |
| T-CONC-012 | Regra de match `match-parcial-tolerancia-taxa` — diferenca ≤ R$ 5,00 OU ≤ 1%. | Estrategia §"motor de matching" + R-PROD-002 | AC-CONC-001-2 | M | T-CONC-011 |
| T-CONC-013 | Endpoints `GET /v1/conciliacoes/<id>` e `GET /v1/conciliacoes/<id>/matches`. | Endpoints §2, §3 | AC-CONC-001-1, AC-CONC-001-3 | M | T-CONC-009 |
| T-CONC-014 | Testes unit dos ACs 1, 2, 3, 4 (`tests/unit/financas/`). | Testes 1:1 com ACs | AC-CONC-001-1, AC-CONC-001-2, AC-CONC-001-3, AC-CONC-001-4 | M | T-CONC-011, T-CONC-012 |
| T-CONC-015 | Teste de isolamento `tests/isolation/test_conciliacao_tenant_isolation.py` — confirma INV-TENANT-001. | Testes 1:1 com ACs | AC-CONC-001-5 | M | T-CONC-010 |
| T-CONC-016 | Teste integration `tests/integration/financas/test_audit_log_worm.py` — confirma INV-AUDIT-002. | Testes 1:1 com ACs | AC-CONC-001-7 | P | T-CONC-005 |
| T-CONC-017 | Teste unit `tests/unit/test_pii_masker.py::test_conciliacao_logs_mascarados`. | Testes 1:1 com ACs | AC-CONC-001-6 | P | T-CONC-006 |
| T-CONC-018 | Adicionar linha em `docs/conformidade/lgpd/ropa.md` para operacao "ingestao e processamento de extrato bancario". | INV-LGPD-001 | — | P | — |
| T-CONC-019 | Atualizar `docs/glossario.md` com termos novos: "tolerancia de taxa", "regra de match", "divergencia de conciliacao". | INV-AGENT-010 | — | P | — |
| T-CONC-020 | Atualizar `docs/operacao/runbooks/reconciliar-s3-pg.md` para cobrir `arquivo_recebido_tenanted`. | R-IMPL-004 | — | M | T-CONC-002 |

<!-- 1-2 commits por task. Cada commit cita o T-CONC-NNN na mensagem. -->
<!-- Toda task com logica de negocio tem ≥ 1 AC em ac-cobertos. -->

## Ordem de execucao sugerida

1. **Bloco infra (paralelo)**: T-CONC-001, T-CONC-006, T-CONC-018, T-CONC-019.
2. **Bloco migrations (serial)**: T-CONC-002 → T-CONC-003 → T-CONC-004 → T-CONC-005.
3. **Bloco servicos**: T-CONC-007, T-CONC-008 (paralelos).
4. **Bloco endpoint+task**: T-CONC-009, T-CONC-010, T-CONC-011, T-CONC-012,
   T-CONC-013 (semi-paralelos).
5. **Bloco testes**: T-CONC-014 a T-CONC-017 (paralelos quando dependencias
   prontas).
6. **Bloco operacao**: T-CONC-020.

Estimativa total: ~5-6 dias-pessoa de <DEV-1> ou <DEV-2>. <DEV-3> assume
T-CONC-014..017 (testes) sob review do <DEV-1>.

---
> Termos tecnicos: ver `docs/glossario.md`.
