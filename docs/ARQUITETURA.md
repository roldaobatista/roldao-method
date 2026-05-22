---
owner: framework
revisado-em: 2026-05-17
status: stable
---

# Arquitetura do ROLDAO-METHOD (o framework em si)

> Como o **repositório do framework** está organizado. Para entender o que o framework **gera** no projeto do usuário, ver `COMO-FUNCIONA.md`.

## Layout de pastas

```
roldao-method/                        <- raiz do framework
├── bin/
│   └── install.js                    <- CLI (install, update, doctor, uninstall)
├── templates/                        <- TUDO que vai ser copiado pro projeto do usuario
│   ├── AGENTS.md
│   ├── CLAUDE.md
│   ├── REGRAS-INEGOCIAVEIS.md
│   ├── .mcp.json.example
│   ├── .agent/CURRENT.md
│   ├── .specify/
│   │   ├── memory/constitution.md
│   │   └── templates/                <- prd, story, architecture, decision-log
│   └── .claude/
│       ├── settings.json
│       ├── agents/                   <- 12 agentes
│       ├── hooks/                    <- 28 hooks (22 bloqueadores + 4 aux + 2 utilitários)
│       ├── commands/                 <- 21 commands
│       ├── skills/                   <- 8 skills BR core (+14 em addons)
│       └── output-styles/
├── tools/
│   └── validar-templates.js          <- audita frontmatter, refs, JSON valido
├── test/
│   └── install.test.js               <- smoke test do CLI
├── docs/                             <- doc PRA USUARIO do framework
│   ├── QUICKSTART.md
│   ├── PUBLICAR-NPM.md
│   ├── PLAN-MODE-E-SESSOES.md
│   ├── MCP-GUIA-BR.md
│   ├── FAQ.md
│   ├── TROUBLESHOOTING.md
│   ├── COMO-FUNCIONA.md
│   ├── EXEMPLO-FEATURE-COMPLETA.md
│   ├── CASOS-DE-USO-BR.md
│   └── ARQUITETURA.md                <- este arquivo
├── addons/                           <- expansion packs (em construcao)
│   └── README.md
├── .github/workflows/validar.yml     <- CI (templates + hooks + smoke + skills python)
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
├── LICENSE
└── package.json
```

## Filosofia das pastas

### `templates/` é a "fonte"
Nada do que está em `templates/` afeta a operação do framework. É o **conteúdo** que vai pro usuário. O CLI (`bin/install.js`) copia recursivamente.

Princípio: **se mexer em templates/, refletir no test/install.test.js**.

### `bin/` é o canal
Único entrypoint executável. Sem dependências runtime (`package.json` tem `"dependencies": {}`). Tudo em Node puro.

### `tools/` é manutenção interna
Scripts que o **mantenedor do framework** roda. Não vão pro usuário.

### `test/` é proteção
Roda em CI a cada push pra `main`. Garante que install/update/uninstall funcionam.

### `docs/` é para o usuário do framework
Não confundir com `docs/` que o framework **gera** no projeto do usuário (PRDs, stories, ADRs). Esse `docs/` é o **manual** do framework em si.

## Princípio: zero dependência runtime

`package.json` tem `dependencies: {}` (vazio). Justificativa:
- Reduz tempo de `npx` (sem download de árvore de deps).
- Sem risco de supply chain.
- Funciona em ambiente restrito (corp, air-gapped).
- Node 18+ tem tudo que precisamos (`fs`, `path`, `readline`, `crypto`).

Vale a pena? Sim. O custo é: o CLI fica mais verboso (sem `chalk`, `commander`, `@clack/prompts`). Aceitável.

## Princípio: hook bloqueador é shell, não TypeScript

Todos os hooks são bash + perl + grep. Justificativa:
- Roda em Windows Git Bash sem setup.
- Sem `npm install` pré-requisito.
- Lê stdin JSON sem dependência (perl é onipresente).
- Performance: < 50ms por hook.

## Princípio: skills com algoritmo inline > skills com dependência externa

Cada skill BR (validar-cpf-cnpj, validar-pix, etc.) traz o algoritmo Python no próprio repo. Não exige pip install. Skill é autocontida.

Exceção: `validar-cep --remoto` consulta ViaCEP (rede). Mas o uso default é offline.

## Princípio: doc gerada > doc escrita à mão

Sempre que possível, doc é derivada de:
- frontmatter dos agents/commands (lista de capacidades em README).
- arquivos em `.claude/hooks/` (lista de hooks).
- arquivos em `.claude/skills/` (lista de skills).

O `tools/validar-templates.js` valida a coerência.

## CI — o que roda a cada push

```yaml
jobs:
  validar-templates:    # node tools/validar-templates.js
  rodar-hooks:          # bash templates/.claude/hooks/_test-runner.sh
  smoke-install:        # node test/install.test.js
  validar-skills-python: # python3 <cada skill>
```

Se algum desses falha, **não publicar no npm**.

## Versionamento

SemVer:
- **major** (`1.x → 2.x`): breaking changes em hooks/agents que exigem migração.
- **minor** (`0.2 → 0.3`): agentes/skills/commands novos sem quebrar antigos.
- **patch** (`0.2.0 → 0.2.1`): bug fix.

Compatibilidade do `update`: sempre preserva `AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md`, `settings.local.json`, `.mcp.json`. O resto, sobrescreve com `.bak` ao lado.

## Manutenção

Antes de publicar:
1. `node tools/validar-templates.js` — verde.
2. `bash templates/.claude/hooks/_test-runner.sh` — 167/167.
3. `node test/install.test.js` — verde.
4. `npm pack --dry-run` — confirmar que `files` inclui só o necessário.
5. Atualizar `CHANGELOG.md`.
6. Bumpar `package.json`.
7. `npm publish` (exige login do mantenedor).

## Decisões arquiteturais registradas

Como o framework não tem um ARQ.md formal próprio (ainda), aqui vão as decisões de fundo:

- **Zero deps runtime** — sustentabilidade vence ergonomia.
- **Bash + perl pros hooks** — portabilidade vence elegância.
- **Skills Python embutido** — autocontido vence reuso.
- **PT-BR sempre** — coerência vence audiência maior.
- **CNPJ alfanumérico no algoritmo desde dia 0** — futuro-prova vence simplicidade.
