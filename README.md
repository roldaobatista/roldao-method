# ROLDAO-METHOD

> Framework de desenvolvimento ágil assistido por IA, **em português brasileiro**, com especialistas virtuais, regras automáticas e fluxos guiados para Claude Code, Cursor, Windsurf, Cline, Roo, Aider, Continue, Gemini CLI e Codex CLI.

[![CI](https://github.com/roldaobatista/roldao-method/actions/workflows/validar.yml/badge.svg)](https://github.com/roldaobatista/roldao-method/actions/workflows/validar.yml)
[![npm](https://img.shields.io/npm/v/roldao-method.svg)](https://www.npmjs.com/package/roldao-method)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Português](https://img.shields.io/badge/idioma-pt--br-green.svg)](#)

```bash
npx roldao-method install      # 1. instala (~2 min)
# 2. preencha AGENTS.md (campos _(preencher)_)  OU  rode /brownfield se já tem código
# 3. no Claude Code:
#    /historia "Sua primeira feature em uma frase"
#    /feature US-001
```

`/help` lista os 22 workflows. `.claude/agents/MAPA-VISUAL.md` mostra quem chamar. Detalhes em [`docs/QUICKSTART.md`](docs/QUICKSTART.md). Novidades em [`CHANGELOG.md`](CHANGELOG.md).

---

## O problema

Ferramentas de IA pra desenvolvimento (Cursor rules, agentes Claude Code, frameworks de prompt) são **todas em inglês**. Devs brasileiros perdem nuance e ainda têm que adaptar exemplos gringos pra realidade BR (LGPD, NF-e, Pix, Receita Federal). E pior: a maioria pula direto pra escrever código. Sem investigar. Sem ler o estado real do banco, dos logs, do payload.

## Por que ROLDAO

Em uma linha: **outros frameworks orientam o agente. ROLDAO impede o erro.**

- 🇧🇷 **PT-BR nativo** — não é tradução. Tabela de jargão integrada pra usuário não-programador.
- 🛡️ **25 hooks bloqueadores + 7 auxiliares** — bloqueadores barram a ação na hora (via `exit 2` ou JSON `decision:block`); auxiliares avisam ou automatizam ciclo (format, snapshot, audit).
- 🔍 **Investigação obrigatória em bug** — REGRA #0 codificada em workflow `/bug` + hook mecânico.
- 🧾 **Cobertura BR real** — LGPD, NF-e, NFC-e, eSocial, Pix, CNPJ alfanumérico (jul/2026), Reforma Tributária 2026-2033 + 6 addons verticais.
- 🧪 **3 auditores especializados** — segurança, qualidade, produto rodando em paralelo, bloqueando commit se reprovado.

## Instalação

```bash
npx roldao-method install              # instala
npx roldao-method update               # atualiza, preserva customizações
npx roldao-method doctor               # diagnostica instalação
npx roldao-method list                 # lista IDEs detectadas + addons + versão remota
npx roldao-method add <addon>          # instala addon (electron-br, fiscal-br-completo, etc.)
npx roldao-method remove <addon>       # remove addon (preserva core)
npx roldao-method search [termo]       # busca addons disponíveis
npx roldao-method tasks-to-issues      # cria GitHub Issues a partir de T-NNN
npx roldao-method uninstall            # remove (preserva AGENTS.md, CLAUDE.md, REGRAS)
```

Flags: `--yes` (CI), `--force`, `--dry-run`, `--no-color`. Aliases: `roldao-method` ou só `roldao`.

### Requisitos

- **Node.js 18+** (CI: 20+).
- **bash 3.2+** (macOS/Linux nativo; Windows via **Git Bash**).
- **Perl 5.12+** — usado pelos hooks para parsing seguro de JSON (já vem com Git for Windows, macOS e quase toda distro Linux).
- **Python 3.8+** (opcional) — usado pelas skills de validação. Sem Python local, executam em CI; testes marcam SKIP claro.
- **Windows:** rode o Claude Code a partir do **Git Bash**. PowerShell puro **não roda os hooks** — ficam silenciosos. Ver [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md#hooks).

## O que vem instalado

- **14 especialistas virtuais com personalidade** — Maestro (orquestrador), Sofia (PM), Detetive (investigador), Rafael (tech-lead), Bruno (dev), Helena (DBA), Inês (revisor), Caio/Julia/Pedro (3 auditores), Mariana (analista), Lia (UX), Dona Marta (fiscal-BR), Camila (tech-writer). Catálogo em [`.claude/agents/MAPA-VISUAL.md`](templates/.claude/agents/MAPA-VISUAL.md). Detalhes em [`AGENTS.md §4`](AGENTS.md).
- **22 workflows (slash commands)** — `/inicio`, `/brownfield`, `/prd`, `/epico`, `/historia`, `/clarificar`, `/feature`, `/quick-dev`, `/bug`, `/refactor`, `/qa`, `/auditoria`, `/consistencia`, `/retro`, `/replanejar`, `/sprint`, `/status`, `/checkpoint`, `/release`, `/readiness`, `/help`, `/shard`. Detalhes em [`AGENTS.md §5`](AGENTS.md).
- **25 hooks bloqueadores + 2 soft warnings + 5 lifecycle + 2 infra (`_lib.sh`, `_test-runner.sh`) = 34 hooks** — tabela completa em [`.claude/rules/roldao-method.md`](templates/.claude/rules/roldao-method.md). Inclui: destrutivo, secrets, mascaramento, mock em integration, TODO sem ID, dado real em fixture, URLs hardcoded, fix sem investigação, readiness, sequência de agentes, escopo /quick-dev, checkpoint antes de merge, 3 auditores antes de commit, jargão PT-BR, pergunta de confirmação, pipeline incompleto.
- **12 skills BR core** — validar-cpf-cnpj (com CNPJ alfanumérico jul/2026), validar-chave-acesso-nfe (44 dígitos NF-e/NFC-e/CT-e/MDF-e), validar-pix, validar-cep, validar-ie (27 UFs), validar-boleto, gerar-br-code, gerar-test-fixture-br, gerar-adr-pt-br, traduzir-jargao, brainstormar-ideia, checklist-lgpd. +14 nos addons = **26 skills**.
- **12 templates de spec** PT-BR (PRD, story, architecture, fullstack-arch, brownfield-PRD, PRD-fiscal, decision-log, PRFAQ, product-brief, UX-design, headless-schemas, épico).
- **8 checklists auditáveis** + **7 knowledge bases** + **6 addons verticais BR**.

> **Escopo honesto dos hooks:** são guarda-corpos para um agente **cooperativo e desatento** (o caso comum). Barram o erro óbvio na hora. **Não são sandbox contra agente malicioso**: quem tem `Write` pode reescrever `settings.json`. Em Windows sem Git Bash não rodam. Defesa em profundidade, não garantia criptográfica.

## Cobertura BR — IDs rastreáveis em commit

`REGRAS-INEGOCIAVEIS.md` tem a lista completa: **43 regras operacionais em 7 categorias** — INV-001..006 (6 invariantes gerais), SEC-001..005 (5 segurança), TST-001..004 (4 testes), LGPD-001..010 (10 proteção de dados), FISCAL-001..007 (7 fiscal BR), PIX-001..005 (5 Pix/Open Finance), INV-AGENT-001..006 (6 regras pra agentes IA). Cada regra cita-se em commit/ADR/PR (ex: `fix: ajusta validação CPF (LGPD-001)`).

## 6 addons verticais

| Addon | Foco |
|---|---|
| [`electron-br`](addons/electron-br/) | App Electron com IPC seguro + SQLite + LGPD local |
| [`fiscal-br-completo`](addons/fiscal-br-completo/) | NF-e 55, NFC-e, NFS-e, CNPJ alfanumérico, Reforma Tributária 2026-2033 |
| [`lgpd-compliance`](addons/lgpd-compliance/) | DPO virtual, RIPD, canal do titular, plano de incidente 72h |
| [`fintech-br`](addons/fintech-br/) | Pix completo (BR Code, webhook HMAC, devolução, Pix Automático), Open Finance |
| [`esocial-completo`](addons/esocial-completo/) | Eventos S-1000 a S-3000, CIPA, NRs, prazo legal, retificação |
| [`varejo-pdv-br`](addons/varejo-pdv-br/) | SAT-CF-e, NFC-e, TEF, MFE-CE, ECF, integração com balança/impressora |

Instalar: `npx roldao-method add <nome>`. Criar o seu: [addons/README.md](addons/README.md).

## Fluxo do `/feature`

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

Mudança trivial (≤ 3 arquivos, ≤ 50 linhas)? Use `/quick-dev`. Bug reportado? `/bug` — REGRA #0 obriga `investigador` antes.

## Suporte por IDE — paridade real

Hooks bash rodam **só no Claude Code**. Nos outros 8 IDEs a disciplina vem por **prompt textual** (regra carregada via `.cursorrules`/`.windsurf/rules`/etc.).

| Feature | Claude Code | Cursor | Windsurf | Continue | Cline | Roo | Aider | Gemini | Codex |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Agentes (14) | ✅ exec | 📝 texto | 📝 texto | 📝 texto | 📝 texto | 📝 texto | 📝 texto | 📝 texto | 📝 texto |
| Hooks bloqueadores (22) | ✅ exit 2 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Comandos (22) | ✅ exec | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Skills (11 core) | ✅ exec | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Spec-driven + PT-BR | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Usa Cursor/Windsurf/etc. e quer hooks mecânicos? Rode o Claude Code em paralelo nos pontos críticos (commit, release).

## O que o ROLDAO-METHOD NÃO faz (non-goals)

- ❌ Não é runtime de IA — depende de Claude Code, Cursor ou similares.
- ❌ Não gera código sozinho — estrutura o trabalho do agente.
- ❌ Não é IDE/editor.
- ❌ Não substitui CI/CD do produto final.
- ❌ Não é certificação legal/fiscal — orienta, não certifica.
- ❌ Não trava idiomas além de PT-BR.
- ❌ Não é template de projeto (Django/React/etc).

## Documentação

- [Quickstart](docs/QUICKSTART.md) — do zero ao primeiro `/feature` em 5 min
- [Como funciona](docs/COMO-FUNCIONA.md) — estrutura + fluxo
- [Exemplo de feature completa](docs/EXEMPLO-FEATURE-COMPLETA.md) — transcrição realista
- [Exemplos materializados](docs/examples/README.md) — story preenchida (US-001) com campos vivos
- [Estendendo o framework](docs/EXTENDENDO.md) — criar agente, hook, skill ou addon
- [Plan mode + sessões](docs/PLAN-MODE-E-SESSOES.md) — revisar antes de tocar disco, retomar sessão
- [FAQ](docs/FAQ.md) · [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Casos de uso BR](docs/CASOS-DE-USO-BR.md) — NF-e, telemedicina, Pix, eSocial, e-commerce, EAD, Open Finance
- [Guia MCP](docs/MCP-GUIA-BR.md) · [Arquitetura](docs/ARQUITETURA.md)
- [Publicar no npm](docs/PUBLICAR-NPM.md) — processo de release pro mantenedor
- [Roadmap público](ROADMAP.md) · [Addons](addons/README.md)

## Licença · Contribuir · Suporte

MIT. Pull requests bem-vindos (foco em qualidade e clareza > volume — ver [CONTRIBUTING.md](CONTRIBUTING.md)).

- Issues: https://github.com/roldaobatista/roldao-method/issues
- Discussões: https://github.com/roldaobatista/roldao-method/discussions

---

**Criado por:** Roldão · **Inspirado por:** experiência real construindo SaaS regulado no Brasil
