---
description: Pega o último output técnico (erro, log, diff, plano) e traduz pra linguagem que o cliente/dono-de-produto entende — sem jargão, sem stack trace cru.
argument-hint: "[texto opcional — se omitido, usa o último output desta sessão]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(git log:*)
model: haiku
---

# /explicar-para-cliente — tradução técnica → cliente

Use quando o dev precisa repassar pro cliente final (dono de produto, gestor não-técnico, atendimento) o que aconteceu — sem jargão.

`$ARGUMENTS` opcional: cola direto o texto a traduzir. Sem argumento, usa o último output técnico desta sessão (erro, diff, plano, log, mensagem de commit).

## Etapa 1 — Identificar o tipo

Detecte qual gênero de texto chegou:

- **Stack trace / erro de build** → "tela X parou de funcionar, motivo Y, vou consertar"
- **Diff de código** → "mudei a lógica que faz Z; antes Z fazia X, agora faz Y"
- **Plano técnico** → "o que vou fazer, em quanto tempo, o que o cliente vai ver mudar"
- **Mensagem de commit** → "salvei a correção de X"
- **Log de teste/CI** → "rodei o robô que simula o usuário; passou em N, falhou em M"
- **Migração / DDL** → "vou mudar a estrutura dos dados salvos; o que pode ficar diferente"

## Etapa 2 — Aplicar a skill `traduzir-jargao`

Invoque a skill `traduzir-jargao` com o texto. Ela tem a tabela canônica de tradução PT-BR (CLAUDE.md global + AGENTS.md §8 do projeto).

Princípios:
- **Efeito visível** primeiro, causa depois ("a tela do financeiro não carrega — porque...").
- **Verbos do dia-a-dia**: "salvei", "subi", "voltei a versão anterior". NÃO: "commit", "deploy", "rollback".
- **Sem nome de arquivo/função** salvo se o cliente acompanha código.
- **Próximo passo concreto** no fim ("vou consertar até quinta", "preciso que você me confirme se X").

## Etapa 3 — Saída

Formato canônico do `tech-writer` modo MSG (ver `.claude/rules/tech-writer-output-templates.md`):

```
SINTOMA: <o que o cliente OBSERVA — sem termo técnico>
CAUSA: <1 frase em PT-BR claro, sem nome de framework/biblioteca>
JÁ FEITO: <o que já resolvi nesta sessão>
PRÓXIMO: <o que falta, prazo realista, decisão que dependo do cliente>
```

Se for diff de código (mudança aprovada, não erro):

```
O QUE MUDOU: <em 1 frase, foco no efeito pro usuário final>
POR QUE: <motivo de negócio, não técnico>
O CLIENTE VAI VER: <"nada" / "tela X com botão novo" / "campo Y vai aceitar acento agora">
PRECISA FAZER ALGO: <"nada" / "limpar cache do navegador" / "rodar essa migration na hora menos movimentada">
```

## Importante

- **Nunca cite nome de framework/biblioteca** (React, Postgres, etc.) — cliente não-técnico vai travar.
- **Nunca cole stack trace inteiro**. Resuma em 1 frase do efeito.
- **Se o output original tem mais de 1 problema**, separe: 1 bloco por problema.
- **Se você não entendeu o output técnico**, fala: "não consegui traduzir esse texto; preciso de mais contexto". Não chuta.
- Hook `block-jargon-pt-br.js` audita sua saída — se vazar jargão sem tradução, ele bloqueia.

## Quando NÃO usar

- Cliente é dev técnico ou time interno — passa o output cru.
- Mensagem já está em PT-BR claro — não precisa retraduzir.
- Pedido envolve decisão de negócio (preço, deadline) — usa `/status`, não esta.
