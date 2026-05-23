---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Criar um addon novo

Em `addons/<nome>/`:

```
addons/meu-addon/
├── addon.yaml          <- manifesto obrigatório
├── README.md
├── .claude/{agents,commands,hooks,skills}/
├── .specify/templates/
└── docs/
```

`addon.yaml` mínimo:

```yaml
name: meu-addon
version: 0.1.0
description: 1 linha PT-BR
authors: [<nome>]
license: MIT
status: beta
revisado-em: AAAA-MM-DD
requires:
  roldao-method: ">=0.15.0"
provoca:
  agents: []
  commands: []
  hooks: []
  skills: []
  templates: []
regras:
  - id: MEU-001
    titulo: <título>
    descricao: <regra>
requisitos:
  - <pré-requisito do projeto>
non-goals:
  - <o que NÃO faz>
```

`provoca:` cita pelo nome cada artefato. O validador confere se cada item existe.

## Checklist

- `addon.yaml` válido contra `addon.schema.json`
- Prefixo de regras único (não colidir com `LGPD-*`, `FISCAL-*`, `PIX-*`, `SEC-*`, `TST-*`, `INV-*`)
- `non-goals` declarados
- README do addon com 1 exemplo de uso fim-a-fim
- **Entrada em `addons/profiles.json`** — sem isso o addon não aparece em `npx roldao-method search` nem `add`.
- **Teste em `test/addons.test.js`** — smoke test que instala o addon num projeto temporário e valida que agentes/hooks/skills declarados em `provoca:` existem mesmo. Sem teste, o addon pode quebrar entre releases.
- **Catálogo `docs/addons.md`** atualizado — adicionar linha com nome/cenário/agente/hook/skills.
- **Bumpar contagens** — addon novo significa atualizar "6 addons" e "+16 skills em addons" em README, AGENTS, CHANGELOG, `package.json`. Use `node tools/validar-templates.js` pra ver contadores reais.

## Quando NÃO criar

- Domínio cabe em 1 skill ou 1 agente — addon é overhead.
- Não há 3+ artefatos coesos do mesmo domínio.

## Referência

- Addon completo: `addons/fintech-br/` (Pix), `addons/fiscal-br-completo/` (NF-e), `addons/lgpd-compliance/` (DPO/RIPD)
- Schema: `addons/addon.schema.json`
