---
tipo: story
id: US-105
versao: 1
status: em-implementacao
prd: PRD-001
epico: EP-001
tamanho: M
owner: Roldão
revisado-em: 2026-05-23
depende-de: [US-101]
aprovacoes: []
---

# US-105 — Port grupo fiscal/Pix/LGPD (4 hooks)

## Como, quero, para

**Como** dev BR em Windows puro,
**quero** que os 4 hooks específicos do domínio fiscal/Pix/LGPD (URL hardcoded, regras NF-e, log de chave Pix, base legal LGPD) funcionem nesse ambiente,
**para** que violações fiscais/Pix/LGPD sejam detectadas antes do commit em qualquer SO.

---

## Critérios de aceitação

- **AC-105-1** — `no-hardcoded-env-urls.js` bloqueia URLs hardcoded de 22 domínios sensíveis (SEFAZ federal/regional, SVC-AN/RS de contingência, Bacen/Pix/Open Finance, Stripe, OpenAI, Anthropic, Pagar.me, Asaas, Mercado Pago, PagSeguro, Gerencianet, sandboxes) em código (.js/.ts/.py/.go/.java/etc.). Libera quando: dentro de comentário, `process.env`, `process.environ`, `getenv`, exceção `SEC-005-exception`, ou arquivo de teste/doc.
- **AC-105-2** — `fiscal-br-validator.js` detecta: FISCAL-001 (regerar/alterar XML autorizado), FISCAL-002 (certificado/senha hardcoded), FISCAL-003 (ambiente=1/`producao` sem env), FISCAL-005 (regex CNPJ apenas numérica). Libera exceção `FISCAL-NNN-exception` inline.
- **AC-105-3** — `no-log-pix-key.js` bloqueia `console.log`/`logger.*`/`print()` referenciando variáveis com nome PIX (cpf, cnpj, chave_pix, endtoendid, e2eid, txid) sem helper de máscara. Libera quando linha menciona `mascarar`/`mask`/`redact`/`***`.
- **AC-105-4** — `lgpd-base-legal-reminder.js` é **soft warning** (sempre `exit 0`): avisa quando código toca PII (cpf/cnpj/email/telefone/endereço/etc.) e o projeto não tem ADR mencionando LGPD nem campo `base-legal:` na story ativa.
- **AC-105-5** — Suite acumulada: **115 OK / 0 FAIL** (4/26 + 4 = 11/26 hooks portados).

---

## Non-goals

- Validar conteúdo XML real de NF-e — só padrões textuais.
- Detectar `console.error` mascarado por `try/catch` que silencia stack — fora de escopo.
- Lookup remoto (consulta SEFAZ pra validar URL viva) — só regex local.

---

## Tasks

- [x] **T-018** — Port `no-hardcoded-env-urls.sh`.
- [x] **T-019** — Port `fiscal-br-validator.sh` (FISCAL-001/002/003/005).
- [x] **T-020** — Port `no-log-pix-key.sh`.
- [x] **T-021** — Port `lgpd-base-legal-reminder.sh` (soft warning, lê filesystem do projeto).
- [x] **T-022** — +24 cenários na suite (115 OK / 0 FAIL acumulado).

---

## Status

- [x] em implementação (T-018..T-022 ✓)
- [ ] entregue (depende de US-108)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-23 | Roldão | criação + implementação |
