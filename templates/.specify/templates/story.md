---
tipo: story
id: US-NNN
versao: 1
status: draft
prd: PRD-NNN
epico: EP-NNN
tamanho: P    # P | M | G
owner: _(preencher)_
revisado-em: AAAA-MM-DD
depende-de: []    # lista de US-NNN que precisam vir antes
aprovacoes: []   # audit trail persistente — preenchido pelo /feature, validado por validate-story-approvals.js ANTES de status: entregue
# Formato de cada item de aprovacoes:
#   - etapa: gerente-produto        # ou: investigador | tech-lead | dev-senior | revisor | auditor-seguranca | auditor-qualidade | auditor-produto
#     agente: Sofia                  # nome humano do agente
#     data: AAAA-MM-DD
#     status: aprovado               # aprovado | dispensado | reprovado | bloqueado
#     notas: "AC testaveis, non-goals OK"
---

# US-NNN — _(título curto, máximo 60 caracteres)_

> Story file gerado pelo `/historia`. Vive em disco, não na conversa (INV-001).

---

## Como, quero, para

**Como** _(persona)_,
**quero** _(ação concreta)_
**para** _(benefício mensurável)_.

---

## Critérios de aceitação

> Cada AC é **independentemente testável**. Use Gherkin (`dado / quando / então`) ou checklist objetivo.

- **AC-NNN-1** — _(...)_
- **AC-NNN-2** — _(...)_
- **AC-NNN-3** — _(...)_

---

## Non-goals (INV-003)

O que esta story NÃO faz:

- _(item)_

---

## Contexto técnico

_(O Investigador preenche depois do /feature etapa 2. Não inventar antes.)_

- **Arquivos afetados:** _(lista de paths)_
- **Entidades/handlers:** _(lista)_
- **Migrations necessárias:** _(sim/não, qual)_
- **ADRs relacionados:** _(ADR-NNNN se houver)_

---

## Tasks

> Cada task vira 1 commit atômico citando o ID.

- [ ] **T-001** — _(...)_
- [ ] **T-002** — _(...)_

---

## Testes esperados

- **Unitário:** _(quais funções)_
- **Integração:** _(qual fluxo)_
- **E2E (se aplicável):** _(qual jornada)_

---

## Regulamentação BR aplicável

_(IDs do REGRAS-INEGOCIAVEIS.md tocados nesta story)_

- _(ex: LGPD-001 — coleta de CPF, base legal = execução de contrato)_

---

## Status

- [ ] draft
- [ ] aprovada (gerente-produto OK)
- [ ] em implementação (dev-senior em ação)
- [ ] revisão (revisor avaliando)
- [ ] entregue (auditores OK ou dispensados)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | criação |

---

## Dev Agent Record (preencher ao implementar)

> Rastreabilidade da execução IA. Preenche o agente que rodou `/feature` ou `/quick-dev`.

- **Agente principal:** _(ex: dev-senior — Bruno)_
- **Modelo usado:** _(claude-sonnet-4-6 / claude-haiku-4-5)_
- **Custo aproximado:** _(tokens / USD se mensurável)_
- **Tempo total:** _(em min)_
- **Arquivos tocados:** _(lista, gerada pelo `git diff --stat`)_
- **Tasks concluídas:** _(T-001 ✓, T-002 ✓, T-003 ✗ — pendente)_
- **Hooks que bloquearam:** _(quais hooks dispararam e como foram resolvidos)_
- **Decisões fora do PRD:** _(se houve, justificar — vira ADR posterior)_
- **Skills invocadas:** _(brainstormar-ideia, validar-cpf-cnpj, gerar-test-fixture-br, etc)_
- **Subagentes invocados:** _(investigador, tech-lead, revisor, auditores)_
- **Bloqueios encontrados:** _(lista — vira input pra `/retro`)_

### Debug log (opcional)

_(Espaço pro agente registrar trilha de decisões — útil pra retro e pra reproduzir o caso depois.)_

```
AAAA-MM-DD HH:MM — investigador identificou que campo X é nulo em 12% dos registros
AAAA-MM-DD HH:MM — tech-lead decidiu adicionar validação no boundary, ADR-021 escrito
AAAA-MM-DD HH:MM — dev-senior implementou em src/auth/validate.ts, 3 testes novos
AAAA-MM-DD HH:MM — revisor aprovou; auditor-seguranca apontou ressalva LGPD-004 (resolvida)
```
