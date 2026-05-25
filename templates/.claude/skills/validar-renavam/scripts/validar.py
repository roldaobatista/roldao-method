#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida RENAVAM brasileiro (11 digitos atuais, padroniza < 11 com zfill, mod 11)."""

import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PESOS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]


def _so_digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def validar(renavam: str) -> tuple[bool, str]:
    d = _so_digitos(renavam)
    if len(d) < 9 or len(d) > 11:
        return False, f"RENAVAM deve ter 9 a 11 digitos, recebido {len(d)}"
    d = d.zfill(11)
    if len(set(d)) == 1:
        return False, "RENAVAM com todos os digitos iguais nao eh valido"

    base = d[:10]
    dv_informado = int(d[10])

    total = sum(int(base[i]) * PESOS[i] for i in range(10))
    resto = total % 11
    dv = 11 - resto
    if dv >= 10:
        dv = 0

    if dv != dv_informado:
        return False, f"DV invalido (esperado {dv}, recebido {dv_informado})"
    return True, d


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print("uso: validar.py <renavam>", file=sys.stderr)
        return 2
    ok, info = validar("".join(args))
    if ok:
        print(f"OK {info}")
        return 0
    print(f"INVALIDO {info}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
