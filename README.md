# ROLDAO-METHOD

> Framework de desenvolvimento ágil assistido por IA, **em português brasileiro**, com especialistas virtuais, regras automáticas e fluxos guiados para Claude Code, Cursor, Windsurf, Cline e Roo.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Português](https://img.shields.io/badge/idioma-pt--br-green.svg)](#)
[![Versão](https://img.shields.io/badge/versão-0.5.0-blue.svg)](#)
[![Hooks bloqueadores](https://img.shields.io/badge/hooks_bloqueadores-16-red.svg)](#)
[![Testes do framework](https://img.shields.io/badge/test_runner-50%2F50-green.svg)](#)
[![Addons](https://img.shields.io/badge/addons-6-purple.svg)](addons/)

---

## 🆕 Novidades na v0.5.0

- **CLI completo**: `add <addon>`, `list`, update check via npm, alias `roldao` curto, wizard interativo de instalação.
- **5 novos hooks bloqueadores**: jargão técnico, secret em commit message, perguntas de confirmação, fix sem investigação, pirâmide de testes invertida.
- **2 addons novos**: `esocial-completo` e `varejo-pdv-br`.
- **2 novas KBs**: brainstorming (15 técnicas BR) e elicitation (10 métodos críticos).
- **7 novos comandos**: `/replanejar`, `/sprint`, `/status`, `/checkpoint`, `/readiness`, `/help`, `/shard`.
- **12º agente**: `tech-writer` (Camila 📝) cuidando de CHANGELOG/README.
- **Suite de evals**: testes de qualidade dos 12 agentes rodando em CI.
- **Adapters de IDE reais**: templates `.cursor/`, `.windsurf/`, `.cline/`, `.roo/` (antes só Claude Code era instalado de fato).
- **CI cross-platform**: matriz Windows/macOS/Linux validando hooks e instalador.
- **Governança**: SECURITY.md, CONTRIBUTORS.md, `.claude-plugin/plugin.json` para distribuição nativa Claude Code.

Detalhes em [CHANGELOG.md](CHANGELOG.md).

---

## O problema

Ferramentas de IA pra desenvolvimento (BMAD, Cursor rules, agentes Claude Code) são **todas em inglês**. Devs brasileiros perdem nuance e ainda têm que adaptar exemplos gringos pra realidade BR (LGPD, NF-e, Pix, Receita Federal).

E pior: a maioria pula direto pra escrever código. **Sem investigar.** Sem ler o estado real do banco, dos logs, do payload. Resultado: bugs mascarados, retrabalho, e o usuário não-técnico achando que o agente "não entende o produto dele".

## Por que ROLDAO em vez de BMAD-METHOD?

Em uma linha: **BMAD orienta**, **ROLDAO impede**.

| | BMAD | ROLDAO |
|---|---|---|
| Idioma | Inglês (+CN/VN) | 🇧🇷 PT-BR nativo |
| Hooks que bloqueiam o erro | 0 | **16 bloqueadores** |
| Investigação em bug | Opcional | **Obrigatória** (REGRA #0) |
| Cobertura BR (NF-e, LGPD, Pix, eSocial) | Zero | Total + 6 addons |
| Auditores especializados | 0 | 3 (segurança, qualidade, produto) |
| Estágio | 47k stars, maduro | Novo, focado, vertical |

→ Migração detalhada em [docs/MIGRACAO-BMAD.md](docs/MIGRACAO-BMAD.md). Tabela completa de 20 dimensões no fim deste README.

## A solução

**ROLDAO-METHOD** é um framework que:

- 🇧🇷 **Fala português nativo** — não é tradução
- 🔍 **Investiga antes de mexer** — REGRA #0 codificada no workflow `/bug`
- 👥 **12 especialistas virtuais** com papéis claros (analista, PM, UX, tech-lead, investigador, dev, revisor, 3 auditores, fiscal-BR, tech-writer)
- 🛡️ **16 regras automáticas que bloqueiam** erros antes de acontecer (secrets, destrutivo, mascaramento, mock em integration, TODO sem ID, commit mal formado, amend após push, dado real em fixture, URLs hardcoded, padrões fiscais inválidos, jargão técnico ao usuário não-programador, secret em mensagem de commit, perguntas de confirmação que travam fluxo, fix sem investigação prévia, pirâmide de testes invertida, +1 fiscal)
- 📜 **Spec-driven total** — 11 templates (PRD, story, architecture, fullstack-arch, brownfield-PRD, PRD-fiscal, decision-log, PRFAQ, product-brief, UX-design, headless-schemas) em PT-BR
- ✅ **7 checklists** auditáveis — DoD de story, readiness arquitetural, compliance fiscal, privacidade LGPD, readiness de PM, release-readiness, pix-compliance
- 📚 **7 knowledge bases** que os agentes consultam — PT-BR (glossário), fiscal, LGPD, Pix, stack BR, brainstorming, elicitation
- 🎯 **Cobertura BR real** — 10 IDs LGPD, 7 IDs FISCAL, 5 IDs PIX + 6 addons especializados (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br, esocial-completo, varejo-pdv-br)

## Instalação

```bash
npx roldao-method install
```

Detecta Claude Code, Cursor, Windsurf, Continue, Aider, **Cline, Roo**. Sub-comandos:

```bash
npx roldao-method update              # atualiza framework, preserva customizações
npx roldao-method doctor              # diagnostica instalação
npx roldao-method list                # lista IDEs detectadas + addons disponíveis + versão remota
npx roldao-method add <addon>         # instala addon (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br, esocial-completo, varejo-pdv-br)
npx roldao-method uninstall           # remove (preserva AGENTS.md, CLAUDE.md, REGRAS)
npx roldao-method help
```

Flags: `--yes` (CI), `--force`, `--dry-run`, `--no-color`.

Aliases: o binário pode ser chamado de `roldao-method` ou só `roldao`.

### Requisitos

- **Node.js 18+** (em CI: 20+).
- **Windows:** hooks usam `bash` + `perl`, então rode o Claude Code a partir do **Git Bash** (vem com Git for Windows). PowerShell puro **não roda os hooks** — eles ficam silenciosos. Ver [docs/TROUBLESHOOTING.md#windows](docs/TROUBLESHOOTING.md#hooks).
- **macOS/Linux:** funciona em bash 3.2+ (compatibilidade testada em CI matriz).

## 12 especialistas virtuais

| Agente | Papel | Modelo |
|---|---|---|
| **Analista** (Mariana 🔎) | Pesquisa de mercado, brief, PRFAQ, regulamentação BR | haiku |
| **Gerente de Produto** (Sofia 📋) | PRD, story, decomposição (4 modos: brief/PRD/story/decomp) | haiku |
| **UX Designer** (Lia 🎨) | Wireframe ASCII, 5 estados por tela, mensagens PT-BR | haiku |
| **Tech Lead** (Rafael 🏛️) | Arquitetura, ADR, ARQ, checklist de readiness | sonnet |
| **Investigador** (Detetive 🔬) | Lê estado real antes de mexer. Obrigatório em `/bug` | sonnet |
| **Dev Sênior** (Bruno 💻) | Implementa com TDD onde paga | sonnet |
| **Revisor** (Inês ✅) | Aderência à US + anti-padrões | sonnet |
| **Auditor de Segurança** (Caio 🛡️) | LGPD, secrets, OWASP, supply chain | sonnet |
| **Auditor de Qualidade** (Júlia 🧪) | Cobertura, mocks indevidos, TST-* | sonnet |
| **Auditor de Produto** (Pedro 🎯) | Aderência ao pedido, non-goals | haiku |
| **Fiscal BR** (Dona Marta 🧾) | NF-e, certificado, eSocial, Reforma Tributária, CNPJ alfanum. | sonnet |
| **Tech Writer** (Camila 📝) | CHANGELOG, README, docs de release | haiku |

## 19 workflows (slash commands)

| Comando | Quando |
|---|---|
| `/inicio` | Projeto novo do zero |
| `/brownfield` | Adotar o framework em projeto que já existe |
| `/prd` | Iniciativa grande (vários meses) |
| `/epico` | Decompor coisa grande em várias histórias |
| `/historia` | 1 funcionalidade — gera `US-NNN` em disco |
| `/feature` | Implementar funcionalidade nova |
| `/quick-dev` | Atalho pra mudanças triviais (≤ 3 arquivos, ≤ 50 linhas) |
| `/bug` | Corrigir comportamento (investigador obrigatório) |
| `/refactor` | Reorganizar sem mudar comportamento |
| `/qa` | Gerar/auditar testes de uma área |
| `/auditoria` | Passar pelos 3 auditores |
| `/retro` | Retrospectiva pós-marco |
| `/replanejar` | Mudança de escopo no meio do épico (correct-course) |
| `/sprint` | Plano sequencial das próximas N stories com dependências |
| `/status` | Reporta progresso em PT-BR sem jargão |
| `/checkpoint` | Walkthrough guiado de PR/branch antes do merge |
| `/readiness` | Gate antes de partir de `/epico` pra `/feature` |
| `/help` | Catálogo dos comandos com códigos curtos |
| `/shard` | Quebra PRD/ARQ longo em chunks navegáveis com índice |

## 16 hooks bloqueadores + 3 auxiliares + 1 test-runner

**Bloqueadores** (retornam exit 2, barram a ação):

- `block-destructive` — `rm -rf`, `git push --force`, `DROP TABLE`, `--no-verify`
- `secrets-scanner` — `.env`, chaves, tokens (AWS, OpenAI, Anthropic, GitHub, Slack)
- `block-secrets-in-commit-message` — secret na mensagem de commit
- `anti-mascaramento` — `@ts-ignore`, `.skip`, `assertTrue(true)`, `|| true`
- `block-mock-in-integration` — mock em arquivo de integration/e2e (TST-003)
- `block-todo-without-issue` — `TODO`/`FIXME` sem ID rastreável
- `commit-message-validator` — commits misturando prefixos ou primeira linha > 72
- `no-amend-after-push` — `git commit --amend` em commit já pushado
- `no-test-data-in-fixtures` — CPF/email/telefone real em fixture (TST-004)
- `no-hardcoded-env-urls` — URL SEFAZ/Pix/Stripe/etc. hardcoded em código (SEC-005)
- `paths-frontmatter-validator` — exige frontmatter em `docs/*.md`
- `fiscal-br-validator` — ambiente SEFAZ=1, certificado hardcoded, regex CNPJ apenas numérica (FISCAL-001/002/003/005)
- `block-jargon-pt-br` — jargão técnico ("commit", "branch", "deploy") em resposta ao usuário não-programador (INV-AGENT-001)
- `block-confirmation-questions` — "quer que eu...?", "posso fazer X?" em resposta — viola INV-AGENT-006
- `require-investigador-before-fix` — Edit/Write em código de negócio sem `investigador` ter sido invocado quando bug foi reportado
- `validate-test-pyramid` — criação de E2E sem unit tests no mesmo módulo

**Auxiliares** (avisam, não bloqueiam):

- `context-budget` — AGENTS.md > 200 ou CLAUDE.md > 150 linhas
- `mcp-validator` — MCP server fora da allowlist (top-20 conhecidos)
- `regra-zero-reminder` — injeta REGRA #0 quando detecta gatilho de bug

**Test-runner:** `_test-runner.sh` com 50 casos contra os hooks (manual + CI cross-platform).

## 8 skills BR (core) + 9 nos addons = 17 skills

**Core (em `templates/.claude/skills/`):**

- **gerar-adr-pt-br** — cria ADR a partir do template oficial
- **traduzir-jargao** — traduz texto técnico pra PT-BR claro
- **brainstormar-ideia** — menu de 15 técnicas BR (Seis Chapéus, SCAMPER, 5 Porquês, Pre-mortem…)
- **gerar-test-fixture-br** — gera CPFs/CNPJs/CEPs/E.164 válidos algoritmicamente pra mocks
- **validar-cpf-cnpj** — valida CPF + CNPJ numérico **+ CNPJ alfanumérico (vigor jul/2026)**
- **validar-pix** — valida chave Pix (CPF/CNPJ/email/telefone/UUID) + EndToEndId + TxId
- **validar-cep** — valida CEP (formato + opcional ViaCEP)
- **checklist-lgpd** — árvore de decisão de base legal (Art. 7 / Art. 11) + 10 checks

**Addons (9 skills BR):** `migration-sqlite-segura`, `estruturar-open-finance`, `gerar-br-code`, `validar-webhook-pix`, `emitir-nfe-55`, `validar-cnpj-alfanumerico`, `gerar-canal-dpo`, `gerar-ripd`, `resposta-titular`.

## Cobertura BR — IDs rastreáveis em commit

- **LGPD-001 a LGPD-010** — bases legais, esquecimento, minimização, trilha, transfer. internacional, incidente/ANPD, RIPD, DPO, decisão automatizada
- **FISCAL-001 a FISCAL-007** — imutabilidade NF-e, certificado por tenant, homologação, contingência, CNPJ alfanumérico, Reforma Tributária 2026-2033, obrigação acessória
- **SEC-001 a SEC-005** — secrets, destrutivo, validar entrada, menor privilégio, URLs externas por env
- **TST-001 a TST-004** — anti-mascaramento, causa raiz, mock fora de integration, dado sintético em fixture
- **INV-001 a INV-006** — documento, spec-as-source, non-goals, IDs, concisão, causa raiz
- **INV-AGENT-001 a 006** — sem jargão, REGRA #0, pró-atividade, verificar antes, confirmar destruição, executar não passar pro usuário

## 6 addons disponíveis (extensões especializadas)

| Addon | Foco |
|---|---|
| [`electron-br`](addons/electron-br/) | App Electron com IPC seguro + SQLite + LGPD local |
| [`fiscal-br-completo`](addons/fiscal-br-completo/) | NF-e 55, NFC-e, NFS-e, CNPJ alfanumérico (jul/2026), Reforma Tributária 2026-2033 |
| [`lgpd-compliance`](addons/lgpd-compliance/) | DPO virtual, RIPD, canal do titular, plano de incidente 72h |
| [`fintech-br`](addons/fintech-br/) | Pix completo (BR Code, webhook HMAC, devolução, Pix Automático), Open Finance |
| [`esocial-completo`](addons/esocial-completo/) | Eventos S-1000 a S-3000, CIPA, NRs, prazo legal, retificação |
| [`varejo-pdv-br`](addons/varejo-pdv-br/) | SAT-CF-e, NFC-e, TEF, MFE-CE, ECF, integração com balança/impressora |

Instalar: `npx roldao-method add <nome>`. Ver [addons/README.md](addons/README.md) pra criar o seu.

## Fluxo do `/feature` (diagrama)

```
[Pedido informal] → /feature
       ↓
[1. gerente-produto] estrutura US-NNN + AC + non-goals
       ↓
[2. investigador]   lê código existente, mapeia impacto (NÃO escreve código)
       ↓
[3. tech-lead]      ADR se decisão arquitetural (pula se trivial)
       ↓
[4. dev-senior]     implementa + testes (TDD na lógica crítica)
       ↓
[5. revisor]        aderência à US + caça anti-padrões + hooks ativos
       ↓
[6. auditores]      auditor-seguranca + auditor-qualidade + auditor-produto
       ↓
[Saída]             US entregue + commits atômicos rastreáveis
```

Mudança trivial (≤ 3 arquivos, ≤ 50 linhas)? Use `/quick-dev` — pula investigador e auditores.

Bug reportado? Use `/bug` — REGRA #0 obriga `investigador` antes de qualquer mudança.

## O que o ROLDAO-METHOD NÃO faz (non-goals)

- ❌ Não é runtime de IA — depende de Claude Code, Cursor ou similares.
- ❌ Não gera código sozinho — estrutura o trabalho do agente.
- ❌ Não é IDE/editor.
- ❌ Não substitui CI/CD do produto final.
- ❌ Não é certificação legal/fiscal — orienta, não certifica.
- ❌ Não trava idiomas além de PT-BR.
- ❌ Não é template de projeto (Django/React/etc).

## Diferencial completo vs BMAD-METHOD

| | BMAD-METHOD v6.7 | ROLDAO-METHOD v0.5 |
|---|---|---|
| Idioma | Inglês (+CN/VN, sem PT-BR) | 🇧🇷 PT-BR nativo |
| Mercado-foco | Global/genérico | Brasil (LGPD, fiscal, BR) |
| Investigação em bug | Opcional | **Obrigatória** (REGRA #0) |
| Hooks que bloqueiam o erro | 0 | **16 bloqueadores** |
| Filosofia | Orienta o agente | **Impede o agente de errar** |
| Auditores dedicados | 0 | 3 (segurança, qualidade, produto) |
| Agente fiscal BR | Não tem | `fiscal-br` (Dona Marta) |
| Skills BR | 0 | 8 no core + 9 nos addons = 17 |
| Skills genéricas (brainstorming, elicit.) | 60+ | 15 técnicas adaptadas BR |
| Checklists auditáveis | 0 | 7 (story, arch, fiscal, LGPD, PM, release, Pix) |
| Knowledge bases | 0 | 7 (PT-BR, fiscal, LGPD, Pix, stack, brainstorm, elicit) |
| Templates spec | 13 YAML | 11 markdown (PRD/story/arch/brownfield/fiscal/fullstack/decision/prfaq/brief/ux/headless) |
| Spec-driven | Parcial | Total (`.specify/`) |
| Orquestração de skills (CSV) | sim | sim (`_meta/skills-index.csv`) |
| Evals dos agentes | sim | sim (`evals/`) |
| CNPJ alfanumérico 2026 | Não cobre | Suportado desde v0.3 |
| Reforma Tributária 2026 | Não cobre | `FISCAL-006` + agente fiscal + KB |
| Pix completo | Não cobre | Addon `fintech-br` (5 chaves, BR Code, Open Finance) |
| LGPD operacional | Não cobre | Addon `lgpd-compliance` (DPO, RIPD, 72h) |
| eSocial | Não cobre | Addon `esocial-completo` |
| Varejo/PDV BR | Não cobre | Addon `varejo-pdv-br` (SAT-CF-e, NFC-e, TEF) |
| Expansion packs verticais | **Aboliu na v6** | 6 addons BR (e crescendo) |
| Stars (mai/2026) | 47.5k | novo |
| IDEs suportadas | 42+ | 7+ (Claude Code, Cursor, Windsurf, Cline, Roo, Continue, Aider) |
| Quando usar | Time global, projeto genérico | Time BR, projeto regulado |

Migração de BMAD: ver [docs/MIGRACAO-BMAD.md](docs/MIGRACAO-BMAD.md). Posicionamento: **complementar**, não competidor — ROLDAO domina o que BMAD aboliu (verticais de domínio + bloqueio mecânico).

## Documentação

- [Quickstart](docs/QUICKSTART.md) — do zero ao primeiro `/feature` em 5 min
- [Como funciona](docs/COMO-FUNCIONA.md) — estrutura + fluxo dos comandos
- [Exemplo de feature completa](docs/EXEMPLO-FEATURE-COMPLETA.md) — transcrição realista
- [FAQ](docs/FAQ.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Casos de uso BR](docs/CASOS-DE-USO-BR.md) — NF-e, telemedicina, Pix, eSocial, e-commerce, EAD, Open Finance
- [Migração de BMAD](docs/MIGRACAO-BMAD.md)
- [Guia MCP](docs/MCP-GUIA-BR.md)
- [Arquitetura do framework](docs/ARQUITETURA.md)
- [Roadmap público](ROADMAP.md) — o que vem por aí
- [Auditoria 10 agentes vs BMAD](docs/AUDITORIA-10-AGENTES-2026-05-18.md) — segunda rodada, 25 ações priorizadas
- [Auditoria comparativa com BMAD](docs/AUDITORIA-BMAD-2026-05-18.md) — primeira rodada, 10 dimensões
- [Addons](addons/README.md) — 4 addons disponíveis + como criar

## Licença

MIT. Use, modifique, distribua à vontade.

## Contribuir

Pull requests bem-vindos. Foco em qualidade e clareza > volume de features. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Suporte

- Issues: https://github.com/roldaobatista/roldao-method/issues
- Discussões: https://github.com/roldaobatista/roldao-method/discussions

---

**Criado por:** Roldão · **Inspirado por:** experiência real construindo SaaS regulado no Brasil
