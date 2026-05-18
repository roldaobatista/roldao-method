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

## Etapa 1 — Gerente de Produto

Invoque `gerente-produto`:
- Recebe a descrição informal da feature (ou a US existente).
- Faz perguntas de desambiguação.
- Estrutura como user story (US-NNN) com critérios de aceitação testáveis.
- **Lista non-goals (INV-003).**

Apresentar US e **confirmar** com o usuário.

## Etapa 2 — Investigador

Invoque `investigador`:
- Lê código existente nas áreas que a feature toca.
- Identifica quais entidades/handlers/integrações são afetados.
- Reporta dependências e impactos.

Esse passo **NÃO escreve código.** Só reporta o que existe.

## Etapa 3 — Tech Lead

Invoque `tech-lead` SOMENTE se:
- A feature exige decisão arquitetural nova (nova lib, nova tabela, novo endpoint complexo).
- O Investigador identificou impacto em ADR existente.

Se a feature é trivial (campo novo em form, regra de validação simples), **pular para Dev Sênior**.

Quando invocado, o Tech Lead escreve ADR.

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

## Etapa 7 — Limpeza de markers

Após APROVADO por todos:
- Remova `.claude/.runtime/feature-active-${CLAUDE_SESSION_ID}` (sessão fechada).
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
Próximo passo: <subir pra prod | aguardar release scheduler | próxima story>
```

## Importante

- **Sem jargão técnico** com usuário não-técnico.
- **Verificar antes de afirmar** — rodar testes e mostrar resultado.
- **Sem over-engineering** — se a feature é simples, não inventar abstração.
- **Etapa 0 e Etapa 6 são MECÂNICAS** — hooks impõem. Não tente pular.
