---
tipo: product-brief
versao: 1.0
data: 2026-04-25
autor: gerente-produto (Sofia)
status: aprovado
relacionado-prd: PRD-007
---

# Brief — Validação de CPF no balcão

> Brief curto de iniciativa (1 página). Use ANTES do PRD para alinhar contexto sem custo.

---

## Em 1 frase

CPFs inválidos passam no cadastro do PDV e travam 12 notas fiscais/mês — vamos validar com algoritmo local sem chamar a Receita Federal.

## Problema

- **Quem sente:** atendente do balcão (perde tempo refazendo), contador (pede reemissão), dono da loja (vê retrabalho).
- **Quando sente:** no fechamento do dia, quando a NF-e rejeita.
- **Quanto incomoda:** 4% das vendas precisam de reemissão. 12 reemissões/mês. ~3h/mês do contador. Cliente esperando no balcão na hora.
- **Como sabemos:** ticket #1247, relatório do contador de abril/2026, conversa com gerente da loja em 2026-04-20.

## Solução proposta (hipótese)

Validar dígito verificador do CPF no momento de "Salvar" usando algoritmo módulo 11 — só local, sem internet, sem custo, sem latência. Mostrar mensagem clara em PT-BR se inválido e manter foco no campo pra correção rápida.

## Métrica de sucesso

- **Quantitativa:** reduzir CPFs inválidos gravados de 4% pra < 0,5% em 30 dias após release.
- **Como medimos:** query diária `SELECT count(*) FROM clientes WHERE cpf_valido = false` + cruzar com relatório mensal do contador.

## Por que agora?

- Contador ameaçou cobrar a parte das reemissões na próxima fatura.
- Próximo trimestre vamos ter promoção de Páscoa — volume de cadastros vai dobrar.

## Por que **não** depois?

- Cada mês adiado custa ~12 reemissões = ~3h do contador + atrito com atendente.
- Reforma Tributária começa em 2026: mais um motivo pra ter cadastro limpo agora.

## Restrições conhecidas

- **Prazo:** entregar em 2 semanas (antes da promoção de Páscoa).
- **Orçamento:** dev interno — sem contratação externa.
- **Regulação:** LGPD-001 (base legal: execução de contrato), LGPD-003 (minimização — coletar só CPF, não outros docs), FISCAL-005 (preparado pra CNPJ alfanumérico jul/2026).
- **Stack obrigatória:** TypeScript + React (frontend atual do PDV).

## Premissas

- A skill `validar-cpf-cnpj` do core do framework cobre o algoritmo (não precisa reimplementar).
- O campo `cpf` no banco já é `VARCHAR(14)` (preparado pra CNPJ alfanumérico).
- O atendente aceita uma nova mensagem de erro sem precisar de treinamento longo (validar com 2 atendentes antes de subir).

## Non-goals

- **Não** vamos consultar a Receita Federal (custo + offline).
- **Não** vamos avaliar crédito (Serasa/SPC).
- **Não** vamos mexer no layout do formulário (UX-005 trata disso).

## Próximo passo

`/prd PRD-007 — Cadastro de cliente do balcão (PDV físico)` — virou PRD-007 em 2026-04-25.
