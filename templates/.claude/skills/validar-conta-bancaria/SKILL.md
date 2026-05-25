---
name: validar-conta-bancaria
description: Valida agencia + conta bancaria brasileira (BACEN) — formato por banco (numero ISPB + variacoes corrente/poupanca/digital). Use ao receber dados bancarios em cadastro de fornecedor, folha de pagamento, TED, debito automatico ou cadastro de Pix por chave-conta. NAO valida saldo nem existencia — apenas estrutura.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-25
status: stable
---

# validar-conta-bancaria

Valida estrutura de agencia + conta por banco BR (formato + DV opcional quando o banco usa).

## Regras gerais

- **Banco identificado por codigo COMPE (3 digitos)** ou ISPB (8 digitos) — Bacen mantem lista oficial.
- **Agencia:** 4 digitos (com ou sem DV). Alguns bancos digitais nao usam agencia (`0001` fixo).
- **Conta:** 4 a 12 digitos, com DV final. Cada banco tem seu algoritmo (mod 10, mod 11, ou hash proprio).
- **Digital (Nubank, C6, Inter, etc.):** geralmente agencia `0001` + conta longa, sem DV separado.

## Bancos cobertos com algoritmo de DV

| Codigo | Banco | Algoritmo DV |
|---|---|---|
| 001 | Banco do Brasil | Mod 11 (pesos 9..2) |
| 033 | Santander | Algoritmo proprio (Resolucao 1.401) — heuristico |
| 104 | Caixa Economica | Mod 11 (pesos 8..2) por operacao+conta |
| 237 | Bradesco | Mod 11 (pesos 2..7 cicliclo) |
| 341 | Itau | Mod 10 (pesos 2,1 alternando) |
| 260 | Nubank | Sem DV externo (validacao via consulta Pix/PSP) |
| 077 | Inter | Sem DV externo |
| 336 | C6 | Sem DV externo |

Demais bancos: validacao formal (formato 4-12 digitos), sem DV.

## Como invocar

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py 001 1234 56789-0
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py 341 0001 12345-6
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py 260 0001 1234567890
```

> **Windows:** `python` em vez de `python3`.

Saida JSON: `{"banco":"BB","valido":true,"normalizada":"00001234-00056789-0"}`.

## Boas praticas

- Salvar agencia e conta em colunas separadas, `VARCHAR` (preserva zeros a esquerda).
- Salvar DV em coluna propria — busca por conta sem DV deve funcionar.
- Para transferencia real, validar via consulta Pix/STR — algoritmo so previne erro de digitacao.
- LGPD: agencia + conta + nome = dado financeiro (LGPD-001, base legal forte exigida).
- Conta corrente compartilhada: salvar 1 registro por titular.

## Anti-padroes

- Aceitar conta `00000-0` em fixture sem validar DV — gerar valida por algoritmo.
- Assumir formato unico — Itau e BB nao tem o mesmo numero de digitos.
- Validar via regex sem checar DV quando o banco tem — dispara TED que volta com erro.
