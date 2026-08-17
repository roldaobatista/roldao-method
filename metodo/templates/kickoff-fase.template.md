---
owner: <responsavel>
revisado-em: <YYYY-MM-DD>
status: draft
origem: CHECKLIST-PRONTO-PRA-CODAR.md
proximo: CURRENT.md (painel vivo)
idioma: pt-BR
limite-linhas: 120
proposito: documento de abertura de uma fase do roteiro, com escopo, critérios de pronto e validações
---

<!--
template: kickoff-fase.md
destino: docs/faseamento/<fase>/kickoff.md
uso: documento de abertura de uma fase do roteiro.
limite: ≤300 linhas.

DIFERENÇA IMPORTANTE:
- `CHECKLIST-PRONTO-PRA-CODAR.md` = gate para começar o PROJETO (uma vez, antes do primeiro commit).
- `kickoff-fase.md` (este) = gate para começar UMA FASE específica DENTRO do projeto
  (repetido a cada nova fase: <F-1>, <F-2>, <F-3>, ...).
-->

# Kickoff — Fase <ID-da-fase>: <nome-da-fase>

## 1. Objetivo da fase
<Um a dois parágrafos. Qual o resultado de negócio/produto que esta fase entrega. Linguagem de produto, não de tarefa.>

## 2. Pré-condições
A fase só inicia oficialmente quando TODOS os itens abaixo estiverem marcados.

- [ ] PRDs das US (Histórias do Usuário) incluídas em status `stable`.
- [ ] ADRs bloqueantes aceitas (listar abaixo).
- [ ] Auditoria pré-fase concluída sem itens críticos abertos.
- [ ] Subagentes/auditores requeridos convocados e cientes do escopo.
- [ ] `docs/documentos-do-projeto.md` atualizado para refletir os documentos bloqueantes desta fase.
- [ ] Gates da fase anterior fechados (quando aplicável).
- [ ] Serviços críticos que esta fase toca declarados na tabela abaixo (em branco = nenhum). Isso amarra a revisão operacional do fechamento (§7).

### Serviços críticos tocados por esta fase
| Serviço crítico | Tipo de mexida | Dono de operação |
|---|---|---|
| <ex: emissão de PDF; cobrança> | <novo / alterado / nenhum> | <slug> |

### ADRs bloqueantes desta fase
| ID | Tema | Status exigido |
|---|---|---|
| ADR-<NNNN> | <tema> | aceita |

## 3. US (Histórias do Usuário) incluídas
| ID | Título | Domínio/Módulo | Owner | Estimativa |
|---|---|---|---|---|
| US-<MOD>-NNN | <título> | <dom>/<mod> | <nome> | <P/M/G> |
| US-<MOD>-NNN | <título> | <dom>/<mod> | <nome> | <P/M/G> |

> Escala de estimativa: **P** = até 2h, **M** = meio dia (~4h), **G** = dia ou mais (≥8h).

## 4. Cronograma alto nível
| Marco | Data alvo | Critério de conclusão |
|---|---|---|
| Início | <YYYY-MM-DD> | todos os itens de §2 marcados |
| Meio | <YYYY-MM-DD> | <metade das US em revisão> |
| Encerramento | <YYYY-MM-DD> | §6 satisfeito |

## 5. Riscos identificados
| ID | Risco | Probabilidade | Impacto | Mitigação | Owner |
|---|---|---|---|---|---|
| R-<NNN> | <descrição> | baixa/média/alta | baixo/médio/alto | <ação> | <nome> |

## 6. Critério binário de "fase iniciada"
A fase está formalmente iniciada quando:
- Todos os itens de §2 estão marcados.
- Pelo menos uma US de §3 entrou em execução com tarefa `T-<MOD>-NNN` aberta.
- `.agent/CURRENT.md` referencia esta fase no foco atual.

Enquanto qualquer um destes pontos não estiver satisfeito, a fase permanece em pré-kickoff.

## 7. PASS ZERO — critério de fechamento da fase

A fase só fecha (marco encerrado) quando **PASS ZERO** é atingido. PASS ZERO é o critério inegociável definido em `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md` §1.5: **zero achados de severidade CRÍTICO, ALTO ou MÉDIO em aberto** ao fechar o marco.

### Checklist binário de PASS ZERO

- [ ] Zero achados CRÍTICO abertos em `docs/governanca/auditoria-saida.md` referentes a esta fase.
- [ ] Zero achados ALTO abertos referentes a esta fase.
- [ ] Zero achados MÉDIO abertos referentes a esta fase.
- [ ] Achados BAIXO podem ficar abertos com TTL definido (registrar em `docs/governanca/registro-de-riscos.md` se TTL > 30 dias).
- [ ] Todos os ACs de §3 marcados como passando em CI (testes 1:1 com ACs do `spec.md`).
- [ ] Todas as tasks de §3 mergidas via PR + `revisao.md` com `resultado: APROVADO`.
- [ ] Para cada serviço crítico declarado em §2: indicadores de serviço (SLO) e roteiros de emergência (runbooks) revisados e aprovados pelo dono de operação.
- [ ] Post-mortem aberto para qualquer incidente ocorrido durante a fase (se aplicável).

> **Default do maestro (anti-override prematuro):** corrigir TODOS os achados CRÍTICO/ALTO/MÉDIO automaticamente em loop (auditor → fix causa-raiz → re-audit) até PASS ZERO. **Override só é cogitado após 3 tentativas falhas documentadas** no mesmo eixo. Não pedir override ao humano sem ter tentado consertar.
>
> **Override de PASS ZERO** (após 3 tentativas falhas) — fluxo operacional do maestro:
> 1. Maestro registra entrada em `docs/governanca/overrides-pass-zero.md` com: timestamp UTC, achados pendentes, 3 tentativas que falharam (link p/ diffs), justificativa proposta, TTL de reversão sugerido (default 14 dias).
> 2. Em modo `equipe`: aguarda assinatura humana no PR que fecha o marco. Sem assinatura, marco não fecha. Sem timeout automático — o gate é humano.
> 3. Em modo `solo` (sem time): maestro NÃO se auto-aprova override. Em vez disso, abre `T-OVERRIDE-<ID>` em `tasks.md` com prioridade ALTA e CONTINUA com o próximo bloco de trabalho que não depende desse achado. Marco fica em estado `aguardando-override` (não `fechado`). Roldão fecha quando puder.
> 4. TTL obrigatório. Override sem TTL = bug de governança — o próprio auditor-meta bloqueia entrada sem `ttl-reversao` no frontmatter.

### Marco fechado — efeitos
Quando PASS ZERO é atingido e o marco é fechado:
1. Tag git `marco-<fase>-fechado-<YYYY-MM-DD>`.
2. Update em `.agent/CURRENT.md` apontando para próxima fase.
3. Kickoff da próxima fase pode iniciar.

---
> Termos técnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
