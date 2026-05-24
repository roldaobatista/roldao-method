#!/usr/bin/env python3
"""validar-ie.py — Inscricao Estadual brasileira por UF.

Uso:
    python validar-ie.py <UF> <IE>
    python validar-ie.py SP 110042490114
    python validar-ie.py RJ ISENTO

Saida JSON em stdout:
    {"uf": "SP", "valido": true, "normalizado": "110042490114", "metodo": "dv-calculado", "motivo": ""}

Algoritmos cobertos com DV: SP, RJ, RS, SC, BA, PR.
Demais UFs: valida tamanho minimo e formato, retorna metodo="formal-sem-dv".
"""
from __future__ import annotations
import json
import re
import sys


UFS = {
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA",
    "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN",
    "RO", "RR", "RS", "SC", "SE", "SP", "TO",
}


def _so_digitos(s: str) -> str:
    return re.sub(r"[^0-9]", "", s or "")


def _dv_sp(num: str) -> bool:
    # IE-SP 12 digitos. DV1 = posicao 9, DV2 = posicao 12.
    if len(num) != 12:
        return False
    pesos1 = [1, 3, 4, 5, 6, 7, 8, 10]
    soma = sum(int(num[i]) * pesos1[i] for i in range(8))
    dv1 = (soma % 11) % 10
    if dv1 != int(num[8]):
        return False
    pesos2 = [3, 2, 10, 9, 8, 7, 6, 5, 4, 3, 2]
    soma = sum(int(num[i]) * pesos2[i] for i in range(11))
    dv2 = (soma % 11) % 10
    return dv2 == int(num[11])


def _dv_modulo11(num: str, pesos: list[int]) -> int:
    """DV padrao modulo 11. Resto < 2 -> DV = 0, senao DV = 11 - resto."""
    soma = sum(int(num[i]) * pesos[i] for i in range(len(pesos)))
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def _dv_rj(num: str) -> bool:
    # IE-RJ 8 digitos, 1 DV. Pesos [2,7,6,5,4,3,2].
    if len(num) != 8:
        return False
    pesos = [2, 7, 6, 5, 4, 3, 2]
    return _dv_modulo11(num[:7], pesos) == int(num[7])


def _dv_rs(num: str) -> bool:
    # IE-RS 10 digitos. Pesos [2,9,8,7,6,5,4,3,2].
    if len(num) != 10:
        return False
    pesos = [2, 9, 8, 7, 6, 5, 4, 3, 2]
    return _dv_modulo11(num[:9], pesos) == int(num[9])


def _dv_sc(num: str) -> bool:
    # IE-SC 9 digitos. Pesos [9,8,7,6,5,4,3,2].
    if len(num) != 9:
        return False
    pesos = [9, 8, 7, 6, 5, 4, 3, 2]
    return _dv_modulo11(num[:8], pesos) == int(num[8])


def _dv_pr(num: str) -> bool:
    # IE-PR 10 digitos, 2 DVs. Pesos1 [3,2,7,6,5,4,3,2], Pesos2 [4,3,2,7,6,5,4,3,2].
    if len(num) != 10:
        return False
    pesos1 = [3, 2, 7, 6, 5, 4, 3, 2]
    pesos2 = [4, 3, 2, 7, 6, 5, 4, 3, 2]
    if _dv_modulo11(num[:8], pesos1) != int(num[8]):
        return False
    return _dv_modulo11(num[:9], pesos2) == int(num[9])


def _dv_ba(num: str) -> bool:
    # IE-BA 8 ou 9 digitos. Algoritmo varia com 1o digito. Modulo 10 pra digitos
    # iniciais 0,1,2,3,4,5,8 e modulo 11 pra 6,7,9. Implementacao minima.
    if len(num) not in (8, 9):
        return False
    base = num[:-2]
    dv1_esperado = int(num[-2])
    dv2_esperado = int(num[-1])

    primeiro = int(base[0])
    modulo = 10 if primeiro in {0, 1, 2, 3, 4, 5, 8} else 11

    pesos2 = list(range(len(base) + 1, 1, -1))  # [n+1, n, ..., 2]
    soma2 = sum(int(base[i]) * pesos2[i] for i in range(len(base)))
    resto2 = soma2 % modulo
    dv2 = 0 if resto2 < 2 else modulo - resto2
    if dv2 != dv2_esperado:
        return False

    pesos1 = list(range(len(base) + 2, 2, -1))  # [n+2, n+1, ..., 3]
    soma1 = sum(int(base[i]) * pesos1[i] for i in range(len(base))) + dv2 * 2
    resto1 = soma1 % modulo
    dv1 = 0 if resto1 < 2 else modulo - resto1
    return dv1 == dv1_esperado


CALCULADORES = {
    "SP": _dv_sp,
    "RJ": _dv_rj,
    "RS": _dv_rs,
    "SC": _dv_sc,
    "PR": _dv_pr,
    "BA": _dv_ba,
}


def validar(uf: str, ie: str) -> dict:
    uf = (uf or "").upper().strip()
    if uf not in UFS:
        return {"uf": uf, "valido": False, "normalizado": "", "metodo": "", "motivo": "uf-invalida"}

    if (ie or "").strip().upper() == "ISENTO":
        return {"uf": uf, "valido": True, "normalizado": "ISENTO", "metodo": "isento", "motivo": ""}

    num = _so_digitos(ie)
    if not num:
        return {"uf": uf, "valido": False, "normalizado": "", "metodo": "", "motivo": "vazio"}

    if len(num) < 7 or len(num) > 14:
        return {"uf": uf, "valido": False, "normalizado": num, "metodo": "", "motivo": "tamanho-invalido"}

    if uf in CALCULADORES:
        ok = CALCULADORES[uf](num)
        return {
            "uf": uf,
            "valido": ok,
            "normalizado": num,
            "metodo": "dv-calculado",
            "motivo": "" if ok else "dv-invalido",
        }

    # UFs sem algoritmo dedicado: NAO afirma validade. Antes retornava
    # valido:true ("formal-sem-dv") e operador SEFAZ confiava — SEFAZ rejeitava.
    # Auditoria 10-agentes 2026-05-24: skill nao deve mentir. Operador valida
    # com Sintegra/SEFAZ por outra via.
    return {
        "uf": uf,
        "valido": False,
        "normalizado": num,
        "metodo": "formal-sem-dv",
        "motivo": "uf-sem-algoritmo-dedicado-valide-com-sintegra-ou-sefaz",
    }


def main(argv: list[str]) -> int:
    if len(argv) < 3:
        print("uso: validar-ie.py <UF> <IE>", file=sys.stderr)
        return 2
    resultado = validar(argv[1], argv[2])
    print(json.dumps(resultado, ensure_ascii=False))
    return 0 if resultado["valido"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
