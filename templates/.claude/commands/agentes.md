---
description: Mostra mapa visual dos 22 especialistas virtuais (agentes) — quem faz o quê, quando é acionado, modelo usado. Atalho pra .claude/agents/MAPA-VISUAL.md.
disable-model-invocation: true
allowed-tools: Read
model: haiku
---

# /agentes — quem são os 22 especialistas virtuais

> Você (Roldão) **não invoca agente direto.** Eles são acionados automaticamente pelos workflows (`/feature`, `/bug`, `/prd`, etc.). Este doc é só pra você entender quem faz o quê quando o agente cita um nome.

## Os 22 agentes por área

### Orquestração
- **Maestro** 🎼 — orquestrador do pipeline (não tem persona; é o "regente" que delega).

### Produto / Análise
- **Mariana** 🔎 (analista) — pesquisa de mercado, brief, regulamentação BR.
- **Sofia** 📋 (gerente-produto) — PRD, user story, decomposição.
- **Lia** 🎨 (ux-designer) — wireframes ASCII, estados de tela, mensagens PT-BR.

### Engenharia
- **Rafael** 🏛️ (tech-lead) — arquitetura, ADRs, checklist de prontidão.
- **Detetive** 🔬 (investigador) — lê código/banco/log ANTES de propor solução. REGRA #0.
- **Bruno** 💻 (dev-senior) — implementa com TDD onde aplicável.
- **Inês** ✅ (revisor) — audita o diff antes de subir.

### Auditoria (rodam em paralelo no fim do `/feature`)
- **Caio** 🛡️ (auditor-seguranca) — LGPD, secrets, vulnerabilidades, supply chain.
- **Júlia** 🧪 (auditor-qualidade) — testes, cobertura, mocks indevidos, anti-padrões.
- **Pedro** 🎯 (auditor-produto) — aderência ao pedido, non-goals respeitados.

### Especialistas BR
- **Dona Marta** 🧾 (fiscal-br) — NF-e, certificado, eSocial, REINF, SPED, Reforma Tributária.
- **Helena** 🗄️ (dba-dados) — modelagem, índices, performance, migration, LGPD em repouso.
- **Lucas** 🚀 (devops-infra) — CI/CD, deploy, IaC, observabilidade, secrets, cloud BR.

### Qualidade / Confiabilidade
- **Bia** 🤖 (qa-automation) — robô que simula o usuário (E2E Playwright/Cypress).
- **Marcos** 📟 (sre-on-call) — triagem de incidente em produção (logs, métricas, alertas).

### Documentação
- **Camila** 📝 (tech-writer) — CHANGELOG, README, release notes, tradução de jargão.

### Auto-auditoria / Memória / Fluxo (v2 / v3)
- **Otávio** 🦉 (meta-cetico) — audita o próprio framework, propõe regras novas e sunset de regras dormentes.
- **Olívia** 👁️ (vigia-fluxo) — SRE do fluxo interno (agente parado, sequência pulada, audit_sha em loop).
- (audit-arbiter) ⚖️ — mediador quando 2 auditores divergem no mesmo arquivo.
- (documentation-master) 📚 — orquestra `/documentar-repo` em projeto brownfield (23 fases, 4 stages anti-sobrescrita).
- (memory-skeptic) 🗂️ — marca memórias obsoletas em `memory/` e propõe consolidação (nunca deleta).

## Como o pipeline `/feature` funciona

```
Você pede uma feature
       ↓
Sofia (PM) — story está clara?
       ↓
Detetive (investigador) — leu o estado atual?
       ↓
Rafael (tech-lead) — precisa ADR? (pode dispensar se trivial)
       ↓
Bruno (dev-senior) — implementa
       ↓
Inês (revisor) — diff faz sentido?
       ↓
Caio + Júlia + Pedro em PARALELO — auditam
       ↓
Checkpoint — walkthrough antes de subir
```

## Catálogo completo

Mapa visual com ícones, papéis e modelo de cada um:
[`.claude/agents/MAPA-VISUAL.md`](../agents/MAPA-VISUAL.md)

Personalidades (estilo de comunicação, frases-tipo):
[`.claude/agents/PERSONAS.md`](../agents/PERSONAS.md)

## Importante

- **Quem você cita ao reportar bug:** "Detetive" (não "investigador"), "Sofia" (não "PM"). Mais natural na conversa.
- **Quem decide:** sempre você (Roldão). Os agentes propõem, você aprova.
- **Quando algo trava:** `/explicar-para-cliente` traduz mensagem técnica de qualquer agente pra PT-BR claro.
