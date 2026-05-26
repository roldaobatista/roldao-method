---
owner: tech-lead
revisado-em: 2026-05-26
status: aceito
decidido-em: 2026-05-26
decidido-por: Roldao Batista
prd: PRD-004
epico: EP-003
story: US-119
supersedes: []
superseded-by: null
estende: [ADR-020, ADR-021]
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Auditoria de fluxo interno (10 agentes) — `docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §1 + §3"
  sintoma-observado: "Markers binarios sem payload em .claude/.runtime/ — Detetive nao sabe quais ACs Sofia priorizou; auto-compactacao perde estado de pipeline; sessao morta no meio de /feature refaz trabalho que ja estava feito."
---

# ADR-024 — Pipeline state como JSON consolidado convive com sentinel files legados

> Decisao **aceita** em 2026-05-26 pelo Roldao.

---

## Contexto

O framework v2.0.0 usa **sentinel files** em `.claude/.runtime/` pra rastrear progresso de pipeline:

```
.claude/.runtime/
├── feature-active-<sess>
├── sofia-done-<sess>
├── detetive-done-<sess>
├── rafael-skipped-<sess>
├── bruno-done-<sess>
├── ines-done-<sess>
├── auditor-seg-pass-<sess>
├── auditor-qual-pass-<sess>
└── auditor-prod-pass-<sess>
```

Cada hook faz 5-8 `fs.existsSync` pra deduzir estado. Funciona em fluxo curto. **Falha em 3 cenarios reais:**

### Cenario 1 — Auto-compactacao no meio

Sessao do Claude Code estora orcamento de contexto e auto-compacta. `session-snapshot.js` so persiste 4 prefixos especificos (`readiness-passed-`, `prd-active-`, `brownfield-active-`, `ar-active-`). Markers de pipeline em curso (`sofia-done`, `detetive-done`, `investigator-invoked`) sao **explicitamente descartados como efemeros**. Resultado: proxima sessao acha que Sofia/Detetive nunca rodaram → refaz tudo.

### Cenario 2 — Worktree paralelo

Roldao roda 2 features em paralelo em worktrees diferentes. Ambos podem ter mesmo `${sess}` se geracao for por timestamp. Markers colidem.

### Cenario 3 — Payload zero

Sofia escreve `sofia-done-<sess>` vazio. Detetive abre o marker e nao tem ideia de quais ACs Sofia priorizou — re-le PRD inteiro. ADR-020 ja evoluiu marker de **auditor** pra JSON com `audit_sha`/`lido_de`, mas Sofia/Detetive/Rafael/Bruno ainda criam arquivo vazio.

A auditoria de 2026-05-26 (`docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §1, F1-F3) consolidou 3 fraquezas. Solucao do PRD-004 e introduzir **estado consolidado** em 1 arquivo JSON por story.

## Decisao

**Adicionar `.claude/.runtime/pipeline-state-<US>.json` como estado canonico consolidado. Sentinel files legados continuam funcionando integralmente. Hook `migrate-runtime-markers.js` (SessionStart) sincroniza ambos. Flag `ROLDAO_METHOD_LEGACY_MARKERS=1` (default true em v3.0.0, default false em v3.1.0, removida em v4.0.0) controla precedencia.**

### Schema canonico

Schema em `.specify/schemas/pipeline-state.schema.json`:

```json
{
  "version": 1,
  "pipeline": "feature" | "bug" | "hotfix" | "refactor" | "qa" | "documentation",
  "us_id": "US-117",
  "session_hash": "abc123",
  "started_at": "2026-05-26T14:02:00Z",
  "last_activity": "2026-05-26T14:18:32Z",
  "current": "rafael",
  "etapas": [
    {
      "agente": "gerente-produto",
      "status": "done",
      "started_at": "2026-05-26T14:02:00Z",
      "finished_at": "2026-05-26T14:05:18Z",
      "marker_sha": "f3a2b1c...",
      "handoff_payload_path": ".claude/.runtime/handoff/gerente-produto-para-investigador-abc123.json"
    },
    {
      "agente": "investigador",
      "status": "done",
      "started_at": "2026-05-26T14:05:30Z",
      "finished_at": "2026-05-26T14:12:11Z",
      "marker_sha": "8d7e6f5...",
      "handoff_payload_path": ".claude/.runtime/handoff/investigador-para-tech-lead-abc123.json"
    },
    {
      "agente": "tech-lead",
      "status": "running",
      "started_at": "2026-05-26T14:12:30Z",
      "finished_at": null,
      "marker_sha": null,
      "handoff_payload_path": null
    },
    {
      "agente": "dev-senior",
      "status": "pending",
      "started_at": null,
      "finished_at": null,
      "marker_sha": null,
      "handoff_payload_path": null
    }
  ]
}
```

### Coexistencia com sentinels legados

**Sentinels nao desaparecem em v3.0.0.** Comportamento:

| Cenario | v3.0.0 com flag `=1` (default) | v3.0.0 com flag `=0` | v3.1.0 sem flag | v4.0.0 |
|---|---|---|---|---|
| Hook le sentinel `*-done-<sess>` | Funciona | Funciona | Funciona | Removido |
| Hook le `pipeline-state-<US>.json` | Funciona (preferencial) | Funciona | Funciona | Funciona |
| Sentinel existe, JSON nao | `migrate-runtime-markers.js` cria JSON | Hook usa sentinel direto | `migrate-runtime-markers.js` cria JSON | N/A |
| JSON existe, sentinel nao | Hook usa JSON direto | Hook cria sentinel pra compat | Hook usa JSON direto | Hook usa JSON direto |
| Ambos existem, conflito | JSON ganha + warning | Sentinel ganha + warning | JSON ganha + warning | N/A |

Hook `migrate-runtime-markers.js` (SessionStart):
1. Le todos os `*-done-<sess>` e `*-skipped-<sess>` em `.claude/.runtime/`
2. Detecta US ativa via `feature-active-<sess>` ou heuristica (transcript path → ultimo `/feature US-NNN`)
3. Se `pipeline-state-<US>.json` ausente: gera a partir dos sentinels
4. Se ambos existem e divergem: warning no stderr + JSON ganha (estado mais rico)

### Handoff payload (campo `handoff_payload_path`)

Cada etapa aponta pra arquivo `.claude/.runtime/handoff/<from>-para-<to>-<sess>.json` com payload tipado (definido em ADR-025 — separado).

### Atomicidade

`pipeline-state-<US>.json` e escrito com pattern atomic-write:
1. Escrever em `pipeline-state-<US>.json.tmp`
2. `fs.renameSync` pro nome final (atomico em Windows + Unix)
3. Se renomeacao falhar, `.tmp` fica como evidencia de crash mid-write

### Compativel com auto-compactacao

`session-snapshot.js` ganha prefixo novo `pipeline-state-` na lista de prefixos preservados. Persiste cross-session. Resolve o cenario 1.

### Compativel com worktree paralelo

`pipeline-state-<US>.json` usa `US-NNN` como chave, nao `${sess}`. Worktrees diferentes rodando US diferentes nao colidem. Worktree rodando MESMA US (caso raro) detectado pelo `worktree-advisor.js` (US-119 AC-119-13).

## Alternativas consideradas

### Alternativa 1 — Substituir sentinels imediatamente (recusada)

Migracao imediata: v3.0.0 remove sentinels, so JSON. Vantagem: codigo mais limpo, menos duplicacao. Desvantagens:

- Quebra projetos legados no dia do update.
- Addons (`fintech-br`, `fiscal-br-completo`, futuro `electron-br`) que leem sentinels via `_lib.js` quebram.
- Viola principio fundador da v3 (PRD-004): "NUNCA PERDER CAPACIDADE."
- Hook customizado pelo usuario que dependia de sentinel deixa de funcionar.

**Recusada.** Coexistencia controlada por flag e o caminho.

### Alternativa 2 — SQLite local em vez de JSONL (recusada)

Pipeline state em `.claude/.runtime/state.db` (SQLite). Vantagem: queries estruturadas, transacoes, performance em projeto grande. Desvantagens:

- Quebra `Node puro zero-deps` (memoria `project-stack.md`).
- SQLite exige binario nativo por plataforma — complica `npx roldao-method install` cross-platform.
- Lionclaw fez isso e virou debito tecnico de 22 migrations so pra re-prompt de agente.
- JSON e legivel/diffavel/commitavel se necessario; SQLite nao.

**Recusada.** Node puro e nao-negociavel.

### Alternativa 3 — Continuar so com sentinels (recusada)

Manter v2.0.0 como esta. Vantagem: zero risco. Desvantagens:

- 3 cenarios diagnosticados continuam quebrados.
- US-119 do PRD-004 fica sem solucao tecnica.
- Cada dor futura de "perdi trabalho na auto-compactacao" continua existindo.

**Recusada.** PRD-004 nao avanca sem essa fundacao.

## Consequencias

### Positivas

- Auto-compactacao deixa de perder pipeline state (cenario 1 resolvido).
- Worktrees paralelos coexistem (cenario 2 resolvido).
- Handoff entre agentes ganha payload tipado (cenario 3 resolvido — via ADR-025).
- Hook `migrate-runtime-markers.js` garante migracao zero-effort pro Roldao.
- Sentinels legados continuam funcionando 1 release inteira — addons nao quebram.
- `pipeline-state-<US>.json` e legivel pelo Roldao se ele quiser inspecionar manualmente.

### Negativas

- Duplicacao temporaria de estado (sentinels + JSON) por 1 release. Custo: 2-5KB extra por sessao em `.claude/.runtime/`.
- Hook `migrate-runtime-markers.js` adiciona ~50ms ao SessionStart em projetos com muitos sentinels (mitigavel com cache).
- Risco de divergencia entre sentinels e JSON em casos edge (mitigado pelo warning + JSON-ganha-default).
- Schema JSON precisa evoluir compativel — `version: 1` reservado pra mudanca futura.

### Compativel com

- **ADR-001** (Node puro zero-deps) — JSON via `JSON.stringify/parse` nativo.
- **ADR-020** (Contrato audit_sha em markers) — `marker_sha` no schema referencia o contrato existente.
- **ADR-021** (Flag legacy markers v2) — `ROLDAO_METHOD_LEGACY_MARKERS` agora cobre tambem `pipeline-state-*.json` vs sentinels. Janela estendida pra 1 release minor da v3.
- **INV-001** — JSON e estado compartilhado, nao memoria de conversa.

## Gatilhos de reabertura

- Projeto com > 100 stories simultaneas em `pipeline-state-*.json` → migrar pra estrutura mais compacta (1 arquivo agregado).
- Sentinel + JSON divergem em > 5% das sessoes monitoradas via `hook-stats.jsonl` → revisar `migrate-runtime-markers.js`.
- Lionclaw ou outro projeto cliente quiser usar este formato → publicar schema em `.specify/schemas/` como contrato publico.

## Como verificar

- `npx roldao-method install` em projeto com sentinels v2 → primeiro SessionStart cria `pipeline-state-*.json` correspondente.
- `cat .claude/.runtime/pipeline-state-US-117.json | jq .current` retorna nome do agente atual.
- `ROLDAO_METHOD_LEGACY_MARKERS=0 npx claude` em projeto v2 → JSON tem precedencia, sentinel ignorado.
- Crash artificial mid-write (`kill -9` durante salvamento) → `.tmp` permanece, JSON original intacto.

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial — aguardando aceite do Roldao |
