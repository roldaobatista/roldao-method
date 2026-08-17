---
owner: <responsavel>
tipo-alvo: <pr | doc | plan | spec | release>
alvo: <link-para-o-artefato-revisado>
agente: <nome-do-agente-ou-subagente>
resultado: <APROVADO|RESSALVAS|REPROVADO>
vinculante: <true|false>
revisado-em: <YYYY-MM-DD>
idioma: pt-BR
status: draft
limite-linhas: 180
proposito: registro de revisao de artefato por agente ou subagente
---

<!--
template: revisao.md
destino: docs/dominios/<dom>/modulos/<mod>/revisoes/<slug>-<agente>.md
uso: registro de revisão de um artefato (PR, doc, plan, spec, release) por um agente/subagente.
limite: ≤300 linhas.
-->

# Revisão — <alvo> por <agente>

> Quando `vinculante: false`, esta revisão é opinião de subagente especialista e **não** bloqueia merge por si só. O owner do artefato decide o peso. Quando `vinculante: true`, a revisão bloqueia e o resultado determina o próximo passo.

## 1. Resumo
<Uma frase. Ex: "AC-1 e AC-2 cobertos; AC-3 com risco de regressão em multi-tenant.">

## 2. Evidência verificada

> Alinhado com INV-AGENT-005 ("validar antes de afirmar"). O revisor declara aqui o que efetivamente executou/leu. Sem essa seção preenchida, a revisão não é vinculante.

**Mínimo objetivo para revisão vinculante de PR:**
- Saída de `npm test` (ou equivalente) com nº de testes / nº de falhas.
- Saída de lint (ok ou warnings com contagem).
- Lista de arquivos lidos.
Acima disso é opcional — evidência adicional só se houver dúvida específica. Não acumular logs infinitamente.

- **Testes executados:** <`npm test ...`, `pytest ...`, etc. com saída resumida>
- **Comandos rodados:** <lint, build, type-check, smoke, etc.>
- **Arquivos lidos integralmente:** <lista>
- **Trechos auditados manualmente:** <arquivo:linha → o que conferi>
- **Não verificado (declarado):** <o que ficou de fora e por quê>

## 3. AC-by-AC (quando aplicável)

Mapeamento de cada critério de aceite do alvo contra o que foi entregue.

| AC | Descrição | Status | Evidência |
|---|---|---|---|
| AC-1 | <texto do AC> | atendido / parcial / falha / sem-AC | <link / arquivo:linha / teste> |
| AC-2 | <...> | <...> | <...> |
| AC-3 | <...> | <...> | <...> |

> Se o alvo não tem ACs formais (ex: doc, release), usar status `sem-AC` em todas as linhas ou omitir a tabela.

## 4. Achados

> Schema compartilhado com `auditor.template.md`: cada achado tem `id`, `severidade` (CRÍTICO/ALTO/MÉDIO/BAIXO), `descrição`, `evidência` (arquivo:linha ou INV-<...>), `acao_sugerida`, e opcionalmente `causa_raiz_sugerida`.

| id | severidade | descrição | evidência | ação-sugerida |
|---|---|---|---|---|
| <REV-001> | CRÍTICO | <descrição binária> | <arquivo:linha ou INV-NNN> | <ação concreta> |
| <REV-002> | ALTO | <descrição> | <arquivo:linha> | <ação> |
| <REV-003> | MÉDIO | <descrição> | <arquivo:linha> | <ação> |
| <REV-004> | BAIXO | <descrição / observação> | <arquivo:linha> | <ação> |

> Se não houver achados, deixar a tabela apenas com o cabeçalho e escrever abaixo "Nenhum achado.".
> Ordenar por severidade decrescente (CRÍTICO → BAIXO).

### Regra de pass/fail (igual auditor)

- Qualquer achado **CRÍTICO** → `resultado: REPROVADO`.
- Achados **ALTO** → `resultado: RESSALVAS` (bloqueia merge, não bloqueia commit).
- Apenas **MÉDIO/BAIXO** → `resultado: APROVADO` com observações.

## 5. Recomendações
Ações concretas sugeridas, em ordem de prioridade. Cada recomendação deve ser executável — não vaga.

1. <recomendação 1: o que mudar, onde, por quê>
2. <recomendação 2>
3. <recomendação 3>

## 6. Pontos disputados
Quando há discordância entre este agente e outro revisor, ou entre este agente e o owner. Registrar a divergência aqui em vez de resolver silenciosamente.

| Ponto | Posição deste agente | Posição contrária | Quem decide |
|---|---|---|---|
| <tema 1> | <argumento> | <argumento> | <owner / ADR> |

> Se não houver pontos disputados, escrever "Nenhum.".

---

> **Link bidirecional:** se esta revisão `REPROVADO` foi ignorada e o problema causou incidente real em produção/uso, abrir `post-mortem.template.md` referenciando esta revisão no campo `causas contribuintes`.
