---
description: Corrige bug em comportamento existente. Investigador OBRIGATÓRIO antes de qualquer mudança de código. Codifica a REGRA #0 do ROLDAO-METHOD.
---

# /bug — corrigir bug

**REGRA #0 ATIVA:** você NÃO escreve uma linha de código antes de o investigador reportar a causa raiz.

Use `$ARGUMENTS` como descrição do bug reportado.

## Etapa 1 — Investigador (OBRIGATÓRIO)

Invoque `investigador`:
- Lê estado real (banco, log, payload, console, config).
- Rastreia onde o dado é gerado, salvo e lido.
- Identifica builders/handlers duplicados se houver.
- Reporta causa raiz + ponto específico da correção.

**Não pule. Não substitua.** Se o investigador disser "preciso de mais info", pergunte ao usuário ANTES de propor solução.

## Etapa 2 — Confirmação com usuário (se houver ambiguidade)

Se o investigador apontou ambiguidade na descrição do bug ("X não saiu" pode ser "quero que apareça" OU "tirar essa mensagem chata"):
- **PARE.**
- Pergunte ao usuário com 2-3 opções claras (`AskUserQuestion`).
- Só siga após confirmação.

## Etapa 3 — Dev Sênior

Invoque `dev-senior` com:
- Relatório do investigador (causa raiz + ponto da correção).
- Confirmação da intenção do usuário.

Dev Sênior:
- Conserta NO PONTO RAIZ, não no sintoma.
- Adiciona teste de regressão pra esse bug.
- Commit atômico citando o bug.

## Etapa 4 — Revisor

Invoque `revisor`:
- Verifica se a correção ataca a causa raiz reportada (não só sintoma).
- Verifica teste de regressão.
- Audita anti-padrões / mascaramento.

## Saída final

```
BUG CORRIGIDO

Descrição original: <pedido do usuário>
Causa raiz (investigador): <onde estava o problema real>
Local da correção: <arquivo:linha>
Teste de regressão: <adicionado, nome do teste>
Revisor: APROVADO

O cliente vai notar: <descrição em PT-BR sem jargão>
```

## Anti-padrões PROIBIDOS neste workflow

- Mudar template/UI/CSS sem ler dados do banco primeiro.
- Tratar sintoma (ex: filtrar valor na UI) em vez de causa (ex: corrigir gravação).
- Adicionar try/catch que esconde o erro original.
- Mascarar teste antigo que ficou falhando.

Se você se pegar fazendo qualquer um desses: **pare e volte pro investigador.**
