---
description: Catálogo dos workflows do ROLDAO-METHOD com códigos curtos e quando usar cada um.
argument-hint: "[codigo opcional: IN | BF | PRD | EP | US | CL | FT | QD | BG | HF | IPM | RF | QA | AU | AR | CN | EC | RT | RP | SP | ST | CK | RL | RD | HP | SH]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep
model: haiku
---

# /help — catálogo dos 28 workflows

Se `$ARGUMENTS` é vazio, mostre PRIMEIRO a árvore de decisão abaixo, DEPOIS o catálogo. Se `$ARGUMENTS` é um código (ex: `BG`), mostre só detalhes do workflow correspondente (pule a árvore).

## Árvore de decisão (responda mentalmente)

```
Você tem um pedido. Que tipo de pedido é?

  ┌─ É algo que NÃO funciona como deveria?
  │     → /bug        (REGRA #0 — investiga antes de mexer)
  │
  ├─ É algo NOVO que precisa ser construído?
  │   │
  │   ├─ É projeto que ainda nem começou?
  │   │     → /inicio
  │   │
  │   ├─ Vai adotar no projeto que já existe?
  │   │     → /brownfield
  │   │
  │   ├─ É mudança pequena (1 label, 1 texto, ≤3 arquivos)?
  │   │     → /quick-dev
  │   │
  │   ├─ É uma funcionalidade comum (cabe em ~1 semana)?
  │   │     → /feature
  │   │
  │   └─ É iniciativa grande (várias semanas, muita gente)?
  │         → /prd → /epico → /feature (uma story de cada vez)
  │
  ├─ É EMERGÊNCIA em produção (cliente parado AGORA)?
  │     → /hotfix
  │
  ├─ Quer ENTENDER o que está acontecendo?
  │   │
  │   ├─ Não entendi a última resposta técnica  → /explicar-para-cliente
  │   ├─ Como está o projeto, o que falta       → /status
  │   ├─ Vale a pena subir pra produção?        → /checkpoint
  │   └─ Quero ver TUDO que dá pra fazer        → /help (este)
  │
  └─ Quer CONFERIR a saúde do código?
        → /auditoria      (3 auditores em paralelo)
        → /consistencia   (doc bate com o código?)
```

**Regra simples:** se não souber, use `/clarificar` — o agente te ajuda a descobrir qual comando se encaixa.

## Catálogo

| Código | Comando | Quando usar | Cadeia de agentes |
|---|---|---|---|
| IN | `/inicio` | Projeto novo do zero | Sofia → Rafael → Bruno |
| BF | `/brownfield` | Adotar framework em projeto que já existe | Detetive → Rafael → Sofia → Caio |
| PRD | `/prd` | Iniciativa grande (várias semanas / muitas stories) | Mariana → Sofia → Rafael → Carla |
| EP | `/epico` | Decompor iniciativa em stories (coleção de stories) | Mariana → Sofia → Rafael |
| US | `/historia` | Criar 1 user story rastreável (1 story) | Sofia → Detetive |
| CL | `/clarificar` | Tirar ambiguidade ANTES de codar (ideia vaga) | Sofia |
| FT | `/feature` | Funcionalidade nova ciclo completo (1 story implementada) | Sofia → Detetive → Rafael → Bruno → Revisor → Caio+Julia+Pedro |
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

## Validações prontas pro Brasil (13 skills core)

O assistente invoca automaticamente quando detecta o gatilho. Você não precisa lembrar o nome.

| Skill | Pra que serve |
|---|---|
| `validar-cpf-cnpj` | Valida CPF/CNPJ (numérico + alfanumérico jul/2026) |
| `validar-chave-acesso-nfe` | Valida chave 44 dígitos de NF-e/NFC-e/CT-e/MDF-e |
| `validar-codigo-municipio-ibge` | Valida código IBGE (7 dígitos + DV módulo 10) |
| `validar-pix` | Valida chave Pix (CPF/CNPJ/email/celular/aleatória) + TxId + EndToEndId |
| `validar-cep` | Valida CEP + consulta ViaCEP opcional |
| `validar-ie` | Valida Inscrição Estadual por UF (27 algoritmos diferentes) |
| `validar-boleto` | Valida código de barras/linha digitável FEBRABAN |
| `gerar-br-code` | Gera QR Code Pix padrão EMV (estático ou dinâmico) |
| `gerar-test-fixture-br` | Gera CPF/CNPJ/CEP/telefone válidos por algoritmo (pra fixture) |
| `gerar-adr-pt-br` | Cria ADR no template oficial |
| `traduzir-jargao` | Reescreve texto técnico pra PT-BR sem jargão |
| `brainstormar-ideia` | Menu de 15 técnicas de brainstorming BR |
| `checklist-lgpd` | Checklist LGPD + árvore de decisão de base legal |

## Addons disponíveis (`npx roldao-method search`)

| Addon | Pra quem é |
|---|---|
| `fiscal-br-completo` | Quem emite NF-e/NFC-e/NFS-e/CT-e/MDF-e ou está na Reforma Tributária 2026-2033 |
| `fintech-br` | Quem integra Pix (BR Code, webhook HMAC, devolução) ou Open Finance |
| `lgpd-compliance` | Quem precisa de DPO, RIPD, canal do titular, plano de incidente 72h |
| `esocial-completo` | Quem manda eventos S-1000 a S-3000 pro eSocial |
| `electron-br` | Quem faz app de desktop pra Windows/Mac/Linux com SQLite local |
| `varejo-pdv-br` | Quem opera PDV/caixa com SAT-CF-e, NFC-e, TEF, integração balança |
| `healthtech-br` (beta) | Telemedicina CFM 2.314, prontuário ANS RN 305, CNS/SUS, TISS/TUSS |

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

- Este help cobre só os 28 workflows ROLDAO-METHOD (slash commands do framework). Comandos nativos do Claude Code (`/clear`, `/config`, etc.) ficam fora.
- **Códigos curtos** servem pra falar rápido ("vamos rodar BG agora"), não substituem o comando completo.
