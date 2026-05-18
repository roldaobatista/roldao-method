---
tipo: checklist
id: CHK-PM-READINESS
versao: 1
status: stable
owner: gerente-produto
revisado-em: 2026-05-18
---

# Checklist — PM Readiness (PRD pronto pra dev)

> Aplica antes de passar PRD/story pro `tech-lead` e `dev-senior`. Quem roda: `gerente-produto` (auto-revisão) ou `auditor-produto` (no `/auditoria`).
>
> **Filosofia:** PRD mal escrito vira retrabalho. Tempo gasto em escrever bem o PRD é tempo economizado em discussão depois.

## 1. Problema

- [ ] Problema descrito em 1-3 parágrafos, com evidência concreta (número, citação, ticket, métrica).
- [ ] Quem sofre está identificado (persona).
- [ ] Com que frequência sofre está estimado.
- [ ] Custo do problema (em tempo, dinheiro, satisfação) está explícito.

## 2. Personas

- [ ] Pelo menos 1 persona descrita com nome, papel, contexto.
- [ ] O que a persona quer está em palavras dela, não jargão de produto.
- [ ] Onde ela sofre hoje (workaround atual) está claro.

## 3. Hipótese de solução

- [ ] Solução descrita em alto nível (1 parágrafo).
- [ ] Não desce em design ou implementação — isso é trabalho do tech-lead.
- [ ] Hipótese é **falseável** (dá pra testar se deu certo).

## 4. User stories rastreáveis (INV-004)

- [ ] Cada US tem ID (`US-NNN`).
- [ ] Cada US tem formato "Como X, quero Y, para Z".
- [ ] Cada US tem **pelo menos 2 critérios de aceitação testáveis** (`AC-NNN-N`).
- [ ] Critério de aceitação é objetivo: "dado X, quando Y, então Z" — não "deve funcionar bem".
- [ ] US estão na ordem que serão construídas (sequência faz sentido).

## 5. Non-goals (INV-003)

- [ ] Lista de "o que NÃO está no escopo" tem pelo menos 3 itens.
- [ ] Non-goals previnem feature creep ("ah, já que estamos mexendo...").
- [ ] Non-goals decididos com base em dado ou hipótese, não preguiça.

## 6. Métricas de sucesso

- [ ] Pelo menos 1 métrica quantitativa de sucesso (taxa de erro, conversão, NPS, tempo de tarefa).
- [ ] Valor atual da métrica (baseline) está medido.
- [ ] Meta é realista (não "100%", não "qualquer melhora").
- [ ] Como medir está descrito (query, dashboard, ferramenta).
- [ ] Prazo de avaliação está marcado (ex: 60 dias pós-lançamento).

## 7. Riscos e mitigação

- [ ] Pelo menos 3 riscos identificados (técnico, de produto, regulatório, dependência).
- [ ] Cada risco tem probabilidade e impacto.
- [ ] Cada risco tem mitigação ou aceite explícito.

## 8. Regulamentação BR

- [ ] LGPD avaliada (se toca dado pessoal): IDs `LGPD-NNN` citados.
- [ ] Fiscal avaliado (se toca NF-e/tributo): IDs `FISCAL-NNN` citados.
- [ ] Outras regulamentações setoriais avaliadas (CVM, Bacen, ANS, CFM, ANPD, etc).
- [ ] Se "N/A": escrito explicitamente, não omitido.

## 9. Decomposição

- [ ] PRD foi decomposto em stories (não fica como 1 documento gigante "implementem").
- [ ] Cada story é entregável em **1 sprint** (1-2 semanas).
- [ ] Dependências entre stories estão mapeadas (qual bloqueia qual).
- [ ] Existe pelo menos 1 "fatia vertical" entregável já no primeiro sprint (proof of concept de ponta a ponta).

## 10. Critério de não-fazer

- [ ] Se a hipótese for invalidada (métrica não bater), está escrito o que para/pivota.
- [ ] Não é "vamos seguir mesmo assim porque já investimos".
- [ ] Decisão de continuar/parar tem dono e prazo.

## 11. Comunicação

- [ ] Stakeholders relevantes sabem que o PRD existe.
- [ ] Há canal pra dúvidas (não "me chama no privado").
- [ ] Decisões fora do PRD vão pra ADR ou voltam pro PRD (não viram tribal knowledge).

## 12. Validação com usuário

- [ ] PRD foi mostrado a pelo menos 1 representante da persona-alvo.
- [ ] Feedback foi incorporado ou justificadamente recusado.
- [ ] Se PRD é grande (>1 mês de dev), há plano de validação contínua (review quinzenal).

---

**Sinal de bloqueio:** itens 1, 4, 5, 6, 8 marcados parcial = PRD **não pode ir pra dev**. Volta pro `gerente-produto`.

**Itens 2, 3, 7, 9, 10, 11, 12** geram aviso — PRD vai, mas com risco anotado.

---

## Anti-padrões PM (sinais de PRD mal feito)

Marcar se algum aparece — cada um é **bloqueador**:

- [ ] PRD diz "implementar X tecnologia" em vez de "resolver problema Y".
- [ ] Critério de aceitação é "deve funcionar" ou "deve estar bom".
- [ ] Não há métrica quantitativa de sucesso ("vamos ver na prática").
- [ ] Non-goals está vazio ou tem só 1 item genérico.
- [ ] PRD tem mais de 10 páginas — provável que falta foco, não que tem detalhe.
- [ ] Decisão arquitetural feita no PRD (deveria estar em ADR).
- [ ] Spec depende de tribal knowledge ("o pessoal sabe").
