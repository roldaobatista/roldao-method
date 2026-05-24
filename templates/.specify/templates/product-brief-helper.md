---
tipo: helper
owner: framework
revisado-em: 2026-05-24
status: stable
---

# Helper — Como preencher Brief

> **Companheiro do `product-brief.md`.** Exemplo completo em [`docs/exemplos/BRIEF-EXEMPLO.md`](../../docs/exemplos/BRIEF-EXEMPLO.md).

## Em 1 frase — 3 padrões

**Bom:**
> "CPFs inválidos passam no PDV e travam 12 NFs/mês — vamos validar localmente sem chamar a Receita."

**Ruim:**
> "Vamos melhorar o sistema." ← genérico, sem problema, sem solução.

**Bom:**
> "Cliente abandona checkout em 71% porque só aceita boleto — vamos adicionar Pix com PSP especializado."

## Problema — formato esperado

- **Quem sente** (persona específica)
- **Quando sente** (situação concreta)
- **Quanto incomoda** (número!)
- **Como sabemos** (evidência — ticket, NPS, entrevista)

**Dica:** Sem número, não é problema — é palpite. Volte e mede primeiro.

## Por que agora? + Por que NÃO depois?

| Por que agora | Por que NÃO depois |
|---|---|
| Contador ameaçou cobrar reemissões | Cada mês adiado = ~12 reemissões + 3h do contador |
| Promoção de Páscoa dobra volume | Adiar = entrar na promoção sem proteção |
| Reforma Tributária 2026 chegando | Cadastro sujo agora = caos depois |

## Métrica de sucesso — 3 ângulos

1. **Quantitativa principal:** "Reduzir CPFs inválidos de 4% pra < 0,5% em 30 dias."
2. **Quantitativa de não-regressão:** "Tempo médio de cadastro NÃO subir acima de 30s."
3. **Como medimos:** "Query diária + relatório mensal do contador."

## Restrições conhecidas — 4 categorias

- **Prazo** (se houver)
- **Orçamento** (se houver)
- **Regulação** (LGPD/Fiscal/Pix IDs do REGRAS-INEGOCIAVEIS.md)
- **Stack obrigatória** (se já existe)

## Quando este helper abre

`/clarificar` ou `/prd` antes de virar PRD formal — agente lê este helper pra propor estrutura coerente.
