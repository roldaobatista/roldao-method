#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida CEP brasileiro (formato + consulta opcional ao ViaCEP)."""

import json
import re
import sys
import urllib.request

# Forca UTF-8 no I/O para evitar corrupcao de acentos em Windows (cp1252).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def valida_formato(cep: str) -> tuple[bool, str]:
    d = _digitos(cep)
    if len(d) != 8:
        return False, f"CEP deve ter 8 dígitos, recebido {len(d)}"
    if d == "00000000":
        return False, "CEP zerado não existe"
    return True, d


def consulta_viacep(cep_digits: str, timeout: float = 5.0) -> tuple[bool, dict | str]:
    url = f"https://viacep.com.br/ws/{cep_digits}/json/"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            data = json.loads(r.read().decode("utf-8"))
        if data.get("erro"):
            return False, "CEP não encontrado no ViaCEP"
        return True, data
    except Exception as e:
        return False, f"falha de rede: {e}"


def main() -> int:
    args = sys.argv[1:]
    remoto = "--remoto" in args
    args = [a for a in args if a != "--remoto"]
    if not args:
        print("uso: validar-cep.py [--remoto] <cep>", file=sys.stderr)
        return 2
    ok, info = valida_formato(args[0])
    if not ok:
        print(f"INVALIDO {info}")
        return 1
    if not remoto:
        print(f"OK CEP {info}")
        return 0
    ok2, data = consulta_viacep(info)
    if not ok2:
        print(f"INVALIDO {data}")
        return 1
    print(f"OK CEP {info} {data.get('localidade')}/{data.get('uf')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
