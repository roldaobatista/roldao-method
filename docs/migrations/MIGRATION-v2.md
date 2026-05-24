---
owner: tech-writer (Camila)
revisado-em: 2026-05-24
status: stable
---

# Migration v1.x → v2.0

> **Não programa?** Tradução curta: este arquivo conta o que muda **pro seu dev** quando você atualizar o framework de v1.x pra v2.0. Você não precisa fazer nada manual — `npx roldao-method update` faz tudo. Em caso de qualquer problema, `npx roldao-method rollback` desfaz na hora.

---

## O que muda visivelmente

| Antes (v1.x) | Agora (v2.0+) |
|---|---|
| Hooks em bash + perl | **Hooks em Node puro** — rodam em Windows sem Git Bash |
| Comando `/help` lista 26 códigos | `/help` mostra tabela em PT-BR + Skills + Addons |
| `npx roldao-method` sem args caía em `install` | Mostra menu interativo |
| Sem `npx roldao-method demo` | **Comando novo** — testa o framework em 30s sem instalar |
| Sem `npx roldao-method status` | **Comando novo** — diagnóstico PT-BR do projeto |
| Sem `npx roldao-method undo` | **Comando novo** — desfaz último commit do Claude com `git revert` |
| Sem `npx roldao-method search` | **Comando novo** — busca fuzzy em comandos + skills + addons |
| AGENTS.md com 14 campos pra preencher na mão | `npx roldao-method tutorial` faz 5 perguntas e preenche pra você |

---

## Como atualizar

```bash
npx roldao-method@latest update
```

O comando:

1. Cria snapshot automático em `.roldao-method/snapshots/<ts>-from-v1.x-to-v2.0/`
2. Atualiza arquivos do framework (`.claude/`, `.specify/`)
3. Preserva seus arquivos editados (`AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md`, `settings.local.json`)
4. Mostra resumo do que mudou

Se algo der errado:

```bash
npx roldao-method rollback
```

---

## Breaking changes (raros — só estes 3)

### 1. Hooks `.sh` removidos (EP-001)

**Era:** `.claude/hooks/*.sh` (bash + perl)
**Agora:** `.claude/hooks/*.js` (Node puro)

**Impacto pro cliente:** zero — `update` substitui o `.sh` antigo por `.js` novo. Funcionam idênticos. Se você customizou algum `.sh` na mão, o update preserva o arquivo customizado e cria backup `.bak` antes de aplicar o `.js` novo.

### 2. Marker de checkpoint exige `audit_sha` não-vazio (ADR-020)

**Era:** marker `checkpoint-passed-<sess>` aceitava arquivo vazio (`touch` puro).
**Agora:** marker precisa conter `audit_sha` casando com `git diff HEAD`. Marker vazio é rejeitado com `exit 2`.

**Impacto pro cliente:** zero — `/checkpoint` foi atualizado pra gravar o `audit_sha` automaticamente. Quem ainda usa v1.x na transição pode setar `ROLDAO_METHOD_LEGACY_MARKERS=1` (warning até v2.1.0, ver ADR-021).

### 3. `npx roldao-method` sem args mostra menu (J16)

**Era:** caía em `install` cego.
**Agora:** mostra menu interativo com 4 opções principais (demo, install, tutorial, doctor).

**Impacto pro cliente:** zero em uso normal. Em **CI / script** (sem TTY), continua caindo em `install` automaticamente — sem quebrar pipelines.

---

## Não-breaking — coisas que continuam funcionando

- Todos os 28 workflows (`/inicio`, `/feature`, `/bug`, etc.)
- Todos os 15 agentes
- Todas as 13 skills BR core
- Todos os 7 addons (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br, esocial-completo, varejo-pdv-br, healthtech-br)
- Plugin manifest pro Claude Code
- Adapters pra Cursor, Windsurf, Cline, Roo, Aider, Continue, Gemini CLI, Codex CLI

---

## O que entrou na v2.0 que ainda não estava na v1.x

### Comandos novos no `bin/install.js`

- `demo` — testa offline em 30s
- `tutorial` — preenche AGENTS.md por 5 perguntas
- `status` — diagnóstico PT-BR (stories abertas, ADRs, último commit)
- `undo` — desfaz último commit do Claude (`git revert`, sem `--hard`)
- `o-que-aconteceu` — resumo PT-BR desde a última sessão
- `rollback` — desfaz último update (alternativa ao undo de commit)
- `search` — busca fuzzy em comandos + skills + addons (com stopwords PT-BR)
- `--version` enriquecido — versão + descrição PT-BR + link pro CHANGELOG

### Hooks novos

- `fiscal-br-validator.js` — bloqueia código tributário sem declarar regime (Reforma 2026-2033)
- `no-log-pix-key.js` — bloqueia chave Pix em log sem mascaramento (PIX-004)
- `no-test-data-in-fixtures.js` — bloqueia CPF/email real em fixture (LGPD-001 + TST-004)
- `commit-message-validator.js` — exige T-NNN em commits feat/fix
- `require-auditors-pass-before-commit.js` — exige 3 auditores aprovados
- `require-investigador-before-fix.js` — REGRA #0 mecânica
- `require-checkpoint-before-merge.js` — exige walkthrough antes do merge
- `validate-story-approvals.js` — story marcada entregue só com audit trail
- `validate-story-dependencies.js` — bloqueia US com dependência pendente
- `block-confirmation-questions.js` — bloqueia "quer que eu...?" (INV-AGENT-006)
- `block-jargon-pt-br.js` — bloqueia jargão técnico sem tradução
- `lgpd-base-legal-reminder.js` — soft warning quando código toca dado pessoal
- `regra-zero-reminder.js` — lembrete REGRA #0 antes de `/bug`

### Skills BR novas

- `validar-pix` — chave Pix (CPF, CNPJ, email, telefone, aleatória)
- `validar-boleto` — linha digitável FEBRABAN (módulo 10/11)
- `validar-chave-acesso-nfe` — chave de 44 dígitos NF-e/NFC-e/CT-e/MDF-e
- `validar-codigo-municipio-ibge` — código IBGE de município
- `gerar-br-code` — QR Code Pix padrão EMV
- `gerar-test-fixture-br` — CPF/CNPJ/CEP/telefone sintéticos válidos
- `checklist-lgpd` — árvore de decisão de base legal (Art. 7/11)

### Addons novos

- `fintech-br` — Pix + Open Finance + webhook HMAC + idempotência
- `esocial-completo` — eventos S-1000 a S-3000, REINF
- `varejo-pdv-br` — SAT-CF-e, NFC-e, balança, TEF
- `healthtech-br` (beta) — telemedicina CFM, prontuário ANS, CNS, TISS/TUSS

---

## Para o dono de produto (não-programador)

Você não precisa entender nada acima. Só roda:

```bash
npx roldao-method@latest update
```

Se der ruim:

```bash
npx roldao-method rollback
```

Pronto. Continue trabalhando.

---

_US-116 T-019 — referência consolidada das mudanças de v1.x pra v2.0._
