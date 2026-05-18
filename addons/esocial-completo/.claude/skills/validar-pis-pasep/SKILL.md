---
name: validar-pis-pasep
description: Valida PIS/PASEP/NIS brasileiros (11 dígitos) com algoritmo módulo 11. Use sempre que receber, salvar ou consultar PIS/PASEP/NIS — em admissão, folha, eSocial, ou qualquer integração com Receita Federal/Caixa.
owner: esocial-completo
revisado-em: 2026-05-18
status: stable
---

# validar-pis-pasep

Valida PIS (Programa de Integração Social), PASEP (Programa de Formação do Patrimônio do Servidor Público) e NIS (Número de Identificação Social) brasileiros — todos 11 dígitos, mesmo algoritmo de dígito verificador.

## Quando usar

- Admissão eSocial (S-2200) — PIS obrigatório.
- Folha de pagamento.
- Consulta CAIXA / FGTS.
- Importação de planilha de RH.
- Cadastro de pensão alimentícia (BPC, Bolsa Família).

## Uso

```bash
python3 scripts/validar-pis.py "17033259504"
python3 scripts/validar-pis.py "170.33259.50-4"
```
> **Windows:** substitua `python3` por `python` (o instalador oficial do Python no Windows cria apenas `python.exe`). No Git Bash, `python3` so existe via alias do user.


Output:
```
OK PIS/PASEP/NIS válido
INVÁLIDO DV de PIS/PASEP/NIS inválido
INVÁLIDO formato esperado: 11 dígitos
```

## Algoritmo

Módulo 11 com pesos `[3, 2, 9, 8, 7, 6, 5, 4, 3, 2]` aplicados aos 10 primeiros dígitos. Resto 10 → DV = 0.

```python
PESOS_PIS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

def valida_pis(s: str) -> bool:
    d = ''.join(c for c in s if c.isdigit())
    if len(d) != 11:
        return False
    if d == d[0] * 11:
        return False
    soma = sum(int(d[i]) * PESOS_PIS[i] for i in range(10))
    resto = soma % 11
    dv = 0 if resto < 2 else 11 - resto
    return int(d[10]) == dv
```

## Sinteticos pra teste

Use em fixture:
- `17033259504` — válido (sintético, DV correto por módulo 11)
- `00000000000` — REJEITADO (sintético óbvio inválido)

Gere algoritmicamente com `gerar-test-fixture-br` (extensão pendente — TODO).

## Integração com eSocial

- Hook `validate-esocial-prazo` (addon esocial-completo) checa prazo, mas NÃO valida PIS.
- Skill `emitir-evento-esocial` usa esta skill antes de montar payload.

## Anti-padrões

- Salvar PIS sem validar → vira evento rejeitado pelo eSocial e atraso.
- Regex `/^\d{11}$/` sem DV → aceita lixo.
- Não tratar PIS com pontuação `xxx.xxxxx.xx-x` na entrada do form.

## Referências

- Caixa Econômica Federal — Manual PIS
- eSocial — S-2200 (admissão)
- IN RFB para PASEP
