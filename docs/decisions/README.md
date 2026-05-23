---
owner: framework
revisado-em: 2026-05-23
status: stable
---

# ADRs do ROLDAO-METHOD

Decisões arquiteturais que fundaram o framework. Cada ADR explica **contexto**, **decisão**, **consequências** e **alternativas descartadas**, e cita `INV-`, `SEC-`, `TST-`, `LGPD-` quando aplicável.

| ADR | Título | Status |
|---|---|---|
| [ADR-001](ADR-001-zero-runtime-dependencies.md) | Zero dependências runtime | aceito |
| [ADR-002](ADR-002-hooks-bash-perl.md) | Hooks em bash + perl, não Node | aceito |
| [ADR-003](ADR-003-override-sem-fork.md) | Override sem fork via `.specify/overrides/` | aceito |
| [ADR-004](ADR-004-spec-driven-com-ids.md) | Spec-driven com IDs rastreáveis | aceito |
| [ADR-005](ADR-005-dogfooding.md) | Dogfooding — o próprio repo aplica suas regras | aceito |
| [ADR-006](ADR-006-multi-adapter.md) | Suporte multi-IDE (adapters em vez de fork) | aceito |
| [ADR-007](ADR-007-addons-registry.md) | Registry estático de addons | aceito |
| [ADR-008](ADR-008-skills-br-camada.md) | Skills BR como camada de algoritmo | aceito |
| [ADR-009](ADR-009-lifecycle-hooks.md) | Hooks de ciclo de vida (PreCompact, SessionEnd) | aceito |
| [ADR-010](ADR-010-templates-vs-specify.md) | `templates/` vs `.specify/` — separação | aceito |
| [ADR-011](ADR-011-maestro-fonte-unica-pipeline.md) | Maestro como fonte única do pipeline (`feature.md` vira shim) | aceito |

## Convenção

- Numeração crescente: `ADR-NNN-titulo-em-kebab-case.md`.
- Frontmatter obrigatório: `id`, `titulo`, `status`, `data`, `owner`, `revisado-em`.
- Status: `proposto` → `aceito` → (eventualmente) `substituído por ADR-XXX` ou `descontinuado`.
- ADR substituído não é deletado — fica como histórico.
- Novo ADR é criado via `/feature` → tech-lead OU via skill `gerar-adr-pt-br`.
