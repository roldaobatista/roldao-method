#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera dados sintéticos brasileiros válidos por algoritmo.

Stdlib pura. Saída no stdout, 1 por linha.

Auditoria round 11 (2026-05-25): algoritmo CPF/CNPJ extraido pra
`.claude/skills/_lib/cpf_cnpj.py`. Esta skill agora usa as funcoes
`gerar_cpf`/`gerar_cnpj` da lib comum em vez de duplicar.
"""

import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

_LIB = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "_lib"))
sys.path.insert(0, _LIB)

from cpf_cnpj import gerar_cpf as _lib_gerar_cpf, gerar_cnpj as _lib_gerar_cnpj


# ===== CPF =====

def gerar_cpf(seq: int) -> str:
    # Bases sequenciais a partir de 012345678 — obviamente sintéticas, nunca
    # colidem com o CPF público 123.456.789-09 nos intervalos de seq usados.
    base = f"{12345678 + seq:09d}"[-9:]
    full = _lib_gerar_cpf(base)
    return f"{full[:3]}.{full[3:6]}.{full[6:9]}-{full[9:]}"


# ===== CNPJ numérico =====

def gerar_cnpj(seq: int) -> str:
    base = f"123456{(78 + seq) % 100:02d}0001"  # 12 dígitos (radical + filial 0001)
    full = _lib_gerar_cnpj(base)
    return f"{full[:2]}.{full[2:5]}.{full[5:8]}/{full[8:12]}-{full[12:]}"


def gerar_cnpj_alfa(seq: int) -> str:
    """CNPJ alfanumérico pós-jul/2026 (IN RFB 2.229/2024)."""
    radicais = ["12ABC34501", "AB1CD2345Z", "XY9ZW87654", "DEFGH00012", "QRSTUVABCD"]
    base = f"{radicais[seq % len(radicais)]}DE"  # 12 alfanuméricos
    full = _lib_gerar_cnpj(base)
    return f"{full[:2]}.{full[2:5]}.{full[5:8]}/{full[8:12]}-{full[12:]}"


# ===== PIS / PASEP / NIS =====

_PESOS_PIS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]


def _pis_dv(parcial: str) -> str:
    soma = sum(int(d) * p for d, p in zip(parcial, _PESOS_PIS))
    resto = soma % 11
    dv = 11 - resto
    return "0" if dv >= 10 else str(dv)


def gerar_pis(seq: int) -> str:
    # Base sequencial sintetica. Bloqueia o mito '12068306449' (sequencia que
    # circula como PIS valido em fixtures por confusao com radical 'CR').
    base = f"{12345678 + seq:010d}"[-10:]
    full = base + _pis_dv(base)
    return f"{full[:3]}.{full[3:8]}.{full[8:10]}-{full[10:]}"


# ===== CEP =====

def gerar_cep(seq: int) -> str:
    # 99999-NNN deixa óbvio que é fake (CEPs reais começam com regional 01-99 mas nunca 99999)
    return f"99999-{(100 + seq) % 1000:03d}"


# ===== Telefone E.164 =====

def gerar_telefone(seq: int) -> str:
    return f"+5511991234{(100 + seq) % 1000:03d}"


# ===== Email =====

def gerar_email(seq: int) -> str:
    return f"usuario{seq:03d}@example.com.br"


# ===== Nome =====

PRIMEIROS = ["Fulano", "Maria", "João", "Ana", "Pedro", "Joana", "Lucas", "Carla", "Bruno", "Beatriz"]
SOBRENOMES = ["Teste", "Sintético", "Demo", "Mock", "Exemplo", "Fake"]


def gerar_nome(seq: int) -> str:
    return f"{PRIMEIROS[seq % len(PRIMEIROS)]} {SOBRENOMES[(seq // len(PRIMEIROS)) % len(SOBRENOMES)]} {seq:03d}"


def gerar_razao_social(seq: int) -> str:
    tipos = [("Empresa Exemplo", "Ltda"), ("Comércio Sintético", "ME"), ("Serviços Demo", "SA")]
    nome, sufixo = tipos[seq % len(tipos)]
    return f"{nome} {seq:03d} {sufixo}"


# ===== Fixture all-in-one =====

def gerar_all(seq: int) -> str:
    return (
        f"nome: {gerar_nome(seq)}\n"
        f"cpf: {gerar_cpf(seq)}\n"
        f"pis: {gerar_pis(seq)}\n"
        f"email: {gerar_email(seq)}\n"
        f"telefone: {gerar_telefone(seq)}\n"
        f"cep: {gerar_cep(seq)}\n"
        f"---"
    )


GERADORES = {
    "cpf": gerar_cpf,
    "cnpj": gerar_cnpj,
    "cnpj-alfa": gerar_cnpj_alfa,
    "pis": gerar_pis,
    "cep": gerar_cep,
    "telefone": gerar_telefone,
    "email": gerar_email,
    "nome": gerar_nome,
    "razao-social": gerar_razao_social,
    "all": gerar_all,
}


def main() -> int:
    if len(sys.argv) < 2:
        print("uso: gerar.py <tipo> [n]", file=sys.stderr)
        print(f"tipos: {', '.join(GERADORES.keys())}", file=sys.stderr)
        return 2
    tipo = sys.argv[1]
    try:
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    except ValueError:
        print(f"erro: n deve ser um inteiro, recebido: {sys.argv[2]!r}", file=sys.stderr)
        return 2
    if n <= 0:
        print(f"erro: n deve ser >= 1, recebido: {n}", file=sys.stderr)
        return 2
    if n > 100000:
        print(f"erro: n muito grande (max 100000), recebido: {n}", file=sys.stderr)
        return 2
    if tipo not in GERADORES:
        print(f"tipo desconhecido: {tipo}", file=sys.stderr)
        return 2
    gen = GERADORES[tipo]
    for i in range(n):
        print(gen(i))
    return 0


if __name__ == "__main__":
    sys.exit(main())
