---
owner: ana-silva
revisado-em: 2026-05-27
status: stable
tipo: painel-vivo
origem: kickoff-foundation.md (F-A)
proximo: —
referencia: [docs/descoberta/sintese-final.md, docs/faseamento/F-A-foundations/kickoff.md]
idioma: pt-BR
limite-linhas: 120
proposito: exemplo preenchido do meta-template para referência e comparação
---

# Painel Atual — conciliab

## 1. Fase atual
- **Fase**: F-A — foundations (multi-tenant + auth + observabilidade)
- **Kickoff**: [`docs/faseamento/F-A-foundations/kickoff.md`](../docs/faseamento/F-A-foundations/kickoff.md)
- **Status**: em andamento

## 2. Problema-âncora
- **Problema**: [`docs/descoberta/problema.md`](../docs/descoberta/problema.md)
- **Resumo em 1 linha**: PMEs gastam 3-5h/banco/mês conciliando manualmente; queremos cair para ≤30 min.

## 3. Última entrega concluída

### 3.1 Última US concluída
- **ID**: —
- **Link**: (ainda não há US concluída — projeto em foundation)
- **Quando**: —
- **Resumo**: —

### 3.2 Última T concluída
- **ID**: T-CONC-002 — RLS policy criada em customers/transactions
- **Link**: `docs/faseamento/F-A-foundations/tasks.md`
- **Quando**: 2026-05-26
- **Resumo**: RLS ativa em ambas tabelas; teste de isolamento passou.

## 4. Próximo T-NNN
- **ID**: T-CONC-003
- **Link**: `docs/faseamento/F-A-foundations/tasks.md`
- **Descrição**: middleware FastAPI seta `app.current_tenant_id` antes de cada request.
- **ACs cobertos**: AC-CONC-001-1, AC-CONC-001-2.

## 5. Bloqueadores conhecidos
- Nenhum bloqueador conhecido.

## 6. Contexto recente
- ADR-0001 (stack Python+FastAPI) aceita 2026-05-20.
- ADR-0002 (RLS por tenant_id) aceita 2026-05-22.
- ADR-0003 (storage Postgres + S3) aceita 2026-05-23.
- Contrato beta assinado com 3 PMEs (R$ 49/mês × 6 meses) — 2026-05-24.

## 7. Última atualização
- Data: 2026-05-27
- Por: ana-silva
- Sessão anterior terminou em: RLS policy validada; próxima sessão começa pelo middleware FastAPI.

## 9. Ver também
- Síntese de descoberta: [`docs/descoberta/sintese-final.md`](../docs/descoberta/sintese-final.md)
- Kickoff F-A: [`docs/faseamento/F-A-foundations/kickoff.md`](../docs/faseamento/F-A-foundations/kickoff.md)

> Termos técnicos: ver `GLOSSARIO-ROLDAO.md` na raiz do meta-template.
