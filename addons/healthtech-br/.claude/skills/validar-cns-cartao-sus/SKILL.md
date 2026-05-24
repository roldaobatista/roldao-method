---
name: validar-cns-cartao-sus
description: Valida CNS (Cartao Nacional de Saude) brasileiro — 15 digitos com algoritmo de modulo 11. CNS definitivo comeca com 1 ou 2 (primeiros 11 digitos = PIS/PASEP). CNS provisorio comeca com 7, 8 ou 9 (soma ponderada total multiplo de 11). Use ao receber CNS em cadastro de paciente, importacao do RH, integracao com CADSUS, faturamento SUS.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: healthtech-br
revisado-em: 2026-05-24
status: stable
---

# validar-cns-cartao-sus

Valida o Cartão Nacional de Saúde brasileiro localmente (sem chamar API). Implementa o algoritmo público do DataSUS.

## O que faz

Recebe um CNS com ou sem máscara e retorna JSON com:
- `valido: true | false`
- `tipo: "definitivo" | "provisorio" | null`
- `mensagem: <razão da falha em PT-BR, ou confirmação>`

## Como usar

```bash
python3 .claude/skills/validar-cns-cartao-sus/scripts/validar-cns.py "100 0000 0000 0007"
# {"valido": true, "tipo": "definitivo", "mensagem": "CNS definitivo valido"}

python3 .claude/skills/validar-cns-cartao-sus/scripts/validar-cns.py "800000000000001"
# {"valido": true, "tipo": "provisorio", "mensagem": "CNS provisorio valido"}

echo "100000000000007" | python3 .claude/skills/validar-cns-cartao-sus/scripts/validar-cns.py -
# le do stdin
```

> **Windows:** `python` em vez de `python3` (ou `py` se usar Python Launcher).

Exit code: 0 se válido, 1 se inválido, 2 se erro de input (faltou argumento).

## Algoritmo

CNS tem 15 dígitos. O primeiro dígito define o tipo:

### CNS definitivo (começa com 1 ou 2)

Primeiros 11 dígitos = PIS/PASEP do titular. Validação:

1. `soma = Σ (PIS[i] × peso[i])` onde pesos vão de 15 a 5 (i de 0 a 10).
2. `resto = soma % 11`.
3. Se `resto == 10`: incrementa soma em 2, recalcula resto, `DV = 11 - resto`, sufixo `"001"`.
4. Senão: `DV = 0` se `resto == 0`, ou `DV = 11 - resto`, sufixo `"000"`.
5. CNS esperado = PIS (11) + sufixo (3) + DV (1) = 15 dígitos.
6. Verificação redundante: soma ponderada total dos 15 dígitos com pesos 15..1 é múltiplo de 11.

### CNS provisório (começa com 7, 8 ou 9)

Validação direta: soma ponderada dos 15 dígitos com pesos 15..1 deve ser múltiplo de 11.

## Quando usar

- Cadastro de paciente em PEP, agenda, telemedicina
- Importação de planilha do RH (servidor público de saúde)
- Integração com CADSUS (cadastro nacional)
- Faturamento SUS
- Validação preventiva ANTES de chamar API DataSUS (economiza chamada se já é matematicamente inválido)

## Quando NÃO usar

- CNS matematicamente válido **NÃO garante** que o cartão existe no CADSUS — só que os dígitos são consistentes. Para confirmar existência: consulta CADSUS (skill futura, depende de credencial do Ministério da Saúde).
- Validação em larga escala (>10k/s) — Python é suficiente, mas para gargalo extremo, portar para Node.

## Limitações conhecidas

- CNS começa com 1 ou 2 (definitivo): o algoritmo cobre os 2 casos do DataSUS (resto < 10 e resto == 10). Casos extremos com `resto == 10` na verificação adicional foram testados manualmente, mas relate qualquer CNS real válido que o validador recuse.
- Não verifica número da via, validade nem nome do titular — só consistência matemática dos 15 dígitos.

## Aderente a

HEALTH-EXT-006, LGPD-001 (CNS é dado pessoal — não logue em texto puro), FISCAL-005 (mesmo princípio de algoritmo de validação local pra dado pessoal brasileiro).

## Referência

DataSUS — Documentação técnica do Cartão Nacional de Saúde. cadsus.saude.gov.br (acessar via gestor do estabelecimento).
