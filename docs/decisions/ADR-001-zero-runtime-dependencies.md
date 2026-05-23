---
id: ADR-001
titulo: Zero dependências runtime
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-001 — Zero dependências runtime

## Contexto

O framework é distribuído via `npx roldao-method install`. Toda dependência runtime declarada em `package.json` é baixada na máquina do usuário antes do CLI rodar. Para um projeto de instalação rápida (≤ 30s no primeiro `init`) e que será rodado em CI de centenas de projetos cliente, cada dep paga 3 custos: (1) tempo de download, (2) superfície de supply chain attack, (3) ruído nos `npm audit` que o usuário corre.

## Decisão

O CLI (`bin/install.js`, `tools/*.js`) usa **apenas APIs do Node 18+** — `fs`, `path`, `child_process`, `os`, `https`, `url`, `crypto`. Zero dependências em `dependencies` e zero em `devDependencies` runtime (apenas tooling de teste/CI são aceitáveis em `devDependencies` se rodam só localmente).

Não usar: `chalk`, `commander`, `yargs`, `inquirer`, `chokidar`, `fs-extra`, `glob` (a versão Node ≥ 22 cobre).

## Consequências

**Positivas:**
- Install em 1 round-trip (só o tarball do `roldao-method` em si).
- Zero CVE herdado.
- Atualização do framework não exige `npm install` no projeto cliente.
- `npm audit` no projeto cliente nunca lista deps nossas.

**Negativas:**
- Mais código próprio (color helper, arg parser, prompt simples). Aceito — esse código é trivial e estável.
- Sem `glob` faz iteração de arquivos mais verbosa. Aceito — `fs.readdirSync` recursivo cobre.

## Alternativas descartadas

- **Usar `chalk` pra cores:** descartado. ANSI escapes diretos cobrem o caso (16 cores), e cor opcional já é tratada via `--no-color`.
- **Usar `commander` pro CLI:** descartado. O parser de 50 linhas em `bin/install.js` cobre o uso atual (`init`, `update`, `add`, `remove`, `search`, `list`, `doctor`, `tasks-to-issues`, `uninstall` + flags `--yes`, `--force`, `--dry-run`, `--no-color`).

## Non-goals

- **Não bane `devDependencies`** (tooling de teste/CI que roda só localmente é aceitável).
- **Não restringe deps em projetos cliente** — a regra se aplica ao CLI do framework, não ao código do usuário.
- **Não bloqueia addons de declararem deps próprias** — addons herdam o princípio por convenção, não por gate mecânico.

## Como aplicar

Próximo PR que adicionar `dependencies` precisa: (1) abrir ADR-XXX explicando por que a API nativa do Node não cobre; (2) demonstrar que o ganho compensa os 3 custos.

Hook potencial futuro: `block-runtime-deps.sh` que checa `package.json` no `prepublishOnly`.
