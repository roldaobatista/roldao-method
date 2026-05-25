#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida CPF e CNPJ (numerico e alfanumerico) usando lib comum.

Delegado para `.claude/skills/_lib/cpf_cnpj.py` (auditoria round 11 — 2026-05-25).
Antes a logica estava triplicada entre validar-cpf-cnpj, validar-pix e
gerar-test-fixture-br. Agora todas importam de um unico modulo.
"""

import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    sys.stdin.reconfigure(encoding="utf-8", errors="replace")

_LIB = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "_lib"))
sys.path.insert(0, _LIB)

from cpf_cnpj import valida_cpf, valida_cnpj, detectar_tipo, so_digitos


def main() -> int:
    if len(sys.argv) < 2:
        # PIX-004-exception: skill validar-cpf-cnpj, nao log de chave Pix real
        print("uso: validar.py <documento> | -", file=sys.stderr)
        return 2
    arg = sys.argv[1]
    raw = sys.stdin.readline().strip() if arg == "-" else arg
    tipo = detectar_tipo(raw)
    if tipo == "cpf":
        ok, msg = valida_cpf(raw)
    elif tipo == "cnpj":
        ok, msg = valida_cnpj(raw)
    else:
        d = so_digitos(raw)
        # PIX-004-exception: mensagem de uso da skill, sem chave real
        print(f"INVALIDO precisa 11 ou 14 caracteres, recebido {len(d)}")
        return 1
    if ok:
        print(f"OK {msg}")
        return 0
    print(f"INVALIDO {msg}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
