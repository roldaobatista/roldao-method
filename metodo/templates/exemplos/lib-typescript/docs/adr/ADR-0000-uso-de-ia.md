---
id: ADR-0000
titulo: Adotar Claude Code como harness único de IA durante a fase 0.x
status: aceita
data-proposta: 2026-01-08
data-aceite: 2026-01-12
depende-de: []
bloqueia-fase:
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0000: Adotar Claude Code como harness único de IA durante a fase 0.x

## Contexto

`@conciliab/csv-parser` é uma biblioteca OSS mantida por um único humano (Roldão, não-desenvolvedor de profissão), com auxílio intensivo de agentes IA para escrever código, testes, documentação e governar releases.

Em janeiro de 2026 o ecossistema de harnesses IA está fragmentado (Cursor, Continue, Windsurf, Claude Code, Aider, Cline, Codex). Cada um tem seu próprio formato de configuração (`.cursorrules`, `.continuerc`, `.claude/`, `AGENTS.md`, etc.). Adotar todos = manter N configs paralelas, que vão divergir.

Como o projeto é solo e novo, faz sentido escolher **um** harness e crescer a partir dele. Reavaliar quando entrar contribuidor externo.

## Opções consideradas

### Opção 1: Adotar apenas Claude Code

- **Prós:** harness mais maduro em janeiro/2026 para workflows agentes (skills, subagentes, hooks de pre-commit); suporta `AGENTS.md` (formato emergente) e `.claude/` próprio; integração com `gh` para PR; o dono já usa e tem o assinatura.
- **Contras:** se Anthropic descontinuar/encarecer, migrar custa N dias de reescrita de configs.
- **Custo:** zero (já em uso).

### Opção 2: Adotar Cursor + Claude Code em paralelo

- **Prós:** se um cair, o outro segue.
- **Contras:** duas configs pra manter, dois caminhos de governança, divergência inevitável em 6 meses.
- **Custo:** alto. ~2 dias inicial + manutenção contínua.

### Opção 3: Não usar IA — escrever tudo à mão

- **Prós:** zero dependência de fornecedor.
- **Contras:** o dono não programa. Inviável.
- **Custo:** projeto não acontece.

## Decisão

Escolhemos a **Opção 1: Claude Code como harness único**.

A configuração canônica vive em `AGENTS.md` (formato emergente cross-harness, parseável por outros agentes futuros se a decisão for revisada). `CLAUDE.md` é o adendo específico do harness Claude Code, ≤150 linhas, sem duplicar conteúdo do AGENTS.md.

Não criamos `.cursorrules`, `.continuerc` ou equivalentes — registrado em [`nao-aplica.md`](../../nao-aplica.md) com gatilho de reavaliação ("contribuidor externo entrar usando outro harness como principal").

## Consequências

### Positivas
- Uma única fonte de configuração de IA pra manter.
- `AGENTS.md` é vendor-neutral o suficiente pra migrar pra outro harness sem reescrita completa.
- Dono já usa Claude Code — zero curva de aprendizado adicional.

### Negativas
- Dependência de fornecedor único. Mitigação: `AGENTS.md` segue formato comunitário, então a maior parte da governança escrita aqui é portável.
- Contribuidor externo que use outro harness precisa fazer ajuste no fork — documentado em `CONTRIBUTING.md`.

### Reversibilidade
Alta. `AGENTS.md` é o coração da config; trocar de harness exige apenas (i) traduzir os 150 linhas de `CLAUDE.md` para o equivalente do harness destino e (ii) reconfigurar hooks pre-commit. Estimativa: 1-2 dias.

## Non-goals

Esta ADR NÃO decide:
- Qual modelo específico do Claude usar (Opus vs Sonnet vs Haiku) — decisão delegada ao dono em cada sessão.
- Política de uso de MCP (Model Context Protocol) — registrado em `nao-aplica.md` por enquanto.
- Política de uso de subagentes/skills específicas — fica em `AGENTS.md §5`.

## Como validar (gates)

- [x] Repo tem `AGENTS.md` + `CLAUDE.md` + `REGRAS-INEGOCIAVEIS.md` + `.claude/memory/constitution.md`.
- [x] `nao-aplica.md` lista `.cursorrules`, `.continuerc`, `.mcp.json` como camadas puladas com gatilho.
- [x] `CONTRIBUTING.md` orienta contribuidor externo sobre uso do método de IA.

## Referências

- https://github.com/anthropics/claude-code
- https://agents.md (formato emergente)
- Discussão #1 no repositório (decisão inicial)
