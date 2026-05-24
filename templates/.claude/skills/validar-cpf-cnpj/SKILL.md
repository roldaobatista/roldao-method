---
name: validar-cpf-cnpj
description: Valida CPF e CNPJ (numerico legado + alfanumerico apos jul/2026) brasileiros usando algoritmo de digitos verificadores. Use sempre que precisar verificar se um CPF/CNPJ esta MATEMATICAMENTE valido antes de salvar ou processar.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-18
status: stable
---

# validar-cpf-cnpj

Skill para validar CPF e CNPJ brasileiros com digito verificador real.

> **Importante:** validar so por formato (11 digitos pra CPF, 14 pra CNPJ) NAO basta. CPF/CNPJ invalido com formato certo e caso comum de fraude/erro de digitacao. Sempre validar digito verificador.

## CNPJ alfanumerico (vigor: julho/2026)

A IN RFB 2.229/2024 instituiu o **CNPJ alfanumerico**. A partir de 2026-07:

- Os **12 primeiros caracteres** (base) podem conter letras maiusculas (A-Z) alem de digitos.
- Os **2 ultimos caracteres** continuam sendo digitos (DV).
- O calculo dos DVs usa `ord(c) - 48` (ASCII), garantindo que CNPJs antigos (so digitos) permanecam validos com o mesmo algoritmo.
- Exemplo oficial RFB: `12.ABC.345/01DE-35`.

Esta skill ja suporta os dois formatos automaticamente.

## Quando usar

- Antes de salvar CPF/CNPJ no banco.
- Em formulario de cadastro (validacao client-side ou server-side).
- Em importacao de planilha com CPF/CNPJ.
- Em integracao com Receita Federal, banco, NF-e (sistemas que rejeitam se invalido).

## Como invocar

O script `${CLAUDE_SKILL_DIR}/scripts/validar.py` aceita CPF/CNPJ via argumento ou stdin:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py "123.456.789-09"          # CPF
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py "12.345.678/0001-90"      # CNPJ numerico
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py "12.ABC.345/01DE-35"      # CNPJ alfanumerico (2026+)
echo "111.111.111-11" | python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py -
```
> **Windows:** substitua `python3` por `python` (o instalador oficial do Python no Windows cria apenas `python.exe`). No Git Bash, `python3` so existe via alias do user.


Retorna exit code 0 se valido, 1 se invalido. Imprime `OK <tipo>` ou `INVALIDO <motivo>`.

## Regras

- Aceita formatado (`123.456.789-09`, `12.ABC.345/01DE-35`) ou sem mascara (`12345678909`, `12ABC34501DE35`).
- CNPJ alfanumerico exige base em **maiusculas**; o script normaliza letras minusculas automaticamente.
- Rejeita sequencias repetidas (`111.111.111-11`, `AAAAAAAAAAAA00`).
- Detecta tipo automaticamente: presenca de letra = CNPJ alfanumerico; 11 digitos = CPF; 14 digitos = CNPJ numerico.

## Apos validacao

- Se valido: salvar **so os caracteres limpos** no banco (CNPJ alfanumerico = `[0-9A-Z]{14}`; CPF = `[0-9]{11}`). Aplicar mascara apenas na exibicao.
- Se invalido: reportar ao usuario em PT-BR ("CPF invalido — verifique os digitos") **sem** stack trace.
- Nunca expor lista de CPFs invalidos em log publico (LGPD-001).

## Mascaramento em log (LGPD-001 + LGPD-004)

CPF/CNPJ sao dado pessoal. **Nunca** escrever inteiro em log de aplicacao, audit, console de suporte ou mensagem de erro mostrada ao cliente. Use mascara:

| Tipo              | Original          | Em log                |
|-------------------|-------------------|-----------------------|
| CPF               | `12345678909`     | `***.***.***-09`      |
| CNPJ numerico     | `12345678000190`  | `**.***.***/0001-90`  |
| CNPJ alfanumerico | `12ABC34501DE35`  | `**.***.***/01DE-35`  |

Helper Python (copie pro projeto):

```python
def mascarar_cpf(cpf: str) -> str:
    return f"***.***.***-{cpf[-2:]}" if cpf and len(cpf) >= 2 else "***"

def mascarar_cnpj(cnpj: str) -> str:
    return f"**.***.***/{cnpj[-6:-2]}-{cnpj[-2:]}" if cnpj and len(cnpj) >= 6 else "***"
```

Acesso a base de CPF/CNPJ deve gerar trilha de auditoria (LGPD-004): quem consultou, quando, qual chave (mascarada), motivo.

## Migracao para CNPJ alfanumerico

Checklist pra app que ja tem CNPJ em producao:

- [ ] Coluna do banco aceita `VARCHAR(14)` (nao `BIGINT`/`NUMERIC`).
- [ ] Validacoes de regex aceitam `[0-9A-Z]{14}` no lugar de `[0-9]{14}`.
- [ ] Filtros e buscas case-insensitive ou normalizam pra maiuscula no insert.
- [ ] Integracoes com Receita, banco, NF-e tem campo no formato novo.
- [ ] Exportacoes para Excel/CSV mantem maiuscula (Excel pode mudar pra minuscula).
- [ ] Indices fulltext nao quebram com caracteres novos.

Citacao em commit: `feat: aceita CNPJ alfanumerico (FISCAL-005)`.
