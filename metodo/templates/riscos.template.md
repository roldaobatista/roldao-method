---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 09/17
proximo: docs/descoberta/restricoes.md
idioma: pt-BR
limite-linhas: 200
proposito: registro de riscos do projeto (R-NNN) com probabilidade, impacto e mitigação.
---

<!--
template: riscos.md
destino: docs/descoberta/riscos.md
uso: cada risco com ID R-NNN, probabilidade (A/M/B), impacto (A/M/B), responsável, mitigação.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3
limite: ≤200 linhas.
-->

# Riscos — <NomeDoProjeto>

> Distintos das ameaças de segurança (`docs/seguranca/threat-model.md`). Aqui é risco de **produto/negócio/operação/projeto**.

## Como ler

- **Probabilidade**: A (alta — ≥50%), M (média — 20-50%), B (baixa — <20%) em horizonte de 12 meses.
- **Impacto**: A (alto — bloqueia projeto / dano financeiro >R$X), M (médio — atraso de meses), B (baixo — contornável).
- **Severidade** (derivada): A×A = 🔴 crítico, A×M ou M×A = 🟠 alto, demais = 🟡 médio/baixo.

## Riscos ativos

| ID | Descrição | Categoria | Prob | Imp | Sev | Responsável | Mitigação | Status |
|---|---|---|---|---|---|---|---|---|
| R-001 | <ex.: cliente piloto desiste antes do MVP> | mercado | M | A | 🟠 | <dono> | <contrato beta + cláusula de saída> | ativo |
| R-002 | <ex.: stack escolhida não suporta volume real> | técnico | B | A | 🟡 | <tech-lead> | <load test antes de F-2> | ativo |
| R-003 | <ex.: regulação muda (LGPD/Bacen) durante desenvolvimento> | regulatório | M | M | 🟡 | <DPO> | <monitorar normativos, ADR sob pedido> | ativo |
| R-004 | <ex.: dependência crítica deprecate sem aviso> | técnico | B | M | 🟡 | <tech-lead> | <SBOM + max-age=12m> | ativo |
| R-005 | <ex.: rotatividade do time>  | gente | M | M | 🟡 | <dono> | <documentação canônica, BUS factor ≥2> | ativo |

## Riscos por categoria

### Mercado / produto
- R-001 ...

### Técnico
- R-002, R-004 ...

### Regulatório / legal
- R-003 ...

### Gente / time
- R-005 ...

### Financeiro
- <ex.: queima de caixa antes do break-even>

### Operação / infra
- <ex.: cloud regional cair, blast radius>

## Riscos vigiados (não-ativos, mas reabrir se gatilho)

| ID | Descrição | Gatilho para reativar |
|---|---|---|
| R-V-001 | <ex.: pedido de feature internacional> | <quando ≥3 clientes pedirem em pesquisa> |

## Riscos resolvidos (mover para histórico)

| ID | Descrição | Como foi resolvido | Quando |
|---|---|---|---|
| R-X | <...> | <...> | <YYYY-MM-DD> |

## Revisão

- Frequência: <mensal | a cada marco>
- Próxima revisão: <YYYY-MM-DD>
- Revisores: <dono + tech-lead>

## Critério para promover de `draft` para `stable`

- [ ] ≥5 riscos identificados (3 categorias diferentes no mínimo).
- [ ] Cada risco tem responsável nomeado.
- [ ] Cada risco tem mitigação concreta (não "monitorar").
- [ ] Frequência de revisão definida.
