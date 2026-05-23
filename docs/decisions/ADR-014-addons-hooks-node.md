---
id: ADR-014
titulo: Addons herdam contrato Node — sem coexistência longa
status: aceito
data: 2026-05-23
owner: framework
revisado-em: 2026-05-23
depende: ADR-012, ADR-013
epico: EP-001
---

# ADR-014 — Addons herdam contrato Node (sem coexistência longa)

## Contexto

[ADR-012](ADR-012-hooks-node-port.md) decide port Node dos 26 hooks bloqueadores do core. Os 6 addons (`electron-br`, `fiscal-br-completo`, `lgpd-compliance`, `fintech-br`, `esocial-completo`, `varejo-pdv-br`) trazem **seus próprios** `.sh` em `addons/<nome>/.claude/hooks/`. Decisão necessária: o port do core obriga os addons a migrar? Em que janela?

Cenários possíveis:
1. Addons continuam `.sh`, core fica Node, ambos coexistem indefinidamente.
2. Addons portam junto, em release coordenado.
3. Janela de transição (3-6 meses) onde ambos funcionam.

## Decisão

**Addons portam juntos do core. Sem janela de coexistência longa.**

Cronograma:
1. **v1.0.0-rc1** entrega core 100% Node + addons 100% Node, ambos em release candidate.
2. **v1.0.0** marca o corte: rodar `npx roldao-method update` substitui todos os `.sh` do core. `npx roldao-method add <addon>` já instala versão Node do addon.
3. **Hook `doctor`** (no `bin/install.js`) warna se algum `.sh` for encontrado em `.claude/hooks/` do projeto cliente — orienta `npx roldao-method update`.
4. **Versão de addon segue a do core** (v1.0.0). Addons em v0.x param de receber update após v1.0.0 sair.

## Consequências

**Positivas:**
- Drift impossível — não existe `.sh` "em produção" depois da v1.0.
- Mensagem clara pro usuário: "atualizou pra v1.0? hooks viram Node". Versionamento semver respeitado.
- Mantenedor solo não escala 2 implementações por hook (concordância com ADR-002 que já alertava esse risco).
- Suite de testes do CI roda 1 vez (Node), não 2 (Node + bash).

**Negativas (aceitas):**
- **Quem usa addon e atualiza pra v1.0 precisa rodar `update`.** Documentado no CHANGELOG e no banner do install pós-v1.0.
- **Forks ou customizações de hook `.sh` em addons quebram** após v1.0. Mitigado por: (a) hooks `.sh` no `.specify/overrides/` continuam intocados (override sem fork, ADR-003); (b) doc de migração `docs/MIGRACAO-V1.md` com cookbook.
- **Hooks de addon escritos por terceiros** (fora dos 6 oficiais) também precisam migrar. Custo deles, não nosso.

## Alternativas descartadas

- **Coexistência indefinida:** descartada por drift garantido e dobra de manutenção.
- **Janela de 6 meses de coexistência:** descartada porque pra mantenedor solo a janela vira "para sempre" (sem capacidade de remover .sh depois).
- **Addons portam só quando quiserem:** descartado por fragmentar suite de testes (alguns addons em bash, outros em Node).

## Non-goals

- **Não suportar hook `.sh` num projeto após v1.0.0** — `doctor` warna, mas Claude Code do cliente continua executando `.sh` se ele insistir (Claude Code não impõe extensão).
- **Não criar adapter automático `.sh → .js`** — transcompilação de bash pra Node não é viável (regex bash, expansão de variáveis, subshell semantics divergem).
- **Não preservar histórico dos `.sh` no repo após v1.0.0** — deletados de `templates/.claude/hooks/` e `addons/*/.claude/hooks/`. Quem quiser referência consulta tag `v0.20.0` ou anterior.

## Como aplicar

- US-101 a US-107 (EP-001) portam **core**.
- US-108 (equivalência) cobre core E addons no mesmo loop.
- US-109 (CI) testa addons portados na mesma matriz cross-OS.
- US-110 deleta `.sh` do core + dos 6 addons + cria `docs/MIGRACAO-V1.md`.

## Histórico

| Data       | Quem    | Mudança                                  |
|------------|---------|------------------------------------------|
| 2026-05-23 | Roldão  | aceito junto com ADR-012/013 (PRD-001)   |
