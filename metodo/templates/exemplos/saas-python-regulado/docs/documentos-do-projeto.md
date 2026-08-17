---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 120
proposito: tabela de docs obrigatórios do conciliab com status — auditor-doc-quality fecha PASS ZERO em cima desta lista
---

# Documentos do projeto — conciliab

Tabela de docs obrigatórios. Status: `stable` (pronto) / `draft` (esqueleto) / `pending` (não existe).

| Doc | Camada | Status | Obs |
|---|---|---|---|
| README.md | C0 | stable | — |
| AGENTS.md | C0 | stable | — |
| CLAUDE.md | C0 | stable | — |
| REGRAS-INEGOCIAVEIS.md | C0 | stable | — |
| SECURITY.md | C0 | stable | — |
| CHECKLIST-PRONTO-PRA-CODAR.md | C0 | stable | — |
| nao-aplica.md | C10 | stable | — |
| .claude/memory/constitution.md | C11 | stable | — |
| descoberta/problema.md | C1 | stable | — |
| adr/ADR-0000-uso-de-ia.md | C2 | stable | — |
| adr/ADR-0001-stack-python-fastapi.md | C2 | stable | — |
| adr/ADR-0002-multi-tenant-rls.md | C2 | stable | — |
| adr/ADR-0003-storage-postgres.md | C2 | stable | — |
| dominios/financas/modulos/conciliacao/spec.md | C4 | stable | — |
| dominios/financas/modulos/conciliacao/plan.md | C4 | stable | — |
| dominios/financas/modulos/conciliacao/tasks.md | C4 | stable | — |
| faseamento/F-A/kickoff.md | C5 | stable | — |
| conformidade/lgpd/ropa.md | C6 | stable | bloqueante para deploy (INV-LGPD-001) |
| conformidade/lgpd/retencao-dados.md | C6 | stable | — |
| seguranca/threat-model.md | C6 | stable | revisão anual |
| seguranca/dependency-policy.md | C6 | stable | — |
| seguranca/resposta-incidente.md | C6 | stable | — |
| governanca/catalogo-auditores.md | C7 | stable | 8 auditores ativos |
| operacao/observabilidade.md | C8 | stable | — |
| operacao/slo-sli.md | C8 | stable | — |
| operacao/on-call.md | C8 | stable | — |
| operacao/backup.md | C8 | stable | RTO 4h, RPO 15min |
| operacao/disaster-recovery.md | C8 | stable | — |
| operacao/change-management.md | C8 | stable | — |
| operacao/release-process.md | C8 | stable | — |
| operacao/deployment-strategy.md | C8 | stable | — |
| operacao/capacity-planning.md | C8 | stable | — |
| operacao/performance-testing.md | C8 | stable | — |
| operacao/runbooks/api-erro-elevado.md | C8 | stable | — |
| operacao/runbooks/atender-pedido-eliminacao.md | C8 | stable | LGPD Art. 18, VI |
| operacao/runbooks/cognito-degradado.md | C8 | stable | — |
| operacao/runbooks/failover-regiao.md | C8 | stable | — |
| operacao/runbooks/restauracao-backup.md | C8 | stable | — |
| CONVENCOES-DOC.md | C10 | stable | — |
| INDICE.md | C10 | stable | atualizar a cada doc novo |
| documentos-do-projeto.md | C10 | stable | este arquivo |
| .agent/CURRENT.md | C11 | pending | criar na primeira sessão multi-dev |

## Gate PASS ZERO

Para fechar marco F-A (Foundations): todos os docs com camada C0/C2/C5/C6 em `stable`.
Para fechar marco F-1 (primeiro módulo de produto): adicionais em C4 e C8 conforme escopo.
