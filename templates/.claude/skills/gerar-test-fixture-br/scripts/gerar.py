#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera dados sintéticos brasileiros válidos por algoritmo.

Stdlib pura. Saída no stdout, 1 por linha.
"""

import sys

# Força UTF-8 no I/O para evitar corrupção de acentos em Windows (cp1252).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


# ===== CPF =====

def _cpf_dv(parcial: str) -> str:
    pesos = list(range(len(parcial) + 1, 1, -1))
    soma = sum(int(d) * p for d, p in zip(parcial, pesos))
    resto = soma % 11
    return "0" if resto < 2 else str(11 - resto)


def gerar_cpf(seq: int) -> str:
    # Bases sequenciais a partir de 012345678 — obviamente sintéticas, nunca
    # colidem com o CPF público 123.456.789-09 nos intervalos de seq usados.
    base = f"{12345678 + seq:09d}"[-9:]
    dv1 = _cpf_dv(base)
    dv2 = _cpf_dv(base + dv1)
    full = base + dv1 + dv2
    return f"{full[:3]}.{full[3:6]}.{full[6:9]}-{full[9:]}"


# ===== CNPJ numérico =====

_PESOS_CNPJ_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
_PESOS_CNPJ_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]


def _cnpj_dv(parcial: str, pesos: list) -> str:
    soma = sum((ord(c.upper()) - 48) * p for c, p in zip(parcial, pesos))
    resto = soma % 11
    return "0" if resto < 2 else str(11 - resto)


def gerar_cnpj(seq: int) -> str:
    base = f"123456{(78 + seq) % 100:02d}0001"  # 12 dígitos (radical + filial 0001)
    dv1 = _cnpj_dv(base, _PESOS_CNPJ_1)
    dv2 = _cnpj_dv(base + dv1, _PESOS_CNPJ_2)
    full = base + dv1 + dv2
    return f"{full[:2]}.{full[2:5]}.{full[5:8]}/{full[8:12]}-{full[12:]}"


def gerar_cnpj_alfa(seq: int) -> str:
    """CNPJ alfanumérico pós-jul/2026 (IN RFB 2.229/2024)."""
    radicais = ["12ABC34501", "AB1CD2345Z", "XY9ZW87654", "DEFGH00012", "QRSTUVABCD"]
    base = f"{radicais[seq % len(radicais)]}DE"  # 12 alfanuméricos
    dv1 = _cnpj_dv(base, _PESOS_CNPJ_1)
    dv2 = _cnpj_dv(base + dv1, _PESOS_CNPJ_2)
    full = base + dv1 + dv2
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
