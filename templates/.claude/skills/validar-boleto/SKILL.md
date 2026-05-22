---
name: validar-boleto
description: Valida codigo de barras / linha digitavel de boleto bancario brasileiro (FEBRABAN) e arrecadacao (servico publico). Use ao receber boleto de fornecedor, conciliacao bancaria, ou cadastro manual de pagamento. Valida DV modulo 10/11, faixa de valor, vencimento.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-22
status: stable
---

# validar-boleto

Skill para validar codigo de barras (44 digitos) ou linha digitavel (47 ou 48 digitos) de boleto BR.

## Regras

- **Boleto bancario (44 digitos):** layout FEBRABAN, comeca com banco (3) + moeda (1, geralmente 9=BRL) + DV geral (1) + fator vencimento (4) + valor (10) + campo livre (25).
- **Boleto arrecadacao (44 digitos):** comeca com `8` (servico publico). Layout diferente, DV em outra posicao.
- **Linha digitavel:**
  - **Bancario** = 47 digitos divididos em 4 grupos (4 DVs intermediarios mod-10).
  - **Arrecadacao** = 48 digitos em 4 grupos (DVs mod-10 OU mod-11 conforme 3o digito).
- **Fator vencimento:** dias desde 1997-10-07 (limite original) ou 2025-02-22 (apos reset). Skill detecta janela automatica.
- **Valor:** 10 digitos com 2 casas decimais (`0000010000` = R$ 100,00). Zero = boleto sem valor (consulta manual).

## Como invocar

```bash
# Codigo de barras 44 digitos
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-boleto.py "00193373700000001000500940144816060680935031"

# Linha digitavel 47 digitos (bancario)
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-boleto.py "00190500954014481606906809350314337370000000100"

# Arrecadacao 48 digitos (comeca com 8)
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-boleto.py "846700000019104540419029002021310200030010001907"
```

> **Windows:** `python` em vez de `python3`.

Saida JSON: `{ "tipo": "bancario|arrecadacao", "valido": true, "banco": "001", "valor": 100.00, "vencimento": "2024-06-15", "barras_normalizado": "..." }`.

## Boas praticas

- **Persistir codigo de barras (44 digitos), nao linha digitavel** — fonte unica, linha e derivada.
- Conciliacao bancaria: matchear por **codigo de barras + valor + data** (nao por nome do pagador).
- LGPD: pagador pode ser PF — dado pessoal (LGPD-001). Mascarar em logs.
- Fiscal: titulo a pagar com NF-e vinculada precisa rastrear ambos (`titulo.id <-> nfe.id`).
- Boleto sem valor (`valor=0`) e legitimo (consulta manual no banco). Nao rejeitar — marcar `valor_definitivo=null` e exigir confirmacao.

## Anti-padroes

- Calcular DV "na mao" pra evitar a skill — algoritmo mod-10 do bancario tem peso alternado [2,1,2,1...]; mod-11 do arrecadacao tem pesos [2,3,4,5,6,7,8,9]. Errar e silencioso.
- Aceitar boleto vencido sem aviso — `fator_vencimento` ja venceu = pagamento via segunda via.
- Cadastrar manualmente linha digitavel sem validar — DV intermediario muda se digitar errado.
- Aceitar boleto que NAO seja do banco contratado pra conciliacao — bancos diferentes nao casam.
