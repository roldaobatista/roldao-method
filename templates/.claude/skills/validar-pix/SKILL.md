---
name: validar-pix
description: Valida chave Pix (CPF, CNPJ, email, telefone E.164, aleatoria UUID) e identificadores Pix (EndToEndId, TxId). Use sempre que receber, salvar ou exibir chave/identificador Pix.
owner: framework
revisado-em: 2026-05-18
status: stable
---

# validar-pix

Skill para validar chaves Pix e identificadores oficiais do BACEN.

## Tipos de chave Pix (DICT)

| Tipo | Formato | Exemplo |
|---|---|---|
| CPF | 11 digitos, dv valido | `123.456.789-09` |
| CNPJ | 14 caracteres (numerico ou alfanumerico apos jul/2026), dv valido | `12.345.678/0001-90` |
| Email | RFC 5322 simplificado, lowercase no DICT | `cliente@empresa.com.br` |
| Telefone | E.164 BR | `+5511987654321` |
| Aleatoria | UUID v4 (8-4-4-4-12 hex; 3o grupo comeca com 4, 4o com [89ab]) | `123e4567-e89b-42d3-a456-426614174000` |

## Identificadores oficiais

- **EndToEndId** (E2EID): 32 caracteres, formato `E + ISPB(8) + AAAAMMDDHHmm(12) + serial(11)`. Imutavel. Idempotencia obrigatoria (PIX-001).
- **TxId**: 26 a 35 caracteres alfanumericos (`[a-zA-Z0-9]{26,35}`) para cobrancas `cob`/`cobv` (Manual de Padroes Pix, secao TxId). Para Pix manual avulso, 1 a 35 e tolerado. Gerado pelo recebedor. Unico por cobranca.
- **ISPB**: 8 digitos (cadastrado no BACEN).

## Como invocar

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-pix.py <chave>
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-pix.py --e2eid E12345678202607011234ABC12345678
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-pix.py --txid abc123XYZ
```
> **Windows:** substitua `python3` por `python` (o instalador oficial do Python no Windows cria apenas `python.exe`). No Git Bash, `python3` so existe via alias do user.


Retorna exit 0 + `OK <tipo>` se valido, exit 1 + `INVALIDO <motivo>` se nao.

## Boas praticas Pix (PIX-001 a PIX-005, ligadas a REGRAS-INEGOCIAVEIS)

- **PIX-001 — Idempotencia obrigatoria.** Devolucao, conciliacao e retry usam EndToEndId. Nunca processar 2x o mesmo E2EID.
- **PIX-002 — MED (Mecanismo Especial de Devolucao).** Devolucao por fraude tem prazo (geralmente 80 dias). Implementar trilha de auditoria (LGPD-004).
- **PIX-003 — DICT consulta nao e cache permanente.** Chave pode trocar de dono. Reconsultar antes de pagar grande valor.
- **PIX-004 — Pix Automatico (2025-2026).** Recorrencia exige consentimento ativo do pagador (CDC + LGPD-007). Modelar como entidade separada.
- **PIX-005 — Limites operacionais.** Pix noturno limitado a R$ 1.000 por padrao (cliente pode mudar). Validacoes de negocio respeitam.

## Salvar no banco

- Email: lowercase, trim.
- Telefone: E.164 (`+5511...`), nao mascarado.
- CPF/CNPJ: so digitos/alfanumericos limpos.
- UUID: lowercase, sem `{}`.
- EndToEndId: maiuscula, exato como recebido.

## Anti-padroes

- Aceitar chave sem validar dv (CPF/CNPJ).
- Tratar telefone BR sem `+55`.
- Reconsultar DICT a cada exibicao (cota cara, BACEN cobra).
- Logar chave Pix em texto puro em log publico (LGPD-001).
