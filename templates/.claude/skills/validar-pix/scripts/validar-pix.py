#!/usr/bin/env python3
"""Valida chaves Pix (CPF, CNPJ, email, telefone E.164, UUID) e identificadores (E2EID, TxId).

v0.5.0: validacao CPF/CNPJ embutida (sem sys.path frágil). Skill é standalone.
"""

import re
import sys


def _digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


# ===== CPF =====

def _cpf_dv(parcial: str) -> str:
    pesos = list(range(len(parcial) + 1, 1, -1))
    soma = sum(int(d) * p for d, p in zip(parcial, pesos))
    resto = soma % 11
    return "0" if resto < 2 else str(11 - resto)


def valida_cpf(s: str) -> tuple[bool, str]:
    d = _digitos(s)
    if len(d) != 11:
        return False, "CPF precisa ter 11 dígitos"
    if d == d[0] * 11:
        return False, "CPF inválido (todos dígitos iguais)"
    if _cpf_dv(d[:9]) != d[9] or _cpf_dv(d[:10]) != d[10]:
        return False, "DV de CPF inválido"
    return True, "CPF válido"


# ===== CNPJ (numérico + alfanumérico jul/2026) =====

_PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
_PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]


def _cnpj_char_valor(c: str) -> int:
    """Valor numérico do char no CNPJ alfanumérico (IN RFB 2.229/2024):
    dígitos 0-9 valem 0-9, letras A-Z valem 17-42 (ord(c) - 48)."""
    return ord(c.upper()) - 48


def _cnpj_dv(parcial: str, pesos: list) -> str:
    soma = sum(_cnpj_char_valor(c) * p for c, p in zip(parcial, pesos))
    resto = soma % 11
    return "0" if resto < 2 else str(11 - resto)


def valida_cnpj(s: str) -> tuple[bool, str]:
    """Aceita CNPJ numérico (14 dígitos) ou alfanumérico (12 alfanum + 2 dígitos DV).
    Letras válidas: A-Z (não diferencia case). Símbolos . / - são removidos."""
    raw = re.sub(r"[./\-\s]", "", s).upper()
    if len(raw) != 14:
        return False, "CNPJ precisa ter 14 caracteres"
    if not re.fullmatch(r"[A-Z0-9]{12}\d{2}", raw):
        return False, "CNPJ alfanumérico: 12 alfanum + 2 dígitos DV"
    if raw == raw[0] * 14:
        return False, "CNPJ inválido (todos caracteres iguais)"
    if _cnpj_dv(raw[:12], _PESOS_CNPJ_1) != raw[12]:
        return False, "primeiro DV de CNPJ inválido"
    if _cnpj_dv(raw[:13], _PESOS_CNPJ_2) != raw[13]:
        return False, "segundo DV de CNPJ inválido"
    return True, "CNPJ válido"


def _validar_cpf_ou_cnpj(valor: str) -> tuple[bool, str]:
    raw = re.sub(r"[./\-\s]", "", valor).upper()
    if len(raw) == 11 and raw.isdigit():
        return valida_cpf(raw)
    if len(raw) == 14:
        return valida_cnpj(raw)
    return False, "não parece CPF nem CNPJ"


# ===== Email =====

def valida_email(s: str) -> tuple[bool, str]:
    s = s.strip().lower()
    if len(s) > 254:
        return False, "email muito longo"
    if not re.fullmatch(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", s):
        return False, "formato de email inválido"
    return True, "chave email"


# ===== Telefone E.164 =====

def valida_telefone_e164(s: str) -> tuple[bool, str]:
    s = s.strip()
    if not re.fullmatch(r"\+55\d{10,11}", s):
        return False, "telefone deve estar em E.164 BR (+55DDNNNNNNNNN)"
    return True, "chave telefone"


# ===== UUID v4 =====

def valida_uuid_v4(s: str) -> tuple[bool, str]:
    s = s.strip().lower()
    pat = r"[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}"
    if not re.fullmatch(pat, s):
        return False, "UUID v4 inválido"
    return True, "chave aleatória"


# ===== EndToEndId =====

def valida_e2eid(s: str) -> tuple[bool, str]:
    s = s.strip()
    if not re.fullmatch(r"E\d{8}\d{12}[A-Za-z0-9]{11}", s):
        return False, "EndToEndId deve ser E + ISPB(8) + AAAAMMDDHHmm(12) + serial(11)"
    return True, "EndToEndId"


# ===== TxId (Manual Pix Bacen) =====

def valida_txid(s: str) -> tuple[bool, str]:
    """TxId conforme Manual Pix Bacen: 1-35 caracteres alfanuméricos (sem símbolos)."""
    s = s.strip()
    if not re.fullmatch(r"[A-Za-z0-9]{1,35}", s):
        return False, "TxId deve ser alfanumérico 1-35 caracteres (sem símbolos — Manual Pix Bacen)"
    return True, "TxId"


# ===== Roteador =====

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
    return False, "não foi possível detectar tipo de chave Pix"


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
    print(f"INVÁLIDO {msg}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
