---
owner: Ana Silva
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: processo de release do conciliab — versionamento CalVer, changelog, tagging, rollout estagiado, rollback automatico por metricas
---

<!-- destino: docs/operacao/release-process.md (preenchido no exemplo saas-python-regulado) -->

# Processo de Release — conciliab

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE.

## 1. Versionamento

Convencao escolhida: **CalVer** (`YYYY.MM.PATCH`).

Justificativa: produto SaaS sem API publica consumida por terceiros, cadencia mensal previsivel. CalVer evita debate "isso e MINOR ou MAJOR?" e facilita comunicacao com o cliente PME ("estamos na versao de maio").

Exemplos:
- `2026.05.1` — primeira release de maio/2026.
- `2026.05.3` — terceira release de maio/2026.
- `2026.06.0` — primeira release de junho (incrementa minor mesmo se for so bugfix da anterior).

Breaking change em CalVer: marcada explicitamente no CHANGELOG como `BREAKING` + comunicacao previa de 2 versoes (§9).

ADR: ver `docs/adr/ADR-0004-versionamento-calver.md` (a criar quando primeira release publica sair de beta).

## 2. Changelog (obrigatorio)

Toda release tem entrada em `CHANGELOG.md` antes da tag ser criada. Formato [Keep a Changelog](https://keepachangelog.com/pt-BR/):

```
## [2026.05.3] - 2026-05-22
### Adicionado
- Exportar conciliacao em PDF assinado com hash SHA-256 (T-CONC-042)
### Alterado
- Limite de upload CSV aumentado de 10MB para 25MB
### Corrigido
- Crash ao subir OFX com encoding ISO-8859-1 (issue #87)
### Seguranca
- Bump pyjwt 2.8.0 → 2.9.0 (CVE-2026-12345, severidade MEDIA)
### Removido / Breaking
- (nenhum)
```

> Sem entrada no changelog = release nao sai. Validado pelo gate §6 + auditor `auditor-doc-quality`.

## 3. Tagging git

- Tag anotada: `git tag -a v2026.05.3 -m "Release CalVer 2026-05-22"`.
- Tag aponta para commit que passou em todos gates de §6.
- Push da tag (`git push origin v2026.05.3`) sempre apos confirmacao de smoke test verde em staging.
- Tag dispara GitHub Action `release.yml` que gera SBOM + build Docker assinado.

## 4. Processo de cut (passo a passo)

| Etapa | Acao | Duracao alvo | Responsavel |
|---|---|---|---|
| **1. Freeze** | bloqueio de merge em `main`; so bugfix entra | 24h | Ana Silva |
| **2. Release candidate (RC)** | build assinado, deploy em staging com snapshot anonimizado de prod | 1-3 dias | release engineer (Diego Tavares na escala atual) |
| **3. Smoke test** | suite minima `tests/smoke/` + checklist manual em `docs/operacao/smoke-test.md` (fora exemplo) | < 30min | plantonista da semana |
| **4. Aprovacao** | Ana Silva confirma em `#change-approvals` | < 4h | Ana Silva |
| **5. Tag e publish** | tag git anotada, build de prod via GitHub Action, push para ECR | < 1h | release engineer |
| **6. Rollout** | estrategia §5 (canary → progressive) | 4-24h | release engineer + plantonista |
| **7. Verificacao pos-release** | §8 | 24h apos 100% | plantonista |

Janela de §1 e §2 do `change-management.md` aplica (terca/quarta/quinta 10-16h, respeitando freeze fiscal).

## 5. Rollout estagiado (staged rollout)

> Nunca subir 100% de uma vez quando ha mudanca de comportamento.

| Fase | % de trafego | Janela minima | Sinal verde para avancar |
|---|---|---|---|
| **Canary** | 5% (clientes-piloto + tenant interno de dogfood) | 2h | error_rate canary <= baseline + 10%, p95 <= baseline + 15% |
| **Progressive 25%** | 25% | 4h | metricas estaveis, zero alerta novo |
| **Progressive 50%** | 50% | 4h | idem |
| **Full** | 100% | — | idem por 24h apos 100% |

Implementacao tecnica: ALB weighted target groups + feature flag por tenant (`featureflags.py` com tabela `feature_flag_tenanted`).

Avancar so quando todos sinais verdes confirmados. Em duvida, pausar — pausa nao precisa de aprovacao; retomada precisa.

## 6. Rollback automatico por metricas

Gatilho automatico executado pelo GitHub Action `rollback.yml` sem intervencao humana:

| Metrica | Janela | Limite que dispara |
|---|---|---|
| error_rate (5xx + erros de aplicacao) | 5 min rolantes | > 2x baseline OU > 1% absoluto |
| latencia p95 | 5 min rolantes | > baseline + 50% |
| saturacao recurso critico (CPU/RAM/DB conn) | 5 min rolantes | > 85% |
| Cognito 5xx | 5 min rolantes | > 5% |

Rollback automatico: reverter trafego para versao N-1, manter logs/metricas para post-mortem, abrir incidente SEV2, notificar `#war-room`.

> Rollback manual sempre permitido. Plantonista nao precisa de aprovacao para reverter (INV-AGENT-004).

## 7. Responsabilidades

| Papel | Quem | Faz |
|---|---|---|
| Release manager | Ana Silva | coordena cut, comunica, garante gates |
| Aprovador | Ana Silva (Bruno Costa em ferias) | go/no-go formal em §4.4 |
| Plantao pos-release | plantonista da semana (ver `on-call.md`) | acompanha §8 nas 24h |
| Comunicacao cliente | Roldao (dono) | aviso previo §9 + release notes publicas |

## 8. Verificacao pos-release (24h)

- [ ] SLOs em [`slo-sli.md`](./slo-sli.md) dentro do alvo nas ultimas 24h.
- [ ] Zero alerta SEV1/SEV2 atribuido a esta release.
- [ ] Logs sem novo padrao de erro recorrente (> 10 ocorrencias).
- [ ] Feedback do canal de suporte (`#suporte`) sem aumento de chamados.
- [ ] Changelog publicado em GitHub Releases (`gh release create v2026.05.3 --notes-file CHANGELOG-entry.md`).
- [ ] SBOM (`dist/sbom.cdx.json`) anexado ao release (`gh release upload`).

Se algum item falhar → investigar e considerar rollback parcial.

## 9. Breaking changes e deprecacao

Mudanca breaking em conciliab (mudar formato de export PDF/CSV, mudar schema de webhook Stripe consumido pelo cliente, remover endpoint):

1. **Anuncio previo** em release de pelo menos **N=2** versoes mensais antes da remocao (~60 dias minimo).
2. **Deprecacao ativa** — endpoint/campo continua funcionando mas emite warning (log estruturado `event: deprecation.used` + header `Deprecation: true`).
3. **Documentacao de migracao** em `docs/operacao/breaking-changes.md` (fora exemplo) antes da release que introduz a deprecacao.
4. **Comunicacao direta** com clientes-piloto: e-mail + entrada em release notes + aviso in-app.
5. **Remocao efetiva** so em release marcada `BREAKING` no CHANGELOG.

> Quebrar contrato sem deprecacao previa exige ADR + aprovacao Ana Silva + Roldao.

## 10. Assinatura e integridade

- Build Docker assinado com **cosign** + chave em AWS KMS.
- Tag git anotada (nao leve) — assinatura GPG opcional (ainda nao implementada — alvo: 2026-09).
- SBOM `dist/sbom.cdx.json` anexado ao release (`cyclonedx-py` + `gh release upload`).
- Hash SHA-256 do binario publicado nas release notes.

## 11. Vinculacao com

- [`change-management.md`](./change-management.md) — janelas e freeze que regem **quando** release pode sair.
- [`deployment-strategy.md`](./deployment-strategy.md) — **como** o rollout e executado tecnicamente.
- [`slo-sli.md`](./slo-sli.md) — baseline usado nos gatilhos de rollback automatico.
- [`runbooks/api-erro-elevado.md`](./runbooks/api-erro-elevado.md) — invocado quando rollback automatico dispara.
- [`docs/seguranca/dependency-policy.md`](../seguranca/dependency-policy.md) §5 — SBOM como pre-condicao.
- `auditor-seguranca` — verifica presenca de changelog, tag anotada, RC verde.

## 12. Historico de revisoes

| Data | Revisor | Mudanca |
|---|---|---|
| 2026-02-28 | Ana Silva | criacao inicial, adotado CalVer |
| 2026-05-27 | Ana Silva | rollout estagiado ajustado de 5%→100% direto para canary→progressive apos incidente 2026-04-30 |
