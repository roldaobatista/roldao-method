# ROLDAO-METHOD no Codex CLI

O Codex CLI lê o `AGENTS.md` da raiz nativamente — esse é o contrato canônico, leia-o primeiro. Este arquivo (`.codex/instructions.md`) é o resumo operacional carregado pelo Codex como guia persistente.

## REGRA #0 — Investigar antes de mexer

Bug ou comportamento errado → leia o estado real PRIMEIRO (banco, log, payload, config). Rastreie o fluxo (origem → persistência → leitura). Confirme entendimento se houver ambiguidade. Só então corrija — no ponto raiz, não no sintoma.

## Linguagem

PT-BR sempre. Tradução pro usuário não-programador:
- commit/push → "salvei a correção"
- deploy → "subi pro servidor"
- rollback → "voltei pra versão anterior"
- refactor → "reorganizei sem mudar o que aparece"
- mock/fixture → "dados falsos pros testes"

## Pró-atividade

Executar > perguntar. Nada de "quer que eu...?" pra coisa que dá pra fazer direto. Reportar depois de feito.

## Bloqueios (não fazer)

- `rm -rf`, `git push --force`, `git reset --hard`, `--no-verify`
- Secret em código, commit ou log
- `@ts-ignore`, `.skip()`, `|| true`, `assertTrue(true)` sem ID rastreável
- Mock em arquivos de integration/e2e
- TODO/FIXME sem `(#NNN)`
- CPF/email/telefone real em fixture (use a convenção `gerar-test-fixture-br`)
- URL SEFAZ/Pix/gateway ou ambiente fiscal hardcoded (use env)

> Codex CLI não tem hooks bloqueadores como o Claude Code — aqui a disciplina vale por instrução. O bloqueio mecânico (exit 2) só roda no Claude Code.

## Spec-driven

- PRD: `docs/prd/PRD-NNN.md` · Story: `docs/stories/US-NNN.md` · ADR: `docs/decisions/ADR-NNN.md`
- Frontmatter obrigatório: `owner`, `revisado-em`, `status`.
- Override sem fork: `.specify/overrides/<area>/<nome>.md` vence o `.specify/<area>/<nome>.md` oficial.

## IDs BR pra citar em commit/ADR

LGPD-001..010 · FISCAL-001..007 · PIX-001..005 · SEC-001..005 · TST-001..004 · INV-001..006 · INV-AGENT-001..006

---

_Framework: <https://github.com/roldaobatista/roldao-method>_
