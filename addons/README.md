---
owner: framework
revisado-em: 2026-05-17
status: stable
---

# Addons do ROLDAO-METHOD

Pacotes de extensão pra domínios específicos. Cada addon traz agentes, commands, hooks e/ou skills focados num cenário (Electron, NF-e, e-commerce, etc.).

## Estrutura de um addon

```
addons/<nome-do-addon>/
├── addon.yaml                    <- manifesto (obrigatório)
├── README.md                     <- pra que serve, como instalar
├── .claude/
│   ├── agents/                   <- agentes extras (opcional)
│   ├── commands/                 <- commands extras (opcional)
│   ├── hooks/                    <- hooks extras (opcional)
│   └── skills/                   <- skills extras (opcional)
├── .specify/templates/           <- templates extras de spec (opcional)
└── docs/                         <- documentação do addon (opcional)
```

## Manifesto `addon.yaml`

Schema mínimo:

```yaml
nome: <kebab-case>
versao: 0.1.0
descricao: <1 linha em PT-BR>
autor: <nome>
licenca: MIT
compativel-com: roldao-method>=0.3.0
provoca:
  agentes: [lista-de-agentes-criados]
  commands: [lista-de-commands-criados]
  hooks: [lista-de-hooks-criados]
  skills: [lista-de-skills-criados]
  regras: [lista-de-IDs-novos]  # ex: [ELECTRON-001, ELECTRON-002]
requisitos:
  - <pre-requisito 1>  # ex: "projeto Electron com src/main"
non-goals:
  - <o que o addon NÃO faz>
```

## Como instalar um addon

> **Em construção.** Por enquanto, instalação é manual: copie o conteúdo de `addons/<nome>/.claude/` pro `.claude/` do seu projeto.

Roadmap (próximas versões):
```
npx roldao-method addon install electron-br
npx roldao-method addon list
npx roldao-method addon uninstall electron-br
```

## Como criar um addon

1. Copie a estrutura de `addons/electron-br/` (exemplo de referência).
2. Edite `addon.yaml` com sua descrição.
3. Adicione apenas o que é específico ao domínio. Não duplicar o que já está no framework.
4. Cite IDs novos no manifesto (`provoca.regras`).
5. Adicione README explicando casos de uso.
6. Abra PR ou disponibilize em repositório separado.

## Addons disponíveis

| Addon | Estado | Foco |
|---|---|---|
| `electron-br` | exemplo de referência | App Electron com IPC + migrações SQLite + LGPD local |

## Roadmap de addons (sugestões)

- **`nf-e-emit`** — emissão de NF-e modelo 55 com assinatura ICP-Brasil e contingência SVC-AN.
- **`nfs-e-multimuni`** — adapters ABRASF / Tinus / Ginfes / proprietários.
- **`esocial`** — eventos S-1000 a S-3000.
- **`open-finance-fase2`** — adapter de extrato bancário.
- **`telemedicina`** — LGPD art. 11 + ANS + CFM.
- **`pix-recorrente`** — Pix Automático 2025/2026.

Quer contribuir? Abra issue em https://github.com/roldaobatista/roldao-method/issues.
