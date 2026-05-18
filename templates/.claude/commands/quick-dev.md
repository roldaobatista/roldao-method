---
description: Atalho pra features triviais — pula investigador + auditores. Use só pra mudanças cosméticas, copy, label, regra simples.
argument-hint: "[descricao-curta]"
disable-model-invocation: true
---

# /quick-dev — implementação rápida (apenas trivial)

Atalho do `/feature` para mudanças **claramente triviais**. Use `$ARGUMENTS` como descrição.

## Quando USAR `/quick-dev`

Apenas se TODAS estas condições forem verdadeiras:

- [ ] É mudança **cosmética** (cor, texto, label, mensagem) **OU** regra simples isolada (validação de campo, formatação, ordenação).
- [ ] **NÃO toca** banco, migration, contrato de API público, ou integração externa.
- [ ] **NÃO toca** dado pessoal nem fluxo fiscal.
- [ ] Cabe em **≤ 3 arquivos** e **≤ 50 linhas** de diff.
- [ ] Não é correção de bug reportado (se é bug, use `/bug` — investigador é obrigatório).
- [ ] Não tem ambiguidade — o que pede está claro em uma frase.

Se qualquer item falhar, **abortar e chamar `/feature`** em vez de `/quick-dev`.

## Quando NÃO USAR (sinais de alerta)

❌ "Conserta esse bug rápido" → use `/bug`, não `/quick-dev`. REGRA #0 vale sempre.
❌ "Só uma coisinha no banco" → `/feature`, precisa do tech-lead.
❌ "Adiciona esse campo na API" → contrato público, use `/feature`.
❌ "Muda esse cálculo de imposto" → fiscal, precisa `fiscal-br`.

## Etapa 0 — Marcar sessão (mecânico)

Antes de qualquer mudança, crie marker pra ativar o gate de escopo. O sufixo PRECISA ser o mesmo hash que os hooks usam (CLAUDE_SESSION_ID só alfanumérico), senão o marcador não casa:

```bash
SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
[ -z "$SESSION_HASH" ] && SESSION_HASH=default
mkdir -p .claude/.runtime && touch .claude/.runtime/quick-dev-active-${SESSION_HASH}
```

> O hook `validate-quick-dev-scope.sh` conta arquivos únicos tocados nesta sessão. Se passar de 3, bloqueia com exit 2 e sugere `/feature`. Isso codifica o limite "≤3 arquivos" que antes era só checklist visual.

## Etapa 1 — Compressão de intent

Você descreve a mudança em **1 frase** sem ambiguidade:

> "Mudar o label do botão de 'Salvar' pra 'Confirmar' na tela de cadastro de cliente."

Se você precisa de mais de 1 frase, NÃO é trivial. Vá pro `/feature`.

## Etapa 2 — Auto-check (sem invocar agente)

Você mesmo verifica:

- A mudança bate com o intent comprimido?
- Algum dos sinais de alerta acima foi acionado?
- Você consegue listar os arquivos afetados antes de mexer?

Se passou, segue. Se não, **PARE e chame `/feature`**.

## Etapa 3 — Dev Sênior

Invoque `dev-senior` com:
- Intent comprimido (1 frase).
- Arquivos a tocar (lista curta).
- Critério de aceitação simples (1-2 itens).

Dev faz a mudança + 1 teste objetivo (snapshot, unitário curto).

## Etapa 4 — Revisor

Invoque `revisor`:
- Confere se a mudança bate com o intent.
- Confere se não vazou pra fora do escopo declarado.
- Confere se hooks bloqueadores passaram.

Se BLOQUEADO: volta pro dev OU sobe pra `/feature` se descobriu que não era trivial.

## Etapa 5 — Commit rastreável (obrigatório)

Mesmo sendo trivial, **toda mudança precisa de ID rastreável**. Sem isso, daqui 6 meses ninguém sabe por que mexeu naquela linha.

1. Gere um T-NNN novo. Como `/quick-dev` não cria story (US-NNN), use o próximo `T-NNN` global — confira `git log` por `T-\d+` e pegue um inédito.
2. Se a mudança está ligada a uma story existente (label de tela vinculada a US-005, por exemplo), cite **ambos**: `(US-005 T-042)`.
3. Faça commit no formato:

```
fix(escopo): <descricao curta> (T-NNN)
```

Exemplos:
- `style(cadastro): label do botão Salvar vira Confirmar (T-042)`
- `fix(validador): permitir CEP com hífen na entrada (US-005 T-043)`

O hook `commit-message-validator.sh` exige `T-NNN` em commits com prefixo `feat:` ou `fix:` durante `/feature` ativo. `/quick-dev` segue a mesma regra por consistência — sem rastro, mudança vira lixo invisível em 1 mês.

## Saída final

```
QUICK-DEV ENTREGUE

Intent: <1 frase>
Arquivos tocados: <N> (limite: 3)
Linhas: <N> (limite: 50)
Revisor: APROVADO
Hooks: PASSARAM
Commit: T-NNN <hash curto>
```

Ao final, limpe os markers da sessão:
```
rm -f .claude/.runtime/quick-dev-active-${SESSION_HASH}
rm -f .claude/.runtime/quick-dev-files-${SESSION_HASH}
```

## Importante

- **Sem auditores** — se mudança exigia auditoria, não era trivial. Use `/feature`.
- **Sem ADR** — se mudança exigia ADR, não era trivial.
- **Sem dispensa de hooks bloqueadores** — eles continuam rodando normalmente.
- Se hook bloquear, NÃO suprimir. Resolver na raiz ou subir pra `/feature`.

## Por que esse comando existe

Workflows completos (`/feature`) são caros pra mudanças triviais. Sem atalho controlado, o agente pula etapas no `/feature` "porque é simples" — e perde a disciplina. `/quick-dev` é o atalho **explícito** com escopo definido, em vez de erosão silenciosa do `/feature`.
