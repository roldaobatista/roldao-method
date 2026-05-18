---
tipo: prd
subtipo: brownfield
id: PRD-NNN
versao: 1
status: draft
owner: gerente-produto
revisado-em: AAAA-MM-DD
---

# PRD-NNN — _(nome da iniciativa em projeto legado)_

> **PRD Brownfield**: aplicado a projeto que **já existe e está em produção**. Difere do PRD greenfield porque carrega **débito técnico**, **histórico de decisões**, **usuários reais** e **regimes legados** que precisam continuar funcionando.
>
> Use este template quando a iniciativa **modifica comportamento existente** em vez de criar do zero.

---

## 1. Problema

_(1-3 parágrafos. Quem sofre HOJE, com que frequência, com que custo. Cite tickets/métricas reais.)_

**Evidência:**
- _(métrica atual do problema)_
- _(citação de cliente / ticket recorrente)_
- _(impacto financeiro estimado)_

---

## 2. Estado atual do sistema

_(O que existe hoje que vai ser tocado. Investigador preenche.)_

### 2.1 Comportamento atual

_(Como o sistema se comporta hoje na área afetada. Inclui o "errado" se for bug.)_

### 2.2 Arquivos/módulos afetados

- _(lista de paths)_

### 2.3 ADRs existentes que tocam essa área

- _(ADR-NNNN — descrição)_

### 2.4 Débito técnico conhecido

- _(débito que vai dar trabalho extra ou que dá pra resolver junto)_

---

## 3. Personas e impacto em usuários existentes

| Persona | Quantos hoje | Como vai sentir |
|---|---|---|
| _(ex: cliente PME)_ | _(N empresas)_ | _(mudança que vai ver / não vai ver)_ |

### 3.1 Migração de dados/usuários

- _(precisa migrar dado existente? Sim/Não. Se sim, plano resumido.)_
- _(precisa avisar cliente da mudança? Sim/Não. Como?)_

---

## 4. Hipótese de solução

_(1-2 parágrafos. Direção em alto nível. NÃO desce em design.)_

### 4.1 Por que essa direção (vs alternativas brownfield)

- **Refazer do zero:** _(considerado? por quê não)_
- **Strangler pattern (substituição gradual):** _(faz sentido?)_
- **Feature flag e dual-write:** _(usar?)_
- **Migração big-bang em janela de manutenção:** _(usar?)_

---

## 5. User stories rastreáveis

> Em brownfield, considere ordenar as stories pra **manter sistema funcionando o tempo todo**. Big-bang só com plano de rollback testado.

### US-001 — _(...)_
- **AC-001-1** — _(...)_

### US-002 — _(...)_

---

## 6. Breaking changes

| O que muda | Quem é afetado | Plano de transição |
|---|---|---|
| _(ex: endpoint /v1 obsoleto)_ | _(integrações de cliente X, Y)_ | _(v1 + v2 paralelos por 90 dias, deprecation header)_ |
| _(ex: estrutura de dado mudou)_ | _(usuários históricos)_ | _(migration backfill + view de compatibilidade)_ |

---

## 7. Plano de migração

### 7.1 Fases

1. **Preparação** — _(adicionar coluna nova, dual-write, etc.)_
2. **Backfill** — _(popular dado novo a partir do antigo)_
3. **Mudança de leitura** — _(ler do novo, conferir contra o antigo)_
4. **Desativação** — _(remover código antigo, dropar coluna)_

### 7.2 Cronograma proposto

| Fase | Quando | Reversível? |
|---|---|---|
| Preparação | Sprint 1 | Sim |
| Backfill | Sprint 1-2 | Sim |
| Leitura nova | Sprint 3 (feature flag) | Sim |
| Desativação | Sprint 5 (após 30 dias estável) | Não — fazer último |

### 7.3 Plano de rollback

_(Para cada fase, o que faz se der errado.)_

---

## 8. Compatibilidade reversa

- [ ] APIs públicas mantêm contrato? Se não, por quanto tempo o antigo coexiste?
- [ ] Mobile apps antigos continuam funcionando?
- [ ] Integrações de cliente continuam funcionando?
- [ ] Dados históricos continuam consultáveis?
- [ ] Relatórios antigos continuam reprodutíveis?

---

## 9. Non-goals (INV-003)

- _(o que NÃO vai ser refatorado nessa onda — débito que fica)_
- _(o que NÃO vai mudar pro cliente)_

---

## 10. Métricas de sucesso

| Métrica | Atual | Meta | Quando medir |
|---|---|---|---|
| _(taxa de erro)_ | _(X%)_ | _(Y%)_ | _(30/60/90 dias)_ |
| _(performance)_ | _(...)_ | _(...)_ | _(...)_ |

### 10.1 Métricas de não-regressão (importante em brownfield)

- _(o que NÃO pode piorar — funcionalidades adjacentes que precisam continuar OK)_

---

## 11. Riscos brownfield (extra-críticos)

| Risco | Probab | Impacto | Mitigação |
|---|---|---|---|
| Perder dado histórico | _(baixa)_ | _(crítico)_ | Backup completo + restore testado |
| Quebrar integração de cliente | _(média)_ | _(alto)_ | Deprecation com 90 dias |
| Migration trava banco | _(média)_ | _(alto)_ | Migração em janela + estudo de lock |
| Performance pior após mudança | _(média)_ | _(médio)_ | Load test com dado real anonimizado |
| Comportamento sutil mudar e ninguém perceber | _(alta)_ | _(médio)_ | Shadow traffic comparando antigo vs novo |

---

## 12. Regulamentação BR

- **LGPD:** se mexer em coleta/uso/exclusão de dado pessoal existente, atualizar Política de Privacidade e notificar titulares (se mudança de finalidade).
- **Fiscal:** se mexer em emissão fiscal, manter notas históricas imutáveis (FISCAL-001).
- **Outros:** _(...)_

---

## 13. Comunicação

- [ ] Stakeholders internos avisados (suporte, vendas, jurídico).
- [ ] Plano de release notes pro cliente final escrito.
- [ ] Banner no app/email pra clientes afetados se breaking change.
- [ ] Time de suporte treinado pras perguntas que vão aparecer.

---

## 14. Histórico

| Data | Versão | Autor | Mudança |
|---|---|---|---|
| AAAA-MM-DD | 1 | _(quem)_ | criação |
