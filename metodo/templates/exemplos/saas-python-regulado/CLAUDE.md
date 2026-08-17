---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: CLAUDE.md (preenchido no exemplo saas-python-regulado)
escopo: adendo do harness Claude Code. Canonico vive em AGENTS.md.
-->

@AGENTS.md

# CLAUDE.md — conciliab

> **Hierarquia de precedencia (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence. CLAUDE.md e o mais especifico (canal Claude Code) e o mais facil de mudar.

> Este arquivo e o adendo do harness Claude Code. A fonte canonica e [`AGENTS.md`](./AGENTS.md).
> Em conflito, AGENTS.md vence (e acima dele, REGRAS-INEGOCIAVEIS.md e constitution.md).

## 1. Perfil do usuario e linguagem

O dono do projeto (Roldao) **nao programa**. E idealizador/dono de produto.
Conhece o produto melhor que ninguem, mas nao le codigo nem stack trace.

Regra de linguagem e tabela de traducao de jargao: ver **INV-AGENT-010** em
[`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) (anexo 2.A — fonte unica de verdade).

Regra de pro-atividade (executar reversiveis sem perguntar, lista destrutiva
exige confirmacao): ver **INV-AGENT-004** em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md).

## 2. Regra de investigacao antes de editar

Ver **INV-AGENT-003** em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md).

Especifico deste projeto: ANTES de editar codigo que toca:

- Conciliacao (`conciliab/financas/conciliacao/`) — abrir 1 caso real no banco
  via `psql` e ver o estado antes de mexer.
- ROPA / LGPD (`docs/conformidade/lgpd/`) — confirmar com o DPO `<DPO-nome>`.
- Tabela `audit_log` ou triggers WORM — leitura do trigger atual obrigatoria
  antes de qualquer alteracao (INV-AUDIT-002).

## 3. Idioma do canal

- Conversar em PT-BR.
- Codigo, identificadores e nomes de arquivo em ingles.
- Mensagens de commit em PT-BR (commits sao lidos pelo dono).
- Mensagens de PR em PT-BR; comentarios inline em PT-BR.

## 4. Estado do ambiente

| Item | Valor |
|---|---|
| Sistema operacional padrao | Windows 11 (Roldao) + macOS (<DEV-1>, <DEV-2>) + Linux/WSL (<DEV-3>) |
| Shell | bash (Git Bash no Windows; zsh no macOS) |
| Gerenciador de pacotes | Poetry 1.8 |
| Versao da runtime | Python 3.12.3 |
| Banco local | PostgreSQL 16 via docker-compose |
| Cache local | Redis 7 via docker-compose |

## 5. Notas de plataforma

- **Windows**: usar `/` em paths no bash; `NUL` nao existe no bash, usar `/dev/null`.
  `psycopg2-binary` (nao `psycopg2`) — wheel pre-compilado evita problemas com
  toolchain C.
- **macOS**: `sed -i` exige sufixo (`sed -i ''`). Postgres no Homebrew tem
  cliente diferente — preferir `psql` do container docker pra evitar mismatch
  de versao.
- **Linux/WSL**: pacotes de sistema podem precisar de `sudo` — sempre pedir
  confirmacao.
- **Todos**: Docker Desktop precisa estar rodando antes de `docker compose up`.

## 6. O que NAO repetir aqui

Itens ja cobertos em outros contratos. **Nao duplicar — referenciar**:

- Politica de commits (atomicos, sem `--no-verify`, sem `--force` em main).
  → `REGRAS-INEGOCIAVEIS.md` INV-AGENT-002, INV-AGENT-007.
- Stack, comandos canonicos, ADRs ativas. → `AGENTS.md §2, §6, §10`.
- Invariantes de produto/agente. → `REGRAS-INEGOCIAVEIS.md`.
- Principios fundadores. → `.claude/memory/constitution.md`.
- Fluxo de PR/auditor/quality gate. → `CONTRIBUTING.md`.
- Glossario de termos do dominio. → `docs/glossario.md`.

## 7. Atalhos especificos do harness

- Ao abrir uma sessao no `conciliab-api`, ler primeiro o `CURRENT.md` para
  saber em qual US/fase o time esta.
- Antes de criar migration, rodar `poetry run alembic check` para validar
  estado de sincronia com o banco local.
- Antes de tocar em `conciliab/lgpd/` ou em ROPA, abrir
  [`docs/conformidade/lgpd/ropa.md`](./docs/conformidade/lgpd/ropa.md) — qualquer
  mudanca na operacao de tratamento exige linha nova no ROPA antes do deploy
  (INV-LGPD-001).
