---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: índice navegável de toda a documentação do conciliab — ponto único de entrada para humano e agente IA
---

# Índice — conciliab

Ponto único de navegação. Documentos novos entram aqui no mesmo PR que os cria. Auditor `auditor-doc-quality` verifica órfãos.

## Raiz do repositório (C0)

- [`README.md`](../README.md) — visão de 1 minuto.
- [`AGENTS.md`](../AGENTS.md) — canônico de produto para agente IA.
- [`CLAUDE.md`](../CLAUDE.md) — adendo Claude Code.
- [`REGRAS-INEGOCIAVEIS.md`](../REGRAS-INEGOCIAVEIS.md) — invariantes INV-*.
- [`SECURITY.md`](../SECURITY.md) — canal de vulnerabilidades.
- [`CHECKLIST-PRONTO-PRA-CODAR.md`](../CHECKLIST-PRONTO-PRA-CODAR.md) — gate de início.
- [`nao-aplica.md`](../nao-aplica.md) — camadas pulada e gatilho de reavaliação.

## Convenções (C10)

- [`CONVENCOES-DOC.md`](./CONVENCOES-DOC.md) — nomenclatura, kebab-case, frontmatter.
- [`documentos-do-projeto.md`](./documentos-do-projeto.md) — tabela de docs obrigatórios e status.

## Descoberta (C1)

- [`descoberta/problema.md`](./descoberta/problema.md) — dor real, evidência, hipótese.

## ADRs (C2)

- [`adr/ADR-0000-uso-de-ia.md`](./adr/ADR-0000-uso-de-ia.md)
- [`adr/ADR-0001-stack-python-fastapi.md`](./adr/ADR-0001-stack-python-fastapi.md)
- [`adr/ADR-0002-multi-tenant-rls.md`](./adr/ADR-0002-multi-tenant-rls.md)
- [`adr/ADR-0003-storage-postgres.md`](./adr/ADR-0003-storage-postgres.md)

## Produto / domínios (C4)

- [`dominios/financas/modulos/conciliacao/spec.md`](./dominios/financas/modulos/conciliacao/spec.md)
- [`dominios/financas/modulos/conciliacao/plan.md`](./dominios/financas/modulos/conciliacao/plan.md)
- [`dominios/financas/modulos/conciliacao/tasks.md`](./dominios/financas/modulos/conciliacao/tasks.md)

## Faseamento (C5)

- [`faseamento/F-A/kickoff.md`](./faseamento/F-A/kickoff.md)

## Conformidade — LGPD (C6)

- [`conformidade/lgpd/ropa.md`](./conformidade/lgpd/ropa.md)
- [`conformidade/lgpd/retencao-dados.md`](./conformidade/lgpd/retencao-dados.md)

## Segurança (C6)

- [`seguranca/threat-model.md`](./seguranca/threat-model.md)
- [`seguranca/dependency-policy.md`](./seguranca/dependency-policy.md)
- [`seguranca/resposta-incidente.md`](./seguranca/resposta-incidente.md)

## Governança (C7)

- [`governanca/catalogo-auditores.md`](./governanca/catalogo-auditores.md)

## Operação (C8)

- [`operacao/observabilidade.md`](./operacao/observabilidade.md)
- [`operacao/slo-sli.md`](./operacao/slo-sli.md)
- [`operacao/on-call.md`](./operacao/on-call.md)
- [`operacao/backup.md`](./operacao/backup.md)
- [`operacao/disaster-recovery.md`](./operacao/disaster-recovery.md)
- [`operacao/change-management.md`](./operacao/change-management.md)
- [`operacao/release-process.md`](./operacao/release-process.md)
- [`operacao/deployment-strategy.md`](./operacao/deployment-strategy.md)
- [`operacao/capacity-planning.md`](./operacao/capacity-planning.md)
- [`operacao/performance-testing.md`](./operacao/performance-testing.md)
- [`operacao/runbooks/api-erro-elevado.md`](./operacao/runbooks/api-erro-elevado.md)
- [`operacao/runbooks/atender-pedido-eliminacao.md`](./operacao/runbooks/atender-pedido-eliminacao.md)
- [`operacao/runbooks/cognito-degradado.md`](./operacao/runbooks/cognito-degradado.md)
- [`operacao/runbooks/failover-regiao.md`](./operacao/runbooks/failover-regiao.md)
- [`operacao/runbooks/restauracao-backup.md`](./operacao/runbooks/restauracao-backup.md)

## Estado vivo (C11)

- `.claude/memory/constitution.md` — princípios fundadores.
- `.agent/CURRENT.md` — foco atual da sessão.
