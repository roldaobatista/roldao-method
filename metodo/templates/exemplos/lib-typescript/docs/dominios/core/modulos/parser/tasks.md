---
modulo: parser
owner: roldao
revisado-em: 2026-05-27
status: stable
origem: plan.md
proximo: CHECKLIST-PRONTO-PRA-CODAR.md
idioma: pt-BR
limite-linhas: 200
proposito: exemplo preenchido do meta-template para referência e comparação
---

# Tasks — parser (US-PARSER-001)

> **Estimativa**: P (até 2h) / M (~4h) / G (≥8h).
> **plan-passo**: referência à seção do `plan.md` que esta task implementa.
> **ac-cobertos**: ACs do `spec.md` que esta task ajuda a satisfazer.
> **Exceção scaffold**: tasks puramente de infra/scaffold (criar pasta, instalar dep, gerar boilerplate) podem ter `ac-cobertos: —` porque não implementam regra de negócio.

| ID | Descrição | plan-passo | ac-cobertos | Estimativa | Depende |
|---|---|---|---|---|---|
| T-PARSER-001 | Scaffold de projeto: `pnpm init`, `tsconfig.json` strict, `tsup.config.ts` dual ESM/CJS, `eslint.config.js` flat, `prettier`, `vitest.config.ts`. Verificar build vazio em < 5s. | Estratégia §1 + ADR-0001 | — | M | — |
| T-PARSER-002 | Setup CI: `.github/workflows/ci.yml` com matriz Node 20/22 × Ubuntu/macOS/Windows + Deno + Bun (Ubuntu). Setup `release.yml` com changesets. | Estratégia + ADR-0002 + ADR-0004 | — | M | T-PARSER-001 |
| T-PARSER-003 | Setup hooks pre-commit em `.husky/`: gitleaks, anti-mascaramento, large-file-blocker, purity-check (proíbe `import` de FS/rede em `src/parsers/`). | Hooks §plan | — | M | T-PARSER-001 |
| T-PARSER-004 | Criar `tests/fixtures/builders.ts::buildOfxSynthetic(opts)` gerando OFX 1.0.2 sintético parametrizável (N transações, com/sem fuso, decimal vírgula/ponto). Testar que builder produz arquivo "válido" segundo a spec OFX. | Estratégia + INV-SNAPSHOT-001 | — | M | T-PARSER-001 |
| T-PARSER-005 | Implementar `src/parsers/ofx/tokenize.ts`: tokenizador SGML que reconhece header, open-tag, close-tag implícito, value. Função pura. Cobertura ≥ 95%. | Estratégia §1 (tokenizador) | AC-PARSER-001-1, AC-PARSER-001-2 | G | T-PARSER-004 |
| T-PARSER-006 | Implementar `src/parsers/ofx/build.ts`: builder consome tokens, monta árvore `Ofx`, reduz para `Transacao[]`. Inclui detecção de OFX 2.x → `UnsupportedOfxVersionError`. | Estratégia §1 (builder) | AC-PARSER-001-1, AC-PARSER-001-2 | G | T-PARSER-005 |
| T-PARSER-007 | Implementar normalização de data em `src/parsers/ofx/date.ts`: parsing de `<DTPOSTED>` com e sem fuso, output ISO 8601 UTC + flag `dateInferred`. | Endpoints/views | AC-PARSER-001-3 | M | T-PARSER-006 |
| T-PARSER-008 | Implementar detecção de separador decimal em `src/parsers/ofx/decimal.ts`: heurística `'auto'` baseada em distribuição de pontos/vírgulas no input; modos forçados `'comma'` e `'dot'`; lança `AmbiguousDecimalSeparatorError` quando heurística inconclusiva. Output em centavos inteiros. | Endpoints/views | AC-PARSER-001-4 | M | T-PARSER-006 |
| T-PARSER-009 | Exportar API pública em `src/index.ts`: `parseOfx`, tipos `Transacao` e `ParseOfxOptions`, classes de erro. Gerar baseline inicial da API com `api-extractor`. | Endpoints/views + ADR-0003 | AC-PARSER-001-1 a AC-PARSER-001-6 | P | T-PARSER-007, T-PARSER-008 |
| T-PARSER-010 | Escrever testes unitários `tests/parsers/ofx/parse.spec.ts` com snapshots — mapeados 1:1 com AC-PARSER-001-1, 2, 3, 4, 6. Todos os snapshots gerados via `builders.ts`. | Testes 1:1 com ACs | AC-PARSER-001-1, 2, 3, 4, 6 | M | T-PARSER-009 |
| T-PARSER-011 | Escrever teste de determinismo `tests/parsers/ofx/determinism.spec.ts::AC-PARSER-001-5`: parsear 1000 entradas, 10 vezes seguidas, comparar `JSON.stringify`. Roda em matriz multi-runtime no CI. | Testes 1:1 com ACs + INV-PARSER-001 | AC-PARSER-001-5 | P | T-PARSER-009 |
| T-PARSER-012 | Escrever teste de propriedade com `fast-check` em `tests/parsers/ofx/fuzz.spec.ts`: input aleatório longo (até 1 MB) verifica tempo de parsing < 100ms (defesa anti-DoS). | Riscos §1 + SECURITY.md | AC-PARSER-001-2 (não trava) | M | T-PARSER-010 |
| T-PARSER-013 | Documentar API em `README.md` + comentários TSDoc em `src/index.ts` (gera autocomplete no VSCode). Incluir tabela de "Bancos testados" baseada nas fixtures sintéticas. | Endpoints/views | — | M | T-PARSER-010, T-PARSER-011 |
| T-PARSER-014 | Gerar primeiro changeset `pnpm changeset` com bump `minor` (sair de 0.3.x → 0.4.0): "Add OFX 1.0.2 parser with timezone-aware date and decimal separator heuristic". | Política de release + ADR-0003 | — | P | T-PARSER-013 |
| T-PARSER-015 | Smoke test pós-release: instalar `@conciliab/csv-parser@0.4.0` em projeto vazio com Node, Deno e Bun; chamar `parseOfx(snapshotMinimo)`; verificar 3 transações retornadas em cada runtime. | Validação ADR-0004 | AC-PARSER-001-5 | M | T-PARSER-014 |

<!-- 1-2 commits por task. Cada commit cita o T-PARSER-NNN na mensagem. -->
<!-- Toda task com lógica de produto (T-PARSER-005 até T-PARSER-012) tem AC referenciado. -->
<!-- Tasks 001-004, 013-015 são scaffold/docs/release — ac-cobertos: — é aceitável. -->

## Sequência de execução sugerida

1. **Setup** (T-PARSER-001, 002, 003) — paralelo possível.
2. **Fixtures** (T-PARSER-004) — bloqueia tudo, escrever primeiro.
3. **Tokenizador** (T-PARSER-005) — fundação.
4. **Builder + lógica** (T-PARSER-006, 007, 008) — sequencial sobre tokenizador.
5. **API + testes** (T-PARSER-009, 010, 011, 012) — fechar contrato.
6. **Release** (T-PARSER-013, 014, 015) — publicar e validar.

## Critério de "fim da US"

US-PARSER-001 é considerada **entregue** quando:
- [ ] Todos os 6 ACs têm teste verde mapeado em `plan.md`.
- [ ] Matriz CI verde nos 3 runtimes.
- [ ] Coverage de `src/parsers/ofx/` ≥ 90%.
- [ ] `pnpm run api-check` mostra baseline gravada.
- [ ] Versão 0.4.0 publicada no npm com sucesso.
- [ ] Smoke test (T-PARSER-015) passa nos 3 runtimes.
- [ ] README atualizado mencionando suporte a OFX 1.0.2.

---
> Termos técnicos do fluxo OSS: ver `CONTRIBUTING.md §0`.
