---
name: validar-pix
description: Valida chave Pix (CPF, CNPJ, email, telefone E.164, aleatoria UUID) e identificadores Pix (EndToEndId, TxId). Use sempre que receber, salvar ou exibir chave/identificador Pix.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
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
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-pix.py --txid-cob ABCDEFGHIJKLMNOPQRSTUVWXYZ1234   # cobrança cob/cobv: exige 26-35
```
> **Windows:** substitua `python3` por `python` (o instalador oficial do Python no Windows cria apenas `python.exe`). No Git Bash, `python3` so existe via alias do user.


Retorna exit 0 + `OK <tipo>` se valido, exit 1 + `INVALIDO <motivo>` se nao.

## IDs canonicos Pix (REGRAS-INEGOCIAVEIS.md)

Reflete fielmente `REGRAS-INEGOCIAVEIS.md` — citar em commit/ADR/PR pelos mesmos IDs.

- **PIX-001 — Idempotencia por TxId em criacao de cobranca.** TxId deterministico (hash do pedido) + Idempotency-Key + lock distribuido + UNIQUE no banco. Combinar camadas e a unica defesa contra dupla cobranca. Detalhes operacionais no agente `pix-arch` do addon `fintech-br`.
- **PIX-002 — Webhook valida assinatura na primeira linha do handler.** HMAC + IP de origem validados ANTES de qualquer logica de negocio. Falha → 401 imediato. No addon `fintech-br`, o hook `validate-webhook-signature.js` bloqueia handler que pula validacao.
- **PIX-003 — EndToEndId persistido em coluna indexada.** Pivo unico de conciliacao financeira (extrato bancario ↔ pedido). Matching por nome+valor e proibido. Coluna indexada, idealmente UNIQUE.
- **PIX-004 — Chave Pix e dado pessoal (LGPD-001 + LGPD-004).** Logs nao podem vazar chave Pix completa em texto puro. Mascarar (`***@***`, `***.***.***-99`). Acesso logado e auditado. Esta skill ja entrega helper de mascaramento embutido — ver secao "Mascaramento" abaixo.
- **PIX-005 — URL do PSP/Bacen via env (SEC-005).** `BACEN_BASE_URL`, `PSP_BASE_URL` vem de variavel de ambiente — sandbox ↔ producao sem deploy. Hardcoded chamando producao em teste e incidente. Hook `no-hardcoded-env-urls.js` bloqueia.

## Outros pontos operacionais (sem ID canonico no core — viram regra so quando relevante ao seu projeto)

- **MED (Mecanismo Especial de Devolucao).** Devolucao por fraude tem prazo (em regra 80 dias). Implementar trilha de auditoria (LGPD-004) e endpoint de tratamento dedicado. Vive no addon `fintech-br` quando voce integrar fluxo de fraude.
- **DICT — consulta nao e cache permanente.** Chave Pix pode trocar de dono. Reconsultar antes de pagar grande valor; mas BACEN cobra cota, entao nao reconsultar a cada exibicao.
- **Pix Automatico (recorrencia).** Exige consentimento ativo do pagador (CDC + LGPD-007). Modelar como entidade separada, com revogacao livre.
- **Limites operacionais.** Pix noturno limitado a R$ 1.000 por padrao (cliente pode alterar). Validacao de negocio respeita o limite vigente, nao um numero hardcoded.

## Mascaramento (LGPD-004 + PIX-004) — obrigatorio antes de logar

Chave Pix e dado pessoal (PIX-004). Hook `no-log-pix-key.js` bloqueia log com chave em texto puro. Use esta tabela quando precisar imprimir:

| Tipo               | Original                      | Mascarado p/ log              |
|--------------------|-------------------------------|-------------------------------|
| CPF                | `12345678909`                 | `***.***.***-09`              |
| CNPJ numerico      | `12345678000190`              | `**.***.***/0001-90`          |
| CNPJ alfanumerico  | `12ABC34501DE35`              | `**.***.***/01DE-35`          |
| Email              | `cliente@exemplo.com.br`      | `c***@e***.com.br`            |
| Telefone E.164     | `+5511987654321`              | `+55 11 *****-4321`           |
| UUID (chave aleat) | `e5f9b...d3a1`                | `e5f9****d3a1`                |
| EndToEndId         | `E1234567820260524123456abcde` | `E1234567...abcde`           |

Helper Python pronto (copie pro projeto se nao quiser implementar do zero):

```python
def mascarar_chave_pix(chave: str, tipo: str) -> str:
    if not chave: return ""
    if tipo == "cpf":    return f"***.***.***-{chave[-2:]}"
    if tipo == "cnpj":   return f"**.***.***/{chave[-6:-2]}-{chave[-2:]}"
    if tipo == "email":
        u, _, d = chave.partition("@")
        return f"{u[0]}***@{d[0]}***" + d[d.find('.'):]
    if tipo == "telefone": return f"{chave[:3]} {chave[3:5]} *****-{chave[-4:]}"
    if tipo == "uuid":     return f"{chave[:4]}****{chave[-4:]}"
    if tipo == "e2eid":    return f"{chave[:8]}...{chave[-5:]}"
    return "***"
```

Regra de bolso: **se cabe no log de producao, cabe na tela de suporte — e tela de suporte nao mostra chave inteira**.

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
