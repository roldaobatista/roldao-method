---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 180
proposito: politica zero-runtime-deps + criterio de aceitacao de dev-deps + SBOM + scanning
---

# Politica de Dependencias — @conciliab/csv-parser

> **Dependencia** = qualquer pacote de terceiros importado pelo projeto. Cada dep e codigo executando dentro do nosso processo (em dev) ou do consumidor (em runtime). Trata-se como codigo nosso para fins de seguranca.

## 1. Politica zero-runtime-deps (regra fundadora)

O campo `dependencies` em `package.json` **deve permanecer vazio** (`{}`). Toda biblioteca vai em `devDependencies`.

Motivacao (consolida `SECURITY.md §"Gestao de dependencias"`):

- Cada runtime-dep e arvore transitiva que o consumidor instala — multiplica superficie de ataque dele.
- Lib que ja tem zero deps de runtime e diferencial competitivo no ecossistema npm (consumidor confia mais).
- Parser de extrato bancario nao precisa de helper de terceiros — stdlib do TS + algoritmos proprios bastam (INV-PARSER-001 reforca essa fronteira).
- Vetor "supply chain comprometido" em runtime e neutralizado: se algum dev-dep nosso for sequestrado, o consumidor **nao** instala junto com `@conciliab/csv-parser`.

**Romper esta politica exige ADR dedicada + aprovacao do owner.** ADR deve provar: (a) impossivel implementar com stdlib em < 200 linhas, (b) dep escolhida tem >= 6 meses de manutencao ativa, MFA do mantenedor, licenca no allowlist, e (c) sera pinada com `=` exato + auditada a cada release.

Verificacao automatica: `.husky/pre-commit` roda `node scripts/check-zero-deps.js` que falha se `package.json → dependencies` deixar de ser `{}`.

## 2. Criterio de aceitacao para nova dev-dep

Toda dev-dep nova passa por estes filtros **antes** do PR ser aprovado:

| Criterio | Limite minimo | Como verificar |
|---|---|---|
| Idade da ultima publicacao | <= **24 meses** (max-age) | `npm view <pkg> time.modified` |
| Downloads recentes | >= 5.000/semana | pagina do pacote no npm |
| Manutencao ativa | commit nos ultimos 6 meses | repo upstream |
| Numero de mantenedores | >= 2 quando possivel (bus factor) | `npm view <pkg> maintainers` |
| Mantenedor tem 2FA na conta npm? | sim (selo no npm) | npm exibe |
| Licenca | dentro do allowlist (§3) | arquivo LICENSE no pacote |
| Deprecation flag | nao deprecada | `npm view <pkg> deprecated` (deve ser undefined) |
| Tem dep transitiva exotica? | revisar arvore | `pnpm ls <pkg> --depth Infinity` |
| Existe alternativa na stdlib? | se sim, preferir stdlib | analise do revisor (owner) |

Reprovacao em **qualquer** criterio exige justificativa documentada no PR.

## 3. Licencas

### 3.1 Allowlist (uso livre em dev-deps)

- MIT
- BSD-2-Clause, BSD-3-Clause
- Apache-2.0
- ISC

### 3.2 Denylist (proibidas, mesmo em dev-deps)

- GPL-2.0, GPL-3.0, AGPL-3.0 (copyleft forte — risco mesmo em dev-tooling pra projeto MIT)
- SSPL, BSL sem clausula clara
- "Commons Clause" anexada a permissiva
- Licenca proprietaria sem contrato assinado
- Pacote **sem** arquivo de licenca

Excecoes (ex: ferramenta com MPL-2.0) exigem ADR + justificativa de que o codigo nao mistura com o bundle publicado.

Verificacao: `pnpm licenses list` no CI, comparado contra allowlist em `scripts/check-licenses.js`. Build quebra se aparecer licenca fora do allowlist.

## 4. Pinning e lockfile

- **`pnpm-lock.yaml` commitado obrigatorio** (`.gitignore` nao lista).
- Versoes em `devDependencies`: faixa `^x.y.z` aceita (dev-tooling muda rapido, deixar flexivel).
- CI usa `pnpm install --frozen-lockfile` — quebra se houver drift entre `package.json` e `pnpm-lock.yaml`.
- Hook `lockfile-tampering` no pre-commit alerta se `pnpm-lock.yaml` mudar **sem** mudanca correspondente em `package.json` (sinal de tampering ou rebase mal feito).

## 5. Idade maxima e atualizacao

| Metrica | Limite | Acao |
|---|---|---|
| Dev-dep sem publicar versao nova ha **24 meses** | atingiu | issue de "max-age vencido" — substituir ou justificar com ADR |
| Atras em mais de 1 major em ferramenta-chave (tsup, vitest, eslint, ts) | atingiu | issue de modernizacao com prazo de 90 dias |
| CVE conhecido sem fix disponivel | imediato | mitigar (config, isolar, remover) em 7 dias |
| CVE com fix disponivel CRITICO | imediato | atualizar em 24h |
| CVE com fix disponivel ALTO | imediato | atualizar em 7 dias |

**Rotacao de lockfile**: regenerada a cada release minor/major do projeto (`pnpm install --no-frozen-lockfile && pnpm install --frozen-lockfile` para garantir reprodutibilidade).

## 6. SBOM

> **SBOM** = lista assinada de tudo que entra no artefato publicado, com versoes e hashes.

- Geracao obrigatoria em **cada release** publicado no npm.
- Ferramenta: `pnpm cyclonedx` (plugin oficial CycloneDX para pnpm).
- Saida: `dist/sbom.cdx.json` (formato CycloneDX JSON).
- Anexado como asset no GitHub Release pela Action `.github/workflows/release.yml`.
- Como esta lib tem **zero runtime-deps**, o SBOM publicado lista basicamente apenas o proprio pacote + dev-tooling de build (tsup) cujos artefatos vao pro bundle. Mantemos o SBOM mesmo assim por transparencia ao consumidor.

Verificacao adicional: `pnpm licenses list --json` na release gera relatorio de licenca consolidado.

## 7. Scanning de vulnerabilidades

| Camada | Ferramenta | Cadencia |
|---|---|---|
| Atualizacoes automaticas de seguranca | Dependabot (`.github/dependabot.yml`) | semanal para `npm`, diaria para `github-actions` |
| Audit no CI | `pnpm audit --prod --audit-level=moderate` em cada PR | por PR |
| Audit pre-publish | `pnpm audit --audit-level=low` no `.github/workflows/release.yml` | por release |
| Secrets scanning | `gitleaks` (no pre-commit e no CI) | por commit |
| Skill `security-review` (Claude Code) | review manual do diff | antes de release minor/major |

Build quebra em CVE CRITICO. Build avisa (nao quebra) em CVE ALTO sem fix ainda disponivel — issue auto-aberta.

## 8. Processo para adicionar nova dev-dep

1. **Justificar no PR**: corpo do PR descreve (a) problema que resolve, (b) alternativas avaliadas (incluir stdlib), (c) checklist dos criterios da §2 marcados com link/screenshot.
2. **Confirmar zero impacto no bundle publicado**: rodar `pnpm pack && tar -tzf conciliab-csv-parser-*.tgz` e verificar que a dev-dep nao aparece no tarball.
3. **Aprovacao do owner**: Roldao revisa (projeto solo — `MAINTAINERS.md`).
4. **Auditar arvore transitiva**: `pnpm ls <pkg> --depth Infinity` no PR; arvore com > 50 transitivas e sinal de alerta.
5. **Hook `pre-commit` valida**: o check-zero-deps confirma que `dependencies` nao foi tocado.

Trocar versao **major** de dev-dep critica (ts, tsup, vitest, eslint) segue o mesmo rito + GATE-RELEASE-1 (matriz multi-runtime tem que passar).

## 9. Typosquatting e supply chain

- **Conferir nome do pacote** antes do `pnpm add`: sufixos comuns de ataque (`-utils`, `-helpers`, `-core`, `-js`) adicionados a nomes populares.
- **Confirmar publisher** no npm: deve corresponder ao mantenedor esperado do repo upstream.
- **`pnpm install --frozen-lockfile` em CI**: garante que o que roda em CI e o que esta no lockfile, sem resolucao nova.
- **`npm publish --provenance`** na nossa propria Action de release: garante ao consumidor que o pacote veio do nosso GitHub Actions, nao da maquina local de alguem.
- **Sem mirror interno**: lib pequena, dependencia direta do registry publico do npm. Aceito.

## 10. Remocao de dev-dep

Quando dev-dep e removida:

1. `pnpm remove <pkg>`.
2. `pnpm install --frozen-lockfile` (regenera lockfile).
3. `grep -r "<pkg>"` no repo pra confirmar zero uso remanescente.
4. SBOM atualizado no proximo release.

## 11. Vinculacao com

- `SECURITY.md` (`§Gestao de dependencias` + `§MFA dos mantenedores`).
- `docs/seguranca/threat-model.md` (vetor supply-chain).
- `REGRAS-INEGOCIAVEIS.md` (INV-PARSER-001 — pureza reforca zero-deps).
- `MAINTAINERS.md` (quem aprova dev-dep nova).
- ADRs em `docs/adr/` que registrem excecoes (ex: futura ADR-XXXX se houver runtime-dep).
- Pipelines em `.github/workflows/ci.yml`, `security.yml`, `release.yml`.
