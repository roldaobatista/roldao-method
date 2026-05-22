#!/usr/bin/env python3
"""gerar-br-code.py — gera string EMV do BR Code (QR Pix) padrao Bacen.

Uso:
    python gerar-br-code.py estatico --chave KEY --nome N --cidade C [--valor V] [--txid T]
    python gerar-br-code.py dinamico --url URL --nome N --cidade C

Saida: string EMV (1 linha) com CRC16-CCITT.
"""
from __future__ import annotations
import argparse
import sys
import unicodedata


def _strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)
    )


def _normaliza(s: str, limite: int) -> str:
    """Sem acento, uppercase, ate `limite` chars."""
    s = _strip_accents(s or "").upper().strip()
    return s[:limite]


def _emv_field(tag: str, value: str) -> str:
    """Codifica campo EMV TLV: tag (2 digits) + length (2 digits) + value."""
    if not isinstance(tag, str) or len(tag) != 2:
        raise ValueError(f"tag invalido: {tag!r}")
    length = len(value)
    if length > 99:
        raise ValueError(f"value de tag {tag} excede 99 chars: {length}")
    return f"{tag}{length:02d}{value}"


def _crc16_ccitt(payload: str) -> str:
    """CRC16-CCITT (polynomial 0x1021, initial 0xFFFF). 4 hex uppercase."""
    crc = 0xFFFF
    for ch in payload.encode("utf-8"):
        crc ^= ch << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return f"{crc:04X}"


def _merchant_account_info_estatico(chave: str, txid_inline: str = "") -> str:
    """Tag 26: Pix estatico via chave. Sub-tags: 00=GUI 'br.gov.bcb.pix', 01=chave."""
    gui = _emv_field("00", "br.gov.bcb.pix")
    chave_field = _emv_field("01", chave)
    return _emv_field("26", gui + chave_field)


def _merchant_account_info_dinamico(url: str) -> str:
    """Tag 26: Pix dinamico via URL. Sub-tags: 00=GUI, 25=URL (sem https://)."""
    gui = _emv_field("00", "br.gov.bcb.pix")
    url_sem_proto = url.replace("https://", "").replace("http://", "")
    url_field = _emv_field("25", url_sem_proto)
    return _emv_field("26", gui + url_field)


def gerar(
    tipo: str,
    chave: str = "",
    url: str = "",
    nome: str = "",
    cidade: str = "",
    valor: float | None = None,
    txid: str = "***",
) -> str:
    """Gera string EMV completa com CRC.

    tipo: 'estatico' ou 'dinamico'.
    """
    nome_norm = _normaliza(nome, 25)
    cidade_norm = _normaliza(cidade, 15)
    if not nome_norm or not cidade_norm:
        raise ValueError("nome e cidade sao obrigatorios")

    txid_norm = (txid or "***").strip()
    if not txid_norm:
        txid_norm = "***"
    # TxId estatico permite '***' (sem TxId). Dinamico exige TxId real >= 1 char.
    if tipo == "dinamico" and txid_norm == "***":
        # Para dinamico real, o TxId vem da cobranca; aqui aceitamos o que vier.
        txid_norm = "***"

    partes = [
        _emv_field("00", "01"),                # Payload format
        _emv_field("01", "11" if tipo == "estatico" else "12"),  # POI: 11=estatico, 12=dinamico
    ]

    if tipo == "estatico":
        if not chave:
            raise ValueError("--chave obrigatorio para estatico")
        partes.append(_merchant_account_info_estatico(chave))
    elif tipo == "dinamico":
        if not url:
            raise ValueError("--url obrigatorio para dinamico")
        partes.append(_merchant_account_info_dinamico(url))
    else:
        raise ValueError(f"tipo invalido: {tipo}")

    partes.append(_emv_field("52", "0000"))      # MCC nao especificado
    partes.append(_emv_field("53", "986"))       # BRL ISO 4217
    if valor is not None and valor > 0:
        partes.append(_emv_field("54", f"{valor:.2f}"))
    partes.append(_emv_field("58", "BR"))        # Country code
    partes.append(_emv_field("59", nome_norm))
    partes.append(_emv_field("60", cidade_norm))
    partes.append(_emv_field("62", _emv_field("05", txid_norm)))  # 62 = Additional Data Field; 05 = Reference Label

    payload = "".join(partes)
    crc_input = payload + "6304"
    crc = _crc16_ccitt(crc_input)
    return crc_input + crc


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Gera BR Code (QR Pix) EMV")
    parser.add_argument("tipo", choices=["estatico", "dinamico"])
    parser.add_argument("--chave", default="", help="Chave Pix (estatico)")
    parser.add_argument("--url", default="", help="URL da cobranca PSP (dinamico)")
    parser.add_argument("--nome", required=True, help="Nome do beneficiario (<=25 chars, sem acento)")
    parser.add_argument("--cidade", required=True, help="Cidade (<=15 chars, sem acento)")
    parser.add_argument("--valor", type=float, default=None, help="Valor em BRL (opcional)")
    parser.add_argument("--txid", default="***", help="Reference label / TxId (default: ***)")
    args = parser.parse_args(argv[1:])

    try:
        emv = gerar(
            tipo=args.tipo,
            chave=args.chave,
            url=args.url,
            nome=args.nome,
            cidade=args.cidade,
            valor=args.valor,
            txid=args.txid,
        )
    except ValueError as e:
        print(f"erro: {e}", file=sys.stderr)
        return 2

    print(emv)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
