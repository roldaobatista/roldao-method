---
owner: <responsavel>
severidade-incidente: <SEV1|SEV2|SEV3>
incident-commander: <quem-liderou-a-resposta>
mttr: <minutos-ate-mitigacao>
servicos-afetados: [<servico-1>, <servico-2>]
revisado-em: <YYYY-MM-DD>
idioma: pt-BR
status: draft
limite-linhas: 160
proposito: registro de incidente com linha do tempo, causa raiz, impacto e acoes preventivas
---

> **Termos usados neste documento (1ª aparição):**
> - **SEV1** = cliente afetado (perda de receita, dado ou disponibilidade externa).
> - **SEV2** = funcionalidade degradada (sistema parcial, há workaround).
> - **SEV3** = interno (afeta time/processo, sem impacto direto ao cliente).
> - **MTTR** (*mean time to recovery*) = tempo, em minutos, entre detecção do incidente e mitigação confirmada.
> - **incident-commander** = pessoa que coordenou a resposta ao vivo (não necessariamente quem corrigiu — quem decidiu).
> - **evidencia-conclusao** = link/arquivo/teste/commit que prova que a ação corretiva foi de fato executada (não basta marcar "feito").
> - **inv-criada** = invariante inegociável (`INV-<ESC>-NNN` em `REGRAS-INEGOCIAVEIS.md`) gerada como prevenção sistêmica para esta classe de incidente. `—` quando o incidente não justificou nova INV.
> Ver §rodapé e `GLOSSARIO-ROLDAO.md` para detalhes adicionais.

<!--
template: post-mortem.md
destino: docs/operacao/incidentes/<YYYY-MM-DD-slug>.md
uso: análise pós-incidente sem culpa pessoal, focada em causa raiz e prevenção.
limite: ≤300 linhas.

Definições de severidade:
- SEV1: cliente afetado (perda de receita, dado, ou disponibilidade externa).
- SEV2: funcionalidade degradada (sistema operando parcial, workaround disponível).
- SEV3: interno (afeta time/processo, sem impacto direto ao cliente).
-->

# Post-mortem — <YYYY-MM-DD> <slug-curto-do-incidente>

## 1. Resumo executivo
<Um parágrafo. O que aconteceu, quem foi afetado, por quanto tempo, como foi mitigado. Linguagem direta, sem jargão. Este é o trecho lido por quem não vai descer ao detalhe.>

## 2. Linha do tempo
Todos os horários em <fuso, ex: America/Sao_Paulo>.

| Hora | Evento |
|---|---|
| HH:MM | <gatilho original / primeira evidência> |
| HH:MM | <alerta disparado> |
| HH:MM | <início da resposta> |
| HH:MM | <hipótese descartada / nova hipótese> |
| HH:MM | <mitigação aplicada> |
| HH:MM | <serviço normalizado> |
| HH:MM | <comunicação final ao cliente> |

## 3. Impacto
- **Clientes afetados:** <quantos, quais segmentos>.
- **Dados:** <houve perda/corrupção/exposição? quais entidades, qual volume>.
- **Receita:** <estimativa de receita perdida ou crédito aplicado>.
- **Reputação/legal:** <comunicações públicas, notificações regulatórias necessárias>.

## 4. Causa raiz (5-porquês obrigatório)

> Não pular níveis. Cada "por quê" investiga o anterior. Se a cascata terminar em <5, justificar por que parou (causa-raiz já é estrutural).

1. **Por que o incidente aconteceu?** → <resposta 1>
2. **Por que <resposta 1>?** → <resposta 2>
3. **Por que <resposta 2>?** → <resposta 3>
4. **Por que <resposta 3>?** → <resposta 4>
5. **Por que <resposta 4>?** → <resposta 5>

**Causa-raiz final:** <a resposta que termina a cascata — o mecanismo estrutural, não o sintoma>.

- Causas contribuintes (não-raiz, mas relevantes): <...>
- Por que não foi detectado antes: <gap de monitoramento, teste ausente, etc.>

## 5. Ações corretivas
Cada ação com responsável nomeado, prazo concreto, evidência de conclusão e referência a INV nova se houver.

> **prioridade**: **P0** = travar tudo até resolver (risco de reincidência iminente);
> **P1** = entra no próximo ciclo, é bloqueante para a próxima release;
> **P2** = melhoria desejável, encaixar quando der.

| Ação | Tipo | prioridade | Responsável | Prazo | Status | evidencia-conclusao | inv-criada |
|---|---|---|---|---|---|---|---|
| <ação concreta 1> | correção | P0 | <nome> | <YYYY-MM-DD> | aberta | <link PR/commit/teste> | <INV-ESC-NNN ou —> |
| <ação concreta 2> | mitigação | P1 | <nome> | <YYYY-MM-DD> | aberta | <...> | <...> |
| <ação concreta 3> | prevenção | P2 | <nome> | <YYYY-MM-DD> | aberta | <...> | <...> |

## 6. Prevenção sistêmica
O que muda no sistema para que **esta classe de incidente** não se repita. Não basta consertar a instância.

- Hook adicionado: <qual hook, em que ponto, o que valida>.
- Auditor/subagente convocado: <qual, com que regra>.
- Invariante nova: `INV-<ESCOPO>-NNN` — <descrição> (registrada em `REGRAS-INEGOCIAVEIS.md`).
- Teste novo: `TST-<ESCOPO>-NNN` — <descrição>.
- Mudança de processo: <runbook atualizado, gate adicionado, etc.>.

## 7. Lições aprendidas

> **Foco em processo, não pessoa.** Se o nome de alguém aparece, transforme em pergunta sobre o sistema que permitiu. Ex.: "Fulano fez deploy errado" → "Que validação faltava no pipeline para impedir esse deploy?".

- O que funcionou: <...>
- O que não funcionou: <...>
- O que vamos fazer diferente: <...>

---

> **Link bidirecional:** se este incidente revela falha de auditor existente (regra ausente, golden case incompleto, severidade errada), abrir auditor novo OU atualizar `docs/governanca/catalogo-auditores.md` referenciando este post-mortem.
