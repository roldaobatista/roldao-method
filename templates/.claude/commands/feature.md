---
description: Implementa uma funcionalidade nova — passa por gerente-produto, investigador, tech-lead, dev-senior, revisor e auditores.
argument-hint: "[descricao-da-feature]"
disable-model-invocation: true
---

# /feature — funcionalidade nova

Você vai conduzir a implementação de uma funcionalidade nova. **Não pule etapas.**

Use `$ARGUMENTS` como descrição inicial da feature pedida.

## Etapa 1 — Gerente de Produto

Invoque `gerente-produto`:
- Recebe a descrição informal da feature.
- Faz perguntas de desambiguação.
- Estrutura como user story (US-NNN) com critérios de aceitação testáveis.
- **Lista non-goals.**

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

Se BLOQUEADO: voltar para Dev Sênior com ajustes.

## Etapa 6 — Auditores (opcional, mas recomendado pra feature crítica)

Invoque em paralelo:
- `auditor-seguranca`
- `auditor-qualidade`
- `auditor-produto`

Critérios pra DISPENSAR auditores:
- Mudança cosmética (CSS, label).
- Feature em ambiente de desenvolvimento sem impacto em produção.

## Saída final

```
FEATURE ENTREGUE

US: US-NNN — <título>
ADR criado: <sim/não, número>
Arquivos tocados: <N>
Testes adicionados: <N>
Revisor: APROVADO
Auditores: <APROVADO | APROVADO COM RESSALVAS>
Próximo passo: <subir pra prod | aguardar release scheduler>
```

## Importante

- **Sem jargão técnico** com usuário não-técnico.
- **Verificar antes de afirmar** — rodar testes e mostrar resultado.
- **Sem over-engineering** — se a feature é simples, não inventar abstração.
