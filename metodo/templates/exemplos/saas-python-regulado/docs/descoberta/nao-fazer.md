---
owner: <PRODUCT>
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 80
proposito: o que o conciliab NUNCA fará (ou não fará na V1).
---

# Não-fazer — conciliab

## 1. Não-fazer nunca

| ID | Item | Motivo |
|---|---|---|
| NF-001 | Armazenar PAN completo de cartão de crédito | PCI DSS fora de escopo; só guardamos os 4 últimos via gateway |
| NF-002 | Cobrar comissão sobre transações dos clientes | Modelo é mensalidade fixa; comissão muda perfil regulatório (vira instituição de pagamento) |
| NF-003 | Substituir o ERP do cliente | Integramos com o ERP, não competimos |
| NF-004 | Aceitar dado fiscal sem trilha imutável (audit_log WORM) | INV-AUDIT-002 inviolável |

## 2. Não-fazer na V1 (entrar em V2+)

| ID | Item | Quando reavaliar |
|---|---|---|
| NF-V1-001 | App mobile nativo | Quando ≥30% dos clientes pedirem em onboarding |
| NF-V1-002 | Integração com Bacen Open Finance | Quando ≥3 bancos do segmento estiverem homologados E ICP-Brasil estiver no roadmap |
| NF-V1-003 | Dashboard customizável pelo usuário | V3 após telemetria estabilizada |
| NF-V1-004 | Reconciliação multi-moeda | V3, depois do MVP funcionar em BRL |
| NF-V1-005 | Self-service de cadastro | F-4 — beta inteiro é onboarding assistido |

## 3. Não-fazer porque outro produto faz melhor

| Função | Por quem | Como integrar |
|---|---|---|
| Emissão de NF-e | NFe.io ou Focus NFe | API |
| Gateway de pagamento (se aplicar) | Pagar.me ou Asaas | API |
| Análise crédito | Serasa | API consumida pelo cliente final |

## 4. Tentações recorrentes (refresh)

- "Adicionar chat no produto" → motivo: WhatsApp via parceiro resolve; chat interno gera custo de suporte sem ROI.
- "Deixar usuário escrever SQL personalizado" → motivo: risco de violar RLS multi-tenant.
- "Suporte 24/7" → motivo: SLA 8x5 está coerente com ticket R$ 199-499.

## Como mudar este arquivo

- Mover item de "V1 não" para "V1 sim" exige ADR + atualização do faseamento.
- Adicionar NF-NNN: PR dedicado, justificativa.
- Remover item: reunião com dono — não basta consenso técnico.
