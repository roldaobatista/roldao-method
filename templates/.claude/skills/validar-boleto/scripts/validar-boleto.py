#!/usr/bin/env python3
"""validar-boleto.py — codigo de barras / linha digitavel de boleto bancario BR.

Uso:
    python validar-boleto.py "<44 ou 47 ou 48 digitos>"

Saida JSON:
    {"tipo": "bancario|arrecadacao", "valido": true|false, "barras": "...",
     "banco": "001", "valor": 100.00, "vencimento": "AAAA-MM-DD" | null,
     "motivo": ""}

Tipos cobertos:
- Bancario 44 (codigo de barras) — comeca com banco != "8".
- Bancario 47 (linha digitavel) — converte pra 44, valida 4 DVs intermediarios mod-10.
- Arrecadacao 44 (comeca com "8") — DV em pos 3.
- Arrecadacao 48 (linha digitavel) — 4 blocos de 12, DV cada bloco.
"""
from __future__ import annotations
import json
import re
import sys
from datetime import date, timedelta


BASE_DATE = date(1997, 10, 7)  # Fator vencimento original FEBRABAN


def _so_digitos(s: str) -> str:
    return re.sub(r"[^0-9]", "", s or "")


def _dv_mod10(num: str) -> int:
    """DV mod 10 com pesos alternados [2,1,2,1...] da direita pra esquerda."""
    soma = 0
    peso = 2
    for ch in reversed(num):
        produto = int(ch) * peso
        soma += produto if produto < 10 else (produto - 9)
        peso = 1 if peso == 2 else 2
    resto = soma % 10
    return 0 if resto == 0 else 10 - resto


def _dv_mod11(num: str) -> int:
    """DV mod 11 com pesos [2,3,4,5,6,7,8,9] ciclico da direita pra esquerda."""
    pesos = [2, 3, 4, 5, 6, 7, 8, 9]
    soma = 0
    for i, ch in enumerate(reversed(num)):
        soma += int(ch) * pesos[i % len(pesos)]
    resto = soma % 11
    dv = 11 - resto
    return 0 if dv in (0, 10, 11) else dv


def _linha_para_barras_bancario(linha47: str) -> str:
    """Converte linha digitavel bancaria (47) em codigo de barras (44)."""
    # Layout: AAABC.CCCCD EEEEE.EEEEEF GGGGG.GGGGGH IJJJJKKKKKKKKKK
    # Posicoes na linha vs barras: barras = AAA + B + I + JJJJ + KKKKKKKKKK
    #                                       + CCCCC + EEEEEEEEEE + GGGGGGGGGG
    b = linha47
    banco = b[0:3]
    moeda = b[3:4]
    campo_livre1 = b[4:9]  # 5 digits + DV em 9
    campo_livre2 = b[10:20]  # 10 digits + DV em 20
    campo_livre3 = b[21:31]  # 10 digits + DV em 31
    dv_geral = b[32:33]
    fator_venc = b[33:37]
    valor = b[37:47]
    return banco + moeda + dv_geral + fator_venc + valor + campo_livre1 + campo_livre2 + campo_livre3


def _valida_bancario(barras44: str) -> dict:
    if len(barras44) != 44:
        return {"valido": False, "motivo": "tamanho-invalido"}
    banco = barras44[0:3]
    moeda = barras44[3:4]
    dv_geral = int(barras44[4:5])
    fator = barras44[5:9]
    valor_raw = barras44[9:19]

    sem_dv = barras44[0:4] + barras44[5:44]
    dv_calc = _dv_mod11(sem_dv)
    if dv_calc != dv_geral:
        return {"valido": False, "motivo": f"dv-geral-invalido (esperado={dv_calc}, recebido={dv_geral})"}

    valor = int(valor_raw) / 100 if valor_raw.isdigit() else 0.0
    venc = None
    if fator.isdigit() and int(fator) > 0:
        try:
            venc = (BASE_DATE + timedelta(days=int(fator))).isoformat()
        except OverflowError:
            venc = None

    return {
        "tipo": "bancario",
        "valido": True,
        "banco": banco,
        "moeda": moeda,
        "valor": valor,
        "vencimento": venc,
        "motivo": "",
    }


def _valida_arrecadacao(barras44: str) -> dict:
    if len(barras44) != 44 or barras44[0] != "8":
        return {"valido": False, "motivo": "tamanho-ou-primeiro-invalido"}
    # 3o digito define metodo: 6 ou 7 = mod 10, 8 ou 9 = mod 11
    metodo = barras44[2]
    dv_recebido = int(barras44[3])
    sem_dv = barras44[0:3] + barras44[4:44]

    if metodo in ("6", "7"):
        dv_calc = _dv_mod10(sem_dv)
    elif metodo in ("8", "9"):
        dv_calc = _dv_mod11(sem_dv)
    else:
        return {"valido": False, "motivo": f"metodo-dv-desconhecido ({metodo})"}

    if dv_calc != dv_recebido:
        return {"valido": False, "motivo": f"dv-arrecadacao-invalido (esperado={dv_calc}, recebido={dv_recebido})"}

    valor_raw = barras44[4:15]
    valor = int(valor_raw) / 100 if valor_raw.isdigit() else 0.0

    return {
        "tipo": "arrecadacao",
        "valido": True,
        "banco": "arrecadacao",
        "valor": valor,
        "vencimento": None,
        "motivo": "",
    }


def validar(entrada: str) -> dict:
    num = _so_digitos(entrada)
    if not num:
        return {"valido": False, "motivo": "vazio"}

    # 44 digitos = codigo de barras direto
    if len(num) == 44:
        if num[0] == "8":
            res = _valida_arrecadacao(num)
        else:
            res = _valida_bancario(num)
        res["barras"] = num
        return res

    # 47 digitos = linha digitavel bancaria
    if len(num) == 47:
        # Valida 4 DVs intermediarios mod-10
        # Bloco 1: pos 0-9 (10 chars, DV em 9)
        b1 = num[0:9]; dv1 = int(num[9])
        if _dv_mod10(b1) != dv1:
            return {"valido": False, "motivo": "dv1-bloco1-invalido"}
        b2 = num[10:20]; dv2 = int(num[20])
        if _dv_mod10(b2) != dv2:
            return {"valido": False, "motivo": "dv2-bloco2-invalido"}
        b3 = num[21:31]; dv3 = int(num[31])
        if _dv_mod10(b3) != dv3:
            return {"valido": False, "motivo": "dv3-bloco3-invalido"}
        barras = _linha_para_barras_bancario(num)
        res = _valida_bancario(barras)
        res["barras"] = barras
        return res

    # 48 digitos = linha digitavel arrecadacao (4 blocos de 12)
    if len(num) == 48:
        if num[0] != "8":
            return {"valido": False, "motivo": "arrecadacao-deve-comecar-com-8"}
        # Cada bloco de 12: 11 digitos + DV (mod 10 ou mod 11 conforme 3o digito do total)
        metodo = num[2]
        dv_func = _dv_mod10 if metodo in ("6", "7") else _dv_mod11
        for bloco_idx in range(4):
            ini = bloco_idx * 12
            corpo = num[ini:ini + 11]
            dv_rec = int(num[ini + 11])
            if dv_func(corpo) != dv_rec:
                return {"valido": False, "motivo": f"dv-bloco-{bloco_idx + 1}-invalido"}
        # Re-monta as 44 posicoes do codigo de barras (sem os 4 DVs intermediarios)
        barras = num[0:11] + num[12:23] + num[24:35] + num[36:47]
        res = _valida_arrecadacao(barras)
        res["barras"] = barras
        return res

    return {"valido": False, "motivo": f"tamanho-{len(num)}-nao-suportado-use-44-47-ou-48"}


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("uso: validar-boleto.py '<44/47/48 digitos>'", file=sys.stderr)
        return 2
    resultado = validar(argv[1])
    print(json.dumps(resultado, ensure_ascii=False))
    return 0 if resultado.get("valido") else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
