---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Exemplos materializados — ROLDAO-METHOD

> Esta pasta contém **artefatos preenchidos** (não apenas templates) para mostrar como o framework imagina o resultado final. Use como referência canônica de "como uma story/PRD/ADR fica" depois de passar pelos workflows.

## Conteúdo

- [`stories/US-001-cadastro-cliente-pj-cnpj-alfa.md`](stories/US-001-cadastro-cliente-pj-cnpj-alfa.md) — story completa de exemplo (cadastro de PJ com CNPJ alfanumérico). Mostra todos os campos do template preenchidos: AC, non-goals, contexto técnico, tasks, testes, regulamentação BR aplicável, status, Dev Agent Record com hooks que dispararam.

## Como usar

Quando você roda `/historia` ou `/feature`, o agente preenche o template `.specify/templates/story.md` com o mesmo formato. Compare a saída do agente com a story de exemplo aqui — se faltar algum campo, peça pro agente completar.

## Por que materializar exemplos?

Templates em branco escondem ambiguidade: dois usuários podem preencher de jeitos completamente diferentes e ambos parecem corretos. Exemplos materializados fixam a convenção. Auditoria do framework (mai/2026) identificou que `docs/stories/` estava vazio — o framework era apenas template sem demonstração viva do output esperado. Esta pasta resolve.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
