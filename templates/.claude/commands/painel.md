---
description: Painel de instrumentos do projeto — status + pipeline ativo + custo + linha do tempo + saude em UM output ASCII consolidado de ≤24 linhas.
argument-hint: ""
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash(git status:*), Bash(git log:*), Bash(jq:*)
---

# /painel — tela de instrumentos

Tela unica que mostra TUDO que esta acontecendo agora. Pra bater o olho em 5 segundos e saber: qual fase do pipeline, quanto custou hoje, o que esta pendente, ha quantos minutos o agente esta trabalhando.

Combina dados de varios arquivos numa visao consolidada.

## Etapa 1 — Coletar (paralelo)

1. **Projeto:** package.json (nome+versao) + branch atual
2. **Pipeline ativo:** ultimo `.claude/.runtime/pipeline-state-*.json` (US ativa + fase corrente + tempo na fase)
3. **Orcamento da sessao:** `metrics.jsonl` somar tokens_in + tokens_out + custo_usd
4. **Linha do tempo:** ultimos 5 entries em `metrics.jsonl` (timestamp + agente + duracao)
5. **Saude:** mesmo computo do `/saude` em formato compacto

## Etapa 2 — Renderizar

Saida em ASCII puro (sem unicode complexo — compat Windows):

```
PROJETO: <nome-do-projeto> - branch: main - v1.0.0

PIPELINE ATIVO
[3/7] Rafael (tech-lead) - rodando ha 1m12s
US-231 - Checkout com Pix

ORCAMENTO HOJE
Tokens: 142k/1M (14%) ---------------- 
Custo:  $1.40 USD

LINHA DO TEMPO (ultimos 5)
14:02 | Sofia    | US-231 escrita     | 18s
14:03 | Detetive | leu auth.js x3     | 45s
14:04 | Rafael   | ADR-008 em escrita | 1m12s (agora)
14:00 | (status) | sessao iniciada    |  -
13:45 | Camila   | release notes v2.5 | 2m30s

SAUDE
[v] GIT       [v] TESTES  [a] STORIES  [v] SEC  [v] LGPD

PROXIMO PASSO LOGICO
  - Rafael termina ADR-008 (esperado ~2 min)
  - Depois: Bruno (dev-senior) implementa
```

## Adaptacoes por contexto

### Sem pipeline ativo

```
PROJETO: <nome-do-projeto> - branch: main

NENHUM PIPELINE ATIVO

ULTIMA SESSAO (3 dias atras)
US-230 - Sprint 5 - entregue AAAA-MM-DD
Custo da sessao: $0.85

PENDENTES
- US-231 (aguardando ADRs aceitos)
- 3 stories em status draft

PROXIMO PASSO LOGICO
  - Revisar 10 ADRs proposta (1-2h leitura)
  - Re-rodar /readiness EP-003
```

### Sessao recem-iniciada (sem dados)

```
PROJETO: <nome-do-projeto> - branch: main

SESSAO INICIADA HA 30s. Aguardando primeiro agente.

ESTADO DO PROJETO
- 22 ADRs em status aceito
- 116 stories entregues
- v1.0.0 ultimo release

DICA: rodar /retomar pra retomar US ativa OU /historia US-231 pra comecar
```

## Limites

- Saida sempre ≤24 linhas (forca disciplina)
- ASCII puro — compat Windows/Mac/Linux terminal
- Tempo de render < 2 segundos
- Sem prosa. Sem opiniao. So dado.
