---
id: ADR-0001
titulo: Adotar Python 3.12 + FastAPI + PostgreSQL + Celery como stack do backend
status: aceita
data-proposta: 2026-02-12
data-aceite: 2026-02-15
depende-de: []
bloqueia-fase: F-A
superseded-by:
owner: <DEV-1>
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 130
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0001: Adotar Python 3.12 + FastAPI + PostgreSQL + Celery como stack do backend

## Contexto

O conciliab e um SaaS B2B multi-tenant. Backend executa: ingestao de extratos
(CSV/OFX), parser, motor de conciliacao (jobs longos, async), API REST para o
frontend Next.js, jobs agendados (relatorios mensais, expurgo LGPD).

Time tem 3 devs. <DEV-1> tem 6 anos de Python (FastAPI + SQLAlchemy + Celery em
3 projetos anteriores). <DEV-2> tem fluencia em Python (4 anos). <DEV-3> e
mais junior e ja fez 1 projeto pequeno em Flask. Custo de onboard em outro
ecossistema (Go/Rust/Node) seria alto.

Restricoes:
- Hospedagem AWS sa-east-1 (decisao do dono — soberania de dado pra LGPD).
- Multi-tenant: precisa de RLS no banco (ADR-0002).
- Job assincrono e premissa (conciliacao roda 30s-3min, nao pode bloquear request).
- Time de 3 devs nao pode manter 2 ecossistemas (frontend Next.js ja exige Node).

## Opcoes consideradas

### Opcao 1: Python 3.12 + FastAPI + SQLAlchemy 2 + PostgreSQL 16 + Celery + Redis

- **Pros:** time domina; FastAPI tem tipagem nativa (pydantic) que casa com
  mypy; SQLAlchemy 2 tem suporte de primeira classe para RLS; Celery + Redis
  e padrao maduro para job async; deploy em ECS Fargate simples (container).
- **Contras:** Python e mais lento que Go/Rust em CPU-bound; GIL impacta
  paralelismo dentro do processo (mitigado por Celery + multi-worker).
- **Custo:** baixo — time produtivo em ~1 semana de setup.

### Opcao 2: Node.js + NestJS + Prisma + PostgreSQL + BullMQ

- **Pros:** uniformiza stack com o frontend Next.js (ja em Node); Prisma tem
  boa DX; BullMQ tem Redis-based queue similar ao Celery.
- **Contras:** time tem so 1 dev fluente em Node (<DEV-2>); Prisma tem suporte
  limitado a RLS em 2026 (precisa workaround); ecossistema de auditoria fiscal
  Brasil (NF-e, SPED) e mais maduro em Python.
- **Custo:** medio — <DEV-1> e <DEV-3> levariam 1-2 meses para produtividade
  plena.

### Opcao 3: Go + Echo + sqlx + PostgreSQL + NATS

- **Pros:** performance excelente; binario unico facilita deploy; concorrencia
  nativa com goroutines.
- **Contras:** time nao tem Go (zero devs com experiencia previa); curva de
  aprendizado alta; ecossistema fiscal Brasil quase inexistente; over-engineer
  para o volume esperado (estimativa de 100 tenants em 12 meses).
- **Custo:** alto — onboard de time inteiro em linguagem nova = 3-4 meses
  perdidos.

## Decisao

Escolhemos a **Opcao 1: Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL + Celery**.

Decisao guiada pela fluencia do time e pela maturidade do ecossistema Python
para o dominio (parser OFX, integracao fiscal). Performance nao e gargalo no
volume esperado para os proximos 18 meses; se virar, abrimos ADR especifica
para reescrever modulo critico (provavelmente parser) em outro motor.

## Consequencias

### Positivas
- Time produtivo desde dia 1.
- Tipagem com pydantic + mypy reduz bug em runtime.
- Celery resolve job async sem inventar primitiva propria.
- SQLAlchemy 2 suporta RLS de forma elegante via session-scoped `SET LOCAL`.

### Negativas
- Performance ~3x menor que Go em CPU-bound (parser de extrato grande pode
  precisar ser otimizado).
- GIL impede paralelismo intra-processo (mitigado por multi-worker Celery).
- Tamanho da imagem Docker ~250MB (vs 30MB em Go).

### Reversibilidade
**Media-baixa**. Trocar de Python para outra linguagem exige reescrever camada
de servico. Custo estimado para reescrever em Go: 4-6 meses de trabalho.
Limite de tolerancia: se p95 de uma rota da API ficar > 800ms (SLO) por 3
meses consecutivos e nao for resolvel com indice/cache, reabrimos a decisao.

## Non-goals

Esta ADR NAO decide:
- Frontend (e Next.js por D-001, ja decidido em projeto separado).
- Estrategia de multi-tenant (ADR-0002).
- Storage de arquivos (ADR-0003).
- Provider de auth (Cognito ja em AGENTS.md §2; nao revisado aqui).

## Como validar (gates)

- [x] Imagem Docker do backend < 300MB.
- [x] Suite de testes unit roda em < 30s.
- [x] p95 da API `/v1/conciliacoes` < 500ms em ambiente de staging com 10
      tenants ativos simulados.
- [x] Job de conciliacao de 500 transacoes termina em < 60s em worker padrao.

## Referencias

- ADR-0002 (multi-tenant via RLS), ADR-0003 (storage).
- https://fastapi.tiangolo.com/
- https://docs.sqlalchemy.org/en/20/
- Avaliacao de performance: `docs/governanca/avaliacao-stack-2026-02.md`.
