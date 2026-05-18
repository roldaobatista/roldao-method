---
title: Auditoria 10 Agentes — ROLDAO-METHOD vs BMAD-METHOD
data: 2026-05-18
versao-analisada-roldao: v0.4.0
versao-analisada-bmad: v6.7.0
metodologia: 10 agentes paralelos, 1 frente cada, fontes diretas (repo local + GitHub API/raw)
status: concluido
---

# Auditoria 10 Agentes — ROLDAO-METHOD vs BMAD-METHOD

Auditoria comparativa profunda (10 frentes em paralelo) entre **ROLDAO-METHOD v0.4.0** e **BMAD-METHOD v6.7.0**, executada em 2026-05-18. Cada frente foi conduzida por um agente independente lendo fontes diretas dos dois projetos.

---

## Sumário executivo

### Veredito em uma linha
ROLDAO **vence em verticalidade BR** (PT-BR nativo, hooks bloqueadores, KBs fiscal/LGPD/Pix, addons regulados); **perde em horizontalidade**, **maturidade de comunidade** e **rigor estrutural** (orquestração de skills, customização em camadas, evals, CLI rico, IDEs).

### Score por área (1-5, comparativo)

| Área | ROLDAO | BMAD | Quem lidera |
|---|---|---|---|
| 1. Estrutura e filosofia | 3 | 5 | BMAD (maturidade) |
| 2. Agentes/personas | 4 | 4 | Empate (ROLDAO mais agentes; BMAD mais estrutura) |
| 3. Comandos/workflows | 3 | 5 | BMAD (orquestração + pipeline) |
| 4. Skills | 2 | 5 | BMAD (44 vs 6+9; orquestração CSV) |
| 5. Hooks de validação | **5** | **0** | **ROLDAO (sem competidor)** |
| 6. Templates/checklists | 4 | 4 | Empate (ROLDAO ganha em BR; BMAD em flexibilidade) |
| 7. Knowledge Base | 4 | 4 | Empate (ROLDAO ganha em BR; BMAD em técnicas de raciocínio) |
| 8. Documentação | 4 | 4 | Empate (ROLDAO ganha em texto; BMAD em visual/social) |
| 9. CLI/instalação | 2 | 5 | BMAD (42 IDEs, wizard, npm publicado) |
| 10. Diferencial BR | **5** | 0 | **ROLDAO (sem competidor)** |

### 5 verdades duras
1. **`roldao-method` NÃO ESTÁ NO npm.** O `npx roldao-method install` do README é uma mentira até a publicação acontecer. Bloqueador #1 de adoção.
2. **Hooks são o maior diferencial técnico**, mas o teste (`test/install.test.js`) ainda valida 7 hooks quando existem 14 ativos. Promover "15 hooks" no README é incorreto (são 14 operacionais + 1 test-runner).
3. **Suporte a Cursor/Windsurf/Cline/Roo é decorativo**: o `install.js` detecta as IDEs mas só copia templates `.claude/*`. Outras IDEs ficam sem nada.
4. **Addons prometem templates que não existem**: `lgpd-compliance/README.md` cita 6 arquivos `templates/...` que precisam ser auditados (alguns provavelmente fantasma).
5. **BMAD aboliu `expansion-packs/` verticais**. Esta é a **maior janela competitiva do ROLDAO** — verticais BR (eSocial, varejo-pdv, saúde, marketplace, govtech) sem concorrente real.

---

## Achados por frente

### 1. Estrutura geral e filosofia

**ROLDAO** = framework BR-first, zero deps runtime, hooks bloqueadores, REGRA #0 codificada. Autor único, ~50-100 stars estimado, v0.4.0.
**BMAD** = framework horizontal global, 1.881 commits, 47.5k stars, 5.6k forks, 5+ módulos oficiais, `.claude-plugin/`, `evals/`, `website/`, governança madura (CONTRIBUTORS, SECURITY, TRADEMARK).

**Lacunas ROLDAO:**
- Sem `evals/` (medição automática de qualidade dos agentes)
- Sem manifesto formal de módulos (BMAD tem `bmad-modules.yaml`)
- Sem site dedicado (só README)
- Sem `SECURITY.md` / `CONTRIBUTORS.md`
- Sem `.claude-plugin/plugin.json` (distribuição como plugin nativo Claude Code)
- Sem comando `/ajuda` contextual (BMAD tem `bmad-help`)

### 2. Agentes/personas

ROLDAO tem **11 agentes** (todos com persona auto-contida em 1 .md). BMAD tem **6 agentes nomeados** (Mary, John, Winston, Amelia, etc.) + skills. ROLDAO ganha em quantidade e especialização (auditor-segurança, auditor-qualidade, auditor-produto, fiscal-br não existem no BMAD). Perde em estrutura: sem menu de comandos formal, sem nome/ícone (memorabilidade), sem camada de customização em 3 níveis (base→team→user), sem campo `skills:` declarando capacidades.

### 3. Comandos slash e workflows

ROLDAO: **12 commands** (`/inicio`, `/prd`, `/feature`, `/bug`, `/auditoria`, etc.). BMAD: pipeline declarado em 4 fases (analysis → plan → solutioning → implementation) com ~30 skills encadeadas via `module-help.csv` (`preceded-by`/`followed-by`).

**Faltam no ROLDAO:** `/replanejar` (correct-course), `/sprint`/`/status` (planejamento de execução), `/checkpoint` (review de PR/commit), `/readiness` (gate entre épico e dev), `/help` (catálogo), `/shard` (sharding de docs grandes), subcomandos `validar`/`editar` em `/prd` e `/historia`.

**Ganha do BMAD:** `/bug` com investigador OBRIGATÓRIO (REGRA #0 codificada), `/auditoria` com 3 lentes paralelas + veredito consolidado bloqueante, `/refactor` com pré-requisito de suite verde, `/quick-dev` com checklist de 6 critérios.

### 4. Skills

ROLDAO: **6 skills core + 9 nos addons = 15 totais**, todas BR. BMAD: **44 skills** (12 core + 32 BMM por fase). BMAD tem orquestração explícita via CSV manifest (`bmad-help.csv`) — ROLDAO não tem.

**Problemas técnicos:** `validar-pix/scripts/validar-pix.py` importa `validar-cpf-cnpj` via path hardcoded — quebra se reorganizar. Faltam skills genéricas: `brainstormar-ideia`, `decompor-historia`, `revisao-adversarial`, `sharding-doc`, `gerar-test-fixture-br` (devs colam "111.111.111-11" que falha na própria skill `validar-cpf-cnpj`).

### 5. Hooks de validação — **maior diferencial técnico**

**ROLDAO: 14 hooks operacionais** (9 bloqueadores via `exit 2`, 5 avisos). **BMAD: 0 hooks pro projeto do usuário** (só `.husky/pre-commit` do próprio repo BMAD).

**Bugs identificados:**
- `test/install.test.js` lista 7 hooks como exigidos quando existem 14 ativos — **regressão silenciosa**
- `_test-runner.sh` não roda em CI (só manual)
- `no-test-data-in-fixtures.sh` usa bash 4+ (quebra em macOS default)
- `block-destructive.sh` regex `git push.*-f ` falha pra `-f` no fim da linha
- `no-amend-after-push.sh` precisa `git fetch` recente (falso negativo sem fetch)
- `mcp-validator.sh` allowlist conservadora (ruidosa em projeto real)
- `commit-message-validator.sh` só olha `-m` inline
- `fiscal-br-validator.sh` regex `tpAmb=1` casa falso positivo em comentário
- Portabilidade Windows: depende de bash+perl (sem Git Bash quebra silenciosamente, não documentado)

**Hooks faltando:** `block-jargon-pt-br.sh` (crítico pro perfil do Roldão), `block-secrets-in-commit-message.sh`, `block-confirmation-questions.sh` (viola INV-AGENT-006), `require-investigador-before-fix.sh`, `validate-test-pyramid.sh`.

### 6. Templates e checklists

ROLDAO PRD genérico é **mais raso** que BMAD (9 vs ~30 subsecções). BMAD não tem `prd-fiscal`, `brownfield-prd` dedicado, `lgpd-privacy-review`, `fiscal-compliance` — todos diferenciais ROLDAO. BMAD tem `Dev Agent Record` / `Agent Model Used` na story (rastreabilidade IA) que ROLDAO não tem.

### 7. Knowledge Base

ROLDAO: **5 KBs BR atualizadas** (fiscal, LGPD, Pix, stack BR, PT-BR — total ~30KB) — **vantagem isolada**. BMAD: 60+ técnicas de brainstorming + 50 métodos de elicitation (`brain-methods.csv`, `methods.csv`) — **gap real do ROLDAO**.

Pequenas imprecisões em KBs: TxId Pix tradicional descrito mais permissivo do que o manual Bacen; DIRF "em extinção" sem citar prazo final (já extinta pra fatos geradores ≥ 2025); cancelamento NF-e tem casos de exceção SEFAZ-SP.

### 8. Documentação e onboarding

ROLDAO **vence em texto**: FAQ (104 linhas), TROUBLESHOOTING (143), MIGRACAO-BMAD (97), CASOS-DE-USO-BR (8 casos), ROADMAP transparente até v1.0. BMAD não tem nada disso dedicado.

ROLDAO **perde em visual/social**: sem logo, GIF, vídeo, screenshot, Discord, badge npm. BMAD tem banner + Discord + YouTube + i18n (CN/VN). README ROLDAO esconde "Por que ROLDAO vs BMAD" na linha 166 — devia estar no topo.

### 9. CLI, instalação e distribuição

- BMAD: **42 IDEs**, wizard `@clack/prompts`, módulos externos cacheados, npm publicado, testes ricos.
- ROLDAO: **7 IDEs detectadas mas só Claude Code recebe templates**, `readline` puro (sem wizard), npm **não publicado**, 1 smoke test só, addons não instaláveis pelo CLI.

**Gaps críticos:** `npm publish` pendente (bloqueia 100% adoção externa); addons sem comando `add`; sem update check (`v0.5.0 disponível`); sem alias `roldao`; sem CI cross-platform (Mac/Linux nunca exercitados); `uninstall` apaga pastas inteiras sem granularidade.

### 10. Diferencial BR e addons

ROLDAO tem **4 addons BR** (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br). BMAD **aboliu expansion-packs verticais** — só tem skills horizontais SDLC. **Janela competitiva enorme.**

**Verticais BR P0 a criar (sem competidor):**
1. `esocial-completo` (já no roadmap)
2. `sped-fiscal` (SPED Fiscal/Contribuições/ECD/ECF)
3. `varejo-pdv-br` (SAT-CF-e, NFC-e, TEF) — desbloqueia toda PME varejo
4. `saude-br` (ANS TISS/TUSS, CFM 2.314, telemedicina Lei 14.510)
5. `marketplace-br` (Mercado Livre, Magalu, Amazon BR, B2W, Shopee)
6. `govtech-br` (Gov.br SSO, ICP-Brasil, e-Protocolo, PJe)

**Stacks BR sem cobertura:** react-native-br, flutter-br, nextjs-br, rails-br, laravel-br, django-br, spring-boot-br.

**Defeito crítico:** addons prometem templates que não existem no repo (auditar `lgpd-compliance/README.md` cita 6 arquivos).

---

## Plano de ação priorizado (top 25)

### P0 — Bloqueadores (fazer esta semana)

1. **Publicar `roldao-method` no npm** (depende de credenciais — confirmar com Roldão). Sem isso `npx` do README é mentira.
2. **Atualizar `test/install.test.js`** pra exigir os 14 hooks (hoje exige 7) — regressão silenciosa.
3. **Rodar `_test-runner.sh` no CI** (GitHub Actions matriz Windows+Mac+Linux).
4. **Auditar templates prometidos pelos addons** vs arquivos existentes — criar ou remover promessa (`lgpd-compliance/README.md`).
5. **Documentar requisito Git Bash no Windows** (hooks usam bash+perl).
6. **Corrigir contagem "15 hooks" → "14 hooks"** no README, ROADMAP, CHANGELOG.

### P1 — Diferenciação competitiva (próximas 2-4 semanas)

7. **Criar addon `esocial-completo`** — gap P0 BR, sem competidor.
8. **Criar addon `varejo-pdv-br`** (SAT-CF-e + NFC-e + TEF) — desbloqueia PME varejo.
9. **Implementar `roldao-method add <addon>`** no CLI — addons hoje são copy-paste manual.
10. **Adicionar wizard interativo** no install (escolha de IDE + perfil + addons). Trocar `readline` por `@clack/prompts` (única dep) OU manter readline com menu numerado.
11. **Reescrever hooks bugados** (`block-destructive`, `no-amend-after-push`, `no-test-data-in-fixtures`, `commit-message-validator`, `mcp-validator`).
12. **Implementar `block-jargon-pt-br.sh`** — coerência com perfil do Roldão (PostToolUse na resposta detectando "commit", "branch", "deploy").
13. **Criar `kb-brainstorming-pt-br.md` + skill `brainstormar-ideia`** — fecha gap de raciocínio (BMAD tem 60+ técnicas; ROLDAO zero).
14. **Criar `kb-elicitation-pt-br.md`** (Pre-mortem, 5 Porquês, Stakeholder Round Table, Red/Blue Team).
15. **Update check no install.js** — fetch `https://registry.npmjs.org/roldao-method/latest` no início.

### P2 — Maturidade e estrutura (4-8 semanas)

16. **Criar `evals/`** com testes de qualidade dos 11 agentes (input → resposta esperada). CI obrigatório.
17. **Criar `_meta/skills-index.csv`** com `preceded-by`/`followed-by`/`required` — orquestração explícita estilo BMAD.
18. **Implementar adapters reais Cursor/Windsurf/Cline/Roo** ou remover do `package.json description` (claim falso hoje).
19. **Criar `/replanejar`, `/sprint`, `/status`, `/checkpoint`, `/readiness`, `/help`, `/shard`** (7 comandos faltando).
20. **Adicionar `identity`, `communication_style`, `principles`, `menu`, `skills` no frontmatter dos 11 agentes**. Dar nome PT-BR + ícone (Sofia 📋, Bruno 💻, Dona Marta 🧾).
21. **Estender `story.md` com `Dev Agent Record`** (modelo usado, arquivos tocados, hooks bloqueados, custo).
22. **Expandir `prd.md` com "Menu de Adaptação por Domínio"** (SaaS B2B, mobile consumer, sistema regulado, CLI/lib).
23. **Adicionar `SECURITY.md` + `CONTRIBUTORS.md` na raiz** — sinal de governança.
24. **Criar `.claude-plugin/plugin.json`** em `templates/` pra distribuição como plugin nativo Claude Code.
25. **README — hero visual** (logo ASCII ou SVG) + GIF de 30s de `/feature` + bloco "What's new in v0.4.0" + mover "Por que ROLDAO vs BMAD" pro topo.

---

## Próximos passos sugeridos

**Foco recomendado pra v0.5.0:** P0 inteiro (1-6) + 9 (addons instaláveis pelo CLI) + 7 ou 8 (escolher 1 vertical BR P0 e entregar completo). Isto entrega o framework **utilizável de verdade** pra primeiro usuário externo.

**Foco pra v0.6.0:** P1 (diferenciação) — wizard, hooks bugados, KBs brainstorming/elicitation, mais 1 vertical BR.

**Foco pra v1.0.0:** P2 (maturidade) — evals, orquestração de skills, adapters de IDE reais, governança, visual.

---

## Anexos

- **Auditoria 1** (estrutura): documento prévio em `docs/AUDITORIA-BMAD-2026-05-18.md` precisa ser consolidado com este.
- **Fontes consultadas:** `templates/.claude/{agents,commands,hooks,skills}/`, `templates/.specify/{templates,checklists,data,memory}/`, `addons/*`, `bin/install.js`, `test/install.test.js`, `package.json`, `README.md`, `ROADMAP.md`, `CHANGELOG.md`, `docs/*`. Lado BMAD: README + `src/{core-skills,bmm-skills,common}/`, `tools/installer/*`, `bmad-modules.yaml`, `module-help.csv`, `brain-methods.csv`, `methods.csv` via GitHub raw/API.
