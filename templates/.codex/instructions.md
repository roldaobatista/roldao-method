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

## Sequência obrigatória de agentes — VOCÊ é o gate (sem hook aqui)

No Claude Code, 5 hooks bloqueiam mecanicamente (exit 2) quem pula etapa. **No Codex CLI não há bloqueio: VOCÊ é o gate.** Pular etapa = violação consciente do INV-AGENT-005 → entrega errada, bug em produção, dívida silenciosa.

Toda feature (`/feature`) segue esta ordem. **NÃO escreva código de negócio antes de cumprir as etapas 1→3:**

1. **Sofia (gerente-produto):** US-NNN clara, AC testáveis, non-goals explícitos.
2. **Detetive (investigador):** leu código/banco/log existente, mapeou impacto, SEM escrever código. (Feature que muda comportamento existente: Detetive vem ANTES da Sofia — REGRA #0.)
3. **Rafael (tech-lead):** ADR se há decisão arquitetural; declare "dispensado" se trivial.
4. **Bruno (dev-senior):** implementa com TDD na lógica crítica.
5. **Inês (revisor):** aderência à US, anti-padrões.
6. **Caio (segurança) + Júlia (qualidade) + Pedro (produto):** auditam em paralelo — nenhum reprovado antes de commitar.
7. **Checkpoint:** walkthrough antes de declarar pronto / mergear.

**Bug (`/bug`):** invoque **Detetive (investigador)** ANTES de qualquer edição — causa raiz primeiro (REGRA #0). Não pule, não substitua por palpite.

## Spec-driven

- PRD: `docs/prd/PRD-NNN.md` · Story: `docs/stories/US-NNN.md` · ADR: `docs/decisions/ADR-NNN.md`
- Frontmatter obrigatório: `owner`, `revisado-em`, `status`.
- Override sem fork: `.specify/overrides/<area>/<nome>.md` vence o `.specify/<area>/<nome>.md` oficial.

## IDs BR pra citar em commit/ADR

LGPD-001..010 · FISCAL-001..007 · PIX-001..005 · SEC-001..005 · TST-001..004 · INV-001..006 · INV-AGENT-001..006

---

_Framework: <https://github.com/roldaobatista/roldao-method>_
