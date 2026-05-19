---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# KB — Elicitation em PT-BR

> 10 métodos críticos para extrair requisitos, refinar specs/ADRs e auditar decisões. Use em `/prd`, `/historia`, `/auditoria`, `/checkpoint`, `/replanejar`.

---

## Como escolher

| Situação | Método recomendado |
|---|---|
| PRD parece raso, falta nuance | Stakeholder Round Table, Critique Socrática |
| ADR proposto sem suficiente justificativa | Red Team / Blue Team |
| Story ambígua, não dá pra estimar | Five Whys, Acceptance Test First |
| Risco de blindspot técnico | Pre-mortem, Tree of Thoughts |
| Decisão arquitetural sem alternativas avaliadas | Alternatives Spread |
| Spec aceita mas suspeita de scope creep silencioso | Non-Goals Drill |
| Solução proposta sem evidência de problema real | Five Whys (versão produto) |
| Decisão polarizada (50/50) | Devil's Advocate Rotation |

---

## 1. Stakeholder Round Table

**O quê:** liste 5-7 personagens-stakeholder (cliente final, dev, ops, suporte, financeiro, jurídico, CEO). Para cada, faça 2-3 perguntas que ele faria sobre a feature/decisão.
**Quando:** PRD/ADR antes de implementar.
**Por quê funciona:** força perspectivas que o autor não tem.
**Saída:** lista de perguntas + respostas → vira FAQ ou non-goals.

**Exemplo:**
- Suporte: "Como vou explicar essa feature pro cliente?"
- Financeiro: "Quanto vai custar de infra/licença extra?"
- Jurídico/DPO: "Que dado novo coletamos? Tem base legal?"
- Dev plantão: "Quando der ruim às 3h da manhã, qual log eu olho?"

---

## 2. Crítica Socrática

**O quê:** sequência de perguntas que pressionam premissas:
1. O que você quer dizer com "X"? (definição)
2. Por que acha que isso é assim? (justificativa)
3. Que exemplo apoia? (evidência)
4. E se for o contrário? (refutação)
5. Que consequência isso tem? (implicação)
6. Qual é a essência do desacordo? (meta)

**Quando:** revisor adversarial de PRD/ADR.
**Aplica:** agente `auditor-produto`, `revisor`.

---

## 3. Red Team vs Blue Team

**O quê:** divide o time:
- **Red Team:** ataca a proposta (riscos, falhas, alternativas).
- **Blue Team:** defende (justificativas, mitigações, tradeoffs).

Depois inverte papéis pra eliminar viés.
**Quando:** decisão arquitetural de risco; ADR de stack.
**Adaptação BR:** se time é pequeno, faça sequencial (cada um veste os 2 chapéus).

---

## 4. Five Whys (versão produto)

**O quê:** "por que precisamos desta feature?"
- "Cliente pediu."
- Por quê o cliente pediu?
- "Quer cancelar mais rápido."
- Por quê quer cancelar mais rápido?
- "Tá tendo erro recorrente que faz ele desistir."
- Por quê tem erro recorrente?
- "Sistema de pagamento mostra erro genérico."
- Por quê erro genérico?
- "Não diferenciamos saldo insuficiente de cartão expirado."

**Causa raiz:** falta tratamento granular no erro de pagamento.
**Insight:** a feature pedida não era a real solução.

**Quando:** request de feature sem motivação clara; "cliente pediu" sem contexto.

---

## 5. Pre-mortem (Elicit Variant)

**O quê:** "estamos em 6 meses. A feature FRACASSOU. Liste todas as razões plausíveis."
**Diferença do brainstorming:** aqui foco é em premissas/requisitos não detectados, não em risco de execução.
**Output:** lista de premissas implícitas → vira AC explícita ou non-goal.

---

## 6. Tree of Thoughts

**O quê:** explore 3 caminhos alternativos pra solução do mesmo problema. Cada um:
1. Premissas
2. Como funciona
3. Custo/complexidade
4. Risco específico
5. Quando preferir esse

Compare lado-a-lado. Não escolha antes de ter 3 árvores.
**Quando:** decisão arquitetural (escolha de tech, padrão, fluxo).
**Aplica:** agente `tech-lead`.

---

## 7. Alternatives Spread

**O quê:** força elaboração de 3-5 alternativas mesmo quando a "óbvia" parece dominante. Para cada:
- Descrição em 1 frase
- Pró
- Contra
- Quando seria a melhor escolha
- Razão pra rejeitar

**Quando:** ADR formal. **Registrar também no template `decision-log.md`.**

---

## 8. Non-Goals Drill

**O quê:** depois de listar goals da feature, lista 5-7 non-goals em formato negativo explícito ("NÃO vamos resolver problema X"; "NÃO vamos suportar caso Y").
**Quando:** PRD, story, ADR.
**Por quê funciona:** scope creep nasce do que não foi explicitamente excluído.
**Aplica:** agente `gerente-produto`, `analista`. Está no template `prd.md`.

---

## 9. Acceptance Test First

**O quê:** antes de escrever a story, escreva os 3-5 testes de aceitação. Se algum AC é vago, a story está vaga.
**Quando:** story que parece pronta mas dev "não entende o que fazer".
**Formato BR:**

```
Dado <pré-condição>
Quando <ação>
Então <resultado observável>
```

---

## 10. Devil's Advocate Rotation

**O quê:** em decisão 50/50, designe 1 pessoa pra fazer advocacia da posição que ela NÃO defende. 5 minutos. Sem inveja, sem ironia.
**Quando:** time empacado em duas opções; risco de groupthink.
**Adaptação BR:** rotacionar pra todos pegarem ambos os lados ao longo do tempo (não cair na pessoa "do contra").

---

## Quando usar em qual workflow

| Workflow | Métodos típicos |
|---|---|
| `/inicio` | Stakeholder Round Table, Non-Goals Drill |
| `/prd` | Stakeholder Round Table, Five Whys, Pre-mortem, Acceptance Test First |
| `/historia` | Acceptance Test First |
| `/feature` | Non-Goals Drill (na fase 1) |
| `/bug` | Five Whys (já obrigatório via REGRA #0) |
| `/auditoria` | Crítica Socrática, Red/Blue Team |
| `/checkpoint` | Pre-mortem, Devil's Advocate |
| `/readiness` | Acceptance Test First |
| `/replanejar` | Tree of Thoughts, Alternatives Spread |
| `/retro` | Devil's Advocate Rotation |

---

## Anti-padrões

- "Elicit" virar performance teatral (todo mundo finge que pensou) → use timeboxing.
- Pular pra implementação porque "já discutimos demais" → o custo da decisão errada é maior.
- Aceitar a primeira justificativa em Five Whys → forçar os 5.
- Red/Blue sem rotação → time se ofende.
- Acceptance Test First com AC vaga ("deve funcionar bem") → reescrever até observável.
