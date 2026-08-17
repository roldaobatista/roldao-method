---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 300
proposito: PRD — Product Requirements Document. Visão de produto em formato canônico.
---

<!--
template: prd.md
destino: docs/dominios/<dom>/prd.md ou docs/produto/prd-v1.md
uso: visão de produto AGREGADA. Distinguir de spec.md (por módulo) e de problema.md (descoberta).
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §6 (C4 Produto)
limite: ≤300 linhas.
-->

# PRD — <NomeDoProjeto> — <versão / fase>

## 1. Resumo executivo (1 página)

- **Problema**: <1-2 frases — referência [`docs/descoberta/problema.md`](../descoberta/problema.md)>
- **Solução**: <1-2 frases>
- **Por que agora**: <gatilho de mercado/regulação/oportunidade>
- **Métrica de sucesso**: <NSM em 1 número, prazo>
- **Investimento**: <R$ e meses até MVP>

## 2. Personas-alvo desta versão

| Persona | Papel | Por que importa nesta versão |
|---|---|---|
| P-001 | <...> | <...> |
| P-002 | <...> | <...> |

> Detalhes em [`docs/descoberta/personas.md`](../descoberta/personas.md).

## 3. Escopo desta versão (in/out)

### Em escopo (V-x)
- F-101: <funcionalidade 1>
- F-102: <funcionalidade 2>
- F-103: <funcionalidade 3>

### Fora de escopo (V-x)
- <funcionalidade postergada — vai pra V-x+1>
- <funcionalidade postergada — vai pra V-x+2>
- <funcionalidade nunca planejada — link `nao-fazer.md`>

> Decisões de exclusão: [`docs/descoberta/nao-fazer.md`](../descoberta/nao-fazer.md).

## 4. User stories (resumo)

> Detalhe por módulo em `docs/dominios/<dom>/modulos/<mod>/spec.md` via `spec.template.md`.

### Módulo: <nome do módulo 1>

- **US-MOD-001**: como <persona>, quero <ação>, para <benefício>.
  - AC-MOD-001-1: <critério>
  - AC-MOD-001-2: <critério>
- **US-MOD-002**: <...>
- **US-MOD-003**: <...>

### Módulo: <nome do módulo 2>

[mesmo formato]

## 5. Requisitos não-funcionais

| Categoria | Requisito | Verificação |
|---|---|---|
| Performance | API p95 ≤ 500ms | APM + load test |
| Disponibilidade | 99.5% uptime mensal | SLO em `slo-sli.md` |
| Segurança | RLS ativa, sem PII em logs | auditor-seguranca + teste |
| LGPD | ROPA atualizada antes do deploy | auditor-lgpd |
| Auditoria | toda mutação financeira em WORM | auditor-fiscal |
| Acessibilidade | WCAG 2.1 nível AA nas telas-chave | auditor-a11y |
| Idioma | pt-BR completo | revisão manual |

## 6. Dependências

- **ADRs bloqueantes**: ADR-NNNN (stack), ADR-NNNN (tenancy), ADR-NNNN (storage).
- **Integrações externas**: ver [`docs/descoberta/integracoes-externas.md`](../descoberta/integracoes-externas.md).
- **Foundations bloqueantes**: F-A (auth + multi-tenant + observabilidade).

## 7. Faseamento

| Fase | Marco | Critério de fechamento |
|---|---|---|
| F-A | foundation pronta | PASS ZERO C/A/M + INV-TENANT-001..003 em produção |
| F-1 | módulo X visível ao usuário | US-X-001..010 com ACs verdes + auditor-produto OK |
| F-2 | módulo Y visível | US-Y-001..N + auditor OK |
| F-3 | self-service liberado | onboarding ≤30min + churn vigiado |

> Detalhes em `docs/faseamento/<fase>/kickoff.md`.

## 8. Riscos do produto

Top-3, com mitigação. Detalhes em [`docs/descoberta/riscos.md`](../descoberta/riscos.md).

| ID | Risco | Mitigação |
|---|---|---|
| R-PROD-001 | <ex.: cliente não percebe valor em 14 dias e churna> | <onboarding assistido nos 3 primeiros> |
| R-PROD-002 | <...> | <...> |
| R-PROD-003 | <...> | <...> |

## 9. Hipóteses críticas a validar nesta versão

Cruzar com [`docs/descoberta/hipoteses-a-validar.md`](../descoberta/hipoteses-a-validar.md).

- H-001: <pricing>
- H-002: <demanda>

## 10. Métricas (definição de pronto pela métrica)

> Mover NSM e guardrails para cá em formato versionado pela fase.

- **NSM**: <meta numérica até <data>>
- **G-001**: <meta>
- **G-002**: <meta>

## 11. Aprovações

| Quem | Papel | Data |
|---|---|---|
| <dono> | sponsor | <YYYY-MM-DD> |
| <tech-lead> | viabilidade técnica | <YYYY-MM-DD> |
| <DPO> | viabilidade LGPD | <YYYY-MM-DD se regulado> |

## Critério para promover de `draft` para `stable`

- [ ] Escopo in/out definido.
- [ ] US numeradas e linkadas a specs por módulo.
- [ ] NFRs com critério verificável.
- [ ] ADRs bloqueantes referenciados.
- [ ] Top-3 riscos com mitigação.
- [ ] Aprovações registradas.
