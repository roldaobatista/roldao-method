---
owner: roldao
revisado-em: 2026-05-27
status: draft
escopo: validacao ao vivo das 5 tarefas-tipo (AC-116-7) — gate final do EP-002 / v2.0.0
---

# Validacao ao vivo — 5 tarefas-tipo do Roldao (AC-116-7)

> **Como funciona:** Roldao executa cada tarefa abaixo em sessao Claude **sem ajuda humana tecnica** (sem chamar dev pra traduzir). Cada uma marca PASSOU ou NAO PASSOU com o SHA do commit gerado. Se 5/5 passam, fecha o EP-002 oficialmente.
>
> **Sessao limpa:** comecar com `npx roldao-method status` mostrando "Nada pendente". Se algo ja estiver aberto, fechar antes.

---

## Tarefa 1 — Iniciar projeto novo

**O que executar:** abrir Claude Code em pasta vazia e digitar `/inicio`. Responder as perguntas do tutorial sozinho. Resultado esperado: AGENTS.md preenchido, primeira US criada, primeiro ADR (se necessario), tudo em PT-BR.

**Como saber que passou:**
- [ ] AGENTS.md secao 1 (Identidade) sem `_(preencher)_`
- [ ] Pelo menos 1 US em `docs/stories/`
- [ ] Mensagens em PT-BR claro do comeco ao fim (sem precisar perguntar "o que e X?")

**Resultado:** PASSOU / NAO PASSOU
**SHA do commit gerado:** `_(preencher apos)_`
**Observacao:** `_(opcional — o que deu certo, o que travou)_`

---

## Tarefa 2 — Adotar projeto legado

**O que executar:** em pasta com codigo existente (sem doc), rodar `/brownfield`. Diagnostico deve sair em 1 pagina PT-BR, sem jargao tecnico ininteligivel.

**Como saber que passou:**
- [ ] Diagnostico em `docs/brownfield-diagnostico-*.md` legivel sem dev pra traduzir
- [ ] Lista de gaps em ordem de prioridade
- [ ] Recomenda proximo passo concreto

**Resultado:** PASSOU / NAO PASSOU
**SHA do commit gerado:** `_(preencher apos)_`

---

## Tarefa 3 — Reportar um bug

**O que executar:** digitar `/bug <descricao do bug em PT-BR claro>`. Esperar pipeline rodar.

**Como saber que passou:**
- [ ] Investigador roda automaticamente (NAO pede "quer que eu investigue?")
- [ ] Reporta CAUSA RAIZ, nao so sintoma
- [ ] Correcao no PONTO RAIZ
- [ ] Mensagem final em PT-BR

**Resultado:** PASSOU / NAO PASSOU
**SHA do commit gerado:** `_(preencher apos)_`

---

## Tarefa 4 — Pedir feature pequena

**O que executar:** digitar `/feature <descricao em PT-BR>` pra algo pequeno-medio (ex: "adicionar campo X no formulario Y").

**Como saber que passou:**
- [ ] Pipeline 7 etapas (Sofia -> Detetive -> Rafael -> Bruno -> Ines -> 3 auditores) roda completo
- [ ] ZERO pergunta evitavel pro Roldao no meio (so AskUserQuestion com opcoes pre-formuladas em decisao real)
- [ ] Commit final aprovado pelos 3 auditores
- [ ] Checkpoint gerado

**Resultado:** PASSOU / NAO PASSOU
**SHA do commit gerado:** `_(preencher apos)_`

---

## Tarefa 5 — Fechar release

**O que executar:** com mudancas acumuladas (das tarefas 1-4 ou outras), rodar `/release`.

**Como saber que passou:**
- [ ] CHANGELOG bloco novo em PT-BR claro
- [ ] Secao "O que muda pra voce (nao-programador)" preenchida
- [ ] Tag git criada
- [ ] release notes em `docs/releases/vX.Y.Z.md`
- [ ] ZERO termo cru tipo "refactor", "lint", "build" sem traducao

**Resultado:** PASSOU / NAO PASSOU
**SHA do commit gerado:** `_(preencher apos)_`

---

## Veredito final do EP-002

**Tarefas que passaram:** _ / 5

- [ ] 5/5 → **EP-002 FECHADO.** v2.0.0 honesta. Atualizar AC-116-7 como ENTREGUE. Atualizar status do EP-002 pra `entregue`.
- [ ] < 5/5 → **EP-002 NAO FECHADO.** Listar tarefas que falharam + diagnostico. Abrir story corretiva (ex: US-128) com escopo focado nos gaps. v2.0.0 fica como release tecnica com debito conhecido documentado.

**Data da execucao:** `_(preencher)_`
**Modelo Claude usado:** `_(preencher — Opus 4.7? Sonnet 4.6?)_`
**Resultado consolidado:** `_(preencher)_`
