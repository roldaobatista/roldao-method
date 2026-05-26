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
relacionado: [ADR-020, ADR-024]
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Auditoria de fluxo interno (10 agentes) — `docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §1 (F1)"
  sintoma-observado: "Sofia escreve sofia-done-<sess> vazio. Detetive abre o marker e nao tem ideia de quais ACs Sofia priorizou — re-le PRD inteiro. Bruno re-le tudo do disco. Contexto perdido a cada handoff."
---

# ADR-025 — Handoff payload tipado entre agentes

> Decisao **aceita** em 2026-05-26 pelo Roldao.

---

## Contexto

A v2.0.0 evoluiu marker de auditor pra JSON com `audit_sha` + `lido_de` (ADR-020). Mas Sofia/Detetive/Rafael/Bruno/Ines ainda criam **arquivo vazio** como sinal de "terminei". Resultado:

- Detetive abre `sofia-done-<sess>` e nao sabe quais ACs Sofia destacou como criticas
- Rafael nao sabe se Detetive descartou hipoteses ou so nao olhou (faltam evidencias positivas e negativas)
- Bruno re-le PRD inteiro porque nao tem lista curta dos arquivos relevantes apontados pelo Detetive
- Re-trabalho por sessao, perda de contexto quando muda de sessao

ADR-020 ja provou que JSON tipado funciona pra auditores. Falta generalizar pros agentes da fase de planejamento/implementacao.

## Decisao

**Cada agente, ao concluir etapa, escreve `.claude/.runtime/handoff/<from>-para-<to>-<sess>.json` com payload tipado. Schema versionado em `.specify/schemas/handoff-payload.schema.json`. Hook `require-handoff-payload.js` (PostToolUse SubagentStop) emite soft warning em v3.0.0, bloqueia em v3.1.0 — modo aprende ate massa critica adotar.**

### Schema (`handoff-payload.schema.json`)

```json
{
  "version": 1,
  "from": "gerente-produto",
  "to": "investigador",
  "us_id": "US-117",
  "session_hash": "abc123",
  "written_at": "2026-05-26T14:05:18Z",
  "ac_destacadas": ["AC-117-1", "AC-117-4"],
  "hipoteses_a_investigar": [
    "Hook anti-mascaramento custa 80ms — verificar com timer real",
    "Sentinels existem ja em runtime — confirmar quais sao efemeros"
  ],
  "decisoes_propostas": [
    "Adicionar @hook-meta frontmatter aos 44 hooks",
    "Manifest gerado por script, nao manual"
  ],
  "arquivos_relevantes": [
    ".claude/hooks/_lib.js",
    ".claude/hooks/anti-mascaramento.js",
    ".claude/settings.json"
  ],
  "proximas_perguntas": [
    "Qual hook tem maior custo medido em 100 edits?",
    "Hook customizado pelo usuario precisa de migracao automatica?"
  ],
  "confianca": "alta",
  "marker_sha": "f3a2b1c..."
}
```

### Campos

| Campo | Tipo | Obrigatorio | Descricao |
|---|---|---|---|
| `version` | int | sim | Versao do schema. 1 hoje. |
| `from`, `to` | string | sim | ID do agente origem/destino |
| `us_id` | string | sim | Story em curso |
| `session_hash` | string | sim | Hash da sessao Claude Code |
| `written_at` | ISO-8601 | sim | Quando o payload foi escrito |
| `ac_destacadas` | string[] | sim | IDs de AC priorizadas (ex: AC-117-1, AC-117-4) |
| `hipoteses_a_investigar` | string[] | sim em PRE-investigador, opcional depois | Lista de coisas a checar |
| `decisoes_propostas` | string[] | sim em PRE-tech-lead, opcional depois | Decisoes que precisam de ADR ou nao |
| `arquivos_relevantes` | string[] | sim | Lista curta de paths (≤10) — evita re-leitura desnecessaria |
| `proximas_perguntas` | string[] | opcional | Duvidas a esclarecer no proximo agente |
| `confianca` | enum | sim | `alta` \| `media` \| `baixa` — sinal pra Maestro/vigia-fluxo |
| `marker_sha` | string | sim | Hash do estado do diff no momento (referencia ADR-020) |

### Pares canonicos

Caminhos esperados em pipeline `/feature`:

```
gerente-produto → investigador     (Sofia → Detetive)
investigador → tech-lead           (Detetive → Rafael)
tech-lead → dev-senior             (Rafael → Bruno)
dev-senior → revisor               (Bruno → Ines)
revisor → auditor-seguranca        (Ines → Caio)
revisor → auditor-qualidade        (Ines → Julia)
revisor → auditor-produto          (Ines → Pedro)
```

Em `/bug`, `/hotfix`, `/quick-dev`: subconjuntos.

### Modo aprende vs bloqueio

| Versao | Comportamento do `require-handoff-payload.js` |
|---|---|
| v3.0.0 | Soft warning quando agente fecha sem payload. Marker legado (vazio) ainda valido. |
| v3.1.0 | Bloqueio: agente que fechar sem payload nao destrava o proximo. |
| v4.0.0 | Marker vazio nao e mais aceito de jeito nenhum. |

### Compativel com ADR-024

`pipeline-state-<US>.json` (ADR-024) tem campo `handoff_payload_path` em cada etapa. Aponta pro JSON criado por este ADR. Maestro le ambos em conjunto.

### Compativel com agente cetico (ADR-023)

Otavio (meta-cetico) le payloads com `confianca: baixa` ao longo do tempo. Se um agente especifico produz `baixa` em > 30% dos handoffs, Otavio propoe revisao de prompt do agente.

## Alternativas consideradas

### Alternativa 1 — Continuar com marker vazio (recusada)

Sem mudanca. Vantagem: zero risco. Desvantagens: 3 dores diagnosticadas permanecem; agentes re-leem disco; contexto perdido entre sessoes.

**Recusada.** US-119 nao avanca sem isso.

### Alternativa 2 — Payload em YAML em vez de JSON (recusada)

YAML mais legivel pra humano. Desvantagens: parsing exige biblioteca externa (quebra Node puro zero-deps) OU implementacao caseira fragil. JSON ja resolve.

**Recusada.** JSON nativo no Node.

### Alternativa 3 — Payload no body de markdown comentado em vez de JSON separado (recusada)

Sofia escreve no proprio `docs/stories/US-NNN.md` como comentario HTML. Vantagens: 1 arquivo so, versionavel. Desvantagens: trafego de versao confuso (story muda toda hora durante pipeline); leitor precisa parsear HTML comment + JSON dentro; reuse cross-session fica complicado.

**Recusada.** Arquivo separado em `.claude/.runtime/handoff/` mantem rastreio + facilita gc.

### Alternativa 4 — Payload imutavel via SQLite (recusada)

Persistir em tabela. Vantagens: queries cruzadas, integridade. Desvantagens: quebra Node puro; cresce indefinidamente sem GC; complexidade desnecessaria pro caso.

**Recusada.** JSONL local resolve.

## Consequencias

### Positivas

- Detetive economiza 1 leitura completa de PRD por story.
- Bruno recebe lista curta de arquivos relevantes do Detetive em vez de descobrir sozinho.
- `--continue` rehidrata pelo handoff payload (Maestro le os payloads ate o ultimo, deduz onde parou).
- Auditoria humana externa ganha trilha rastreavel: "Sofia destacou AC-117-1 com confianca alta; Detetive confirmou".
- Otavio (meta-cetico) ganha materia-prima pra propor revisao de agente com `confianca: baixa` cronica.

### Negativas

- Mais 1 arquivo JSON por handoff em `.claude/.runtime/handoff/` — ~1-3KB cada. Rotacao automatica em 30 dias.
- Agente precisa "saber" gerar payload — exige update nos prompts dos 17 agentes.
- Risco de payload mal-preenchido (confianca: alta em conteudo ruim) — mitigado por Otavio + revisor.

### Compativel com

- **ADR-001** (Node puro) — JSON nativo
- **ADR-020** (audit_sha em markers) — `marker_sha` no payload referencia o mesmo contrato
- **ADR-024** (Pipeline state JSON) — `handoff_payload_path` aponta pra este arquivo
- **INV-001** — payload e doc executavel versionada (mesmo que efemera em `.runtime/`)
- **INV-AGENT-005** — modo aprende em v3.0.0 evita bloqueio sem aviso

## Gatilhos de reabertura

- Payload mediano > 5KB → revisar campos obrigatorios, simplificar
- Agentes produzindo `confianca: alta` em > 90% dos casos → suspeitar de viés positivo, revisar prompt
- Adocao em < 50% dos handoffs em projetos clientes apos 90 dias → revisar modo aprende vs bloqueio

## Como verificar

- Rodar `/feature US-117` em sandbox → verificar que `.claude/.runtime/handoff/gerente-produto-para-investigador-*.json` aparece.
- `cat .claude/.runtime/handoff/sofia-para-detetive-*.json | jq .ac_destacadas` retorna array com IDs de AC.
- Fechar agente sem produzir payload em v3.0.0 → stderr exibe soft warning.
- Mesmo cenario em v3.1.0 → exit 2.

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial — aguardando aceite do Roldao |
