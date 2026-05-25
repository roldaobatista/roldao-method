#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Algoritmo CPF/CNPJ unico — fonte canonica.

Importado por:
- validar-cpf-cnpj/scripts/validar.py
- validar-pix/scripts/validar-pix.py (componente Pix tipo CPF/CNPJ)
- gerar-test-fixture-br/scripts/gerar.py (geracao de fixtures validos)

Antes da auditoria round 11 (2026-05-25), o algoritmo estava triplicado nas
3 skills — divergencia futura era questao de tempo. Esta lib consolida.

CNPJ alfanumerico entra em vigor em 2026-07 (IN RFB 2.229/2024).
A partir daquela data, os 12 primeiros caracteres podem conter letras
maiusculas (A-Z). Os 2 ultimos sao sempre digitos verificadores calculados
sobre `ord(c) - 48` (ord de '0').

Compatibilidade: CNPJs antigos (so digitos) continuam validos com o mesmo
algoritmo, ja que `ord(c) - 48` para '0'-'9' devolve o valor numerico
original.
"""

import re


def so_digitos(s: str) -> str:
    """Mantem apenas digitos do input."""
    return "".join(c for c in s if c.isdigit())


def alfanum_cnpj(s: str) -> str:
    """Mantem apenas digitos e letras maiusculas. Minusculas viram maiusculas."""
    return "".join(c for c in s.upper() if c.isalnum())


def calc_dv(numeros: str, pesos: list[int]) -> int:
    """Calcula DV modulo 11 com pesos. Aceita digitos e letras maiusculas (ord-48)."""
    soma = sum((ord(n) - 48) * p for n, p in zip(numeros, pesos))
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def valida_cpf(cpf: str) -> tuple[bool, str]:
    """Valida CPF (11 digitos). Retorna (ok, mensagem)."""
    d = so_digitos(cpf)
    if len(d) != 11:
        return False, "CPF deve ter 11 digitos"
    if d == d[0] * 11:
        return False, "sequencia repetida"
    dv1 = calc_dv(d[:9], list(range(10, 1, -1)))
    if dv1 != int(d[9]):
        return False, "1o digito verificador errado"
    dv2 = calc_dv(d[:10], list(range(11, 1, -1)))
    if dv2 != int(d[10]):
        return False, "2o digito verificador errado"
    return True, "CPF"


def valida_cnpj(cnpj: str) -> tuple[bool, str]:
    """Valida CNPJ numerico (legado) e alfanumerico (a partir de 2026-07).

    Estrutura: 14 caracteres = 12 alfanumericos (base) + 2 digitos (DV).
    """
    s = alfanum_cnpj(cnpj)
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
    dv1 = calc_dv(base, pesos1)
    if dv1 != int(dvs[0]):
        return False, "1o digito verificador errado"
    dv2 = calc_dv(base + dvs[0], pesos2)
    if dv2 != int(dvs[1]):
        return False, "2o digito verificador errado"
    tipo = "CNPJ alfanumerico" if any(c.isalpha() for c in base) else "CNPJ"
    return True, tipo


def detectar_tipo(raw: str) -> str:
    """Heuristica simples: letra -> CNPJ alfanumerico; senao decide por contagem."""
    if any(c.isalpha() for c in raw):
        return "cnpj"
    d = so_digitos(raw)
    if len(d) == 11:
        return "cpf"
    if len(d) == 14:
        return "cnpj"
    return "?"


def gerar_cpf(base_9: str) -> str:
    """Gera CPF valido a partir dos 9 digitos base (calcula 2 DVs)."""
    d = so_digitos(base_9)
    if len(d) != 9:
        raise ValueError(f"base deve ter 9 digitos, recebido {len(d)}")
    dv1 = calc_dv(d, list(range(10, 1, -1)))
    dv2 = calc_dv(d + str(dv1), list(range(11, 1, -1)))
    return d + str(dv1) + str(dv2)


def gerar_cnpj(base_12: str) -> str:
    """Gera CNPJ valido (numerico ou alfanumerico) a partir dos 12 chars base."""
    s = alfanum_cnpj(base_12)
    if len(s) != 12 or not re.fullmatch(r"[0-9A-Z]{12}", s):
        raise ValueError(f"base deve ter 12 caracteres [0-9A-Z], recebido {s}")
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6] + pesos1
    dv1 = calc_dv(s, pesos1)
    dv2 = calc_dv(s + str(dv1), pesos2)
    return s + str(dv1) + str(dv2)
