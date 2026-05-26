---
owner: tech-lead
revisado-em: 2026-05-26
status: aceito
decidido-em: 2026-05-26
decidido-por: Roldao Batista
prd: PRD-004
epico: EP-003
story: US-117
supersedes: []
superseded-by: null
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Auditoria de fluxo interno (10 agentes) — `docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §5"
  sintoma-observado: "23 hooks PreToolUse Write|Edit em sequencia custam 700ms-1.8s por operacao. Sessao de 100 edits gasta 1-3min so em hook. anti-mascaramento.js BLOQUEOU o proprio doc de analise que so CITAVA padroes proibidos — sinal de hook sem allowlist por path."
---

# ADR-027 — Manifest de hook + fast-path por path + frontmatter `@hook-meta`

> Decisao **aceita** em 2026-05-26 pelo Roldao. **Este e o ADR mais bloqueante da US-117** (Onda 1 do PRD-004).
>
> **Nota:** este ADR cita em prosa indireta (sem strings literais) os padroes que `anti-mascaramento.js` protege, justamente porque a falta de allowlist por path em ADRs e parte do problema que este ADR resolve.

---

## Contexto

`.claude/settings.json` (linhas 418-530 atual) registra **23 hooks** que disparam em cada `PreToolUse: Write|Edit`. Cada hook:

1. Faz `require('./_lib.js')` (~17KB, cacheado apos primeiro require — ok)
2. Faz `readStdinJson()` pra ler tool_input
3. Roda regex sobre conteudo do diff
4. Decide pass/block

Custo mensurado por agente da auditoria: **~30-80ms por hook × 23 hooks = 700ms a 1840ms por Edit/Write**. Sessao de 100 edits gasta **1-3 minutos so em hook**, antes de qualquer trabalho real do agente.

Pior: muitos hooks rodam em paths que NUNCA interessam. Exemplos reais:

- Hook fiscal valida emissao de NF-e. Roda em todo `Edit` — inclusive `README.md`, `docs/analises/*.md`, hooks customizados.
- Hook de log Pix valida log de chave Pix. Roda em todo `Edit` — inclusive arquivos sem nada de Pix.
- Hook de imutabilidade NF-e valida UPDATE/DELETE em tabela NF-e. Roda em arquivo `.md`.
- Hook anti-mascaramento bloqueia padroes em teste. Bloqueou o proprio `docs/analises/2026-05-26-licoes-do-lionclaw.md` porque ele **citava** padroes proibidos em prosa — solucao manual foi reescrever em prosa indireta. Friccao desnecessaria. Este proprio ADR sofreu o mesmo bloqueio na primeira escrita.

A auditoria de 2026-05-26 (`docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §5, F1-F3) diagnosticou 3 fraquezas: (F1) 23 hooks em sequencia, (F2) falsos positivos sem allowlist por path, (F3) ordem implicita sem dependencias declaradas.

Hoje a unica via pra "saber qual hook roda quando" e abrir `settings.json` + 44 arquivos `.js`. Nao ha manifest, nao ha allowlist, nao ha dependencia explicita.

## Decisao

**Cada hook ganha frontmatter de metadado `// @hook-meta {...}`. Script `tools/gerar-manifest-hooks.js` consolida em `.claude/hooks/MANIFEST.json`. Funcao `shouldSkipForPath(toolInput, hookId)` em `_lib.js` le manifest e faz early exit por path antes do regex pesado. Hook sem `@hook-meta` continua funcionando (fallback: roda sempre).**

### Frontmatter `@hook-meta`

Cabecalho padronizado no topo de cada `.js`:

```
#!/usr/bin/env node
// @hook-meta JSON-MINIFICADO-COM-CAMPOS-DOCUMENTADOS-ABAIXO

const { readStdinJson, shouldSkipForPath, emitSoftWarning } = require('./_lib.js');

(async () => {
  const input = await readStdinJson();
  if (shouldSkipForPath(input, 'anti-mascaramento')) process.exit(0);

  // resto do hook
})();
```

### Campos do `@hook-meta`

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `id` | string | sim | Identificador unico do hook (kebab-case, igual ao filename sem .js) |
| `priority` | number | sim | Ordem dentro do evento (menor = roda primeiro). Hooks de seguranca: 1-10. Mascaramento: 10-20. Pipeline: 50-100. LGPD/Fiscal: 100-200. |
| `events` | string[] | sim | Lista de eventos onde o hook dispara (PreToolUse, PostToolUse, SessionStart, etc.) |
| `blocks` | boolean | sim | `true` se hook bloqueia (exit 2 / decision:block); `false` se soft warning |
| `rule_id` | string | nao | Referencia a `REGRAS-INEGOCIAVEIS.md` (ex: TST-001, INV-007) |
| `paths_skip` | string[] | nao | Globs de paths onde hook **NAO** deve rodar (fast-path early exit) |
| `paths_only` | string[] | nao | Globs de paths onde hook **SO** deve rodar (alternativa a `paths_skip`) |
| `requires_meta` | string[] | nao | Outras dependencias declarativas |

### Manifest gerado

`tools/gerar-manifest-hooks.js` le todos os `.claude/hooks/*.js`, extrai `@hook-meta` de cada um, gera `.claude/hooks/MANIFEST.json` (JSON com array `hooks` + stats agregadas).

Exemplo de entrada do manifest (hook anti-mascaramento):
- `id: anti-mascaramento`
- `file: .claude/hooks/anti-mascaramento.js`
- `priority: 10`
- `events: [PreToolUse:Write|Edit]`
- `blocks: true`
- `rule_id: TST-001`
- `paths_skip: [docs/analises/**, docs/auditorias/**, docs/decisions/ADR-*.md, templates/**.example, **/__tests__/hook-*-extra.test.js]`

> Note como `docs/decisions/ADR-*.md` entra no `paths_skip` — resolve o bloqueio que aconteceu neste proprio ADR.

### `shouldSkipForPath(toolInput, hookId)` em `_lib.js`

Pseudocodigo:

```
funcao shouldSkipForPath(toolInput, hookId):
  se MANIFEST.json nao existe: retornar false (fallback — roda hook normal)
  ler manifest
  hook = manifest.hooks[hookId]
  se hook nao tem entrada: retornar false (roda normal)
  filePath = toolInput.file_path ou toolInput.path
  se sem filePath: retornar false (caso Bash — roda normal)
  se hook.paths_skip casa filePath: retornar true (pula)
  se hook.paths_only existe e filePath NAO casa: retornar true (pula)
  retornar false (roda)
```

`matchGlob` usa lib interna ja existente no `_lib.js` (zero deps externas).

### Hooks de SEGURANCA CRITICA com `paths_skip` vazio fixo

**Regra inegociavel:** hooks que protegem dor catastrofica nao ganham fast-path por path. Lista canonica:

- Hook que bloqueia comandos destrutivos (apagar pasta recursivo, push forcado, ignorar verificacoes em commit)
- Hook que detecta credencial em codigo
- Hook que detecta credencial em mensagem de commit
- Hook que detecta dado pessoal em log de auditoria (US-122)

Esses 4 tem `paths_skip: []` SEMPRE. Rodam em todo file. Documentado no proprio frontmatter como comentario `// CRITICO — NAO ADICIONAR paths_skip`.

### Geracao do manifest

`tools/gerar-manifest-hooks.js` roda em 3 momentos:

1. **`npx roldao-method install`** — gera manifest na primeira vez.
2. **`npx roldao-method update`** — regenera manifest apos copiar hooks novos.
3. **`SessionStart` hook `regen-manifest-if-stale.js`** — regenera se manifest mais antigo que o hook mais novo (detect via mtime). Fallback de seguranca.

Idempotente. Roda em < 200ms em 44 hooks.

## Alternativas consideradas

### Alternativa 1 — Cache de regex compilado (recusada)

Pre-compilar regex de cada hook em memoria, reutilizar entre chamadas. Vantagem: reduz custo de compilacao. Desvantagens:

- Cada hook hoje e processo Node separado (spawn pelo Claude Code) — sem estado persistente entre chamadas. Cache em memoria nao serve.
- Implementar cache em disco e mais complexo que fast-path por path.
- Resolve so 30% do problema (compilacao regex e ~10-20ms de cada hook; restante e startup do Node + parsing).

**Recusada.** Fast-path por path resolve a causa raiz: hook nao deveria rodar em path irrelevante.

### Alternativa 2 — Hooks paralelizados (recusada)

Disparar os 23 hooks em paralelo via `Promise.all`. Vantagem: reduz wall-clock total. Desvantagens:

- Claude Code dispara hooks sequencialmente por design — paralelismo exigiria fork no Claude Code (fora do nosso controle).
- Output dos hooks fica embaralhado — usuario nao-programador ve mensagens fora de ordem.
- Bloqueio depende de exit code do PRIMEIRO hook que bloqueia — paralelismo so paga em hooks que todos passam.

**Recusada.** Sequencial com fast-path e mais simples e mais previsivel pro usuario.

### Alternativa 3 — Reescrever hooks em Rust/Go (recusada)

Hooks em binario nativo: startup mais rapido, regex mais rapido. Vantagem: 10-50x mais rapido. Desvantagens:

- Quebra `Node puro zero-deps` (memoria `project-stack.md`). Inegociavel.
- Exige toolchain de cross-compile pra Mac/Win/Linux.
- Hooks customizados pelo usuario teriam que ser em Rust — barreira de entrada alta.

**Recusada.** Node puro e diferencial competitivo do framework.

### Alternativa 4 — Sem mudanca, viver com 1-3min de overhead por sessao (recusada)

Aceitar custo atual. Vantagem: zero risco. Desvantagens:

- Diagnostico da auditoria fica em aberto.
- Roldao continua sentindo framework lento.
- Falso positivo do anti-mascaramento em docs continua exigindo workaround manual (este ADR e prova viva).

**Recusada.** Onda 1 do PRD-004 nao avanca sem essa fundacao.

## Consequencias

### Positivas

- Edit em `README.md` cai de ~23 hooks pra ~5. Estimativa: latencia mediana cai de 1000ms pra 200-250ms (alinhado com meta AC-126-3).
- Falso positivo do anti-mascaramento em `docs/analises/**` e `docs/decisions/**` resolvido por declaracao explicita no `paths_skip`.
- Manifest serve como **documentacao executavel** — Roldao roda `node tools/gerar-manifest-hooks.js && cat MANIFEST.json | jq '.hooks[].id'` e ve todos os hooks ativos.
- Meta-cetico (Otavio — ADR-023) consome `MANIFEST.json` pra cruzar com `hook-stats.jsonl` e detectar hooks dormentes (zero disparos em 90 dias).
- Hook sem `@hook-meta` continua funcionando (fallback) — compat backward total.
- Manutencao futura: adicionar hook novo so exige criar `.js` com frontmatter. Manifest regenera sozinho.

### Negativas

- 44 hooks existentes precisam ganhar frontmatter `@hook-meta` (T-117-005 — esforco grande, mas mecanico).
- Hook customizado pelo usuario sem `@hook-meta` continua rodando mas sem fast-path (degraded, nao quebrado).
- Mais 1 arquivo em `.claude/hooks/` (`MANIFEST.json`). Cresce ~5-10KB.
- Risco de manifest desatualizado (mitigado pelo `regen-manifest-if-stale.js`).
- Glob matching custa ~1-3ms — em hooks que nao tem `paths_skip`, sai com false em tempo similar; em hooks com `paths_skip` longo, ainda mais rapido que rodar regex completo.

### Compativel com

- **ADR-001** (Node puro zero-deps) — manifest e glob matching em Node puro.
- **ADR-016** (Politica SemVer) — v3.0.0 major bump suporta mudanca estrutural.
- **ADR-023** (Framework aprendiz) — Otavio consome manifest + stats pra propor sunset.
- **ADR-031** (Preservacao de capacidade) — hook sem `@hook-meta` continua funcionando.
- **INV-001** — manifest e doc executavel versionada em `.claude/hooks/`.
- **INV-005** — manifest substitui necessidade de listar 44 hooks em prosa no AGENTS.md.

## Gatilhos de reabertura

- Latencia mediana de PreToolUse Write/Edit > 400ms em produto medido por `evals/hooks-perf.test.js` (AC-126-3) → revisar `paths_skip` ou fast-path por payload.
- Hook customizado por usuario sem `@hook-meta` representa > 30% dos hooks em projetos clientes → criar comando `/migrar-hooks-v3` que adiciona frontmatter automatico.
- Manifest divergir do disco em > 5% dos SessionStart → revisar `regen-manifest-if-stale.js`.

## Como verificar

- `ROLDAO_HOOKS_VERBOSE=1 echo "test" > README.md` → stderr lista hooks executados, contagem ≤ 5.
- `cat .claude/hooks/MANIFEST.json | jq '.hooks | length'` retorna >= 44.
- Editar `docs/analises/2026-05-26-licoes-do-lionclaw.md` citando padrao proibido em prosa → `anti-mascaramento.js` NAO bloqueia (fast-path).
- Editar `docs/decisions/ADR-NNN-*.md` citando padrao proibido em prosa → `anti-mascaramento.js` NAO bloqueia (fast-path — este ADR seria evidencia viva).
- Editar `src/auth/login.ts` com diretiva de ignorar tipo → `anti-mascaramento.js` BLOQUEIA (sem paths_skip pra esse caminho).
- Renomear `.claude/hooks/MANIFEST.json` pra simular ausencia → hooks continuam rodando normalmente (fallback).

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial — aguardando aceite do Roldao |
