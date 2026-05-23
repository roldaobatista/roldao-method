---
id: ADR-012
titulo: Port dos hooks de bash/perl pra Node.js puro
status: aceito
data: 2026-05-23
owner: framework
revisado-em: 2026-05-23
revoga: ADR-002
prd: PRD-001
epico: EP-001
---

# ADR-012 — Port dos 26 hooks de bash/perl pra Node.js puro

## Contexto

ADR-002 (mai/2026) escolheu `bash + perl` por latência (5-15ms por hook vs 80-150ms cold start Node) e zero-dependência em Unix. A decisão envelheceu mal por um motivo previsto naquele ADR como "non-goal aceito": **Windows sem Git Bash não roda hooks**.

Em 6 meses de adoção (v0.5 → v0.20), o feedback foi:
- Parte significativa do público dev BR usa Windows + PowerShell/CMD (estimativa do mantenedor: 30-50% do potencial de adopção).
- O modo de falha é **silencioso**: o cliente instala, vê "instalacao OK", e os 26 hooks bloqueadores **não executam**. Cliente acha que está protegido — não está.
- v0.20.0 atenuou colocando bloqueio default no install pra Windows sem bash, mas isso só **bloqueia adoção**, não **estende a proteção**.
- A latência que justificou bash/perl é desprezível na prática real: 50-200 hooks/sessão × 100ms ≈ 5-20s, **ofuscado pelo tempo de cada call de LLM** (5-30s cada). Usuário não percebe.

## Decisão

**Reescrever os 26 hooks bloqueadores + 2 soft warnings + 5 lifecycle em Node.js puro (zero deps, Node 18+).** Substitui completamente os `.sh` — sem coexistência longa.

Arquivos:
- `templates/.claude/hooks/_lib.js` (substitui `_lib.sh`)
- `templates/.claude/hooks/<nome>.js` (substitui `<nome>.sh`)
- `templates/.claude/hooks/run-tests.js` (substitui `_test-runner.sh`)

Convenção de execução: shebang `#!/usr/bin/env node` + bit de execução. Ver [ADR-013](ADR-013-convencao-hook-node.md).

Compatibilidade dos addons: ver [ADR-014](ADR-014-addons-hooks-node.md).

## Consequências

**Positivas:**
- Cobre Windows puro (PowerShell/CMD) + WSL + macOS + Linux + container minimal sem dependência adicional.
- Manutenção única — 1 implementação por hook. Antes ADR-002 já alertava risco de divergir se houvesse port PowerShell.
- Suite de testes em Node test runner nativo — sem `_test-runner.sh` artesanal de 700+ linhas.
- Hooks ganham testabilidade unitária real (mock de stdin, asserts sobre exit code, sem `bash -n` smoke).
- `bin/install.js` deixa de detectar `MSYSTEM`/`SHELL` para Windows — não importa mais o shell parent.

**Negativas (aceitas):**
- **Bump de major obrigatório (v1.0.0)** — quem está em v0.x e roda `update` recebe substituição dos hooks. Migração de addons (ADR-014) força reinstalar `add <addon>`.
- **Latência por hook +50-100ms vs bash.** Em 200 hooks/sessão = +10-20s acumulado. Aceitável porque dilui no tempo de LLM (LLM domina o relógio total da sessão).
- **Custo de port:** 6-10 semanas calendário (1 dev focado em meio período), decomposto em EP-001 (US-101..US-110).
- **`bin/install.js` precisa marcar `.sh` como legado e doctor warna** se ainda houver no projeto — orientar `update` pra v1.0.

## Alternativas descartadas

- **Port PowerShell (caminho B do PRD-001):** descartado por dobrar manutenção (.sh + .ps1 com risco alto de divergir).
- **Status quo + doc reforçada (caminho C):** descartado porque banner não desbloqueia o público Windows puro — só "alerta".
- **Reescrever em Rust/Go compilado:** atraente em latência (~5ms), mas requer toolchain de build, distribuição multi-arch e binário versionado no npm — complexidade de produto desproporcional ao ganho marginal de latência.
- **Coexistência longa `.sh` + `.js`:** descartado em [ADR-014](ADR-014-addons-hooks-node.md) — drift garantido com mantenedor solo.

## Non-goals

- **Não muda comportamento de nenhum hook** — paridade byte-a-byte nos vereditos (`block`/`exit 2`/JSON `decision:block`) garantida por US-108 (suite de equivalência).
- **Não substitui `bin/install.js`** — esse já era Node desde sempre.
- **Não migra skills Python** — skills são scripts auxiliares (não hooks), continuam Python por terem outros leitores (ex: contador rodando dataset).
- **Não muda formato de `settings.json`** — só o path final do hook muda de `.sh` pra `.js`.

## Como aplicar

EP-001 detalha. Resumo da ordem:
1. US-101 entrega `_lib.js` com helpers equivalentes (`sanitizeProjdir`, `safeRuntimeDir`, etc.).
2. US-102..US-107 portam hooks em grupos temáticos.
3. US-108 cria `tests/equivalence.test.js` rodando cada `.sh` legado e `.js` portado contra os mesmos fixtures — diff = FAIL.
4. US-109 adiciona job `windows-no-bash` na matriz CI.
5. US-110 deleta `.sh` e marca v1.0.0 em CHANGELOG.

## Histórico

| Data       | Quem    | Mudança                                          |
|------------|---------|--------------------------------------------------|
| 2026-05-22 | framework | ADR-002 aceito (hooks bash+perl)               |
| 2026-05-23 | Roldão  | ADR-012 aceito — revoga ADR-002 após PRD-001    |
