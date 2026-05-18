---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Evals — verificação estrutural dos 12 agentes

> **Estado atual:** por padrão isto é **lint estrutural**, não eval de comportamento. Cada `.eval.md` define input + validações esperadas, e o `run.js` (sem `ANTHROPIC_API_KEY`) verifica apenas que os cenários estão bem formados (≥3 cenários, Input + ≥2 validações) e que **todo agente tem eval** (cross-check com `templates/.claude/agents/`). O modo "live" (rodar contra o modelo e validar a resposta de fato) ainda é placeholder. Não confundir lint verde com qualidade de comportamento garantida.

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

`run.js`:
1. Cruza `templates/.claude/agents/*.md` com `evals/agents/*.eval.md` — **falha** se algum agente não tiver eval (cobertura 12/12 obrigatória).
2. Para cada `.eval.md`: exige ≥3 cenários, cada um com Input (≥10 chars) e ≥2 validações.
3. Modo live (`ANTHROPIC_API_KEY` setado): placeholder — ainda **não** roda o modelo nem aplica as validações de output. Quando implementado, validará regex/presença de campo/ausência de jargão/limite de palavras/IDs.

Sem `ANTHROPIC_API_KEY` (default e CI): modo **lint estrutural**, descrito acima.

## CI

Workflow `.github/workflows/validar.yml` job `rodar-evals` chama `node evals/run.js` — **lint estrutural**, não eval de comportamento. Falha CI se algum agente ficar sem eval ou se algum `.eval.md` estiver malformado.

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
