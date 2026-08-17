---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: README do projeto-exemplo @conciliab/csv-parser (biblioteca TypeScript OSS)
---

# @conciliab/csv-parser

Biblioteca TypeScript pura para parsear e normalizar arquivos CSV de extratos bancários brasileiros (OFX 1.x, CNAB240, CSV genéricos exportados por bancos). Função pura, isomórfica, zero dependências de runtime de I/O.

**Estado:** beta · **Versão:** 0.4.2

## Instalar

```bash
npm install @conciliab/csv-parser
# ou
pnpm add @conciliab/csv-parser
# ou
deno add npm:@conciliab/csv-parser
```

## Usar

```ts
import { parseOfx, parseCnab240, parseCsv } from '@conciliab/csv-parser';

const transacoes = parseOfx(bufferOuString);
// → Array<Transacao> normalizado, datas em ISO, valores em centavos (number).
```

## Rodar localmente

```bash
pnpm install
pnpm run dev        # tsup --watch
pnpm run typecheck  # tsc --noEmit
pnpm run lint       # eslint
```

## Rodar testes

```bash
pnpm test             # vitest run
pnpm run test:watch   # vitest watch
pnpm run test:coverage
```

## Suporte de runtime

| Runtime | Versão mínima | Status |
|---|---|---|
| Node.js | 20.x | testado no CI |
| Deno | 1.40 | testado no CI |
| Bun | 1.1 | testado no CI |

Distribuição dual ESM + CJS via `tsup` (ver [ADR-0002](./docs/adr/ADR-0002-distribuicao-npm.md)).

## Documentação completa

- [`AGENTS.md`](./AGENTS.md) — canônico de produto/processo.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — como contribuir (fork → PR → merge).
- [`SECURITY.md`](./SECURITY.md) — reportar vulnerabilidade.
- [`docs/adr/`](./docs/adr/) — decisões arquiteturais.
- [`docs/dominios/core/modulos/parser/spec.md`](./docs/dominios/core/modulos/parser/spec.md) — especificação do parser.

## Licença

MIT · Autor: Roldão (balancassolution@gmail.com)
