---
owner: roldao-method
revisado-em: 2026-05-22
status: stable
---

# Documentação — ROLDAO-METHOD

> Índice navegável. Lê em ordem ou pula direto pro tema.

## 🚀 Começando (5 min)

1. [QUICKSTART](QUICKSTART.md) — instalação + 1ª `/feature` em 10 min.
2. [COMO-FUNCIONA](COMO-FUNCIONA.md) — visão de 360º (agentes, hooks, workflows, skills, addons).
3. [EXEMPLO-FEATURE-COMPLETA](EXEMPLO-FEATURE-COMPLETA.md) — walkthrough Sofia → Detetive → Rafael → Bruno → 3 auditores.

## 🧱 Aprofundamento

- [ARQUITETURA](ARQUITETURA.md) — como as peças se conectam.
- [EXTENDENDO](EXTENDENDO.md) — criar 1º agente / hook / skill / addon (tutorial passo-a-passo).
- [PLAN-MODE-E-SESSOES](PLAN-MODE-E-SESSOES.md) — Plan mode, `--continue`, `--resume`, worktrees paralelos.
- [MCP-GUIA-BR](MCP-GUIA-BR.md) — MCPs auditados pro mercado BR (Pix, NF-e, ERP, banco).

## 🇧🇷 Brasil

- [CASOS-DE-USO-BR](CASOS-DE-USO-BR.md) — exemplos reais (NF-e, eSocial, Pix, LGPD).
- [Regras inegociáveis](../REGRAS-INEGOCIAVEIS.md) — IDs `INV-`, `SEC-`, `TST-`, `LGPD-`, `FISCAL-`, `PIX-`.

## 📦 Addons verticais

- [Catálogo de addons](addons.md) — os 7 addons (fintech-br, fiscal-br-completo, electron-br, esocial-completo, lgpd-compliance, varejo-pdv-br, healthtech-br beta).
- [Estender o framework](EXTENDENDO/README.md) — índice dos guias de extensão (agente, hook, skill, addon).

## 🏛️ Decisões arquiteturais

- [Catálogo de ADRs](decisions/README.md) — 18 ADRs (zero deps, port hooks Node, override sem fork, spec-driven, dogfooding, multi-adapter, addons, skills BR, lifecycle hooks, templates vs .specify, port statusline Node, contrato `_lib.js`, addons importam lib do core, e mais).

## 🆘 Quando algo dá errado

- [TROUBLESHOOTING](TROUBLESHOOTING.md) — hook bloqueou indevidamente, settings corrompido, downgrade.
- [FAQ](FAQ.md) — perguntas frequentes (instalar, criar agente, voltar versão).
- [REGRESSIONS](REGRESSIONS.md) — falhas conhecidas + workaround.
- [Runbook LGPD — incidente 72h](runbooks/incident-response-lgpd.md) — passo-a-passo operacional de resposta a vazamento de dado pessoal (LGPD-006/ANPD).

## 📦 Publicar (mantenedores)

- [PUBLICAR-NPM](PUBLICAR-NPM.md) — release no npm + GitHub release.

## 🗺️ Caminho recomendado

```
Você está aqui? Leia primeiro:
─────────────────────────────────────────────────
Nunca instalei         → QUICKSTART
Já instalei, e agora?  → EXEMPLO-FEATURE-COMPLETA
Quero estender         → EXTENDENDO
Algo travou            → TROUBLESHOOTING
Vou publicar libs      → PUBLICAR-NPM
```

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
