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

# Painel Atual — <nome-da-lib>

## 1. Fase atual
- **Fase**: F-1 — primeira versão pública (`v0.1.0`)
- **Status**: em andamento

## 2. Problema-âncora
- **Problema**: [`docs/descoberta/problema.md`](../docs/descoberta/problema.md)
- **Resumo em 1 linha**: lib OSS TypeScript dual ESM+CJS para <propósito>.

## 3. Última entrega concluída
- **ID**: T-LIB-003 — exportar tipos públicos em `dist/types.d.ts`.
- **Quando**: 2026-05-26
- **Resumo**: build dual ESM+CJS gera `.d.ts` único; testado em consumer ESM e CJS.

## 4. Próximo T-NNN
- **ID**: T-LIB-004
- **Descrição**: documentar API pública em README e gerar TypeDoc.
- **ACs cobertos**: AC-LIB-002-1.

## 5. Bloqueadores conhecidos
- Nenhum bloqueador conhecido.

## 6. Contexto recente
- ADR-0001 (build dual ESM+CJS via tsup) aceita 2026-05-20.
- ADR-0002 (publicação via `npm publish` com OIDC) aceita 2026-05-22.

## 7. Última atualização
- Data: 2026-05-27
- Por: roldao
- Sessão anterior terminou em: tipos exportados; próximo é doc.

## 9. Ver também
- Problema: [`docs/descoberta/problema.md`](../docs/descoberta/problema.md)
- Não aplica: [`nao-aplica.md`](../nao-aplica.md)
