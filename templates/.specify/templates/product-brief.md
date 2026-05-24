---
tipo: product-brief
versao: 1.0
data: AAAA-MM-DD
autor: _(nome)_
status: draft
relacionado-prd: _(opcional)_
---

# Brief — _(nome da iniciativa)_

> Brief curto de iniciativa (1 página). Use ANTES do PRD para alinhar contexto sem custo. Se a iniciativa não cabe em 1 página, é grande demais — quebre antes.
>
> 💡 **Travou?** Helper irmão: [`product-brief-helper.md`](product-brief-helper.md). Exemplo completo: [`docs/exemplos/BRIEF-EXEMPLO.md`](../../docs/exemplos/BRIEF-EXEMPLO.md).

---

## Em 1 frase

_(Problema + solução proposta em 1 frase)_

## Problema

- **Quem sente:** _(persona)_
- **Quando sente:** _(situação)_
- **Quanto incomoda:** _(magnitude — % de usuários, tempo perdido, dinheiro perdido)_
- **Como sabemos:** _(evidência — tickets, NPS, entrevistas, dado de uso)_

## Solução proposta (hipótese)

_(1-3 frases. Não é spec — é direção.)_

## Métrica de sucesso

- **Quantitativa:** _(ex: 30% de redução em tickets de X em 90 dias)_
- **Como medimos:** _(de onde vem o número)_

## Por que agora?

- _(razão de timing)_

## Por que **não** depois?

- _(custo de oportunidade)_

## Restrições conhecidas

- **Prazo:** _(se houver)_
- **Orçamento:** _(se relevante)_
- **Regulação:** _(LGPD, fiscal, setor — IDs aplicáveis de REGRAS-INEGOCIAVEIS.md)_
- **Stack obrigatória:** _(se houver)_

## Premissas

- _(premissa que precisa ser verdadeira pra plano funcionar)_

## Non-goals

- _(coisa que poderia parecer escopo mas NÃO está)_

## Próximo passo

- [ ] Brief aprovado pelo dono do produto
- [ ] Decidir: rodar `/prd` (iniciativa grande) ou `/historia` (já é story única)

---

_Brief não é PRD. Não tem AC, não tem persona detalhada, não tem story. É só um alinhamento de "vale a pena explorar?"._
