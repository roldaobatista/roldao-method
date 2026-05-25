---
tipo: prd
id: EXEMPLO-PRD-001
versao: 1
status: draft
owner: gerente-produto
revisado-em: 2026-05-24
---

# PRD-001 — Checkout com Pix dinâmico

> Este é um **exemplo preenchido** pra mostrar a estrutura. Apague antes de colocar conteúdo real. O molde vazio fica em `.specify/templates/prd.md`.

## Problema

Cliente abandona checkout porque cartão é recusado em 18% das tentativas. Pix tem 0,3% de recusa e cai na conta em segundos, mas hoje cliente tem que copiar chave manualmente.

## Hipótese

Mostrar QR Code Pix dinâmico (com valor e TxId únicos) ao lado do botão de cartão deve subir taxa de conversão de ≥ 6 p.p. em 30 dias.

## Objetivos

- Conversão de checkout sobe de 62% pra 68% (+6 p.p.).
- Tempo médio de pagamento cai de 95s pra 35s.
- Reduz chargebacks em 40% (Pix não tem estorno por compra legítima).

## Non-goals

- **Não** vamos suportar Pix saque/troco nesta iteração.
- **Não** vamos integrar Pix Automático (recorrência) — fica pra PRD-002.
- **Não** vamos cobrar via boleto neste fluxo (já existe).

## Restrições

- Precisa rodar mobile-first (78% do tráfego é celular).
- LGPD: chave Pix nunca exibida em log nem em e-mail de confirmação (PIX-004).
- Fiscal: NFC-e emitida no mesmo evento de pagamento confirmado (FISCAL-001).
- Idempotência por TxId obrigatória (PIX-001) — se cliente clicar 2x, gera 1 cobrança só.

## Stories filhas (decompostas em /epico)

- US-001 — Gerar QR Pix dinâmico no checkout
- US-002 — Receber webhook de confirmação e baixar pedido
- US-003 — Emitir NFC-e ao confirmar Pix
- US-004 — Mostrar "Pago" em ≤ 5s após recebimento

## Métricas de sucesso

| Métrica | Hoje | Meta 30 dias |
|---|---|---|
| Conversão checkout | 62% | ≥ 68% |
| Tempo médio pagamento | 95s | ≤ 35s |
| Chargeback / pedido | 1,8% | ≤ 1,1% |

## Riscos

- PSP cair → ADR de contingência obrigatório (FISCAL-004).
- Cliente sem app de banco → manter cartão como alternativa visível.
