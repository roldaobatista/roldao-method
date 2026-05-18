---
tipo: prd
id: PRD-NNN
versao: 1
status: draft
owner: _(preencher)_
revisado-em: AAAA-MM-DD
---

# PRD-NNN — _(nome curto da iniciativa)_

> **PRD = Product Requirements Document.** Em PT-BR: documento que diz o que vamos construir, pra quem, por quê, e como saberemos que deu certo. Spec-as-source (INV-002): este documento gera as user stories e o código, não o contrário.

---

## 1. Problema

_(1-3 parágrafos. Quem sofre, o que está sofrendo, com que frequência, com que custo.)_

**Evidência:** _(número, citação de cliente, métrica atual, ticket de suporte recorrente.)_

---

## 2. Personas

| Persona | Quem é | O que quer | Onde sofre hoje |
|---|---|---|---|
| _(ex: dono PME)_ | _(papel)_ | _(objetivo)_ | _(dor)_ |

---

## 3. Hipótese de solução

_(1 parágrafo. O que vamos construir, em alto nível. Não é design, é direção.)_

---

## 4. User stories (rastreáveis)

> Cada US deve ter critérios de aceitação testáveis (`AC-NNN-N`). Cadeia: `US-NNN` → `AC-NNN-N` → `T-NNN` → commit. Ver INV-004.

### US-001 — _(título)_
**Como** _(persona)_, **quero** _(ação)_ **para** _(benefício)_.

**Critérios de aceitação:**
- **AC-001-1** — _(verificável: dado X, quando Y, então Z)_
- **AC-001-2** — _(...)_

### US-002 — _(...)_

---

## 5. Non-goals (INV-003)

O que NÃO está no escopo desta iniciativa:

- _(item 1)_
- _(item 2)_

---

## 6. Métricas de sucesso

| Métrica | Valor atual | Meta | Como medir |
|---|---|---|---|
| _(ex: taxa de erro no cadastro)_ | _(X%)_ | _(Y%)_ | _(query / dashboard)_ |

---

## 7. Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| _(...)_ | _(alta/média/baixa)_ | _(alta/média/baixa)_ | _(plano B)_ |

---

## 8. Regulamentação BR aplicável

_(citar IDs do REGRAS-INEGOCIAVEIS.md: LGPD-NNN, FISCAL-NNN, SEC-NNN. Se nenhum se aplica, escrever "N/A".)_

- _(ex: LGPD-007 — base legal: execução de contrato)_
- _(ex: FISCAL-001 — emite NF-e, XML imutável)_

---

## 9. Histórico de mudanças

| Data | Versão | Autor | Mudança |
|---|---|---|---|
| AAAA-MM-DD | 1 | _(quem)_ | criação |

---

## 10. Menu de adaptação por domínio (preencher seções aplicáveis)

> Algumas seções adicionais a preencher conforme o domínio do produto. Pular seções não-aplicáveis. NÃO é obrigatório preencher tudo — escolha o conjunto certo pro contexto.

### 10.A — SaaS B2B

- **Modelo de cobrança:** assinatura mensal / por uso / por seat
- **Onboarding:** trial de N dias? self-serve ou demo?
- **Multi-tenant:** isolamento por schema/database/row-level? (ADR obrigatório)
- **Limites por plano:** _(quotas)_
- **SLA:** uptime target, RTO, RPO
- **Customer Success:** fluxo de ativação, NPS, churn signal

### 10.B — Mobile Consumer (B2C)

- **Plataformas:** iOS / Android / ambos / web mobile
- **App size budget:** _(MB)_
- **Modo offline:** _(quais features funcionam sem internet)_
- **Push notification:** estratégia (FCM/APNs, opt-in, frequência)
- **Permissões sensíveis:** câmera, GPS, contatos — quando pedir
- **Loja:** review guidelines (Apple/Google) que afetam escopo
- **Crash budget:** _(% de sessões sem crash)_

### 10.C — Sistema regulado (fintech / saúde / governo)

- **Regulação aplicável:** _(Bacen Res. X, ANS Y, LGPD Art. Z, CFM N)_
- **Auditoria externa:** quem audita, frequência
- **Retenção legal de dados:** _(prazo + por que)_
- **Compliance officer:** _(quem aprova)_
- **Penalidade por descumprimento:** _(estimar)_
- **Plano de incidente:** SLA pra comunicação à autoridade (72h ANPD, X horas Bacen)
- **Imutabilidade:** _(quais dados são imutáveis e por quê)_

### 10.D — CLI / Biblioteca / Framework

- **Plataformas suportadas:** Windows / macOS / Linux + versões
- **Versão de runtime mínima:** _(Node N+, Python N+, etc)_
- **Instalação:** npm / pip / homebrew / binary?
- **Breaking changes:** política de semver
- **Deprecation:** _(prazo de aviso antes de remover)_
- **API estável vs experimental:** _(marcação clara)_

### 10.E — Plataforma de dados / analytics

- **Volume esperado:** _(eventos/dia, GB/mês)_
- **Latência de ingestão:** real-time / batch X horas
- **Schema evolution:** estratégia (Avro, Protobuf, JSON Schema)
- **Particionamento:** _(estratégia)_
- **Custo de storage:** _(estimativa mensal)_
- **GDPR/LGPD na esteira:** anonimização, direito ao esquecimento, exportação

### 10.F — Sistema legado (brownfield migration)

- **Sistema substituído:** _(qual)_
- **Estratégia:** big bang / strangler fig / paralelo
- **Plano de rollback:** _(prazo + procedimento)_
- **Coexistência:** _(quanto tempo os dois rodam juntos)_
- **Migração de dados:** _(volume, plano, janela de manutenção)_
- **Treinamento de usuário:** _(quem treina, quando)_
