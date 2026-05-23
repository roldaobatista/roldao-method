---
owner: framework
revisado-em: 2026-05-23
status: stable
---

# Mapa visual dos 15 agentes

Quem chamar pra cada tipo de tarefa. **Você não invoca os agentes diretamente** — os workflows (`/feature`, `/bug`, etc.) cuidam disso. Este mapa é referência rápida.

## Por tipo de tarefa

```
ORQUESTRAÇÃO
└─ Maestro (maestro)             → coordena cadeias multi-agente em /feature, /prd

IDEAÇÃO / DESCOBERTA
├─ Mariana (analista)            → pesquisa mercado, brief, PRFAQ, regulamentação BR
└─ Sofia (gerente-produto)       → traduz pedido em US/PRD com AC testáveis

DESIGN / PRODUTO
├─ Sofia (gerente-produto)       → estrutura US, lista non-goals, cita LGPD/FISCAL
├─ Lia (ux-designer)             → wireframe ASCII, estados, mensagens PT-BR
└─ Rafael (tech-lead)            → ADR, ARQ, readiness check

INVESTIGAÇÃO (REGRA #0)
└─ Detetive (investigador)       → lê banco/log/payload ANTES de mexer no código

DESENVOLVIMENTO
├─ Bruno (dev-senior)            → implementa com TDD onde aplicável
├─ Helena (dba-dados)            → modelagem, índices, migration, LGPD em repouso
└─ Rafael (tech-lead)            → escolha de stack, decisão arquitetural

INFRA / ENTREGA
└─ Lucas (devops-infra)          → CI/CD, deploy, IaC, observabilidade, secrets, cloud BR

REVISÃO E AUDITORIA
├─ Inês (revisor)                → aderência à US + anti-padrões no diff
├─ Caio (auditor-seguranca)      → LGPD, secrets, OWASP, supply chain
├─ Julia (auditor-qualidade)     → cobertura, mocks indevidos, TST-*
└─ Pedro (auditor-produto)       → aderência ao pedido, non-goals

DOMÍNIO BR
└─ Dona Marta (fiscal-br)        → NF-e, certificado, eSocial, reforma tributária

COMUNICAÇÃO
└─ Camila (tech-writer)          → CHANGELOG, release notes, msg de commit, anúncio
```

## Por workflow

| Workflow | Cadeia de agentes |
|---|---|
| `/inicio` | Sofia → Rafael → Bruno |
| `/brownfield` | Detetive → Rafael → Sofia → Caio |
| `/prd` | Mariana → Sofia → Rafael → Lia → Sofia (decomp) |
| `/feature` | Maestro orquestra: Sofia → Detetive → Rafael → Bruno → Inês → Caio+Julia+Pedro (paralelo) |
| `/bug` | **Detetive (obrigatório)** → Bruno → Inês |
| `/refactor` | Rafael → Bruno → Inês |
| `/qa` | Detetive → Julia → Bruno → Inês |
| `/auditoria` | Caio + Julia + Pedro (paralelo) |
| `/consistencia` | Detetive → Caio + Julia + Pedro |
| `/quick-dev` | Bruno → Inês |
| `/release` | Camila |
| `/status` | Camila |

## Identidade dos 15

| Ícone | Nome | Papel | Modelo |
|---|---|---|---|
| 🎼 | Maestro | Orquestrador | sonnet |
| 🔎 | Mariana | Analista | haiku |
| 📋 | Sofia | Gerente de Produto | haiku |
| 🎨 | Lia | UX Designer | haiku |
| 🏛️ | Rafael | Tech Lead | sonnet |
| 🔬 | Detetive | Investigador | sonnet |
| 💻 | Bruno | Dev Sênior | sonnet |
| 🗄️ | Helena | DBA / Dados | sonnet |
| 🚀 | Lucas | DevOps / Infra | sonnet |
| ✅ | Inês | Revisor | sonnet |
| 🛡️ | Caio | Auditor Segurança | sonnet |
| 🧪 | Julia | Auditor Qualidade | sonnet |
| 🎯 | Pedro | Auditor Produto | haiku |
| 🧾 | Dona Marta | Fiscal BR | sonnet |
| 📝 | Camila | Tech Writer | haiku |

> Para detalhes de cada agente: leia `.claude/agents/<nome>.md`.
