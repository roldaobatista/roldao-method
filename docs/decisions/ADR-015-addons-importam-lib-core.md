---
owner: tech-lead
revisado-em: 2026-05-24
status: stable
---

# ADR-015 — Addons importam `_lib.js` do core (sem reimplementação)

## Contexto

A v1.0 portou os 26 hooks bloqueadores do core e os 5 hooks dos 6 addons oficiais (`fintech-br`, `fiscal-br-completo`, `electron-br`, `esocial-completo`, `varejo-pdv-br`) pra Node puro. Auditoria arquitetural (2026-05-23) identificou **duplicação**: cada hook de addon reimplementa funções utilitárias (`readStdinJson`, `sanitizeProjdir`, `hookBlockHeader`, `recordMetric`) que já existem em `templates/.claude/hooks/_lib.js`.

A justificativa histórica era: "addon é pacote independente, não pode depender de path do core". Mas o instalador (`bin/install.js`) já copia o core inteiro antes de aplicar addon — então o core sempre está presente quando o hook de addon roda.

Mantida a duplicação, o problema cresce com o número de addons. Hoje são 6 addons × 1 hook = 6 cópias de `readStdinJson`. Quando o 7º addon entrar, vira 7. Bug em `_lib.js` corrigido no core não propaga.

## Decisão

**Hooks de addon importam `_lib.js` do core via path relativo resolvido em runtime.**

A partir da v1.1, todo hook `.js` em `addons/<nome>/.claude/hooks/*.js` deve:

```js
const path = require('path');
const { readStdinJson, sanitizeProjdir, hookBlockHeader } = require(
  path.join(process.env.CLAUDE_PROJECT_DIR || process.cwd(), '.claude/hooks/_lib.js')
);
```

O `_lib.js` é garantido pelo instalador: `add <addon>` só é aceito se o core já está instalado (já validado em `bin/install.js`). Se `_lib.js` faltar, o hook de addon falha cedo com erro claro.

## Alternativas consideradas

1. **Manter duplicação (status quo).** Simples, mas escala mal.
2. **Publicar `_lib.js` como pacote npm independente.** Adiciona dependência runtime — viola [ADR-001](ADR-001-zero-runtime-dependencies.md) (zero deps).
3. **Copiar `_lib.js` pra cada addon na instalação.** Cria N cópias divergentes — mesmo problema da duplicação atual.
4. **Inlining via build step.** Adiciona toolchain de build pro addon — viola simplicidade do framework.

Escolhida a opção atual porque preserva zero deps, evita divergência e o custo é só uma linha de `require`.

## Consequências

**Positivas:**
- Fix em `_lib.js` propaga pra todos os addons sem release.
- Novo helper utilitário adicionado ao core fica disponível pros addons na próxima minor.
- Addon fica mais enxuto (menos código duplicado no tarball).
- Validador `tools/validar-templates.js` pode checar que addons não reimplementam funções do `_lib.js`.

**Negativas:**
- Hook de addon não roda isoladamente fora de projeto instalado (não era requisito).
- Test runner do addon precisa garantir que core está em `<TMPDIR>/.claude/hooks/_lib.js` antes do spawn — já é o caso em `test/addons.test.js`.

## Plano de migração

- **v1.1.0** — `tools/validar-addons.js` (novo) reporta hooks de addon que reimplementam `readStdinJson` etc.
- **v1.1.1** — refactor dos 5 hooks de addon oficiais pra usar `require('_lib.js')`.
- **v1.2.0** — validador vira hook bloqueador (PR de addon novo é rejeitado se reimplementar).

## Não escopo

- Não cria pacote npm separado para `_lib.js` (manteve zero deps).
- Não muda comportamento de addons de terceiros existentes — só orienta o padrão.
- Não toca os hooks do core (já usam `require('./_lib.js')` direto).

## Regras envolvidas

ADR-001 (zero deps), ADR-007 (registry de addons), ADR-014 (addons herdam contrato Node), INV-002 (spec gera código).

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
