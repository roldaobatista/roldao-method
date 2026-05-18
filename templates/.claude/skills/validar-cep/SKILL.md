---
name: validar-cep
description: Valida CEP brasileiro (formato + consulta opcional ao ViaCEP) e normaliza para 8 digitos. Use ao receber CEP de formulario, importacao ou integracao.
---

# validar-cep

Skill para validar CEP brasileiro.

## Regras

- **Formato:** 8 digitos. Aceita `12345-678`, `12345678`, `12.345-678`.
- **Faixa:** `00000000` e `99999999` sao formalmente validos no padrao, mas nao existem na pratica.
- **Consulta:** ViaCEP (`https://viacep.com.br/ws/<cep>/json/`) confirma existencia e devolve cidade/UF/bairro/logradouro. **Nao garante** que o numero exista — so o intervalo do CEP.

## Como invocar

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-cep.py 12345-678
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-cep.py --remoto 01310-100
```

- Sem `--remoto`: valida so formato (offline, gratis, rapido).
- Com `--remoto`: consulta ViaCEP (requer internet). Usa cota publica — nao chamar em loop.

## Boas praticas

- Salvar **so digitos** no banco (`VARCHAR(8)` ou `CHAR(8)`).
- Exibir com mascara `99999-999`.
- Em cadastro, **nao bloquear** se ViaCEP devolver "nao encontrado" — pode ser CEP novo. So avisar.
- Para auto-preenchimento (cidade/UF), cachear resposta por algumas horas — CEP nao muda toda hora.
- LGPD: CEP isolado nao e dado pessoal, mas CEP + numero + complemento = endereco = dado pessoal (LGPD-001).

## Anti-padroes

- Chamar ViaCEP a cada keystroke (rate-limit).
- Confiar que ViaCEP devolveu = endereco existe (nao devolve).
- Salvar com mascara no banco (consultas viram pesadelo).
- Aceitar `99999-999` em producao sem validar contra cadastro real do cliente.
