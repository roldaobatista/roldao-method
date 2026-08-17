---
id: ADR-0000
titulo: Adotar Claude Code como harness único de IA para o tempo-cli
status: aceita
data-proposta: 2026-05-20
data-aceite: 2026-05-24
depende-de: []
bloqueia-fase:
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0000: Adotar Claude Code como harness único de IA para o tempo-cli

## Contexto

O `tempo-cli` é projeto solo. O dono não programa. Para viabilizar o projeto sem contratar dev, o trabalho será feito em parceria com agentes de IA atuando sob contrato (`AGENTS.md`, `REGRAS-INEGOCIAVEIS.md`, `CLAUDE.md`, `constitution.md`).

Existem múltiplos harnesses de IA disponíveis (Claude Code, Cursor, Windsurf, Codex CLI, Kiro, GitHub Copilot Workspace). Cada um tem modelo de memória/contrato diferente. Manter contratos paralelos para vários harnesses é trabalho duplicado num projeto que tem 1 dono e 1 IA por vez.

Esta ADR fixa qual harness é "oficial" no `tempo-cli` para evitar deriva de instruções.

## Opções consideradas

### Opção 1: Claude Code como único harness oficial

- **Prós:** memória em `.claude/memory/` é canônica; o dono já usa Claude Code em outros projetos (curva zero); modelo de subagentes maduro; suporte a hooks pre-tool-use; harness aceita `AGENTS.md` como fonte canônica via `@AGENTS.md`.
- **Contras:** dependência de 1 fornecedor (Anthropic). Se Claude Code mudar drasticamente ou perder qualidade, há custo de migração.
- **Custo:** baixo. Já é o stack atual do dono.

### Opção 2: Multi-harness com `.agent/` como fonte sincronizada

- **Prós:** flexibilidade; permite testar Cursor/Windsurf no futuro sem reescrever contratos.
- **Contras:** sincronizar `.claude/memory/` ↔ `.agent/` manualmente é trabalho; em projeto solo, ninguém vai cuidar disso; risco real de divergência.
- **Custo:** médio. ~2-3 dias para montar e ~30 min/semana de manutenção.

### Opção 3: Sem harness fixo — instruir o dev humano a usar IA "ad-hoc"

- **Prós:** zero dependência.
- **Contras:** o dono não é dev; o projeto depende de IA fazendo o trabalho técnico. Sem harness fixo = sem contrato consistente = sessões inconsistentes.
- **Custo:** alto (inviabiliza o projeto).

## Decisão

Escolhemos a **Opção 1: Claude Code como único harness oficial**.

Projeto solo não justifica overhead de multi-harness. Se o cenário mudar (segundo dev entra, ou Claude Code degrada), abrimos ADR nova que faz `superseded-by` desta.

`.claude/memory/constitution.md` é a fonte de verdade. `.agent/` pode existir como cópia de cortesia se algum harness alternativo for testado, mas em conflito `.claude/memory/` vence (já está em `CONVENCOES-DOC.md` §10 do método).

## Consequências

### Positivas
- Um único caminho de instrução. Sem deriva entre harnesses.
- Aproveita memória persistente do Claude Code (`@AGENTS.md` no `CLAUDE.md`).
- Curva zero para o dono.

### Negativas
- Lock-in suave em Claude Code. Mitigação: contratos vivem em arquivos Markdown padrão (`AGENTS.md`, `REGRAS-INEGOCIAVEIS.md`, `constitution.md`) que outro harness consegue ler com pequenas adaptações.

### Reversibilidade
Alta. Os arquivos contratuais são Markdown puro. Migrar para outro harness exige só mapear onde cada arquivo deve viver no novo (provavelmente `.agent/` no Cursor; `.windsurfrules` no Windsurf, etc.). Custo estimado: 1 dia.

## Non-goals

Esta ADR NÃO decide:
- Quais subagentes/auditores específicos serão criados (assunto de ADR futura se necessário).
- Política de uso de IA paga vs gratuita (decisão pessoal do dono, não do projeto).
- Telemetria do Claude Code (config local do dono, fora do escopo do projeto).

## Como validar (gates)

- [x] `.claude/memory/constitution.md` existe e está em status `stable`.
- [x] `CLAUDE.md` na raiz com `@AGENTS.md` no topo.
- [x] `AGENTS.md` na raiz em status `stable`.
- [x] `REGRAS-INEGOCIAVEIS.md` na raiz em status `stable`.
- [x] Não existe `.cursorrules`, `.windsurfrules` nem `.agent/` no repositório (confirmado por `ls -la`).

## Referências

- [`../../.claude/memory/constitution.md`](../../.claude/memory/constitution.md)
- [`../../AGENTS.md`](../../AGENTS.md)
- [`../../CLAUDE.md`](../../CLAUDE.md)
- [`../../REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md)
