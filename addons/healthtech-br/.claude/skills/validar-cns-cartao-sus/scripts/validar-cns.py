#!/usr/bin/env python3
"""
validar-cns.py — valida CNS (Cartao Nacional de Saude) brasileiro.

CNS tem 15 digitos. Primeiro digito define o tipo:
  - 1 ou 2: CNS definitivo — primeiros 11 digitos sao PIS/PASEP do titular.
  - 7, 8 ou 9: CNS provisorio — soma ponderada de TODOS os 15 digitos com
    pesos 15..1 deve ser multiplo de 11.

Referencia: DataSUS — Documentacao tecnica do Cartao Nacional de Saude
(cadsus.saude.gov.br). Algoritmo publico, validavel offline. NAO confirma
que o cartao existe no CADSUS — so que os digitos sao matematicamente
consistentes.

Uso:
    python3 validar-cns.py "123 4567 8901 2345"
    echo "123456789012345" | python3 validar-cns.py -

Saida JSON em stdout. Exit 0 se valido, 1 se invalido, 2 se erro de input.

Aderente a HEALTH-EXT-006.
"""

import json
import sys


def _so_digitos(cns: str) -> str:
    return "".join(c for c in cns if c.isdigit())


def _soma_ponderada(digitos: str) -> int:
    """Soma cada digito x peso decrescente (15, 14, ..., 1)."""
    pesos = range(15, 0, -1)
    return sum(int(d) * p for d, p in zip(digitos, pesos))


def _validar_definitivo(digitos: str) -> dict:
    """
    CNS definitivo (comeca com 1 ou 2). Algoritmo PIS/PASEP + DV (DataSUS).

    Passo 1: soma ponderada dos primeiros 11 digitos (PIS) com pesos 15..5.
    Passo 2: resto = soma % 11.
    Passo 3:
        se resto == 10: soma += 2; resto = soma % 11; DV = 11-resto; sufixo = "001"
        senao:          DV = (resto == 0 ? 0 : 11-resto); sufixo = "000"
    Passo 4: CNS esperado = PIS + sufixo + DV  (15 digitos).
    Verificacao redundante: soma ponderada total dos 15 com pesos 15..1 e multiplo de 11.
    """
    pis = digitos[:11]
    soma = sum(int(d) * p for d, p in zip(pis, range(15, 4, -1)))
    resto = soma % 11

    if resto == 10:
        soma += 2
        resto = soma % 11
        dv = 11 - resto
        sufixo = "001"
    else:
        dv = 0 if resto == 0 else 11 - resto
        sufixo = "000"

    esperado = pis + sufixo + str(dv)

    if digitos == esperado and _soma_ponderada(digitos) % 11 == 0:
        return {"valido": True, "tipo": "definitivo", "mensagem": "CNS definitivo valido"}

    return {"valido": False, "tipo": "definitivo", "mensagem": "DV nao confere com PIS/PASEP"}


def _validar_provisorio(digitos: str) -> dict:
    """CNS provisorio (comeca com 7, 8 ou 9). Soma ponderada % 11 == 0."""
    if _soma_ponderada(digitos) % 11 == 0:
        return {"valido": True, "tipo": "provisorio", "mensagem": "CNS provisorio valido"}
    return {"valido": False, "tipo": "provisorio", "mensagem": "soma ponderada nao e multiplo de 11"}


def validar_cns(cns_input: str) -> dict:
    """Entrada principal. Recebe string com/sem mascara, retorna dict."""
    digitos = _so_digitos(cns_input)

    if len(digitos) != 15:
        return {"valido": False, "tipo": None, "mensagem": f"CNS deve ter 15 digitos (recebi {len(digitos)})"}

    primeiro = digitos[0]

    if primeiro in ("1", "2"):
        return _validar_definitivo(digitos)
    if primeiro in ("7", "8", "9"):
        return _validar_provisorio(digitos)

    return {"valido": False, "tipo": None, "mensagem": f"CNS deve comecar com 1, 2, 7, 8 ou 9 (recebi {primeiro})"}


def _ler_input(argv: list) -> str:
    if len(argv) < 2:
        print(json.dumps({"valido": False, "tipo": None, "mensagem": "uso: validar-cns.py <CNS> ou - para stdin"}))
        sys.exit(2)
    if argv[1] == "-":
        return sys.stdin.read().strip()
    return argv[1]


def main(argv: list) -> int:
    cns = _ler_input(argv)
    resultado = validar_cns(cns)
    print(json.dumps(resultado, ensure_ascii=False))
    return 0 if resultado["valido"] else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
