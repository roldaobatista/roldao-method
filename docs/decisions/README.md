---
owner: framework
revisado-em: 2026-05-24
status: stable
---

# ADRs do ROLDAO-METHOD

Decisões arquiteturais que fundaram o framework. Cada ADR explica **contexto**, **decisão**, **consequências** e **alternativas descartadas**, e cita `INV-`, `SEC-`, `TST-`, `LGPD-` quando aplicável.

| ADR | Título | Status |
|---|---|---|
| [ADR-001](ADR-001-zero-runtime-dependencies.md) | Zero dependências runtime | aceito |
| [ADR-002](ADR-002-hooks-bash-perl.md) | Hooks em bash + perl, não Node | **revogado por ADR-012** |
| [ADR-003](ADR-003-override-sem-fork.md) | Override sem fork via `.specify/overrides/` | aceito |
| [ADR-004](ADR-004-spec-driven-com-ids.md) | Spec-driven com IDs rastreáveis | aceito |
| [ADR-005](ADR-005-dogfooding.md) | Dogfooding — o próprio repo aplica suas regras | aceito |
| [ADR-006](ADR-006-multi-adapter.md) | Suporte multi-IDE (adapters em vez de fork) | aceito |
| [ADR-007](ADR-007-addons-registry.md) | Registry estático de addons | aceito |
| [ADR-008](ADR-008-skills-br-camada.md) | Skills BR como camada de algoritmo | aceito |
| [ADR-009](ADR-009-lifecycle-hooks.md) | Hooks de ciclo de vida (PreCompact, SessionEnd) | aceito |
| [ADR-010](ADR-010-templates-vs-specify.md) | `templates/` vs `.specify/` — separação | aceito |
| [ADR-011](ADR-011-maestro-fonte-unica-pipeline.md) | Maestro como fonte única do pipeline (`feature.md` vira shim) | aceito |
| [ADR-012](ADR-012-hooks-node-port.md) | Port dos 26 hooks de bash/perl pra Node.js (revoga ADR-002) | aceito |
| [ADR-013](ADR-013-convencao-hook-node.md) | Convenção de hook Node — shebang, +x, settings.json | aceito |
| [ADR-014](ADR-014-addons-hooks-node.md) | Addons herdam contrato Node — sem coexistência longa | aceito |
| [ADR-015](ADR-015-addons-importam-lib-core.md) | Addons importam `_lib.js` do core (compartilhamento de utilitários) | aceito |
| [ADR-016](ADR-016-politica-semver.md) | Política de SemVer — o que conta como breaking change | stable |
| [ADR-017](ADR-017-estabilidade-lib-js.md) | Estabilidade de `_lib.js` (API exportada versionada) | aceito |
| [ADR-018](ADR-018-python-requisito-skills.md) | Python 3.8+ como requisito de runtime para skills | aceito |
| [ADR-019](ADR-019-maestro-multi-modo.md) | Maestro multi-modo (PRD/BROWNFIELD/AR estendendo agente único) | proposta |
| [ADR-020](ADR-020-contrato-audit-sha-markers.md) | Contrato canônico de `audit_sha` em markers de aprovação | proposta |
| [ADR-021](ADR-021-flag-legacy-markers-v2.md) | Flag `ROLDAO_METHOD_LEGACY_MARKERS` e janela de compatibilidade v2.0.0 | proposta |

## Convenção

- Numeração crescente: `ADR-NNN-titulo-em-kebab-case.md`.
- Frontmatter obrigatório: `owner`, `revisado-em`, `status`.
- Status: `proposta` → `aceito` → (eventualmente) `substituído por ADR-XXX` ou `descontinuado`.
- ADR substituído não é deletado — fica como histórico.
- Novo ADR é criado via `/feature` → tech-lead OU via skill `gerar-adr-pt-br`.
