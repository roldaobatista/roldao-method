---
name: validar-codigo-municipio-ibge
description: Valida codigo IBGE de municipio brasileiro (7 digitos = UF + sequencial + DV modulo 10) e opcionalmente consulta a API IBGE pra confirmar existencia. Use ao receber codigo de municipio em integracao SEFAZ, NF-e/NFC-e, eSocial, IBGE ou cadastro de endereco.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-23
status: stable
---

# validar-codigo-municipio-ibge

Skill para validar codigo IBGE de municipio (7 digitos).

## Regras

- **Formato:** 7 digitos. Os 2 primeiros sao o codigo da UF (11-53, com gaps em 30, 34, 36-39, 44-49); os 4 seguintes sao o sequencial dentro da UF; o ultimo e o DV modulo 10 estilo Luhn.
- **DV:** pesos `1,2,1,2,1,2` sobre os 6 primeiros digitos. Para cada produto, se >= 10 soma os digitos. DV = `(10 - (soma % 10)) % 10`.
- **UF valida:** 11 (RO), 12 (AC), 13 (AM), 14 (RR), 15 (PA), 16 (AP), 17 (TO), 21 (MA), 22 (PI), 23 (CE), 24 (RN), 25 (PB), 26 (PE), 27 (AL), 28 (SE), 29 (BA), 31 (MG), 32 (ES), 33 (RJ), 35 (SP), 41 (PR), 42 (SC), 43 (RS), 50 (MS), 51 (MT), 52 (GO), 53 (DF). 27 codigos.
- **Consulta:** API IBGE (`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/<codigo>`) confirma existencia e devolve nome + UF. Cota publica — nao chamar em loop.

## Como invocar

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-codigo-municipio-ibge.py 3550308
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-codigo-municipio-ibge.py --remoto 3550308
```

> **Windows:** substitua `python3` por `python` (o instalador oficial do Python no Windows cria apenas `python.exe`).

- Sem `--remoto`: valida UF + DV (offline, gratis, instantaneo).
- Com `--remoto`: confirma existencia no IBGE (requer internet).

## Codigos uteis pra testar

| Cidade | Codigo IBGE |
|---|---|
| Sao Paulo (SP) | 3550308 |
| Rio de Janeiro (RJ) | 3304557 |
| Brasilia (DF) | 5300108 |
| Manaus (AM) | 1302603 |
| Salvador (BA) | 2927408 |
| Belo Horizonte (MG) | 3106200 |

## Boas praticas

- Salvar como **7 digitos** no banco (`VARCHAR(7)` ou `CHAR(7)`), nunca `INTEGER` (zero a esquerda da UF some).
- O IBGE distribui codigos novos quando um municipio e criado/emancipado — o offline valida DV mas nao garante existencia. Em integracao fiscal use `--remoto` periodicamente ou cache a tabela completa.
- NF-e (campo `cMun` no XML) exige o codigo IBGE de 7 digitos do municipio do emitente, destinatario e local de entrega — DV invalido reprova na SEFAZ.
- eSocial (S-1005, S-1020, S-2200) usa o mesmo codigo IBGE — divergente reprova o evento.

## Anti-padroes

- Salvar como `INT`/`BIGINT` (codigos comecando com `0` viram 6 digitos, mas o IBGE nao usa UF que comeca com 0; ainda assim, padrao do mercado e VARCHAR).
- Misturar codigo IBGE com codigo TOM (codigo Tribunal de Contas, 4 digitos, formato diferente — usado em ISS de algumas prefeituras).
- Aceitar 7 digitos sem validar UF: `9999999` passa no DV se calculado, mas UF 99 nao existe.
- Chamar API IBGE a cada save (rate-limit publico). Cachear ou validar so offline.
