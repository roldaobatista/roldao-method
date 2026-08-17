---
id: ADR-0001
titulo: Adotar TypeScript 5.4 strict + tsup como stack de build da biblioteca
status: aceita
data-proposta: 2026-01-10
data-aceite: 2026-01-17
depende-de: []
bloqueia-fase: F-1
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0001: Adotar TypeScript 5.4 strict + tsup como stack de build

## Contexto

`@conciliab/csv-parser` será publicada no npm e consumida por aplicações JavaScript e TypeScript. Precisamos:

1. Tipos exportados (`.d.ts`) — consumidores TS esperam autocomplete e checagem.
2. Distribuição dual: ESM (consumidor moderno) **e** CJS (consumidor legado em `require()`).
3. Zero dependências de runtime — a lib é pura e queremos manter `dependencies: {}` no `package.json`.
4. Build rápido e reprodutível — sem 3 minutos de compilação por release.

A escolha de stack precede qualquer linha de código de produto, porque ESM/CJS dual exige decisões de tooling difíceis de reverter depois.

## Opções consideradas

### Opção 1: TypeScript + tsup (esbuild por baixo)

- **Prós:** tsup gera ESM + CJS + `.d.ts` em um único comando; esbuild é absurdamente rápido (≤ 5s na lib inteira); config mínima (`tsup.config.ts`); zero plugins exóticos; suporta tree-shaking de saída.
- **Contras:** esbuild não faz type-check (só compila); precisamos rodar `tsc --noEmit` em paralelo.
- **Custo:** baixo. ~2h pra configurar dual ESM/CJS + d.ts.

### Opção 2: TypeScript + tsc (compilador oficial) + custom bundler para CJS

- **Prós:** zero dependência de tooling além do TS oficial; `.d.ts` "nativo".
- **Contras:** tsc não gera dual ESM/CJS sozinho; precisa setup com dois `tsconfig` + script de pós-processamento; lento (~30s).
- **Custo:** médio. 1 dia pra configurar e estabilizar.

### Opção 3: TypeScript + Rollup

- **Prós:** ecossistema maduro; controle fino de output; tree-shaking forte.
- **Contras:** config complexa (rollup.config + plugins separados para TS, dts, ESM, CJS); manutenção de plugins; mais lento que tsup.
- **Costo:** médio-alto. 1-2 dias.

### Opção 4: tsdx (legado)

- **Prós:** zero-config pra libs TS.
- **Contras:** descontinuado/sem manutenção desde 2022.
- **Custo:** rejeitado de saída.

## Decisão

Escolhemos a **Opção 1: TypeScript 5.4 strict + tsup**.

`tsup.config.ts` define `format: ['esm', 'cjs']`, `dts: true`, `clean: true`, `target: 'node20'`. Type-check é gate **separado** no CI via `pnpm run typecheck`. `eslint` e `prettier` cuidam de estilo. `vitest` para testes.

## Consequências

### Positivas
- Build local em < 5s — feedback rápido em dev.
- `.d.ts` correto sem hack.
- Distribuição dual ESM/CJS funciona "de graça".
- Tree-shaking efetivo para consumidor que só usa um parser (ex: importa só `parseOfx`).

### Negativas
- Dependência forte em tsup/esbuild — se descontinuarem, migrar custa ~1 dia.
- Type-check em pipeline separado — exige disciplina (`pnpm run typecheck` no pre-commit) pra não soltar erro de tipo em produção.

### Reversibilidade
Alta. Trocar tsup por Rollup ou tsc envolve reescrever um arquivo (`tsup.config.ts`) e atualizar scripts em `package.json`. Estimativa: 1 dia.

## Non-goals

Esta ADR NÃO decide:
- Configuração específica de `package.json` (`exports`, `main`, `module`, `types`, `files`) → vai em ADR-0002.
- Versionamento e estratégia de release → vai em ADR-0003.
- Quais runtimes suportar além de Node → vai em ADR-0004.

## Como validar (gates)

- [x] `pnpm run build` gera `dist/index.mjs` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` (tipos).
- [x] Build local em < 5 segundos em máquina de referência.
- [x] `pnpm run typecheck` roda separado e falha em erro de tipo.
- [x] Consumidor mock em `tests/integration/consumer-esm/` e `tests/integration/consumer-cjs/` importa com sucesso.

## Referências

- https://tsup.egoist.dev/
- https://esbuild.github.io/
- https://github.com/microsoft/TypeScript
- Discussão #3 no repositório.
