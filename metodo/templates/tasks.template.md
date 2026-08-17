---
modulo: <nome-do-modulo>
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
origem: plan.md
proximo: CHECKLIST-PRONTO-PRA-CODAR.md
idioma: pt-BR
limite-linhas: 200
proposito: lista executavel de tarefas derivadas do plano aprovado
---

<!--
template: docs/dominios/<dom>/modulos/<modulo>/tasks.md
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C4
-->

# Tasks — <nome-do-modulo>

> **Estimativa**: usar escala P/M/G (mesma de `kickoff-fase.md`).
> - **P**: até 2h
> - **M**: meio dia (~4h)
> - **G**: dia ou mais (≥8h)
>
> **plan-passo**: referência à seção/passo do `plan.md` que esta task implementa (ex: "Estratégia §2", "Migrations §1").
> **ac-cobertos**: lista de ACs do `spec.md` que esta task ajuda a satisfazer (ex: "AC-MOD-001-1, AC-MOD-001-2").
>
> **Exceção scaffold:** tasks puramente de infra/scaffold/setup (criar pasta,
> instalar dependência, gerar boilerplate, configurar hook) podem ter
> `ac-cobertos: —` porque não implementam regra de negócio — não há AC
> associado. Tasks com lógica de produto (validação, cálculo, persistência,
> UI que reflete regra) DEVEM ter pelo menos 1 AC referenciado.

| ID | Descrição | plan-passo | ac-cobertos | Estimativa | Depende |
|---|---|---|---|---|---|
| T-<MOD>-001 | <task 1: setup/scaffold> | <ref ao plan> | — | P | — |
| T-<MOD>-002 | <task 2: regra de negócio> | <ref ao plan> | AC-<MOD>-NNN-N | P | T-<MOD>-001 |
| T-<MOD>-003 | <task 3: integração/UI> | <ref ao plan> | AC-<MOD>-NNN-N | M | T-<MOD>-002 |

<!-- 1-2 commits por task. Cada commit cita o T-<MOD>-NNN na mensagem. -->
<!-- Toda task com lógica de negócio DEVE ter ao menos 1 AC em ac-cobertos. -->
<!-- Toda task DEVE ter plan-passo preenchido (rastreabilidade plan → tasks). -->

## Fluxo task → PR → revisão

**Modo `equipe` (multi-pessoa):**
1. **Implementação** em branch `feat/T-<MOD>-NNN-<slug>` (ou `fix/...`, `refactor/...`).
2. **Commit atômico** com mensagem citando `T-<MOD>-NNN` (ver INV-AGENT-002 em REGRAS-INEGOCIAVEIS.md).
3. **Pull Request** aberto contra a branch alvo da fase (geralmente `main` ou `develop`).
4. **Revisão** registrada em `docs/dominios/<dom>/modulos/<modulo>/revisoes/<T-MOD-NNN>-<agente>.md` usando `templates/revisao.template.md` com `tipo-alvo: PR` e `alvo: <link-PR>`.
5. **Merge** apenas se `resultado: APROVADO` na revisão E todos os ACs cobertos estão passando em CI.

**Modo `solo` (1 dev / `owner: agente-ia`):**
1. **Implementação** direta em `main` quando pre-commit verde (alinhado com CLAUDE.md global do Roldão: "Trabalhar direto na branch ativa") — ou em branch curta se a task tocar área de risco.
2. **Commit atômico** citando `T-<MOD>-NNN`.
3. **Revisão auto-assinada** pelo agente IA em `revisoes/<T-MOD-NNN>-maestro.md` (`agente: maestro`, `vinculante: true`) — auditor-doc-quality + auditor-qualidade rodaram e passaram.
4. Push direto em main com pre-commit verde.

> Em equipe: não commitar em main sem PR + revisão. Auditor-doc-quality bloqueia marco se houver commit em main sem PR vinculado a uma `revisao.md`.
> Em solo: a revisão auto-assinada faz o papel da peer-review; o trilho de auditoria é o ledger + os hooks.

## Granularidade

- Task de **scaffold/setup** (sem lógica de negócio): pode ser P (até 2h), `ac-cobertos: —`.
- Task de **regra de negócio**: deve ter pelo menos 1 AC mapeado e estimativa realista. **Task estimada ≥ G (≥8h) deve ser quebrada** em sub-tasks de P/M, salvo justificativa em coluna extra "justifica-G".
- Granularidade-alvo: 70% das tasks devem ser P. M é exceção justificada. G é rara e exige decomposição.

---
> Termos técnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
