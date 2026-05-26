---
owner: tech-writer
revisado-em: 2026-05-26
status: stable
---

# Pasta `docs/learning/`

> Diario mensal de aprendizado do framework. Materializa o conceito **Framework Aprendiz** (ADR-023).

## O que mora aqui

### `AAAA-MM.md` — Diario mensal

Gerado por Camila (tech-writer) modo `--diario-aprendizado` (US-121 AC-121-4). 1x por mes (manual via `/aprendizado-mensal` OU automatico em SessionStart no dia 1).

Conteudo:
- Hooks que mais dispararam no mes
- Regras propostas por Otavio (meta-cetico)
- Regras que viraram sunset
- Padrao de erro do agente que se repetiu
- Feedback do Roldao que ainda nao virou regra

Exemplo: `2026-06.md`, `2026-07.md`.

### `AAAA-MM-DD-meta-cetico-rN.md` — Relatorio do Otavio

Saida do agente `meta-cetico` (Otavio) quando `/auto-auditar-framework` roda. Propostas de regra nova + sunset.

Exemplo: `2026-06-15-meta-cetico-r1.md`.

### `AAAA-MM-DD-brief-<framework>.md` — Brief de framework externo

Saida do Cintia (analista) quando `/brief-framework <nome>` roda. Compara com framework externo (spec-kit, Cline, Cursor, agents.md spec).

Exemplo: `2026-07-22-brief-cursor.md`.

## Quem le

- **Roldao** — le mensal pra acompanhar evolucao
- **Otavio** — le proprio historico pra evitar repropor candidato rejeitado
- **Mantenedor de addon** — le pra ver tendencias antes de publicar nova versao

## Politica de retencao

- Diarios mensais: indefinidamente (sao historia do framework)
- Relatorios do Otavio: 12 meses (apos isso, mover pra `.history/`)
- Briefs de framework externo: 6 meses (apos isso, releitura provavelmente justifica brief novo)

## Compativel com

- **INV-001** — aprendizado vira doc versionado, nao memoria de conversa
- **ADR-023** — Framework Aprendiz: meta-cetico nunca aplica sozinho; saida e sempre `.md` aguardando Roldao
- **LGPD-001** — diarios NAO contem PII (so hash de projeto)
