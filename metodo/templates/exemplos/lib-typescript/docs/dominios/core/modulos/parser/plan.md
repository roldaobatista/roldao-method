---
modulo: parser
owner: roldao
revisado-em: 2026-05-27
status: stable
origem: spec.md
proximo: tasks.md
idioma: pt-BR
limite-linhas: 150
proposito: exemplo preenchido do meta-template para referência e comparação
---

# Plano — parser (US-PARSER-001: Parser OFX 1.0.2)

## Estratégia

OFX 1.0.2 é SGML — sintaticamente parecido com XML mas com tags fechadas implicitamente (`<TAG>valor` sem `</TAG>`). Tentar parsear com parser XML genérico falha. Estratégia em duas camadas:

1. **Tokenizador** (`src/parsers/ofx/tokenize.ts`) — converte input cru em fluxo de tokens (header, open-tag, close-tag implícito, value, etc.). Função pura, determinística.
2. **Builder** (`src/parsers/ofx/build.ts`) — consome tokens e monta a árvore `Ofx` tipada, depois reduz para `Transacao[]`. Função pura.

Alternativas descartadas:
- **Regex monolítico** — frágil, impossível de manter, vulnerável a catastrophic backtracking (viola defesa contra DoS textual descrita em SECURITY.md).
- **Parser XML após "normalizar" SGML para XML** — tentativa anterior em código pessoal do autor causou perda silenciosa de tags em arquivos do Banco do Brasil. Risco de bug financeiro silencioso.
- **Lib externa de parsing SGML** — único candidato (`node-expat`) tem deps nativas (binding C), viola "zero dependências de runtime" do `package.json`.

Tokenização manual é mais código mas dá controle total e mantém `dependencies: {}` no `package.json` (ADR-0002).

## Modelos/migrations

N/A — lib pura, sem persistência.

## Endpoints/views

API pública exportada de `src/index.ts`:

- `parseOfx(input: string | Uint8Array, options?: ParseOfxOptions): Transacao[]` — função principal.
- `type Transacao = { id: string; data: string; valor: number; descricao: string; tipo: 'credito' | 'debito'; dateInferred: boolean }` — saída normalizada.
- `type ParseOfxOptions = { decimalSeparator?: 'auto' | 'comma' | 'dot' }` — opções.
- `class InvalidOfxError extends Error` — bloco OFX malformado/ausente.
- `class UnsupportedOfxVersionError extends Error` — detectou OFX 2.x.
- `class AmbiguousDecimalSeparatorError extends Error` — heurística inconclusiva.

## Hooks que vão validar

- `purity-check.sh` — proíbe `import` de `node:fs`, `node:net`, `node:http`, `node:os`, `Date.now()`, `Math.random()` em `src/parsers/`.
- `api-extractor.sh` — baseline da API pública vs PR; falha se houver breaking sem changeset major.
- `snapshot-pii-scanner.sh` — varre `tests/fixtures/*.ofx` por padrões de CPF/agência real.
- `anti-mascaramento.sh` — pega `it.skip` sem issue, `expect(true).toBe(true)`.
- `secrets-scanner.sh` (gitleaks) — pega token vazado.

## Testes 1:1 com ACs

- `tests/parsers/ofx/parse.spec.ts::AC-PARSER-001-1` — happy path: arquivo OFX 1.0.2 com 3 transações → array com 3 entradas, tipos corretos.
- `tests/parsers/ofx/parse.spec.ts::AC-PARSER-001-2` — header faltando → lança `InvalidOfxError`, mensagem cita "Missing required <OFX> root element", input não é logado (verificado por spy no `console`).
- `tests/parsers/ofx/parse.spec.ts::AC-PARSER-001-3` — duas variações de `<DTPOSTED>`: uma com fuso (`20260315120000[-3:BRT]`) → ISO UTC `2026-03-15T15:00:00Z`, `dateInferred: false`. Outra sem fuso (`20260315`) → `2026-03-15T00:00:00Z`, `dateInferred: true`.
- `tests/parsers/ofx/parse.spec.ts::AC-PARSER-001-4` — três sub-casos: `decimalSeparator: 'auto'` com input claro → escolhe certo; `'comma'` força vírgula em input ambíguo; `'dot'` força ponto. Cada caso verifica valor em centavos inteiros (`-123456`).
- `tests/parsers/ofx/determinism.spec.ts::AC-PARSER-001-5` — gera 1000 entradas sintéticas via `builders.ts`, parseia 10 vezes seguidas, verifica `JSON.stringify` idêntico. Roda em matriz Node/Deno/Bun no CI.
- `tests/parsers/ofx/parse.spec.ts::AC-PARSER-001-6` — input com 2x `<STMTTRN>` com mesmo `<FITID>` → retorna 2 entradas, ambas com mesmo `id` (não deduplica).

Snapshots em `tests/__snapshots__/ofx/` — todos gerados via `tests/fixtures/builders.ts::buildOfxSynthetic({ transactions: N, withTz: bool, decimalStyle: 'comma' | 'dot' })`.

## Riscos de implementação

- **Risco técnico 1:** regex no tokenizador pode ter catastrophic backtracking em input adversarial (zip bomb textual — sequência longa repetida). **Mitigação:** todas as regex no tokenizador são lineares (sem `*` aninhado, sem alternativas ambíguas); teste de propriedade com `fast-check` (devDependency) gera inputs longos e mede tempo (limite: < 100ms para 1 MB de input). Documentado em SECURITY.md modelo de ameaças.
- **Risco técnico 2:** encoding `windows-1252` em alguns OFX de banco brasileiro (Caixa, BB) — string UTF-8 quebra acentos. **Mitigação:** quando input é `Uint8Array`, lib detecta BOM e tenta UTF-8 primeiro; se falhar (caractere inválido), tenta `windows-1252`; se o input vier como `string` JavaScript, assume que o consumidor já decodificou — não tentar adivinhar. Documentado no README e em mensagem de erro.
- **Risco técnico 3:** matriz multi-runtime (Node/Deno/Bun) pode ter divergência em `String.prototype` ou regex Unicode. **Mitigação:** CI roda matriz completa em cada PR; AC-PARSER-001-5 testa determinismo cross-runtime explicitamente.
- **Risco técnico 4:** performance em arquivo grande (10 MB+ de OFX) — tokenizador alocando arrays grandes pode dobrar memória. **Mitigação:** F-2 (futura US) implementa parser streaming; F-1 (esta US) documenta limite recomendado de 5 MB no README e deixa `parseOfxStreaming` na roadmap.

## Subagentes convocados pra review

- [x] tech-lead — skill `code-review` antes de cada merge.
- [ ] especialista-juridico — N/A (lib não trata PII).
- [ ] ux-designer — N/A (sem UI).
- [ ] devops-sre — N/A (sem deploy).
- [x] qa-engineer — convocar via skill `code-review` com foco em coverage e determinismo (AC-PARSER-001-5 é crítico).
- [x] security-engineer — skill `security-review` antes de qualquer release minor/major (modelo de ameaças de input adversarial).

---
> Termos técnicos do fluxo OSS: ver `CONTRIBUTING.md §0`.
