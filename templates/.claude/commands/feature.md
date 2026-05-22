---
description: Implementa funcionalidade nova — gate de prontidao, gerente-produto, investigador, tech-lead, dev-senior, revisor e auditores obrigatorios.
argument-hint: "[US-NNN | descricao-da-feature]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(touch:*), Bash(mkdir:*), Bash(git diff:*), Bash(shasum:*), Bash(sha256sum:*), Bash(rm:*), Task
---

# /feature — funcionalidade nova

Voce vai conduzir a implementacao de uma funcionalidade nova. **Nao pule etapas.**

Use `$ARGUMENTS` como `US-NNN` (preferido) ou descricao inicial da feature.

## Caminho rapido — delegue ao Maestro

```
Task subagent_type=maestro prompt="Modo FT. US=$ARGUMENTS. Orquestre o pipeline completo (Sofia → Detetive → Rafael → Bruno → Inês → 3 auditores em paralelo → checkpoint). Crie todos os markers em .claude/.runtime/."
```

O **Maestro** (`.claude/agents/maestro.md`) e o orquestrador mecanico do pipeline. Ele cria os markers em cada etapa, dispara os auditores em paralelo, re-roda quando o hash do diff muda, e reporta em etapas numeradas. Use-o sempre que rodar `/feature` — voce nao precisa conduzir o pipeline manualmente.

Se preferir orquestrar manualmente (debug do pipeline, sessao parcial), siga as etapas abaixo. **O conteudo eh equivalente** — o maestro so automatiza a sequencia.

---

## REGRA #0 — decida o caminho antes de chamar Sofia

Pergunta sozinho (nao pro usuario):

> **A feature MUDA comportamento existente?** (Ex: muda como o PDF sai, muda calculo de imposto, altera fluxo de cadastro ja em uso.)

- **Sim** → chame o **Detetive (investigador) PRIMEIRO** pra ler banco/log/payload antes de Sofia entrar. Use a Etapa 2 antes da Etapa 1. Razao: mexer em comportamento sem entender por que esta como esta reproduz o erro classico — trocar o sintoma sem ver a causa.
- **Nao** → feature e greenfield (campo novo, tela nova, regra que nao existia). Siga a ordem padrao Sofia → Detetive → Rafael.

Reporte em 1 frase o caminho escolhido. Nao pergunte ao usuario.

## Etapa 0 — Prontidao do epico (mecanico, obrigatorio)

1. Identifique a US-NNN alvo. Se indetectavel em `$ARGUMENTS`, assuma o proximo sequencial olhando `docs/stories/` e reporte "Assumido US-NNN" — nao pergunte.
2. Abra `docs/stories/US-NNN-*.md` e leia `epico:` do frontmatter (EP-NNN).
3. Verifique `docs/readiness/EP-NNN-status.md` com `status: PRONTO`.
4. Se faltar ou nao estiver PRONTO:
   - **Pare.** Diga ao usuario "O epico EP-NNN nao passou no /readiness. Rode `/readiness EP-NNN` antes."
   - Nao escreva codigo.
5. Se PRONTO, crie o marcador da sessao e siga pra Etapa 1.

> O sistema bloqueia mecanicamente: o hook `require-readiness-before-feature.sh` verifica o frontmatter `status: PRONTO` antes de qualquer Edit/Write em codigo de negocio. Detalhes mecanicos no fim deste documento.

## Etapa 1 — Gerente de Produto (Sofia)

Invoque `gerente-produto`:
- Recebe a descricao informal da feature (ou a US existente).
- Estrutura como user story (US-NNN) com criterios de aceitacao testaveis.
- **Lista non-goals** (INV-003).
- **Assume premissas razoaveis** em vez de perguntar — registra em `premissas:` do frontmatter.

**Nao peca confirmacao ao usuario.** A US salva em disco e o estado compartilhado (INV-001). Reporte "US-NNN criada com N AC e M non-goals; rodando Detetive" e prossiga. So pergunte se o Investigador (Etapa 2) levantar ambiguidade que afete comportamento observavel.

Marcador da etapa: `sofia-done-${SESSION_HASH}`.

## Etapa 2 — Investigador (Detetive)

Invoque `investigador`:
- Le codigo existente nas areas que a feature toca.
- Identifica entidades/handlers/integracoes afetados.
- Reporta dependencias e impactos.
- Registra ambiguidades em `pendencias[]` no JSON (nao pergunta diretamente).

Esse passo **NAO escreve codigo.** So reporta.

Marcador: `detetive-done-${SESSION_HASH}`.

## Etapa 3 — Tech Lead (Rafael)

Invoque `tech-lead` SOMENTE se:
- A feature exige decisao arquitetural nova (lib nova, tabela nova, integracao nova).
- O Investigador identificou impacto em ADR existente.

Se a feature e trivial (campo novo em form, validacao simples), **pule pra Dev Senior** — mas declare explicitamente:

```bash
touch .claude/.runtime/rafael-skipped-${SESSION_HASH}
```

Tech Lead escreve ADR. Marcador: `rafael-done-${SESSION_HASH}`.

## Etapa 4 — Dev Senior

Invoque `dev-senior` com:
- A US-NNN com criterios de aceitacao
- Relatorio do Investigador (JSON em `.claude/.runtime/investigation-*.json`)
- ADR (se houver)

Dev Senior implementa + escreve testes.

## Etapa 5 — Revisor

Invoque `revisor`:
- Audita aderencia a US
- Verifica regras inegociaveis
- Caca anti-padroes

Se BLOQUEADO: volta pra Dev Senior. Re-roda Etapa 5.

## Etapa 6 — Auditores (obrigatorios, em paralelo)

Invoque **sempre, em paralelo**:
- `auditor-seguranca` (Caio) — secrets, LGPD, supply chain, OWASP.
- `auditor-qualidade` (Julia) — testes, cobertura, anti-mascaramento.
- `auditor-produto` (Pedro) — aderencia a US, non-goals.

**Nao ha dispensa de auditores** — eles sao rapidos e dispensa esvazia o gate.

Cada auditor gera marcador com hash do diff auditado (impede "touch sem auditar"):

```bash
AUDIT_SHA=$(git diff HEAD | { shasum -a 256 2>/dev/null || sha256sum; } | awk '{print $1}')
SESS="${SESSION_HASH}"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
printf '{"audit_sha":"%s","auditor":"seg","ts":"%s"}\n' "$AUDIT_SHA" "$TS" \
  > .claude/.runtime/auditor-seg-pass-${SESS}
# (analogo pra qual e prod)
```

Se algum bloquear: volta pra Dev Senior, re-roda Etapas 5+6, **remove o marker blocked correspondente**. Apos correcao, o hash do diff muda — auditor precisa novo marker.

## Etapa 7 — Checkpoint (walkthrough antes de mergear)

Gere o walkthrough estruturado seguindo o template em `commands/checkpoint.md`:

- Diff completo (`git diff main...HEAD`)
- Sumario PT-BR: proposito, impacto pro cliente, arquivos tocados, riscos, migrations, cobertura de testes, decisoes consolidadas
- Salvar em `docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md`

Se algum risco critico escapar da Etapa 6, volte pra Dev Senior.

## Etapa 8 — Limpeza

Apos checkpoint salvo:
- Remova markers da sessao (`feature-active`, `sofia-done`, `detetive-done`, `rafael-done|skipped`, `auditor-{seg,qual,prod}-{pass,blocked}`, `checkpoint-done`)
- **Mantenha** `readiness-passed-*` (valido pra proximas stories do mesmo epico nesta sessao)

## Saida final

```
FEATURE ENTREGUE

US: US-NNN — <titulo>
EP: EP-NNN (readiness PRONTO em <data>)
ADR criado: <sim/nao, numero>
Arquivos tocados: <N>
Testes adicionados: <N>
Revisor: APROVADO
Auditor seguranca: APROVADO | RESSALVAS: <lista>
Auditor qualidade: APROVADO | RESSALVAS: <lista>
Auditor produto: APROVADO | RESSALVAS: <lista>
Checkpoint: docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md
Proximo passo: <subir pra prod | aguardar release scheduler | proxima story>
```

## Importante

- **Sem jargao tecnico** com usuario nao-tecnico
- **Verificar antes de afirmar** — rode testes e mostre resultado
- **Sem over-engineering** — se a feature e simples, nao invente abstracao
- **Etapas 0, 1-3 e 6 sao mecanicas** — o sistema bloqueia automatic. Nao tente pular

---

## Apendice — Como o sistema protege seu progresso

Esta secao e referencia. **Voce nao precisa ler na primeira execucao.**

### Hash da sessao (mecanico)

Os hooks procuram marcadores com sufixo `${SESSION_HASH}` (= `CLAUDE_SESSION_ID` reduzido a caracteres alfanumericos). Os marcadores que voce cria PRECISAM usar o mesmo hash, senao nunca casam e o gate trava:

```bash
SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
[ -z "$SESSION_HASH" ] && SESSION_HASH=default
```

### Marcador de feature ativa

Crie ao passar na Etapa 0:
```bash
mkdir -p .claude/.runtime && touch .claude/.runtime/feature-active-${SESSION_HASH}
```
Conteudo: `US-NNN`. **Nao** crie `readiness-passed-*` manualmente — o proprio hook cria ao validar `status: PRONTO`. Criar a mao fura o gate.

### Hooks que aplicam

- `require-readiness-before-feature.sh` — exige `readiness PRONTO` antes de Edit/Write
- `require-agent-sequence-before-dev.sh` — exige Sofia + Detetive + Rafael (ou rafael-skipped)
- `require-auditors-pass-before-commit.sh` — exige 3 auditores aprovados com hash do diff atual

Tentar pular qualquer um desses resulta em bloqueio com mensagem clara explicando o que falta.
