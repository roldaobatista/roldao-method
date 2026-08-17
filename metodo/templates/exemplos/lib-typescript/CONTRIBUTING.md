---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: exemplo preenchido do meta-template para referência e comparação
---

# CONTRIBUTING — @conciliab/csv-parser

> Como humanos e agentes contribuem com este repositório. Fonte canônica de processo. Fonte canônica de produto: [`AGENTS.md`](./AGENTS.md).

> Projeto OSS sob licença MIT. Contribuições externas são bem-vindas — ver §2 (fluxo do humano externo).

## 0. Mini-glossário (primeira ocorrência)

- **lint** — robô que lê o código e aponta vícios de estilo/erros simples (rodamos `eslint`).
- **type-check** — verificação de tipos do TypeScript (impede passar texto onde se espera número). Rodamos `tsc --noEmit`.
- **dry-run** — execução em modo de teste, sem efeito real (não publica no npm).
- **snapshot test** — teste que salva uma "foto" do resultado e compara com a próxima execução. Quebra se o output mudar.
- **changeset** — anotação que descreve a mudança e diz se ela quebra quem já usa (gera CHANGELOG e decide o bump de versão).
- **bump** — subir o número da versão (1.2.3 → 1.2.4 etc).
- **semver (major/minor/patch)** — regra de versão: major quebra quem já usa, minor adiciona sem quebrar, patch só corrige bug.
- **dual ESM+CJS** — a biblioteca funciona nos dois jeitos de importar do JavaScript (o novo e o antigo).
- **`--no-verify`** — flag do git que pula os hooks. PROIBIDO neste projeto.

## 1. Fluxo do agente IA

1. **Ler a spec.** Localizar `docs/dominios/<dom>/modulos/<modulo>/spec.md` e os ACs binários referentes à tarefa.
2. **Propor plano.** Esboçar passos, arquivos a tocar, riscos. Se a tarefa for não-trivial, gravar em `plan.md`.
3. **Implementar.** Editar código + testes na mesma mudança. Mexer no ponto raiz, não no sintoma. Para fix de parser: **ler o input real primeiro** (INV-AGENT-003).
4. **Auditar localmente.** Rodar `pnpm test`, `pnpm run lint`, `pnpm run typecheck`. Se a mudança afeta API exportada, rodar `pnpm run api-check`.
5. **Changeset.** Rodar `pnpm changeset` e descrever a mudança em PT-BR + classificar como `patch | minor | major`. Sem changeset, o PR não passa.
6. **Commit.** Atômico, mensagem em inglês seguindo convencional commits (`fix(parser): correct date parsing for OFX 1.0.2 with timezone offset`). Sem `--no-verify`.
7. **Abrir PR via `gh pr create`.** Título e descrição preenchidos.

## 2. Fluxo do humano externo (contribuidor OSS)

1. **Fork** do repositório `conciliab/csv-parser`.
2. **Criar branch** a partir de `main`: `feat/<descricao-curta>` ou `fix/<descricao-curta>`.
3. **Implementar** seguindo as mesmas regras do §1 (passos 3-6).
4. **Abrir PR** contra `main` no upstream. Preencher o template (problema, solução, breaking change sim/não, changeset incluído).
5. **CI verde obrigatório.** Os robôs precisam estar todos verdes — sem isso o mantenedor não revisa.
6. **Review do mantenedor.** Roldão (ou mantenedor designado) revisa, comenta, aprova ou pede mudança. Para mudanças não-triviais, espera-se 1-2 rounds de review.
7. **Merge.** Estratégia: **squash merge**, mensagem final no formato convencional commits. Histórico de `main` fica linear e legível.
8. **Release.** O bot `changesets` abre automaticamente um PR de "Version Packages" agregando os changesets pendentes. Quando esse PR é aprovado e mergeado pelo mantenedor (operação destrutiva — exige confirmação humana), o GitHub Actions publica a nova versão no npm.

### Regras para contribuição externa

- **DCO/CLA**: não exigimos por enquanto. Ao abrir PR, você concorda em licenciar a contribuição sob MIT (mesma licença do projeto).
- **Issue antes de PR grande**: para qualquer mudança > 100 linhas ou que altere API pública, **abrir issue de discussão primeiro**. PRs grandes sem discussão prévia podem ser fechados sem review.
- **Reportar bug**: descrever o efeito visível, o passo-a-passo para reproduzir, e o **input mínimo sintético** que dispara o bug. NUNCA anexar extrato bancário real (INV-SNAPSHOT-001).
- **Propor mudança de arquitetura**: abrir ADR em `docs/adr/ADR-NNNN-<slug>.md`. Status inicial: `proposta`.

## 3. Quality gates obrigatórios antes de commit

Proporcional ao escopo da mudança:

| Mudança em | Gates obrigatórios |
|---|---|
| Código de parser (`src/parsers/`) | `pnpm run lint` + `pnpm run typecheck` + `pnpm test src/parsers/<arquivo>` + snapshot test |
| API pública (`src/index.ts`) | tudo acima + `pnpm run api-check` (compara assinaturas com baseline) |
| Build config (`tsup.config.ts`, `tsconfig.json`) | `pnpm run build` + `pnpm run test:matrix` (Node + Deno + Bun) |
| Documentação (`*.md`, `docs/`) | frontmatter-validator + link-checker |
| ADR / spec | frontmatter-validator + revisão humana |
| Hook / auditor | golden tests do próprio auditor |

Matriz completa multi-runtime só rodar antes de release, não no meio da task.

## 4. O que NUNCA fazer

- `git commit --no-verify` ou qualquer `--skip-*` / `--ignore-*` que pule hook.
- `git push --force` ou `--force-with-lease` em `main`.
- `git reset --hard` em commit já publicado.
- Mascarar teste: `it.skip` sem issue, `it.todo` permanente, `expect(true).toBe(true)`, snapshot deletado para "consertar" teste falho.
- `eslint-disable` / `@ts-ignore` / `// @ts-expect-error` sem comentário justificando + ID de issue.
- Mexer em snapshot **para "passar"** o teste sem entender por que o output mudou.
- Commitar dado real de cliente, extrato real, token (`NPM_TOKEN`, `GITHUB_TOKEN`), `.env`.
- Publicar `npm publish` direto da máquina local — só pela GitHub Action de release.
- Mudar API pública sem changeset `major`.

## 5. Política de commits e changesets

### Commits

- Atômicos: 1 commit = 1 propósito claro.
- Mensagem em inglês, seguindo Convencional Commits: `<tipo>(<escopo>): <resumo>`.
- Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `build`, `ci`.
- Corpo opcional, mas obrigatório se houver `BREAKING CHANGE`.
- Referência a `T-PARSER-NNN` no corpo quando aplicável.
- Stage seletivo por arquivo. Nunca `git add .` cego.

### Changesets (regra OSS específica)

- Todo PR que altere `src/` exige um arquivo em `.changeset/<nome-aleatorio>.md`.
- Bump correto:
  - **patch** — bug fix interno, sem mudança visível na API.
  - **minor** — novo símbolo exportado OU novo parâmetro **opcional** em função existente.
  - **major** — remoção/rename/troca de tipo de símbolo exportado, novo parâmetro obrigatório, mudança de comportamento documentada que quebra consumidor.
- Em dúvida, prefira o bump **maior** — menos pior errar pra cima do que quebrar a comunidade.
- Mudança puramente em `docs/`, `tests/`, CI: usar `pnpm changeset --empty` ou omitir.

## 6. Como rodar tudo localmente antes de abrir PR

```bash
pnpm install                # instala deps com lockfile estrito
pnpm run lint               # eslint
pnpm run typecheck          # tsc --noEmit
pnpm test                   # vitest run
pnpm run test:coverage      # vitest run --coverage
pnpm run build              # tsup (ESM + CJS + d.ts)
pnpm run api-check          # compara API com baseline
pnpm changeset              # cria changeset descrevendo a mudança
```

Se algum passo falhar, **não abra PR**. Corrija primeiro.

## 7. Quando pedir ajuda humana

- Ambiguidade na spec do parser que afeta o AC binário (ex: formato OFX 1.0.2 vs 2.x).
- Conflito entre dois snapshots após mudança de parser — qual está certo?
- Operação destrutiva: `npm unpublish`, rotação de token em produção, mudança de visibilidade do repo.
- Mudança que aparenta resolver mas mexe em sintoma — preferir confirmar a causa raiz com input real antes (INV-AGENT-003).
- Bump de versão duvidoso (patch vs minor vs major).
