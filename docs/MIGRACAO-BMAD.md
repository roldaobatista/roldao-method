---
owner: framework
revisado-em: 2026-05-17
status: stable
---

# Migração de BMAD-METHOD para ROLDAO-METHOD

Guia pra quem usa o **BMAD-METHOD** e quer adotar o **ROLDAO-METHOD** (ou usar os dois juntos).

## Por que migrar (ou não)

| Você usa BMAD e... | Recomendação |
|---|---|
| trabalha em projeto BR (LGPD/NF-e/Pix/fiscal) | migre — diferencial real |
| precisa que regra crítica BLOQUEIE (não só "lembre") | migre — hooks bloqueadores |
| time fala português | migre — não é tradução, é nativo |
| trabalha global, time anglo, sem regulação BR | continue BMAD |
| usa expansion packs de game dev | mantenha BMAD pra isso, use ROLDAO-METHOD em projetos paralelos |

## Mapeamento de conceitos

| BMAD-METHOD | ROLDAO-METHOD |
|---|---|
| `bmad-core/agents/*.md` | `.claude/agents/*.md` |
| `Mary` (Analyst) | `analista` |
| `John` (PM) | `gerente-produto` |
| `Winston` (Architect) | `tech-lead` |
| `Amelia` (Dev) | `dev-senior` |
| `bmad-code-review` | `revisor` |
| `bmad-investigate` | `investigador` (com REGRA #0 codificada) |
| QA skills | `auditor-qualidade` + `qa` command |
| Sem equivalente | `auditor-seguranca` |
| Sem equivalente | `auditor-produto` |
| Sem equivalente | `fiscal-br` |
| `bmad-create-prd` | `/prd` |
| `bmad-create-story` | `/historia` |
| `bmad-dev-story` | `/feature` |
| `bmad-investigate` | `/bug` |
| `bmad-create-architecture` | `/inicio` ou `/feature` (etapa tech-lead) |
| `bmad-quick-dev` | `/feature` direto pro dev-senior |
| `bmad-correct-course` | (em estudo — abrir issue se precisar) |
| `bmad-retrospective` | `/retro` |
| `bmad-generate-project-context` | `/brownfield` |
| Expansion packs | `addons/` (em construção — ver `addons/README.md`) |

## Diferenças filosóficas importantes

### 1. Hooks bloqueadores vs prompts disciplinares
**BMAD:** se o agente "esquecer" da regra, ninguém para.
**ROLDAO:** 7 hooks `PreToolUse` retornam exit 2 e barram tentativa de mascarar bug, comitar segredo, mocar integration test, etc.

### 2. Investigação obrigatória em bug
**BMAD:** `bmad-investigate` é skill opcional.
**ROLDAO:** `/bug` força o investigador como **primeira etapa não-pulável**. REGRA #0 é parte do design.

### 3. PT-BR não é localização
**BMAD:** README em inglês, alguns docs em chinês/vietnamita, **nada em PT-BR**.
**ROLDAO:** tudo nasceu em PT-BR. Tabela de tradução de jargão (`stack trace → "mensagem técnica de erro"`).

### 4. IDs rastreáveis até a regra
**BMAD:** sem ID universal pra regra.
**ROLDAO:** `LGPD-007`, `FISCAL-005`, `TST-001` citáveis em commit/PR.

### 5. Regulamentação BR embutida
**BMAD:** zero LGPD, zero NF-e, zero Pix.
**ROLDAO:** 10 IDs LGPD, 7 IDs FISCAL, 5 IDs PIX, skill `validar-cpf-cnpj` com CNPJ alfanumérico 2026 já suportado.

## Plano de migração

### Cenário A — projeto novo
Direto: `npx roldao-method install`. Esqueça BMAD.

### Cenário B — projeto BMAD ativo, quer trocar
1. Backup do `.bmad-core/` ou `.bmad/` em outro lugar.
2. `npx roldao-method install` — gera `.claude/`, `AGENTS.md`, etc.
3. Para cada documento BMAD que importa:
   - **PRDs** do BMAD → mover pra `docs/prd/PRD-NNN-slug.md`, ajustar frontmatter pro template do ROLDAO.
   - **Stories** do BMAD → mover pra `docs/stories/US-NNN-slug.md`.
   - **Architecture docs** do BMAD → fundir em `docs/arquitetura/ARQ-001.md`.
4. Rodar `/brownfield` no Claude Code pra preencher `AGENTS.md`.
5. Rodar `/auditoria` pra confirmar que regras LGPD/FISCAL estão sendo respeitadas.
6. Remover o `.bmad-core/` apenas depois de confirmar tudo OK.

### Cenário C — usar os dois lado a lado
- Mantenha `.bmad-core/` pra fluxos específicos do BMAD que você já domina.
- `npx roldao-method install` adiciona `.claude/` em paralelo.
- **Cuidado** com `AGENTS.md`/`CLAUDE.md` duplicados — escolha um como fonte canônica e cite o outro como complementar.
- Os hooks do ROLDAO só vão rodar sob Claude Code (não sob outras CLIs do BMAD).

## Por que não fizemos drop-in compatible

Filosofias divergentes: BMAD aposta em workflows guiados por prompt; ROLDAO aposta em **regras que param o agente**. Compatibilidade total significaria diluir essa aposta. Preferimos diferença clara a meio-termo confuso.

## Contribuir

Encontrou padrão de migração novo? Abra PR em https://github.com/roldaobatista/roldao-method/pulls.
