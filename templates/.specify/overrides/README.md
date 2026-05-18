---
owner: project
revisado-em: 2026-05-18
status: stable
---

# Overrides do projeto

Esta pasta é **sua**. O framework nunca a sobrescreve: `npx roldao-method update` e `install` tratam tudo sob `.specify/overrides/` como customização do projeto (mesma proteção do `AGENTS.md`/`REGRAS-INEGOCIAVEIS.md`).

Serve pra customizar artefato do ROLDAO-METHOD **sem fork** e sem perder a customização no próximo update.

## O que dá pra sobrescrever

```
.specify/overrides/
├── templates/        ← seu prd.md, story.md, architecture.md etc. (vence o de .specify/templates/)
├── checklists/       ← sua versão de um checklist (vence o de .specify/checklists/)
└── data/             ← sua KB de domínio (complementa as KBs do core)
```

## Regra de precedência

Agentes e comandos resolvem **override primeiro, core depois**:

1. Existe `.specify/overrides/<area>/<nome>.md`? → usa esse.
2. Senão → usa `.specify/<area>/<nome>.md` (oficial).

Ex.: se o projeto exige um campo "Centro de custo" em todo PRD, copie `.specify/templates/prd.md` para `.specify/overrides/templates/prd.md`, adicione o campo, e pronto — o `/prd` passa a usar o seu, e o `update` do framework não reverte.

## O que NÃO fazer

- **Não edite** os arquivos em `.specify/templates/`, `.specify/checklists/`, `.specify/data/` direto — `update` sobrescreve e você perde a mudança.
- **Não use override pra desligar regra inegociável.** Override é pra adaptar artefato ao domínio, não pra burlar `REGRAS-INEGOCIAVEIS.md`. Hook não lê override.

## Verificar

`/consistencia` aponta se um override divergiu do core a ponto de quebrar rastreabilidade.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
