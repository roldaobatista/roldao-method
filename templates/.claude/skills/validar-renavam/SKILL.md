---
name: validar-renavam
description: Valida RENAVAM (Registro Nacional de Veiculos Automotores) — 11 digitos com 1 DV por modulo 11, algoritmo Denatran. Use ao receber RENAVAM em cadastro de veiculo, transferencia, seguro auto, frota, multas, IPVA.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-25
status: stable
---

# validar-renavam

Valida RENAVAM brasileiro (11 digitos atuais; ate 2020 eram 9 ou 10 — padroniza com zfill).

## Regras

- **11 digitos.** Codigo unico nacional do veiculo, persiste mesmo trocando estado/dono.
- **DV (1 digito).** Pesos 3,2,9,8,7,6,5,4,3,2 sobre os 10 primeiros (apos zfill). Modulo 11. Subtrai resto de 11. Se >= 10, DV = 0.
- **Padronizacao:** se input tem 9 ou 10 digitos, completa com zero a esquerda (RENAVAMs antigos antes de 2020 tinham menos digitos).

## Como invocar

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py 12345678900
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py 1234567890  # padroniza p/ 11 com zfill
```

> **Windows:** `python` em vez de `python3`.

Saida: `OK <11-digitos>` ou `INVALIDO <motivo>`.

## Boas praticas

- Salvar como `VARCHAR(11)` (zfill aplicado antes de gravar).
- Em frota, indexar por RENAVAM + placa — RENAVAM e estavel, placa muda.
- LGPD: RENAVAM ligado a CPF do proprietario = dado pessoal indireto.
- Multas, IPVA, transferencia: SEMPRE RENAVAM, nao placa (placa muda com Mercosul ou venda).

## Anti-padroes

- Aceitar RENAVAM de 9 ou 10 digitos sem normalizar — quebra busca futura.
- Confundir RENAVAM com chassi (17 caracteres alfanumericos).
- Hardcode `00000000000` em fixture — gerar valido por algoritmo.
