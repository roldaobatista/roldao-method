---
name: gerar-adr-pt-br
description: Cria um Architecture Decision Record (ADR) em português brasileiro seguindo o template do ROLDAO-METHOD. Use sempre que tomar decisão arquitetural não-trivial (escolha de stack, biblioteca, integração com sistema externo, padrão arquitetural).
owner: framework
revisado-em: 2026-05-18
status: stable
---

# gerar-adr-pt-br

Você está sendo chamado pra gerar um ADR (Architecture Decision Record) novo.

## Passo a passo

1. **Identifique o próximo número de ADR.** Liste `docs/decisions/` e use `N+1` do maior número existente. Se for o primeiro, use `001`.

2. **Pergunte ao usuário** (se ainda não foi fornecido):
   - Título curto da decisão (ex: "Adotar PostgreSQL como banco principal").
   - Contexto: por que essa decisão está sendo tomada agora?
   - Alternativas consideradas (mínimo 2 — se só tem 1 opção, não é decisão).

3. **Use o template em `${CLAUDE_SKILL_DIR}/templates/adr.md`** e preencha os campos.

4. **Salve em** `docs/decisions/ADR-<NNN>-<slug-do-titulo>.md` (slug em kebab-case, minúsculo, sem acento).

5. **Aplique frontmatter obrigatório** (INV-004): `owner`, `revisado-em` (data de hoje), `status: proposta`.

## Princípios obrigatórios

- **Non-goals explícitos** (INV-003): toda ADR declara o que essa decisão NÃO resolve.
- **Tradeoff nomeado:** se a decisão tem custo, escrever explicitamente. Sem "tudo são vantagens".
- **Como reabrir:** declarar o gatilho que faria essa decisão ser revista no futuro.
- **PT-BR puro:** sem inglês exceto em nomes próprios (PostgreSQL, Redis, etc).

## Após salvar

Apresente ao usuário em formato resumido:
- "ADR-NNNN criada: <título>"
- "Decisão: <1 frase>"
- "Tradeoff aceito: <1 frase>"
- "Próximo passo: revisar e mudar status de 'proposta' pra 'aceito'"
