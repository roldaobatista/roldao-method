---
description: Mostra os ultimos N soft warnings agregados de `.claude/.runtime/warnings.jsonl`. Traduzidos em PT-BR claro. Util pra revisar avisos LGPD/regra-zero/jargao que passaram batidos durante a sessao.
argument-hint: "[N=20]"
disable-model-invocation: false
allowed-tools: Read, Write, Bash(jq:*), Bash(tail:*), Bash(wc:*), Bash(mv:*)
---

# /avisos — agregador de soft warnings

Comando rapido pra ver os avisos que o framework emitiu (sem bloquear) durante a sessao atual e anteriores. Avisos LGPD, regra zero, jargao, deprecation — coisas que iam pro stderr e sumiam.

## Etapa 1 — Coletar

Le `.claude/.runtime/warnings.jsonl`. Se nao existe: saida "Nenhum aviso registrado nesta sessao." e sair.

## Etapa 2 — Filtrar

Por padrao, mostrar **ultimos 20** entries (mais recentes primeiro). Se argumento `$ARGUMENTS` for um numero, usar esse N.

Formato de cada linha do JSONL (gravado pelo hook helper `emitSoftWarning()`):
```json
{
  "hook_id": "lgpd-base-legal-reminder",
  "severidade": "soft-warning",
  "ts": "2026-05-26T14:18:32Z",
  "projeto_hash": "abc123def456",
  "msg_ptbr": "Modulo `src/auth/cadastro.ts` coleta CPF mas nao declara base legal. Ver LGPD-007.",
  "regra": "LGPD-007",
  "arquivo_relacionado": "src/auth/cadastro.ts"
}
```

## Etapa 3 — Apresentar

Output em PT-BR claro:

```
AVISOS RECENTES — ultimos 20 de N total

[2 min atras] LGPD-007 — Modulo `src/auth/cadastro.ts` coleta CPF mas nao declara base legal.
[8 min atras] INV-005 — CLAUDE.md ultrapassou 150 linhas (esta com 167). Considerar mover detalhe pra arquivo separado.
[12 min atras] regra-zero — Voce reportou bug em pdf — antes de mexer em template, ler estado do banco primeiro.
[1h atras] LGPD-004 — Trilha de auditoria em `audit_log` nao marcou acesso a CPF (vide src/relatorio.ts:42).
[ontem] INV-AGENT-001 — Mensagem ao usuario "deploy" sem traducao PT-BR (pasta de release/).
...

(Mostrando 20 de 47 avisos totais. Pra ver todos: /avisos 47)

DICA: avisos sao soft warnings (nao bloquearam). Pra resolver: abrir arquivo indicado + verificar regra.
```

## Modo agrupado (`--por-regra`)

Se argumento `$ARGUMENTS` for `--por-regra`:

```
AVISOS AGRUPADOS POR REGRA

LGPD-007 (5 avisos)
  - src/auth/cadastro.ts (3x)
  - src/cliente/form.tsx (1x)
  - electron/main/payload.ts (1x)

LGPD-004 (3 avisos)
  - src/relatorio.ts (2x)
  - src/audit.ts (1x)

INV-005 (2 avisos)
  - CLAUDE.md (1x)
  - AGENTS.md (1x)
```

Util pra entender QUAL regra esta sendo mais sinalizada.

## Modo silencioso (`--zerar`)

Se argumento `$ARGUMENTS` for `--zerar`:

Move `warnings.jsonl` pra `warnings-AAAA-MM-DD.jsonl.archived` e cria novo arquivo vazio. **Usuario confirma** com S/N antes — operacao perde rastreio rapido (mas arquivo nao some, fica em `warnings-*.archived`).

## Integracao

- **`/saude`** consulta este arquivo pra dimensao LGPD/regra
- O agente `meta-cetico` (auto-auditoria do proprio framework) consome cross-sessao via `warnings.jsonl` quando disponivel

## Limites

- Comando rapido (< 3s)
- Nao escreve em `warnings.jsonl` (so le) fora do modo `--zerar`
- Modo `--zerar` exige confirmacao explicita
