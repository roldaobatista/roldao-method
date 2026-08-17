---
name: auditor-<dominio>
version: 1.0.0
severidade-padrao: <CRÍTICO|ALTO|MÉDIO|BAIXO>
escopo: [code, docs, migrations]
tipo-projeto: [SaaS, CLI, biblioteca]
dominio: [IA-ML, web, mobile, dados, infra]
bloqueia: [pre-commit, pre-merge, pre-fase]
tooling: <subagente|script|ambos>
model: <modelo> <!-- default: sonnet-4.x se o projeto não definir; haiku para auditores baratos de grep simples. Trocar `<modelo>` pelo ID atual do modelo escolhido (ex: `claude-sonnet-4-5-20251022`). -->
golden: docs/governanca/golden/auditor-<dominio>/
owner: <quem>
revisado-em: <YYYY-MM-DD>
idioma: pt-BR
status: draft
limite-linhas: 220
proposito: subagente auditor especializado em <dominio>, com severidade, escopo, bloqueio e golden cases
---

<!--
template: .claude/agents/auditor-<dominio>.md
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C7
-->

# Auditor `auditor-<dominio>`

## Papel
<1 parágrafo: o que esse auditor procura E o que NÃO procura (non-goals).
Ex.: "Verifica se toda PII em endpoint público tem sanitização. NÃO verifica
PII em logs — isso é do auditor-pii-em-logs.">

## Regras verificadas

> Severidade ATRELADA ao ID (não muda por instância).

- **<DOM>-001** (CRÍTICO): <descrição binária> — detectar via <grep/AST/diff>.
- **<DOM>-002** (ALTO): <descrição binária> — detectar via <...>.
- **<DOM>-003** (MÉDIO): <descrição binária> — detectar via <...>.
- **<DOM>-004** (BAIXO): <descrição binária> — detectar via <...>.

### Regra de pass/fail

- Qualquer achado **CRÍTICO** → `passou: false` (bloqueia commit e merge).
- Achados **ALTO** bloqueiam merge, mas **não** bloqueiam commit (`passou: true` com aviso).
- Achados **MÉDIO** e **BAIXO** são informativos — não bloqueiam nada, apenas reportam.

## Entrada esperada
<diff | árvore | arquivos específicos | resultado de outro auditor>

## Schema de achado (compartilhado com revisao.template.md)

Todo achado — produzido por auditor OU por revisor — segue o mesmo schema:
`id`, `severidade` (CRÍTICO/ALTO/MÉDIO/BAIXO), `descrição`, `evidência`,
`acao_sugerida`, `causa_raiz_sugerida` (opcional, quando o auditor sabe apontar
o gerador do problema, não só o sintoma).
O escopo é o que muda (auditor varre código/docs; revisor varre PR/doc/plan/spec/release).

## Formato de saída (JSON obrigatório)
```json
{
  "findings": [
    {
      "id": "<DOM>-001",
      "severidade": "CRÍTICO",
      "arquivo": "caminho/relativo.ts",
      "linha": 42,
      "evidencia": "trecho exato",
      "acao_sugerida": "como consertar",
      "causa_raiz_sugerida": "onde fica o gerador"
    }
  ],
  "passou": true
}
```

## Golden cases (SEÇÃO OBRIGATÓRIA)

> Nenhum auditor entra no fluxo `status: stable` sem golden cases completos. O auditor-meta bloqueia commit que promova auditor para `stable` sem 1 POSITIVO + 1 NEGATIVO por regra.
>
> **Modo bootstrap (`status: bootstrap` no frontmatter):** auditor novo pode entrar com **1 golden case POSITIVO mínimo** + dívida registrada em `docs/governanca/registro-de-riscos.md` com TTL de 30 dias. Auditor-meta só emite CRÍTICO depois do TTL vencido. Permite começar a usar cobertura ainda incompleta sem travar 10 auditores no bootstrap inicial do projeto.

### Casos POSITIVOS (devem PASSAR — `passou=true`)

Cada caso descreve um input que NÃO deve gerar finding.

- **positivo-001** — `golden/positivo-001.md`
  - **Input:** <trecho de código / diff / arquivo que segue a regra corretamente>
  - **Output esperado:** `{ "findings": [], "passou": true }`
  - **Por que passa:** <explicação curta da conformidade>

- **positivo-002** — `golden/positivo-002.md`
  - **Input:** <outro trecho conforme — variação relevante (edge case válido)>
  - **Output esperado:** `{ "findings": [], "passou": true }`
  - **Por que passa:** <...>

### Casos NEGATIVOS (devem FALHAR — `passou=false`)

Cada caso descreve um input que DEVE gerar finding com o ID e severidade corretos.

- **negativo-001** — `golden/negativo-001.md` (regra <DOM>-001)
  - **Input:** <trecho violando <DOM>-001>
  - **Achado esperado:** id=`<DOM>-001`, severidade=`CRÍTICO`, evidência contém `<trecho exato>`.
  - **Output esperado:** `passou=false` com 1 finding de `<DOM>-001`.

- **negativo-002** — `golden/negativo-002.md` (regra <DOM>-002)
  - **Input:** <trecho violando <DOM>-002>
  - **Achado esperado:** id=`<DOM>-002`, severidade=`ALTO`, evidência contém `<trecho exato>`.
  - **Output esperado:** `passou=false` com 1 finding de `<DOM>-002`.

- **negativo-003** — `golden/negativo-003.md` (regra <DOM>-003)
  - **Input:** <trecho violando <DOM>-003>
  - **Achado esperado:** id=`<DOM>-003`, severidade=`MÉDIO`.
  - **Output esperado:** `passou=false` com 1 finding de `<DOM>-003`.

> **Nota sobre evolução de regras:** bump no campo `version` do frontmatter exige rodar os evals da versão anterior (todos os golden cases) e anexar resultado no PR. O auditor-meta BLOQUEIA commit que altera regras/prompt sem golden cases atualizados ou sem evidência do eval da versão anterior.

<!-- Bumpar `version` no frontmatter quando mudar regras OU prompt.
     Auditor-meta cobra reprocessamento da versão anterior. -->

## Tie-break com outros auditores
<quando outro auditor pode reclamar do mesmo achado e quem ganha>

---

## Links bidirecionais

- Se este auditor identifica padrão que **poderia ter sido evitado por uma nova INV** (invariante inegociável), propor a INV correspondente em [`REGRAS-INEGOCIAVEIS.md`](../REGRAS-INEGOCIAVEIS.md) e referenciar este auditor no campo de mecanismo de verificação.
- Se um **golden case** (positivo ou negativo) nasceu de um incidente real, linkar o `post-mortem.md` correspondente no cabeçalho do arquivo do golden — assim a memória da regra preserva sua origem operacional.

## Exemplos materializados

Para ver auditores já preenchidos como referência:

- [`templates/exemplos/saas-python-regulado/.claude/agents/auditor-lgpd.md`](./exemplos/saas-python-regulado/.claude/agents/auditor-lgpd.md) — auditor LGPD em SaaS regulado.
- [`templates/exemplos/saas-python-regulado/.claude/agents/auditor-tenant.md`](./exemplos/saas-python-regulado/.claude/agents/auditor-tenant.md) — auditor multi-tenant (RLS, INV-TENANT-*).

Use-os para entender como ficam preenchidos: regras concretas com IDs, golden cases reais, tie-break com outros auditores.
