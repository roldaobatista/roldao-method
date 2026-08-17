---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 200
proposito: visão geral da arquitetura — diagrama C4 nível 1 e 2, fronteiras, contextos.
---

<!--
template: visao-geral.md
destino: docs/dominios/visao-geral.md (ou docs/arquitetura/visao-geral.md)
uso: C4 nível 1 (sistema vs mundo) e nível 2 (containers). Atualizar quando ADR muda fronteira.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §5 (C3 Arquitetura)
limite: ≤200 linhas.
-->

# Visão geral da arquitetura — <NomeDoProjeto>

## 1. Contexto (C4 nível 1)

> Quem interage com o sistema? Quais sistemas externos ele conversa?

```
              ┌──────────────────────────────────┐
              │       <NomeDoProjeto>            │
   <Persona1>─┤   (descrição em 1 linha)         ├─<Sistema Externo A>
   <Persona2>─┤                                  ├─<Sistema Externo B>
              │                                  ├─<Sistema Externo C>
              └──────────────────────────────────┘
```

### Atores externos

| Ator | Tipo | Papel | Fluxo |
|---|---|---|---|
| <Persona1> | usuário humano | <papel> | <leitura/escrita> |
| <Sistema A> | sistema externo | <ex.: gateway de pagamento> | <síncrono REST> |
| <Sistema B> | sistema externo | <ex.: ERP do cliente> | <import CSV diário> |

## 2. Containers (C4 nível 2)

> Processos/serviços internos. Limite duro: ≤7 containers no nível 2 — se passar, fatiar em sub-diagramas.

```
┌──────────────────────────────────────────────────────────────┐
│                     <NomeDoProjeto>                          │
│                                                              │
│  ┌───────────────┐    ┌──────────────┐   ┌──────────────┐   │
│  │  <Container1> │───▶│ <Container2> │──▶│ <Container3> │   │
│  │  (web app)    │    │ (API)        │   │ (worker)     │   │
│  └───────────────┘    └───────┬──────┘   └──────────────┘   │
│                               │                              │
│                       ┌───────▼──────┐                       │
│                       │  PostgreSQL  │                       │
│                       │  (tenant_id) │                       │
│                       └──────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

| Container | Responsabilidade | Tecnologia | Comunicação |
|---|---|---|---|
| <Container1> | <ex.: UI web> | <Next.js> | <HTTPS> |
| <Container2> | <ex.: API REST> | <FastAPI> | <JSON/HTTPS> |
| <Container3> | <ex.: worker async> | <Celery> | <Redis> |
| <Banco> | <persistência principal> | <PostgreSQL 16> | <TCP> |

## 3. Bounded contexts

Ver [`bounded-contexts.md`](./bounded-contexts.md) para o mapa de contextos do domínio.

## 4. Decisões arquiteturais ativas

- [ADR-0001](../adr/ADR-0001-stack.md) — Stack escolhida.
- [ADR-0002](../adr/ADR-0002-multi-tenant.md) — Modelo de tenancy.
- [ADR-0003](../adr/ADR-0003-storage.md) — Estratégia de armazenamento.

## 5. Fronteiras de confiança (trust boundaries)

Cada vez que dado cruza linha pontilhada, validar/autenticar/sanitizar.

```
   Internet
      │ (TLS)
  ╔═══▼═══════════════════════════╗
  ║  WAF + Load Balancer          ║   ← fronteira pública/privada
  ╚═══┬═══════════════════════════╝
      │ (TLS interno)
  ╔═══▼═══════════════════════════╗
  ║  API (autenticação)           ║   ← fronteira anônimo/autenticado
  ╚═══┬═══════════════════════════╝
      │ (sessão com tenant_id)
  ╔═══▼═══════════════════════════╗
  ║  Banco (RLS por tenant_id)    ║   ← fronteira tenant/tenant
  ╚═══════════════════════════════╝
```

> Detalhes de ameaças por fronteira: [`docs/seguranca/threat-model.md`](../seguranca/threat-model.md).

## 6. Dependências externas

| Serviço | Função | Criticidade | Plano B se cair |
|---|---|---|---|
| <serviço A> | <auth> | 🔴 alta | <degradação graciosa> |
| <serviço B> | <e-mail> | 🟠 média | <fila local + retry> |

> Detalhes em [`docs/descoberta/integracoes-externas.md`](../descoberta/integracoes-externas.md).

## 7. Modos de operação

- **Normal**: <descrição>
- **Degradado** (1+ dep externa fora): <o que ainda funciona>
- **Manutenção**: <o que para>
- **Disaster recovery**: ver [`docs/operacao/disaster-recovery.md`](../operacao/disaster-recovery.md).

## Critério para promover de `draft` para `stable`

- [ ] C4 nível 1 desenhado e legendado.
- [ ] C4 nível 2 desenhado (≤7 containers).
- [ ] Trust boundaries explícitas.
- [ ] Dependências externas com plano B.
