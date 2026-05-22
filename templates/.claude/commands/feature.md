---
description: Implementa uma funcionalidade nova — passa por gate de readiness, gerente-produto, investigador, tech-lead, dev-senior, revisor e auditores obrigatórios.
argument-hint: "[US-NNN | descricao-da-feature]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(touch:*), Bash(mkdir:*), Bash(git diff:*), Bash(shasum:*), Bash(sha256sum:*), Bash(rm:*), Task
---

# /feature — funcionalidade nova

Conduz implementação. **Não pule etapas.** `$ARGUMENTS` = `US-NNN` (preferido) ou descrição.

## REGRA #0 — desvio antes de Sofia

Antes da Etapa 0, pergunte sozinho (não pro usuário):

> **A feature MUDA comportamento existente do produto?** (Ex: muda como o PDF sai, muda cálculo de imposto.)

- **Sim** → invoque **Detetive 🔬 PRIMEIRO** (Etapa 2 antes da 1). Razão: mexer em comportamento sem ver o estado real reproduz o erro clássico da REGRA #0.
- **Não** → ordem padrão Sofia → Detetive → Rafael.

Codificado em `templates/CLAUDE.md` e `regra-zero-reminder.sh`. Reporte o caminho em 1 frase.

## Hash de sessão (MECÂNICO — uma vez no início)

Todos os marcadores usam `${SESSION_HASH}` = `CLAUDE_SESSION_ID` reduzido a alfanumérico. Define uma vez:

```bash
SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
[ -z "$SESSION_HASH" ] && SESSION_HASH=default
```

## Etapa 0 — Gate de readiness (mecânico)

Hook `require-readiness-before-feature.sh` bloqueia Edit/Write em código de negócio.

1. Identifique `US-NNN` em `$ARGUMENTS`. Se não veio, leia o último `docs/stories/US-*.md` modificado. **Não pergunte ao usuário** (INV-AGENT-006).
2. Extraia `epico: EP-NNN` do frontmatter da US.
3. Verifique `docs/readiness/EP-NNN-status.md` com `status: PRONTO`.
4. Se não estiver `PRONTO`: invoque `/readiness EP-NNN` sozinho. Se reprovar, reporte ao usuário em 1 frase.
5. Se `PRONTO`: `mkdir -p .claude/.runtime && touch .claude/.runtime/feature-active-${SESSION_HASH}` (conteúdo: `US-NNN`).

**Não** crie `readiness-passed-*` manualmente — o hook cria ao validar o frontmatter.

## Etapa 1 — Sofia 📋 (gerente-produto)

- Recebe descrição ou US existente.
- Desambigua **só** quando há decisão de escopo/UX/negócio que não dá pra inferir (INV-AGENT-006).
- Estrutura US-NNN com AC testáveis + **non-goals (INV-003)**.

Reporte em até 3 linhas. Siga sem pedir "ok". Marker: `touch .claude/.runtime/sofia-done-${SESSION_HASH}`.

## Etapa 2 — Detetive 🔬 (investigador)

- Lê código existente nas áreas que a feature toca.
- Identifica entidades/handlers/integrações afetadas.
- **NÃO escreve código.** Só reporta.

Marker: `touch .claude/.runtime/detetive-done-${SESSION_HASH}`.

## Etapa 3 — Rafael 🏛️ (tech-lead) — condicional

Invoque **só se**:
- Exige decisão arquitetural nova (lib, tabela, endpoint complexo); OU
- Detetive identificou impacto em ADR.

Trivial (campo novo, validação simples): declare `touch .claude/.runtime/rafael-skipped-${SESSION_HASH}`.

Quando invocado, Rafael escreve ADR + `touch .claude/.runtime/rafael-done-${SESSION_HASH}`.

Hook `require-agent-sequence-before-dev.sh` exige Sofia + Detetive + Rafael (done OU skipped) antes de Edit/Write.

## Etapa 4 — Dev Sênior

Recebe US + AC, relatório do Detetive, ADR (se houver). Implementa + testes.

## Etapa 5 — Revisor

Audita aderência à US, regras inegociáveis, anti-padrões. Se BLOQUEADO: volta pro Dev e re-roda 5.

## Etapa 6 — 3 Auditores (paralelo, OBRIGATÓRIO)

Invoque **sempre em paralelo** (1 mensagem com 3 Tasks):
- `auditor-seguranca` (Caio 🛡️) — secrets, LGPD, OWASP.
- `auditor-qualidade` (Júlia 🧪) — testes, cobertura, anti-mascaramento.
- `auditor-produto` (Pedro 🎯) — aderência à US, non-goals.

**Sem "dispensa".** Mudança cosmética também passa — eles são rápidos.

Cada auditor registra veredito com hash do diff auditado (impede "touch sem auditar"):

```bash
AUDIT_SHA=$(git diff HEAD | { shasum -a 256 2>/dev/null || sha256sum; } | awk '{print $1}')
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Aprovou (substitua auditor=seg pra qual ou prod):
printf '{"audit_sha":"%s","auditor":"seg","ts":"%s"}\n' "$AUDIT_SHA" "$TS" \
  > .claude/.runtime/auditor-seg-pass-${SESSION_HASH}

# BLOQUEOU:
touch .claude/.runtime/auditor-seg-blocked-${SESSION_HASH}
```

Se BLOQUEADO: volta pro Dev, **remova o marker blocked**, re-roda 5 e 6. O hash muda — auditor gera marker novo (o antigo fica STALE).

Hook `require-auditors-pass-before-commit.sh` bloqueia commit/merge/push se: marker `pass` faltar, qualquer `blocked` existir, ou `audit_sha` STALE.

## Etapa 7 — Checkpoint

Gere walkthrough em `docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md` (template em `commands/checkpoint.md`):
- Propósito + non-goals
- Arquivos tocados (com motivo)
- Tabela de riscos (P × I × Mitigação)
- Migrações + rollback
- Dependências adicionadas
- Cobertura de testes
- Vereditos consolidados

Se risco crítico apareceu agora: volta pra Dev, re-roda 5/6/7.

## Etapa 8 — Limpeza de markers

Após aprovado:
- Remove `feature-active-*`, `sofia-done-*`, `detetive-done-*`, `rafael-{done,skipped}-*`.
- Remove `auditor-{seg,qual,prod}-{pass,blocked}-*`.
- Remove `checkpoint-done-*`.
- **Mantém** `readiness-passed-*` (válido pra próximas stories do mesmo épico).

## Saída final

```
FEATURE ENTREGUE

US: US-NNN — <título>
EP: EP-NNN (readiness PRONTO em <data>)
ADR criado: <sim/não, número>
Arquivos tocados: <N>
Testes adicionados: <N>
Revisor: APROVADO
Auditor segurança: APROVADO | RESSALVAS: <lista>
Auditor qualidade: APROVADO | RESSALVAS: <lista>
Auditor produto: APROVADO | RESSALVAS: <lista>
Checkpoint: docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md
Próximo passo: <subir pra prod | release scheduler | próxima story>
```

## Importante

- **Sem jargão técnico** com usuário não-técnico.
- **Verificar antes de afirmar** — rodar testes e mostrar resultado.
- **Sem over-engineering** — feature simples, sem abstração inventada.
- **Etapas 0, 1-3 e 6 são MECÂNICAS** — hooks impõem, não pule.
