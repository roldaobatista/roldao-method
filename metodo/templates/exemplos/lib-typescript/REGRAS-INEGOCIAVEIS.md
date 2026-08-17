---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 220
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: REGRAS-INEGOCIAVEIS.md — projeto @conciliab/csv-parser
fonte única de verdade das invariantes operacionalizáveis.
-->

# Regras inegociáveis — @conciliab/csv-parser

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence.

> Fonte única de verdade das invariantes operacionalizáveis. Toda outra doc referencia por ID, nunca redeclara. Cada INV declara: regra, motivação, hook que aplica e auditor relacionado. Invariante sem mecanismo de aplicação é decoração — não entra aqui.

## 1. Invariantes de produto (INV-NNN)

| ID | Regra | Por que (motivação) | Hook que aplica | Auditor relacionado |
|---|---|---|---|---|
| INV-PARSER-001 | Parsing é função pura: mesmo input → mesmo output. Sem leitura de FS, sem rede, sem `Date.now()`, sem `Math.random()`, sem env. | Determinismo é base da testabilidade e da confiança em snapshots. | `purity-check.sh` (proíbe imports de `node:fs`, `node:net`, `node:os` em `src/parsers/`) | `auditor-pureza` |
| INV-SEMVER-001 | Toda mudança de API pública (qualquer símbolo exportado de `src/index.ts`) exige bump correspondente: rename/remoção/troca de tipo → **major**; novo símbolo → **minor**; correção interna → **patch**. | Quebra silenciosa de SemVer em lib pública = perda de confiança da comunidade. | `api-extractor.sh` (compara assinaturas exportadas com baseline da versão atual) | `auditor-semver` |
| INV-SNAPSHOT-001 | Snapshots de teste contêm apenas dados sintéticos gerados pelos builders em `tests/fixtures/builders.ts`. Proibido commitar extrato real, mesmo "anonimizado". | Vazamento de dado bancário real via repo público = incidente grave + LGPD. | `snapshot-pii-scanner.sh` (rejeita CPF/agência/conta com padrão real) | `auditor-seguranca` |
| SEC-001 | Nenhum secret (token npm, GitHub PAT, chave de assinatura) em código-fonte ou histórico git. | Vazamento público irreversível — token npm rouba o pacote. | `secrets-scanner.sh` | `auditor-seguranca` |
| TST-001 | Teste não pode ser silenciado, pulado ou afrouxado sem ADR. `it.skip`, `it.todo` sem issue, `expect(true).toBe(true)`, snapshot deletado sem motivo — proibidos. | Esconde bug e quebra confiança na suite. | `anti-mascaramento.sh` | `auditor-qualidade` |

## 2. Invariantes para agentes IA (INV-AGENT-NNN)

| ID | Regra | Por que (motivação) | Hook que aplica | Auditor relacionado |
|---|---|---|---|---|
| INV-AGENT-001 | Agente IA NÃO publica pacote (`npm publish`, `pnpm changeset publish`) sem confirmação humana explícita. | Versão publicada não pode ser despublicada após 72h (política do npm); afeta toda a comunidade. | `block-destructive.sh` (lista contém `npm publish`, `pnpm changeset publish`) | `limites-agente-ia` |
| INV-AGENT-002 | Proibido `--no-verify`, `--force`, `--force-with-lease` em `main`. Qualquer override exige entrada em `docs/governanca/override-ledger.md`. | Pula quality gate ou destrói histórico compartilhado. | `block-destructive.sh` + `override-ledger.sh` | `limites-agente-ia` |
| INV-AGENT-003 | Investigar antes de mexer em lógica de parser: ler input real, snapshot e teste falhando **antes** de editar regex/regra. | Mudar regex sem ver input quebra 3 bancos pra "consertar" 1. | `pre-edit-evidence.sh` (PreToolUse Edit\|Write) | `auditor-doc-quality` (sub-regra B) |
| INV-AGENT-004 | Pró-atividade: executar ações reversíveis sem perguntar. Confirmar antes só para a lista destrutiva: `npm publish`, `npm unpublish`, `git push --force`, `git reset --hard`, `rm -rf`, mudança de visibilidade do repo, rotação de token, despublicação. | Empurrar tarefa executável pro dono quebra fluxo e ele não programa. | `override-ledger.sh` | `limites-agente-ia` |
| INV-AGENT-005 | Validar antes de afirmar: nunca dizer "pronto/implementado/corrigido" sem rodar `pnpm test` + `pnpm run typecheck` no mínimo e mostrar resultado. | Afirmação sem evidência erode confiança e mascara regressões. | `post-claim-evidence.sh` (Stop hook) | `auditor-revisao` |
| INV-AGENT-006 | Causa raiz, nunca sintoma. Proibido `it.skip`, `expect(true).toBe(true)`, `@ts-ignore` sem comentário+issue, `eslint-disable` sem justificativa, asserção relaxada para passar, snapshot deletado sem motivo. | Mascarar erro transforma bug pequeno em incidente de release. | `anti-mascaramento.sh` | `auditor-qualidade` |
| INV-AGENT-007 | Commits atômicos. Antes de `git commit`: `git status` + `git diff --staged` + `git log -3 --oneline`. Proibido `git add .` / `git add -A` cego. Stage seletivo por arquivo. | Commit misto polui histórico e impede revert cirúrgico — especialmente sério com `changesets` (1 changeset = 1 mudança lógica). | `auditor-commit-hygiene.sh` (PreToolUse Bash) | `auditor-commit-hygiene` |
| INV-AGENT-008 | Dado bancário real nunca em snapshot, fixture ou log de teste. Mesmo "anonimizado". Apenas dados sintéticos via `builders.ts`. | LGPD + vazamento via repo público = incidente. | `snapshot-pii-scanner.sh` | `auditor-seguranca` |
| INV-AGENT-009 | Nenhum segredo (token npm, GitHub PAT, chave de assinatura) em arquivo versionado. Usa `.env` local (em `.gitignore`) + GitHub Actions Secrets. | Histórico git é eterno; token vazado = pacote sequestrado. | `secrets-scanner.sh` | `auditor-seguranca` |
| INV-AGENT-010 | Linguagem acessível: traduzir jargão técnico na primeira ocorrência por canal. Dono não programa. Tabela canônica no anexo 2.A. | Jargão sem tradução exclui o tomador de decisão do loop. | `frontmatter-validator` (regra adicional) | `auditor-doc-quality` (regra E) |
| INV-AGENT-011 | Alteração de qualquer INV-NNN ou INV-AGENT-NNN exige PR dedicado + aprovação do dono + entrada em `docs/governanca/decisoes-inv.md`. | INV é contrato; mudança silenciosa destrói o contrato. | `inv-change-guard.sh` | `auditor-processo` |

### 2.A — Anexo da INV-AGENT-010: tradução canônica de jargão

A fonte única de tradução de jargão **vive em** [`../../../GLOSSARIO-ROLDAO.md`](../../../GLOSSARIO-ROLDAO.md) (no projeto destino real: `GLOSSARIO-ROLDAO.md` da raiz). Não duplicar aqui.

Termos específicos da lib (release, publish, changeset, semver, snapshot test, dual ESM+CJS, SBOM) já estão no glossário canônico. Termos novos do domínio bancário/CNAB entram no `docs/glossario.md` do produto, não aqui.

**Pró-atividade (referência a INV-AGENT-004):** o agente executa ações reversíveis sem perguntar e reporta no formato "fiz X, resolvi Y, já comecei Z". Detalhes e lista destrutiva vivem em INV-AGENT-004; este anexo é só de linguagem.

## 3. Processo de alteração das INVs

1. PR dedicado, **um INV por PR**, mensagem cita o ID alterado.
2. Aprovação do dono (humano) obrigatória — não há override por agente.
3. Entrada em `docs/governanca/decisoes-inv.md` com: data, ID, motivo, antes/depois, aprovador.
4. Atualização (ou criação) do hook/auditor correspondente no mesmo PR. INV sem mecanismo não é aceito.
5. `CHANGELOG.md` registra a mudança (gerado via `changesets`).

## 4. Referências

- [`.claude/memory/constitution.md`](./.claude/memory/constitution.md) — princípios fundadores.
- [`AGENTS.md`](./AGENTS.md) — canônico de produto.
- [`CLAUDE.md`](./CLAUDE.md) — adendo do harness Claude Code.
- [`docs/adr/`](./docs/adr/) — ADRs ativas.
- [`docs/governanca/decisoes-inv.md`](./docs/governanca/decisoes-inv.md) — histórico de alterações de INV (vazio até a 1ª mudança).
