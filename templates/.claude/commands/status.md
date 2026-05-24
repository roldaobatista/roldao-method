---
description: Reporta progresso atual em PT-BR sem jargão — para o usuário não-programador.
argument-hint: "[escopo opcional: sprint | epico | feature | geral]"
disable-model-invocation: true
allowed-tools: Task, Read, Glob, Grep, Bash(git log:*), Bash(git status:*), Bash(git diff:*), Bash(git branch:*), Bash(git remote:*)
model: haiku
---

# /status — relatório de progresso

> **Dono de produto que não programa?** Este comando reporta progresso em PT-BR sem jargão. Se quiser entender quando usar, leia [`docs/PARA-DONO-DE-PRODUTO.md`](../../docs/PARA-DONO-DE-PRODUTO.md).

Use quando o usuário pergunta "como tá indo?", "o que falta?", "tá pronto pra subir?". Saída em PT-BR claro, sem stack trace, sem jargão.

`$ARGUMENTS` opcional define escopo (default: geral).

## Etapa 1 — Coletar (investigador)

Invoque `investigador`:
- Git: branch atual, último commit, commits pendentes (ahead/behind).
- Arquivos modificados não commitados.
- CI/testes: status do último run (se acessível).
- Stories abertas em `docs/stories/` (status = em-andamento ou pending).
- Sprint atual (se houver `docs/sprints/SP-NNN`).
- Issues abertas (se acessível via gh).

## Etapa 2 — Traduzir (tech-writer)

Invoque `tech-writer` pra reescrever em PT-BR claro. Aplicar tabela de tradução:

- "5 commits ahead of origin/main" → "tem 5 correções salvas no seu computador que ainda não subi pro servidor"
- "test suite passing" → "testei tudo, tá funcionando"
- "PR #42 pending review" → "tem 1 entrega esperando alguém aprovar"
- "story-points: 13 of 21 done" → "fizemos 13 de 21 pequenas tarefas — 62%"

## Etapa 3 — Saída

Formato visual claro:

```
STATUS — AAAA-MM-DD HH:MM

🟢 Funcionando bem
- <coisas OK em PT-BR>

🟡 Atenção
- <coisas que precisam decisão>

🔴 Bloqueado
- <coisas travadas>

📅 Próximos passos
1. <ação concreta>
2. <ação concreta>

⏱️ Tempo até próximo entregável
- <estimativa em dias/semanas, não story points>
```

## Importante

- **NUNCA** usar jargão sem traduzir. Hook `block-jargon-pt-br` vai bloquear.
- **NUNCA** mostrar stack trace cru. Resumir em 1 frase ("teste falhou no cálculo de troco").
- Se há bloqueio que depende de decisão do usuário, **perguntar explicitamente** o que ele quer.
- Se não tem bloqueio mas há próximo passo óbvio, **executar** (não esperar `posso fazer X?`).
