---
modulo: parser
owner: roldao
revisado-em: 2026-05-27
status: stable
origem: problema.md
proximo: plan.md
idioma: pt-BR
limite-linhas: 150
proposito: exemplo preenchido do meta-template para referência e comparação
---

# Spec — parser

## US-PARSER-001: Parser de extrato OFX 1.0.2 (SGML)
> US (História do Usuário) — descrição curta do valor entregue na ótica de quem usa.

**Como** dev solo brasileiro construindo ferramenta financeira, **quero** chamar `parseOfx(string | Uint8Array)` e receber uma lista de transações normalizada (datas em ISO 8601, valores em centavos `number` inteiros, sem ambiguidade de fuso), **para** parar de manter parser custom e parar de pagar API SaaS por uma feature acessória.

- **AC-PARSER-001-1**: GIVEN um arquivo OFX 1.0.2 válido contendo header SGML padrão, bloco `<OFX>` com `<BANKMSGSRSV1>` e ≥1 `<STMTTRN>`, WHEN chamar `parseOfx(input)`, THEN retorna `Transacao[]` com 1 entrada por `STMTTRN`, cada uma contendo `{ id: string, data: string ISO-8601 UTC, valor: number em centavos, descricao: string, tipo: 'credito' | 'debito' }`.
- **AC-PARSER-001-2**: GIVEN um arquivo com header SGML faltando ou bloco `<OFX>` ausente, WHEN chamar `parseOfx(input)`, THEN lança `InvalidOfxError` com mensagem em inglês citando qual seção faltou (ex: `"Missing required <OFX> root element"`); NÃO loga o input.
- **AC-PARSER-001-3**: GIVEN data no formato `<DTPOSTED>20260315120000[-3:BRT]` (fuso explícito) E data no formato `<DTPOSTED>20260315` (só dia, sem fuso), WHEN chamar `parseOfx(input)`, THEN: data com fuso → convertida pra ISO UTC; data só dia → ISO `YYYY-MM-DDT00:00:00Z` com flag `dateInferred: true` no objeto retornado (consumidor decide o que fazer).
- **AC-PARSER-001-4**: GIVEN valor `<TRNAMT>-1.234,56` (vírgula decimal, separador de milhar) E `<TRNAMT>-1234.56` (ponto decimal), WHEN chamar `parseOfx(input, { decimalSeparator: 'auto' | 'comma' | 'dot' })`, THEN: `'auto'` detecta heuristicamente; `'comma'` força vírgula; `'dot'` força ponto. Default é `'auto'`. Valor armazenado sempre em **centavos como number inteiro** (`-123456`).
- **AC-PARSER-001-5**: GIVEN dois inputs idênticos (mesma string), WHEN chamar `parseOfx` em runtimes diferentes (Node 20 e Bun 1.1), THEN output é byte-idêntico em `JSON.stringify(resultado)` (determinismo cross-runtime — operacionaliza INV-PARSER-001).
- **AC-PARSER-001-6**: GIVEN input com `<STMTTRN>` duplicado (mesmo `<FITID>`), WHEN chamar `parseOfx(input)`, THEN retorna ambos (a lib não deduplica; deduplicação é responsabilidade do consumidor que conhece sua regra de negócio).

**Invariantes citadas:** INV-PARSER-001 (função pura), INV-SEMVER-001 (assinatura estável), INV-SNAPSHOT-001 (snapshots de teste sintéticos).
**Dependências:** ADR-0001 (stack TS+tsup), ADR-0002 (distribuição npm com `exports`).
**Non-goals (esta US NÃO faz):**
- Parsing de OFX 2.x (XML-based) — fica para US-PARSER-002.
- Parsing de CNAB240 — US-PARSER-003.
- Parsing de CSV genérico de banco — US-PARSER-004.
- Validação de assinatura digital OFX (campo `<SIGNONMSGSRSV1>`) — responsabilidade do consumidor.
- Leitura do arquivo do disco — função `parseOfx` recebe string ou Uint8Array; quem chama lê o arquivo.

## Riscos de produto

- **Risco de produto 1:** consumidor confia no `dateInferred: false` mas o banco emitiu data sem fuso (ambiguidade entre meia-noite UTC vs meia-noite local de Brasília → 3h de diferença → transação cai no dia "errado" do extrato). **Mitigação:** documentar no README com exemplo explícito; flag `dateInferred` por transação para consumidor detectar e decidir (default conservador = inferir UTC + marcar flag).
- **Risco de produto 2:** detecção "auto" do separador decimal falha em arquivo com poucas transações (insuficiente pra heurística). **Mitigação:** quando heurística é inconclusiva, lança `AmbiguousDecimalSeparatorError` em vez de "chutar" — consumidor passa flag explícita. Documentado em mensagem de erro.
- **Risco de produto 3:** OFX 1.0.2 ainda é usado por bancos brasileiros, mas alguns já migraram para 2.x. Consumidor pode esperar suporte transparente. **Mitigação:** README deixa claro que esta versão suporta **apenas 1.x**; lib detecta header `OFXHEADER:200` (versão 2.x) e lança `UnsupportedOfxVersionError` com link para US-PARSER-002 quando ela ficar pronta.

> Riscos técnicos (regex catastrófico, performance em arquivo grande, encoding) vão em `plan.md` → "Riscos de implementação".

---
> Termos técnicos do fluxo OSS: ver `CONTRIBUTING.md §0`.
