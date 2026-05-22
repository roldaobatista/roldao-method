---
description: Reorganiza código sem mudar comportamento. Tech-lead avalia, dev-senior executa, revisor verifica.
argument-hint: "[area-ou-arquivo-a-refatorar]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(npm test:*), Bash(npm run:*), Task
---

# /refactor — reorganizar sem mudar comportamento

Use `$ARGUMENTS` como descrição do refactor pretendido.

## Princípio absoluto

> Refactor **NÃO muda comportamento.** Se mudou comportamento, virou feature ou bug fix.

Saída pro usuário no fim **deve mostrar zero diferença visível** — ou então você fez algo errado.

## Etapa 1 — Tech Lead

Invoque `tech-lead`:
- Avalia se o refactor vale a pena agora.
- Identifica risco (área crítica? muito acoplamento?).
- Define **escopo do refactor** (até onde vai e onde para).
- Identifica testes que precisam estar passando ANTES de começar.

Se Tech Lead disser "não vale a pena agora" ou "está faltando teste de cobertura nessa área": **parar e reportar.**

## Etapa 2 — Suite de testes verde como pré-requisito

Antes de tocar em qualquer código:
- Rodar suite de testes que cobre a área.
- Confirmar que TODOS passam ANTES do refactor.

Se algum falha: **parar.** Não refatorar com testes vermelhos — você não vai saber se quebrou algo no caminho.

## Etapa 3 — Dev Sênior

Invoque `dev-senior` com:
- Escopo do refactor definido pelo Tech Lead.
- Lista de testes que devem continuar verdes.

Dev Sênior:
- Faz a reorganização.
- **Roda os testes a cada commit atômico.**
- Se algum teste quebra: para, investiga, conserta no mesmo commit OU reverte.

## Etapa 4 — Revisor

Invoque `revisor`:
- Verifica que comportamento externo está idêntico.
- Verifica que testes continuam verdes.
- Verifica que nenhuma "feature acidental" entrou.
- Verifica que escopo foi respeitado (não foi além).

## Saída final

```
REFACTOR ENTREGUE

Escopo: <descrição>
Arquivos tocados: <N>
Testes (antes): <N verdes>
Testes (depois): <N verdes>
Comportamento externo: IDÊNTICO
Cliente vai notar: NADA (esse é o objetivo)
```

## Quando NÃO refatorar

- Testes não cobrem a área → escrever testes primeiro.
- Releases iminente → adiar pra depois.
- Tech Lead disse que custo > benefício → respeitar.
