---
tipo: checklist
nome: pix-compliance
versao: 1.0
revisado-em: 2026-05-18
status: stable
owner: framework
---

# Pix Compliance — checklist completo

> Use ANTES de subir feature que toca Pix (recebimento, envio, cobrança, devolução, MED, Pix Automático). Cobre Bacen Resolução 1, Manual Pix, Open Finance. IDs: PIX-001 a PIX-005 + addon `fintech-br` (PIX-EXT-*).

## 1. Chaves Pix

- 🔴 Valida chave **antes de salvar** (skill `validar-pix` no core).
- 🔴 5 tipos suportados: CPF (11 dígitos), CNPJ (14 dígitos + alfanumérico jul/2026), email, telefone E.164 (+55DDXXXXXXXXX), UUID v4 aleatória.
- 🔴 Não armazena chave em log/cache em texto puro.
- 🔴 Consulta DICT antes de cobrar (chave existe e é do titular esperado).
- 🟡 Cache de DICT com TTL ≤ 24h (chave pode mudar de titular).

## 2. EndToEndId (E2EID)

- 🔴 Toda transação Pix recebida/enviada **persiste E2EID em coluna indexada** (PIX-003).
- 🔴 Formato validado: `E` + ISPB(8) + AAAAMMDDHHmm(12) + serial(11) = 32 chars.
- 🔴 E2EID é único — chave de idempotência em todas as operações.
- 🟡 Index parcial se volume alto (excluir E2EID null).

## 3. TxId

- 🔴 TxId conforme Manual Pix Bacen: **alfanumérico [A-Za-z0-9]{1,35}** (sem símbolos).
- 🔴 TxId é determinístico OU idempotency key — reenvio com mesmo TxId não duplica cobrança (PIX-001).
- 🟡 Geração de TxId tem prefixo identificável do sistema pra rastrear no Bacen.

## 4. BR Code (QR Code Pix)

- 🔴 Geração conforme EMV (Manual Bacen):
  - Payload Format Indicator (`00`)
  - Merchant Account Information (`26`) com chave + URL do payload
  - Transaction Currency (`53`) = **986** (BRL)
  - CRC16 calculado corretamente
- 🔴 Skill `gerar-br-code` (addon `fintech-br`) é usada em vez de gerar manual.
- 🟡 Imprime URL alternativa pra usuário sem leitor QR.
- 🟡 Validade do QR estática vs dinâmica explicitada na UX.

## 5. Webhook Pix

- 🔴 Handler de webhook **valida assinatura HMAC na primeira linha** (PIX-002).
- 🔴 Valida IP de origem contra lista do PSP (whitelist).
- 🔴 Hook `validate-webhook-signature` (addon `fintech-br`) está ativo.
- 🔴 Idempotência: reprocessamento do mesmo E2EID não duplica efeito.
- 🔴 Status processado: `received`, `failed`, `returned`, `refunded` — não inventar.
- 🟡 Timeout < 5s pra responder OK, processamento assíncrono pra fila.
- 🟡 Retry exponencial em caso de falha de processamento.

## 6. Devolução

- 🔴 Devolução respeita **prazo de 90 dias** do original.
- 🔴 Devolução parcial: validar valor ≤ valor original.
- 🔴 Persistir relação devolução ↔ original via E2EID.
- 🟡 UX explica claramente "devolução" vs "MED" pro usuário.

## 7. MED (Mecanismo Especial de Devolução)

- 🔴 MED aplicável em até **80 dias** do original (fraude/erro).
- 🔴 Bloquear valor MED imediatamente quando notificado pelo PSP.
- 🔴 Notificar usuário pagador da reversão.
- 🟡 Trilha de auditoria explicitando motivo (fraude / erro do PSP / outro).

## 8. Pix Automático (recorrência)

- 🔴 Consentimento explícito do pagador antes de cobrar.
- 🔴 Possibilidade de cancelar a qualquer momento (1 clique).
- 🔴 Notificação ao pagador antes de cada cobrança (mínimo 1 dia antes).
- 🔴 Se cobrança falhou: comportamento documentado (retry? cancela?).
- 🟡 Histórico de cobranças visível pro pagador.

## 9. Open Finance Brasil (se aplicável)

- 🔴 OAuth 2.0 + FAPI + mTLS configurados conforme spec Bacen.
- 🔴 Dynamic Client Registration (DCR) implementado.
- 🔴 Consentimento granular por fase (dados / iniciação de pagamento).
- 🔴 Revogação de consentimento honrada imediatamente.
- 🟡 Certificado de transporte (mTLS) e assinatura (sig) separados.
- 🟡 Skill `estruturar-open-finance` (addon `fintech-br`) usada no design.

## 10. Segurança / antifraude

- 🔴 Rate-limit por chave/conta (evitar ataque de enumeração via DICT).
- 🔴 Score antifraude antes de Pix de valor alto (definir threshold).
- 🔴 Captcha / 2FA antes de cadastro/troca de chave.
- 🟡 Modelo de ML pra detectar anomalia (opcional, depende do volume).

## 11. LGPD em Pix

- 🔴 Chave Pix (CPF, email, telefone) é dado pessoal — base legal documentada.
- 🔴 Compartilhamento com PSP tem DPA.
- 🔴 Retenção: enquanto conta ativa + 5 anos (CDC) por tratar-se de operação financeira.
- 🔴 Direito ao esquecimento: chaves Pix podem ser excluídas do DICT pelo titular (sistema deve refletir).

## 12. Observabilidade

- 🔴 Métrica de sucesso/falha por tipo de operação (Pix Imediato, Cobrança, Devolução, MED).
- 🔴 Latência E2E de webhook (recebimento → processamento).
- 🔴 Alerta se taxa de falha > X% em janela de Y min.
- 🟡 Dashboard de "fila de webhooks pendentes" pra plantão.

## 13. Documentação / treinamento

- 🟡 Suporte tem fluxograma "Pix não chegou" pra responder cliente.
- 🟡 Procedimento de incidente Pix (escalação, comunicação ao PSP).

---

## Veredito

- [ ] **APROVADO PARA PRODUÇÃO** (todos 🔴 verdes)
- [ ] **RESSALVAS** (alguns 🟡 — registrar e priorizar)
- [ ] **BLOQUEADO** (1+ 🔴 vermelho)

## Referências

- Manual Pix Bacen: <https://bacen.github.io/pix-api/>
- Resolução BCB nº 1/2020 (Pix)
- Resolução Conjunta BCB/CMN nº 1/2020 (Open Finance)
- `templates/.specify/data/kb-pix.md` — KB completa
- Addon `fintech-br` — agentes/skills/hooks específicos
