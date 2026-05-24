---
description: Onboarding de projeto legado. Investigador varre o codigo/banco/docs existentes e preenche os campos vazios do AGENTS.md + cria docs/arquitetura/ARQ-001.md. Use ao adotar ROLDAO-METHOD em projeto que já existe.
argument-hint: "[contexto-opcional-do-projeto]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(ls:*), Write, Edit, Task
---

# /brownfield — adotar ROLDAO-METHOD em projeto existente

Voce vai varrer o projeto existente e gerar a documentacao base sem codar nada.

Use `$ARGUMENTS` como contexto extra que o usuario der ("e um app Electron de SaaS contabil", etc.).

## Etapa 1 — Investigador (varredura ampla)

Invoque `investigador`:

1. Lista pastas top-level e identifica stack:
   - `package.json` -> Node/JS/TS, framework?
   - `requirements.txt`/`pyproject.toml` -> Python
   - `Gemfile` -> Ruby
   - `go.mod` -> Go
   - `pom.xml`/`build.gradle` -> Java
   - `Cargo.toml` -> Rust
   - frontend separado? `next.config.*`, `vite.config.*`, etc.
2. Identifica banco: `prisma/schema.prisma`, `migrations/`, `alembic/`, `db/`, env vars.
3. Identifica testes: `__tests__/`, `tests/`, `spec/`, suites usadas (Jest, Vitest, Pytest, RSpec).
4. Identifica deploy/hosting: `Dockerfile`, `.github/workflows/`, `vercel.json`, `fly.toml`, `render.yaml`.
5. Identifica integracoes: imports/requires de bibliotecas conhecidas (Stripe, Pix, NF-e, AWS, etc.).
6. Conta linhas, conta tabelas, conta endpoints (estimativa).

Reporta tudo em formato estruturado.

## Etapa 2 — Tech Lead (gera ARQ-001)

Invoque `tech-lead`:

1. Le o relatorio do investigador.
2. Le `.specify/templates/architecture.md` como base.
3. Cria `docs/arquitetura/ARQ-001.md` preenchendo:
   - Camadas (frontend, API, banco, filas, etc.)
   - Tabela de componentes com tecnologia + ADR (vazio inicial)
   - Diagrama de fluxo do componente mais critico
   - Non-goals (a partir do que o projeto NAO faz hoje)
   - Riscos arquiteturais visiveis (debit tecnico aparente)
4. Lista ADRs que **deveriam existir** mas nao existem (proximos passos).

## Etapa 3 — Gerente de Produto (preenche AGENTS.md)

Invoque `gerente-produto` para **preencher o contrato a partir do relatório do investigador** (não é descoberta de mercado — é consolidar o que o código já revela; por isso não usa o modo de brief, que é do `analista`):

1. Le `AGENTS.md` atual e identifica campos `_(preencher)_`.
2. A partir do que o investigador encontrou, preenche:
   - Identidade do projeto (nome, escopo em 1 frase, modelo, cliente, diferencial)
   - Stack (camada -> escolha real encontrada)
   - Comandos do projeto (setup, subir, testes, lint, migration — extrair do `package.json scripts`, `Makefile`, etc.)
3. Marca como `(inferido — confirmar)` campos que precisam validacao humana.

## Etapa 4 — Auditor de Seguranca (sweep inicial)

Invoque `auditor-seguranca`:

1. Procura por:
   - `.env` versionado
   - secrets em codigo (`grep -ri "sk-" -i`, `api_key=`, `password=`)
   - dependencias com CVE conhecida (`npm audit`, `pip-audit` se rodavel)
   - logs com CPF/email em texto puro
2. Reporta tudo, marca prioridade (alto/medio/baixo).

## Etapa 5 — Reportar onboarding feito

Mostre resumo:
```
BROWNFIELD ONBOARDING — <nome-do-projeto>

Stack identificada: <lista>
Banco: <tipo + N tabelas>
Testes: <suite + N arquivos>
Hosting: <onde>

Arquivos criados:
  - docs/arquitetura/ARQ-001.md
  - AGENTS.md atualizado (campos preenchidos)

Achados de seguranca: <N alto, N medio, N baixo>

Itens pendentes pra voce confirmar:
  - <campo inferido 1>
  - <campo inferido 2>
```

## Saida final

```
ONBOARDING BROWNFIELD CONCLUIDO

Pronto pra usar /feature, /bug, /refactor normalmente.

Recomendado proximo passo:
  - corrigir achados de seguranca alto/medio
  - escrever ADR-0001 retroativo para a decisao de stack atual
  - confirmar campos marcados (inferido — confirmar)
```

## Importante

- **Nao alterar codigo do projeto.** So gerar documentacao.
- **Nao deletar nada.** Se o projeto ja tem `AGENTS.md` preenchido, anexar em vez de sobrescrever.
- **Confirmar** antes de sobrescrever.
