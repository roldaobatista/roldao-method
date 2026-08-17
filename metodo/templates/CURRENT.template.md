---
owner: <responsavel>
revisado-em: <YYYY-MM-DD>
status: draft
tipo: painel-vivo
origem: kickoff-fase.md
proximo: —
referencia: [problema.md, spec.md, plan.md, tasks.md, CHECKLIST-PRONTO-PRA-CODAR.md, kickoff-fase.md]
idioma: pt-BR
limite-linhas: 120
proposito: painel vivo do estado atual do trabalho para agente IA
---

<!--
template: CURRENT.md
destino: .agent/CURRENT.md
uso: painel vivo do estado do trabalho atual. Atualizar a cada sessão.
Se passar do limite de linhas, é sinal de que algo virou doc permanente — mover para docs/.

Este é nó terminal/vivo da cadeia — `proximo: —` significa que CURRENT é
atualizado continuamente, não consumido pelo próximo doc. A cadeia formal
de documentos (problema → spec → plan → tasks → CHECKLIST → kickoff-fase)
termina em `kickoff-fase.md`; CURRENT é o painel vivo que reflete o estado
da execução dessa cadeia.
-->

# Painel Atual — <nome-do-projeto>

## 1. Fase atual
- **Fase**: <ID-da-fase> — <nome da fase>
- **Kickoff**: <link para `docs/faseamento/<fase>/kickoff.md`>
- **Status**: <em andamento | bloqueada | em revisão>

## 2. Problema-âncora
- **Problema**: <link para `descoberta/problema.md` ou módulo correspondente>
- **Resumo em 1 linha**: <a dor central que justifica o trabalho atual>

## 3. Última entrega concluída

> US e T têm granularidades diferentes — uma US agrupa várias T. Registrar as duas separadamente.

### 3.1 Última US concluída
- **ID**: <US-MOD-NNN>
- **Link**: <caminho para o spec.md correspondente>
- **Quando**: <YYYY-MM-DD>
- **Resumo**: <1 linha do que foi entregue ao usuário>

### 3.2 Última T concluída
- **ID**: <T-MOD-NNN>
- **Link**: <caminho para o tasks.md correspondente>
- **Quando**: <YYYY-MM-DD>
- **Resumo**: <1 linha do passo técnico fechado>

## 4. Próximo T-NNN
- **ID**: <T-MOD-NNN>
- **Link**: <caminho para `tasks.md` âncora>
- **Descrição**: <1 linha — ação executável concreta>
- **ACs cobertos**: <lista de AC-MOD-NNN-N>

## 5. Bloqueadores conhecidos
- <bloqueador 1: o que falta, quem pode destravar, prazo esperado>
- <bloqueador 2>

> Se não há bloqueadores, escrever explicitamente "Nenhum bloqueador conhecido."

## 6. Contexto recente (≤5 bullets)
- <bullet 1: o que mudou recentemente que afeta o foco atual>
- <bullet 2: decisão tomada, ADR aceita, gate liberado>
- <bullet 3: descoberta de entrevista, mudança de prioridade>

## 7. Última atualização
- Data: <YYYY-MM-DD>
- Por: <nome|agente>
- Sessão anterior terminou em: <descrição curta do ponto de parada>

## 8. Quando atualizar (obrigação do maestro — fluxo manual, não automatizado)

> **Importante.** Este arquivo NÃO é atualizado por hook automático. Quem atualiza é o **próprio maestro** ao concluir cada gatilho abaixo. Faz parte do turno: editar CURRENT é tão obrigatório quanto comitar o código. Sem hook = sem rede de proteção; depende de disciplina do maestro.

Gatilhos (o maestro edita CURRENT no MESMO turno em que o evento acontece):

| Gatilho | O que atualizar |
|---|---|
| Início de sessão | confirmar §1 (Fase atual) + §4 (Próximo T) batem com a realidade do repo |
| Fim de cada `T-<MOD>-NNN` | atualizar §3.2 (última T) e §4 (próximo T) |
| Fim de cada US | atualizar §3.1 (última US) |
| Novo bloqueador detectado | adicionar em §5 |
| ADR aceita / gate liberado / decisão técnica relevante | adicionar bullet em §6 |
| Fim de cada turno do agente | atualizar §7 com ponto de parada |

Maestro atualiza CURRENT sem pedir confirmação — é registro de estado, não decisão. Não escalar para o dono.

> Se um projeto quiser automatizar essa atualização, implementar um hook próprio em `.claude/hooks/post-tool-current-updater.sh` reagindo a `Stop`/`SubagentStop` ou a commits via `pre-commit`. Não vem pronto no template porque o gatilho depende do estilo do projeto.

## 9. Ver também

Documentos da cadeia formal que CURRENT reflete (mesmo com placeholders, o link já dá pista visual de onde estão):

- Problema-âncora: [`descoberta/problema.md`](../descoberta/problema.md) (ou módulo correspondente)
- Spec do módulo ativo: [`docs/dominios/<dom>/modulos/<mod>/spec.md`](../docs/dominios/)
- Plan do módulo ativo: [`docs/dominios/<dom>/modulos/<mod>/plan.md`](../docs/dominios/)
- Tasks do módulo ativo: [`docs/dominios/<dom>/modulos/<mod>/tasks.md`](../docs/dominios/)
- Checklist do projeto: [`CHECKLIST-PRONTO-PRA-CODAR.md`](../CHECKLIST-PRONTO-PRA-CODAR.md)
- Kickoff da fase atual: [`docs/faseamento/<fase>/kickoff.md`](../docs/faseamento/)

---
> Termos técnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
