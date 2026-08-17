---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: README do projeto-exemplo conciliab (SaaS B2B Python regulado, regime completo)
---

# conciliab

SaaS de conciliacao bancaria automatica para pequenas e medias empresas
brasileiras. O cliente conecta sua conta bancaria (ou sobe extrato CSV/OFX),
e o sistema concilia automaticamente com as contas a receber/pagar do ERP
do cliente, marcando o que bateu e listando divergencias.

**Estado:** beta privado · **Versao:** 0.4.2

## Para quem e

PMEs brasileiras com faturamento entre R$ 500k/ano e R$ 50M/ano que ainda
fazem conciliacao bancaria no Excel. O usuario final e o socio-administrador
ou o financeiro interno (1-3 pessoas).

## Rodar localmente

Pre-requisitos: Python 3.12, PostgreSQL 16, Redis 7, Docker Desktop.

```bash
# 1. clonar o repo e entrar
git clone git@github.com:conciliab/conciliab-api.git
cd conciliab-api

# 2. subir dependencias (Postgres + Redis) via docker
docker compose up -d postgres redis

# 3. instalar dependencias Python e rodar migrations
poetry install
poetry run alembic upgrade head

# 4. semear dados de desenvolvimento (1 tenant + 1 usuario admin)
poetry run python -m conciliab.scripts.seed_dev

# 5. subir API e worker Celery
poetry run uvicorn conciliab.main:app --reload --port 8000
poetry run celery -A conciliab.worker worker -l info  # outro terminal
```

API local: http://localhost:8000/v1
Swagger: http://localhost:8000/docs
Credenciais dev: `admin@tenant-demo.local` / `dev123` (so ambiente local; reset em todo seed).

## Rodar testes

```bash
# suite completa (unit + integration + isolation por tenant)
poetry run pytest

# so unit (rapido, < 30s)
poetry run pytest tests/unit

# so testes de isolamento multi-tenant (obrigatorio antes de PR)
poetry run pytest tests/isolation -v
```

## Quality gates (rodam no pre-commit)

```bash
# rodar manualmente:
poetry run pre-commit run --all-files
```

Inclui: `ruff` (lint), `mypy` (types), `bandit` (security), `gitleaks` (secrets),
`migration-rls-check.sh` (toda tabela `_tenanted` tem RLS), `pytest tests/unit`
(unit tests do diff).

## Documentacao completa

Ver `docs/` (com `INDICE.md` na raiz da pasta) ou `documentos-do-projeto.md`.

Pontos de entrada principais:

- [`AGENTS.md`](./AGENTS.md) — como agentes IA operam neste repo.
- [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) — invariantes do produto.
- [`SECURITY.md`](./SECURITY.md) — como reportar vulnerabilidade.
- [`docs/conformidade/lgpd/ropa.md`](./docs/conformidade/lgpd/ropa.md) — registro LGPD.
- [`docs/operacao/runbooks/`](./docs/operacao/runbooks/) — procedimentos operacionais.

## Licenca

Proprietaria. Autor: balancassolution (Roldao).
