#!/usr/bin/env python3
"""Valida chaves Pix (CPF, CNPJ, email, telefone E.164, UUID) e identificadores (E2EID, TxId)."""

import re
import sys
import os

SKILL_DIR = os.path.dirname(os.path.abspath(__file__))
CPF_SCRIPT = os.path.normpath(os.path.join(SKILL_DIR, "..", "..", "validar-cpf-cnpj", "scripts", "validar.py"))


def _digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def _validar_cpf_ou_cnpj(valor: str) -> tuple[bool, str]:
    sys.path.insert(0, os.path.dirname(CPF_SCRIPT))
    try:
        import validar as v
    except ImportError:
        return False, "modulo validar.py nao encontrado"
    finally:
        sys.path.pop(0)
    tipo = v._detectar(valor)
    if tipo == "cpf":
        return v.valida_cpf(valor)
    if tipo == "cnpj":
        return v.valida_cnpj(valor)
    return False, "nao parece CPF nem CNPJ"


def valida_email(s: str) -> tuple[bool, str]:
    s = s.strip().lower()
    if len(s) > 254:
        return False, "email muito longo"
    if not re.fullmatch(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", s):
        return False, "formato de email invalido"
    return True, "chave email"


def valida_telefone_e164(s: str) -> tuple[bool, str]:
    s = s.strip()
    if not re.fullmatch(r"\+55\d{10,11}", s):
        return False, "telefone deve estar em E.164 BR (+55DDNNNNNNNNN)"
    return True, "chave telefone"


def valida_uuid_v4(s: str) -> tuple[bool, str]:
    s = s.strip().lower()
    pat = r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
    if not re.fullmatch(pat, s):
        return False, "UUID v4 invalido"
    return True, "chave aleatoria"


def valida_e2eid(s: str) -> tuple[bool, str]:
    s = s.strip()
    if not re.fullmatch(r"E\d{8}\d{12}[A-Za-z0-9]{11}", s):
        return False, "EndToEndId deve ser E + ISPB(8) + AAAAMMDDHHmm(12) + serial(11)"
    return True, "EndToEndId"


def valida_txid(s: str) -> tuple[bool, str]:
    s = s.strip()
    if not re.fullmatch(r"[a-zA-Z0-9]{1,35}", s):
        return False, "TxId deve ser alfanumerico 1-35 caracteres"
    return True, "TxId"


def detectar_e_validar(raw: str) -> tuple[bool, str]:
    s = raw.strip()
    if "@" in s:
        return valida_email(s)
    if s.startswith("+"):
        return valida_telefone_e164(s)
    if re.fullmatch(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", s):
        return valida_uuid_v4(s)
    d = _digitos(s)
    if any(c.isalpha() for c in s) or len(d) in (11, 14):
        return _validar_cpf_ou_cnpj(s)
    return False, "nao foi possivel detectar tipo de chave Pix"


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print("uso: validar-pix.py <chave> | --e2eid <id> | --txid <id>", file=sys.stderr)
        return 2
    if args[0] == "--e2eid":
        ok, msg = valida_e2eid(args[1])
    elif args[0] == "--txid":
        ok, msg = valida_txid(args[1])
    else:
        ok, msg = detectar_e_validar(args[0])
    if ok:
        print(f"OK {msg}")
        return 0
    print(f"INVALIDO {msg}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
