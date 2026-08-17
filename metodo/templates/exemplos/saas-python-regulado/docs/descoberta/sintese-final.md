---
owner: <PRODUCT>
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 120
proposito: síntese de C1 do conciliab — destrava ADRs (C2).
---

# Síntese final — Descoberta — conciliab

## 1. Problema em 1 parágrafo

PMEs brasileiras (faturamento R$ 500k-50M/ano) gastam 3-5h por banco por mês conciliando extrato bancário com contas a pagar/receber. Para o sócio-administrador, isso vira 12h/mês de tempo dele (R$ 960/mês em "hora-sócio"); para os que terceirizam, R$ 200-400/mês ao contador. Soluções existentes (ERPs PME, Excel, OFX nu) não automatizam reconciliação parcial (taxa, juros, parcelamento), e Open Finance ainda não maturou no segmento PME. Link: [`problema.md`](./problema.md).

## 2. Quem usa

| ID | Persona | Papel | Comprador? |
|---|---|---|---|
| P-001 | Sócio-administrador da PME | usuário + decisor | SIM |
| P-002 | Financeiro interno | usuário diário | NÃO |
| P-003 | Contador terceirizado | influenciador (~40% das indicações) | NÃO |

> Detalhes: [`personas.md`](./personas.md).

## 3. Jornada principal (V1)

- **Persona**: P-001/P-002.
- **Hoje**: importação manual de extrato + reconciliação linha-a-linha em planilha → 3-5h/banco.
- **Depois**: upload OFX/CSV ou conexão Open Finance (V2) → reconciliação automática + revisão de divergências → ≤30 min/banco.
- **Economia**: ~10h/mês para o sócio = R$ 800/mês em tempo + redução de risco fiscal.

## 4. Modelo de negócio (resumo)

- **Segmento**: PMEs varejo Sudeste, R$ 500k-50M/ano, 50-300 transações/mês.
- **Proposta**: conciliação automática com trilha auditável (audit_log WORM) — compatível com fiscal e Open Finance.
- **Preço**: R$ 149-499/mês conforme volume. Beta R$ 49/mês × 6 meses pros 3 primeiros.
- **Break-even estimado**: ~40 clientes a ticket médio R$ 199 → MRR R$ 8k.

## 5. Concorrência

- **Diretos**: Conta Azul, Bling, Omie (ERPs PME com conciliação fraca como feature secundária).
- **Indireto principal**: Excel/Sheets + "não fazer nada".
- **Diferenciais conciliab**:
  - Reconciliação parcial robusta (taxa, juros, parcelamento) — não match todo-ou-nada.
  - WORM audit_log de saída — saída fiscal compatível sem ajuste manual.
  - Foco mono-funcional (conciliação) — não tenta substituir ERP.

## 6. Não-fazer (top)

- NF-001: não armazenar PAN cartão (fora de PCI).
- NF-V1-002: Open Finance só quando ICP-Brasil + 3 bancos do segmento estiverem homologados.
- NF-V1-005: self-service só em F-4 — beta inteiro é onboarding assistido.

> Detalhes: [`nao-fazer.md`](./nao-fazer.md).

## 7. Riscos top-3

| ID | Risco | Severidade | Mitigação |
|---|---|---|---|
| R-001 | Cliente piloto desiste antes do MVP | 🟠 alto | Contrato beta R$ 49/mês × 6m + cláusula saída |
| R-002 | Open Finance não madura no horizonte | 🟡 médio | CSV/OFX no V1; Open Finance é gate, não bloqueante |
| R-003 | LGPD muda exigência de consentimento | 🟡 médio | DPO monitora normativos, ADR-0002 documenta base legal |

## 8. Métricas

- **NSM**: conciliações fechadas com sucesso/mês. Meta F-1: 500.
- **Guardrails**: taxa de erro ≤2%, NPS ≥40, churn ≤5%, API p95 ≤500ms.

> Detalhes: [`metricas-chave.md`](./metricas-chave.md).

## 9. Decisões de produto (antes de C2)

- D-PROD-001: foco em PMEs Sudeste varejo R$ 500k-50M; ignorar enterprise.
- D-PROD-002: V1 sem Open Finance; CSV/OFX só.
- D-PROD-003: SaaS auto-serviço só a partir de F-4.

## 10. Hipóteses críticas ainda em validação

- H-001: PME paga R$ 99-199/mês (parcial — testar R$ 99 e R$ 199 nos próximos 3 meses).
- H-002: contadora indica para clientes (aberta — 5 contadores em junho/2026).

## 11. Critério `stable`

- [x] `problema.md` stable.
- [x] `personas.md` stable.
- [x] `nao-fazer.md` stable.
- [x] `metricas-chave.md` stable.
- [ ] `jornadas.md` — pendente (dívida documentada em `docs/nao-aplica.md`).
- [ ] `business-model-canvas.md` — pendente.
- [ ] `value-proposition-canvas.md` — pendente.
- [ ] `concorrentes.md` — pendente (dados em prosa neste arquivo enquanto não materializa).
- [ ] `riscos.md` — pendente (top-3 acima).

## 12. Próximo passo

ADR-0001 (stack Python+FastAPI) já aceita. ADR-0002 (RLS) aceita. ADR-0003 (storage) aceita. F-A foundations em andamento.
