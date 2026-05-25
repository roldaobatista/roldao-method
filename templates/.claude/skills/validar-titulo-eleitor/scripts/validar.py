#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida titulo de eleitor brasileiro (TSE, 12 digitos, mod 11)."""

import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Codigo TSE de UF -> sigla. Codigo 28 = ZZ (eleitor no exterior).
UF_POR_CODIGO = {
    "01": "SP", "02": "MG", "03": "RJ", "04": "RS", "05": "BA", "06": "PR",
    "07": "CE", "08": "PE", "09": "SC", "10": "GO", "11": "MA", "12": "PB",
    "13": "PA", "14": "ES", "15": "PI", "16": "RN", "17": "AL", "18": "MT",
    "19": "MS", "20": "DF", "21": "SE", "22": "AM", "23": "RO", "24": "AC",
    "25": "AP", "26": "RR", "27": "TO", "28": "ZZ",
}


def _so_digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def calcular_dv1(seq8: str) -> int:
    """DV1: pesos 2..9 sobre digitos 1-8."""
    total = sum(int(d) * peso for d, peso in zip(seq8, range(2, 10)))
    resto = total % 11
    if resto == 10:
        return 0
    return resto


def calcular_dv2(uf2: str, dv1: int) -> int:
    """DV2: pesos 7,8,9 sobre digitos 9,10,DV1."""
    total = int(uf2[0]) * 7 + int(uf2[1]) * 8 + dv1 * 9
    resto = total % 11
    if resto == 10:
        return 0
    return resto


def validar(titulo: str) -> tuple[bool, str]:
    d = _so_digitos(titulo)
    if len(d) < 10 or len(d) > 13:
        return False, f"titulo deve ter 12 digitos (com zeros a esquerda), recebido {len(d)}"
    # Pad pra 12 (titulos antigos com menos digitos sao normalizados com zeros)
    d = d.zfill(12)
    seq, uf, dvs = d[:8], d[8:10], d[10:]
    if uf not in UF_POR_CODIGO:
        return False, f"codigo de UF invalido: {uf} (validos 01-28)"
    esperado_dv1 = calcular_dv1(seq)
    esperado_dv2 = calcular_dv2(uf, esperado_dv1)
    if int(dvs[0]) != esperado_dv1 or int(dvs[1]) != esperado_dv2:
        return False, f"DV invalido (esperado {esperado_dv1}{esperado_dv2}, recebido {dvs})"
    return True, f"{d} UF={UF_POR_CODIGO[uf]}"


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print("uso: validar.py <titulo-eleitor>", file=sys.stderr)
        return 2
    titulo = "".join(args)
    ok, info = validar(titulo)
    if ok:
        print(f"OK {info}")
        return 0
    print(f"INVALIDO {info}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
