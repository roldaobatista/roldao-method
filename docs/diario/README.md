---
owner: tech-writer
revisado-em: 2026-05-26
status: stable
---

# Pasta `docs/diario/`

> Diario de sessao automatico. Gerado pelo hook `session-diary.js` (US-119 AC-119-7) ao final de cada sessao Claude Code que produziu trabalho relevante.

## O que mora aqui

### `AAAA-MM-DD-HHmm.md` — Diario de 1 sessao

Gerado pelo hook `session-diary.js` em SessionEnd (depois do snapshot, antes do cleanup). Conteudo:

- Arquivos tocados (`git diff --stat HEAD@{session_start}`)
- Comandos rodados (lido de `metrics.jsonl`)
- Agentes invocados (markers `*-done-*`)
- Custo aproximado da sessao
- Proximo passo sugerido (lido de `investigation-*.json` + `pipeline-state-*.json`)

Exemplo: `2026-05-26-1430.md`.

## Diferenca de `docs/learning/`

| `docs/diario/` | `docs/learning/` |
|---|---|
| Granular — 1 arquivo por sessao | Agregado — 1 arquivo por mes |
| Automatico (hook) | Manual ou cron |
| Foco operacional (o que foi feito) | Foco institucional (o que aprendemos) |

## Quem le

- **Roldao** — pra responder "o que aconteceu segunda-feira de manha?" sem abrir transcript inteiro
- **Camila (tech-writer)** — agrega varios diarios em diario mensal de aprendizado
- **Otavio (meta-cetico)** — cruza diarios com hook-stats pra detectar padrao

## Politica de retencao

- 90 dias por padrao
- Apos 90 dias: hook `purge-old-diary.js` (lifecycle) move pra `.history/`

## Compativel com

- **INV-001** — sessao vira doc versionado
- **ADR-023** — Framework Aprendiz: diarios sao input pro Otavio
- **LGPD-001** — diarios NAO contem PII (so paths de arquivo + ID de agente + duracao)
- **ADR-031** — diarios sao aditivos, nao removem CHANGELOG nem release notes
