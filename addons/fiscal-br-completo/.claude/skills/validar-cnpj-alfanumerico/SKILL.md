---
name: validar-cnpj-alfanumerico
description: Valida CNPJ alfanumerico (vigor jul/2026) — algoritmo modulo 11 com mapeamento de letras pra valores numericos. Use ao salvar, indexar ou consultar CNPJ em sistema BR pos-2026.
---

# validar-cnpj-alfanumerico

A partir de **julho/2026**, novos CNPJs podem ter letras nos 12 primeiros caracteres (A-Z, exceto I e O pra evitar confusão visual). Os 2 últimos dígitos (DV) permanecem **numéricos**.

## Por que isso importa

- Sistemas com `VARCHAR(14)` e regex `[0-9]{14}` **vão quebrar** ao receber CNPJ com letra.
- Algoritmo de DV precisa converter cada caractere alfanumérico pra valor numérico antes do módulo 11.
- Coluna do banco continua `VARCHAR(14)` — **não converter pra `BIGINT`**.

## Formato

- **Total**: 14 caracteres.
- **Caracteres 1-12**: alfanuméricos (0-9, A-H, J-N, P-Z). Excluídos: I, O.
- **Caracteres 13-14**: dígitos verificadores numéricos (0-9).

## Mapeamento alfanumérico → valor numérico

Para cálculo do DV, cada caractere é convertido conforme tabela:

```
0=0, 1=1, ..., 9=9
A=10, B=11, C=12, D=13, E=14, F=15, G=16, H=17,
J=18, K=19, L=20, M=21, N=22,
P=23, Q=24, R=25, S=26, T=27, U=28, V=29, W=30, X=31, Y=32, Z=33
```

(I e O são excluídos pra evitar confusão com 1 e 0.)

## Algoritmo do DV (módulo 11)

Igual ao CNPJ numérico, mas aplicado sobre **valores numéricos derivados** dos caracteres.

```
Multiplicadores DV1: 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
Multiplicadores DV2: 6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2

soma = sum(valor[i] * mult[i] for i in 0..11)
resto = soma % 11
DV1 = 0 if resto < 2 else 11 - resto

(repetir incluindo DV1 e mult DV2 → DV2)
```

## Implementação (TypeScript)

```typescript
const MAPA: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
  'J': 18, 'K': 19, 'L': 20, 'M': 21, 'N': 22,
  'P': 23, 'Q': 24, 'R': 25, 'S': 26, 'T': 27, 'U': 28, 'V': 29, 'W': 30, 'X': 31, 'Y': 32, 'Z': 33,
};

const MULT_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const MULT_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calcularDV(chars: string[], multiplicadores: number[]): number {
  const soma = chars.reduce((acc, c, i) => acc + (MAPA[c] ?? -1) * multiplicadores[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function validarCNPJAlfanumerico(cnpj: string): boolean {
  // normaliza: remove pontuacao, deixa maiusculo
  const limpo = cnpj.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  if (limpo.length !== 14) return false;

  // valida que so usa caracteres permitidos
  if (!/^[0-9A-HJ-NP-Z]{12}[0-9]{2}$/.test(limpo)) return false;

  // rejeita 14 chars iguais (00000000000000, AAAAAAAAAAAA00, etc.)
  if (/^(.)\1{13}$/.test(limpo)) return false;

  const chars = limpo.split('');
  const dv1Calc = calcularDV(chars.slice(0, 12), MULT_DV1);
  if (parseInt(chars[12], 10) !== dv1Calc) return false;

  const dv2Calc = calcularDV(chars.slice(0, 13), MULT_DV2);
  if (parseInt(chars[13], 10) !== dv2Calc) return false;

  return true;
}
```

## Implementação (Python)

```python
MAPA = {
    **{str(i): i for i in range(10)},
    **{c: i + 10 for i, c in enumerate("ABCDEFGH")},
    **{c: i + 18 for i, c in enumerate("JKLMN")},
    **{c: i + 23 for i, c in enumerate("PQRSTUVWXYZ")},
}

MULT_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
MULT_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

import re

def calcular_dv(chars, multiplicadores):
    soma = sum(MAPA[c] * m for c, m in zip(chars, multiplicadores))
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto

def validar_cnpj_alfanumerico(cnpj: str) -> bool:
    limpo = re.sub(r'[^0-9A-Za-z]', '', cnpj).upper()
    if len(limpo) != 14:
        return False
    if not re.match(r'^[0-9A-HJ-NP-Z]{12}\d{2}$', limpo):
        return False
    if re.match(r'^(.)\1{13}$', limpo):
        return False

    chars = list(limpo)
    dv1 = calcular_dv(chars[:12], MULT_DV1)
    if int(chars[12]) != dv1:
        return False

    dv2 = calcular_dv(chars[:13], MULT_DV2)
    if int(chars[13]) != dv2:
        return False

    return True
```

## Auditoria de migração

Checklist para preparar sistema **antes** de jul/2026:

- [ ] Coluna CNPJ é `VARCHAR(14)` em todas as tabelas (não `BIGINT`, não `INT`, não `CHAR(14)` com índice numérico).
- [ ] Validação atual aceita só números? Substituir pela versão alfanumérica.
- [ ] Regex no front-end (`pattern="[0-9]{14}"`) precisam virar `pattern="[0-9A-HJ-NP-Z]{12}[0-9]{2}"`.
- [ ] Máscara de input no front-end aceita letras.
- [ ] Comparação no banco usa exact match — não converte pra número.
- [ ] Logs/relatórios não fazem `parseInt()` em CNPJ.
- [ ] Integrações externas (SEFAZ, parceiros, ERPs) atualizadas.
- [ ] Testes incluem CNPJs alfanuméricos válidos como fixtures sintéticas.

## Casos de teste sintéticos

| CNPJ | Válido? | Por quê |
|---|---|---|
| `12345678000195` | Sim | Numérico legado válido |
| `00000000000000` | Não | Todos iguais |
| `12.AB5.678/0001-95` | Depende | Validar DV — exemplo |
| `12345678ABC195` | Não | Letras nas posições errôneas (deve ser nos 12 primeiros) |
| `IAB45678000195` | Não | Contém `I` (não permitido) |

## Referências

- Instrução Normativa RFB que regulamentará detalhes finais (acompanhar Receita Federal).
- Skill base do framework: `validar-cpf-cnpj` (já cobre o caso alfanumérico).
