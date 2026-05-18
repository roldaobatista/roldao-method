#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida CPF e CNPJ (numerico e alfanumerico) com digito verificador.

CNPJ alfanumerico entra em vigor em 2026-07 (IN RFB 2.229/2024).
A partir daquela data, os 12 primeiros caracteres podem conter letras
maiusculas (A-Z) alem de digitos. Os 2 ultimos sao sempre digitos verificadores
calculados sobre o valor ASCII de cada caractere menos 48 (ord('0')).

Compatibilidade: CNPJs antigos (so digitos) continuam validos com o mesmo
algoritmo, ja que o calculo sobre ord(c)-48 retorna o digito original.
"""

import sys
import re

# Forca UTF-8 no I/O para evitar corrupcao de acentos em Windows (cp1252).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    sys.stdin.reconfigure(encoding="utf-8", errors="replace")


def _digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def _alfanum_cnpj(s: str) -> str:
    """Mantem apenas digitos e letras maiusculas. Letras minusculas sao convertidas."""
    return "".join(c for c in s.upper() if c.isalnum())


def _calc_dv(numeros: str, pesos: list[int]) -> int:
    """Calcula DV. Aceita digitos (0-9) e letras maiusculas (A-Z = 17-42 em ord-48)."""
    soma = sum((ord(n) - 48) * p for n, p in zip(numeros, pesos))
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def valida_cpf(cpf: str) -> tuple[bool, str]:
    d = _digitos(cpf)
    if len(d) != 11:
        return False, "CPF deve ter 11 digitos"
    if d == d[0] * 11:
        return False, "sequencia repetida"
    dv1 = _calc_dv(d[:9], list(range(10, 1, -1)))
    if dv1 != int(d[9]):
        return False, "1o digito verificador errado"
    dv2 = _calc_dv(d[:10], list(range(11, 1, -1)))
    if dv2 != int(d[10]):
        return False, "2o digito verificador errado"
    return True, "CPF"


def valida_cnpj(cnpj: str) -> tuple[bool, str]:
    """Valida CNPJ numerico (legado) e alfanumerico (a partir de 2026-07).

    Estrutura: 14 caracteres = 12 alfanumericos (base) + 2 digitos (DV).
    """
    s = _alfanum_cnpj(cnpj)
    if len(s) != 14:
        return False, "CNPJ deve ter 14 caracteres (12 base + 2 DVs)"
    base = s[:12]
    dvs = s[12:]
    if not dvs.isdigit():
        return False, "os 2 ultimos caracteres do CNPJ devem ser digitos (DV)"
    if not re.fullmatch(r"[0-9A-Z]{12}", base):
        return False, "base do CNPJ aceita apenas 0-9 e A-Z (maiusculas)"
    if base == base[0] * 12:
        return False, "sequencia repetida"
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6] + pesos1
    dv1 = _calc_dv(base, pesos1)
    if dv1 != int(dvs[0]):
        return False, "1o digito verificador errado"
    dv2 = _calc_dv(base + dvs[0], pesos2)
    if dv2 != int(dvs[1]):
        return False, "2o digito verificador errado"
    tipo = "CNPJ alfanumerico" if any(c.isalpha() for c in base) else "CNPJ"
    return True, tipo


def _detectar(raw: str) -> str:
    """Heuristica: se tem letra, e CNPJ alfanumerico; senao decide por contagem."""
    if any(c.isalpha() for c in raw):
        return "cnpj"
    d = _digitos(raw)
    if len(d) == 11:
        return "cpf"
    if len(d) == 14:
        return "cnpj"
    return "?"


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: validar.py <cpf-ou-cnpj> | -", file=sys.stderr)
        return 2
    arg = sys.argv[1]
    raw = sys.stdin.readline().strip() if arg == "-" else arg
    tipo = _detectar(raw)
    if tipo == "cpf":
        ok, msg = valida_cpf(raw)
    elif tipo == "cnpj":
        ok, msg = valida_cnpj(raw)
    else:
        d = _digitos(raw)
        print(f"INVALIDO precisa 11 (CPF) ou 14 (CNPJ) caracteres, recebido {len(d)}")
        return 1
    if ok:
        print(f"OK {msg}")
        return 0
    print(f"INVALIDO {msg}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
