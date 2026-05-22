#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida chave de acesso de NF-e/NFC-e/CT-e/MDF-e/SAT-CF-e (44 digitos).

Estrutura da chave (posicoes 1-based):
  1-2   UF emitente (codigo IBGE)
  3-6   AAMM (ano + mes)
  7-20  CNPJ emitente (so digitos, FISCAL-005 nao se aplica a chave)
  21-22 Modelo (55 NF-e, 65 NFC-e, 57 CT-e, 58 MDF-e, 59 SAT/CF-e, 67 CT-e OS)
  23-25 Serie
  26-34 Numero
  35    tpEmis (1-9, ver tabela SEFAZ)
  36-43 cNF (codigo numerico)
  44    DV (modulo 11)

DV: pesos 2,3,4,5,6,7,8,9 ciclicos da direita pra esquerda sobre os 43 primeiros.
Soma % 11; DV = 0 se resto <= 1, senao 11 - resto.
"""

import sys

# Forca UTF-8 no I/O para evitar corrupcao de acentos em Windows (cp1252).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    sys.stdin.reconfigure(encoding="utf-8", errors="replace")


UFS_IBGE = {
    "11": "RO", "12": "AC", "13": "AM", "14": "RR", "15": "PA", "16": "AP", "17": "TO",
    "21": "MA", "22": "PI", "23": "CE", "24": "RN", "25": "PB", "26": "PE", "27": "AL", "28": "SE", "29": "BA",
    "31": "MG", "32": "ES", "33": "RJ", "35": "SP",
    "41": "PR", "42": "SC", "43": "RS",
    "50": "MS", "51": "MT", "52": "GO", "53": "DF",
}

MODELOS = {
    "55": "NF-e",
    "65": "NFC-e",
    "57": "CT-e",
    "58": "MDF-e",
    "59": "SAT/CF-e",
    "67": "CT-e OS",
}


def _digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def _calc_dv(chave43: str) -> int:
    """Calcula DV modulo 11 da chave (43 primeiros digitos)."""
    pesos_ciclo = [2, 3, 4, 5, 6, 7, 8, 9]
    soma = 0
    for i, c in enumerate(reversed(chave43)):
        peso = pesos_ciclo[i % 8]
        soma += int(c) * peso
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def validar(raw: str) -> tuple[bool, str]:
    d = _digitos(raw)
    if len(d) != 44:
        return False, f"chave precisa ter 44 digitos, recebida com {len(d)}"

    uf = d[0:2]
    aamm = d[2:6]
    cnpj = d[6:20]
    modelo = d[20:22]
    serie = d[22:25]
    numero = d[25:34]
    tp_emis = d[34]
    cnf = d[35:43]
    dv_informado = int(d[43])

    if uf not in UFS_IBGE:
        return False, f"UF {uf} nao e codigo IBGE valido"

    ano = int(aamm[0:2])
    mes = int(aamm[2:4])
    if not (6 <= ano <= 99):
        return False, f"AA={aamm[0:2]} fora da faixa (NF-e existe desde 2006)"
    if not (1 <= mes <= 12):
        return False, f"MM={aamm[2:4]} invalido (deve ser 01-12)"

    if cnpj == "00000000000000":
        return False, "CNPJ zerado"

    if modelo not in MODELOS:
        return False, f"modelo {modelo} desconhecido (esperado 55, 65, 57, 58, 59 ou 67)"

    if tp_emis not in "123456789":
        return False, f"tpEmis {tp_emis} invalido (1-9)"

    dv_calculado = _calc_dv(d[:43])
    if dv_calculado != dv_informado:
        return False, f"DV errado (calculado {dv_calculado}, informado {dv_informado})"

    return True, (
        f"{MODELOS[modelo]} UF={UFS_IBGE[uf]} AAMM={aamm} "
        f"CNPJ={cnpj} modelo={modelo} serie={serie} numero={numero} "
        f"tpEmis={tp_emis} cNF={cnf} DV={dv_informado}"
    )


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: validar.py <chave-44-digitos> | -", file=sys.stderr)
        return 2
    arg = sys.argv[1]
    raw = sys.stdin.readline().strip() if arg == "-" else arg
    ok, msg = validar(raw)
    if ok:
        print(f"OK {msg}")
        return 0
    print(f"INVALIDO {msg}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
