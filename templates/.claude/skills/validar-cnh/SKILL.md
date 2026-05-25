---
name: validar-cnh
description: Valida CNH (Carteira Nacional de Habilitacao) brasileira — 11 digitos com 2 DVs por algoritmo Detran. Use ao receber CNH em cadastro de motorista, frota, locacao, seguro auto, app de mobilidade ou KYC alternativo. Nao valida categoria nem validade — apenas estrutura matematica do numero.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-25
status: stable
---

# validar-cnh

Valida numero de registro de CNH (11 digitos) usando algoritmo oficial Denatran/Detran.

## Regras

- **11 digitos.** Numero unico nacional, vinculado a pessoa (segue ao motorista mesmo trocando de estado).
- **DV1:** soma ponderada dos 9 primeiros digitos por pesos 9..1. Modulo 11. Se resto > 9, DV1 = 0 e marca `dsc = 2` para o calculo do DV2.
- **DV2:** soma ponderada dos 9 primeiros por pesos 1..9. Subtrai `dsc`. Modulo 11. Se < 0, soma 11. Se > 9, DV2 = 0.
- **Mesmo digito repetido** (`11111111111`) bloqueia — invalido por construcao mesmo passando o DV.

## Como invocar

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py 12345678900
```

> **Windows:** `python` em vez de `python3`.

Saida: `OK <11-digitos>` ou `INVALIDO <motivo>`.

## Boas praticas

- Salvar como `VARCHAR(11)` (preserva zeros a esquerda).
- Categoria (A/B/AB/C/D/E) e validade vivem em coluna separada — algoritmo nao valida.
- Mascarar em log: `*********12`.
- CNH e dado pessoal (LGPD-001). Acesso a CNH em larga escala (frota) loga em audit trail (LGPD-004).
- Para frota: validar tambem RENAVAM (skill `validar-renavam`) e placa do veiculo.

## Anti-padroes

- Confundir numero de registro CNH com numero de espelho — sao codigos diferentes.
- Aceitar `00000000000` em fixture — gerar valido por algoritmo.
- Confiar que CNH valida = motorista habilitado — algoritmo so confere matematica, nao consulta Detran.
