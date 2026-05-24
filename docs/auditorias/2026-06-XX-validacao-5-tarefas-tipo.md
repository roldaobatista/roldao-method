---
owner: roldao
revisado-em: 2026-05-24
status: aguardando-roldao
---

# Validação ao vivo — 5 tarefas-tipo do Roldão

> **Status:** aguardando Roldão executar quando tiver tempo/disposição. Em 2026-05-24, Roldão confirmou explicitamente que prefere deixar pendurado até execução real — Claude foi instruído a NÃO rodar como proxy (registro em `git log --grep="T-018"`).
>
> **TEMPLATE pronto pra execução.** Esta é a validação que **só o Roldão pode rodar** — gate do épico EP-002, AC-116-7 da story US-116. Atende ao critério "Roldão completa 5 tarefas-tipo sozinho sem ajuda humana técnica".
>
> **Como usar este arquivo:** o Roldão executa cada tarefa abaixo numa sessão real (com Claude Code rodando), registra **SHA do commit gerado**, marca **passou/não passou** e adiciona qualquer observação. Quando todas as 5 estiverem marcadas, o gate fecha e a v2.0 sai pra release.
>
> **Importante:** não é Claude/agente que preenche. Tem que ser o Roldão fazendo cada uma de verdade. Se o agente entrar pra ajudar a preencher, a validação não conta.

---

## Critério de "passou"

Pra cada tarefa, "passou" significa **as 4 condições juntas**:

1. ✅ Roldão executou sozinho — não chamou dev, não pediu ajuda externa.
2. ✅ Output veio em PT-BR claro — sem jargão, sem inglês.
3. ✅ Hooks bloquearam o que tinham que bloquear (se aplicável).
4. ✅ Resultado em disco bate com o esperado (commit, marker, arquivo).

Se UMA condição falhou, o item marca **não passou** — e isso é informação valiosa: aponta exatamente onde o framework ainda exige proxy.

---

## Tarefa 1 — Iniciar projeto novo do zero

**Comando:** `/inicio "loja de papelaria online"` (ou o que você quiser)

**O que esperamos ver:**
- Sofia (gerente-produto) propõe 3-5 user stories.
- Rafael (tech-lead) escolhe stack com tradeoffs explícitos.
- Bruno (dev-senior) monta esqueleto.
- Investigador valida stack montada (Etapa 4 — varredura).
- AGENTS.md fica preenchido sem `_(preencher)_` restando.
- `docs/readiness/EP-000-status.md` criado com `status: PRONTO`.

**Como você sabe que passou:**

```bash
npx roldao-method doctor
```

Deve retornar zero placeholders e zero arquivos faltando.

**Resultado:**

- [ ] Passou
- [ ] Não passou

**SHA do commit final:** _(preencher após executar)_
**Observações:** _(qualquer coisa que travou, qualquer mensagem em inglês, qualquer momento que pensou em pedir ajuda)_

---

## Tarefa 2 — Adotar o framework em projeto que já existe

**Comando:** `/brownfield` em um repo qualquer que você queira adotar (pode ser um repo de teste).

**O que esperamos ver:**
- Detetive (investigador) varre a stack atual.
- Rafael lê o resultado e propõe ARQ-001.
- Sofia preenche o AGENTS.md com dados detectados.
- Caio (auditor-segurança) faz sweep inicial.

**Como você sabe que passou:**

```bash
ls .claude/agents/ | wc -l   # 15 agentes copiados
ls AGENTS.md REGRAS-INEGOCIAVEIS.md CLAUDE.md   # 3 arquivos presentes
```

**Resultado:**

- [ ] Passou
- [ ] Não passou

**SHA do commit final:** _(preencher)_
**Observações:** _(...)_

---

## Tarefa 3 — Reportar bug e ver investigador rodar antes do dev

**Comando:** `/bug "tela do financeiro não carrega dados de fevereiro"`

**O que esperamos ver:**
- Hook `regra-zero-reminder.js` injeta lembrete da REGRA #0 antes do comando.
- Detetive (investigador) é invocado obrigatoriamente.
- Detetive lê banco/log/payload antes de propor solução.
- Bruno (dev-senior) só entra DEPOIS que o Detetive entregou achados.
- Hook `require-investigador-before-fix.js` bloquearia se Bruno tentasse pular.

**Como você sabe que passou:**

```bash
ls .claude/.runtime/investigation-*.json   # arquivo de investigação existe
```

Mensagem de proposta do Bruno cita o que o Detetive descobriu.

**Resultado:**

- [ ] Passou
- [ ] Não passou

**SHA do commit final:** _(preencher)_
**Observações:** _(...)_

---

## Tarefa 4 — Pedir feature nova com pipeline completo

**Comando:** `/feature US-NNN` (depois de criar uma user story qualquer).

**O que esperamos ver (pipeline completo Sofia → Detetive → Rafael → Bruno → Inês → 3 auditores):**

1. **Sofia** confirma que AC está testável.
2. **Detetive** lê o estado atual da área.
3. **Rafael** decide arquitetura, ADR se necessário.
4. **Bruno** implementa com TDD.
5. **Inês** (revisor) audita o diff.
6. **3 auditores** (Caio, Júlia, Pedro) em paralelo.
7. Hook `enforce-pipeline-completion.js` bloquearia commit/push se algum agente pulado.

**Como você sabe que passou:**

```bash
git log --oneline -10   # commits cita T-NNN e Co-Authored-By: Claude
ls .claude/.runtime/feature-active-*   # marker da sessão existiu
```

**Resultado:**

- [ ] Passou
- [ ] Não passou

**SHA do commit final:** _(preencher)_
**Observações:** _(...)_

---

## Tarefa 5 — Subir release fechada com CHANGELOG PT-BR claro

**Comando:** `/release` (depois de ter mudanças commitadas pra fechar).

**O que esperamos ver:**
- Camila (tech-writer) gera entrada nova no `CHANGELOG.md`.
- Entrada começa com bloco **"O que muda pra você (não-programador)"**.
- Versão bumpada (semver).
- Tag git criada.
- Sem jargão técnico no que aparece pro cliente final.

**Como você sabe que passou:**

```bash
head -30 CHANGELOG.md   # bloco "O que muda pra você" presente
git tag --sort=-v:refname | head -1   # tag nova criada
```

**Resultado:**

- [ ] Passou
- [ ] Não passou

**SHA do commit final:** _(preencher)_
**Observações:** _(...)_

---

## Resumo final

| Tarefa | Passou? | SHA | Notas |
|---|---|---|---|
| 1 — `/inicio` | ⬜ | _(sha)_ | _(...)_ |
| 2 — `/brownfield` | ⬜ | _(sha)_ | _(...)_ |
| 3 — `/bug` | ⬜ | _(sha)_ | _(...)_ |
| 4 — `/feature` | ⬜ | _(sha)_ | _(...)_ |
| 5 — `/release` | ⬜ | _(sha)_ | _(...)_ |

**Gate fecha quando:** 5/5 marcadas como "passou".

**Se alguma falhou:** abra `/bug` no próprio framework relatando o que travou. O ponto da validação não é "passar a qualquer custo" — é descobrir onde o framework ainda exige proxy técnico.

---

## Como instrumentar a sessão

Antes de cada tarefa, rode:

```bash
ROLDAO_VALIDACAO_5_TAREFAS=1 claude   # marca a sessão
```

Variável só serve pra que você lembre que está numa sessão de validação — não muda comportamento do framework. (Se quisermos no futuro, pode virar input de telemetria.)

Pra registrar SHA do commit:

```bash
git rev-parse HEAD   # copia a hash, cola na tabela
```

---

## Origem

- US-116 T-018 — AC-116-7 do PRD-003 / EP-002.
- Critério: gate do épico (`docs/epicos/EP-002-v2-0-auditoria-10-de-10.md` §"Critério de épico pronto" item 2).
- Métrica oficial em `docs/METRICA-OFICIAL.md`.

_Quando todos os 5 marcarem "passou", o EP-002 fecha e a v2.0 está pronta pra `npm publish`._
