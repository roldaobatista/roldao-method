#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida codigo IBGE de municipio brasileiro (7 digitos: UF + sequencial + DV)."""

import json
import sys
import urllib.request

# Forca UTF-8 no I/O para evitar corrupcao de acentos em Windows (cp1252).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


UFS_VALIDAS = {
    11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
    21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL",
    28: "SE", 29: "BA",
    31: "MG", 32: "ES", 33: "RJ", 35: "SP",
    41: "PR", 42: "SC", 43: "RS",
    50: "MS", 51: "MT", 52: "GO", 53: "DF",
}


def _digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def calcula_dv(seis_digitos: str) -> int:
    """DV oficial IBGE: pesos 1,2,1,2,1,2 sobre os 6 primeiros digitos (Luhn).

    Para cada produto, se >= 10 soma os algarismos (ex: 12 -> 1+2=3).
    DV = (10 - (soma % 10)) % 10.
    """
    pesos = [1, 2, 1, 2, 1, 2]
    soma = 0
    for d, p in zip(seis_digitos, pesos):
        produto = int(d) * p
        if produto >= 10:
            produto = (produto // 10) + (produto % 10)
        soma += produto
    return (10 - (soma % 10)) % 10


def valida_formato(codigo: str) -> tuple[bool, str]:
    d = _digitos(codigo)
    if len(d) != 7:
        return False, f"codigo IBGE de municipio deve ter 7 digitos, recebido {len(d)}"
    uf_num = int(d[:2])
    if uf_num not in UFS_VALIDAS:
        return False, f"UF {d[:2]} invalida (validas: 11-17, 21-29, 31-33, 35, 41-43, 50-53)"
    dv_calc = calcula_dv(d[:6])
    if int(d[6]) != dv_calc:
        return False, f"DV invalido (esperado {dv_calc}, recebido {d[6]})"
    return True, d


def consulta_ibge(codigo: str, timeout: float = 5.0) -> tuple[bool, dict | str]:
    url = f"https://servicodados.ibge.gov.br/api/v1/localidades/municipios/{codigo}"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            corpo = r.read().decode("utf-8")
        if not corpo or corpo == "[]" or corpo == "null":
            return False, "codigo nao encontrado na API IBGE"
        data = json.loads(corpo)
        if isinstance(data, list):
            if not data:
                return False, "codigo nao encontrado na API IBGE"
            data = data[0]
        return True, data
    except Exception as e:
        return False, f"falha de rede: {e}"


def main() -> int:
    args = sys.argv[1:]
    remoto = "--remoto" in args
    args = [a for a in args if a != "--remoto"]
    if not args:
        print("uso: validar-codigo-municipio-ibge.py [--remoto] <codigo>", file=sys.stderr)
        return 2
    ok, info = valida_formato(args[0])
    if not ok:
        print(f"INVALIDO {info}")
        return 1
    uf_sigla = UFS_VALIDAS[int(info[:2])]
    if not remoto:
        print(f"OK codigo {info} (UF {uf_sigla})")
        return 0
    ok2, data = consulta_ibge(info)
    if not ok2:
        print(f"INVALIDO {data}")
        return 1
    nome = data.get("nome") or "?"
    micro = data.get("microrregiao") or {}
    meso = micro.get("mesorregiao") or {}
    uf = meso.get("UF") or {}
    sigla = uf.get("sigla") or uf_sigla
    print(f"OK codigo {info} {nome}/{sigla}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
