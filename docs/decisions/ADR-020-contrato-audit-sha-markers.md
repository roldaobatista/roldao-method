---
owner: tech-lead
revisado-em: 2026-05-24
status: aceito
decidido-em: 2026-05-24
decidido-por: dogfood PRD-003 (Roldao aprovou PRD-003 e ADRs decorrentes em 2026-05-24)
---

# ADR-020 — Contrato canonico de audit_sha em markers de aprovacao

## Contexto

Hoje os markers de auditor em `.claude/.runtime/auditor-{seg,qual,prod}-pass-SESSION` sao aceitos pelo hook `require-auditors-pass-before-commit.js` mesmo vazios. O Modo FT do Maestro (linhas 134-142 de `.claude/agents/maestro.md`) grava JSON com `audit_sha`, mas o hook nao valida o conteudo — `touch` cria arquivo vazio que passa o check.

Pior: o proprio hook ensina o bypass na stderr (linhas 107-111 de `require-auditors-pass-before-commit.js`), instruindo o operador a rodar `touch` em 3 arquivos pra desbloquear.

A auditoria 10-agentes (2026-05-24) marcou isso como bloqueador 1 (auditor 10 — aderencia ao framework). Sem contrato canonico do que e marker valido, o framework nao consegue distinguir aprovacao real de aprovacao fake — INV-AGENT-004 (verificar antes de afirmar) e mecanicamente quebrada.

PRD-003 promete fechar o bypass no Sprint 1 (US-111 AC-111-1). Antes do Bruno codar, precisamos congelar o shape do JSON, o algoritmo de validacao do `audit_sha` e a politica de migracao pros markers antigos.

## Decisao

Marker valido e arquivo JSON com shape obrigatorio. Arquivo vazio = invalido. Arquivo com JSON malformado = invalido. Arquivo com JSON valido mas `audit_sha` que nao bate com nenhum commit alcancavel = invalido.

### Shape do marker em `.claude/.runtime/auditor-*-pass-*`

Campos obrigatorios:
- `session`: SESSION_HASH atual
- `agent`: `auditor-seguranca` | `auditor-qualidade` | `auditor-produto`
- `audit_sha`: sha256 do diff que o auditor leu
- `timestamp`: ISO-8601 UTC
- `lido_de`: lista de arquivos auditados

Todos os 5 campos sao obrigatorios. Campos extras sao aceitos (forward-compat).

### Shape de `aprovacoes:` no frontmatter de story

Cada entrada de aprovacao tem:
- `etapa`: `revisor` | `auditor-seguranca` | `auditor-qualidade` | `auditor-produto`
- `agente`: nome do agente
- `status`: `aprovado` | `bloqueado`
- `audit_sha`: sha256 do diff aprovado
- `commit_sha`: sha do commit que congela esse diff (opcional ate o merge)
- `data`: ISO-8601 UTC

`audit_sha` e obrigatorio em toda entrada. `commit_sha` e opcional pre-merge (preenchido pelo hook `validate-story-approvals.js` no momento do commit final).

### Algoritmo de validacao

Hook `require-auditors-pass-before-commit.js` rejeita marker se:

1. Arquivo nao existe OU tamanho zero OU JSON nao parseia: block com mensagem PT-BR leiga.
2. Campo obrigatorio faltante: block.
3. `audit_sha` nao bate com `git diff HEAD` atual E nao bate com nenhum commit alcancavel via `git rev-list HEAD` no diff cumulativo desde o ultimo merge: block (auditor aprovou diff antigo, dev mudou depois — re-rodar auditor).
4. `session` no marker diferente do SESSION_HASH atual: warning (nao block — marker de outra sessao pode ser legitimo apos `--continue`).

Stderr do hook nao ensina bypass. Mensagem leiga: "Auditor ainda nao rodou. Rode /auditoria ou peca pro Maestro re-rodar Modo AUDIT."

### Politica de migracao (markers antigos)

Markers `touch`-criados (vazios) em projetos terceiros que ja instalaram v1.x sao tratados pela flag `ROLDAO_METHOD_LEGACY_MARKERS=1` — decisao detalhada em ADR-021. Quando a flag esta ativa, marker vazio passa com warning; quando esta inativa, marker vazio bloqueia.

## Consequencias

**Positivas:**
- Bypass `touch` literalmente fechado — auditor precisa ter rodado de verdade pra gerar `audit_sha` que casa com o diff.
- `aprovacoes:` no frontmatter vira auditavel — `validate-story-approvals.js` cruza `audit_sha` da story com markers da sessao.
- INV-AGENT-004 mecanicamente cumprida no caminho de aprovacao mais critico.
- Addons (`fintech-br`, `fiscal-br-completo`) ganham contrato estavel pra consumir — hoje contrato e implicito, qualquer mudanca quebra addon silenciosamente.
- Bruno (dev-senior) codifica 1 helper em `_lib.js` (`writeAuditorMarker`, `readAuditorMarker`, `validateAuditSha`) e os 6+ hooks consomem via import — reuso real.

**Negativas (custo aceito):**
- Breaking change pra projetos terceiros — qualquer projeto que usava `touch` pra bypass (ou que tinha script de CI que criava marker vazio) trava no `update`. Mitigado pela flag `ROLDAO_METHOD_LEGACY_MARKERS=1` (ADR-021) e pelo `MIGRATION-v2.md`.
- Calculo de `audit_sha` adiciona ~50-200ms por marker (sha256 de diff que pode ter milhares de linhas). Aceitavel — roda 3-4x por feature, nao em loop quente.
- Validacao de "audit_sha bate com commit alcancavel" exige que o repo tenha historico git acessivel — projetos que rodam o framework fora de git (raro mas possivel) precisam de fallback. Decisao: nao suportar — se nao tem git, nao tem rastreabilidade INV-004 mesmo.

**Neutras:**
- Modo AUDIT do Maestro ja calcula `audit_sha` corretamente (linha 137 de `maestro.md`); muda so no hook que consome.

## Alternativas consideradas

### Opcao B — Marker vazio + audit_sha em log separado

Marker continua sendo `touch` puro; `audit_sha` vai pra arquivo de log `.claude/.runtime/audit-log.jsonl`. **Descartada porque** mantem o problema atual: dois arquivos podem dessincronizar (touch cria marker, log nao recebe entry), e a stderr que ensina bypass continua valida. Nao fecha o bloqueador 1 da auditoria.

### Opcao C — audit_sha na mensagem de commit em vez de no marker

Auditor escreve `Audit-SHA: <hash>` no commit message; hook valida la. **Descartada porque** auditor roda antes do commit — nao ha commit pra anexar metadata no momento do veredito. E mistura aprovacao de processo com mensagem de commit, dificultando re-rodar auditor sem re-committar.

## Non-goals

O que esta decisao NAO resolve:
- **Nao define janela de compatibilidade da flag LEGACY_MARKERS** — fica pra ADR-021.
- **Nao reescreve mensagens de erro de todos os outros hooks que ensinam bypass** (`require-checkpoint-before-merge.js` linha 54, `require-investigador-before-fix.js` GATE 2 linha 68) — esses 2 sao tarefa do Sprint 1 do PRD-003, mas seguem o mesmo padrao (sem ensinar bypass na stderr) e nao precisam de ADR proprio.
- **Nao muda contrato de markers que NAO sao de aprovacao** (`feature-active-*`, `sofia-done-*`, `detetive-done-*`, `revisor-done-*`, `checkpoint-done-*`) — esses continuam sendo `touch` puro, pois sinalizam "etapa executada" e nao "aprovacao de conteudo". Auditavel via timestamp do arquivo basta.
- **Nao cobre approval de revisor (Ines)** pelo mesmo shape — `revisor-done-*` segue regra propria descrita no Modo FT do Maestro.
- **Nao migra markers existentes em projetos terceiros automaticamente** — flag pula validacao, mas nao reescreve markers antigos (decisao deliberada — escrever em `.runtime` de projeto terceiro durante `update` viola principio de minimo privilegio).

## Como verificar aderencia

- Teste `tests/hooks/require-auditors-pass.test.js` com 6 casos: marker vazio bloqueia, marker com JSON valido + audit_sha correto passa, marker com audit_sha errado bloqueia, marker com campo faltando bloqueia, JSON malformado bloqueia, marker de outra sessao avisa mas nao bloqueia.
- Hook `validate-story-approvals.js` rejeita story com `aprovacoes:` sem `audit_sha`.
- Procurar por instrucao de touch em auditor-pass na stderr dos hooks retorna 0 ocorrencias (mensagem de erro nao ensina bypass).
- `_lib.js` exporta `writeAuditorMarker`, `readAuditorMarker`, `validateAuditSha` com testes unitarios proprios.

## Como reabrir

- Se `audit_sha` de diffs gigantes (>100k linhas) comecar a passar de 1s: trocar sha256 por sha256 de blob-hashes do git (mais barato, ainda integro).
- Se addon de terceiro precisar de shape estendido (ex: `audit_sha_dependencies` apontando pra hashes de bibliotecas auditadas): adicionar campo opcional sem quebrar contrato.
- Se modelo de aprovacao mudar pra multi-auditor (ex: 2 auditores de seguranca em projetos high-stakes): re-modelar `aprovacoes:` como lista por etapa, nao item unico.

## Referencias

- ADR-019 — Maestro multi-modo (consome o contrato de marker).
- ADR-021 — Janela de compatibilidade `ROLDAO_METHOD_LEGACY_MARKERS`.
- ADR-017 — Estabilidade do `_lib.js` (helpers novos entram como stable).
- INV-AGENT-004 — verificar antes de afirmar.
- INV-002 — spec gera codigo (contrato canonico aqui = codigo derivado nos hooks).
- PRD-003 secao 4 — US-111 AC-111-1.
- `.claude/hooks/require-auditors-pass-before-commit.js` (estado atual com bypass ensinado).
- `.claude/agents/maestro.md` linhas 134-142 (gravacao atual de audit_sha).
- `.claude/hooks/validate-story-approvals.js` (futuro consumidor de audit_sha em frontmatter).
