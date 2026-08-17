---
owner: roldao
revisado-em: 2026-05-27
status: stable
origem: tasks.md
proximo: kickoff-fase.md
idioma: pt-BR
limite-linhas: 200
proposito: exemplo preenchido do meta-template para referência e comparação
---

# Checklist — pronto pra codar — conciliab

> Todos os itens precisam estar marcados antes do primeiro commit de codigo
> de produto. Marcar exige link OU caminho de arquivo OU comando que comprova.
>
> **REGRA do §4 deste checklist** (vide secao "Como usar este checklist", item 2):
> item sem evidencia fica DESMARCADO, mesmo que pareca pronto. Item cujo arquivo
> existe APENAS conceitualmente fora deste exemplo deve ficar `[N/A]` com
> justificativa explicita, NUNCA `[x]` mentindo presenca.

> **Este CHECKLIST vs `kickoff-fase.md` — dois gates, dois momentos.**
> CHECKLIST (este doc) = gate de PROJETO, uma vez.
> `kickoff-fase.md` = gate de FASE, repetido a cada nova fase.
>
> Ordem: CHECKLIST → kickoff F-A → execucao → kickoff F-B → ...

## Documentacao canonica

| Item | Evidencia |
|---|---|
| [x] `README.md` existe e esta em status `stable` | [`README.md`](./README.md), frontmatter status: stable |
| [x] `AGENTS.md` existe e esta em status `stable` | [`AGENTS.md`](./AGENTS.md), frontmatter status: stable |
| [N/A] `CONTRIBUTING.md` existe | Fora deste exemplo — exemplo foca em camadas estruturais. Em projeto real, criar a partir de `templates/CONTRIBUTING.template.md`. Justificativa §4 abaixo. |
| [x] `SECURITY.md` existe | [`SECURITY.md`](./SECURITY.md) |
| [N/A] `MAINTAINERS.md` existe | Fora deste exemplo — projeto solo/time pequeno, papel coberto por `AGENTS.md` §5 e `docs/governanca/catalogo-auditores.md`. |
| [x] `REGRAS-INEGOCIAVEIS.md` tem >= 10 IDs, cada um com hook OU auditor mapeado | [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) — 12 INV de produto + 11 INV-AGENT = 23 IDs, cada um com hook/auditor na tabela |
| [x] `pyproject.toml` existe com lint/types/test configurados | [`pyproject.toml`](./pyproject.toml) — Poetry + Ruff + Mypy strict + Pytest + Hypothesis |

## Discovery e decisoes fundadoras

| Item | Evidencia |
|---|---|
| [N/A] Descoberta: `descoberta/sintese-final.md` em status `stable` | Sintese completa esta fora deste exemplo. Existe apenas `docs/descoberta/problema.md` como amostra. Em projeto real, complementar com 8+ entrevistas (EE-001..EE-NNN) em `descoberta/entrevistas/`. |
| [x] `ADR-0000` (uso de IA) aceita | [`docs/adr/ADR-0000-uso-de-ia.md`](./docs/adr/ADR-0000-uso-de-ia.md), status: aceita, 2026-02-10 |
| [x] `ADR-0001` (stack) aceita | [`docs/adr/ADR-0001-stack-python-fastapi.md`](./docs/adr/ADR-0001-stack-python-fastapi.md), status: aceita, 2026-02-15 |
| [N/A] Glossario (`docs/glossario.md`) tem >= 20 termos | Glossario completo fora deste exemplo — 34 termos planejados (conciliacao, OFX, CSV, tenant, RLS, WORM, ROPA, DPO, ANPD, Bacen, Open Finance, PIX, TED, DOC, COMPE, ISPB, FEBRABAN, etc.). Em projeto real, criar a partir de `templates/glossario.template.md`. |

## Produto e dominio

| Item | Evidencia |
|---|---|
| [N/A] PRD raiz (`docs/PRD.md`) lista modulos com prioridade | PRD completo fora deste exemplo — 4 modulos planejados: conciliacao (P0, exemplificado), relatorio (P1), open-finance (P2), billing (P2). |
| [N/A] `docs/testes/estrategia.md` definida (piramide, gates, ferramentas) | Documento fora deste exemplo — piramide 70/20/10 unit/integration/isolation, ferramentas pytest + hypothesis (declaradas em [`pyproject.toml`](./pyproject.toml)). |
| [x] Primeira fase (F-A) tem `spec.md` + `plan.md` + `tasks.md` preenchidos | [`docs/dominios/financas/modulos/conciliacao/spec.md`](./docs/dominios/financas/modulos/conciliacao/spec.md), [`plan.md`](./docs/dominios/financas/modulos/conciliacao/plan.md), [`tasks.md`](./docs/dominios/financas/modulos/conciliacao/tasks.md) |
| [x] `tasks.md` referencia ACs do `spec.md` (coluna `ac-cobertos`) | [`tasks.md`](./docs/dominios/financas/modulos/conciliacao/tasks.md) — coluna `ac-cobertos` preenchida |
| [x] `plan.md` referencia ACs do `spec.md` | [`plan.md`](./docs/dominios/financas/modulos/conciliacao/plan.md) §"Testes 1:1 com ACs" |
| [x] Testes 1:1 com ACs existem (no plano) | [`plan.md`](./docs/dominios/financas/modulos/conciliacao/plan.md) §"Testes 1:1 com ACs" — 7 testes mapeados pros 7 ACs |
| [x] `kickoff-fase.md` da primeira fase esta pronto | [`docs/faseamento/F-A/kickoff.md`](./docs/faseamento/F-A/kickoff.md) |

## Conformidade e seguranca (C6)

| Item | Evidencia |
|---|---|
| [x] `docs/conformidade/lgpd/ropa.md` existe e esta atualizado | [`docs/conformidade/lgpd/ropa.md`](./docs/conformidade/lgpd/ropa.md), status: stable, 6 operacoes registradas |
| [x] `docs/conformidade/lgpd/retencao-dados.md` existe | [`docs/conformidade/lgpd/retencao-dados.md`](./docs/conformidade/lgpd/retencao-dados.md) |
| [x] `docs/seguranca/threat-model.md` (STRIDE por componente) | [`docs/seguranca/threat-model.md`](./docs/seguranca/threat-model.md), 6 componentes: API, RDS, Cognito, S3, fila Celery, Secrets Manager |
| [x] `docs/seguranca/dependency-policy.md` (max-age, SBOM, scanning) | [`docs/seguranca/dependency-policy.md`](./docs/seguranca/dependency-policy.md) — SBOM via cyclonedx-py, pip-audit em CI, Dependabot |
| [x] `docs/seguranca/resposta-incidente.md` (playbook IR + comunicacao ANPD 72h) | [`docs/seguranca/resposta-incidente.md`](./docs/seguranca/resposta-incidente.md) |

## Governanca / auditoria (C7)

| Item | Evidencia |
|---|---|
| [x] `docs/governanca/catalogo-auditores.md` lista os auditores ativos | [`docs/governanca/catalogo-auditores.md`](./docs/governanca/catalogo-auditores.md) — 9 auditores (A-001..A-009) |
| [x] Pelo menos 5 auditores catalogados com referencia para definicao + duas amostras completas com golden cases POSITIVO+NEGATIVO | Catalogo lista 9 auditores (A-001..A-009). Amostras completas em `.claude/agents/`: [`auditor-lgpd.md`](./.claude/agents/auditor-lgpd.md) (foco PII + Art. 18 LGPD) + [`auditor-tenant.md`](./.claude/agents/auditor-tenant.md) (foco RLS + queries sem `WHERE tenant_id`). Os outros 7 referenciados no catalogo seguem o mesmo padrao a partir de `templates/auditor.template.md`. |

## Operacao (C8)

| Item | Evidencia |
|---|---|
| [x] `docs/operacao/slo-sli.md` definido (servicos criticos, SLO, error budget) | [`docs/operacao/slo-sli.md`](./docs/operacao/slo-sli.md) — 4 servicos criticos |
| [x] `docs/operacao/backup.md` existe (politica + janelas) | [`docs/operacao/backup.md`](./docs/operacao/backup.md) |
| [x] `docs/operacao/disaster-recovery.md` existe (RTO/RPO + cenarios) | [`docs/operacao/disaster-recovery.md`](./docs/operacao/disaster-recovery.md) |
| [x] `docs/operacao/on-call.md` (escala + SLA por severidade) | [`docs/operacao/on-call.md`](./docs/operacao/on-call.md) |
| [x] `docs/operacao/change-management.md` (janela + freeze) | [`docs/operacao/change-management.md`](./docs/operacao/change-management.md) |
| [x] `docs/operacao/observabilidade.md` (logs/metricas/traces) | [`docs/operacao/observabilidade.md`](./docs/operacao/observabilidade.md) |
| [x] `docs/operacao/release-process.md` (versionamento + rollback) | [`docs/operacao/release-process.md`](./docs/operacao/release-process.md) |
| [x] `docs/operacao/deployment-strategy.md` (rolling/canary/migration) | [`docs/operacao/deployment-strategy.md`](./docs/operacao/deployment-strategy.md) |
| [x] `docs/operacao/capacity-planning.md` (forecast + auto-scaling) | [`docs/operacao/capacity-planning.md`](./docs/operacao/capacity-planning.md) |
| [x] `docs/operacao/performance-testing.md` (baseline + regressao) | [`docs/operacao/performance-testing.md`](./docs/operacao/performance-testing.md) |
| [x] Runbooks criticos existem | [`runbooks/restauracao-backup.md`](./docs/operacao/runbooks/restauracao-backup.md), [`atender-pedido-eliminacao.md`](./docs/operacao/runbooks/atender-pedido-eliminacao.md), [`api-erro-elevado.md`](./docs/operacao/runbooks/api-erro-elevado.md), [`cognito-degradado.md`](./docs/operacao/runbooks/cognito-degradado.md), [`failover-regiao.md`](./docs/operacao/runbooks/failover-regiao.md) |

## Governanca tecnica (gates automatizados)

| Item | Evidencia |
|---|---|
| [x] `.pre-commit-config.yaml` ativo com hooks nucleo + extensao | Copiado de `templates/pre-commit-config.template.yaml`; aponta para `.claude/hooks/*.sh` reutilizando os hooks do Claude Code via dual-mode. Hooks ativos: `block-destructive`, `secrets-scanner` (gitleaks), `frontmatter-validator`, `anti-mascaramento`, `override-ledger`. Extensao a ativar conforme necessidade: `large-file-blocker`, `migration-direction`, `env-file-leak`, `migration-rls-check`. |
| [x] CI rodando mesmos hooks + auditores pesados + SBOM | `.github/workflows/ci.yml` configurado — paridade local-remoto + `cyclonedx-py` + auditores `auditor-seguranca`, `auditor-lgpd`, `auditor-fiscal-audit`. Stack de comandos canonicos em [`pyproject.toml`](./pyproject.toml) + [`AGENTS.md`](./AGENTS.md) §6. |
| [x] `CODEOWNERS` cobre paths criticos | `.github/CODEOWNERS` cobrindo `migrations/`, `conciliab/lgpd/`, `REGRAS-INEGOCIAVEIS.md`, `.claude/agents/`, `docs/conformidade/`, `docs/seguranca/` — owner do dominio define quem aprova cada path. |

## Configuracao do repositorio

| Item | Evidencia |
|---|---|
| [x] `.gitignore` cobre a stack escolhida + `.claude/settings.local.json` | `.gitignore` derivado de `templates/gitignore.template`, com adicionais Python (.venv, __pycache__, .mypy_cache, .pytest_cache, dist/, .coverage, htmlcov/), `.env*`, `.claude/settings.local.json`, `.claude/.override-reason`. |
| [N/A] `.mcp.json` + `docs/governanca/politica-mcp.md` | Fora deste exemplo. Projeto real usa MCP Claude Code (playwright p/ smoke test, pytest mcp). |
| [x] `nao-aplica.md` lista camadas puladas com justificativa + gatilho de reavaliacao | [`nao-aplica.md`](./nao-aplica.md) — 8 entradas (i18n, .cursorrules, .windsurfrules, kiro-steering, on-call 24/7, RFC/governanca-comunidade, model-card/data-card, data-contract) |

## Como usar este checklist

1. Marcar cada item APENAS com evidencia (link, caminho, comando).
2. **Item sem evidencia fica desmarcado, mesmo que pareca pronto.** Item cujo
   artefato e "fora deste exemplo" (existe na realidade de um projeto, mas nao
   foi materializado neste pacote-exemplo) recebe `[N/A]` com justificativa
   explicita. NUNCA marcar `[x]` mentindo presenca — auditor-meta vai pegar.
3. Quando todos marcados (ou N/A com justificativa), mudar `status` no
   frontmatter para `stable` e abrir o primeiro PR de codigo. **Este checklist
   foi marcado em 2026-02-28**, quando o `conciliab` saiu da fase de discovery
   para a fase F-A (foundations), e revisado em **2026-05-27** apos auditoria
   completa.
4. **Justificativa para `[N/A]`**: os arquivos marcados `[N/A]` neste exemplo
   sao artefatos que dependem de infraestrutura externa ao pacote-exemplo
   (CI/CD real do GitHub, `.pre-commit-config.yaml` que precisa de `pre-commit`
   instalado, definicoes `.claude/agents/<nome>.md` que dependem de harness
   ativo). Em um projeto real saindo do template, esses arquivos sao
   obrigatorios e devem ser criados a partir dos templates em `templates/`.
5. `auditor-doc-quality` verifica este arquivo: marcacao `[x]` sem evidencia
   gera finding CRITICO; `[N/A]` sem justificativa gera finding ALTO.

---
> Termos tecnicos: ver `docs/glossario.md` (fora deste exemplo).
