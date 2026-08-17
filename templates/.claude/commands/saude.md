---
description: Semaforo binario do projeto em 5 dimensoes — GIT, TESTES, STORIES, SEGURANCA, LGPD. Sem prosa. Saida ≤12 linhas.
argument-hint: "[--detalhado]"
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash(git status:*), Bash(git log:*), Bash(npm audit:*), Bash(npm test:*)
---

# /saude — semaforo do projeto

Comando rapido. Le 5 dimensoes do projeto e mostra verde/amarelo/vermelho em ≤12 linhas. Pra bater o olho e ver se algo critico.

## Etapa 1 — Coletar (paralelo)

Em paralelo, rodar:

1. **GIT** — `git status -s` (working tree limpo?) + `git log -1 --format=%cr` (ultimo commit)
2. **TESTES** — `cat .claude/.runtime/last-test-run.json` (se existir, ler timestamp + resultado); senao, rodar `npm test --silent 2>&1 | tail -3`
3. **STORIES** — `Glob docs/stories/US-*.md` + grep `status: in-progress` (quantas em andamento) + grep `status: draft` (quantas em rascunho)
4. **SEGURANCA** — `npm audit --json 2>&1 | jq '.metadata.vulnerabilities'` (vulnerabilidades por severidade)
5. **LGPD** — `Glob '**/audit_log*'` (existe trilha?) + Grep `LGPD-001|LGPD-007` em ADRs ativos (base legal declarada?)

## Etapa 2 — Classificar cada dimensao

| Verde | Amarelo | Vermelho |
|---|---|---|
| GIT limpo + commit < 24h | working tree dirty < 5 arquivos OU commit > 24h | dirty > 5 arquivos OU > 7 dias sem commit |
| Testes verdes < 2h atras | Testes verdes > 2h OU nao rodados na sessao | Testes vermelhos OU nao executados ha > 7 dias |
| 0-2 stories in-progress | 3-5 in-progress | > 5 in-progress OU stories sem dono |
| 0 vulnerabilidades | 1-5 low/moderate | 1+ high/critical OU > 5 moderate |
| Trilha de auditoria existente + base legal | Trilha sim mas base legal nao declarada | Sem trilha OU PII em log puro |

## Etapa 3 — Saida (≤12 linhas)

Formato fixo:

```
SAUDE DO PROJETO — AAAA-MM-DD HH:MM

[verde]    GIT          tudo salvo, ultimo commit 2h atras
[verde]    TESTES       todos passando (validado 1h atras)
[amarelo]  STORIES      3 stories em andamento, 1 sem dono
[vermelho] SEGURANCA    1 dependencia com alerta critico (lodash 4.17.15)
[verde]    LGPD         trilha de auditoria + base legal declarada

ACAO RECOMENDADA: rodar `npm audit fix` ou `/auditoria`
```

Se algum vermelho: linha "ACAO RECOMENDADA" obrigatoria com sugestao concreta.
Se todos verde: linha "ACAO RECOMENDADA" omitida.

## Modo `--detalhado`

Se argumento `--detalhado`: alem do semaforo, lista os itens:

```
SAUDE DO PROJETO — AAAA-MM-DD HH:MM

[verde] GIT
  - working tree limpo
  - ultimo commit: feat(T-117-003) — 2h atras

[vermelho] SEGURANCA
  - lodash@4.17.15 — vulnerabilidade critica (CVE-XXXX-XXXX)
  - Sugestao: npm install lodash@4.17.21

ACAO RECOMENDADA: rodar `npm audit fix`
```

## Limites

- Saida sem prosa. Sem explicacao. Sem opiniao.
- Comando deve rodar em < 5 segundos
- Se algum collector der erro, marcar `[?] DIMENSAO  erro ao coletar: <motivo>` em vez de falhar
