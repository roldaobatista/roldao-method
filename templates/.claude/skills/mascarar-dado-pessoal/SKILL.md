---
name: mascarar-dado-pessoal
description: Mascara CPF, CNPJ, email, telefone E.164, chave Pix, RG, IE, CNH, RENAVAM, titulo de eleitor e cartao de credito para exibicao em log/console/relatorio sem vazar dado pessoal. Sustenta LGPD-004 (trilha de auditoria nao registra dado em texto puro) e PIX-004 (chave Pix mascarada). Use SEMPRE que dado pessoal sair pra log, console, error report, mensagem ao usuario ou export. CLI + lib Python importavel.
allowed-tools: Bash(python3:*), Bash(python:*), Bash(py:*)
owner: framework
revisado-em: 2026-05-25
status: stable
---

# mascarar-dado-pessoal

Padroniza mascaramento de dado pessoal BR para exibicao segura. Resolve o problema do desenvolvedor escrever `f"erro no usuario {cpf}"` e o log vazar `12345678909` em texto puro.

## Regras de mascaramento (padrao)

| Tipo | Original | Mascarado |
|---|---|---|
| CPF | `12345678909` | `***.***.789-09` |
| CNPJ | `12345678000195` | `**.***.***/0001-95` |
| Email | `joao.silva@empresa.com.br` | `j***@empresa.com.br` |
| Telefone E.164 | `+5511987654321` | `+5511*****4321` |
| Chave Pix (CPF) | `12345678909` | `***.***.***-09` |
| Chave Pix (email) | `joao@empresa.com.br` | `j***@***.com.br` |
| Chave Pix (UUID) | `123e4567-e89b-12d3-a456-426614174000` | `123e****-****-****-****-****14174000` |
| RG | `12.345.678-9` | `**.***.**8-9` |
| IE | `110.042.490.114` | `***.***.***.114` |
| CNH | `12345678900` | `*********00` |
| RENAVAM | `12345678900` | `*********00` |
| Titulo eleitor | `123456789012` | `**** **** **12` |
| Cartao credito | `4111111111111111` | `**** **** **** 1111` |

## Como invocar

```bash
# CLI
python3 ${CLAUDE_SKILL_DIR}/scripts/mascarar.py cpf 12345678909
python3 ${CLAUDE_SKILL_DIR}/scripts/mascarar.py email joao@empresa.com.br
python3 ${CLAUDE_SKILL_DIR}/scripts/mascarar.py auto "Pedido de joao@empresa.com.br CPF 12345678909"
```

> **Windows:** `python` em vez de `python3`.

Saida CLI: 1 linha com o valor mascarado. Use modo `auto` pra detectar tipo em texto livre (re-substitui todos os matches).

## Importar como lib em Python

```python
import sys
sys.path.insert(0, ".claude/skills/mascarar-dado-pessoal/scripts")
from mascarar import mascarar_cpf, mascarar_email, mascarar_auto

logger.info(f"pedido falhou: cliente={mascarar_cpf(usuario.cpf)}")
logger.audit(f"acessou registro={mascarar_auto(json.dumps(payload))}")
```

## Boas praticas

- Logger global aplicado uma vez no setup: filter que rode `mascarar_auto` em todos os records.
- NUNCA logar payload bruto de API externa sem passar por `mascarar_auto`.
- Erros enviados pra Sentry/Datadog/observabilidade: sanitizar antes.
- Audit trail estruturada (LGPD-004): salvar `actor_id`, NAO `actor_cpf`.
- Para Pix (PIX-004): hook `no-log-pix-key.js` ja bloqueia log de chave em texto puro — esta skill e a contraparte construtiva (como FAZER certo).

## Anti-padroes

- `print(cliente)` em controller — toda struct de cliente vai pro stdout.
- Email mascarado como `***@***.com` — perde dominio, dificulta debug. Padrao do framework: preservar dominio.
- Mascarar a coluna no banco — quebra busca/UNIQUE/integridade. Mascarar SO na saida (log/UI/export).
- CPF "anonimizado" como `12345678909` -> `XXXXXXXXX09` — descaracteriza, mas algoritmo de mascaramento padrao do framework usa `***`.
