---
tipo: helper
owner: framework
revisado-em: 2026-05-24
status: stable
---

# Helper — Como preencher Épico

> **Companheiro do `epico.md`.** Épico é decomposição de PRD em stories filhas (US-NNN).

## Quando criar épico

- PRD virou aprovado e precisa virar trabalho executável.
- Iniciativa cabe em **3-8 stories** (US-NNN). Se for menos que 3, é story só. Se for mais que 8, é PRD novo.
- Tem deadline ou marco compartilhado (release, prazo legal).

## Estrutura mínima

| Campo | Exemplo |
|---|---|
| `id` | `EP-003` |
| `prd` | `PRD-007` (ou `null` se greenfield direto) |
| `status` | `proposto` → `aprovado` → `em-execucao` → `entregue` |
| Stories filhas | `US-042`, `US-043`, `US-044` |
| Critério de "épico pronto" | "5 tarefas-tipo executadas pelo Roldão sem ajuda" |

## Critério de épico pronto — 3 exemplos

**Específico (bom):**
> 1. Cliente faz pedido com Pix e nota chega no extrato bancário com EndToEndId correto.
> 2. Webhook do PSP é rejeitado se HMAC inválido (PIX-002).
> 3. Coluna `txid` tem UNIQUE.

**Genérico (ruim):**
> "Pix funcionando." ← sem critério verificável.

**Misto (bom — combina automatizado + manual):**
> 1. `npm test` 100% verde (automatizado).
> 2. Dona da loja consegue gerar QR Pix em < 30s (manual, com observação direta).

## Ordem das stories — pensamento mental

1. **Fundação primeiro:** migration de banco antes da feature que usa coluna nova.
2. **Mais arriscado primeiro:** integração externa antes de UI (descobrir bug cedo).
3. **Story que destrava outras:** se 3 stories dependem de schema novo, schema vai primeiro.

**Hook mecânico:** `validate-story-dependencies.js` bloqueia US-N se dependência ainda não foi marcada entregue.

## Readiness — sinal verde antes do `/feature`

Cada épico precisa de `docs/readiness/EP-NNN-status.md` com `status: PRONTO` antes do `/feature` rodar. O `/inicio` e `/brownfield` emitem esse sinal automaticamente. Pra épico manual:

```yaml
---
owner: tech-lead
revisado-em: 2026-05-24
status: PRONTO
---

# Readiness EP-003

- Stack escolhida (ADR-0014, ADR-0015 aceitos)
- Esqueleto rodando em `docker compose up`
- Testes configurados em `vitest`
- Schema do banco aplicado em homologação
```

## Quando este helper abre

`/epico` encontra `_(preencher)_` em critério de pronto ou stories filhas e propõe sugestões.
