---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: fluxo executavel de release do pacote @conciliab/csv-parser no npm, com rollback e suporte a versoes anteriores
---

# Processo de Release — @conciliab/csv-parser

> Consolida o fluxo de release que estava espalhado em `CONTRIBUTING.md §2/§5`, `AGENTS.md §6` e `ADR-0003`. Em conflito, este documento vence para passos operacionais; `ADR-0003` vence para regras de SemVer.

## 1. Versionamento

**SemVer 2.0 estrito**, fronteira de API = símbolos exportados de `src/index.ts`. Regras de bump completas em `ADR-0003 §"Regras de bump"`.

Resumo:

| Mudança em `src/index.ts` | Bump |
|---|---|
| Bug fix interno, sem mudar tipo/comportamento | **patch** |
| Novo símbolo exportado OU param opcional novo | **minor** |
| Rename/remove/troca-de-tipo/param obrigatório novo OU mudança de comportamento documentado | **major** |
| Bump de Node mínimo em `engines` | **major** |

Fase `0.x.x`: breaking permitido em `minor` (`0.4.x → 0.5.0`), mas seguindo as mesmas regras.

## 2. Changesets (porta de entrada do release)

Todo PR que altere `src/` exige arquivo em `.changeset/<nome>.md`. Sem changeset, o robô `changesets/action` bloqueia o merge.

- Criar: `pnpm changeset` → wizard interativo → classificar patch/minor/major → descrever em PT-BR.
- Em dúvida, prefira bump **maior** — menos pior errar pra cima do que quebrar a comunidade.
- PR só em `docs/`, `tests/`, CI: `pnpm changeset --empty` ou omitir.

## 3. Version Packages PR (automatico)

Quando há changesets pendentes em `main`, o robô `changesets/action` abre/atualiza automaticamente um PR chamado **"Version Packages"** que:

1. Consome todos os changesets de `.changeset/`.
2. Calcula o bump correto (maior dos pendentes).
3. Atualiza `package.json → version`.
4. Atualiza `CHANGELOG.md` com seções por changeset, agrupadas por tipo.
5. Em bump **major**: cria seção **"Migration guide"** no `CHANGELOG.md` (template do ADR-0003 §"Migration guide obrigatorio").
6. Deleta os arquivos de changeset consumidos.

Owner revisa este PR como qualquer outro:
- Confirma que o bump esta correto (patch/minor/major).
- Confirma que `CHANGELOG.md` esta em PT-BR e descreve impacto pro consumidor.
- Em major, confirma que migration guide tem: o que mudou, por que mudou, diff antes/depois, caminho de migracao.

## 4. Tag git e publish (atomicos)

Mergear o "Version Packages" PR dispara `.github/workflows/release.yml`:

| Etapa | Comando / Acao | Owner |
|---|---|---|
| **1. Build** | `pnpm install --frozen-lockfile && pnpm run build` (tsup gera ESM+CJS+`.d.ts`) | CI |
| **2. Type-check + lint + test + api-check** | quality gates de `CONTRIBUTING.md §3` | CI |
| **3. Matriz multi-runtime** | `pnpm run test:matrix` (Node 20/22, Deno LTS, Bun 1.1+) — GATE-RELEASE-1 | CI |
| **4. SBOM** | `pnpm cyclonedx` → `dist/sbom.cdx.json` (CycloneDX) | CI |
| **5. Tag git anotada** | `git tag -a v<versao> -m "<resumo>"` + `git push --tags` | CI |
| **6. npm publish** | `pnpm changeset publish --provenance` (OTP do owner via npm) — **operacao destrutiva, exige confirmacao humana INV-AGENT-001** | Roldao |
| **7. GitHub Release** | `gh release create` com notas geradas do CHANGELOG + SBOM como asset | CI |
| **8. Anuncio** | comentario automatico nos issues/PRs vinculados ao release | CI |

> `npm publish` direto da maquina local **proibido** (`CONTRIBUTING.md §4`). So pela Action.

## 5. Verificacao pos-release (24h)

- [ ] `npm view @conciliab/csv-parser` exibe a nova versão como `latest`.
- [ ] `npm install @conciliab/csv-parser@<versao>` em projeto vazio: instala, tem `dist/index.js` + `dist/index.cjs` + `dist/index.d.ts`.
- [ ] Smoke test do consumidor: `conciliab-desktop` atualiza a dependência e CI dele passa.
- [ ] Zero issue nova de `installation-error` ou `runtime-error` nas 24h seguintes.
- [ ] CHANGELOG publico atualizado no GitHub.
- [ ] Tag git acessivel (`git ls-remote --tags`).

Se algum item falhar → considerar rollback (§6).

## 6. Rollback de versao publicada

`npm publish` e operacao **irreversivel** (npm proibe `unpublish` apos 72h por padrao, e mesmo dentro desse prazo quebra todos os lockfiles que ja apontam pra versao). Politica:

| Situacao | Acao | Quando |
|---|---|---|
| Versao com bug **nao critico** descoberto < 24h apos publish | publicar **patch** corrigindo (`x.y.z+1`), comunicar via GitHub Release + comentario nos issues | < 72h |
| Versao com bug **CRITICO** ou bug de seguranca | `npm deprecate @conciliab/csv-parser@<versao> "<motivo + link pra fix>"` apontando para versao corrigida, publicar fix imediatamente | < 24h |
| Versao **maliciosa** (pacote sequestrado) | tentar `npm unpublish @conciliab/csv-parser@<versao>` (so dentro de 72h); independente, `npm deprecate` com aviso forte; rotacionar `NPM_TOKEN` e auditar conta; ver `SECURITY.md` §"Rotacao de segredos" | imediato |
| Necessidade de remover artefato (legal, vazamento de segredo no bundle) | abrir ticket de `npm-disputes` no registry — operacao manual, owner conduz | conforme triagem |

> **`npm unpublish` exige confirmacao humana** (operacao que afeta toda a comunidade que ja instalou — INV-AGENT-001).

## 7. Suporte a versoes anteriores

Politica detalhada em `SECURITY.md §"Versoes com suporte ativo"`. Resumo:

| Linha | Recebe patch de bug? | Recebe patch de seguranca? |
|---|---|---|
| `N` (linha major atual) | sim | sim |
| `N-1` (linha major anterior) | nao (so se solicitado por demanda real e via issue) | sim |
| `≤ N-2` | nao (EOL) | nao (EOL) |

Backport de patch de seguranca para `N-1`:
1. Cherry-pick do commit de fix da `main` para branch `release/N-1.x`.
2. Rodar mesmos gates de §4.
3. `pnpm changeset` com bump `patch` na branch de release.
4. Publicar via mesma Action, tag `v<N-1>.<y+1>.<z+1>`.
5. CHANGELOG da `N-1` documenta o backport.

> Antes de `1.0.0` (fase atual, `0.x.x`): nao garantimos suporte a `0.<y-1>.x` apos `0.y.0` sair — comunicado no `README.md` e `SECURITY.md`. Politica de suporte completa entra em vigor quando atingirmos `1.0.0`.

## 8. Responsabilidades

| Papel | Quem | Faz |
|---|---|---|
| Release manager | Roldao | revisa "Version Packages" PR, executa `npm publish` (OTP) |
| Aprovador | Roldao (solo — ver `MAINTAINERS.md`) | go/no-go formal |
| Plantao pos-release | Roldao | acompanha as 24h apos publish |
| Comunicacao | Roldao | GitHub Release notes + comentario em issues vinculados |

## 9. Breaking changes e deprecacao

Mudanca breaking (rename de simbolo exportado, mudanca de default, etc.) exige:

1. **Aviso previo** em release `minor` (em fase 0.x.x) ou em release MAJOR anterior (apos 1.0.0): emitir warning `console.warn('[DEPRECATED]...')` ou exportar simbolo `@deprecated` (TypeScript flag a chamada).
2. **Migration guide** completo no `CHANGELOG.md` da versao que remove (ADR-0003).
3. **Comunicacao publica**: GitHub Release marcado como "Breaking change" + entrada destacada no CHANGELOG.

Quebrar contrato **sem deprecacao previa** exige ADR documentando + aprovacao do owner (= dele mesmo, mas registrado).

## 10. Vinculacao com

- `CONTRIBUTING.md §2 e §5` — fluxo do contribuidor externo e regras de changeset.
- `AGENTS.md §6` — comandos canonicos (`pnpm changeset`, `pnpm changeset publish`).
- `ADR-0003` — definicao de SemVer estrito, fronteira de API, regras de bump.
- `SECURITY.md` — versoes com suporte, rotacao de `NPM_TOKEN`, MFA obrigatoria.
- `MAINTAINERS.md` — quem tem permissao de publish.
- `docs/seguranca/dependency-policy.md` — politica zero-runtime-deps que afeta o que vai pro bundle.
- `docs/seguranca/threat-model.md` — vetor "pacote sequestrado" que motiva `--provenance` + MFA.
- `REGRAS-INEGOCIAVEIS.md` — INV-SEMVER-001, INV-AGENT-001.
