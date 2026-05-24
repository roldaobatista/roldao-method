---
description: Walkthrough guiado de uma mudança (proposta de junção, ramo, ou gravação isolada) antes de subir pra produção. Audita propósito, riscos e contexto. Termos técnicos no jargão: PR=proposta de junção, branch=ramo, commit=gravação, merge=junção.
argument-hint: "[ramo | proposta-N | identificador-da-gravação]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(mkdir:*), Write, Task
---

# /checkpoint — revisão humana antes de juntar a mudança

Use ANTES de subir pra produção ou abrir proposta de junção. Garante que a mudança faz sentido isoladamente e que riscos estão mapeados.

`$ARGUMENTS` = referência da mudança (ramo atual por default, ou nome de ramo, número da proposta, ou identificador da gravação isolada).

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

## Etapa 4 — Mudanças mensuráveis (T-517 / J17)

ANTES da decisão, mostre números concretos do diff em PT-BR pro Roldão:

```bash
git diff --stat <base>..HEAD   # base = main por default ou $ARGUMENTS
```

Reportar em 1 bloco fixo:

```
Mudanças mensuráveis:
- N arquivos alterados
- +X linhas adicionadas
- -Y linhas removidas
- M testes novos (arquivos *.test.* ou *.spec.* adicionados/modificados)
- K migrations (se houver)
```

Salvar o diff bruto em `docs/checkpoints/CHK-AAAA-MM-DD-<slug>.diff` (artefato persistente — auditoria pode revisar meses depois).

## Etapa 5 — Decisão

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

- **NUNCA aprovar proposta de junção com auditor BLOQUEADO** sem autorização explícita do usuário.
- **Apresentar sumário em PT-BR** — sem stack trace, sem stack de testes inteiro.
- Salvar como `docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md`.
- **Hook mecânico:** `require-checkpoint-before-merge.js` bloqueia commit/merge/push em sessão `/feature` ativa enquanto o marker não existir.

---

## PARA-DONO (não-programador)

`/checkpoint` é o **conferimento antes de subir pra produção**. Pense como o ato de revisar a entrega antes do entregador sair com o pedido.

- **O que entra:** o resumo da mudança que vai ser gravada em definitivo (commit/merge/push).
- **O que sai:** uma página em PT-BR claro mostrando o que mudou, o que pode quebrar, e se os 3 auditores aprovaram.
- **Quando rodar:** depois do `/feature` terminar e antes do `/release`. Pense como "ok, vou subir?".
- **Se algo der errado:** o sistema bloqueia commit/merge/push até o problema apontado pelos auditores ser resolvido. Nada vai pro cliente sem checagem.

Quem quer entender o detalhe técnico (como o marker e o `audit_sha` funcionam) lê o resto deste arquivo.
