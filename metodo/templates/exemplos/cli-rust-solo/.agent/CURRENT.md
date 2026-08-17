---
owner: roldao
revisado-em: 2026-05-27
status: stable
tipo: painel-vivo
proximo: —
idioma: pt-BR
limite-linhas: 80
proposito: exemplo preenchido do meta-template para referência e comparação
---

# Painel Atual — tempo-cli

## 1. Fase atual
- **Fase**: F-1 — MVP CLI (comandos start/stop/report)
- **Kickoff**: backlog em GitHub Issues (projeto solo, sem faseamento formal — ver `nao-aplica.md`).
- **Status**: em andamento

## 2. Problema-âncora
- **Problema**: [`docs/descoberta/problema.md`](../docs/descoberta/problema.md)
- **Resumo em 1 linha**: registrar tempo gasto em tarefas no terminal, sem servidor nem cadastro.

## 3. Última entrega concluída
- **ID**: T-CLI-005 — comando `tempo start <task>`.
- **Quando**: 2026-05-25
- **Resumo**: comando funcional, testes em `tests/cli/test_start.rs`.

## 4. Próximo T-NNN
- **ID**: T-CLI-006
- **Descrição**: comando `tempo stop` que fecha o registro aberto.
- **ACs cobertos**: AC-CLI-001-3.

## 5. Bloqueadores conhecidos
- Nenhum bloqueador conhecido.

## 6. Contexto recente
- ADR-0001 (stack Rust) aceita 2026-05-15.
- ADR-0002 (distribuição via crates.io + GitHub Releases) aceita 2026-05-18.

## 7. Última atualização
- Data: 2026-05-27
- Por: roldao
- Sessão anterior terminou em: comando `start` validado; próximo é `stop`.

## 9. Ver também
- Problema: [`docs/descoberta/problema.md`](../docs/descoberta/problema.md)
- Não aplica: [`nao-aplica.md`](../nao-aplica.md)
