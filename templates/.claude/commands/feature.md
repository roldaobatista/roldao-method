---
description: Implementa uma funcionalidade nova — passa por gate de readiness, gerente-produto, investigador, tech-lead, dev-senior, revisor e auditores obrigatórios.
argument-hint: "[US-NNN | descricao-da-feature]"
disable-model-invocation: true
---

# /feature — funcionalidade nova

Você vai conduzir a implementação de uma funcionalidade nova. **Não pule etapas.**

Use `$ARGUMENTS` como `US-NNN` (preferido) ou descrição inicial da feature pedida.

## Etapa 0 — Gate de readiness (OBRIGATÓRIO, mecânico)

**Esta etapa bloqueia mecanicamente o início da feature** — o hook `require-readiness-before-feature.sh` verifica o estado antes de qualquer Edit/Write em código.

1. Identifique a US-NNN alvo (de `$ARGUMENTS` ou pergunte ao usuário).
2. Abra `docs/stories/US-NNN-*.md` e leia o frontmatter — extraia o campo `epico:` (EP-NNN).
3. Verifique se existe `docs/readiness/EP-NNN-status.md` com `status: PRONTO` no frontmatter.
4. Se NÃO existir ou status for diferente de `PRONTO`:
   - **Pare imediatamente.**
   - Diga ao usuário: "O épico EP-NNN não passou no /readiness ainda. Rode `/readiness EP-NNN` antes."
   - Não escreva código. Não invoque dev-senior.
5. Se readiness está `PRONTO`:
   - Crie marcador: `mkdir -p .claude/.runtime && touch .claude/.runtime/readiness-passed-${CLAUDE_SESSION_ID}` (com hash igual ao usado pelos outros hooks).
   - Crie marcador: `touch .claude/.runtime/feature-active-${CLAUDE_SESSION_ID}` com o conteúdo `US-NNN`.
   - Prossiga para Etapa 1.

> O hook `require-readiness-before-feature.sh` valida que `feature-active-*` E `readiness-passed-*` existem antes de permitir Edit/Write em código de negócio. Tentar pular essa etapa resulta em exit 2.

## Etapa 1 — Gerente de Produto (Sofia 📋)

Invoque `gerente-produto`:
- Recebe a descrição informal da feature (ou a US existente).
- Faz perguntas de desambiguação.
- Estrutura como user story (US-NNN) com critérios de aceitação testáveis.
- **Lista non-goals (INV-003).**

Apresentar US e **confirmar** com o usuário.

Ao terminar, crie marker:
```
touch .claude/.runtime/sofia-done-${CLAUDE_SESSION_ID}
```

## Etapa 2 — Investigador (Detetive 🔬)

Invoque `investigador`:
- Lê código existente nas áreas que a feature toca.
- Identifica quais entidades/handlers/integrações são afetados.
- Reporta dependências e impactos.

Esse passo **NÃO escreve código.** Só reporta o que existe.

Ao terminar, crie marker:
```
touch .claude/.runtime/detetive-done-${CLAUDE_SESSION_ID}
```

## Etapa 3 — Tech Lead (Rafael 🏛️)

Invoque `tech-lead` SOMENTE se:
- A feature exige decisão arquitetural nova (nova lib, nova tabela, novo endpoint complexo).
- O Investigador identificou impacto em ADR existente.

Se a feature é trivial (campo novo em form, regra de validação simples), **pode pular para Dev Sênior** — mas precisa declarar explicitamente:
```
touch .claude/.runtime/rafael-skipped-${CLAUDE_SESSION_ID}
```

Quando invocado, o Tech Lead escreve ADR. Ao terminar, crie marker:
```
touch .claude/.runtime/rafael-done-${CLAUDE_SESSION_ID}
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

Se qualquer auditor retornar BLOQUEADO: voltar pra Dev Sênior. Re-rodar Etapa 5 e 6.

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
- Remova `.claude/.runtime/feature-active-${CLAUDE_SESSION_ID}` (sessão fechada).
- Remova `.claude/.runtime/sofia-done-*`, `detetive-done-*`, `rafael-done-*`, `rafael-skipped-*`.
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
