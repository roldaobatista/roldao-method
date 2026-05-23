---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Criar uma skill nova

Em `.claude/skills/<nome>/SKILL.md`:

```markdown
---
name: minha-skill
description: 1 frase PT-BR — quando o agente invoca.
allowed-tools: Read, Bash(python3:*), Bash(python:*)
owner: framework
revisado-em: AAAA-MM-DD
status: stable
---

# minha-skill

## Quando usar

- Cenário 1.

## Uso

\`\`\`bash
python3 scripts/minha-skill.py argumento
\`\`\`

## Saída esperada

(Formato exato.)
```

Script em `scripts/<nome>.py` — Python 3 stdlib pura, sem `pip install`.

## Checklist

- Frontmatter completo (`name`, `description`, `allowed-tools`, `owner`, `revisado-em`, `status`)
- Algoritmo embutido (sem dependência runtime)
- Offline por padrão (rede só com flag explícita)
- Dados de teste sintéticos (TST-004, LGPD-001) — nunca CPF/email/telefone real
- **Teste cruzado em `test/skills.test.js`** — par gerador↔validador (quando aplicável), ou pelo menos smoke test com input válido/inválido. Sem teste, a regressão passa silenciosa.
- **Bumpar contagem em `package.json` description e docs** — skill nova significa atualizar "12 skills core" pra "13" em README, AGENTS, docs/. Use `node tools/validar-templates.js` pra ver contadores reais.

## Quando NÃO criar

- Padrão só repetiu 1-2 vezes — espere 3 (regra de 3).
- Cabe em texto-instrução de agente — não precisa ser skill.

## Referência

- Skill com Python: `templates/.claude/skills/validar-cpf-cnpj/`, `validar-pix/`, `validar-boleto/`
- Skill de guia: `templates/.claude/skills/gerar-adr-pt-br/`, `brainstormar-ideia/`
