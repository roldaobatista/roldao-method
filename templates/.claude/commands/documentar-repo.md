---
description: Workflow brownfield — gera doc retroativa (PRD + ADRs + SCHEMA + API + README + RUNBOOK + ONBOARDING + CLAUDE.md) em 23 fases, 7 stages. NUNCA sobrescreve doc existente sem confirmacao + diff visual (INV-007 codificada via 4 stages obrigatorios). Acionado pelo agente `documentation-master`.
argument-hint: "[--area <subpath> | --publicar | --cancelar | --diff <N>]"
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(mkdir:*), Bash(git add:*), Bash(git commit:*), Write, Task
---

# /documentar-repo — doc retroativa pra brownfield

Comando-chave pra adotar o framework em repo legado. Lê o codigo existente + git log e gera documentacao tecnica completa: PRD retroativo, ADRs extraidos do codigo, SCHEMA.md, API.md, TYPES.md, README, RUNBOOK, ONBOARDING, CLAUDE.md, INDEX.

**REGRA NUMERO 1:** Nunca sobrescreve doc existente sem confirmacao + diff visual. **Auto-publish e PROIBIDO POR ARQUITETURA.**

## Quando usar

1. Adotando o framework em repo legado sem doc
2. Retomando projeto antigo onde doc envelheceu/ficou inconsistente
3. Cliente/contador/auditor externo pediu documentacao tecnica completa
4. Antes de release/deploy importante quando doc desincronizou do codigo

## Subcomandos

| Subcomando | Acao |
|---|---|
| `/documentar-repo` | Stage 1 (Scan) + Stage 2 (Triage) — produz proposta em `.specify/runs/documentation-<runId>/` |
| `/documentar-repo --area src/auth/` | Subset — so documenta uma subpasta |
| `/documentar-repo --diff 3` | Mostra diff completo do item 3 da proposta |
| `/documentar-repo --publicar` | Stage 4 (Apply) — arquivo-a-arquivo, requer confirmacao explicita |
| `/documentar-repo --publicar --aceitar 1,2,5` | Apply somente itens 1, 2 e 5 |
| `/documentar-repo --cancelar` | Descarta staging |

## Limite duro

Codebase com > 50k arquivos rastreaveis (`git ls-files | wc -l`):

```
ATENCAO: codebase com 87,432 arquivos. Workflow nao roda escopo completo.

Sugestao: usar /documentar-repo --area <subpath> pra subset.

Exemplos:
  /documentar-repo --area src/    # so o codigo da aplicacao
  /documentar-repo --area docs/   # so revisar docs existentes
```

## Etapa 1 — Validar pre-requisitos

1. Existe `git`? Se nao: erro PT-BR "documentar-repo exige git inicializado".
2. Codebase tem > 50k arquivos? Sugerir `--area`.
3. Existe `.specify/runs/documentation-<runId-anterior>/`? Perguntar "ja ha proposta pendente. Cancelar e comecar novo OU continuar do anterior?"

## Etapa 2 — Chamar `documentation-master`

Via Task tool:

```
Task: documentation-master
Prompt: Documentar repo em <area opcional>. Stages 1-7, 23 fases. Output em .specify/runs/documentation-<runId>/. Respeitar 4 stages obrigatorios — NUNCA escrever direto em docs/ do usuario.
```

`documentation-master` (agente — definido em `.claude/agents/documentation-master.md`) orquestra as 23 fases internamente (via Task pra sub-passos especialistas: doc-repo-profiler, doc-module-mapper, etc.).

## Etapa 3 — Apresentar PublishPlan

Apos as 23 fases terminarem (pode demorar — pipeline tem etapas conversacionais com o usuario na fase 6 e fase 9):

```
PROPOSTA DE PUBLICACAO

23 fases concluidas. 14 documentos gerados em .specify/runs/documentation-r1/.

Pra publicar:

[ 1] docs/PRD.md                — CRIAR (3.2KB)
[ 2] docs/decisions/ADR-001.md  — CRIAR (1.5KB)
[ 3] docs/decisions/ADR-002.md  — CRIAR (1.2KB)
[ 4] docs/SCHEMA.md             — SOBRESCREVER (2.1KB → 4.7KB, diff 67%) [diff: /documentar-repo --diff 4]
[ 5] docs/API.md                — CRIAR (3.0KB)
[ 6] docs/TYPES.md              — CRIAR (1.8KB)
[ 7] docs/modules/auth.md       — CRIAR (2.5KB)
[ 8] docs/modules/payment.md    — CRIAR (1.9KB)
[ 9] README.md                  — IDENTICO (skip — diff 0%)
[10] docs/RUNBOOK.md            — CRIAR (2.2KB)
[11] docs/ONBOARDING.md         — CRIAR (1.8KB)
[12] docs/USER_GUIDE.md         — CRIAR (3.4KB)
[13] docs/INDEX.md              — CRIAR (800B)
[14] CLAUDE.md                  — SOBRESCREVER (1.0KB → 2.3KB, diff 88%) [diff: /documentar-repo --diff 14]

ARQUIVOS COM DIFF > 30% (atencao especial):
  - docs/SCHEMA.md (67%)
  - CLAUDE.md (88%)

Recomendado: revisar diff antes de aceitar overwrite.

Pra publicar TUDO: /documentar-repo --publicar
Pra publicar SELECIONADO: /documentar-repo --publicar --aceitar 1,2,3,5,6,7,8,10,11,12,13
Pra ver diff individual: /documentar-repo --diff <N>
Pra cancelar: /documentar-repo --cancelar
```

## Etapa 4 — Diff (modo `--diff N`)

Mostrar diff unificado do item N — primeiros 1000 chars:

```
DIFF — docs/SCHEMA.md (item 4)

--- docs/SCHEMA.md (existente, 2.1KB)
+++ .specify/runs/documentation-r1/SCHEMA.md (proposto, 4.7KB)

@@ -1,5 +1,8 @@
-# Schema do banco
-
-Tabela `usuarios`:
-- id, name, email
+# Schema do banco
+
+> Gerado automaticamente por /documentar-repo. Atualizar conforme migrations evoluem.
+
+## Tabela `usuarios`
@@ -10,20 +13,40 @@
...

[Mostrando primeiros 1000 chars de 2.6KB. Pra ver completo: ver .specify/runs/documentation-r1/SCHEMA.md]

Aceitar este (sobrescrever docs/SCHEMA.md)? (S/N)
```

## Etapa 5 — Apply (`--publicar`)

Apos o usuario confirmar:

1. Lock per-project (`.claude/.runtime/documentar-repo.lock`)
2. Pra cada arquivo aceito:
   - Verificar realpath ainda dentro de projectRoot (anti-symlink)
   - Verificar SHA do `target` nao mudou desde a proposta (race-condition)
   - Copiar de `.specify/runs/.../` pra `docs/.../`
   - Anotar em `publication.applied_files`
3. Update manifest em `.specify/runs/documentation-<runId>/publish-plan.json` com `stage: aplicado`
4. Commit atomico opcional (oferece): `docs(brownfield): documentacao gerada por /documentar-repo run-<id>`

Output:

```
PUBLICACAO COMPLETA

Aplicados: 11 arquivos
Skipped: 3 arquivos (identicos OU rejeitados pelo usuario)

ARQUIVOS PUBLICADOS:
  - docs/PRD.md
  - docs/decisions/ADR-001.md
  ...

PROXIMO PASSO LOGICO:
  - Revisar manualmente docs/PRD.md (pode ter alucinacao do agente)
  - `git diff docs/` pra inspecionar tudo
  - Commit quando estiver satisfeito (proposta de msg: `docs(brownfield): documentar via /documentar-repo r1`)
```

## Limites

- **Auto-publish proibido por arquitetura.** Nao ha flag pra pular Stages 2-3.
- **Codebase > 50k arquivos rejeitado** — usar `--area` pra subset.
- **`docs/` existente sempre passa por diff visual antes de overwrite.**
- **Anti-symlink** ativo em todo path.
- **Lock per-project** impede 2 sessoes paralelas conflitando.
