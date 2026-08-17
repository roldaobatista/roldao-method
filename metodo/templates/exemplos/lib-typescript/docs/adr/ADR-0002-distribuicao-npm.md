---
id: ADR-0002
titulo: Distribuir no npm sob escopo @conciliab, dual ESM+CJS, com release via changesets
status: aceita
data-proposta: 2026-01-15
data-aceite: 2026-01-20
depende-de: [ADR-0001]
bloqueia-fase: F-1
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 140
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0002: Distribuir no npm sob escopo @conciliab, dual ESM+CJS, com release via changesets

## Contexto

ADR-0001 escolheu TypeScript + tsup. Falta decidir **como** publicar:

- Nome do pacote: livre (`csv-parser`) vs com escopo (`@conciliab/csv-parser`).
- Campos do `package.json` (`exports`, `main`, `module`, `types`, `files`) — erro aqui = pacote quebra silenciosamente em consumidor.
- Mecanismo de release: manual (`npm publish` na mão) vs automatizado (changesets, semantic-release, release-please).
- Critérios mínimos pra publicar (coverage, lint, build matrix).

Esta ADR fecha a política de distribuição. Reverter qualquer dessas escolhas depois de publicar é caro (rename de pacote = nova URL, comunidade fragmentada).

## Opções consideradas

### Opção 1: `@conciliab/csv-parser` + dual ESM/CJS via `exports` + changesets

- **Prós:** escopo `@conciliab` reserva namespace pra futuros pacotes irmãos (`@conciliab/ofx-types`, `@conciliab/cnab240-utils`); nome livre `csv-parser` já está tomado no npm; `exports` é o padrão moderno e impede consumidor de importar de paths internos; changesets aceita PR com anotação e gera CHANGELOG automático.
- **Contras:** escopo exige criar a organização `conciliab` no npm (gratuito, mas burocracia).
- **Custo:** baixo. ~3h pra configurar package.json + changesets + workflow de release.

### Opção 2: Nome sem escopo (`csv-bank-br` ou similar) + semantic-release

- **Prós:** nome curto, sem prefixo.
- **Contras:** nomes curtos relevantes já estão tomados; semantic-release é mais opinativo (lê commits para decidir bump, conflita com changesets); sem escopo, futuros pacotes irmãos terão nomes desconectados.
- **Custo:** médio.

### Opção 3: Publicar manual (`npm publish` na mão) sem automação

- **Prós:** controle total.
- **Contras:** alto risco humano (publicar errado), CHANGELOG manual, esquecimento de bump correto.
- **Custo:** baixo inicial, alto em incidente.

## Decisão

Escolhemos a **Opção 1: `@conciliab/csv-parser` + dual ESM/CJS via `exports` + changesets**.

### `package.json` mínimo

```jsonc
{
  "name": "@conciliab/csv-parser",
  "version": "0.4.2",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "files": ["dist", "README.md", "LICENSE", "CHANGELOG.md"],
  "publishConfig": { "access": "public", "provenance": true },
  "engines": { "node": ">=20" },
  "dependencies": {},
  "sideEffects": false
}
```

### Critérios mínimos para publicar (gates de release)

- `pnpm run lint` verde.
- `pnpm run typecheck` verde.
- `pnpm test` verde em matriz Node 20/22 + Deno + Bun (ver ADR-0004).
- Coverage de `src/parsers/` ≥ 90%.
- `pnpm run api-check` (compara assinaturas exportadas com baseline) — exige bump major se houver breaking.
- SBOM gerado em `dist/sbom.cdx.json`.
- Tag git criada pelo bot do changesets.
- Confirmação humana no PR de "Version Packages" (INV-AGENT-001).

## Consequências

### Positivas
- Escopo reservado para crescimento orgânico (`@conciliab/*`).
- `exports` impede consumidor de "acidentalmente" importar `@conciliab/csv-parser/src/internal/...` — só o que está exportado é público (operacionaliza INV-SEMVER-001).
- Changesets força anotação textual de cada mudança + bump consciente.
- `provenance: true` adiciona atestação de origem (npm publish --provenance) — defesa contra typosquatting.
- `files` whitelist evita publicar `tests/`, `.github/`, `node_modules/` por acidente.

### Negativas
- Pacotes com escopo exigem cuidado adicional ao publicar: precisa `publishConfig.access: "public"`, senão npm assume que é privado e bloqueia.
- Changesets adiciona um arquivo `.changeset/*.md` por PR — atrito leve no fluxo de contribuição.
- `provenance` exige rodar publish na GitHub Action (não local) — mais setup de workflow.

### Reversibilidade
Média. Mudar escopo do pacote = publicar com novo nome e deprecar o antigo. Mudar mecanismo de release (changesets → semantic-release) custa ~1 dia mas não afeta consumidor.

## Non-goals

Esta ADR NÃO decide:
- Regras semânticas de bump (patch/minor/major) → vai em ADR-0003.
- Quais runtimes suportar → vai em ADR-0004.
- Política de breaking change comunicada (migration guides) → vai em ADR-0003.

## Como validar (gates)

- [x] `npm view @conciliab/csv-parser` mostra o pacote publicado com `exports` populado.
- [x] Consumidor ESM (`import { parseOfx } from '@conciliab/csv-parser'`) e consumidor CJS (`const { parseOfx } = require('@conciliab/csv-parser')`) funcionam no `tests/integration/`.
- [x] PR de "Version Packages" abre automaticamente após merge de PR com changeset.
- [x] `dist/sbom.cdx.json` é gerado em cada release.
- [x] `npm view @conciliab/csv-parser` mostra atestação de provenance (`provenance: true`).

## Referências

- https://nodejs.org/api/packages.html#exports
- https://github.com/changesets/changesets
- https://docs.npmjs.com/generating-provenance-statements
- https://github.com/cyclonedx/cyclonedx-node-npm
