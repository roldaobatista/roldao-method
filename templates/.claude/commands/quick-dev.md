---
description: Atalho pra mudancas triviais (cosmetica, label, regra simples). Pula investigador e auditores. So use se a mudanca cabe em ate 3 arquivos.
argument-hint: "[descricao-curta]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(npm test:*), Bash(npm run:*)
model: haiku
---

# /quick-dev — atalho pra mudancas triviais

Use `$ARGUMENTS` como descricao da mudanca em **1 frase**.

## Quando usar

So se TODAS forem verdadeiras:

- Mudanca cosmetica (cor, texto, label) **ou** ajuste simples sem regra de negocio nova
- **Nao toca calculo, validacao, regra de negocio existente** — qualquer mudanca em logica de produto vira `/feature` (mesmo que pareca pequena)
- Nao toca banco, migration, contrato de API, integracao externa
- Nao toca dado pessoal nem fluxo fiscal
- Cabe em ate **3 arquivos** e **50 linhas**
- Nao e bug reportado (bug = use `/bug`)
- A descricao cabe em 1 frase sem ambiguidade

Se algum falhar, **use `/feature`**.

## Sinais que NAO e trivial

- "Conserta esse bug rapido" → `/bug` (REGRA #0 vale sempre)
- "So uma coisinha no banco" → `/feature`
- "Adiciona campo na API" → `/feature` (contrato publico)
- "Muda esse calculo de imposto" → `/feature` + agente `fiscal-br`

## Fluxo

1. **Marque a sessao** (mecanico — o sistema usa pra contar arquivos):
   ```bash
   SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
   [ -z "$SESSION_HASH" ] && SESSION_HASH=default
   mkdir -p .claude/.runtime && touch .claude/.runtime/quick-dev-active-${SESSION_HASH}
   ```

2. **Comprima o intent em 1 frase.** Ex: "Mudar label do botao Salvar pra Confirmar na tela de cadastro." Se precisa de mais de 1 frase, **pare e use `/feature`**.

3. **Invoque `dev-senior`** com: intent + arquivos + 1-2 AC simples. Dev faz a mudanca + 1 teste objetivo.

4. **Invoque `revisor`.** Se BLOQUEADO, volta pro dev ou sobe pra `/feature`.

5. **Commit com ID rastreavel.** Mesmo sendo trivial, precisa de `T-NNN`:
   - Pegue proximo `T-NNN` (olhe `git log` por `T-\d+`).
   - Se tem story relacionada, cite ambos: `(US-005 T-042)`.
   - Formato: `fix(escopo): descricao (T-NNN)`.

6. **Limpe os markers** ao terminar:
   ```bash
   rm -f .claude/.runtime/quick-dev-active-${SESSION_HASH}
   rm -f .claude/.runtime/quick-dev-files-${SESSION_HASH}
   ```

## Saida final

```
QUICK-DEV ENTREGUE
Intent: <1 frase>
Arquivos: <N>/3   Linhas: <N>/50
Revisor: APROVADO
Commit: T-NNN <hash>
```

## Por que existe

Sem atalho controlado, o agente pula etapas no `/feature` "porque e simples" — e perde disciplina. `/quick-dev` e o atalho **explicito** com limite duro (3 arquivos, codificado em `validate-quick-dev-scope.sh`).

## Importante

- Sem auditores. Sem ADR. Mas hooks bloqueadores continuam ativos.
- Se hook bloquear, NAO mascare — corrija a causa ou suba pra `/feature`.
