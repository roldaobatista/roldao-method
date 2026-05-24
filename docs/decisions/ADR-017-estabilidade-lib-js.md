---
owner: tech-lead
revisado-em: 2026-05-24
status: stable
---

# ADR-017 — Estabilidade da API de `_lib.js` (contrato pra addons)

## Contexto

[ADR-015](ADR-015-addons-importam-lib-core.md) decidiu que addons importam funções utilitárias do core via `_lib.js` em vez de duplicar código. Resultado: `_lib.js` virou **API pública de facto** consumida por 6 addons oficiais (e potencialmente terceiros).

Sem contrato de estabilidade explícito, qualquer refactor interno do core (renomear função, mudar assinatura, remover export) quebra silenciosamente todos os addons. CI não pega — testes de addon rodam em isolation contra a versão atual do core.

Auditoria 10-agentes (2026-05-24) marcou esta lacuna como débito arquitetural.

## Decisão

`_lib.js` segue SemVer próprio dentro do framework. As funções exportadas listadas abaixo são **superfície pública**; mudar assinatura ou remover = MAJOR do framework (conforme [ADR-016](ADR-016-politica-semver.md)).

### API pública estável de `_lib.js` (v1.x)

| Função | Assinatura | Garantia |
|---|---|---|
| `readStdinJson()` | `() => Promise<object>` | Retorna JSON parsed do stdin do hook. Falha silenciosa retorna `{}`. |
| `sanitizeProjdir(p)` | `(string) => string` | Normaliza path absoluto do projeto, remove trailing slash. |
| `sanitizeSessionHash(h)` | `(string) => string` | Aceita `[a-zA-Z0-9_-]{1,64}`, rejeita resto. |
| `safeRuntimeDir(projdir, session)` | `(string, string) => string` | Path `.runtime/<session>/` validado contra path traversal. |
| `safeTmpfile(prefix?)` | `(string?) => string` | Cria arquivo temp em `os.tmpdir()` com fallback isolado por UID em `/tmp/roldao-<uid>` mode 700. Default `prefix='hook'`. |
| `secretTokenPatterns()` | `() => string[]` | Lista de regex pattern strings reconhecidos como secret. |
| `secretTokenRegexes()` | `() => RegExp[]` | Mesma lista compilada. |
| `posixToJsRegex(posixPattern)` | `(string) => RegExp` | Converte POSIX ERE pra JS RegExp (legacy do port bash). |
| `hookBlockHeader(name, regraId)` | `(string, string) => string` | Cabeçalho padronizado de mensagem de bloqueio. |
| `recordMetric(verdict, hookName, detail)` | `(string, string, string?) => void` | Append em `.runtime/<session>/metrics.jsonl`. Não-bloqueante. |

### Símbolos NÃO públicos

- Qualquer `require()` interno do `_lib.js` (constantes regex, helpers privados sem export explícito).
- Estrutura interna do arquivo `metrics.jsonl`.
- Variáveis de ambiente lidas pelo `_lib.js` (`CLAUDE_PROJECT_DIR`, etc.) — são contrato do harness, não do `_lib.js`.

### Como adicionar função nova ao `_lib.js`

1. Implementar com nome estável (não usar `_temp`, `v2`, etc.).
2. Adicionar à tabela acima neste ADR (em PR separado se for adicionar várias).
3. Documentar com 1 frase no JSDoc dentro do `_lib.js`.
4. Bump MINOR no framework.

### Como remover função pública

1. Marcar `@deprecated` no JSDoc + adicionar warning em stderr (não bloqueia).
2. Manter por **1 versão MAJOR completa** (ex: deprecated em v1.5, removida em v2.0).
3. Documentar substituto na seção "Atenção" do release.
4. Bump MAJOR ao remover.

### Como mudar assinatura

Não. Nunca mude assinatura — adicione função nova com nome diferente, deprecate a antiga.

## Consequências

- Addon de terceiro pode confiar nas 10 funções acima até a próxima MAJOR.
- Refactor interno do framework continua livre (qualquer coisa fora da tabela).
- Adicionar função utilitária nova: MINOR rápido, sem fricção.
- Remover função vira evento documentado, com prazo de 1 MAJOR.

## Testes de contrato

`test/lib-contract.test.js` (entregue na v1.0.0 — adiantado vs plano original v1.1) valida:
1. Cada função da tabela existe e é função.
2. Cada função aceita os tipos documentados sem throw inesperado.
3. Comportamento mínimo (smoke) — não testa equivalência byte-a-byte (isso fica em `hooks-node-only`).

46 verificações rodando em CI no script `npm run test:lib-contract` (parte do `npm test`). Falha aqui = contrato quebrado = candidato a MAJOR (ADR-016).

## Non-goals (INV-003)

- Não vamos congelar `_lib.js` — é evolução normal.
- Não vamos versionar `_lib.js` separado do framework (sem `_lib.js@2.0`).
- Não cobrimos `_lib` interno de addons — esse é privado do addon.

## Aderente a

INV-001, INV-002, ADR-001 (zero deps), ADR-015 (sem duplicação), ADR-016 (SemVer).
