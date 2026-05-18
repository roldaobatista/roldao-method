---
tipo: checklist
nome: release-readiness
versao: 1.0
revisado-em: 2026-05-18
status: stable
owner: framework
---

# Release Readiness — gates pré-deploy

> Use antes de cada release de produção. Cada bloco tem itens **bloqueantes** (marcados 🔴) e **avisos** (marcados 🟡). Bloqueante não passa sem resolver.

## 1. Código e testes

- 🔴 Suite de testes verde no CI (não local).
- 🔴 Cobertura agregada ≥ baseline da release anterior (`auditor-qualidade` valida).
- 🔴 Nenhum teste skipped/disabled sem ID rastreável.
- 🔴 Lint + type-check passando.
- 🟡 Cobertura de módulos críticos ≥ 80%.
- 🟡 Tempo da suite de CI < limite (ex: 10 min).

## 2. Mudanças

- 🔴 `/checkpoint` rodado em todas as branches que vão pra release.
- 🔴 CHANGELOG.md atualizado com a versão da release.
- 🔴 Versão no `package.json` bate com CHANGELOG.
- 🔴 Breaking changes documentados em seção "Atenção" da release note.
- 🟡 Release notes geradas em `docs/releases/vX.Y.Z.md`.

## 3. Segurança

- 🔴 `auditor-seguranca` rodou e aprovou (ou ressalvas resolvidas).
- 🔴 Nenhum secret novo em código (hooks `secrets-scanner` + `block-secrets-in-commit-message` validam).
- 🔴 Dependencies novas auditadas (supply chain).
- 🔴 Permissões/RBAC revisadas se autenticação/autorização mudaram.
- 🟡 Pentest / scan automático sem high/critical pendente.
- 🟡 Dependências sem CVE conhecido (`npm audit` / `pip-audit`).

## 4. Dados / Migrations

- 🔴 Migration tem plano de rollback documentado.
- 🔴 Migration testada em ambiente de staging com volume comparável.
- 🔴 Backup recente (≤ 24h) confirmado antes de aplicar.
- 🔴 Janela de manutenção comunicada se haverá downtime.
- 🟡 Migration roda em < N min (ex: 5 min) ou foi quebrada em fases.
- 🟡 Plano de migração reversível (dual-write antes de cutover).

## 5. LGPD / Privacidade

- 🔴 Se feature toca dado pessoal novo: base legal documentada.
- 🔴 Política de privacidade atualizada se novo tratamento.
- 🔴 RIPD escrito se tratamento de alto risco (skill `gerar-ripd` do addon `lgpd-compliance`).
- 🟡 Canal DPO testado (responde em 15 dias).

## 6. Fiscal (se aplicável)

- 🔴 Se emite NF-e: ambiente SEFAZ vem de env (FISCAL-003).
- 🔴 Certificado por tenant, nunca hardcoded (FISCAL-002).
- 🔴 Plano de contingência testado (SVC-AN/SVC-RS/EPEC).
- 🟡 Cálculo paralelo CBS/IBS se Reforma Tributária aplicável (FISCAL-006).

## 7. Observabilidade

- 🔴 Logs estruturados (JSON) em produção.
- 🔴 Métricas críticas no dashboard (latência p50/p95, erro %, throughput).
- 🔴 Alertas configurados pros novos endpoints/jobs.
- 🟡 Trace distribuído OK (se microsserviços).
- 🟡 Dashboard de release específico (compara N min antes vs N min depois).

## 8. Comunicação

- 🔴 Release note publicada (CHANGELOG + docs/releases/).
- 🟡 Cliente notificado se mudança visível (in-app banner, email).
- 🟡 Suporte ciente das mudanças (briefing).
- 🟡 Time de vendas/CS atualizado.

## 9. Plano de rollback

- 🔴 Procedimento de rollback documentado (1 página, executável por dev de plantão).
- 🔴 RTO (Recovery Time Objective) definido — quanto tempo até voltar se der ruim.
- 🟡 Feature flag pra desligar rapidamente se possível.
- 🟡 Comunicação de incidente pronta (template + canais).

## 10. Pós-release (próximos passos)

- 🟡 Monitorar dashboard nos primeiros 60 min.
- 🟡 Coletar feedback (cliente, suporte, observabilidade).
- 🟡 Agendar `/retro` quando o marco fechar.

---

## Veredito

- [ ] **PRONTO PRA RELEASE** (todos 🔴 verdes)
- [ ] **RESSALVAS** (alguns 🟡 — registrar como débito conhecido)
- [ ] **NÃO PRONTO** (1+ 🔴 vermelho — resolver primeiro)

## Anti-padrões

- "Vamos resolver depois do deploy" pra item 🔴 → adiar release.
- "Rollback é simples, é só reverter o commit" — sem plano testado → ❌.
- Release sem alguém de plantão nos primeiros 60 min → ❌.
- "Cobertura caiu mas é OK porque o módulo é pequeno" → forçar justificativa formal.
