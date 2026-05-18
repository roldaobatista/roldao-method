---
name: validar-cpf-cnpj
description: Valida CPF ou CNPJ brasileiro usando algoritmo de dígitos verificadores (não só formato). Use sempre que precisar verificar se um CPF/CNPJ está MATEMATICAMENTE válido antes de salvar ou processar.
---

# validar-cpf-cnpj

Skill para validar CPF e CNPJ brasileiros com dígito verificador real.

> **Importante:** validar só por formato (11 dígitos pra CPF, 14 pra CNPJ) NÃO basta. CPF/CNPJ inválido com formato certo é caso comum de fraude/erro de digitação. Sempre validar dígito verificador.

## Quando usar

- Antes de salvar CPF/CNPJ no banco.
- Em formulário de cadastro (validação client-side ou server-side).
- Em importação de planilha com CPF/CNPJ.
- Em integração com Receita Federal, banco, NF-e (sistemas que rejeitam se inválido).

## Como invocar

O script `${CLAUDE_SKILL_DIR}/scripts/validar.py` aceita CPF/CNPJ via argumento ou stdin:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py "123.456.789-09"
python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py "12345678000190"
echo "111.111.111-11" | python3 ${CLAUDE_SKILL_DIR}/scripts/validar.py -
```

Retorna exit code 0 se válido, 1 se inválido. Imprime `OK <tipo>` ou `INVALIDO <motivo>`.

## Regras

- Aceita formatado (`123.456.789-09`) ou só dígitos (`12345678909`).
- Rejeita sequências repetidas (`111.111.111-11`) que passam no algoritmo mas são inválidas.
- Detecta tipo automaticamente (11 dígitos = CPF, 14 = CNPJ).

## Após validação

- Se válido: salvar **só os dígitos** no banco (sem máscara). Aplicar máscara apenas na exibição.
- Se inválido: reportar ao usuário em PT-BR ("CPF inválido — verifique os dígitos") **sem** stack trace.
- Nunca expor lista de CPFs inválidos em log público (LGPD-001).
