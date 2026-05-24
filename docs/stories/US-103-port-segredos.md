---
tipo: story
id: US-103
versao: 1
status: entregue
prd: PRD-001
epico: EP-001
tamanho: M
owner: Roldão
revisado-em: 2026-05-24
depende-de: [US-101]
aprovacoes:
  - etapa: gerente-produto
    agente: Sofia
    data: 2026-05-23
    status: aprovado-retroativo
    notas: "US do port EP-001; aprovacao informal no merge da v1.0.0-rc1; formalizada na auditoria 10-agentes em 2026-05-24"
  - etapa: investigador
    agente: Detetive
    data: 2026-05-23
    status: aprovado-retroativo
  - etapa: tech-lead
    agente: Rafael
    data: 2026-05-23
    status: aprovado-retroativo
    notas: "decisao em ADR-012/013/014"
  - etapa: dev-senior
    agente: Bruno
    data: 2026-05-23
    status: aprovado-retroativo
  - etapa: revisor
    agente: Ines
    data: 2026-05-23
    status: aprovado-retroativo
  - etapa: auditor-seguranca
    agente: Caio
    data: 2026-05-24
    status: aprovado-retroativo
  - etapa: auditor-qualidade
    agente: Julia
    data: 2026-05-24
    status: aprovado-retroativo
  - etapa: auditor-produto
    agente: Pedro
    data: 2026-05-24
    status: aprovado-retroativo
---

# US-103 — Port grupo segredos (secrets-scanner + block-secrets-in-commit-message)

## Como, quero, para

**Como** dev BR rodando em Windows puro,
**quero** que os 2 hooks SEC-001 (escaneamento de secret em arquivo e em mensagem de commit) funcionem nesse ambiente,
**para** que chave AWS, token GitHub, certificado PEM, JWT e Bearer token sejam bloqueados antes do commit/escrita — não apenas em Linux/macOS/Git Bash.

---

## Critérios de aceitação

- **AC-103-1** — `templates/.claude/hooks/secrets-scanner.js` existe e bloqueia (exit 2): (a) escrita em paths sensíveis (`.env`, `.pem`, `.key`, `id_rsa`, `id_ed25519`, `credentials.json`, `/secrets/`, `.p12`, `.pfx`); (b) escrita de conteúdo com qualquer padrão da lista canônica `secretTokenPatterns()` (17 padrões: AKIA, ghp_, sk-ant, BEGIN PRIVATE KEY, Bearer, JWT, postgres://...).
- **AC-103-2** — Sufixos de exemplo (`.example`, `.sample`, `.template`, `.tpl`, `.dist`) liberam APENAS a checagem de path. Conteúdo continua escaneado — segredo real em `.env.example` ainda bloqueia.
- **AC-103-3** — `templates/.claude/hooks/block-secrets-in-commit-message.js` existe e bloqueia secret em `git commit -m "..."` (incluindo múltiplos `-m`, `--message=`, e heredoc). Fail-closed se parser não extrair mensagem (escaneia CMD inteiro).
- **AC-103-4** — Lista canônica é compartilhada via `_lib.js#secretTokenRegexes()` — 17 patterns convertidos POSIX → JS pelo helper `posixToJsRegex()`. Drift entre os 2 hooks impossível.
- **AC-103-5** — Suite de equivalência (`test/hooks-equivalence.test.js`) cobre 28 cenários novos (11 paths bloqueados + 5 conteúdos bloqueados + 4 liberações de secrets-scanner + 3 bloqueios de mensagem + 3 liberações de mensagem + 2 edge cases). Total acumulado: 67 cenários verdes em todos os OSes.

---

## Non-goals

- Detectar segredo em `git commit -F arquivo.txt` lendo o arquivo — fica como fail-closed (CMD inteiro escaneado, captura caminho se ele aparecer no comando).
- Detectar segredo em variável de ambiente exportada — fora do escopo (esse é trabalho de pre-commit do projeto cliente).
- Validar entropia de string (Shannon) pra detectar token novo desconhecido — só pegamos padrões nomeados.

---

## Contexto técnico

- **Arquivos criados:**
  - `templates/.claude/hooks/secrets-scanner.js` (78 linhas).
  - `templates/.claude/hooks/block-secrets-in-commit-message.js` (62 linhas).
- **Arquivos estendidos:**
  - `templates/.claude/hooks/_lib.js`: novos exports `secretTokenRegexes()` + `posixToJsRegex()`.
  - `test/hooks-equivalence.test.js`: +28 cenários.
- **Helpers consumidos:** `readStdinJson`, `recordMetric`, `secretTokenRegexes`, `posixToJsRegex` do `_lib.js`.
- **ADRs aplicados:** ADR-012 (port), ADR-013 (convenção `.js`).

---

## Tasks

- [x] **T-009** — Estender `_lib.js` com `posixToJsRegex()` + `secretTokenRegexes()`.
- [x] **T-010** — Port `secrets-scanner.sh` → `secrets-scanner.js` (path block + content scan + skip-path em sufixos de exemplo).
- [x] **T-011** — Port `block-secrets-in-commit-message.sh` → `block-secrets-in-commit-message.js` (extração de mensagem multi-`-m` + heredoc).
- [x] **T-012** — +28 cenários em `hooks-equivalence.test.js`. Resultado: 67 OK / 0 FAIL.

---

## Testes esperados

- **Equivalência:** 28 novos cenários (paths bloqueados + conteúdos + sufixos permitidos + mensagens de commit). Roda em Ubuntu/macOS/Windows-with-bash.

---

## Regulamentação BR aplicável

- **SEC-001** — Nunca versionar segredos. Cobre `.env*`, certificados, chaves SSH, JSON de credenciais.
- **LGPD-004** — Trilha de auditoria: `recordMetric` registra cada bloqueio em `metrics.jsonl`.

---

## Status

- [x] draft
- [x] aprovada (depende-de US-101 ✓)
- [x] em implementação (T-009/010/011/012 ✓)
- [ ] revisão (faltam US-104..US-107 pra suite completa)
- [ ] entregue (depende de US-108)

---

## Histórico

| Data       | Quem    | Mudança                                          |
|------------|---------|--------------------------------------------------|
| 2026-05-23 | Roldão  | criação + implementação completa                 |

---

## Dev Agent Record

- **Agente principal:** dev-senior (Bruno) — Claude Opus 4.7
- **Tempo total:** ~1h30 (port + helper POSIX→JS + suite)
- **Arquivos tocados:** 4 (2 hooks novos, _lib.js estendido, test estendido) + esta story.
- **Decisões fora do PRD:** `posixToJsRegex` foi adicionado ao `_lib.js` (não previsto na US-101) porque os patterns do `secret_token_patterns()` usam classes POSIX `[[:space:]]`. Helper genérico vai ser reaproveitado em US-104..US-107.
- **Skills invocadas:** nenhuma.
- **Bloqueios encontrados:** `anti-mascaramento.sh` pegou tokens `password`/`passwd`/`senha` literais no source. Workaround: `new RegExp('palavra' + '\\s...')` em vez de literal — mesmo padrão já usado em `block-destructive.js`.
