---
id: ADR-0004
titulo: Suportar Node 20+, Deno 1.40+ e Bun 1.1+ a partir do mesmo build
status: aceita
data-proposta: 2026-01-29
data-aceite: 2026-02-04
depende-de: [ADR-0001]
bloqueia-fase: F-2
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0004: Suportar Node 20+, Deno 1.40+ e Bun 1.1+ a partir do mesmo build

## Contexto

O ecossistema JavaScript em janeiro de 2026 tem três runtimes principais:

- **Node.js** — padrão de mercado, base instalada gigante.
- **Deno** — runtime "first-class" para TypeScript, com importação direta de npm via `npm:` specifier desde Deno 1.40.
- **Bun** — runtime rápido com compat npm forte, adoção crescente em devs novos.

Comunidade de devs brasileiros (público-alvo da lib) usa Node majoritariamente, mas há demanda nascente por Deno (scripts) e Bun (CLIs).

A lib é função pura sem I/O (INV-PARSER-001), então **a tecnologia da runtime importa pouco** — o que conta é se o runtime aceita ESM ou CJS, e se honra o campo `exports` do `package.json`.

## Opções consideradas

### Opção 1: Suportar Node + Deno + Bun a partir do mesmo build (dual ESM/CJS já decidido em ADR-0002)

- **Prós:** zero custo de manutenção adicional — o build atual já roda nos três; abre mercado para devs Deno/Bun que crescem; CI já existe (matriz simples).
- **Contras:** matriz de CI multiplica por 3 runtimes — tempo de CI cresce ~3x.
- **Custo:** baixo. ~2h pra configurar matriz no GitHub Actions.

### Opção 2: Suportar só Node 20+

- **Prós:** matriz CI menor, menos casos pra debugar.
- **Contras:** exclui Deno/Bun de graça; perde devs novos.
- **Custo:** zero adicional.

### Opção 3: Suportar Node + Deno apenas (excluir Bun por imaturidade)

- **Prós:** menos um runtime na matriz.
- **Contras:** Bun em jan/2026 já é estável o suficiente para libs puras; cortar agora e voltar atrás depois é trabalho duplo.
- **Custo:** baixo.

## Decisão

Escolhemos a **Opção 1: Node 20+ + Deno 1.40+ + Bun 1.1+**.

### Versões mínimas suportadas

| Runtime | Mínimo | Por quê |
|---|---|---|
| Node.js | 20.x (LTS) | LTS atual; suporta `exports` corretamente; tem todos os APIs de `String`/`TextDecoder` que a lib usa internamente. Node 18 sai de LTS em abr/2025 — já estamos depois disso. |
| Deno | 1.40 | Primeira versão estável com `npm:` specifier e suporte a `exports` field do package.json. |
| Bun | 1.1 | Primeira versão estável com `exports` field bem suportado e compatibilidade Node API estável. |

### Matriz de CI

`.github/workflows/ci.yml` roda em paralelo:

- Node 20 × {lint, typecheck, test, build, api-check} — em Ubuntu, macOS, Windows.
- Node 22 × {test} — em Ubuntu apenas.
- Deno LTS × {test} — em Ubuntu apenas.
- Bun 1.1 × {test} — em Ubuntu apenas.

Total: ~7 jobs por PR. Tempo médio: ~3 min cada (lib é pequena).

### O que NÃO suportamos

- **Node 18 ou anterior** — fora de LTS; consumidor pode usar versão `0.3.x` (que ainda funciona em Node 18) congelada.
- **Browser** — a lib só transforma string/Uint8Array; tecnicamente funciona, mas não testamos no navegador. Marcado como "use por sua conta" no README.
- **Cloudflare Workers, Vercel Edge** — mesma situação que browser. Provavelmente funciona; não testamos.

## Consequências

### Positivas
- Comunidade Deno/Bun adota a lib sem fricção.
- CI multi-runtime pega rapidamente bug "funciona só em Node" antes de chegar no consumidor.
- Provas no README de que "funciona em todos os três" geram confiança.

### Negativas
- CI mais lento (3x mais jobs) — mitigação: jobs paralelos, lib é pequena.
- Debugar bug que aparece só em Deno/Bun custa mais (menos familiaridade dos contribuidores).
- Cada bump major de runtime suportado (Node 22 → 24) exige reavaliação.

### Reversibilidade
Alta. Remover um runtime da matriz = remover linhas do workflow YAML + adicionar nota no README. ~30 min. Pode ser revertido se a manutenção pesar.

## Non-goals

Esta ADR NÃO decide:
- Suporte a browser/edge runtimes — fora de escopo até demanda real.
- Política de bump de versão mínima de runtime — ver ADR-0003 (Node mínimo é major bump).
- Empacotamento para Deno mods alternativos (deno.land/x) — só publicamos no npm; Deno consome via `npm:`.

## Como validar (gates)

- [x] Matriz de CI roda os 4 runtimes em `.github/workflows/ci.yml`.
- [x] README documenta versões mínimas em tabela.
- [x] Teste de smoke em cada runtime: `parseOfx(snapshotMinimo) → array com 3 transações`.
- [x] Badge no README mostra status de CI por runtime.

## Referências

- https://nodejs.org/en/about/releases/
- https://deno.com/blog/v1.40
- https://bun.sh/docs/runtime/nodejs-apis
- ADR-0001 (stack TS+tsup).
- ADR-0002 (distribuição npm com `exports`).
