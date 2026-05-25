---
name: validar-titulo-eleitor
description: Valida titulo de eleitor brasileiro (12 digitos, com 2 DVs por modulo 11) usando algoritmo oficial do TSE. Use ao receber titulo de eleitor em onboarding, KYC, cadastro de eleitor, doacao eleitoral ou identificacao alternativa quando CPF nao foi exigido.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-25
status: stable
---

# validar-titulo-eleitor

Valida titulo de eleitor brasileiro do TSE — formato (12 digitos) + UF (2 digitos centrais) + 2 digitos verificadores por modulo 11.

## Regras

- **12 digitos.** Formato: `NNNNNNNNUFDV` (8 sequencial + 2 UF + 2 DV).
- **UF codificada.** Digitos 9-10 codificam a UF (01=SP, 02=MG, 03=RJ, ..., 28=ZZ — eleitor no exterior). Tabela oficial em `https://www.tse.jus.br/`.
- **DVs por modulo 11.** Pesos do 1º DV: 2..9 a partir da esquerda (digitos 1-8). Pesos do 2º DV: 7,8,9 (digitos 9-10) + 1º DV.
- **Mascara de exibicao:** `XXXX XXXX XXXX`.

## Como invocar

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py 1234 5678 9012
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py 123456789012
```

> **Windows:** `python` em vez de `python3`.

Saida: `OK <digitos> UF=<sigla>` ou `INVALIDO <motivo>`.

## Boas praticas

- Salvar como `VARCHAR(12)` (mantem zeros a esquerda).
- Mascarar em log: `**** **** **12` — titulo eleitoral identifica indiretamente (LGPD-001 + LGPD-004).
- Nao usar como identificador principal em sistema corporativo — CPF e mais universal.
- KYC: titulo de eleitor + foto = identificacao razoavel quando CPF/RG nao foi exigido (ex: pesquisa publica, doacao eleitoral conforme Lei 9.504/97).

## Anti-padroes

- "Validar titulo como CPF" — sao 11 vs 12 digitos, algoritmos diferentes.
- Hardcode `000000000000` em fixture — gerar por algoritmo.
- Aceitar titulo de UF que nao existe (codigo 29-99 sao reservados ou invalidos).
