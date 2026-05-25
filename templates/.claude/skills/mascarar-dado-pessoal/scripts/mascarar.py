#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mascara dado pessoal brasileiro para exibicao segura. CLI + lib importavel."""

import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def _so_digitos(s: str) -> str:
    return "".join(c for c in s if c.isdigit())


def mascarar_cpf(cpf: str) -> str:
    """CPF: ***.***.NNN-NN (preserva ultimos 5 digitos)."""
    d = _so_digitos(cpf)
    if len(d) != 11:
        return "***.***.***-**"
    return f"***.***.{d[6:9]}-{d[9:11]}"


def mascarar_cnpj(cnpj: str) -> str:
    """CNPJ: **.***.***/NNNN-NN — aceita alfanumerico FISCAL-005."""
    s = re.sub(r"[^0-9A-Za-z]", "", cnpj)
    if len(s) != 14:
        return "**.***.***/****-**"
    return f"**.***.***/{s[8:12]}-{s[12:14]}"


def mascarar_email(email: str) -> str:
    """Email: primeira letra + *** + @dominio."""
    if "@" not in email:
        return "***@***"
    local, _, dominio = email.partition("@")
    if not local:
        return f"***@{dominio}"
    return f"{local[0]}***@{dominio}"


def mascarar_telefone(tel: str) -> str:
    """Telefone E.164: preserva DDI+DDD+ultimos 4 (+5511*****4321)."""
    d = _so_digitos(tel)
    if len(d) < 8:
        return "**********"
    prefixo = "+" if tel.startswith("+") else ""
    if len(d) >= 12:  # +DDI(2) DDD(2) numero(8-9)
        return f"{prefixo}{d[:4]}{'*' * (len(d) - 8)}{d[-4:]}"
    return f"{prefixo}{d[:2]}{'*' * (len(d) - 6)}{d[-4:]}"


def mascarar_uuid(uuid: str) -> str:
    """UUID: 8h ****-****-****-****-8h (preserva inicio e fim)."""
    s = uuid.strip()
    if len(s) < 16:
        return "*" * len(s)
    return f"{s[:8]}-****-****-****-****{s[-8:]}"


def mascarar_chave_pix(chave: str) -> str:
    """Chave Pix: detecta tipo (CPF/CNPJ/email/telefone/UUID) e aplica mascara apropriada."""
    s = chave.strip()
    if "@" in s and not s.startswith("+"):
        # email — mascara extra agressiva em chave Pix
        local, _, dom = s.partition("@")
        return f"{local[0] if local else '*'}***@***{('.' + dom.split('.')[-1]) if '.' in dom else ''}"
    if s.startswith("+") or (s and s[0].isdigit() and len(s) > 13):
        return mascarar_telefone(s)
    if "-" in s and len(_so_digitos(s)) > 14:
        return mascarar_uuid(s)
    d = _so_digitos(s)
    if len(d) == 11:
        return f"***.***.***-{d[-2:]}"
    if len(d) == 14:
        return mascarar_cnpj(s)
    return "***"


def mascarar_rg(rg: str) -> str:
    """RG: **.***.***N-N (preserva ultimos 2)."""
    s = re.sub(r"[^0-9Xx]", "", rg).upper()
    if len(s) < 5:
        return "*" * len(s)
    return f"**.***.***{s[-2]}-{s[-1]}"


def mascarar_ie(ie: str) -> str:
    """IE: ***.***.***.NNN (preserva ultimos 3)."""
    d = _so_digitos(ie)
    if len(d) < 5:
        return "*" * len(d)
    return f"{'*' * (len(d) - 3)}{d[-3:]}"


def mascarar_cnh(cnh: str) -> str:
    """CNH: 9 asterisco + 2 digitos."""
    d = _so_digitos(cnh)
    if len(d) != 11:
        return "*" * len(d)
    return f"{'*' * 9}{d[-2:]}"


def mascarar_renavam(r: str) -> str:
    return mascarar_cnh(r)


def mascarar_titulo_eleitor(t: str) -> str:
    """Titulo eleitor: **** **** **NN."""
    d = _so_digitos(t).zfill(12)
    return f"**** **** **{d[-2:]}"


def mascarar_cartao(c: str) -> str:
    """Cartao credito: **** **** **** NNNN."""
    d = _so_digitos(c)
    if len(d) < 13:
        return "**** **** **** ****"
    return f"**** **** **** {d[-4:]}"


# Padroes pra deteccao automatica em texto livre — apenas formatos com pontuacao
# canonica. Regex cega de \d{11} ou \d{14} foi removida em 2026-05-25 por
# falso-positivo grave (mascarava CNH/RENAVAM/numero de pedido como se fosse
# CPF/CNPJ). Pra mascarar CPF/CNPJ cru, chame mascarar_cpf/mascarar_cnpj direto.
PADROES_AUTO = [
    (re.compile(r"\b\d{3}\.\d{3}\.\d{3}-\d{2}\b"), mascarar_cpf),
    (re.compile(r"\b\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}\b"), mascarar_cnpj),
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"), mascarar_email),
    (re.compile(r"\+\d{12,14}\b"), mascarar_telefone),
]


def mascarar_auto(texto: str) -> str:
    """Detecta tipos conhecidos em texto livre e substitui."""
    out = texto
    for padrao, mascarador in PADROES_AUTO:
        out = padrao.sub(lambda m: mascarador(m.group(0)), out)
    return out


MASCARADORES = {
    "cpf": mascarar_cpf,
    "cnpj": mascarar_cnpj,
    "email": mascarar_email,
    "telefone": mascarar_telefone,
    "uuid": mascarar_uuid,
    "pix": mascarar_chave_pix,
    "rg": mascarar_rg,
    "ie": mascarar_ie,
    "cnh": mascarar_cnh,
    "renavam": mascarar_renavam,
    "titulo": mascarar_titulo_eleitor,
    "cartao": mascarar_cartao,
    "auto": mascarar_auto,
}


def main() -> int:
    if len(sys.argv) < 3:
        print(f"uso: mascarar.py <tipo> <valor>\ntipos: {', '.join(MASCARADORES)}", file=sys.stderr)
        return 2
    tipo = sys.argv[1].lower()
    valor = " ".join(sys.argv[2:])
    fn = MASCARADORES.get(tipo)
    if not fn:
        print(f"tipo desconhecido: {tipo}", file=sys.stderr)
        return 2
    print(fn(valor))
    return 0


if __name__ == "__main__":
    sys.exit(main())
