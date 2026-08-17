---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 08/17
proximo: docs/descoberta/riscos.md
idioma: pt-BR
limite-linhas: 120
proposito: lista do que o produto NUNCA fará (ou não fará na V1).
---

<!--
template: nao-fazer.md
destino: docs/descoberta/nao-fazer.md
uso: define non-goals em nível de produto. Cada item bloqueia adição não-solicitada.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3 + Princípio §1.4 (Non-goals explícitos).
limite: ≤120 linhas.
-->

# Não-fazer — <NomeDoProjeto>

> Tudo aqui é proibido sem aprovação explícita do dono. Cada item evita escopo inflado por agente IA ou contributor entusiasmado.

## 1. Não-fazer nunca (princípios)

| ID | Item | Motivo |
|---|---|---|
| NF-001 | <ex.: não armazenar PAN completo de cartão de crédito> | <evita PCI DSS, fora do escopo> |
| NF-002 | <ex.: não cobrar comissão sobre transações dos clientes> | <modelo de negócio é mensalidade, não take-rate> |
| NF-003 | <ex.: não substituir o ERP do cliente> | <integramos, não substituímos> |

## 2. Não-fazer na V1 (escopo da primeira release)

> Pode entrar em V2+; agora, não.

| ID | Item | Quando reavaliar (gatilho) |
|---|---|---|
| NF-V1-001 | <ex.: app mobile nativo> | <quando ≥30% dos clientes pedirem em onboarding> |
| NF-V1-002 | <ex.: integração com X ERP> | <quando ≥3 clientes pagarem add-on> |
| NF-V1-003 | <ex.: dashboard customizável pelo usuário> | <V2 após feedback de F-3> |

## 3. Não-fazer porque outro produto faz melhor

> Onde aceitar parceria / integração em vez de construir.

| ID | Função | Por quem | Como integrar |
|---|---|---|---|
| NF-OUT-001 | <emissão de NF-e> | <ex.: NFe.io, Focus NFe> | <API> |
| NF-OUT-002 | <gateway de pagamento> | <ex.: Pagar.me, Stripe> | <API> |

## 4. Tentações que voltam (refresh periódico)

> Lista de coisas que TODA reunião alguém sugere e a resposta segue sendo "não". Atualizar quando alguém sugerir de novo.

- <"adicionar chat com o cliente dentro do produto"> — motivo: <fora de escopo, contramedida: integração com WhatsApp via parceiro>.
- <"deixar o usuário escrever SQL personalizado"> — motivo: <risco de segurança/RLS>.

## Como mudar este arquivo

- Mover item de "V1 não" para "V1 sim" exige ADR + atualização do faseamento.
- Adicionar `NF-NNN` novo: PR dedicado, justificativa, link para evidência (entrevista, dado, decisão).
- Remover item: exige reunião explícita com dono — não basta consenso de devs.

## Critério para promover de `draft` para `stable`

- [ ] ≥3 itens em §1 (não-fazer-nunca) com motivo.
- [ ] Itens da V1 têm gatilho de reavaliação concreto.
- [ ] §3 (parceria) tem ≥1 caso quando aplicável (ou marcado N/A).
