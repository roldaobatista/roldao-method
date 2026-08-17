---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 17/17
proximo: bootstrap-fase-2.sh + ADR-0001/ADR-0002
idioma: pt-BR
limite-linhas: 250
proposito: resumo de C1 Descoberta — destrava ADRs (C2).
---

<!--
template: sintese-final.md
destino: docs/descoberta/sintese-final.md
uso: 2-4 páginas resumindo problema, personas, jornadas, BMC, VPC, concorrentes, riscos, métricas, não-fazer.
status: stable aqui = "pode começar a decidir arquitetura (ADRs)".
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3
limite: ≤250 linhas.
-->

# Síntese final — Descoberta — <NomeDoProjeto>

> **Status `stable` neste arquivo é o GATE para C2 ADRs.** Antes daqui, decisão arquitetural é prematura. Atualizado por humano + agente; gera coerência entre os 8-15 artefatos de C1.

## 1. Problema em 1 parágrafo

<3-5 frases. Quem sofre, quanto custa, por que solução existente não basta. Link para [`problema.md`](./problema.md).>

## 2. Quem usa (resumo)

| Persona ID | Nome | Papel | Comprador? |
|---|---|---|---|
| P-001 | <...> | <...> | sim/não |
| P-002 | <...> | <...> | sim/não |

> Detalhes em [`personas.md`](./personas.md).

## 3. Jornada principal (a que justifica V1)

- **Jornada**: J-NNN — <título>
- **Persona**: P-NNN
- **Antes**: <tempo, custo, dor principal>
- **Depois**: <tempo, custo, delight principal>
- **Economia**: <quantificada em R$, horas ou redução de erro>

> Detalhes em [`jornadas.md`](./jornadas.md).

## 4. Modelo de negócio (resumo de 5 linhas)

- **Segmento**: <quem paga>
- **Proposta**: <o que recebe>
- **Preço**: <R$/mês ou modelo>
- **Canal**: <como chega>
- **Break-even**: <N clientes / R$ X de MRR>

> Detalhes em [`business-model-canvas.md`](./business-model-canvas.md) + [`value-proposition-canvas.md`](./value-proposition-canvas.md).

## 5. Concorrência — diferenciação

- **Concorrentes diretos**: <listar 3>
- **Concorrente real é o "não fazer nada"?**: sim/não
- **Diferencial 1**: <frase única>
- **Diferencial 2**: <frase única>

> Detalhes em [`concorrentes.md`](./concorrentes.md).

## 6. Não-fazer (resumo)

- **NF-001**: <item crítico que define o produto pela negação>
- **NF-002**: <...>
- **V1 deixou de fora**: <itens que vão pra V2+>

> Detalhes em [`nao-fazer.md`](./nao-fazer.md).

## 7. Riscos top-3

| ID | Risco | Severidade | Mitigação principal |
|---|---|---|---|
| R-001 | <...> | 🔴/🟠/🟡 | <...> |
| R-002 | <...> | 🔴/🟠/🟡 | <...> |
| R-003 | <...> | 🔴/🟠/🟡 | <...> |

> Detalhes em [`riscos.md`](./riscos.md).

## 8. Métricas que mediremos

- **North Star Metric**: <métrica única — meta V1>
- **Guardrails**: <listar 3>

> Detalhes em [`metricas-chave.md`](./metricas-chave.md).

## 9. Decisões já tomadas (antes de C2)

> Decisões de NEGÓCIO/PRODUTO que orientam ADRs (mas não são ADRs). ADRs cuidam de tecnologia.

- D-PROD-001: <ex.: foco em PMEs do varejo Sudeste; ignorar enterprise>
- D-PROD-002: <ex.: SaaS auto-serviço a partir de F-4; até lá, onboarding assistido>
- D-PROD-003: <...>

## 10. Hipóteses críticas ainda não validadas

> Cada uma vira candidata a `hipoteses-a-validar.md` ou ADR.

- H-001: <hipótese — como validar — quando>
- H-002: <...>

## 11. O que falta antes do GATE `stable`

> Checklist de pendências de C1. Quando todos os itens checked, pode subir status para `stable` e liberar C2.

- [ ] `problema.md` em `stable`.
- [ ] `personas.md` em `stable` (≥1 validada por entrevista/observação).
- [ ] `jornadas.md` em `stable` (jornada principal mapeada).
- [ ] `business-model-canvas.md` em `stable`.
- [ ] `value-proposition-canvas.md` em `stable`.
- [ ] `concorrentes.md` em `stable` (≥3 diretos).
- [ ] `nao-fazer.md` em `stable` (≥3 itens NF).
- [ ] `riscos.md` em `stable` (≥5 riscos com mitigação).
- [ ] `metricas-chave.md` em `stable` (NSM + 3 guardrails).
- [ ] `gtm-pricing.md` em `stable` (modelo de preço + canal de aquisição definidos).
- [ ] `restricoes.md` em `stable` (limites de orçamento, prazo, equipe e legais mapeados).
- [ ] `hipoteses-a-validar.md` em `stable` (cada hipótese com critério e prazo de validação).
- [ ] `glossario.md` em `stable` (≥20 termos do domínio).
- [ ] `mercado-regulatorio.md` em `stable` (se regulado) — ou marcado N/A.
- [ ] `dados-existentes.md` (se migra) — ou N/A.
- [ ] `integracoes-externas.md` (se integra) — ou N/A.

## 12. Próximo passo

Quando este arquivo virar `stable`:
1. Abrir ADR-0001 (escolha de stack).
2. Abrir ADR-0002 (modelo de tenancy / armazenamento de dados).
3. Continuar via `templates/ADR.template.md`.
