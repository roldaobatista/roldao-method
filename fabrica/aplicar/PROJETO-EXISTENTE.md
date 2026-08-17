---
proposito: Roteiro para o agente IA aplicar a Fábrica num projeto que JÁ EXISTE (ex: Kalibrium).
idioma: pt-BR
---

# Aplicar a Fábrica em projeto existente

> Princípio: **sem big-bang.** A Fábrica entra tarefa a tarefa, não reescrevendo o projeto.
> O agente lê este roteiro e materializa no projeto de destino.

## Passo 1 — Criar a pasta de operação no projeto
```
<projeto>/docs/fabrica/
├── tarefas/        (uma pasta ou arquivo por tarefa: tarefa + evidência)
├── specs/          (especificações executáveis, quando tier pedir)
├── releases/       (checklists de subida preenchidos, um por versão)
└── aprendizado/    (registros bug-vira-teste)
```
Copiar os templates de `fabrica/templates/` para `<projeto>/docs/fabrica/_templates/`.

## Passo 2 — Ligar o método no contrato do projeto
Adicionar no `CLAUDE.md` (ou `AGENTS.md`) do projeto uma seção curta:

```markdown
## Fábrica (método operacional)
Toda mudança segue o Caminho Padrão da Fábrica (docs/fabrica/_templates/).
- Classificar tier de risco no início de cada tarefa (0-4).
- Tier 2+: evidência obrigatória antes de "pronto".
- Tier 3+: especificação executável antes do código + checklist de release antes de subir.
- Todo bug corrigido gera registro bug-vira-teste com teste de regressão.
```

## Passo 3 — Guarda-corpos mecânicos (se ainda não tiver)
```
npx roldao-method init
```
Instala os hooks que barram comando destrutivo, senha vazada e mascaramento de teste.
(Se o projeto já tem hooks próprios, comparar antes — não duplicar bloqueio.)

## Passo 4 — Classificar os fluxos críticos do projeto (uma vez só)
Listar em `docs/fabrica/FLUXOS-CRITICOS.md` os 3-7 fluxos que NUNCA podem quebrar
(ex: emitir certificado, fechar financeiro, gerar PDF). Esses entram em todo
checklist de release como verificação pós-subida.

## Passo 5 — Começar na próxima tarefa
A próxima demanda que chegar já nasce pelo template `tarefa`. Não converter
retroativamente nada — o histórico antigo fica como está.

## Sinais de que está funcionando (medir por sensação + fatos, sem burocracia)
- Caiu o retrabalho ("não era isso que pedi").
- Bug que já apareceu uma vez não voltou.
- Subida pro cliente deixou de dar susto.
- Se os templates estiverem virando papelada sem valor em tier baixo → cortar cerimônia, não o método.
