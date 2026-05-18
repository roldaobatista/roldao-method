---
tipo: knowledge-base
id: KB-PIX
versao: 1
status: stable
owner: framework
revisado-em: 2026-05-18
---

# KB — Pix e Open Finance

> Base de conhecimento sobre o sistema Pix do Banco Central. Complementa a skill `validar-pix`.

## O que é Pix

Sistema de pagamento instantâneo do Bacen, disponível **24×7×365**. Liquidação em segundos. Operado pela infraestrutura **SPI** (Sistema de Pagamentos Instantâneos).

## Tipos de chave Pix

| Tipo | Formato | Exemplo |
|---|---|---|
| CPF | 11 dígitos numéricos (com DV) | `12345678909` |
| CNPJ | 14 dígitos numéricos (com DV) — ou alfanumérico após jul/2026 | `12345678000195` |
| Email | RFC 5322, lowercase recomendado, max 77 caracteres | `usuario@dominio.com.br` |
| Telefone | E.164, sempre `+55` para Brasil, max 14 caracteres | `+5511987654321` |
| Aleatória | UUID v4, formato canônico | `e2c8d4f1-3b9a-4d6e-b8c1-2f1a3b4c5d6e` |

Skill `validar-pix` valida os 5 tipos.

## Identificadores Pix

### EndToEndId (E2E ID)

Identificador único da transação no SPI. **32 caracteres**, formato:
```
E + 8 dígitos ISPB + AAAAMMDDHHMM + 11 caracteres
```
- `E` literal.
- `8 dígitos` ISPB do PSP do pagador.
- `12 dígitos` data/hora da transação (UTC-3).
- `11 caracteres` aleatórios.

Exemplo: `E12345678202605181430ABC123XYZ45`

### TxId

Identificador da transação atribuído pelo recebedor. Conforme **Manual Pix Bacen**, formato estrito: `[A-Za-z0-9]{1,35}` — somente letras (case-sensitive) e dígitos, **sem símbolos**, mínimo 1, máximo 35 caracteres (Pix tradicional). Para Pix Cobrança com vencimento (cobv) a regra é `[A-Za-z0-9]{26,35}` (mín 26, máx 35).

Implementações que aceitam símbolos (`-`, `_`, `.`) violam o manual e podem ser rejeitadas pelo PSP. Use skill `validar-pix --txid` pra validar.

### Convocação ISPB

Cada PSP (Provedor de Serviço de Pagamento) tem ISPB único de 8 dígitos no Bacen. Lista pública: <https://www.bcb.gov.br/estabilidadefinanceira/spbadm>

## Tipos de Pix

| Tipo | O que é |
|---|---|
| **Pix Comum** | Pagamento avulso, sem cobrança formal. |
| **Pix Cobrança imediata** (cobv) | QR Code dinâmico com vencimento curto. |
| **Pix Cobrança com vencimento** (cobv) | Boleto-like, com vencimento, juros, multa, desconto. |
| **Pix Saque** | Saque em estabelecimentos comerciais (limite padrão R$ 500 dia / R$ 100 noite — ver seção de limites). |
| **Pix Troco** | Compra com troco em dinheiro. |
| **Pix Devolução** | Estorno até 90 dias após o original. |
| **Pix Agendado** (v6+) | Agendamento até 12 meses no futuro. |
| **Pix Automático** (2025+) | Recorrência autorizada (substitui débito automático). |
| **Pix Garantido** (em estudo) | Pagamento parcelado com Pix. |

## Limites operacionais

- **Por transação**: definido por cada PSP, configurável pelo usuário.
- **Horário noturno** (20h às 6h): limite reduzido por padrão (R$ 1.000 — usuário pode aumentar com aviso prévio de 24h ao banco).
- **Pessoa física**: sem limite global do Bacen — depende do PSP.
- **Pessoa jurídica**: idem.
- **Pix Saque**: R$ 500 (dia) / R$ 100 (noite) por padrão.

## Devolução (Pix Estorno)

- **Janela**: até **90 dias** após a transação original.
- **MED** (Mecanismo Especial de Devolução): para fraude/erro operacional, Bacen pode forçar devolução em até 80 dias.
- **Endpoint Bacen**: `/pix/{e2eid}/devolucao/{id}` (DICT/Pix API).

## DICT — Diretório de Identificadores de Contas Transacionais

API do Bacen pra consultar dados de chave Pix. Limites:
- Pessoa física: máx **5 chaves** por conta.
- Pessoa jurídica: máx **20 chaves** por conta.
- Consulta DICT tem rate limit por instituição.

## QR Code Pix

Padrão **EMV QR Code** com extensão Pix:
- **Estático**: mesma chave, valor opcional, sem expiração.
- **Dinâmico**: URL aponta pra JWS (JSON Web Signature) com payload assinado.

Campos obrigatórios (BR Code Pix):
- `00` Payload Format Indicator
- `26` Merchant Account Info (chave Pix ou URL)
- `52` Merchant Category Code
- `53` Currency = `986` (BRL)
- `58` Country Code = `BR`
- `59` Merchant Name
- `60` Merchant City
- `62` Additional Data (TxId)
- `63` CRC16

## Open Finance (ex-Open Banking)

Compartilhamento de dados e iniciação de pagamento entre instituições autorizadas pelo Bacen. Fases:
1. **Fase 1**: dados públicos das instituições.
2. **Fase 2**: dados cadastrais e transacionais (com consentimento).
3. **Fase 3**: iniciação de pagamento (Pix incluso).
4. **Fase 4**: dados de outros produtos (investimento, câmbio, seguros, previdência).

Stack: OAuth 2.0 + OpenID Connect + FAPI (Financial-grade API).

Sandbox: <https://web.directory.openfinancebrasil.org.br>

## Anti-padrões Pix

❌ Aceitar chave Pix sem validar formato/DV.
❌ Confundir EndToEndId com TxId.
❌ Gerar TxId aleatório sem persistir antes da chamada (perde idempotência).
❌ Reenviar Pix sem checar status — pode gerar duplicidade.
❌ Não tratar webhook de devolução — cliente reclama estorno não creditado.
❌ Logar chave Pix completa em texto puro — LGPD-004 (chave é dado pessoal).
❌ Hardcoded BACEN_BASE_URL — tem ambiente sandbox e produção.
❌ Cache de DICT sem TTL — chave pode trocar de banco.

## Referências

- Manual do BR Code: <https://www.bcb.gov.br/estabilidadefinanceira/comunicacaodados>
- API Pix: <https://bacen.github.io/pix-api/>
- Open Finance: <https://openfinancebrasil.org.br/>
- ISPB lookup: <https://www.bcb.gov.br/estabilidadefinanceira/spbadm>
