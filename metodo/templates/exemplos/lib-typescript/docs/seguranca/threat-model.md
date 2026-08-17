---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: modelagem STRIDE focada em lib pura npm — input malformado, prototype pollution, supply-chain, typo-squatting
---

# Threat Model — @conciliab/csv-parser

> **Modelo de ameacas** = mapa do que pode dar errado de proposito. Mapeamos componentes, perfis de atacante e ameacas STRIDE com mitigacao concreta. **TTL de revisao: 12 meses** (ou ao adicionar componente novo, mudar trust boundary, ou apos incidente).

Este modelo expande o resumo de `SECURITY.md §"Modelo de ameacas desta lib"` com detalhamento por componente e tabela STRIDE.

## 1. Escopo

Componentes incluidos:

| Componente | Tipo | Trust zone |
|---|---|---|
| **Parser** (`src/parsers/*.ts`) | funcao pura em runtime do consumidor | nao-confiavel (input vem do mundo externo) |
| **API publica do modulo** (`src/index.ts`) | superficie exportada (assinaturas, tipos) | contrato estavel — qualquer mudanca e visivel ao consumidor |
| **Build pipeline npm** (`.github/workflows/release.yml` + tsup) | infra de empacotamento e publicacao | privada-restrita |
| **Supply chain de dev-deps** (`devDependencies` em `package.json`) | terceiros que executam em build/test | privada-restrita (mas instalada na maquina do mantenedor) |
| **Identidade do pacote no npm** (`@conciliab/csv-parser`) | metadado publico no registry | publico |

Fora do escopo:
- Codigo do **consumidor** (responsabilidade dele).
- Runtime do consumidor (Node/Deno/Bun) — assumimos correto.
- Infra do GitHub e do npm registry abaixo da camada de API.

## 2. Data flow (DFD textual)

```
[Arquivo OFX/CSV/CNAB do consumidor]
      |  (1) string | Uint8Array — funcao pura, in-memory
      v
[parse() de src/index.ts] --(2) chamada interna pura--> [parsers/ofx.ts | csv.ts | cnab.ts]
      |
      v
[Transacao[] — estrutura JS comum, devolvida ao consumidor]

[GitHub PR] --(3) CI --> [build tsup] --(4) Action release.yml --> [npm registry @conciliab/csv-parser]
                                                                          |
                                                                          v
                                                                 [npm install do consumidor]
```

Fluxos (1) e (2) sao **runtime do consumidor**, em processo unico.
Fluxos (3) e (4) sao **supply chain** do projeto.

## 3. Assets criticos

| Asset | Tipo | Criticidade | Onde vive |
|---|---|---|---|
| Codigo dos parsers | propriedade intelectual + corretude | alta | repo GitHub + bundle npm |
| Identidade do pacote `@conciliab/csv-parser` | reputacao | critica | npm registry |
| Token `NPM_TOKEN` | segredo | critica | GitHub Actions Secrets |
| Conta GitHub e npm do owner | acesso | critica | sob MFA do owner |
| `pnpm-lock.yaml` | integridade da arvore de build | alta | repo GitHub |
| SBOM publicado (`dist/sbom.cdx.json`) | transparencia ao consumidor | media | asset de GitHub Release |

## 4. Perfis de atacante

| Perfil | Capacidade | Motivacao | Vetor tipico nesta lib |
|---|---|---|---|
| **Externo casual** | scripts publicos, fuzz publico | curiosidade | mandar input bizarro pro parser via projeto que usa a lib |
| **Externo direcionado a OSS** | tempo, conhece npm | reputacao na pesquisa de seguranca | regex catastrofica, prototype pollution, ReDoS reportavel em GHSA |
| **Atacante supply chain** | controle de dev-dep upstream | financeira, posicionamento (atingir consumidores da lib) | sequestrar conta npm de mantenedor de dev-dep, injetar payload em build |
| **Typosquatter** | criar pacote com nome parecido | financeira (roubar instalacoes) | publicar `@conciliab/csv-paser`, `csv-parser-conciliab`, `ofx-csv-parser` etc. |
| **Insider acidental** | owner com pressa | erro humano | commit de `.env`, push de token, publicar versao errada |
| **Atacante de conta** | phishing direcionado ao owner | sequestrar pacote no npm e publicar versao maliciosa | phish do `NPM_TOKEN`, takeover via reset de e-mail |

## 5. STRIDE por componente

> **STRIDE** = Spoofing, Tampering, Repudiation, Information disclosure, Denial of Service, Elevation of privilege.

### 5.1 Parser (`src/parsers/*.ts`) — input OFX/CSV/CNAB malformado

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Revisao |
|---|---|---|---|---|---|
| Tampering | input forjado com encoding invalido faz parser produzir `Transacao` com valor numerico errado | normalizacao explicita de encoding na entrada (`TextDecoder` com `fatal: true`); valor numerico passa por validacao de regex + range | INV-PARSER-002 (tests AC-PARSER-VAL-*) | baixo | anual |
| Info disclosure | mensagem de erro vaza trecho do input (poderia ser dado bancario) | erros lancam classe `OfxParseError` com mensagem padronizada SEM trecho do input; codigo opaco + posicao | INV-SEC-ERR-01 | baixo | anual |
| **DoS por regex catastrofica (ReDoS)** | regex em `parsers/ofx.ts` com backtracking exponencial — input de < 1 MB consome CPU > 30s | (a) regex linear comprovada via `safe-regex` no pre-commit; (b) timeout opcional na assinatura `parse(input, { timeoutMs })`; (c) fuzz com `fast-check` cobrindo strings adversariais em CI | INV-PARSER-DOS-01 + auditor `auditor-regex` | medio | semestral |
| **DoS por consumo de memoria** | input grande (zip bomb textual, 1 GB de `\n`) explode parser em arvore intermediaria | (a) parser usa stream tokenizer (nao carrega arvore inteira); (b) limite configuravel `maxInputBytes` default 50 MB; (c) limite de profundidade de aninhamento em OFX SGML = 32 | INV-PARSER-DOS-02 | medio | semestral |
| **Prototype pollution** | input OFX com chave `__proto__` ou `constructor.prototype` injetada na estrutura intermediaria do parser | (a) parser nunca usa `Object.assign` em objeto vindo do input sem prototype `null`; (b) estruturas intermediarias criadas com `Object.create(null)`; (c) teste especifico `AC-PARSER-SEC-001` valida que `parse('<OFX>__proto__=poisoned</OFX>')` nao polui `{}.poisoned` | INV-PARSER-SEC-01 | baixo | anual |
| DoS | input com profundidade de aninhamento patologica derruba stack | parser iterativo (nao recursivo) OU limite explicito de profundidade que lanca erro controlado | INV-PARSER-DOS-03 | baixo | anual |

### 5.2 API publica do modulo (`src/index.ts`)

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Revisao |
|---|---|---|---|---|---|
| Tampering | breaking change silenciosa quebra consumidor que confiou em `^x.y.z` | `api-extractor` no CI compara `.d.ts` exportado com baseline + GATE-RELEASE-2 forca changeset com bump correto | INV-SEMVER-001 + ADR-0003 | baixo | anual |
| Info disclosure | tipo interno (ex: `internal/parsers/Token`) vazado na assinatura publica permite consumidor depender de detalhe nao-contratual | regra de lint custom + revisao no `api-check` que so aceita exports definidos em `src/index.ts` | INV-API-PUBLIC-01 | baixo | anual |
| Elevation | consumidor descobre simbolo interno via `require('@conciliab/csv-parser/internal/...')` | `package.json → exports` restringe pontos de entrada — paths internos nao resolvem | INV-API-PUBLIC-02 | baixo | anual |

### 5.3 Build pipeline npm

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Revisao |
|---|---|---|---|---|---|
| Spoofing | atacante abre PR com workflow modificado que extrai `NPM_TOKEN` | `pull_request` workflows nao recebem secrets; `release.yml` so roda em push pra `main` (ja revisado) | INV-CI-SEC-01 | baixo | anual |
| Tampering | commit em `main` sem revisao publica versao alterada | branch protection: `main` exige PR + 1 review (= owner em projeto solo); `release.yml` so roda apos merge | INV-CI-SEC-02 | medio (solo: owner aprova proprio PR) | semestral |
| Repudiation | publicacao no npm sem rastro | `npm publish --provenance` (atestacao SLSA-2 vinculando o pacote ao commit + GitHub Action que o publicou) | INV-CI-SEC-03 | baixo | anual |
| Info disclosure | `dist/` empacotado leva sourcemap apontando pra caminhos da maquina de build | tsup configurado com `sourcemap: false` em prod OU sourcemaps com `sourceRoot` neutro; `.npmignore` exclui `.env*`, `tests/`, `*.test.ts` | INV-CI-SEC-04 | baixo | anual |
| Elevation | dev-dep com script `postinstall` executa codigo no CI/maquina do mantenedor | `pnpm install --ignore-scripts` no CI; auditoria manual de qualquer dev-dep que precise rodar scripts | INV-DEPS-SCRIPTS-01 | medio | semestral |

### 5.4 Supply chain de dev-deps (compromise de pacote upstream)

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Revisao |
|---|---|---|---|---|---|
| Tampering | dev-dep comprometida (account takeover do mantenedor upstream) injeta payload no build | (a) zero runtime-deps elimina propagacao pro consumidor; (b) `pnpm install --frozen-lockfile` no CI evita pegar versao nova nao auditada; (c) Dependabot semanal traz updates revisaveis; (d) `pnpm audit` no CI; (e) `pnpm-lock.yaml` revisado em PR | INV-DEPS-LOCK-01 + auditor `auditor-dependencias` | medio | semestral |
| Info disclosure | dev-dep maliciosa exfiltra `process.env` da maquina do mantenedor | (a) `--ignore-scripts` no CI; (b) `.env` em `.gitignore`; (c) gitleaks em pre-commit; (d) sem variavel sensivel em env local — segredos so no GitHub Actions Secrets | INV-CI-SEC-04 | medio | semestral |
| Spoofing | typosquat de dev-dep (`tsup-cli` quando queriamos `tsup`) | conferencia visual do nome no PR + `npm view <pkg> repository` antes de aceitar nova dep (`dependency-policy.md §9`) | revisao no PR | baixo | anual |

### 5.5 Identidade do pacote no npm (typo-squatting)

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Revisao |
|---|---|---|---|---|---|
| Spoofing | atacante publica `@conciliab/csv-paser` (typo) ou `conciliab-csv-parser` (sem escopo) com versao maliciosa | (a) usar escopo `@conciliab/` (impede uso do escopo por terceiros); (b) registrar nomes proximos `csv-parser-conciliab` e `ofx-parser-conciliab` no npm como **pacotes placeholders** vazios pertencentes a Roldao com README apontando pro pacote real; (c) README e site documentam o nome canonico em destaque | INV-NPM-TYPO-01 | medio (depende de monitoramento) | semestral |
| Info disclosure | consumidor confuso instala typosquat malicioso e mantem-no por meses | docs sempre referenciam `@conciliab/csv-parser` no formato completo com escopo | INV-NPM-TYPO-02 | medio | anual |
| Elevation | atacante consegue publicar versao usando `NPM_TOKEN` roubado | `--provenance` no publish + MFA obrigatoria com OTP por publicacao + rotacao anual do token + alerta de npm quando publish acontece de IP novo | INV-NPM-TOKEN-01 | baixo | anual |

## 6. Trust boundaries

| Fronteira | De → Para | Controles na travessia |
|---|---|---|
| Input externo → parser | nao-confiavel → runtime do consumidor | validacao de encoding, limites de tamanho, regex linear, prototype `null` |
| PR → main | externo → privado | branch protection + review do owner |
| main → npm | privado → publico | Action `release.yml` (com `--provenance`), OTP do owner, gates de CI |
| Dev-dep upstream → maquina do mantenedor | publico → privada-restrita | `--ignore-scripts`, audit, lockfile |

## 7. Attack surface

Pontos de entrada que recebem input externo:

- **Funcoes publicas** (`src/index.ts`): `parseOfx`, `parseCsv`, `parseCnab240` — cada uma valida e limita seu input.
- **Issues e PRs do GitHub**: input textual do publico; nao executa codigo (so revisao humana antes de merge).
- **GitHub Security Advisories privadas**: canal de divulgacao (ver `SECURITY.md`).

Sem endpoints HTTP, sem upload, sem formulario, sem fila — lib pura.

## 8. Anti-padroes a evitar (especifico desta lib)

- Regex com backtracking aninhado (`(a+)+`, `(a|a)+`) — sempre validar com `safe-regex`.
- `JSON.parse` em chunk grande sem limite de tamanho.
- `Object.assign({}, inputDoUsuario)` — vetor de prototype pollution; preferir `{ ...rest }` com destructuring controlado OU `Object.create(null)`.
- Mensagens de erro com trecho do input bancario (poderia ser PII vazada no log do consumidor).
- Dependencia em horário/locale do sistema (timezone) sem flag explicita — vira nao-determinismo (viola INV-PARSER-001).
- `eval`, `Function(...)`, `new Function(...)` — proibidos por lint custom.

## 9. Manutencao deste modelo

- Revisao agendada **anual** (data em `revisado-em`).
- Revisao **adicional obrigatoria** ao: adicionar parser novo (CSV de banco novo, formato novo), mudar API publica de `src/index.ts`, adicionar primeira runtime-dep (se um dia houver), apos incidente classificado MEDIO+.
- Cada ameaca tem owner de aceitacao = Roldao (projeto solo).

## 10. Vinculacao com

- `SECURITY.md` (politica geral, canal de divulgacao, SLA).
- `docs/seguranca/dependency-policy.md` (vetor supply chain detalhado).
- `MAINTAINERS.md` (contato de emergencia, sucessao).
- `docs/operacao/release-process.md` (rollback de versao maliciosa).
- `REGRAS-INEGOCIAVEIS.md` (INV-PARSER-001, INV-SEMVER-001, INV-AGENT-001).
- ADR-0001, ADR-0002, ADR-0003 (decisoes de stack/distribuicao/versionamento).
- Skill `security-review` do Claude Code (review manual antes de release minor/major).
