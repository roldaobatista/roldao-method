---
description: Catálogo dos workflows do ROLDAO-METHOD com códigos curtos e quando usar cada um.
argument-hint: "[codigo opcional: IN | BF | PRD | EP | US | CL | FT | QD | BG | HF | IPM | RF | QA | AU | AR | CN | EC | RT | RP | SP | ST | CK | RL | RD | HP | SH]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep
model: haiku
---

# /help — catálogo dos 26 workflows

Se `$ARGUMENTS` é vazio, mostre o catálogo completo. Se `$ARGUMENTS` é um código (ex: `BG`), mostre detalhes do workflow correspondente.

## Catálogo

| Código | Comando | Quando usar | Cadeia de agentes |
|---|---|---|---|
| IN | `/inicio` | Projeto novo do zero | Sofia → Rafael → Bruno |
| BF | `/brownfield` | Adotar framework em projeto que já existe | Detetive → Rafael → Sofia → Caio |
| PRD | `/prd` | Iniciativa grande (várias semanas) | Mariana → Sofia → Rafael → Carla |
| EP | `/epico` | Decompor iniciativa em stories | Mariana → Sofia → Rafael |
| US | `/historia` | Criar 1 user story rastreável | Sofia → Detetive |
| CL | `/clarificar` | Tirar ambiguidade ANTES de codar | Sofia |
| FT | `/feature` | Funcionalidade nova (ciclo completo) | Sofia → Detetive → Rafael → Bruno → Revisor → Caio+Julia+Pedro |
| QD | `/quick-dev` | Mudança trivial (≤3 arquivos, ≤50 linhas) | Bruno → Revisor |
| BG | `/bug` | Corrigir comportamento — REGRA #0 | **Detetive (obrigatório)** → Bruno → Revisor |
| HF | `/hotfix` | Incidente urgente em produção (cliente parado, SEFAZ off, Pix duplicado) | Detetive (rápido) → Bruno → Revisor → `/incident-postmortem` em 48h |
| IPM | `/incident-postmortem` | Pós-incidente: timeline, LGPD-006/ANPD, ação corretiva | Detetive → 3 auditores em paralelo → Tech-writer |
| RF | `/refactor` | Reorganizar sem mudar comportamento | Rafael → Bruno → Revisor |
| QA | `/qa` | Gerar/auditar testes de uma área | Detetive → Julia → Bruno → Revisor |
| AU | `/auditoria` | 3 auditores em paralelo | Caio + Julia + Pedro |
| AR | `/auditoria-reversa` | Diagnóstico de repo legado (discovery) | Detetive → 3 auditores → Tech-writer |
| CN | `/consistencia` | Cross-check doc↔código | Detetive → Caio + Julia + Pedro |
| EC | `/explicar-para-cliente` | Traduz último output técnico pra linguagem de cliente não-técnico | Tech-writer + skill traduzir-jargao |
| RT | `/retro` | Retrospectiva 4L pós-marco | (sem agente) |
| RP | `/replanejar` | Escopo mudou no meio | Sofia → Tech-writer |
| SP | `/sprint` | Plano sequencial das próximas N stories | Sofia |
| ST | `/status` | "Como tá indo?" em PT-BR sem jargão | Tech-writer |
| CK | `/checkpoint` | Walkthrough de PR/branch antes de merge | (walkthrough) |
| RL | `/release` | Fechar marco: versão, CHANGELOG, tag | Tech-writer |
| RD | `/readiness` | Gate entre épico e dev | Detetive → Rafael |
| HP | `/help` | Este comando | (catálogo) |
| SH | `/shard` | Quebra PRD/ARQ longo em chunks | (fatiamento) |

> Detalhe de cada agente: `.claude/agents/MAPA-VISUAL.md` ou `.claude/agents/<nome>.md`.

## Cenários comuns

### Não sei por onde começar
1. **Projeto novo:** `/inicio`
2. **Adotar em legado:** `/brownfield`

### Ideia ainda vaga, não sei o escopo
1. `/clarificar <ideia>` → tira ambiguidade, fixa AC e non-goals
2. `/historia` ou `/prd` (conforme o tamanho)

### Acabei de fazer brief, quero virar produto
1. `/clarificar <iniciativa>` → afina antes de formalizar
2. `/prd <iniciativa>` → gera PRD
3. `/epico` → quebra em stories
4. `/readiness <EP-NNN>` → confere se tá pronto
5. `/sprint <EP-NNN>` → sequencia
6. `/feature <US-NNN>` (primeira story)

### Bug em produção
1. `/bug <descrição do bug>` → REGRA #0 dispara investigador
2. (não pula etapas, não chuta solução)

### Mudança trivial (ex: trocar label)
- `/quick-dev <descrição>` — sem investigador, sem 3 auditores. Use APENAS se ≤3 arquivos e ≤50 linhas.

### Subir pra produção
1. `/consistencia` → confere se doc e código batem (acha órfãos)
2. `/checkpoint <branch>` → walkthrough → `/release` quando aprovado
3. Se aprovado, mergear
4. `/retro` ao fim do marco

## Se `$ARGUMENTS` é um código

Mostre detalhe do comando correspondente:
- Nome
- Para quando
- Que agentes invoca
- Que artefatos gera
- Tempo médio esperado
- Comando relacionado a rodar antes/depois

Exemplo: `/help BG` mostra detalhe completo de `/bug`.

## Importante

- Este help cobre só os 26 workflows ROLDAO-METHOD (slash commands do framework). Comandos nativos do Claude Code (`/clear`, `/config`, etc.) ficam fora.
- **Códigos curtos** servem pra falar rápido ("vamos rodar BG agora"), não substituem o comando completo.
