---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 300
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: AGENTS.md — projeto @conciliab/csv-parser
fonte canônica de produto/processo para agentes IA.
-->

# AGENTS.md — @conciliab/csv-parser

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence. CLAUDE.md é o mais específico (canal Claude Code) e o mais fácil de mudar.

**Status:** stable · **Última revisão:** 2026-05-27

## 1. Identidade do produto
- Nome: `@conciliab/csv-parser`
- Escopo: biblioteca TypeScript pura que parseia e normaliza arquivos de extrato bancário brasileiro (OFX 1.x, CNAB240, CSV diversos) em uma estrutura `Transacao` consistente. Função pura, isomórfica, zero I/O — quem chama lê o arquivo e passa o conteúdo.
- Modelo de negócio: OSS (MIT), distribuída no npm sob escopo `@conciliab`. Sem versão paga.
- Cliente piloto: aplicativo `conciliab-desktop` (uso interno do autor) + comunidade pequena de devs brasileiros conciliando extratos bancários.

## 2. Stack
| Camada | Escolha | Notas |
|---|---|---|
| Linguagem | TypeScript 5.4 strict | sem `any` implícito |
| Build | `tsup` 8.x | dual ESM+CJS, declaração `.d.ts` |
| Testes | `vitest` 1.x | rodando em Node, Deno e Bun via matriz CI |
| Lint | `eslint` 9.x flat config + `@typescript-eslint` | |
| Format | `prettier` 3.x | |
| Release | `changesets` | versionamento + changelog automático |
| Package manager local | `pnpm` 9 | lockfile commitado |

Ver [ADR-0001](./docs/adr/ADR-0001-stack-typescript-tsup.md).

## 3. Princípios não-negociáveis

Detalhes completos (regra, motivação, hook, auditor) em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md). Resumo dos IDs vigentes:

- **INV-PARSER-001** — parsing é função pura: mesmo input, mesmo output, sem leitura de arquivo/rede/relógio.
- **INV-SEMVER-001** — qualquer mudança de API pública (assinatura exportada) exige bump de `major`. Quebra silenciosa é proibida.
- **INV-AGENT-001** — agente IA não publica pacote sem confirmação humana (`npm publish` na lista destrutiva).
- **INV-AGENT-002** — proibido `--no-verify`, `--force`, `--force-with-lease` em `main`.
- **INV-AGENT-003** — investigar (input real, snapshot, log) antes de editar lógica de parser.
- **INV-AGENT-004** — pró-atividade: executa reversíveis sem perguntar; confirma só destrutivos.
- **INV-AGENT-005** — validar antes de afirmar "pronto"; evidência obrigatória.
- **INV-AGENT-006** — causa raiz, nunca sintoma; proibido mascarar teste.
- **INV-AGENT-007** — commits atômicos; sem `git add .` cego.
- **INV-AGENT-008** — N/A direto na lib (ver `nao-aplica.md`); regra herdada para snapshots de teste — não commitar extrato real de cliente.
- **INV-AGENT-009** — segredos nunca em arquivo versionado (tokens npm, GitHub).
- **INV-AGENT-010** — linguagem acessível ao dono; traduzir jargão na 1ª ocorrência.
- **INV-AGENT-011** — alteração de qualquer INV exige PR dedicado + aprovação do dono.

## 4. Decisões fundadoras (D-NNN)
| ID | Decisão | Status |
|---|---|---|
| D-001 | Lib é função pura, sem I/O. Quem chama lê o arquivo. | aceita |
| D-002 | Suportar Node 20+, Deno e Bun a partir do mesmo build. | aceita |
| D-003 | SemVer estrito; bump de major exige migration guide em CHANGELOG. | aceita |
| D-004 | Distribuição no npm sob escopo `@conciliab`; sem mirror em outros registries. | aceita |

## 5. Modelo de agentes

Lib pequena, sem auditor próprio ainda. Para reviews, usar:

- `code-review` (skill embutida do Claude Code) para diff antes de merge.
- `security-review` (skill embutida) antes de cada release minor/major.
- `auditor-doc-quality` (ativo em modo bootstrap — `.claude/agents/auditor-doc-quality.md` com pelo menos 1 golden case POSITIVO mínimo; expandir cobertura quando passar de 5 contribuidores externos).

## 6. Comandos canônicos
| Operação | Comando |
|---|---|
| Instalar deps | `pnpm install` |
| Build local | `pnpm run build` (tsup) |
| Build watch | `pnpm run dev` |
| Type-check | `pnpm run typecheck` |
| Lint | `pnpm run lint` |
| Testes | `pnpm test` |
| Coverage | `pnpm run test:coverage` |
| Matriz multi-runtime (CI local) | `pnpm run test:matrix` (Node, Deno, Bun) |
| Snapshot novo | `pnpm vitest -u` (apenas em PR, nunca em main direto) |
| Release (gerar changeset) | `pnpm changeset` |
| Release (publicar — REQUER CONFIRMAÇÃO HUMANA) | `pnpm changeset publish` |

## 7. Política de commits
- Atômicos, mensagem citando `T-PARSER-NNN`.
- `--no-verify` PROIBIDO (ver INV-AGENT-002).
- `git push --force` em `main` PROIBIDO (ver INV-AGENT-002).
- Stage seletivo por arquivo; nada de `git add .` cego (INV-AGENT-007).
- Convencional Commits para alinhar com `changesets`: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.

## 8. Convenções
- Idioma: documentação em **PT-BR**, código/identificadores/comentários técnicos em **inglês**, mensagens de commit em **inglês** (compatibilidade com convencional commits e changesets).
- Snapshots de teste vivem em `tests/__snapshots__/` e são sempre **dados sintéticos** (gerados pelo helper `tests/fixtures/builders.ts`), nunca extrato real.

## 9. Segurança/dados
- Multi-tenant: N/A (lib pura). Ver `nao-aplica.md`.
- Secrets: token `NPM_TOKEN` e `GITHUB_TOKEN` apenas em GitHub Actions Secrets; rotação anual.
- WORM: N/A.
- PII em logs: a lib não loga. Quem chama é responsável. Documentado em `README.md` e `SECURITY.md`.

## 10. ADRs ativas

ADRs vivem em [`docs/adr/`](./docs/adr/). Status válidos: `proposta | aceita | substituida | deprecada`.

| # | Tema | Arquivo | Status | Bloqueia fase | Depende de |
|---|---|---|---|---|---|
| 0000 | Uso de IA | [`ADR-0000-uso-de-ia.md`](./docs/adr/ADR-0000-uso-de-ia.md) | aceita | — | — |
| 0001 | Stack TypeScript + tsup | [`ADR-0001-stack-typescript-tsup.md`](./docs/adr/ADR-0001-stack-typescript-tsup.md) | aceita | F-1 | — |
| 0002 | Distribuição npm (escopo, dual ESM/CJS, files) | [`ADR-0002-distribuicao-npm.md`](./docs/adr/ADR-0002-distribuicao-npm.md) | aceita | F-1 | 0001 |
| 0003 | Versionamento SemVer estrito | [`ADR-0003-versionamento-semver.md`](./docs/adr/ADR-0003-versionamento-semver.md) | aceita | F-2 | 0002 |
| 0004 | Suporte multi-runtime (Node + Deno + Bun) | [`ADR-0004-suporte-runtime-node-deno-bun.md`](./docs/adr/ADR-0004-suporte-runtime-node-deno-bun.md) | aceita | F-2 | 0001 |

## 11. Pendências (GATEs)
- **GATE-RELEASE-1**: matriz de CI (Node 20/22, Deno LTS, Bun 1.1+) passando em verde antes de cada release.
- **GATE-RELEASE-2**: changeset descreve impacto na API; bump correto (patch/minor/major) revisado por humano.
- **GATE-COVERAGE-1**: coverage de linhas ≥ 90% para `src/parsers/` antes de qualquer release minor/major.

## 12. ROPA / LGPD

**N/A para esta lib.** A biblioteca é função pura: recebe bytes/string, devolve estrutura. Não persiste, não loga, não transmite. Quem chama é responsável pelo tratamento LGPD do dado bancário.

Registrado em [`nao-aplica.md`](./nao-aplica.md) com evidência (assinatura das funções públicas, ausência de imports de I/O em `src/`).

PII em logs (INV-AGENT-008) continua valendo para **snapshots de teste** — proibido commitar extrato real, mesmo "anonimizado".

## 13. Pró-atividade e autorização

O agente IA opera com pró-atividade ampla. Ver INV-AGENT-004.

**Ações que o agente FAZ sem perguntar** (reversíveis, sem custo financeiro, sem perda de dado):

- Editar/criar/atualizar arquivos, configs, docs, memórias.
- Rodar testes, lint, build, type-check, snapshot tests.
- Criar branch, fazer commit atômico, abrir PR via `gh pr create`.
- Criar issue, comentar em PR via `gh`.
- `git push origin <branch>` em fast-forward (não force).
- Aplicar correções identificadas em code-review.
- Atualizar README, badges, topics do repo.
- Gerar changeset descrevendo a mudança (`pnpm changeset`).
- Continuar o próximo passo lógico de qualquer sequência iniciada.

**Ações que EXIGEM confirmação humana explícita**:

- `pnpm changeset publish` / `npm publish` — publicação irreversível.
- `git push --force` / `--force-with-lease`.
- `git reset --hard` em commit já publicado.
- `git branch -D` em branch compartilhada.
- Rotação de token `NPM_TOKEN` ou `GITHUB_TOKEN`.
- Mudança de visibilidade do repositório (público ↔ privado).
- Apagar repositório.
- Despublicar versão (`npm unpublish`) — operação que afeta toda a comunidade que já instalou.
- Operações que exigem 2FA do dono (npm publish em conta com 2FA, GitHub release com signing).

Qualquer override desta política exige entrada em `docs/governanca/override-ledger.md`.
