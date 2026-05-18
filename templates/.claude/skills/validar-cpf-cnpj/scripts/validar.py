#!/usr/bin/env python3
"""Valida CPF/CNPJ com dígito verificador."""

import sys


def _digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def _calc_dv(numeros: str, pesos: list[int]) -> int:
    soma = sum(int(n) * p for n, p in zip(numeros, pesos))
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def valida_cpf(cpf: str) -> tuple[bool, str]:
    d = _digitos(cpf)
    if len(d) != 11:
        return False, "CPF deve ter 11 dígitos"
    if d == d[0] * 11:
        return False, "sequência repetida"
    dv1 = _calc_dv(d[:9], list(range(10, 1, -1)))
    if dv1 != int(d[9]):
        return False, "1º dígito verificador errado"
    dv2 = _calc_dv(d[:10], list(range(11, 1, -1)))
    if dv2 != int(d[10]):
        return False, "2º dígito verificador errado"
    return True, "CPF"


def valida_cnpj(cnpj: str) -> tuple[bool, str]:
    d = _digitos(cnpj)
    if len(d) != 14:
        return False, "CNPJ deve ter 14 dígitos"
    if d == d[0] * 14:
        return False, "sequência repetida"
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6] + pesos1
    dv1 = _calc_dv(d[:12], pesos1)
    if dv1 != int(d[12]):
        return False, "1º dígito verificador errado"
    dv2 = _calc_dv(d[:13], pesos2)
    if dv2 != int(d[13]):
        return False, "2º dígito verificador errado"
    return True, "CNPJ"


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: validar.py <cpf-ou-cnpj> | -", file=sys.stderr)
        return 2
    arg = sys.argv[1]
    raw = sys.stdin.readline().strip() if arg == "-" else arg
    digitos = _digitos(raw)
    if len(digitos) == 11:
        ok, msg = valida_cpf(raw)
    elif len(digitos) == 14:
        ok, msg = valida_cnpj(raw)
    else:
        print(f"INVALIDO precisa 11 (CPF) ou 14 (CNPJ) dígitos, recebido {len(digitos)}")
        return 1
    if ok:
        print(f"OK {msg}")
        return 0
    print(f"INVALIDO {msg}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
