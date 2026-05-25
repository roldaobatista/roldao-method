---
tipo: story
id: EXEMPLO-US-001
versao: 1
status: draft
prd: EXEMPLO-PRD-001
epico: EXEMPLO-EP-001
tamanho: M
owner: gerente-produto
revisado-em: 2026-05-24
depende-de: []
aprovacoes: []
base-legal: contrato
---

# US-001 — Gerar QR Pix dinâmico no checkout

> Este é um **exemplo preenchido** pra mostrar a estrutura. Apague antes de colocar conteúdo real. O molde vazio fica em `.specify/templates/story.md`.

## Como cliente final
Eu quero ver um QR Code Pix logo abaixo do botão "Pagar com cartão",
para escolher pagar via app do banco sem digitar a chave.

## Critérios de aceitação

- AC-001-1 — Ao chegar na tela de checkout com itens no carrinho, o QR Pix dinâmico aparece em ≤ 800 ms.
- AC-001-2 — O QR é único por sessão de checkout (TxId determinístico por hash do pedido — PIX-001).
- AC-001-3 — Valor do QR bate centavo-a-centavo com o total do carrinho (incluindo frete e desconto).
- AC-001-4 — O QR expira em 15 min; após expirar, mostra botão "Gerar novo QR".
- AC-001-5 — Chave Pix usada na geração NÃO aparece em nenhum log (PIX-004 — hook `no-log-pix-key.js` bloqueia).
- AC-001-6 — Em ambiente de homologação (BACEN_BASE_URL aponta pra sandbox), o QR é gerado contra o PSP de homolog, nunca produção (PIX-005 + SEC-005).

## Tasks

- T-001 — Implementar `gerarQrPixDinamico(pedidoId)` chamando PSP via env URL.
- T-002 — Persistir TxId, EndToEndId e hash do EMV em `cobrancas_pix`.
- T-003 — Renderizar QR no front com fallback "copie e cole".
- T-004 — Testes unitários cobrindo idempotência (chamar 2x = 1 registro).
- T-005 — Teste de contrato com sandbox do PSP.

## Definição de pronto

- Todos os AC verificados em homologação.
- Cobertura ≥ 80% nos arquivos novos.
- 3 auditores aprovaram (Caio + Júlia + Pedro).
- Sem regressão no checkout cartão existente.
