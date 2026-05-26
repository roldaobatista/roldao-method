---
owner: tech-lead
revisado-em: 2026-05-26
status: aceito
decidido-em: 2026-05-26
decidido-por: Roldao Batista
prd: PRD-004
epico: EP-003
story: US-120
supersedes: []
superseded-by: null
relacionado: [ADR-020]
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Auditoria de fluxo interno (10 agentes) — `docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §6 (F2)"
  sintoma-observado: "Resolution tracker confia em marker, nao em commit. audit_sha prova que Caio leu o diff, nao que o diff endereçou os 3 criticos. Caio pode dizer 'achei 3 criticos', Bruno corrige (talvez nao os 3), marker pass e escrito, e os 3 criticos podem nunca terem sido tocados."
---

# ADR-029 — Tabela `audit_findings` + ciclo finding-fix-re-audit

> Decisao **aceita** em 2026-05-26 pelo Roldao.

---

## Contexto

ADR-020 (audit_sha) garantiu que auditor leu o diff atual antes de aprovar. Resolveu staleness — auditor nao aprova diff antigo. **Mas nao garante que findings foram resolvidos.**

Cenario real possivel hoje:

1. Caio auditou, gravou marker `auditor-seg-pass-<sess>` com `audit_sha: ABC` e mensagem "encontrei 3 criticos: C1, C2, C3"
2. Bruno mexeu nos 3 criticos
3. Bruno tambem fez refactor adjacente que mudou outras coisas
4. Caio re-audita, gravou novo marker com `audit_sha: XYZ` — mas C1 ainda esta vivo (Bruno corrigiu C2 e C3, achou que C1 era nice-to-have)
5. Marker passa porque Caio agora "leu" o novo diff. Mas C1 esta solto.

`audit_sha` prova **leitura do diff atual**, nao **resolucao dos findings declarados**. Auditoria de 2026-05-26 (§6 F2):

> "Caio pode dizer 'achei 3 criticos', Bruno 'corrige', marker pass e escrito, e os 3 criticos podem nunca terem sido tocados — o audit_sha so prova que Caio leu o diff atual, não que o diff atual endereçou os 3 críticos."

## Decisao

**Cada auditor escreve `.claude/.runtime/audit-finding-{seg|qual|prod}-${SESSION}.jsonl` com 1 linha por finding. Schema em `.specify/schemas/audit-finding.schema.json`. Hook `require-findings-resolved.js` (PreToolUse Bash quando commit feat/fix) bloqueia se ha finding `severity: must-fix-merge` com `status: open`. Dev cita `Fixes: AF-001, AF-003` em commit msg pra fechar. Re-auditoria muda `status: closed-by-<sha>` apos verificar.**

### Schema (`audit-finding.schema.json`)

```json
{
  "finding_id": "AF-001",
  "session_hash": "abc123",
  "us_id": "US-117",
  "auditor": "auditor-seguranca",
  "auditor_persona": "Caio",
  "severity": "must-fix-merge",
  "tier_justificativa": "Vazamento de PII em log fere LGPD-004",
  "rule_id": "LGPD-004",
  "file": "src/auth/login.ts",
  "line": 42,
  "descricao_pt_br": "Senha sendo logada em texto puro no fluxo de login. Risco: vazamento se log for capturado por sistema externo.",
  "como_arrumar_pt_br": "Trocar log(senha) por log('***'). Manter info de que houve tentativa, sem expor credencial.",
  "status": "open",
  "created_at": "2026-05-26T14:18:00Z",
  "closed_by_sha": null,
  "closed_at": null,
  "closed_justificativa": null
}
```

### Tiers de severity

| Tier | Comportamento |
|---|---|
| `must-fix-merge` | Bloqueia commit final ate `status: closed-by-<sha>` |
| `todo-post-release` | Registra como divida tecnica. Aparece em `/saude` mas nao bloqueia merge |
| `info` | So registra. Nao aparece em `/saude`. Util pra observacao do auditor sem implicacao operacional |

Hook `require-tier-on-finding.js` rejeita finding sem `severity` declarado.

### Ciclo finding → fix → re-audit

```
1. Auditor escreve findings em audit-finding-*.jsonl com status: open
2. Bruno corrige
3. Bruno commita citando "Fixes: AF-001, AF-003" na msg
4. Hook require-findings-resolved.js le commit msg + audit-finding.jsonl
5. Verifica que AF-001 e AF-003 viraram status: closed-by-<sha-do-commit>
6. Re-auditor (Caio em modo --revisar-findings) verifica que fix realmente resolveu
7. Se ok: status fica closed-by-<sha>
8. Se nao ok: status volta pra open com nova nota em `reaberto:` array
```

### Integracao com ADR-020 (audit_sha)

`audit_sha` continua valido — prova que auditor leu diff atual. **Audit findings adicionam camada:** prova que findings foram especificamente endereçados. Os 2 trabalham juntos.

### Compativel com auditoria iterativa (PRD-004 US-120 AC-120-10)

Tabela `audit_round` em `audit-rounds-${SESSION}.jsonl` referencia findings. Round 2 le findings do round 1 + classifica em `MANTIDO | JA-CORRIGIDO | PERIGOSO | AMPLIADO`. Round termina quando `findings_novos == 0`.

### Audit-bias (PRD-004 US-120 AC-120-7)

`.claude/.runtime/audit-bias.json` acumula `miss_count` por rule_id baseado em findings que vazaram pra producao. Ate auditor entrar em modo rigoroso automatico apos `miss_count >= 3` (heuristica de aprendizado).

### Compativel com `audit-arbiter` (PRD-004 US-120 AC-120-4)

Quando 2 auditores produzem findings contraditorios no mesmo `file`, `audit-arbiter` (agente novo) consolida em 1 finding com `decidido-por: audit-arbiter`. Bruno ve 1 orientacao consolidada.

## Alternativas consideradas

### Alternativa 1 — Continuar so com audit_sha (recusada)

Sem rastreio de finding. Vantagem: zero mudanca. Desvantagens: dor diagnosticada permanece; finding crítico pode vazar pra producao silenciosamente.

**Recusada.** US-120 nao avanca sem isso.

### Alternativa 2 — Findings em SQLite local (recusada)

Tabela relacional pra cross-query. Desvantagens: quebra Node puro; complexidade desnecessaria; JSONL ja resolve.

**Recusada.** JSONL local.

### Alternativa 3 — Findings em GitHub Issues (recusada)

Cada finding vira issue. Vantagens: visualizacao boa; integracao com PR. Desvantagens: requer GitHub (nem todo projeto tem); custo de API; depende de rede; quebra local-first.

**Recusada.** Local-first nao-negociavel.

### Alternativa 4 — Marker estruturado dentro de mensagem de commit (recusada)

Auditor escreve findings dentro da msg do proprio marker (sem JSONL separado). Vantagens: menos arquivos. Desvantagens: 1 finding por arquivo; query cruzada fica ruim; nao escala pra > 5 findings.

**Recusada.** Arquivo separado escalavel.

## Consequencias

### Positivas

- Resolution tracker real: commit referencia finding → hook valida → status muda
- Auditoria humana externa (DPO, contador) ganha dossier rastreavel por sessao
- Audit-bias acumula historico pra heuristica de aprendizado
- Tier `todo-post-release` resolve falso bloqueio (nem tudo precisa parar merge)
- `audit-arbiter` evita conflitos invisiveis entre auditores
- `descricao_pt_br` + `como_arrumar_pt_br` ajudam Bruno sem traducao manual

### Negativas

- Mais 3 arquivos JSONL por sessao (1 por auditor)
- Auditor precisa "saber" produzir findings estruturados — exige update nos prompts dos 3 auditores
- Dev precisa lembrar de citar `Fixes:` em commit msg (mitigado por hook que sugere)
- Risco de auditor classificar tudo como `todo-post-release` pra nao bloquear (mitigado por Otavio + audit-bias)

### Compativel com

- **ADR-001** (Node puro zero-deps) — JSONL local
- **ADR-020** (audit_sha) — coexiste, camadas complementares
- **ADR-023** (Framework aprendiz) — audit-bias.json e materia-prima de Otavio
- **ADR-031** (Preservacao de capacidade) — auditor continua podendo nao-bloquear (tier `todo-post-release` e `info`)
- **LGPD-004** — descricao_pt_br nao deve conter PII; usar `<mascarado>` (sustenta SEC-006)
- **INV-001** — JSONL versionado em `.runtime/` (efemero mas auditavel cross-sessao via Otavio)

## Gatilhos de reabertura

- > 80% dos findings sendo `todo-post-release` → auditores fugindo do bloqueio, revisar prompt
- Findings com `descricao_pt_br` contendo PII → reforcar mascaramento via `mascarar-dado-pessoal` (skill existente)
- Hook `require-findings-resolved.js` causa > 5 falsos positivos em projeto cliente → revisar matching `Fixes: AF-NNN`

## Como verificar

- Rodar `/auditoria` em sandbox → 3 arquivos `audit-finding-{seg|qual|prod}-*.jsonl` criados
- Commit `feat(T-117-003): adiciona shouldSkipForPath\n\nFixes: AF-001, AF-003` → hook valida + muda status pra `closed-by-<sha>`
- Commit sem `Fixes:` com finding `must-fix-merge` aberto → exit 2 com mensagem clara
- Finding `info` aberto + commit feito → hook NAO bloqueia (passa)

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial — aguardando aceite do Roldao |
