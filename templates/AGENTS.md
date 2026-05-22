# AGENTS.md — contrato canônico do projeto

> **Para agentes de IA (Claude Code, Cursor, ChatGPT, Codex CLI):** este é o documento de referência primária. O `CLAUDE.md` é apenas adendo do harness Claude Code e importa este via `@AGENTS.md`.
>
> **Princípio:** documento é estado compartilhado. Agente que decide sem doc inventa diferente toda vez.

---

## 1. Identidade do projeto

- **Nome:** _(preencher)_
- **Escopo:** _(o que esse projeto faz em uma frase)_
- **Modelo:** _(SaaS, app interno, biblioteca, CLI, etc.)_
- **Cliente/usuário:** _(quem usa)_
- **Diferencial central:** _(o que esse produto faz melhor que os concorrentes)_

---

## 2. Stack

| Camada | Escolha | Notas |
|---|---|---|
| Backend | _(preencher)_ | |
| Banco | _(preencher)_ | |
| Frontend | _(preencher)_ | |
| Mobile | _(preencher / N/A)_ | |
| Filas | _(preencher / N/A)_ | |
| Hospedagem | _(preencher)_ | |
| Observabilidade | _(preencher)_ | |

---

## 3. Princípios não-negociáveis

Ver `.specify/memory/constitution.md` (6 princípios universais) + `REGRAS-INEGOCIAVEIS.md` (IDs `INV-`, `SEC-`, `TST-`, `LGPD-`).

**Resumo operacional:**
1. **Documento é estado compartilhado** — agente sem doc inventa diferente toda vez.
2. **Spec gera código** (spec-as-source). Não código gera spec.
3. **Conciso vence completo** — AGENTS.md ≤ 200 linhas, CLAUDE.md ≤ 150.
4. **Non-goals explícitos** — toda spec/ADR declara o que NÃO está no escopo.
5. **IDs rastreáveis** — `US-NNN` → `AC-NNN-N` → `T-NNN` → commit.
6. **Negócio vence conveniência do agente** — otimizar pelo produto/cliente, não pelo que o agente erra menos.

**Regra mestre:** regra crítica vira **hook**, não só doc. Ver `.claude/hooks/`.

---

## 4. Modelo de agentes

**Essenciais em `.claude/agents/`:**

- `analista` — pesquisa de mercado, brief, PRFAQ, regulamentação BR.
- `gerente-produto` — PRD, user story, decomposição (3 modos: PRD/story/decomp; brief é do `analista`).
- `ux-designer` — wireframes ASCII, estados, mensagens PT-BR.
- `tech-lead` — arquitetura, ADR, ARQ, checklist de readiness.
- `investigador` — lê código/banco/logs ANTES de propor solução. Obrigatório em `/bug`.
- `dev-senior` — implementa com TDD onde aplicável.
- `revisor` — audita o que foi feito antes de subir.

**Auditores especializados:**

- `auditor-seguranca` — LGPD, secrets, vulnerabilidades, supply chain.
- `auditor-qualidade` — testes, cobertura, mocks indevidos, anti-padrões.
- `auditor-produto` — aderência ao que foi pedido, non-goals.

**Especialista BR:**

- `fiscal-br` — NF-e, certificado, eSocial, REINF, SPED, Reforma Tributária 2026-2033.

**Dados:**

- `dba-dados` — modelagem, índices, performance, migration revisada, LGPD em repouso. Use ao criar tabela nova, diagnosticar query lenta ou validar migration antes do dev aplicar.

**Documentação:**

- `tech-writer` — CHANGELOG, README, release notes, tradução de mensagem técnica pra PT-BR claro. Usado por `/status`, `/replanejar`, releases.

---

## 5. Workflows

| Comando | Quando | Agentes principais |
|---|---|---|
| `/inicio` | Projeto novo | gerente-produto → tech-lead → dev-senior |
| `/brownfield` | Adotar em projeto que já existe | investigador → tech-lead → gerente-produto → auditor-seguranca |
| `/prd` | Iniciativa grande (várias semanas) | analista → gerente-produto → tech-lead → (ux) → decomposição |
| `/epico` | Decompor grande em stories | analista → gerente-produto → tech-lead |
| `/historia` | 1 story em disco | gerente-produto → investigador |
| `/clarificar` | Ideia/story vaga antes de codar | gerente-produto (+ usuário via perguntas) |
| `/feature` | Funcionalidade nova | gerente-produto → investigador → tech-lead → dev-senior → revisor → auditores |
| `/bug` | Corrigir comportamento | **investigador (obrigatório)** → dev-senior → revisor |
| `/refactor` | Reorganizar código | tech-lead → dev-senior → revisor |
| `/qa` | Testes de uma área | investigador → auditor-qualidade → dev-senior → revisor |
| `/auditoria` | Passar auditores | auditor-seguranca + auditor-qualidade + auditor-produto |
| `/consistencia` | Cross-check doc↔código | investigador → 3 auditores (em paralelo) |
| `/quick-dev` | Mudança trivial (≤3 arquivos) | dev-senior → revisor |
| `/readiness` | Gate `/epico` → `/feature` | investigador → tech-lead |
| `/shard` | Quebrar PRD/ARQ longo em chunks | (sem agente — fatiamento) |
| `/sprint` | Plano sequencial das próximas stories | gerente-produto |
| `/replanejar` | Mudança de escopo no épico | gerente-produto → tech-writer |
| `/status` | Reportar progresso PT-BR | tech-writer |
| `/checkpoint` | Walkthrough antes do merge | (sem agente — walkthrough) |
| `/release` | Fechar marco: versão, CHANGELOG, tag, nota PT-BR | tech-writer |
| `/retro` | Retrospectiva pós-marco | (sem agente específico — 4L) |

---

## 6. Comandos do projeto

Stack ativa: _(preencher após decidir)_.

| Operação | Comando |
|---|---|
| Setup local | _(preencher)_ |
| Subir sistema | _(preencher)_ |
| Rodar testes | _(preencher)_ |
| Lint + format | _(preencher)_ |
| Type-check | _(preencher)_ |
| Migration nova | _(preencher)_ |
| Aplicar migrations | _(preencher)_ |

---

## 7. Política de commits

- **Atômicos:** um propósito por commit. Não misturar fix + feature + refactor.
- **Mensagem:** uma linha curta + descrição se necessário.
- **Stage seletivo:** `git add <arquivo>` por arquivo. Nunca `git add .` com outras frentes sujas.
- **Co-Authored-By Claude** nas mensagens de commit feitas pelo agente.
- **Nunca usar sem autorização explícita:** `--no-verify`, `--skip-*`, `--ignore-*`, `git reset --hard`, `git push --force`, `git branch -D`, `rm -rf`, `drop table`.
- **Hooks ativos:** ver `.claude/hooks/block-destructive.sh` e `secrets-scanner.sh`.

---

## 8. Convenções

- **Idioma:** Português (Brasil) em código, comentários, docs, commits.
- **Linguagem do canal:** sem jargão técnico com usuário não-técnico. Ver `CLAUDE.md` seção "Perfil do usuário" para tabela de tradução.
- **Frontmatter obrigatório** em docs novos: `owner`, `revisado-em`, `status: draft|stable|deprecated`.

---

## 9. Pontos de extensão

- **MCP servers (`.mcp.json`):** plugar conforme necessidade.
- **Hooks (`.claude/hooks/`):** ciclo de vida do Claude Code.
- **Subagentes (`.claude/agents/`):** descrição com gatilho concreto + ferramentas restritas.
- **Skills (`.claude/skills/`):** criar quando padrão repetir 3x.
- **Rules (`.claude/rules/`):** sempre com `paths:` frontmatter (lazy load).
- **Override sem fork (`.specify/overrides/<area>/<nome>.md`):** adapta template ao seu domínio. Tem precedência sobre `.specify/<area>/<nome>.md` (core). `update` nunca toca `overrides/`.
- **Addons (`npx roldao-method add <nome>`):** pacotes de domínio (fintech-br, fiscal-br-emissor, electron, eSocial-folha, lgpd-operacional, saude-mental). Liste com `npx roldao-method search`.

Para criar agente/hook/skill/addon novo: `docs/EXTENDENDO.md` tem o passo-a-passo com esqueletos prontos.

---

## 10. O que está pendente

_(manter atualizado — lista enxuta do que falta pra próximo marco)_

- [ ] _(item)_
- [ ] _(item)_

---

_Este arquivo segue o framework [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
