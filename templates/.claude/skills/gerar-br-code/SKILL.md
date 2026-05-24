---
name: gerar-br-code
description: Gera BR Code (QR Code Pix) padrao EMV conforme manual Bacen — estatico ou dinamico. Use ao implementar geracao de QR Code Pix no checkout, cobranca ou impressao. Devolve a string EMV pronta pra ser renderizada em QR Code visual.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-22
status: stable
---

# gerar-br-code

Skill para gerar a STRING EMV do BR Code (Pix). A renderizacao do QR visual fica por conta de uma lib do projeto (qrcode em Python/JS).

## Regras

- **Padrao EMV BR (Bacen).** Formato TLV (Tag-Length-Value) com Payload Format Indicator, Merchant Account Info, Merchant Category Code, valor, moeda, pais, cidade, nome, transaction ID e CRC16-CCITT no fim.
- **Pix estatico** — chave + nome + cidade. Pode ter valor fixo ou em branco (pagador define). Reutilizavel.
- **Pix dinamico** — `url` aponta pra cobranca emitida pelo PSP (PIX-001). Cada QR e unico, expira, vincula a TxId. Auditavel.
- **CRC16-CCITT (poly 0x1021, init 0xFFFF)** no campo `6304XXXX`. Sem CRC valido, o app do banco rejeita.
- **Mascarar chave em logs** — chave Pix e dado pessoal (PIX-004 + LGPD-001).

## Como invocar

```bash
# Estatico (chave Pix + nome + cidade + valor opcional)
python3 ${CLAUDE_SKILL_DIR}/scripts/gerar-br-code.py estatico \
  --chave "loja@exemplo.com.br" \
  --nome "LOJA EXEMPLO" \
  --cidade "SAO PAULO" \
  --valor 99.90 \
  --txid "PEDIDO123"

# Dinamico (URL da cobranca emitida pelo PSP)
python3 ${CLAUDE_SKILL_DIR}/scripts/gerar-br-code.py dinamico \
  --url "https://pix.psp.com.br/qr/abc123" \
  --nome "LOJA EXEMPLO" \
  --cidade "SAO PAULO"
```

> **Windows:** `python` em vez de `python3`.

Saida: string EMV (1 linha) pronta pra ser passada pra `qrcode.make(...)` ou equivalente.

Exemplo de saida real (Pix estatico, chave email, R$ 99,90, TxId `PEDIDO123`):

```
00020126540014BR.GOV.BCB.PIX0114loja@exemplo.com.br5204000053039865406099.905802BR5912LOJA EXEMPLO6009SAO PAULO62150511PEDIDO12363042B7A
```

Como conferir rapido: os ultimos 4 caracteres (`2B7A`) sao o CRC16-CCITT. Se mudar 1 byte antes dele, o CRC tem que recalcular — bug comum e copiar EMV de exemplo e mudar a chave sem regerar o CRC. O app do banco rejeita silenciosamente.

## Limites do EMV

- **Nome:** maximo 25 caracteres, sem acento (padrao Bacen).
- **Cidade:** maximo 15 caracteres, sem acento.
- **TxId estatico:** ate 25 caracteres alfanumericos. Para dinamico, o TxId vem da cobranca emitida.
- **Valor:** ate 13 caracteres (`9999999999.99`).

A skill **trunca + normaliza acentos** automaticamente (nome "São Paulo" vira "SAO PAULO" antes do encode).

## Boas praticas

- Para checkout, **sempre dinamico** — TxId unico evita dupla cobranca (PIX-001).
- Estatico so pra cobranca recorrente sem valor (gorjeta, doacao).
- Cachear EMV no banco (`cobranca.br_code_emv`) — gerar uma vez, exibir N vezes.
- Em log/audit, gravar **hash** do EMV (SHA-256) em vez do EMV cru — chave Pix esta dentro (PIX-004).

## Anti-padroes

- Esquecer CRC16 — QR fica invalido, app do banco rejeita sem mensagem clara.
- Hardcode URL do PSP em codigo — usar env (`PSP_BASE_URL`, PIX-005 + SEC-005).
- Gerar QR estatico em alta volumetria — perde rastreabilidade (sem TxId unico).
- Logar EMV completo em INFO — chave vaza (PIX-004).
