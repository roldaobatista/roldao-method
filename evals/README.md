---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Evals — qualidade dos 12 agentes

> Testes de qualidade do output esperado de cada agente. Cada eval define um input (prompt + contexto) e validações (regex, presença de campo, ausência de jargão, etc) sobre a resposta.

## Como rodar

```bash
node evals/run.js                    # roda todos os evals
node evals/run.js --agent gerente-produto  # só de 1 agente
node evals/run.js --json             # output JSON pra CI
```

## Estrutura

```
evals/
  README.md
  run.js                             ← executor
  agents/
    analista.eval.md
    gerente-produto.eval.md
    ux-designer.eval.md
    tech-lead.eval.md
    investigador.eval.md
    dev-senior.eval.md
    revisor.eval.md
    auditor-seguranca.eval.md
    auditor-qualidade.eval.md
    auditor-produto.eval.md
    fiscal-br.eval.md
    tech-writer.eval.md
```

Cada `.eval.md` tem 3-5 cenários, cada cenário com:
- `## Input`
- `## Resposta esperada (validações)`

## Como o run.js funciona

`run.js` lê cada `.eval.md`, extrai cenários, e roda contra um modelo configurado (Claude via API ou stub local pra CI rápido). Valida output com:
- regex match
- presença de campo (frontmatter, seção, etc)
- ausência de jargão (lista em `kb-pt-br.md`)
- limite de palavras
- presença de IDs específicos (LGPD-NNN, FISCAL-NNN, etc)

Se não tem `ANTHROPIC_API_KEY`, roda em modo "lint-only" — só valida estrutura dos `.eval.md`.

## CI

Workflow `.github/workflows/validar.yml` job `rodar-evals` chama `node evals/run.js`. Falha CI se algum eval falhar.

## Adicionar novo cenário

1. Edite o `.eval.md` do agente.
2. Use o template:

```markdown
## Cenário N — <descrição curta>

### Input
<prompt + contexto>

### Resposta esperada (validações)
- inclui "AC-NNN"
- não inclui jargão "endpoint", "commit", "deploy"
- frontmatter: tipo: story
- mínimo 100 palavras, máximo 600
```

3. Rode `node evals/run.js --agent <nome>` localmente.
4. Abra PR.
