#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida CNH brasileira (11 digitos, algoritmo Detran)."""

import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _so_digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def validar(cnh: str) -> tuple[bool, str]:
    d = _so_digitos(cnh)
    if len(d) != 11:
        return False, f"CNH deve ter 11 digitos, recebido {len(d)}"
    if len(set(d)) == 1:
        return False, "CNH com todos os digitos iguais nao eh valido"

    # DV1: pesos 9..1 sobre digitos 1-9
    soma1 = sum(int(d[i]) * (9 - i) for i in range(9))
    dsc = 0
    dv1 = soma1 % 11
    if dv1 > 9:
        dv1 = 0
        dsc = 2

    # DV2: pesos 1..9 sobre digitos 1-9, subtrai dsc
    soma2 = sum(int(d[i]) * (i + 1) for i in range(9))
    dv2 = (soma2 % 11) - dsc
    if dv2 < 0:
        dv2 += 11
    if dv2 > 9:
        dv2 = 0

    if int(d[9]) != dv1 or int(d[10]) != dv2:
        return False, f"DV invalido (esperado {dv1}{dv2}, recebido {d[9:]})"
    return True, d


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print("uso: validar.py <cnh-11-digitos>", file=sys.stderr)
        return 2
    cnh = "".join(args)
    ok, info = validar(cnh)
    if ok:
        print(f"OK {info}")
        return 0
    print(f"INVALIDO {info}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
