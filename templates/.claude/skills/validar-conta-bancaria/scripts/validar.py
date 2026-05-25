#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida agencia + conta bancaria BR. Formato sempre; DV quando banco usa algoritmo conhecido."""

import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BANCOS = {
    "001": ("Banco do Brasil", "mod11_98_to_2"),
    "033": ("Santander", "santander_heuristico"),
    "104": ("Caixa Economica", "mod11_82_to_2"),
    "237": ("Bradesco", "mod11_2_to_7"),
    "341": ("Itau", "mod10_21"),
    "260": ("Nubank", "sem_dv"),
    "077": ("Inter", "sem_dv"),
    "336": ("C6", "sem_dv"),
    "212": ("Banco Original", "sem_dv"),
    "323": ("Mercado Pago", "sem_dv"),
    "290": ("PagBank", "sem_dv"),
}


def _so_digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def dv_mod11(conta: str, pesos: list[int]) -> str:
    """Mod 11 generico. Resto 10 -> 'X'. Resto 0 -> '0'."""
    total = sum(int(d) * p for d, p in zip(conta, pesos))
    resto = total % 11
    dv = 11 - resto
    if dv == 11:
        return "0"
    if dv == 10:
        return "X"
    return str(dv)


def dv_mod10_21(conta: str) -> str:
    """Itau: pesos 2,1 alternando, soma dos digitos do produto, mod 10, complemento."""
    pesos = [2, 1] * (len(conta) // 2 + 1)
    soma = 0
    for d, p in zip(conta, pesos):
        prod = int(d) * p
        soma += (prod // 10) + (prod % 10)
    resto = soma % 10
    dv = 10 - resto
    if dv == 10:
        return "0"
    return str(dv)


def calcular_dv(algo: str, conta_sem_dv: str) -> str | None:
    if algo == "sem_dv":
        return None
    if algo == "mod11_98_to_2":
        pesos = list(range(2, len(conta_sem_dv) + 2))[::-1]
        return dv_mod11(conta_sem_dv, pesos)
    if algo == "mod11_82_to_2":
        pesos = list(range(2, 10)) + [2, 3, 4, 5]
        return dv_mod11(conta_sem_dv, pesos[: len(conta_sem_dv)][::-1])
    if algo == "mod11_2_to_7":
        ciclo = [2, 3, 4, 5, 6, 7]
        pesos = [ciclo[i % 6] for i in range(len(conta_sem_dv))][::-1]
        return dv_mod11(conta_sem_dv, pesos)
    if algo == "mod10_21":
        return dv_mod10_21(conta_sem_dv)
    if algo == "santander_heuristico":
        # Heuristica: pesos 9,7,3,1,9,7,1,3,1,9,7,3 sobre digitos da agencia (3)+conta (8)
        # Resolucao Bacen 1.401. Implementacao simplificada — para validacao real,
        # consultar webservice do Santander.
        pesos = [9, 7, 3, 1, 9, 7, 1, 3, 1, 9, 7, 3]
        n = min(len(conta_sem_dv), len(pesos))
        total = sum(int(conta_sem_dv[i]) * pesos[i] for i in range(n))
        ultimo = total % 10
        dv = 10 - ultimo
        return str(dv if dv < 10 else 0)
    return None


def validar(codigo_banco: str, agencia: str, conta: str) -> dict:
    cb = _so_digitos(codigo_banco)
    ag = _so_digitos(agencia)
    co_full = _so_digitos(conta)
    banco_info = BANCOS.get(cb)

    if not banco_info:
        return {
            "banco": "DESCONHECIDO",
            "codigo": cb,
            "valido": len(ag) >= 3 and 4 <= len(co_full) <= 12,
            "metodo": "formal-sem-dv-dedicado",
            "agencia": ag.zfill(4),
            "conta": co_full,
            "aviso": "codigo de banco fora da tabela conhecida — validado so por formato",
        }

    nome, algo = banco_info
    if len(ag) < 3 or len(ag) > 5:
        return {"banco": nome, "valido": False, "motivo": f"agencia com {len(ag)} digitos (esperado 4)"}
    if len(co_full) < 4 or len(co_full) > 12:
        return {"banco": nome, "valido": False, "motivo": f"conta com {len(co_full)} digitos"}

    if algo == "sem_dv":
        return {
            "banco": nome,
            "valido": True,
            "metodo": "sem-dv-externo",
            "agencia": ag.zfill(4),
            "conta": co_full,
        }

    # Separa ultimo digito como DV informado
    conta_base = co_full[:-1]
    dv_informado = co_full[-1]
    dv_esperado = calcular_dv(algo, conta_base)

    if dv_esperado is None:
        return {"banco": nome, "valido": False, "motivo": f"algoritmo nao implementado: {algo}"}

    if str(dv_informado).upper() != str(dv_esperado).upper():
        return {
            "banco": nome,
            "valido": False,
            "metodo": algo,
            "motivo": f"DV esperado {dv_esperado}, recebido {dv_informado}",
        }

    return {
        "banco": nome,
        "valido": True,
        "metodo": algo,
        "agencia": ag.zfill(4),
        "conta": f"{conta_base}-{dv_informado}",
    }


def main() -> int:
    if len(sys.argv) < 4:
        print("uso: validar.py <codigo-banco-3-digitos> <agencia> <conta-com-dv>", file=sys.stderr)
        return 2
    res = validar(sys.argv[1], sys.argv[2], sys.argv[3])
    print(json.dumps(res, ensure_ascii=False))
    return 0 if res.get("valido") else 1


if __name__ == "__main__":
    sys.exit(main())
