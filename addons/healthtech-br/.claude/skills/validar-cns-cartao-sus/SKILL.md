---
name: validar-cns-cartao-sus
description: Valida CNS (Cartao Nacional de Saude) brasileiro — 15 digitos com algoritmo proprio (modulo 11). CNS comeca com 1, 2, 7, 8 ou 9. Use ao receber CNS de formulario, importacao de paciente ou integracao com DataSUS/CADSUS.
status: draft
revisado-em: 2026-05-24
---

# validar-cns-cartao-sus

> **Status: STUB.** Skill em esqueleto — algoritmo módulo 11 do CNS ainda não implementado. Estimativa: v0.2 do addon.

## O que faz (quando estiver pronto)

Recebe um CNS (15 dígitos) e retorna:
- `valido: true | false`
- `tipo: definitivo | provisorio` (CNS começa com 1/2 = definitivo; 7/8/9 = provisório)
- `mensagem: <razão da falha em PT-BR>`

## Algoritmo (referência)

CNS de 15 dígitos. Validação:

1. Se primeiro dígito ∈ {1, 2}: CNS definitivo. Primeiros 11 dígitos = PIS/PASEP do titular. DV calculado por módulo 11 com multiplicadores 15..1.
2. Se primeiro dígito ∈ {7, 8, 9}: CNS provisório. Soma ponderada de todos os 15 dígitos × pesos 15..1 deve ser múltiplo de 11.
3. Se primeiro dígito ∈ outros: inválido.

Referência: DataSUS — Documentação técnica do Cartão Nacional de Saúde (cadsus.saude.gov.br).

## Quando usar

- Cadastro de paciente em PEP, agenda, telemedicina
- Importação de planilha do RH (servidor público de saúde)
- Integração com CADSUS (cadastro nacional)
- Faturamento SUS

## Quando NÃO usar

- CNS válido pelo algoritmo NÃO garante que o cartão existe no CADSUS — só que os dígitos são consistentes. Pra confirmar existência: consulta CADSUS (skill futura).

## Implementação pendente

```python
# scripts/validar-cns.py (a criar)
import sys

def validar_cns(cns: str) -> dict:
    cns = ''.join(c for c in cns if c.isdigit())
    if len(cns) != 15:
        return {"valido": False, "mensagem": "CNS deve ter 15 digitos"}
    primeiro = cns[0]
    if primeiro in ('1', '2'):
        # TODO: validacao definitiva via PIS/PASEP + DV modulo 11
        return {"valido": False, "mensagem": "validacao definitiva nao implementada (v0.2)"}
    if primeiro in ('7', '8', '9'):
        # TODO: soma ponderada multiplos de 11
        return {"valido": False, "mensagem": "validacao provisoria nao implementada (v0.2)"}
    return {"valido": False, "mensagem": "CNS deve comecar com 1, 2, 7, 8 ou 9"}
```

## Aderente a

HEALTH-EXT-006, LGPD-001, FISCAL-005 (dado pessoal brasileiro com algoritmo de validação local).
