---
name: gerar-test-fixture-br
description: Gera CPFs, CNPJs (numéricos e alfanuméricos pós-jul/2026), CEPs e telefones E.164 brasileiros VÁLIDOS por algoritmo para usar em fixtures, seeds e testes. Use quando precisar de dado sintético realista pra mock — evita o erro comum de colar "111.111.111-11" que falha em qualquer validador.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-18
status: stable
---

# gerar-test-fixture-br

Gera dados sintéticos brasileiros **matematicamente válidos** mas obviamente fake (padrão sequencial). Resolve o conflito entre:

- Validadores rejeitam "111.111.111-11" (todos iguais)
- Hook `no-test-data-in-fixtures` rejeita CPF real
- Dev coloca CPF real e vaza em CI/log

## Quando usar

- Antes de criar fixture/seed novo.
- Em fluxo de teste E2E que precisa de payload com CPF/CNPJ válido.
- Em demo/sandbox que precisa parecer real sem ser real.

## Uso

```bash
python3 scripts/gerar.py cpf 5
python3 scripts/gerar.py cnpj 3
python3 scripts/gerar.py cnpj-alfa 2
python3 scripts/gerar.py cep 4
python3 scripts/gerar.py telefone 3
python3 scripts/gerar.py email 2
python3 scripts/gerar.py nome 2
python3 scripts/gerar.py razao-social 2
python3 scripts/gerar.py all 1   # 1 fixture completa: nome, CPF, email, telefone, CEP
```
> **Windows:** substitua `python3` por `python` (o instalador oficial do Python no Windows cria apenas `python.exe`). No Git Bash, `python3` so existe via alias do user.


## Saída

Sempre escreve no stdout, 1 por linha. Pode pipar para arquivo:

```bash
python3 scripts/gerar.py cpf 100 > tests/fixtures/cpfs.txt
```

## Regras de geração

- **CPF:** prefixo `123456789` + DV calculado por módulo 11 → resultado obviamente sequencial.
- **CNPJ numérico:** prefixo `12345678000` + sequência + DV → obviamente sintético.
- **CNPJ alfanumérico (jul/2026+):** prefixo `12ABC34501DE` + DV (algoritmo módulo 11 com `ord(c) - 48`).
- **CEP:** prefixo de bairro fictício `99999-NNN`, sequencial.
- **Telefone E.164:** `+5511991234NNN` (sequencial pra evitar telefone real).
- **Email:** `usuarioNNN@example.com.br` (domínio reservado RFC 2606).
- **Nome:** combinação determinística de "Fulano|Maria|João|Ana" + "Teste|Sintético|Demo|Mock" + sufixo.
- **Razão social:** "Empresa Exemplo NNN Ltda" / "Comércio Sintético NNN ME" / "Serviços Demo NNN SA".

Todos passam pelos validadores oficiais (algoritmo correto), mas nunca colidem com pessoa/empresa real.

## Anti-padrões que esta skill resolve

| Errado | Por quê | Certo |
|---|---|---|
| `cpf: '111.111.111-11'` | Validador rejeita | `python3 gerar.py cpf 1` |
| `cpf: '123.456.789-09'` (manual) | É CPF público de teste — pode estar em alguma blocklist | Gerar sequencial novo |
| `email: 'roldao@gmail.com'` | Provedor real, hook bloqueia (TST-004) | `python3 gerar.py email 1` |
| `cnpj: '00.000.000/0001-00'` | Pode ser CNPJ de empresa pública real | `python3 gerar.py cnpj 1` |

## Integração com testes

JavaScript (Vitest/Jest):

```js
import { execSync } from 'node:child_process';

const cpfs = execSync(
  'python3 .claude/skills/gerar-test-fixture-br/scripts/gerar.py cpf 10'
).toString().trim().split('\n');
```

Python (pytest):

```python
import subprocess
def gerar(tipo, n=1):
    out = subprocess.check_output(
        ['python3', '.claude/skills/gerar-test-fixture-br/scripts/gerar.py', tipo, str(n)]
    ).decode().strip().split('\n')
    return out[0] if n == 1 else out
```

## Limitações

- Não gera **endereços plausíveis** (nome de rua/cidade real) — proposital, evita scraping.
- Não gera **IBAN/SWIFT** — escopo BR.
- Não gera **inscrição estadual / RG** — depende de UF, fora do escopo (skill futura).
