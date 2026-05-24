---
owner: framework
revisado-em: 2026-05-24
status: stable
---

# Personas — mapa nome → agente

> README, docs, regras e auditores referem-se aos agentes por **nome próprio** (Sofia, Bruno, Inês, etc.) pra dar identidade e tom PT-BR ao framework. Mas o sistema de agentes do Claude Code identifica cada agente pelo **slug** do arquivo (`gerente-produto.md`, `dev-senior.md`, etc.). Este documento é a tabela canônica de equivalência — qualquer nome citado em texto deve resolver pra um slug aqui.

## Tabela canônica

| Ícone | Nome próprio | Slug do agente | Papel | Modelo |
|---|---|---|---|---|
| 🎼 | Maestro | `maestro` | Orquestrador do pipeline `/feature` | sonnet |
| 🔎 | Mariana | `analista` | Pesquisa de mercado, brief, PRFAQ, regulamentação BR | inherit |
| 📋 | Sofia | `gerente-produto` | PRD, US, decomposição | inherit |
| 🎨 | Lia | `ux-designer` | Wireframe ASCII, estados, mensagens PT-BR | sonnet |
| 🏛️ | Rafael | `tech-lead` | ADR, ARQ, readiness check | inherit |
| 🔬 | Detetive | `investigador` | Lê código/banco/log ANTES de propor solução | inherit |
| 💻 | Bruno | `dev-senior` | Implementa com TDD | inherit |
| 🗄️ | Helena | `dba-dados` | Modelagem, índices, migration, LGPD em repouso | sonnet |
| 🚀 | Lucas | `devops-infra` | CI/CD, deploy, IaC, observabilidade, secrets, cloud BR | sonnet |
| ✅ | Inês | `revisor` | Aderência à US + anti-padrões no diff | inherit |
| 🛡️ | Caio | `auditor-seguranca` | LGPD, secrets, OWASP, supply chain | inherit |
| 🧪 | Júlia | `auditor-qualidade` | Cobertura, mocks indevidos, TST-* | inherit |
| 🎯 | Pedro | `auditor-produto` | Aderência ao pedido, non-goals | inherit |
| 🧾 | Dona Marta | `fiscal-br` | NF-e, certificado, eSocial, reforma tributária | inherit |
| 📝 | Camila | `tech-writer` | CHANGELOG, release notes, msg de commit, anúncio | inherit |

## Por que personas

- **Identidade PT-BR.** Diferencial do framework é tom brasileiro — chamar "auditor-qualidade" toda hora é cansativo; "Júlia" tem carga humana.
- **Memorização.** Roldão (público-alvo: dono de produto não-programador) lembra "Detetive investiga antes" mais fácil que "investigador (`investigador.md`)".
- **Consistência cross-doc.** README cita "Sofia faz a US"; agente real é `gerente-produto`; este mapa garante que ninguém invente persona órfã.

## Inês não é fantasma

Auditoria 10-agentes (2026-05-24) sinalizou "Inês citada no `/feature` sem agente". Falso positivo do auditor — Inês **é** o revisor (`revisor.md` linha do frontmatter `nome: Inês`). O hook `enforce-pipeline-completion.js` valida o marker `revisor-done` desde a mesma auditoria.

## Antes de criar persona nova

1. **Tem agente novo?** Crie o `.md` em `.claude/agents/<slug>.md` com `name: <slug>` + `identity.nome: <Nome Próprio>`.
2. **Atualize este arquivo.** Adicione linha na tabela.
3. **Atualize `MAPA-VISUAL.md`.** Diagrama por tarefa + tabela de identidade.
4. **Não invente persona em README sem criar agente.** Documento mente, agente sumiu.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
