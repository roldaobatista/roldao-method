#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida PIS/PASEP/NIS brasileiro (11 dígitos, módulo 11)."""

import sys

# Força UTF-8 no I/O para evitar corrupção de acentos em Windows (cp1252).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PESOS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]


def _digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def valida(s: str) -> tuple[bool, str]:
    d = _digitos(s)
    if len(d) != 11:
        return False, "formato esperado: 11 dígitos"
    if d == d[0] * 11:
        return False, "PIS/PASEP/NIS inválido (todos dígitos iguais)"
    soma = sum(int(d[i]) * PESOS[i] for i in range(10))
    resto = soma % 11
    dv = 0 if resto < 2 else 11 - resto
    if int(d[10]) != dv:
        return False, "DV de PIS/PASEP/NIS inválido"
    return True, "PIS/PASEP/NIS válido"


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: validar-pis.py <pis>", file=sys.stderr)
        return 2
    ok, msg = valida(sys.argv[1])
    print(f"{'OK' if ok else 'INVÁLIDO'} {msg}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
