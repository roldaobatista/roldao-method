---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Mapa visual dos 13 agentes

Quem chamar pra cada tipo de tarefa. **Você não invoca os agentes diretamente** — os workflows (`/feature`, `/bug`, etc.) cuidam disso. Este mapa é referência rápida.

## Por tipo de tarefa

```
IDEAÇÃO / DESCOBERTA
├─ Mariana (analista)        → pesquisa mercado, brief, PRFAQ, regulamentação BR
└─ Sofia (gerente-produto)   → traduz pedido em US/PRD com AC testáveis

DESIGN / PRODUTO
├─ Sofia (gerente-produto)   → estrutura US, lista non-goals, cita LGPD/FISCAL
├─ Carla (ux-designer)       → wireframe ASCII, estados, mensagens PT-BR
└─ Rafael (tech-lead)        → ADR, ARQ, readiness check

INVESTIGAÇÃO (REGRA #0)
└─ Detetive (investigador)   → lê banco/log/payload ANTES de mexer no código

DESENVOLVIMENTO
├─ Bruno (dev-senior)        → implementa com TDD onde aplicável
├─ Helena (dba-dados)        → modelagem, índices, migration, LGPD em repouso
└─ Rafael (tech-lead)        → escolha de stack, decisão arquitetural

REVISÃO E AUDITORIA
├─ Revisor                   → aderência à US + anti-padrões no diff
├─ Caio (auditor-seguranca)  → LGPD, secrets, OWASP, supply chain
├─ Julia (auditor-qualidade) → cobertura, mocks indevidos, TST-*
└─ Pedro (auditor-produto)   → aderência ao pedido, non-goals

DOMÍNIO BR
└─ Fiscal-BR                 → NF-e, certificado, eSocial, reforma tributária

COMUNICAÇÃO
└─ Tech-writer               → CHANGELOG, release notes, msg de commit, anúncio
```

## Por workflow

| Workflow | Cadeia de agentes |
|---|---|
| `/inicio` | Sofia → Rafael → Bruno |
| `/brownfield` | Detetive → Rafael → Sofia → Caio |
| `/prd` | Mariana → Sofia → Rafael → Carla → Sofia (decomp) |
| `/feature` | Sofia → Detetive → Rafael → Bruno → Revisor → Caio+Julia+Pedro (paralelo) |
| `/bug` | **Detetive (obrigatório)** → Bruno → Revisor |
| `/refactor` | Rafael → Bruno → Revisor |
| `/qa` | Detetive → Julia → Bruno → Revisor |
| `/auditoria` | Caio + Julia + Pedro (paralelo) |
| `/consistencia` | Detetive → Caio + Julia + Pedro |
| `/quick-dev` | Bruno → Revisor |
| `/release` | Tech-writer |
| `/status` | Tech-writer |

## Identidade dos 13

| Ícone | Nome | Papel | Modelo |
|---|---|---|---|
| 🔍 | Mariana | Analista | haiku |
| 📋 | Sofia | Gerente de Produto | haiku |
| 🎨 | Carla | UX Designer | haiku |
| 🏛️ | Rafael | Tech Lead | sonnet |
| 🔬 | Detetive | Investigador | sonnet |
| 💻 | Bruno | Dev Sênior | sonnet |
| 🗄️ | Helena | DBA / Dados | sonnet |
| 👀 | — | Revisor | sonnet |
| 🛡️ | Caio | Auditor Segurança | sonnet |
| 🧪 | Julia | Auditor Qualidade | sonnet |
| 🎯 | Pedro | Auditor Produto | haiku |
| 🇧🇷 | — | Fiscal BR | sonnet |
| ✍️ | — | Tech Writer | haiku |

> Para detalhes de cada agente: leia `.claude/agents/<nome>.md`.
