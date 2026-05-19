# ROLDAO-METHOD

> Framework de desenvolvimento ágil assistido por IA, **em português brasileiro**, com especialistas virtuais, regras automáticas e fluxos guiados para Claude Code, Cursor, Windsurf, Cline, Roo, Aider, Continue, Gemini CLI e Codex CLI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Português](https://img.shields.io/badge/idioma-pt--br-green.svg)](#)
[![Versão](https://img.shields.io/badge/versão-0.14.2-blue.svg)](#)
[![Hooks bloqueadores](https://img.shields.io/badge/hooks_bloqueadores-22-red.svg)](#)
[![Testes do framework](https://img.shields.io/badge/test_runner-155%2F155-green.svg)](#)
[![Addons](https://img.shields.io/badge/addons-6-purple.svg)](addons/)

---

## 🆕 Novidades na v0.13.1 (paridade SDD + auditoria 10-agentes round 7)

Fecha gaps táticos de spec-driven sem mexer na identidade — hooks bloqueadores e cobertura BR continuam o diferencial. 155/155 mantidos.

- **Comando `/consistencia`** — cross-check PRD↔ARQ↔stories↔tasks↔código (caça órfãos).
- **Comando `/clarificar`** — questionamento estruturado ANTES de codar. Total: **22 workflows**.
- **CLI `roldao remove <addon>`** — remoção cirúrgica preservando core e demais addons.
- **CLI `roldao search [termo]`** — lista/filtra addons, marca instalados.
- **CLI `roldao tasks-to-issues`** — varre `T-NNN` das stories e cria GitHub Issues (idempotente).
- **Overrides por projeto sem fork** — `.specify/overrides/` vence o oficial e nunca é tocado por `update`.
- **Adapters Gemini CLI (`GEMINI.md`) e Codex CLI (`.codex/`)** — **9 IDEs suportadas**.
- **Round 7 (auditoria 10-agentes):** REGRA #0 destravada de fato no `/bug` (marcador `investigator-invoked` agora é criado), hash de sessão consistente entre comandos e hooks, `investigador`/`analista` → sonnet, CNPJ de base repetida agora rejeitado, hooks de segurança endurecidos (segredo via `git commit -F`, exceção de confirmação por linha, regex case-insensitive), `test/` incluído no pacote npm.

Detalhes em [CHANGELOG.md](CHANGELOG.md).

---

## O problema

Ferramentas de IA pra desenvolvimento (Cursor rules, agentes Claude Code, frameworks de prompt) são **todas em inglês**. Devs brasileiros perdem nuance e ainda têm que adaptar exemplos gringos pra realidade BR (LGPD, NF-e, Pix, Receita Federal).

E pior: a maioria pula direto pra escrever código. **Sem investigar.** Sem ler o estado real do banco, dos logs, do payload. Resultado: bugs mascarados, retrabalho, e o usuário não-técnico achando que o agente "não entende o produto dele".

## Por que ROLDAO?

Em uma linha: **outros frameworks orientam o agente. ROLDAO impede o erro.**

- 🇧🇷 **PT-BR nativo** — não é tradução. Tabela de jargão integrada pra usuário não-programador.
- 🛡️ **22 hooks bloqueadores** — retornam exit 2 e barram a ação na hora (secret, destrutivo, mascaramento, mock indevido, jargão técnico, fix sem investigação, escopo estourado, commit sem rastreio).
- 🔍 **Investigação obrigatória em bug** — REGRA #0 codificada no workflow `/bug` e em hook mecânico (`require-investigador-before-fix`).
- 🧾 **Cobertura BR real** — LGPD, NF-e, NFC-e, eSocial, Pix, CNPJ alfanumérico (jul/2026), Reforma Tributária 2026-2033 + 6 addons verticais.
- 🧪 **3 auditores especializados** — segurança, qualidade, produto rodando em paralelo no fim de cada feature, bloqueando commit se reprovado.

## A solução

**ROLDAO-METHOD** é um framework que:

- 🇧🇷 **Fala português nativo** — não é tradução
- 🔍 **Investiga antes de mexer** — REGRA #0 codificada no workflow `/bug`
- 👥 **12 especialistas virtuais** com papéis claros (analista, PM, UX, tech-lead, investigador, dev, revisor, 3 auditores, fiscal-BR, tech-writer)
- 🛡️ **22 regras automáticas que bloqueiam** erros antes de acontecer (secrets em código, secrets em commit message, destrutivo, mascaramento, mock em integration, TODO sem ID, commit mal formado, amend após push, dado real em fixture, URLs hardcoded, padrões fiscais inválidos, fix sem investigação prévia, pirâmide de testes invertida, readiness antes de feature, dependências de story, sequência Sofia→Detetive→Rafael, escopo /quick-dev, checkpoint antes de merge, 3 auditores antes de commit, audit trail em story entregue, frontmatter de spec)
- 📜 **Spec-driven total** — 12 templates (PRD, story, architecture, fullstack-arch, brownfield-PRD, PRD-fiscal, decision-log, PRFAQ, product-brief, UX-design, headless-schemas, épico) em PT-BR
- ✅ **8 checklists** auditáveis — DoD de story, readiness arquitetural, compliance fiscal, privacidade LGPD, readiness de PM, release-readiness, pix-compliance, audit-trail
- 📚 **7 knowledge bases** que os agentes consultam — PT-BR (glossário), fiscal, LGPD, Pix, stack BR, brainstorming, elicitation
- 🎯 **Cobertura BR real** — 10 IDs LGPD, 7 IDs FISCAL, 5 IDs PIX + 6 addons especializados (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br, esocial-completo, varejo-pdv-br)

## Instalação

```bash
npx roldao-method install
```

Detecta Claude Code, Cursor, Windsurf, Continue, Aider, Cline, Roo, **Gemini CLI, Codex CLI**. Sub-comandos:

```bash
npx roldao-method update              # atualiza framework, preserva customizações
npx roldao-method doctor              # diagnostica instalação
npx roldao-method list                # lista IDEs detectadas + addons disponíveis + versão remota
npx roldao-method add <addon>         # instala addon (electron-br, fiscal-br-completo, lgpd-compliance, fintech-br, esocial-completo, varejo-pdv-br)
npx roldao-method remove <addon>      # remove um addon (preserva core e demais addons)
npx roldao-method search [termo]      # lista/filtra addons disponíveis
npx roldao-method tasks-to-issues     # cria GitHub Issues a partir dos T-NNN das stories
npx roldao-method uninstall           # remove (preserva AGENTS.md, CLAUDE.md, REGRAS)
npx roldao-method help
```

Flags: `--yes` (CI), `--force`, `--dry-run`, `--no-color`.

Aliases: o binário pode ser chamado de `roldao-method` ou só `roldao`.

### Requisitos

- **Node.js 18+** (em CI: 20+).
- **Windows:** hooks usam `bash` + `perl`, então rode o Claude Code a partir do **Git Bash** (vem com Git for Windows). PowerShell puro **não roda os hooks** — eles ficam silenciosos. Ver [docs/TROUBLESHOOTING.md (seção Hooks)](docs/TROUBLESHOOTING.md#hooks).
- **macOS/Linux:** funciona em bash 3.2+ (compatibilidade testada em CI matriz).

## 12 especialistas virtuais

| Agente | Papel | Modelo |
|---|---|---|
| **Analista** (Mariana 🔎) | Pesquisa de mercado, brief, PRFAQ, regulamentação BR | sonnet |
| **Gerente de Produto** (Sofia 📋) | PRD, story, decomposição (3 modos: PRD/story/decomp; brief é do analista) | sonnet |
| **UX Designer** (Lia 🎨) | Wireframe ASCII, 5 estados por tela, mensagens PT-BR | haiku |
| **Tech Lead** (Rafael 🏛️) | Arquitetura, ADR, ARQ, checklist de readiness | sonnet |
| **Investigador** (Detetive 🔬) | Lê estado real antes de mexer. Obrigatório em `/bug` | sonnet |
| **Dev Sênior** (Bruno 💻) | Implementa com TDD onde paga | sonnet |
| **Revisor** (Inês ✅) | Aderência à US + anti-padrões | sonnet |
| **Auditor de Segurança** (Caio 🛡️) | LGPD, secrets, OWASP, supply chain | sonnet |
| **Auditor de Qualidade** (Júlia 🧪) | Cobertura, mocks indevidos, TST-* | sonnet |
| **Auditor de Produto** (Pedro 🎯) | Aderência ao pedido, non-goals | sonnet |
| **Fiscal BR** (Dona Marta 🧾) | NF-e, certificado, eSocial, Reforma Tributária, CNPJ alfanum. | sonnet |
| **Tech Writer** (Camila 📝) | CHANGELOG, README, docs de release | haiku |

## 22 workflows (slash commands)

| Comando | Quando |
|---|---|
| `/inicio` | Projeto novo do zero |
| `/brownfield` | Adotar o framework em projeto que já existe |
| `/prd` | Iniciativa grande (vários meses) |
| `/epico` | Decompor coisa grande em várias histórias |
| `/historia` | 1 funcionalidade — gera `US-NNN` em disco |
| `/clarificar` | Tira ambiguidade de uma ideia/story antes de codar |
| `/feature` | Implementar funcionalidade nova |
| `/quick-dev` | Atalho pra mudanças triviais (≤ 3 arquivos, ≤ 50 linhas) |
| `/bug` | Corrigir comportamento (investigador obrigatório) |
| `/refactor` | Reorganizar sem mudar comportamento |
| `/qa` | Gerar/auditar testes de uma área |
| `/auditoria` | Passar pelos 3 auditores |
| `/consistencia` | Cross-check PRD↔ARQ↔stories↔tasks↔código (acha órfãos) |
| `/retro` | Retrospectiva pós-marco |
| `/replanejar` | Mudança de escopo no meio do épico (correct-course) |
| `/sprint` | Plano sequencial das próximas N stories com dependências |
| `/status` | Reporta progresso em PT-BR sem jargão |
| `/checkpoint` | Walkthrough guiado de PR/branch antes do merge |
| `/release` | Fechar marco: versão sincronizada, CHANGELOG, tag, nota PT-BR |
| `/readiness` | Gate antes de partir de `/epico` pra `/feature` |
| `/help` | Catálogo dos comandos com códigos curtos |
| `/shard` | Quebra PRD/ARQ longo em chunks navegáveis com índice |

## 22 hooks bloqueadores + 4 auxiliares + 2 infra (_lib + test-runner) = 28 hooks core (+5 em addons)

> **Escopo honesto:** os hooks são guarda-corpos para um agente **cooperativo e desatento** (o caso comum — o agente que "pula etapa porque é simples"). Eles barram o erro óbvio na hora. **Não são um sandbox contra um agente deliberadamente malicioso**: quem tem `Write` no projeto pode reescrever `settings.json`. Em Windows sem Git Bash os hooks não rodam (ver Requisitos). Defesa em profundidade, não garantia criptográfica.

**Bloqueadores** (retornam exit 2 ou `decision: block`, barram a ação):

- `block-destructive` — `rm -rf`, `git push --force`, `DROP TABLE`, `--no-verify`
- `secrets-scanner` — `.env`, chaves, tokens (AWS, OpenAI, Anthropic, GitHub, Slack)
- `block-secrets-in-commit-message` — secret na mensagem de commit
- `anti-mascaramento` — `@ts-ignore`, `.skip`, `assertTrue(true)`, `|| true`
- `block-mock-in-integration` — mock em arquivo de integration/e2e (TST-003)
- `block-todo-without-issue` — `TODO`/`FIXME` sem ID rastreável
- `commit-message-validator` — commits misturando prefixos ou primeira linha > 72
- `mcp-validator` — MCP server fora da allowlist (top-20 conhecidos)
- `no-amend-after-push` — `git commit --amend` em commit já pushado
- `no-test-data-in-fixtures` — CPF/email/telefone real em fixture (TST-004)
- `no-hardcoded-env-urls` — URL SEFAZ/Pix/Stripe/etc. hardcoded em código (SEC-005)
- `paths-frontmatter-validator` — exige frontmatter em `docs/*.md`
- `fiscal-br-validator` — ambiente SEFAZ=1, certificado hardcoded, regex CNPJ apenas numérica (FISCAL-001/002/003/005)
- `require-investigador-before-fix` — Edit/Write em código de negócio sem `investigador` ter sido invocado quando bug foi reportado
- `require-readiness-before-feature` — Edit/Write em código quando `/feature` ativo mas `docs/readiness/EP-NNN-status.md` ≠ `PRONTO` (gate mecânico de planejamento)
- `require-agent-sequence-before-dev` — Edit/Write em código quando `/feature` ativo mas Sofia, Detetive ou Rafael não rodaram (pipeline obrigatório)
- `require-checkpoint-before-merge` — `git merge`/`push` em `/feature` ativo sem checkpoint salvo em `docs/checkpoints/`
- `require-auditors-pass-before-commit` — `git commit`/`merge`/`push` sem os 3 auditores aprovados com hash do diff
- `validate-story-dependencies` — Edit/Write em código quando US-NNN ativa tem `depende-de:` apontando pra US não-entregue
- `validate-story-approvals` — story marcada `entregue` sem audit trail completo no frontmatter
- `validate-quick-dev-scope` — `/quick-dev` ativo e mudança já tocou >3 arquivos de código — força escalar pra `/feature`
- `validate-test-pyramid` — criação de E2E sem unit tests no mesmo módulo

**Auxiliares** (avisam, não bloqueiam):

- `context-budget` — AGENTS.md > 200 ou CLAUDE.md > 150 linhas
- `regra-zero-reminder` — injeta REGRA #0 quando detecta gatilho de bug
- `block-jargon-pt-br` — flag de jargão técnico em resposta ao usuário não-programador (PostToolUse, soft warning)
- `block-confirmation-questions` — "quer que eu...?", "posso fazer X?" em resposta — viola INV-AGENT-006 (PostToolUse, soft warning)

**Test-runner:** `_test-runner.sh` com **155 casos** contra os hooks (manual + CI cross-platform).

**Addons trazem +5 hooks:** `block-ipc-without-validation` (electron-br), `validate-webhook-signature`, `require-sefaz-env`, `validate-tef-flow`, `validate-esocial-prazo`.

## 8 skills BR (core) + 14 nos addons = 22 skills

**Core (em `templates/.claude/skills/`):**

- **gerar-adr-pt-br** — cria ADR a partir do template oficial
- **traduzir-jargao** — traduz texto técnico pra PT-BR claro
- **brainstormar-ideia** — menu de 15 técnicas BR (Seis Chapéus, SCAMPER, 5 Porquês, Pre-mortem…)
- **gerar-test-fixture-br** — gera CPFs/CNPJs/CEPs/E.164 válidos algoritmicamente pra mocks
- **validar-cpf-cnpj** — valida CPF + CNPJ numérico **+ CNPJ alfanumérico (vigor jul/2026)**
- **validar-pix** — valida chave Pix (CPF/CNPJ/email/telefone/UUID) + EndToEndId + TxId
- **validar-cep** — valida CEP (formato + opcional ViaCEP)
- **checklist-lgpd** — árvore de decisão de base legal (Art. 7 / Art. 11) + 10 checks

**Addons (14 skills BR):** `migration-sqlite-segura` (electron-br) · `estruturar-open-finance`, `gerar-br-code`, `validar-webhook-pix` (fintech-br) · `emitir-nfe-55`, `migrar-cnpj-alfanumerico` (fiscal-br-completo) · `gerar-canal-dpo`, `gerar-ripd`, `resposta-titular` (lgpd-compliance) · `emitir-evento-esocial`, `validar-pis-pasep` (esocial-completo) · `emitir-nfce`, `emitir-sat-cfe`, `integrar-balanca-impressora` (varejo-pdv-br).

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

## Capacidades em uma tabela

| Categoria | ROLDAO-METHOD v0.13 |
|---|---|
| Idioma | 🇧🇷 PT-BR nativo |
| Mercado-foco | Brasil (LGPD, fiscal, Pix, eSocial, BR) |
| Investigação em bug | **Obrigatória** (REGRA #0, hook mecânico) |
| Hooks que bloqueiam o erro | **22 bloqueadores** + 4 auxiliares + 2 infra (`_lib`, test-runner) |
| Filosofia | **Impede o agente de errar** (exit 2), não só orienta |
| Auditores dedicados | 3 (segurança, qualidade, produto) |
| Agente fiscal BR | `fiscal-br` (Dona Marta) — NF-e, eSocial, Reforma Tributária |
| Skills BR | 8 no core + 14 nos addons = **22 skills** |
| Técnicas de raciocínio | 15 brainstorming + 10 elicitation adaptadas BR |
| Checklists auditáveis | 8 (story-DoD, arch-readiness, fiscal, LGPD, PM, release, Pix, audit-trail) |
| Knowledge bases | 7 (PT-BR, fiscal, LGPD, Pix, stack, brainstorm, elicit) |
| Templates de spec | 12 markdown (PRD, story, arch, brownfield, fiscal, fullstack, decision, PRFAQ, brief, UX, headless, épico) |
| Spec-driven | Total (`.specify/`) |
| Orquestração de skills | `_meta/skills-index.csv` |
| Evals dos agentes | Lint estrutural em CI (12/12 cobertos; modo live é roadmap) |
| CNPJ alfanumérico jul/2026 | Suportado desde v0.3 |
| Reforma Tributária 2026-2033 | `FISCAL-006` + agente fiscal + KB |
| Pix completo | Addon `fintech-br` (5 chaves, BR Code, Open Finance) |
| LGPD operacional | Addon `lgpd-compliance` (DPO, RIPD, plano 72h) |
| eSocial | Addon `esocial-completo` |
| Varejo/PDV BR | Addon `varejo-pdv-br` (SAT-CF-e, NFC-e, TEF) |
| Addons verticais BR | 6 (e crescendo) |
| IDEs suportadas | 9 (Claude Code, Cursor, Windsurf, Cline, Roo, Continue, Aider, Gemini CLI, Codex CLI) |
| Quando usar | Time BR, projeto regulado, dono de produto não-programador |

## Documentação

- [Quickstart](docs/QUICKSTART.md) — do zero ao primeiro `/feature` em 5 min
- [Como funciona](docs/COMO-FUNCIONA.md) — estrutura + fluxo dos comandos
- [Exemplo de feature completa](docs/EXEMPLO-FEATURE-COMPLETA.md) — transcrição realista
- [Exemplos materializados](docs/examples/README.md) — story preenchida (US-001) com todos os campos vivos
- [FAQ](docs/FAQ.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Casos de uso BR](docs/CASOS-DE-USO-BR.md) — NF-e, telemedicina, Pix, eSocial, e-commerce, EAD, Open Finance
- [Guia MCP](docs/MCP-GUIA-BR.md)
- [Arquitetura do framework](docs/ARQUITETURA.md)
- [Roadmap público](ROADMAP.md) — o que vem por aí
- [Addons](addons/README.md) — 6 addons disponíveis + como criar

## Licença

MIT. Use, modifique, distribua à vontade.

## Contribuir

Pull requests bem-vindos. Foco em qualidade e clareza > volume de features. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Suporte

- Issues: https://github.com/roldaobatista/roldao-method/issues
- Discussões: https://github.com/roldaobatista/roldao-method/discussions

---

**Criado por:** Roldão · **Inspirado por:** experiência real construindo SaaS regulado no Brasil
