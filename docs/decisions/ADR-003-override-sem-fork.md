---
id: ADR-003
titulo: Override sem fork via .specify/overrides/
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-003 — Override sem fork via `.specify/overrides/`

## Contexto

Um projeto cliente adota o framework e quer adaptar 1 checklist (ex.: `release-readiness.md`) ao seu domínio sem (a) editar o template do core (será sobrescrito no próximo `update`) nem (b) forkar o framework inteiro pra mudar 1 linha.

Sem mecanismo de override, o cliente é forçado a uma de 3 saídas ruins: forkar o framework, editar templates do core e nunca mais atualizar, ou viver com template genérico que não bate com seu domínio.

## Decisão

Diretório `.specify/overrides/` é **propriedade do projeto cliente**. Arquivos em `.specify/overrides/<area>/<nome>.md` têm **precedência** sobre `.specify/<area>/<nome>.md` (core). O CLI `update` **nunca toca** `.specify/overrides/`.

Skills, agentes, hooks, comandos e templates do core consultam override **primeiro**. Se override existe, usa override. Se não, usa core.

## Consequências

**Positivas:**
- Cliente customiza sem forkar e sem perder updates do core.
- Override é versionado no repo do cliente (não vira folclore oral).
- Diff entre override e core é visível e auditável.

**Negativas:**
- Cliente pode override regra de segurança e achar que está "OK". Mitigado: **hooks não leem override**. Override adapta artefato (template, checklist, KB), não burla regra inegociável (`REGRAS-INEGOCIAVEIS.md`).
- Mais 1 caminho pra resolução. Aceito — está documentado em `AGENTS.md §9` e `.claude/rules/roldao-method.md`.

## Alternativas descartadas

- **Fork do repo:** descartado. Cliente fica sem updates de segurança.
- **Editar templates do core direto:** descartado. `update` sobrescreve.
- **Patches via JSON config:** descartado por opacidade. Override em markdown é legível.

## Non-goals

- **Override NÃO burla `REGRAS-INEGOCIAVEIS.md`** — hooks não leem override. Adapta artefato (template/checklist/KB), não regra de segurança.
- **Não cobre código** — apenas documentação/templates. Override de código seria fork.
- **Não suporta cascata multi-nível** (`overrides/overrides/`) — uma camada só, simples e previsível.

## Como aplicar

`bin/install.js` em `isUserOwned()` retorna `true` para qualquer caminho `.specify/overrides/**`, impedindo sobrescrita em `update`. `.specify/overrides/README.md` no core documenta o contrato pra cliente. Skills e templates consultam override via convenção (não há resolver central — cada artefato declara).
