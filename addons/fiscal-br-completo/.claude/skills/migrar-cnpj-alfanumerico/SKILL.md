---
name: migrar-cnpj-alfanumerico
description: GUIA de migração para CNPJ alfanumérico (vigor jul/2026) — checklist de banco, regex, máscaras, exemplos em TS e Python. Para VALIDAR de fato, use a skill core `validar-cpf-cnpj` (que já cobre alfanumérico).
owner: fiscal-br-completo
revisado-em: 2026-05-18
status: stable
---

# migrar-cnpj-alfanumerico

> **Para apenas validar um CNPJ alfanumérico**, use a skill core `validar-cpf-cnpj` — ela já cobre o caso. Este guia é para **planejar a migração** do seu sistema antes de jul/2026 (schema do banco, regex, máscaras de input, integrações).

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

Conforme **IN RFB 2.229/2024**, o valor de cada caractere é o **código ASCII menos 48** (`ord(c) - 48`) — **não** uma tabela A=10. Isso mantém `'0'..'9'` → `0..9` e gera, para letras:

```
0=0 .. 9=9
A=17, B=18, C=19, D=20, E=21, F=22, G=23, H=24, I=25,
J=26, K=27, L=28, M=29, N=30, O=31, P=32, Q=33, R=34,
S=35, T=36, U=37, V=38, W=39, X=40, Y=41, Z=42
```

> ⚠️ **I e O não fazem parte da tabela de valores** — eles entram no cálculo normalmente via `ord-48` se aparecerem. A exclusão de I/O vale apenas para a **geração** de novos CNPJs (confusão visual com 1/0), não para o cálculo do DV. Use exatamente o mesmo algoritmo da skill core `validar-cpf-cnpj` — qualquer divergência rejeita CNPJs reais.

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
// Valor oficial IN RFB 2.229/2024: codigo ASCII - 48. Sem tabela A=10.
const valorChar = (c: string): number => c.charCodeAt(0) - 48;

const MULT_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const MULT_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calcularDV(chars: string[], multiplicadores: number[]): number {
  const soma = chars.reduce((acc, c, i) => acc + valorChar(c) * multiplicadores[i], 0);
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
import re

# Valor oficial IN RFB 2.229/2024: codigo ASCII - 48. Sem tabela A=10.
MULT_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
MULT_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

def calcular_dv(chars, multiplicadores):
    soma = sum((ord(c) - 48) * m for c, m in zip(chars, multiplicadores))
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
| `12.ABC.345/01DE-35` | Sim | Exemplo oficial RFB — DV calculado por `ord-48` (confirmado vs skill core) |
| `00000000000000` | Não | Todos iguais |
| `12345678ABC195` | Não | Letras nas posições errôneas (devem estar nos 12 primeiros) |
| `IAB45678000195` | Não | Contém `I` — não emitido pela Receita (formato de input rejeitado) |

## Referências

- Instrução Normativa RFB que regulamentará detalhes finais (acompanhar Receita Federal).
- Skill base do framework: `validar-cpf-cnpj` (já cobre o caso alfanumérico).
