---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 13/17
proximo: docs/descoberta/dados-existentes.md
idioma: pt-BR
limite-linhas: 200
proposito: leis, normas, órgãos e prazos aplicáveis ao domínio.
---

<!--
template: mercado-regulatorio.md
destino: docs/descoberta/mercado-regulatorio.md
uso: só projetos regulados (financeiro, saúde, educação, telecom, energia, governo, dados pessoais sensíveis).
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3 (condicional, 🔵)
limite: ≤200 linhas.
-->

# Mercado regulatório — <NomeDoProjeto>

> Se o produto NÃO é regulado, marcar este arquivo como N/A em `docs/nao-aplica.md` com gatilho de reavaliação.

## 1. Domínio regulado

- **Setor**: <financeiro | saúde | educação | telecom | energia | governo | dados sensíveis | infra crítica>
- **Atividade**: <ex.: conciliação bancária para PMEs, plataforma de telemedicina>

## 2. Leis e normas aplicáveis

| ID | Norma | Órgão | Aplica a | Prazo de conformidade |
|---|---|---|---|---|
| REG-001 | <LGPD (Lei 13.709/2018)> | <ANPD> | <todo tratamento de PII no Brasil> | <vigente> |
| REG-002 | <Resolução BCB 4.658/2018 — segurança cibernética em IFs> | <Bacen> | <se atende instituição financeira> | <vigente> |
| REG-003 | <PIX — circular Bacen 3.978> | <Bacen> | <se transaciona PIX> | <vigente> |
| REG-004 | <Marco Civil da Internet (Lei 12.965/2014)> | <—> | <armazenamento de logs por 6m> | <vigente> |
| REG-005 | <Open Finance — Resolução Conjunta 1/2020> | <Bacen> | <se integra Open Finance> | <conforme cronograma do Bacen> |

## 3. Órgãos fiscalizadores

| Órgão | O que fiscaliza | Penalidade típica |
|---|---|---|
| ANPD | LGPD | Advertência → multa até 2% do faturamento (limitado a R$ 50 milhões/infração) |
| Bacen | sistema financeiro | Multa, suspensão, descredenciamento |
| <Receita Federal> | <obrigações fiscais> | <multa por NF-e atrasada, etc.> |
| <Anvisa> | <saúde, dispositivo médico> | <suspensão de certificação> |

## 4. Certificações que o produto precisa / pretende obter

| Certificação | Quando | Custo estimado | Status |
|---|---|---|---|
| <ISO 27001> | <antes de F-3> | <R$ X> | <não iniciado> |
| <SOC 2 Type II> | <antes de cliente enterprise> | <R$ Y> | <não iniciado> |
| <PCI DSS> | <quando armazenar PAN> | <R$ Z> | <não aplicável V1> |
| <Certificação Bacen> | <quando virar IF> | <R$ W> | <não aplicável V1> |

## 5. Obrigações recorrentes

| Obrigação | Frequência | Responsável | Próxima entrega |
|---|---|---|---|
| RIPD revisão | <anual> | <DPO> | <YYYY-MM-DD> |
| ROPA atualização | <toda mudança de tratamento> | <DPO> | <contínuo> |
| Auditoria externa | <anual> | <CFO> | <YYYY-MM-DD> |
| Relatório de incidentes | <a cada incidente, ≤72h> | <DPO> | <quando ocorrer> |

## 6. Pontos críticos identificados

- <ponto 1: ex.: "armazenamento de dados deve ser no Brasil — usar AWS sa-east-1 (D-004)">
- <ponto 2: ex.: "audit_log é WORM — INV-AUDIT-002">
- <ponto 3>

## 7. Riscos regulatórios (cruzar com riscos.md)

- <ex.: mudança na LGPD pode exigir consentimento explícito para X> → R-NNN em `riscos.md`.
- <ex.: Open Finance pode exigir certificação ICP-Brasil> → GATE-OPEN-FINANCE-1.

## 8. Pessoas envolvidas

- **DPO / Encarregado**: <nome ou "ainda não designado">.
- **Advogado de compliance**: <nome ou escritório>.
- **Auditor externo**: <nome ou "não contratado">.

## Critério para promover de `draft` para `stable`

- [ ] ≥3 normas aplicáveis identificadas com fonte.
- [ ] Cada certificação tem status declarado.
- [ ] DPO ou responsável de compliance nomeado.
- [ ] Pontos críticos têm referência cruzada com ADR ou INV.
