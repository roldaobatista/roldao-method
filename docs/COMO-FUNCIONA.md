---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Como funciona — fluxos e estrutura

> **TL;DR**
> 1. **`/inicio` ou `/brownfield`** → produz `AGENTS.md` + 1ª story.
> 2. **`/feature US-NNN`** → Sofia → Detetive → Rafael → Bruno → Revisor → 3 auditores (paralelo) → Checkpoint → Commit.
> 3. **`/bug`** sempre começa pelo Detetive (REGRA #0 — hook bloqueia).
> 4. **3 camadas de proteção:** hooks (exit 2 imediato) + agentes (papel humano) + workflows (sequência).
> 5. **Commit rastreável:** `feat(escopo): X (US-NNN T-NNN)`.

Para aprender pelo exemplo: [`EXEMPLO-FEATURE-COMPLETA.md`](EXEMPLO-FEATURE-COMPLETA.md). Para resolver problemas: [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md).

## Estrutura instalada

```
seu-projeto/
├── AGENTS.md                      <- contrato canônico (você customiza)
├── CLAUDE.md                      <- adendo do Claude Code (importa @AGENTS.md)
├── REGRAS-INEGOCIAVEIS.md         <- regras com IDs rastreáveis
├── .claude/
│   ├── settings.json              <- permissões + hooks (versionado)
│   ├── settings.local.json        <- pessoal (não versionar)
│   ├── agents/                    <- 13 especialistas
│   ├── hooks/                     <- ~30 hooks (bloqueadores + lifecycle + utilitários)
│   ├── commands/                  <- 22 workflows
│   ├── skills/                    <- 8 skills BR core (+14 em addons)
│   ├── output-styles/
│   └── rules/                     <- regras com paths: (criar quando precisar)
├── .specify/
│   ├── memory/constitution.md     <- manifesto (6 princípios)
│   ├── templates/                 <- PRD, story, architecture, decision-log
│   └── overrides/                 <- override de templates (não versionado pelo update)
├── .mcp.json                      <- MCP servers (opcional)
└── docs/
    ├── prd/                       <- PRD-NNN-slug.md
    ├── stories/                   <- US-NNN-slug.md
    ├── decisions/                 <- ADR-NNNN-slug.md
    ├── arquitetura/               <- ARQ-NNN.md
    ├── research/                  <- briefs do analista
    ├── ux/                        <- UX-NNN-slug.md
    ├── readiness/                 <- EP-NNN-status.md (gate /feature)
    ├── checkpoints/               <- CHK-AAAA-MM-DD-slug.md
    └── retros/                    <- AAAA-MM-DD-marco.md
```

## Os 22 workflows

| Comando | Quando | Agentes principais |
|---|---|---|
| `/inicio` | Projeto novo do zero | gerente-produto → tech-lead → dev-senior |
| `/brownfield` | Adotar em projeto existente | investigador → tech-lead → gerente-produto → auditor-segurança |
| `/prd` | Iniciativa grande (vários meses) | analista → gerente-produto → tech-lead → (ux) → decomposição |
| `/epico` | Decompor iniciativa em stories | analista → gerente-produto → tech-lead |
| `/historia` | Criar 1 story em disco | gerente-produto → investigador |
| `/clarificar` | Tirar ambiguidade antes de codar | gerente-produto |
| `/feature` | Implementar funcionalidade | Sofia → Detetive → Rafael → Bruno → Revisor → 3 auditores |
| `/bug` | Corrigir comportamento (REGRA #0) | **investigador (obrigatório)** → dev-senior → revisor |
| `/refactor` | Reorganizar sem mudar comportamento | tech-lead → dev-senior → revisor |
| `/qa` | Testes de uma área | investigador → auditor-qualidade → dev-senior → revisor |
| `/auditoria` | 3 auditores em paralelo | auditor-segurança + auditor-qualidade + auditor-produto |
| `/consistencia` | Cross-check doc↔código | investigador → 3 auditores |
| `/quick-dev` | Mudança trivial (≤3 arquivos) | dev-senior → revisor |
| `/readiness` | Gate entre `/epico` e `/feature` | investigador → tech-lead |
| `/shard` | Quebrar PRD/ARQ longo em chunks | (fatiamento, sem agente) |
| `/sprint` | Plano sequencial de próximas stories | gerente-produto |
| `/replanejar` | Mudança de escopo no épico | gerente-produto → tech-writer |
| `/status` | Reportar progresso em PT-BR | tech-writer |
| `/checkpoint` | Walkthrough de branch antes do merge | (sem agente) |
| `/release` | Fechar marco: versão, CHANGELOG, tag, nota | tech-writer |
| `/retro` | Retrospectiva pós-marco (4L) | (sem agente) |
| `/help` | Catálogo dos 22 comandos | (sem agente) |

### Fluxo principal — `/feature US-NNN`

```
US-NNN (ou descrição → vira US)
   ↓ Etapa 0: gate /readiness PRONTO (hook bloqueia se não)
Sofia (gerente-produto) — estrutura US com AC testáveis + non-goals
   ↓
Detetive (investigador) — lê código existente, mapeia impacto SEM escrever
   ↓
Rafael (tech-lead) — ADR se exige decisão arquitetural (senão skip explícito)
   ↓
Bruno (dev-senior) — implementa + testes (TDD onde aplicável)
   ↓
Revisor — aderência à US + anti-padrões
   ↓
3 Auditores em paralelo — segurança + qualidade + produto (com hash do diff)
   ↓
Checkpoint — walkthrough salvo em docs/checkpoints/
   ↓
"FEATURE ENTREGUE"
```

### Fluxo crítico — `/bug` (REGRA #0)

```
sintoma reportado
   ↓
Detetive OBRIGATÓRIO — lê banco, log, payload, código
   ↓
relatório com causa raiz em JSON (.claude/.runtime/investigation-*.json)
   ↓
Dev Sênior — corrige no PONTO RAIZ (não no sintoma)
   ↓
Revisor — confirma que `nao_fazer[]` do investigador não foi violado
   ↓
"BUG RESOLVIDO"
```

Hook `require-investigador-before-fix.sh` bloqueia Edit/Write em código de negócio se o Detetive não rodou. Sem bypass implícito.

## Os 13 agentes

| Agente | Papel | Modelo |
|---|---|---|
| `analista` | Pesquisa de mercado, brief, PRFAQ, regulamentação | haiku |
| `gerente-produto` | PRD, story, decomposição (3 modos) | haiku |
| `ux-designer` | Wireframe ASCII, estados, mensagens PT-BR | haiku |
| `tech-lead` | Arquitetura, ADR, ARQ, readiness check | sonnet |
| `investigador` | Lê estado real antes de mudar (REGRA #0) | sonnet |
| `dev-senior` | Implementa com TDD onde aplicável | sonnet |
| `dba-dados` | Modelagem, índices, performance, migration, LGPD em repouso | sonnet |
| `revisor` | Defeitos técnicos no diff | sonnet |
| `auditor-seguranca` | LGPD, secrets, OWASP | sonnet |
| `auditor-qualidade` | Cobertura agregada, mocks indevidos | sonnet |
| `auditor-produto` | Aderência ao pedido, non-goals | haiku |
| `fiscal-br` | NF-e, certificado, eSocial, reforma tributária | sonnet |
| `tech-writer` | CHANGELOG, release notes, msg de commit | haiku |

## Os 8 skills BR core

| Skill | Função |
|---|---|
| `gerar-adr-pt-br` | Cria ADR-NNNN-slug.md a partir do template |
| `traduzir-jargao` | Traduz texto técnico pra PT-BR sem jargão |
| `validar-cpf-cnpj` | Valida CPF e CNPJ numérico + alfanumérico (jul/2026) |
| `validar-pix` | Valida chave Pix + EndToEndId + TxId |
| `validar-cep` | Valida CEP (formato + opcional ViaCEP) |
| `checklist-lgpd` | Aplica árvore de decisão de base legal + 10 checks |
| `brainstormar-ideia` | Menu de 15 técnicas BR (Seis Chapéus, SCAMPER, 5 Porquês...) |
| `gerar-test-fixture-br` | CPF/CNPJ/CEP/E.164 válidos pra mock |

Addons trazem +14 skills (Pix, NF-e, NFC-e, SAT, eSocial, LGPD operacional, balança/impressora, Open Finance, SQLite seguro pro Electron).

## A regra mestre

> **Regra crítica vira hook, não só doc.**

Doc explica o quê e o porquê. Hook impede o agente de fazer o errado. Os dois são complementares: `REGRAS-INEGOCIAVEIS.md` tem os IDs, `settings.json` registra os hooks que os fazem cumprir, `.claude/rules/roldao-method.md` tem a tabela hook→regra.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
