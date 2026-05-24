---
tipo: prd
subtipo: brownfield
id: PRD-012
versao: 1
status: aprovado
owner: gerente-produto (Sofia)
revisado-em: 2026-05-24
---

# PRD-012 — Migrar pagamento de boleto pra Pix em loja online (legada)

> **PRD Brownfield**: aplicado a projeto que já está em produção há 4 anos. Carrega débito técnico, integração com gateway antigo (Cielo Webservice 2018), 18 mil pedidos/mês.

---

## 1. Problema

Hoje a loja online aceita só boleto bancário e cartão. Cliente quer pagar com Pix — em pesquisa recente, 71% dos clientes B2C abandonam carrinho quando vêem só boleto/cartão. Boleto cai em 14% de inadimplência (não pagam em 3 dias). Pix tem 0% de inadimplência (transferência imediata).

**Evidência:**
- Google Analytics: 71% de abandono no checkout (12 meses).
- Relatório financeiro: R$ 47.000/mês em boletos não pagos.
- 23 tickets de suporte em abril/2026: "vocês não aceitam Pix?".

---

## 2. Estado atual do sistema

### 2.1 Comportamento atual

Cliente escolhe forma de pagamento na tela `/checkout`. Opções: boleto (gera PDF via Cielo Webservice 2018, envia por e-mail) ou cartão (tokeniza com Cielo SDK 2018, redireciona pra 3DS). Boleto tem janela de 3 dias úteis; webhook do Cielo confirma pagamento e libera pedido.

### 2.2 Arquivos/módulos afetados

- `src/checkout/PagamentoForm.tsx` — formulário de escolha.
- `src/checkout/api/cielo-boleto.ts` — chamada Cielo Webservice 2018.
- `src/checkout/api/cielo-cartao.ts` — tokenização.
- `src/checkout/api/webhook-cielo.ts` — handler de confirmação.
- `src/pedidos/StatusPedido.tsx` — tela de status que mostra "aguardando pagamento".
- `src/pedidos/Pedido.entity.ts` — entidade tem `forma_pagamento: 'boleto' | 'cartao'`.

### 2.3 ADRs existentes que tocam essa área

- **ADR-0003** (2022) — escolha de Cielo como gateway único. Justificou na época: tarifa boleto + cartão num contrato só.
- **ADR-0019** (2024) — não usar webhook de cartão pra liberar pedido, só pra atualizar status (3DS pode demorar).

### 2.4 Débito técnico conhecido

- Cielo Webservice 2018 está em modo "deprecated" (Cielo avisou que descontinua em jan/2027). Migração obrigatória pro Cielo API Gold em algum momento.
- `webhook-cielo.ts` não valida HMAC (PIX-002 do REGRAS-INEGOCIAVEIS.md viola — só temos IP allowlist). Pix vai exigir HMAC obrigatório.
- Entidade `Pedido` não tem campo `txid` nem `endToEndId` — vai precisar migration.

---

## 3. Personas e impacto em usuários existentes

| Persona | Quantos hoje | Como vai sentir |
|---|---|---|
| Cliente B2C | 18.000/mês | Vê opção "Pix" no checkout — pagamento instantâneo, pedido sai mesmo dia |
| Cliente B2B | 200/mês | Continua usando boleto (já tem condição negociada — não tocar) |
| Atendente loja | 4 pessoas | Vê pedido "PAGO" 30s após confirmar Pix (vs 3 dias úteis com boleto) |

### 3.1 Migração de dados/usuários

- **Migrar dado existente?** Não. Pedidos antigos continuam com `forma_pagamento: 'boleto' | 'cartao'`. Pix é valor novo.
- **Avisar cliente da mudança?** Sim. Banner na home por 30 dias após release: "Agora aceitamos Pix!".

---

## 4. Hipótese de solução

Adicionar Pix como terceira opção no checkout. Usar PSP novo (não Cielo) — Cielo cobra 1,2% por Pix, PSP especializado cobra 0,4%. Implementar como pacote do framework: instalar addon `fintech-br` e configurar.

### 4.1 Por que essa direção (vs alternativas brownfield)

- **Refazer do zero:** descartado. Loja tá em produção, não dá pra refazer.
- **Strangler pattern (substituir Cielo gradualmente):** parcialmente. Pix vai pra PSP novo, mas boleto+cartão continuam Cielo até deprecation.
- **Feature flag e dual-write:** sim. Flag `enable_pix` por loja, ativa pra 1 loja na primeira semana, depois liga 100%.
- **Migração big-bang em janela de manutenção:** desnecessário — Pix é adição, não substituição.

---

## 5. User stories rastreáveis

### US-076 — Mostrar Pix no checkout (feature-flagged)

**Como** cliente B2C, **quero** ver opção "Pix" no checkout **para** pagar instantâneo sem boleto.

**AC-076-1** — Se a flag `enable_pix` está ligada pra loja, mostra opção. Senão, esconde.
**AC-076-2** — Clicar em Pix gera QR Code + chave copia-cola (BR Code padrão EMV).
**AC-076-3** — Telemetria registra abandono/conclusão por forma de pagamento.

### US-077 — Webhook Pix com validação HMAC

**Como** sistema, **quero** validar HMAC do webhook do PSP **para** não aceitar webhook forjado (PIX-002).

**AC-077-1** — HMAC validado na primeira linha do handler — falha → 401 imediato.
**AC-077-2** — Idempotência por txid + endToEndId (PIX-001).
**AC-077-3** — Logs mascarados (chave Pix nunca em texto puro, PIX-004).

### US-078 — Migration entidade Pedido

**Como** sistema, **quero** colunas `txid VARCHAR(35)` e `end_to_end_id VARCHAR(32)` em `pedidos` **para** suportar conciliação Pix.

---

## 6. Plano de rollout

1. **Semana 1:** US-078 (migration). Rodar em homologação. Verificar que pedidos antigos continuam OK.
2. **Semana 2:** US-076 + US-077. Flag `enable_pix = false` em todas lojas.
3. **Semana 3:** Ligar flag pra loja-piloto (loja matriz). Monitorar 7 dias.
4. **Semana 4:** Ligar pra todas se métricas OK.

**Plano B se Pix falhar em produção:** desligar flag `enable_pix` — checkout volta a mostrar só boleto/cartão. Sem rollback de código.

---

## 7. Riscos brownfield

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Webhook Cielo conflita com webhook Pix (mesma rota) | Média | Alto | Webhook Pix em rota nova `/api/webhook-pix`, separada |
| Migration `pedidos` trava banco em produção | Baixa | Alto | Migration `ADD COLUMN ... NULL DEFAULT NULL` é rápida (PostgreSQL não trava) |
| Cliente confuso com 3 opções no checkout | Alta | Baixo | UX-009 redesenha tela — Pix em destaque, boleto/cartão "Outras opções" |
| Cielo cobra taxa de Pix mesmo a gente usando PSP novo | Média | Médio | Confirmar em contrato (jurídico) — se cobrar, renegociar |

---

## 8. Regulamentação BR aplicável

- **PIX-001** a **PIX-005** — todas regras do bloco Pix.
- **LGPD-001** — Pix coleta chave Pix do cliente. Base legal: execução de contrato.
- **LGPD-004** — Acessos a chave Pix logados (auditoria).
- **SEC-005** — URLs do PSP via variável de ambiente, não hardcoded.
- **FISCAL-010** — Split payment vai entrar em 2027. Modelar `pedidos.pagamento` com ponto de extensão pra split (não implementar agora, mas não bloquear).

---

## 9. Critério de pronto

- [ ] Loja-piloto rodando Pix por 7 dias sem incidente.
- [ ] Conciliação financeira do PSP bate com extrato bancário (verificar via `end_to_end_id`).
- [ ] Métrica de abandono no checkout cai pelo menos 20 pontos.
- [ ] Webhook HMAC validado em 100% das chamadas (logs).
- [ ] Auditor-seguranca aprovou (PIX-002, PIX-004, LGPD-004).

---

## 10. Histórico de mudanças

| Data | Versão | Autor | Mudança |
|---|---|---|---|
| 2026-05-24 | 1 | Sofia | criação a partir de pesquisa de mercado + 23 tickets de Pix |
