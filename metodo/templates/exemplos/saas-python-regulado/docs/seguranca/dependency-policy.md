---
owner: Ana Silva
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: politica de aceitacao, manutencao e auditoria de dependencias Python (Poetry) do conciliab
---

<!-- destino: docs/seguranca/dependency-policy.md (preenchido no exemplo saas-python-regulado) -->

# Politica de Dependencias — conciliab

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE. Operacionaliza SEC-001 e INV-AGENT-009.

> **Dependencia** = pacote PyPI importado pelo projeto. Cada dep executa codigo Python dentro do nosso processo com nossos privilegios (acesso ao PG, ao Cognito token, ao S3). Trata-se como codigo nosso para fins de seguranca.

## 1. Criterios de aceitacao para dep nova (PyPI)

Toda dep nova passa por estes filtros **antes** do PR ser aprovado:

| Criterio | Limite minimo | Como verificar |
|---|---|---|
| Downloads recentes | >= 5.000/mes no PyPI | https://pypistats.org/packages/<nome> |
| Manutencao ativa | commit nos ultimos 6 meses | repo upstream GitHub |
| Issues abertas vs fechadas | razao saudavel (nao 500 abertas e zero resposta) | repo upstream |
| Numero de mantenedores | >= 2 quando possivel | PyPI page (Maintainers) |
| Licenca | dentro do allowlist (ver §2) | classifier + `LICENSE` no sdist |
| Mantenedor com 2FA | conta PyPI exibe selo | PyPI page |
| Existe na stdlib? | se sim, preferir stdlib | revisor checa |
| Tem rust/C extension? | se sim, exige wheel pre-compilado para win/macos/linux | `pip download --no-deps --only-binary :all:` |

Reprovacao em qualquer criterio exige justificativa no PR + aprovacao de Ana Silva.

## 2. Licencas

### 2.1 Allowlist (uso livre)

- MIT, BSD-2-Clause, BSD-3-Clause
- Apache-2.0
- ISC
- PSF (Python Software Foundation License)
- MPL-2.0 (com cuidado em modificacoes)
- Unlicense / CC0 / 0BSD

### 2.2 Denylist (proibidas sem aprovacao juridica)

- GPL-2.0, GPL-3.0, AGPL-3.0 (copyleft forte — produto SaaS proprietario)
- SSPL (Server Side Public License)
- BSL (Business Source License) sem clausula clara
- "Commons Clause" anexada
- Licenca proprietaria sem contrato assinado
- Pacote sem arquivo de licenca

Excecoes exigem aprovacao do juridico (escritorio externo) + ADR.

## 3. Pinning e lockfile

- **`poetry.lock` commitado**: obrigatorio. CI quebra se `poetry install --no-update` detectar drift.
- Em `pyproject.toml`:
  - Deps de runtime (`[tool.poetry.dependencies]`): faixa de patch (`^1.2.3`) aceita; major sempre pinado.
  - Deps de seguranca critica (`cryptography`, `psycopg`, `pyjwt`): igualdade exata (`==42.0.4`).
- Hook `lockfile-tampering` valida que mudanca em `poetry.lock` corresponde a mudanca em `pyproject.toml`.

## 4. Idade maxima e atualizacao

| Metrica | Limite | Acao |
|---|---|---|
| Dep direta sem atualizar ha 18 meses | atingiu | issue de "deprecacao automatica" — substituir ou justificar |
| Atras > 1 major | atingiu | issue de modernizacao com prazo 90 dias |
| CVE conhecido sem fix | imediato | mitigar (config, isolar, remover) em 7 dias |
| CVE com fix CRITICO | imediato | atualizar em 24h |
| CVE com fix ALTO | imediato | atualizar em 7 dias |
| CVE com fix MEDIO | imediato | atualizar no proximo release minor |

Rotacao de `poetry.lock`: regenerada e revisada mensalmente (ou a cada release minor).

## 5. SBOM (Software Bill of Materials)

> **SBOM** = lista assinada de tudo que o projeto importa, com versoes e hashes. Permite saber se estamos expostos a CVE recem-publicada.

- Geracao obrigatoria em cada release publicado.
- Ferramenta: **`cyclonedx-py`** (gera CycloneDX JSON 1.5).
- Saida: `dist/sbom.cdx.json`, anexada ao artefato de release (`gh release upload`).
- Verificacao: pipeline de release falha se o SBOM nao for gerado (job `sbom` em `.github/workflows/release.yml`).
- SBOM versionado junto com o release (tag git), nao no `main`.

## 6. Scanning de vulnerabilidades

| Camada | Ferramenta | Cadencia |
|---|---|---|
| Atualizacoes automaticas | Dependabot (configurado em `.github/dependabot.yml`) | diaria |
| Audit no CI | `poetry run pip-audit --strict` | a cada PR |
| Scan de SBOM | Grype contra `dist/sbom.cdx.json` | a cada release |
| Auditor proprio | `auditor-seguranca` (subagente) regra SEC-DEPS-001 | a cada PR que toca `pyproject.toml`/`poetry.lock` |

Build quebra em CVE CRITICO. Build avisa (nao quebra) em CVE ALTO sem fix ainda disponivel — issue auto-aberta.

## 7. Aprovacao de dependencia nova (2-eyes)

- Autor do PR adiciona dep + justifica (problema que resolve, alternativas, criterios §1 marcados).
- Revisor verifica criterios + licenca + arvore transitiva (`poetry show --tree <pacote>`).
- Time pequeno (3 devs): tech-lead (Ana Silva) aprova; sem tech-lead, Bruno Costa.
- Trocar versao major segue mesmo rito.

## 8. Typosquatting e supply chain

- Conferir nome do pacote contra o esperado antes do `poetry add`. Vetores conhecidos no ecossistema Python: `python-fastapi` (vs `fastapi`), `psycopg-2` (vs `psycopg2`/`psycopg`), `requestss`.
- Confirmar publisher no PyPI corresponde ao repo upstream.
- Hash pinning: `poetry install --no-update` usa hashes do `poetry.lock`.
- Mirror interno opcional: AWS CodeArtifact espelha PyPI pra deps importantes; deploy nao depende de PyPI online.
- Frozen install em prod: `poetry install --no-update --no-dev --sync` no Dockerfile. Nunca resolve dep no deploy.

## 9. Dependencias transitivas

Cada dep direta arrasta arvore. Politica:

- Auditar arvore: `poetry show --tree` revisado mensalmente.
- CVE em transitiva = mesma prioridade da direta.
- Transitiva problematica sem fix upstream: `poetry add <pacote>@<versao>` como dep direta forcando versao + ADR documentando.
- Profundidade exotica (>200 pacotes para o conciliab) e sinal de alerta — revisar diretas.

## 10. Remocao de dependencia

Quando dep e removida:

- `poetry remove <pacote>`.
- Regerar `poetry.lock` (Poetry faz automaticamente).
- `grep -r "import <pacote>"` pra confirmar nao ha usos remanescentes.
- Atualizar SBOM no proximo release.
- Atualizar `pyproject.toml` no PR.

## 11. Excecoes

Excecoes a esta politica exigem:

1. ADR em `docs/adr/` com: contexto, alternativas, decisao, prazo de revisao.
2. Aprovacao de Ana Silva (security owner).
3. Issue de acompanhamento com data de re-avaliacao.

## 12. Stack atual (referencia)

Deps de runtime em `pyproject.toml`:

- `fastapi`, `uvicorn[standard]` — framework HTTP.
- `sqlalchemy`, `alembic`, `psycopg[binary]` — ORM + migrations + driver PG.
- `pydantic`, `pydantic-settings` — validacao + config.
- `celery`, `redis` — fila assincrona.
- `boto3` — AWS SDK (S3, Secrets Manager, Cognito).
- `pyjwt[crypto]`, `cryptography` — auth e crypto.

Deps de dev:
- `pytest`, `pytest-asyncio`, `hypothesis`, `pytest-cov`.
- `ruff`, `mypy`, `pre-commit`.
- `cyclonedx-bom` (gera SBOM), `pip-audit` (CVE scan).

## 13. Vinculacao com

- [`threat-model.md`](./threat-model.md) — perfil de atacante "Supply chain" (§4).
- [`SECURITY.md`](../../SECURITY.md) — politica geral.
- [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — SEC-001 + INV-AGENT-009.
- [`pyproject.toml`](../../pyproject.toml) — onde as deps vivem.
- Auditor `auditor-seguranca` em `.claude/agents/auditor-seguranca.md`.
- Pipeline `.github/workflows/ci.yml` (jobs `pip-audit`, `sbom`).
