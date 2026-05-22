---
name: validar-ie
description: Valida Inscricao Estadual brasileira (formato + digito verificador por UF) e normaliza pra so digitos. Use ao receber IE de cadastro de empresa, importacao fiscal, integracao com SEFAZ ou geracao de NF-e. Cada UF tem algoritmo proprio.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-22
status: stable
---

# validar-ie

Skill para validar Inscricao Estadual (IE) brasileira por UF.

## Regras

- **27 UFs, 27 algoritmos.** IE de SP tem 12 digitos + DV calculado por modulo 11 com pesos especificos. RJ tem 8 digitos, MG tem 13 com 2 DVs, etc. Cada estado define o seu.
- **"ISENTO"** e valor valido pra contribuinte nao-obrigado a IE (consumidor final PF, alguns servicos). Aceitar literalmente sem calcular DV.
- **Sem traco/ponto/barra no banco.** Salvar so digitos. Mascara so na exibicao.
- **VARCHAR, nao BIGINT.** Algumas UFs aceitam letras em casos antigos.

## UFs cobertas nesta skill

| UF | Tamanho | Notas |
|---|---|---|
| SP | 12 digitos | Indutrial/comercial; outras especificas (produtor rural) tem padrao proprio |
| RJ | 8 | Modulo 11 com pesos [2,7,6,5,4,3,2] |
| MG | 13 | 2 DVs, algoritmo do estado |
| RS | 10 | Modulo 11 |
| PR | 10 | 2 DVs |
| SC | 9 | Modulo 11 |
| BA | 8 ou 9 | Modulo 10 ou 11 dependendo do primeiro digito |
| DF | 13 | 2 DVs |
| Demais | varia | Fallback formal (so tamanho) com aviso |

A skill **valida formato + DV pras UFs cobertas** e retorna **aceito-com-aviso** pras demais (tamanho ok, DV nao verificado). Pra integracao fiscal critica, complementar com consulta ao SINTEGRA/SEFAZ.

## Como invocar

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-ie.py SP 110.042.490.114
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-ie.py RJ 86.439.93-2
python3 ${CLAUDE_SKILL_DIR}/scripts/validar-ie.py SP ISENTO
```

> **Windows:** `python` em vez de `python3`.

Saida JSON: `{ "uf": "SP", "valido": true, "normalizado": "110042490114", "metodo": "dv-calculado" }`.

## Boas praticas

- Salvar como `VARCHAR(20)` por seguranca (alguns padroes antigos).
- Tabela `inscricoes_estaduais (id_empresa, uf, ie)` com UNIQUE `(uf, ie)` — empresa pode ter IE em mais de uma UF.
- Em formulario, pedir UF antes de IE — sem UF, validacao impossivel.
- LGPD: IE de PF (raro mas existe) e dado pessoal (LGPD-001).
- Fiscal: IE incorreta em NF-e e motivo de rejeicao na SEFAZ — sempre validar **antes** de assinar XML.

## Anti-padroes

- "Validar IE como CPF" — algoritmos diferentes, da falso-positivo.
- Salvar IE com mascara — quebra busca, ocupa mais espaco, e desnecessario.
- Aceitar IE de outra UF sem rechecar — empresa muda de estado, IE antiga vence.
- Hardcode `99.999.999-9` em fixture — use skill `gerar-test-fixture-br` (que vai ganhar suporte a IE).
