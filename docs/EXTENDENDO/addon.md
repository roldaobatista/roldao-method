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

## Quando NÃO criar

- Domínio cabe em 1 skill ou 1 agente — addon é overhead.
- Não há 3+ artefatos coesos do mesmo domínio.

## Referência

- Addon completo: `addons/fintech-br/` (Pix), `addons/fiscal-br-completo/` (NF-e), `addons/lgpd-compliance/` (DPO/RIPD)
- Schema: `addons/addon.schema.json`
