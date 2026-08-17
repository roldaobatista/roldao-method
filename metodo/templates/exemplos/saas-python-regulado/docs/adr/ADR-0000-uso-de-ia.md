---
id: ADR-0000
titulo: Adotar Claude Code como harness primario de IA no desenvolvimento
status: aceita
data-proposta: 2026-02-05
data-aceite: 2026-02-10
depende-de: []
bloqueia-fase:
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0000: Adotar Claude Code como harness primario de IA no desenvolvimento

## Contexto

O conciliab esta sendo construido por um time pequeno (3 devs + 1 product +
1 designer part-time), liderado por um dono nao-programador (Roldao). O dono
participa de toda decisao de produto mas nao le codigo nem stack trace.

Precisamos de um harness de IA que:
1. Permita que o dono opere o agente em linguagem natural PT-BR.
2. Tenha governanca forte (subagentes auditores, contratos por arquivo).
3. Suporte invariantes operacionalizaveis (hooks pre-commit, validacao de
   acoes destrutivas, override-ledger).
4. Tenha um modelo capaz para tarefas longas (auditoria, refactor coordenado
   em multiplos arquivos).

Decisao acontece **antes** do primeiro PR de codigo de produto (ADR-0000 e
pre-requisito do CHECKLIST-PRONTO-PRA-CODAR).

## Opcoes consideradas

### Opcao 1: Claude Code como harness primario

- **Pros:** suporte nativo a `CLAUDE.md` e `.claude/agents/`; subagentes com
  contexto isolado; hierarquia de contratos AI (constitution → INV → AGENTS →
  CLAUDE) ja documentada na metodologia interna; integra com `gh` para PR/issue.
- **Contras:** lock-in moderado no Anthropic; precisa de assinatura paga;
  precisa traduzir contratos para outros harnesses se time crescer com Cursor.
- **Custo:** USD 20/mes por usuario × 3 devs = USD 60/mes. Setup inicial 1
  semana.

### Opcao 2: Cursor + .cursorrules

- **Pros:** popular no segmento; integracao com VS Code; bom inline complete.
- **Contras:** modelo de subagente menos maduro em 2026-Q1; harness orientado
  a IDE, fraco para sessao longa fora do editor; menos suporte a hooks de
  governanca; dono nao programador interage mal com IDE.
- **Custo:** USD 20/mes × 3 = USD 60/mes. Mas exige IDE; o dono nao usa IDE.

### Opcao 3: ChatGPT + plugins / sem harness dedicado

- **Pros:** zero setup, time ja conhece.
- **Contras:** sem subagentes; sem hooks pre-commit; sem governanca; sem
  contexto persistente por repo. Inviavel para o modelo de
  invariantes-aplicadas-por-auditor que o conciliab requer.
- **Custo:** USD 20/mes × 3.

## Decisao

Escolhemos a **Opcao 1: Claude Code como harness primario**.

O fator decisivo foi o suporte nativo a subagentes com contexto isolado e a
capacidade do dono nao-programador operar via chat em PT-BR. O lock-in e
mitigado pelo fato de que os contratos (constitution, REGRAS, AGENTS) sao
arquivos markdown portateis — se trocarmos de harness no futuro, os documentos
sobrevivem.

## Consequencias

### Positivas
- Dono opera o agente diariamente sem precisar abrir IDE.
- Subagentes especializados (`auditor-lgpd`, `auditor-fiscal-audit`) executam
  com contexto isolado, evitando "contaminacao" entre tarefas.
- Hierarquia de contratos AI formal: constitution > INV > AGENTS > CLAUDE.

### Negativas
- Custo recorrente em USD (sensivel a cambio).
- Risco de dependencia caso Anthropic mude precificacao ou termos.
- Codigo do projeto e dado pessoal/sigiloso — confiamos no contrato com a
  Anthropic (zero-retention configurado, ver SECURITY.md).

### Reversibilidade
**Alta** para os contratos (sao .md); **media** para automacao (`.claude/agents/`,
hooks) — uma migracao para outro harness exige reescrever a camada de
automacao mas preserva 80% do conteudo.

## Non-goals

Esta ADR NAO decide:
- Uso de IA dentro do produto (geracao automatica de regra de match, por
  exemplo) — assunto de ADR futura.
- Politica de uso de IA em dados de cliente — fica em
  `docs/governanca/politica-ia-dados.md` (com base em INV-001).

## Como validar (gates)

- [x] Cada dev tem assinatura Claude Code ativa (3/3 em 2026-02-12).
- [x] `.claude/agents/` tem ≥ 5 auditores ativos (8 em 2026-05-27).
- [x] Survey trimestral mede satisfacao do time com o harness (proxima:
      2026-07-15).
- [x] Roldao consegue rodar uma sessao completa sozinho (validado em
      2026-03-05 com tarefa "auditar ROPA").

## Referencias

- [`../../REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — INV-AGENT-001..011.
- [`../../AGENTS.md`](../../AGENTS.md) — modelo de agentes.
- https://docs.anthropic.com/en/docs/claude-code
