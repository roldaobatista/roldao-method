---
description: Catálogo dos workflows do ROLDAO-METHOD com códigos curtos e quando usar cada um.
argument-hint: "[codigo opcional: IN | BF | PRD | EP | US | FT | QD | BG | RF | QA | AU | RT | RP | SP | ST | CK | RD | HP | SH]"
disable-model-invocation: true
---

# /help — catálogo dos 19 workflows

Se `$ARGUMENTS` é vazio, mostre o catálogo completo. Se `$ARGUMENTS` é um código (ex: `BG`), mostre detalhes do workflow correspondente.

## Catálogo

| Código | Comando | Quando usar |
|---|---|---|
| IN | `/inicio` | Projeto novo do zero |
| BF | `/brownfield` | Adotar framework em projeto que já existe |
| PRD | `/prd` | Iniciativa grande (várias semanas) |
| EP | `/epico` | Decompor iniciativa em stories |
| US | `/historia` | Criar 1 user story rastreável |
| FT | `/feature` | Implementar funcionalidade nova (ciclo completo) |
| QD | `/quick-dev` | Mudança trivial (≤3 arquivos, ≤50 linhas, sem banco/fiscal) |
| BG | `/bug` | Corrigir comportamento errado — REGRA #0 obrigatória |
| RF | `/refactor` | Reorganizar código sem mudar comportamento |
| QA | `/qa` | Gerar/auditar testes de uma área |
| AU | `/auditoria` | Passar pelos 3 auditores (seg + qualidade + produto) |
| RT | `/retro` | Retrospectiva 4L pós-marco |
| RP | `/replanejar` | Escopo mudou no meio — correct-course |
| SP | `/sprint` | Plano sequencial das próximas N stories |
| ST | `/status` | "Como tá indo?" em PT-BR sem jargão |
| CK | `/checkpoint` | Walkthrough de PR/branch antes de merge |
| RD | `/readiness` | Gate entre épico e dev (PRD/ARQ/stories prontos?) |
| HP | `/help` | Este comando |
| SH | `/shard` | Quebra PRD/ARQ longo em chunks navegáveis |

## Cenários comuns

### Não sei por onde começar
1. **Projeto novo:** `/inicio`
2. **Adotar em legado:** `/brownfield`

### Acabei de fazer brief, quero virar produto
1. `/prd <iniciativa>` → gera PRD
2. `/epico` → quebra em stories
3. `/readiness <EP-NNN>` → confere se tá pronto
4. `/sprint <EP-NNN>` → sequencia
5. `/feature <US-NNN>` (primeira story)

### Bug em produção
1. `/bug <descrição do bug>` → REGRA #0 dispara investigador
2. (não pula etapas, não chuta solução)

### Mudança trivial (ex: trocar label)
- `/quick-dev <descrição>` — sem investigador, sem 3 auditores. Use APENAS se ≤3 arquivos e ≤50 linhas.

### Subir pra produção
1. `/checkpoint <branch>` → walkthrough
2. Se aprovado, mergear
3. `/retro` ao fim do marco

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

- **Workflows do projeto ≠ comandos do harness Claude Code.** Este help cobre só os workflows ROLDAO-METHOD.
- **Códigos curtos** servem pra falar rápido com o agente ("vamos rodar BG agora"), não substituem o comando completo.
