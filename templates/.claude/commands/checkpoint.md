---
description: Walkthrough guiado de uma mudança (PR, branch, commit) antes de subir pra produção. Audita propósito, riscos e contexto.
argument-hint: "[branch | PR-N | commit-sha]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(mkdir:*), Write, Task
---

# /checkpoint — review humano de mudança antes de merge

Use ANTES de subir pra produção ou abrir PR. Garante que a mudança faz sentido isoladamente e que riscos estão mapeados.

`$ARGUMENTS` = referência da mudança (branch atual por default, ou nome de branch, PR ou SHA).

## Etapa 1 — Coletar (investigador)

Invoque `investigador`:
- Diff completo da mudança (`git diff main...HEAD` ou equivalente).
- Lista de arquivos tocados, com motivo de cada um.
- Stories/US-NNN referenciadas em commit messages.
- ADRs criados/alterados.
- Testes adicionados/removidos.
- Migrações de schema (atenção especial).

## Etapa 2 — Análise (3 lentes em paralelo)

Invoque em paralelo:

- `revisor` — aderência ao que foi pedido na story; anti-padrões; coverage de AC.
- `auditor-seguranca` — secrets, validação de input, LGPD, supply-chain de deps novas.
- `auditor-qualidade` — testes proporcionais, mocks indevidos, anti-mascaramento.

## Etapa 3 — Sumário walkthrough

Saída em PT-BR estruturada:

```markdown
# CHECKPOINT — <branch/PR/SHA>

## Propósito em 1 frase
<frase única>

## O que muda pro cliente final
- <muda X>
- <NÃO muda Y (non-goal)>

## Arquivos tocados
- <arquivo>: <motivo>
- ...

## Riscos identificados
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|

## Migrações de dados
- <sim/não — se sim, plano de rollback>

## Dependências adicionadas
- <lib> v<versão> — <motivo + auditoria de supply chain>

## Testes
- Unit: N (era X, agora Y)
- Integration: N
- E2E: N
- Cobertura crítica: <%>

## Decisões de revisor / auditores
- Revisor: APROVADO / RESSALVAS: <lista>
- Auditor segurança: APROVADO / RESSALVAS / BLOQUEADO
- Auditor qualidade: APROVADO / RESSALVAS / BLOQUEADO

## Próximo passo recomendado
- [ ] Merge agora (todos APROVADOS)
- [ ] Aguardar correção (RESSALVAS bloqueantes)
- [ ] Escalar pra humano (decisão fora do escopo do agente)
```

## Etapa 4 — Decisão

- Se **todos auditores aprovados** → recomendar merge e executar (não perguntar).
- Se **ressalvas não-bloqueantes** → aplicar fix e re-checkpoint.
- Se **ressalva bloqueante** → reverter pra dev, listar correções.
- Se **decisão fora do escopo** (ex: aprovação jurídica de LGPD) → escalar ao usuário com pergunta clara.

## Etapa 4.5 — Checklist de release (obrigatório antes de fechar)

Antes de marcar como pronto pra mergear, rode `.specify/checklists/release-readiness.md` (ou o override do projeto). Qualquer item essencial reprovado → volta pra Dev Sênior, não fecha o checkpoint.

## Etapa 5 — Marcar checkpoint concluído (mecânico)

Após salvar `docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md` e tomar decisão (merge / corrigir / escalar), escreva o marker JSON canônico (não basta `touch`).

O marker é um arquivo JSON com **5 campos obrigatórios** (contrato derivado de ADR-020):

```json
{
  "session": "<SESSION_HASH atual>",
  "checkpoint_path": "docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md",
  "audit_sha": "<sha256 do diff coberto pelo checkpoint>",
  "timestamp": "<ISO-8601 UTC>",
  "us": "US-NNN"
}
```

Para gerar (via Bash):

```bash
SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
[ -z "$SESSION_HASH" ] && SESSION_HASH=default
AUDIT_SHA=$(git diff HEAD | sha256sum | cut -d' ' -f1)
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
mkdir -p .claude/.runtime
cat > .claude/.runtime/checkpoint-done-${SESSION_HASH} <<EOF
{
  "session": "${SESSION_HASH}",
  "checkpoint_path": "docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md",
  "audit_sha": "${AUDIT_SHA}",
  "timestamp": "${TS}",
  "us": "US-NNN"
}
EOF
```

Hook `require-checkpoint-before-merge.js` valida:
- 5 campos presentes e não-vazios
- `checkpoint_path` aponta para arquivo existente em disco
- `audit_sha` casa com `git diff HEAD` atual (se mexer no código depois, marker fica "stale" e exige re-rodar /checkpoint)

Marker vazio (criado por `touch` puro) é rejeitado — exit 2. **Sem bypass mecânico.** Em migração de v1.x: setar `ROLDAO_METHOD_LEGACY_MARKERS=1` aceita marker vazio com warning até v2.1.0 (ADR-021).

## Importante

- **NUNCA aprovar PR com auditor BLOQUEADO** sem autorização explícita do usuário.
- **Apresentar sumário em PT-BR** — sem stack trace, sem stack de testes inteiro.
- Salvar como `docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md`.
- **Hook mecânico:** `require-checkpoint-before-merge.js` bloqueia commit/merge/push em sessão `/feature` ativa enquanto o marker não existir.
