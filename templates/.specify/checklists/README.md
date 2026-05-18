---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Checklists — ROLDAO-METHOD

Quality gates auditáveis. Cada checklist tem **dono claro**, **quando rodar**, e **regras de bloqueio**.

| Checklist | Quem roda | Quando | Bloqueia? |
|---|---|---|---|
| [story-dod.md](story-dod.md) | `auditor-qualidade` ou `revisor` | Antes de marcar US como entregue | Sim (itens essenciais) |
| [architecture-readiness.md](architecture-readiness.md) | `tech-lead` | Antes de aprovar ADR ou iniciar PRD grande | Sim (itens 1-4, 6) |
| [fiscal-compliance.md](fiscal-compliance.md) | `fiscal-br` | Antes de produção de feature fiscal | Sim (itens 1-3, 5, 8) |
| [lgpd-privacy-review.md](lgpd-privacy-review.md) | `auditor-seguranca` | Antes de feature que toca dado pessoal | Sim (itens 1-3, 5, 11) |
| [pm-readiness.md](pm-readiness.md) | `gerente-produto` ou `auditor-produto` | Antes de passar PRD pro dev | Sim (itens 1, 4, 5, 6, 8) |

## Como integrar no workflow

- **`/feature`**: revisor roda `story-dod.md` antes da etapa de auditores.
- **`/prd`**: PM roda `pm-readiness.md` antes de chamar tech-lead.
- **`/auditoria`**: auditor-seguranca roda `lgpd-privacy-review.md` + `architecture-readiness.md`; fiscal-br roda `fiscal-compliance.md` se aplicável.

## Como customizar pro seu projeto

Cada checklist é Markdown editável. Adapte:

1. Adicione itens setoriais (saúde: CFM-NNN; agro: CAR; varejo: SAT).
2. Marque itens N/A no seu contexto — não deixe vago.
3. Acrescente IDs próprios (ex: `EMP-001` para regras da empresa) e cite-os.

## Princípio

Checklist não é burocracia — é **memória externa do que costuma esquecer**. Use ✅ marcado em pessoa, não rubber-stamp.
