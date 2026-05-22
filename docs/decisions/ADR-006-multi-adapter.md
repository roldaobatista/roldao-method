---
id: ADR-006
titulo: Suporte multi-IDE — adapters em vez de fork
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-006 — Suporte multi-IDE (adapters em vez de fork)

## Contexto

Cliente usa Claude Code, Cursor, Windsurf, Cline, Roo, Continue, Aider, Gemini CLI ou Codex CLI. Cada IDE tem seu próprio formato de arquivo de instrução (`.cursorrules`, `.windsurfrules`, `.clinerules`, `GEMINI.md`, `.codex/instructions.md`, etc.). Suportar só Claude Code corta 80% do mercado.

Forkar o framework por IDE multiplica manutenção. Migrar pra "menor denominador comum" (markdown puro sem hooks) destrói a vantagem competitiva (bloqueios mecânicos).

## Decisão

Modelo de **adapters**: o core é Claude Code (única IDE que suporta hooks nativamente). Outras 8 IDEs recebem **adapter** que gera o arquivo de instrução no formato esperado pelo IDE, lendo do mesmo fonte canônico (`AGENTS.md`, `REGRAS-INEGOCIAVEIS.md`, `.claude/rules/`).

**Paridade declarada:**
- **Claude Code:** suporte nativo — 14 agentes executáveis, 25 hooks bloqueadores com exit 2 ou JSON `decision:block`, 22 commands, 11 skills com algoritmo Python.
- **Cursor / Windsurf / Cline / Roo / Continue / Aider / Gemini CLI / Codex CLI:** suportam as **regras** (texto carregado no contexto) mas **não executam hooks** — limitação do harness de cada IDE.

Cliente que usa Cursor + quer bloqueios mecânicos roda Claude Code em paralelo no commit/release.

## Consequências

**Positivas:**
- Cobre 9 IDEs com 1 fonte canônica.
- `tools/sincronizar-adapters.js` garante que adapter não fica defasado do core.
- Cliente troca de IDE sem reescrever spec.

**Negativas:**
- Hook só roda em Claude Code. Documentado como limitação por IDE.
- Adapter pode ficar desatualizado se contribuidor esquece de rodar `sincronizar-adapters`. Mitigado: rodado em `prepublishOnly`.
- Teste por adapter é frágil (cada IDE tem seu jeito). 53 checagens em `test/install.test.js` mitigam.

## Alternativas descartadas

- **Só Claude Code:** descartado por corte de mercado.
- **Fork por IDE:** descartado por custo de manutenção (× 9).
- **Texto markdown puro sem hook:** destrói vantagem competitiva. O cliente pode até preferir, mas a venda é "regra bloqueia, não orienta".

## Como aplicar

`bin/install.js` detecta IDE local e instala adapters aplicáveis. Flag `--all-adapters` força todos; `--adapters=cursor,windsurf` força subset. `test/install.test.js` valida cada adapter cita as 4 pontas: REGRA #0, sequência Sofia/Detetive/Rafael, anti-mascaramento, PT-BR. `tools/sincronizar-adapters.js --check` no `prepublishOnly` impede release com drift.
