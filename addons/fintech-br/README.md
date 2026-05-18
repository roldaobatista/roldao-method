---
owner: addon
revisado-em: 2026-05-18
status: stable
---

# fintech-br — Addon ROLDAO-METHOD para Pix e Open Finance

Pix tem 5 tipos de chave, BR Code com 15+ campos EMV, webhook com HMAC, devolução em 90 dias, MED em 80 dias, Pix Automático (recorrência) novo em 2025/2026. Open Finance Brasil exige FAPI + OAuth 2.0 + OpenID. Este addon traz:

- **1 agente:** `pix-arch` — decide arquitetura Pix (PSP direto vs BaaS, idempotência, fila).
- **1 hook:** `validate-webhook-signature` — barra handler de webhook Pix sem verificação de assinatura.
- **3 skills:**
  - `gerar-br-code` — gera BR Code EMV padrão Bacen.
  - `validar-webhook-pix` — valida HMAC, idempotência, status.
  - `estruturar-open-finance` — guia de implementação Open Finance Brasil.
- **4 regras novas:** `PIX-EXT-001`, `PIX-EXT-002`, `PIX-EXT-003`, `PIX-EXT-004` (prefixadas `EXT` pra não colidir com `PIX-001..005` do core, que tratam DICT/validação de chave).

## Quando usar

- Sistema recebe ou envia Pix.
- Sistema integra com Open Finance Brasil (extrato, iniciação de pagamento).
- Sistema precisa de Pix Cobrança (com vencimento, multa, juros, desconto).
- Sistema implementa Pix Automático (recorrência autorizada).

## Como instalar (manual)

Copie `addons/fintech-br/.claude/` pro `.claude/` do seu projeto. Mescle `settings.json` adicionando o hook.

## Regras

### PIX-EXT-001 — Idempotência por TxId
Toda criação de cobrança Pix usa TxId determinístico ou idempotency key. Reenvio com mesmo TxId não duplica cobrança.

### PIX-EXT-002 — Webhook Pix valida assinatura na primeira linha
Handler de webhook Pix valida assinatura HMAC + IP de origem antes de processar payload. Hook `validate-webhook-signature` força.

### PIX-EXT-003 — Persistir EndToEndId pra rastreabilidade
Todo Pix recebido/enviado tem EndToEndId (E2EID) persistido em coluna indexada. EndToEndId é o identificador único do SPI — sem ele, não há rastreamento.

### PIX-EXT-004 — Open Finance via FAPI + mTLS
OAuth 2.0 + FAPI + DCR + mTLS. Sem atalho. Guia em skill `estruturar-open-finance`.

## Cenários cobertos

- **Pix Comum:** transferência avulsa, com webhook de confirmação.
- **Pix Cobrança Imediata (cobv imediata):** QR Code dinâmico com vencimento curto.
- **Pix Cobrança com Vencimento (cobv):** boleto-like, multa, juros, desconto.
- **Pix Devolução:** estorno em até 90 dias do original.
- **Pix MED:** Mecanismo Especial de Devolução (até 80 dias, fraude/erro).
- **Pix Saque + Pix Troco:** com limites operacionais.
- **Pix Automático:** recorrência autorizada (2025+).
- **Open Finance:** consentimento + iniciação de pagamento (Fase 3).
- **DICT consulta:** validar chave Pix antes de cobrar.

## Stack recomendada

| Necessidade | Solução |
|---|---|
| PSP BaaS (Pix as a Service) | EFI/Gerencianet, Asaas, Stark Bank, Mercado Pago, Iugu |
| Banco direto (volume alto) | API Pix do Itaú, Bradesco, Santander, Inter, Sicoob, BTG, Caixa |
| Iniciador de Pagamento (Open Finance) | Operação direta Bacen ou via parceiro autorizado |
| Conciliação | Sistema próprio com EndToEndId como pivô |

## Documentação

- Knowledge base: `templates/.specify/data/kb-pix.md`
- Skill base do framework: `validar-pix` (5 tipos de chave + E2EID + TxId)
- Manual Pix Bacen: <https://bacen.github.io/pix-api/>

## Non-goals

- Ser PSP — addon ajuda quem integra com PSP, não substitui.
- Substituir SDK oficial — bancos têm SDKs, use-os quando existem.
- Intermediar credenciais Bacen — credencial é responsabilidade da empresa.
