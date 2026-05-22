---
description: Implementa uma funcionalidade nova — passa por gate de readiness, gerente-produto, investigador, tech-lead, dev-senior, revisor e auditores obrigatórios.
argument-hint: "[US-NNN | descricao-da-feature]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(touch:*), Bash(mkdir:*), Bash(git diff:*), Bash(shasum:*), Bash(sha256sum:*), Bash(rm:*), Task
---

# /feature — funcionalidade nova

Você vai conduzir a implementação de uma funcionalidade nova. **Não pule etapas.**

Use `$ARGUMENTS` como `US-NNN` (preferido) ou descrição inicial da feature pedida.

## REGRA #0 — antes de invocar Sofia, decida o caminho

Antes da Etapa 0, faça uma pergunta sozinho (não pro usuário):

> **A feature MUDA comportamento existente do produto?** (Ex: muda como o PDF sai, muda cálculo de imposto, altera fluxo de cadastro já em uso.)

- **Sim** → trate como bug + feature: invoque o **Detetive 🔬 (investigador) PRIMEIRO** para ler o estado real (banco, log, payload) antes de Sofia entrar. Use a Etapa 2 antes da Etapa 1. Razão: mexer em comportamento sem entender por que está como está reproduz o erro clássico da REGRA #0 — trocar o sintoma sem ver a causa.
- **Não** → feature é greenfield (campo novo, tela nova, regra que ainda não existe). Siga a ordem padrão Sofia → Detetive → Rafael.

Esse desvio é codificado em `templates/CLAUDE.md` REGRA #0 e `regra-zero-reminder.sh`. Não pergunte ao usuário — você consegue julgar lendo o pedido em 10 segundos. Reporte em 1 frase o caminho escolhido ("vou começar pelo Detetive porque a feature muda o relatório que já existe").

## Etapa 0 — Gate de readiness (OBRIGATÓRIO, mecânico)

**Esta etapa bloqueia mecanicamente o início da feature** — o hook `require-readiness-before-feature.sh` verifica o estado antes de qualquer Edit/Write em código.

> **Hash de sessão (MECÂNICO):** os hooks procuram marcadores com o sufixo `${SESSION_HASH}` = `CLAUDE_SESSION_ID` reduzido a caracteres alfanuméricos. Os marcadores que você cria PRECISAM usar o mesmo hash, senão nunca casam e o gate trava. Defina uma vez no início da sessão e use `${SESSION_HASH}` em todos os `touch`:
>
> ```bash
> SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
> [ -z "$SESSION_HASH" ] && SESSION_HASH=default
> ```

1. Identifique a US-NNN alvo a partir de `$ARGUMENTS`. Se não veio, leia o último `docs/stories/US-*.md` modificado (mais recente) e use ele. **Não pergunte ao usuário** — INV-AGENT-006: tudo que você pode resolver, resolve.
2. Abra `docs/stories/US-NNN-*.md` e leia o frontmatter — extraia o campo `epico:` (EP-NNN).
3. Verifique se existe `docs/readiness/EP-NNN-status.md` com `status: PRONTO` no frontmatter.
4. Se NÃO existir ou status for diferente de `PRONTO`:
   - **Invoque `/readiness EP-NNN` sozinho** (você tem a ferramenta — INV-AGENT-006). Não diga ao usuário pra rodar.
   - Se mesmo após `/readiness` o status continuar diferente de `PRONTO` (gate genuíno reprovou), pare e reporte a causa concreta da reprovação ao usuário em 1 frase. Aí sim ele decide.
5. Se readiness está `PRONTO`:
   - Crie marcador: `mkdir -p .claude/.runtime && touch .claude/.runtime/feature-active-${SESSION_HASH}` com o conteúdo `US-NNN`.
   - **Não** crie `readiness-passed-*` manualmente — o próprio hook `require-readiness-before-feature.sh` cria esse marcador ao validar o frontmatter `status: PRONTO`. Criar à mão fura o gate (o hook sai cedo se o marcador já existe, sem checar o status real).
   - Prossiga para Etapa 1.

> O hook `require-readiness-before-feature.sh` valida que `feature-active-*` E `readiness-passed-*` existem antes de permitir Edit/Write em código de negócio. Tentar pular essa etapa resulta em exit 2.

## Etapa 1 — Gerente de Produto (Sofia 📋)

Invoque `gerente-produto`:
- Recebe a descrição informal da feature (ou a US existente).
- Faz perguntas de desambiguação **somente quando há ambiguidade real** (decisão que muda escopo/UX/regra de negócio e não dá pra inferir do pedido). Detalhe técnico que você consegue julgar não vira pergunta — INV-AGENT-006.
- Estrutura como user story (US-NNN) com critérios de aceitação testáveis.
- **Lista non-goals (INV-003).**

Reporte ao usuário em até 3 linhas: título da US + 1 frase sobre escopo + 1 frase sobre non-goals. Siga direto pra Etapa 2 sem pedir "ok" — se o usuário discordar, ele interrompe; INV-AGENT-006.

Ao terminar, crie marker:
```
touch .claude/.runtime/sofia-done-${SESSION_HASH}
```

## Etapa 2 — Investigador (Detetive 🔬)

Invoque `investigador`:
- Lê código existente nas áreas que a feature toca.
- Identifica quais entidades/handlers/integrações são afetados.
- Reporta dependências e impactos.

Esse passo **NÃO escreve código.** Só reporta o que existe.

Ao terminar, crie marker:
```
touch .claude/.runtime/detetive-done-${SESSION_HASH}
```

## Etapa 3 — Tech Lead (Rafael 🏛️)

Invoque `tech-lead` SOMENTE se:
- A feature exige decisão arquitetural nova (nova lib, nova tabela, novo endpoint complexo).
- O Investigador identificou impacto em ADR existente.

Se a feature é trivial (campo novo em form, regra de validação simples), **pode pular para Dev Sênior** — mas precisa declarar explicitamente:
```
touch .claude/.runtime/rafael-skipped-${SESSION_HASH}
```

Quando invocado, o Tech Lead escreve ADR. Ao terminar, crie marker:
```
touch .claude/.runtime/rafael-done-${SESSION_HASH}
```

> O hook `require-agent-sequence-before-dev.sh` valida que Sofia, Detetive e Rafael (ou rafael-skipped) rodaram antes de qualquer Edit/Write em código de negócio. Exit 2 se faltar.

## Etapa 4 — Dev Sênior

Invoque `dev-senior` com:
- A US-NNN com critérios de aceitação.
- Relatório do Investigador.
- ADR (se houver).

Dev Sênior implementa + escreve testes.

## Etapa 5 — Revisor

Invoque `revisor`:
- Audita aderência à US.
- Verifica regras inegociáveis.
- Caça anti-padrões.

Se BLOQUEADO: voltar para Dev Sênior com ajustes. Re-rodar Etapa 5.

## Etapa 6 — Auditores (OBRIGATÓRIO, em paralelo)

Invoque **sempre, em paralelo**:
- `auditor-seguranca` (Caio 🛡️) — secrets, LGPD, supply chain, OWASP.
- `auditor-qualidade` (Júlia 🧪) — testes, cobertura, anti-mascaramento.
- `auditor-produto` (Pedro 🎯) — aderência à US, non-goals.

**Não há mais "dispensa de auditores"**. Mesmo mudança cosmética passa pelos 3 — eles são rápidos e a dispensa virou o caminho mais usado, esvaziando o gate.

**Para cada auditor, registre o veredito com hash do diff auditado (mecânico):**

```bash
# Compute o hash do que voce DE FATO auditou (impede 'touch sem auditar'):
AUDIT_SHA=$(git diff HEAD | { shasum -a 256 2>/dev/null || sha256sum; } | awk '{print $1}')
SESS="${SESSION_HASH}"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# Se aprovou (auditor-seguranca):
printf '{"audit_sha":"%s","auditor":"seg","ts":"%s"}\n' "$AUDIT_SHA" "$TS" \
  > .claude/.runtime/auditor-seg-pass-${SESS}
# (analogo pra qual e prod com auditor=qual / auditor=prod)

# Se BLOQUEOU (apontou ressalva bloqueante):
touch .claude/.runtime/auditor-seg-blocked-${SESS}
# (idem qual / prod)
```

Se qualquer auditor retornar BLOQUEADO: voltar pra Dev Sênior. Re-rodar Etapa 5 e 6. Antes de re-rodar, **remova o marker blocked correspondente**. Apos correcao, o hash do diff muda — auditor precisa gerar marker novo (o antigo fica STALE e o hook bloqueia).

> O hook `require-auditors-pass-before-commit.sh` bloqueia `git commit`/`merge`/`push` (em sessão `/feature` ativa) se: (a) algum marker `pass` faltar, (b) qualquer marker `blocked` existir, ou (c) o `audit_sha` do marker `pass` não bater com o `git diff HEAD` atual (codigo mudou depois da aprovacao).

## Etapa 7 — Checkpoint (walkthrough antes de mergear)

Antes de declarar feature pronta, gere o walkthrough estruturado do `/checkpoint`:

- Diff completo (`git diff main...HEAD`).
- Sumário em PT-BR seguindo o template de `commands/checkpoint.md`:
  - Propósito em 1 frase
  - O que muda pro cliente final + non-goals
  - Arquivos tocados (com motivo)
  - Tabela de riscos (Probabilidade × Impacto × Mitigação)
  - Migrações de dados (com plano de rollback se houver)
  - Dependências adicionadas
  - Cobertura de testes (Unit/Integration/E2E)
  - Decisões consolidadas (Revisor + 3 Auditores)
- Salvar em `docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md`.

Se algum risco crítico aparecer aqui que escapou da Etapa 6, volte pra Dev Sênior. Re-rodar Etapa 5, 6 e 7.

## Etapa 8 — Limpeza de markers

Após APROVADO por todos e checkpoint salvo:
- Remova `.claude/.runtime/feature-active-${SESSION_HASH}` (sessão fechada).
- Remova `.claude/.runtime/sofia-done-*`, `detetive-done-*`, `rafael-done-*`, `rafael-skipped-*`.
- Remova `.claude/.runtime/auditor-{seg,qual,prod}-{pass,blocked}-*` (sessão fechada).
- Remova `.claude/.runtime/checkpoint-done-*`.
- Mantenha `readiness-passed-*` (válido pra próximas stories do mesmo épico nesta sessão).

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
Próximo passo: <subir pra prod | aguardar release scheduler | próxima story>
```

## Importante

- **Sem jargão técnico** com usuário não-técnico.
- **Verificar antes de afirmar** — rodar testes e mostrar resultado.
- **Sem over-engineering** — se a feature é simples, não inventar abstração.
- **Etapas 0, 1-3 e 6 são MECÂNICAS** — hooks `require-readiness-before-feature`, `require-agent-sequence-before-dev` e a obrigatoriedade dos auditores impõem. Não tente pular.
