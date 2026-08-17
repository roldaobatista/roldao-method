---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 07/17
proximo: docs/descoberta/nao-fazer.md
idioma: pt-BR
limite-linhas: 200
proposito: análise de concorrentes diretos, indiretos e do "não-uso".
---

<!--
template: concorrentes.md
destino: docs/descoberta/concorrentes.md
uso: tabela comparativa + análise de mystery shopping (quando viável).
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3
limite: ≤200 linhas.
-->

# Concorrentes — <NomeDoProjeto>

## 1. Concorrentes diretos

> Resolvem o mesmo problema com solução parecida.

| Concorrente | Pontos fortes | Pontos fracos | Preço (R$/mês) | Mystery shopping |
|---|---|---|---|---|
| <Nome 1> | <2-3 bullets> | <2-3 bullets> | <faixa> | sim/não |
| <Nome 2> | <...> | <...> | <faixa> | sim/não |
| <Nome 3> | <...> | <...> | <faixa> | sim/não |

## 2. Concorrentes indiretos

> Resolvem o mesmo problema com solução DIFERENTE (planilha, processo manual, serviço terceirizado).

| Alternativa | Como o usuário resolve hoje | Por que pode bastar pra ele | Por que o produto vence |
|---|---|---|---|
| Excel/Google Sheets | <descrição> | <baixo custo, conhecido> | <quando falha — automação> |
| <Serviço terceirizado> | <descrição> | <não exige aprendizado> | <quando falha — custo/escala> |
| Não fazer nada | <descrição> | <inércia, "tá funcionando">| <gatilho que rompe inércia> |

## 3. Mystery shopping (quando viável)

> Para cada concorrente direto, registrar: trial feito, fluxo testado, screenshots, fricções observadas.

### <Concorrente 1>
- Data do teste: <YYYY-MM-DD>
- Quem testou: <nome>
- Plano testado: <free/trial/pago — R$/mês>
- Fluxo testado: <ex.: cadastro → import CSV → primeiro relatório>
- Fricções observadas: <bullets>
- Pontos positivos: <bullets>
- Screenshots: `docs/descoberta/mystery-shopping/<concorrente1>/` (se aplicável)

### <Concorrente 2>
[mesmo formato]

## 4. Diferenciação clara do <NomeDoProjeto>

> O que o produto faz que nenhum dos acima faz (ou faz melhor). Frases concretas, não jargão.

- <diferencial 1 — comprovável, mensurável>
- <diferencial 2>
- <diferencial 3>

## 5. Riscos competitivos

> O que poderia mudar o jogo num horizonte de 12-24 meses.

| Risco | Probabilidade (A/M/B) | Impacto (A/M/B) | Mitigação |
|---|---|---|---|
| Concorrente X lança feature Y | <A/M/B> | <A/M/B> | <...> |
| Entrada de big tech (Google/Microsoft) | <A/M/B> | <A/M/B> | <...> |
| Open source resolve grátis | <A/M/B> | <A/M/B> | <...> |

## Critério para promover de `draft` para `stable`

- [ ] ≥3 concorrentes diretos listados (ou justificativa em `nao-aplica.md` se mercado vazio).
- [ ] ≥2 concorrentes indiretos listados (incluindo "não fazer nada").
- [ ] ≥1 mystery shopping concluído OU motivo de não fazer documentado.
- [ ] Diferenciação tem ≥2 bullets concretos (não "mais fácil de usar" sem qualificar).
