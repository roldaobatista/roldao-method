---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 110
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: README-EXEMPLO.md
proposito: meta-readme do exemplo. Explica que este diretorio NAO e um
           projeto real, e sim o estado FINAL de um projeto fictico apos
           aplicar o metodo descrito em `templates/`.
NAO confundir com:
  - templates/README.md      -> catalogo dos templates do metodo.
  - este-diretorio/README.md -> readme do projeto exemplo (conciliab).
-->

# Exemplo fim-a-fim: `conciliab` — SaaS B2B multi-tenant regulado

Este diretorio materializa **como ficaria um projeto real depois de aplicar
o metodo**. NAO e um projeto que voce vai rodar — e um *gabarito preenchido*
que serve de referencia visual quando voce esta usando os templates pela
primeira vez e quer ver "como isso fica quando ta pronto?".

## Quando consultar este exemplo

- Voce esta usando `templates/` pela primeira vez e os placeholders `<...>`
  sao abstratos demais.
- Voce quer ver como ROPA, retencao, SLO/SLI, ADR e spec/plan/tasks
  **se referenciam entre si** num projeto real.
- Voce tem duvida se "no meu projeto isso aplica?" — compara com um caso
  conhecido (SaaS B2B regulado).

## Caso ficticio escolhido

| Campo | Valor |
|---|---|
| Nome | `conciliab` |
| Produto | SaaS de conciliacao bancaria automatica para PMEs brasileiras |
| Stack | Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL 16 (RLS) + Celery + Redis |
| Hospedagem | AWS sa-east-1 (ECS Fargate, RDS Postgres, S3, CloudFront, Cognito) |
| Time | 3 devs + 1 product + 1 designer (part-time) |
| Multi-tenant | sim — RLS por `tenant_id` + filtro de aplicacao |
| Dados pessoais | sim — emails, CPF do dono, dados bancarios |
| Regulacao | LGPD (ROPA, DPO designado) + BACEN (open finance, em roadmap) |
| SLO | 99,5% mensal (downtime aceito < 3h45/mes) |
| On-call | escala semanal entre os 3 devs |

## Sequencia de leitura sugerida

Le na ordem abaixo. Cada doc supoe que o anterior foi entendido.

1. [`README.md`](./README.md) — apresentacao do produto.
2. [`AGENTS.md`](./AGENTS.md) — contrato canonico de agentes IA.
3. [`CLAUDE.md`](./CLAUDE.md) — adendo do harness Claude Code.
4. [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) — INVs ativas
   (incluindo `INV-TENANT-*`, `INV-LGPD-*`, `INV-AUDIT-*`).
5. [`.claude/memory/constitution.md`](./.claude/memory/constitution.md) — principios fundadores.
6. [`SECURITY.md`](./SECURITY.md) — politica de seguranca.
7. [`docs/descoberta/problema.md`](./docs/descoberta/problema.md) — a dor que motivou o produto.
8. [`docs/adr/`](./docs/adr/) — ADRs fundadoras (uso de IA, stack, RLS, storage).
9. [`docs/dominios/financas/modulos/conciliacao/`](./docs/dominios/financas/modulos/conciliacao/) — fluxo completo
   `spec.md` → `plan.md` → `tasks.md` da US-CONC-001.
10. [`docs/faseamento/F-A/kickoff.md`](./docs/faseamento/F-A/kickoff.md) — abertura da primeira fase.
11. [`docs/conformidade/lgpd/`](./docs/conformidade/lgpd/) — ROPA + retencao.
12. [`docs/operacao/`](./docs/operacao/) — SLO/SLI, backup, DR e runbook de restauracao.
13. [`CHECKLIST-PRONTO-PRA-CODAR.md`](./CHECKLIST-PRONTO-PRA-CODAR.md) — todos os C0-C11 marcados, com evidencia.
14. [`nao-aplica.md`](./nao-aplica.md) — o que (pouco) foi pulado.

## Placeholders neste exemplo

Tudo esta preenchido com dados ficticios realistas, **com excecao** das pessoas
reais que nao podemos inventar. Esses placeholders ficam no formato `<...>`:

- `<DEV-1>`, `<DEV-2>`, `<DEV-3>` — os 3 desenvolvedores.
- `<PRODUCT>` — product manager.
- `<DPO-nome>` — encarregado de protecao de dados (DPO).

Tudo o mais — nomes de buckets, tabelas, endpoints, datas, valores, etc. —
esta preenchido com valor concreto coerente entre arquivos.

## Catalogo do metodo (templates em branco)

Quando precisar dos templates em branco para o seu projeto real, ver
[`templates/README.md`](../../README.md).

## O que este exemplo NAO entrega

- Frontend Next.js (esta fora de escopo deste exemplo — so o backend).
- Codigo de aplicacao real (so a documentacao do metodo).
- Pipelines CI/CD em yaml (os contratos sao descritos, nao executados aqui).
- Imagens / diagramas (nao geramos PNG/SVG no exemplo; descricoes textuais).
