#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valida chaves Pix (CPF, CNPJ, email, telefone E.164, UUID) e identificadores (E2EID, TxId).

Auditoria round 11 (2026-05-25): logica CPF/CNPJ extraida pra
`.claude/skills/_lib/cpf_cnpj.py` (era triplicada em 3 skills). Esta skill
agora importa o algoritmo canonico em vez de manter copia propria.
"""

import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

_LIB = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "_lib"))
sys.path.insert(0, _LIB)

from cpf_cnpj import valida_cpf, valida_cnpj, so_digitos as _digitos


def _validar_cpf_ou_cnpj(valor: str) -> tuple[bool, str]:
    raw = re.sub(r"[./\-\s]", "", valor).upper()
    if len(raw) == 11 and raw.isdigit():
        return valida_cpf(raw)
    if len(raw) == 14:
        return valida_cnpj(raw)
    return False, "nao parece CPF nem CNPJ"


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
    # Checagem leve de plausibilidade da data (AAAAMMDDHHmm) — apanha lixo tipo
    # E...999999999999... O Bacen não rejeita por isso no recebedor, mas formato
    # com mês 13 / hora 99 é claramente inválido.
    dt = s[9:21]
    mes, dia, hora, minu = dt[4:6], dt[6:8], dt[8:10], dt[10:12]
    if not ("01" <= mes <= "12" and "01" <= dia <= "31"
            and "00" <= hora <= "23" and "00" <= minu <= "59"):
        return False, "EndToEndId com data implausível (AAAAMMDDHHmm fora de faixa)"
    return True, "EndToEndId"


# ===== TxId (Manual Pix Bacen) =====

def valida_txid(s: str, cob: bool = False) -> tuple[bool, str]:
    """TxId conforme Manual Pix Bacen.

    - Cobrança cob/cobv: OBRIGATÓRIO 26-35 alfanuméricos (use cob=True).
    - Pix manual avulso: 1-35 é tolerado.
    """
    s = s.strip()
    if not re.fullmatch(r"[A-Za-z0-9]{1,35}", s):
        return False, "TxId deve ser alfanumérico 1-35 caracteres (sem símbolos — Manual Pix Bacen)"
    if cob and not (26 <= len(s) <= 35):
        return False, f"TxId de cobrança cob/cobv deve ter 26-35 caracteres (tem {len(s)})"
    if not cob and len(s) < 26:
        return True, f"TxId (atenção: {len(s)} chars — válido só para Pix manual avulso, não cob/cobv)"
    return True, "TxId"


# ===== Roteador =====

def detectar_e_validar(raw: str) -> tuple[bool, str]:
    s = raw.strip()
    if "@" in s:
        return valida_email(s)
    if s.startswith("+"):
        return valida_telefone_e164(s)
    if re.fullmatch(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", s):
        ok, msg = valida_uuid_v4(s)
        if not ok:
            ver = s[14]
            return False, f"chave aleatória deve ser UUID v4; recebido UUID v{ver} (DICT Bacen exige v4)"
        return ok, msg
    d = _digitos(s)
    if any(c.isalpha() for c in s) or len(d) in (11, 14):
        return _validar_cpf_ou_cnpj(s)
    return False, "não foi possível detectar tipo de chave Pix"


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print("uso: validar-pix.py <chave> | --e2eid <id> | --txid <id> | --txid-cob <id>", file=sys.stderr)
        return 2
    if args[0] in ("--e2eid", "--txid", "--txid-cob"):
        if len(args) < 2:
            print(f"uso: validar-pix.py {args[0]} <id>", file=sys.stderr)
            return 2
        if args[0] == "--e2eid":
            ok, msg = valida_e2eid(args[1])
        elif args[0] == "--txid":
            ok, msg = valida_txid(args[1])
        else:
            ok, msg = valida_txid(args[1], cob=True)
    else:
        ok, msg = detectar_e_validar(args[0])
    if ok:
        print(f"OK {msg}")
        return 0
    print(f"INVÁLIDO {msg}")
    return 1


if __name__ == "__main__":
    sys.exit(main())
