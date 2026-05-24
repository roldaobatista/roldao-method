---
name: validar-chave-acesso-nfe
description: Valida chave de acesso de NF-e/NFC-e/CT-e/MDF-e/SAT-CF-e (44 digitos) brasileira — UF + AAMM + CNPJ + modelo + serie + numero + tpEmis + cNF + DV. Usa algoritmo modulo 11 oficial. Use ao receber chave de fornecedor, conciliacao fiscal, importacao de XML, ou cadastro manual.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-22
status: stable
---

# validar-chave-acesso-nfe

Skill pra validar **chave de acesso de documento fiscal eletronico** brasileiro (44 digitos).

> **Importante:** chave com 44 digitos no formato certo NAO basta. Chave invalida com formato certo e caso comum de fraude (NF-e falsa) ou erro de digitacao em conciliacao. Sempre validar o DV.

## O que é a chave de acesso

A chave de acesso identifica unicamente um documento fiscal eletronico no Brasil. 44 digitos numericos, estrutura:

| Posicao | Tamanho | Campo | Conteudo |
|---|---|---|---|
| 1-2   | 2  | UF emitente            | codigo IBGE (35 = SP, 33 = RJ, etc.) |
| 3-6   | 4  | AAMM                   | ano (2 digitos) + mes de emissao |
| 7-20  | 14 | CNPJ emitente          | apenas digitos (legado) |
| 21-22 | 2  | Modelo                 | 55 = NF-e, 65 = NFC-e, 57 = CT-e, 58 = MDF-e, 59 = SAT/CF-e, 67 = CT-e OS |
| 23-25 | 3  | Serie                  | serie do documento |
| 26-34 | 9  | Numero                 | numero sequencial do documento |
| 35    | 1  | tpEmis                 | 1=Normal, 2=Contingencia FS-IA, 3=SCAN, 4=DPEC, 5=FS-DA, 6=SVC-AN, 7=SVC-RS, 9=Contingencia offline NFC-e |
| 36-43 | 8  | cNF                    | codigo numerico que compoe a chave (anti-colisao) |
| 44    | 1  | DV                     | digito verificador modulo 11 |

> **Observacao FISCAL-005:** a chave de acesso continua **100% numerica** mesmo apos o CNPJ alfanumerico entrar em vigor (2026-07). Posicoes 7-20 vao continuar aceitando so digitos — o CNPJ alfanumerico **nao** entra na chave de acesso (decisao da SEFAZ/RFB).

## Quando usar

- Conciliacao fiscal: bateu o XML recebido com o pedido?
- Importacao de planilha com chave de acesso (44 digitos).
- Antes de chamar consulta de status (`nfeConsultaProtocolo4`) — invalida = invalida no SEFAZ tambem.
- Cadastro manual de DANFE em sistema de gestao.
- Auditoria de NF-e/NFC-e/CT-e recebida de fornecedor (detecta digitacao errada).

## Como invocar

O script `${CLAUDE_SKILL_DIR}/scripts/validar.py` aceita a chave via argumento ou stdin:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py "35240612345678000190550010000001231234567894"
echo "35240612345678000190550010000001231234567894" | python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py -
```

> **Windows:** use `python` (sem `3`).

Aceita formatado com espacos/pontos. Normaliza pra so digitos antes de validar.

Retorna exit 0 se valida, 1 se invalida. Imprime:
- `OK NF-e UF=SP AAMM=2406 CNPJ=12345678000190 modelo=55 serie=001 numero=000000123 tpEmis=1 cNF=12345678 DV=4`
- `INVALIDO <motivo>`

## Regras

- 44 digitos exatos. Nem 43, nem 45.
- UF: codigo IBGE valido (11-17, 21-29, 31-33, 35, 41-43, 50-53).
- AAMM: AA entre 06 e 99 (NF-e existe desde 2006); MM entre 01 e 12.
- Modelo: 55, 65, 57, 58, 59, 67 (outros sao validos mas raros).
- DV: modulo 11 sobre os 43 primeiros digitos com pesos `2,3,4,5,6,7,8,9` ciclicos (direita pra esquerda).

## Apos validacao

- Se valida: persistir como `VARCHAR(44)` com indice unico (anti-duplicidade).
- Se invalida: reportar em PT-BR claro ("chave invalida — verifique a digitacao") sem stack trace.
- Chave invalida em conciliacao = **suspeita de fraude ou erro grosseiro**. Logar (mascarado se necessario) e exigir intervencao humana.

## Mascaramento em log (LGPD-001 + LGPD-004)

Chave NF-e contem CNPJ do emitente nas posicoes 7-20 — log com chave inteira expoe o CNPJ + identifica a operacao exata. Pra log de aplicacao, audit, console de suporte ou mensagem ao cliente final, mascarar o CNPJ embutido:

| Original                                          | Em log                                            |
|---------------------------------------------------|---------------------------------------------------|
| `35240612345678000190550010000001231234567894`    | `352406**********90550010000001231234567894`      |

```python
def mascarar_chave_nfe(chave: str) -> str:
    # preserva UF+AAMM (1-6), mascara CNPJ (7-20), mantem o resto (modelo+serie+numero+tpEmis+cNF+DV)
    if not chave or len(chave) != 44:
        return "***chave-invalida***"
    return chave[:6] + "*" * 10 + chave[16:]
```

Acesso a base de chaves NF-e deve gerar trilha de auditoria (LGPD-004) — chave permite reconstruir compras/vendas de um CNPJ ao longo do tempo.

## Limitacao declarada

Esta skill valida **estrutura** e **DV**. Nao consulta SEFAZ. Pra validar status real (autorizada/cancelada/denegada), use o web service `nfeConsultaProtocolo4` (vive no addon `fiscal-br-completo`).
