# ROLDAO-METHOD

> **Manual de operação em português pro seu assistente de IA (Claude, Cursor, etc).** Você descreve em PT-BR o que quer ("quero cadastrar cliente", "o boleto saiu errado") e ele segue um roteiro pronto: investiga antes de mexer, valida CPF/CNPJ, respeita LGPD, te avisa em PT-BR claro — sem siglas. Pensado pra dono de produto que **não programa**, no contexto brasileiro (NF-e, Pix, eSocial).

## Para quem é (e pra quem NÃO é)

**É pra você se:** você quer que IA gere código pro seu produto e você **não é programador** (ou tem dev terceirizado/aspirante a empresa), opera no Brasil (precisa LGPD/NF-e/Pix/SEFAZ), e cansou de saída em inglês com jargão. Você conduz, o assistente executa.

**NÃO é pra você se:** você é dev sênior que prefere convenção em vez de bloqueio mecânico, prefere fluxo livre sem hook, ou seu produto não toca dado brasileiro (LGPD/fiscal/Pix). Continue com BMAD, AGENT-CLI, ou seu próprio fluxo — esse framework optimizou pra dono de produto BR que precisa de proteção embutida.

[![CI](https://github.com/roldaobatista/roldao-method/actions/workflows/validar.yml/badge.svg)](https://github.com/roldaobatista/roldao-method/actions/workflows/validar.yml)
[![npm](https://img.shields.io/npm/v/roldao-method.svg)](https://www.npmjs.com/package/roldao-method)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Português](https://img.shields.io/badge/idioma-pt--br-green.svg)](#)

## Experimente em 30 segundos (sem instalar nada)

```bash
npx roldao-method demo
```

Roda 3 verificações reais: bloqueia um `rm -rf /`, pega uma credencial AWS num arquivo, reprova um CPF inválido. Sem precisar de Claude Code, sem chave de API, sem cadastro.

<!-- TODO J12 (T-019): adicionar GIF/video de 90s do demo rodando.
     Asset esperado em docs/assets/demo.gif (Roldao grava via Loom/OBS).
     Linha pronta pra ativar quando asset existir:
     ![demo](docs/assets/demo.gif) -->

> 💡 **Roda `npx roldao-method` sem nada** e ele te mostra o menu com as 4 opções principais (demo, install, tutorial, doctor).

## Instalar no seu projeto

```bash
npx roldao-method install        # copia o framework pra pasta atual
npx roldao-method tutorial       # 5 perguntas em PT-BR preenchem o resto por você
```

Depois, no seu assistente de IA: `/inicio` (projeto novo) ou `/brownfield` (já tem código). `/help` lista os 26 roteiros. Glossário sem jargão em [`docs/GLOSSARIO.md`](docs/GLOSSARIO.md). Quem não programa começa em [`docs/PARA-DONO-DE-PRODUTO.md`](docs/PARA-DONO-DE-PRODUTO.md). Novidades em [`CHANGELOG.md`](CHANGELOG.md).

### Vindo da v1.x?

`npx roldao-method@latest update` faz tudo. Detalhes da migração em [`docs/migrations/MIGRATION-v2.md`](docs/migrations/MIGRATION-v2.md) (3 breaking changes, todos absorvidos pelo update). Se algo der errado: `npx roldao-method rollback`.

### Descoberta — como achar o que existe

Não decora comando. Use uma das 3 portas de entrada:

| Quando você quer... | Use |
|---|---|
| Saber qual roteiro existe pra cada situação | `/help` (no Claude) — tabela "Comando \| Pra quê \| Quando usar" + skills + addons |
| Achar comando/skill/addon por frase natural em PT-BR | `npx roldao-method search "preciso reportar bug"` → sugere `/bug` |
| Saber o primeiro dia de uso | [`docs/PRIMEIRO-DIA.md`](docs/PRIMEIRO-DIA.md) — 30 minutos guiados |
| Ver exemplos preenchidos de PRD/ADR/US | [`docs/exemplos/`](docs/exemplos/) — 5 casos brasileiros completos |
| Diagnosticar instalação ou descobrir campos vazios | `npx roldao-method doctor` |

---

## O diferencial em uma linha

**O sistema barra a ação perigosa antes dela acontecer** — `rm -rf`, senha vazada no código, teste escondendo erro, jargão técnico com cliente, bug "consertado" sem investigar o banco/log. Não é convenção que o dev pode ignorar: o framework recusa a operação na hora. Detalhe técnico (como funciona) em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).

### Métrica de sucesso

**Não é "100% de cobertura" nem "0 bugs".** É **5 tarefas-tipo que o dono de produto (que não programa) executa sozinho, sem chamar dev**. Detalhe em [`docs/METRICA-OFICIAL.md`](docs/METRICA-OFICIAL.md).

### Por que importa pra dev BR

Ferramentas de IA pra desenvolvimento são quase todas em inglês e otimizadas pra realidade gringa. Dev brasileiro perde nuance e ainda adapta exemplos pra LGPD/NF-e/Pix/Receita Federal. O ROLDAO entrega:

- 🇧🇷 **PT-BR nativo** — não tradução. Tabela de jargão pra usuário não-programador.
- 🛡️ **34 verificações automáticas** — 26 barram operação perigosa na hora, 2 mandam aviso, 5 cuidam de manutenção automática (formatação, snapshot, auditoria), 1 ferramenta interna. Rodam em Windows puro desde a v1.0. Detalhe em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md).
- 🔍 **Investigação obrigatória em bug** — REGRA #0 codificada em workflow `/bug` + hook mecânico.
- 🧾 **Cobertura BR real** — LGPD, NF-e/NFC-e, eSocial, Pix, CNPJ alfanumérico (jul/2026), Reforma Tributária 2026-2033 + 7 addons verticais.
- 🧪 **3 auditores especializados** — segurança, qualidade, produto em paralelo, bloqueando commit se reprovado.

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

- **Node.js 18+** (CI: 20+) — requisito do framework (todos os hooks, CLI, validadores).
- **Python 3.10+** (opcional, mas necessário pra 9 skills BR) — usado por: `validar-cpf-cnpj`, `validar-chave-acesso-nfe`, `validar-codigo-municipio-ibge`, `validar-cep`, `validar-ie`, `validar-pix`, `validar-boleto`, `gerar-br-code`, `gerar-test-fixture-br`. Sem Python local essas skills falham com erro claro; o agente IA continua funcionando, mas você não consegue validar CPF/CNPJ/chave NF-e localmente — o que pode mascarar bug em dado brasileiro. Decisão registrada em [ADR-018](docs/decisions/ADR-018-python-requisito-skills.md).
- **bash/perl/Git Bash:** **não são mais requisito.** A v1.0 portou todos os hooks pra Node puro, então rodam em Windows puro (PowerShell/CMD) sem Git for Windows instalado. Quem ainda usa bash auxiliar fora do framework continua livre pra usar.

## O que vem instalado

- **15 especialistas virtuais com personalidade** — Maestro (orquestrador), Sofia (PM), Detetive (investigador), Rafael (tech-lead), Bruno (dev), Helena (DBA), Lucas (DevOps/infra), Inês (revisor), Caio/Julia/Pedro (3 auditores), Mariana (analista), Lia (UX), Dona Marta (fiscal-BR), Camila (tech-writer). Catálogo em [`.claude/agents/MAPA-VISUAL.md`](templates/.claude/agents/MAPA-VISUAL.md). Detalhes em [`AGENTS.md §4`](AGENTS.md).
- **28 workflows (slash commands)** — `/inicio`, `/brownfield`, `/prd`, `/epico`, `/historia`, `/clarificar`, `/feature`, `/quick-dev`, `/bug`, `/hotfix`, `/incident-postmortem`, `/refactor`, `/qa`, `/auditoria`, `/auditoria-reversa`, `/consistencia`, `/explicar-para-cliente`, `/retro`, `/replanejar`, `/sprint`, `/status`, `/checkpoint`, `/release`, `/readiness`, `/help`, `/shard`, `/agentes`, `/o-que-aconteceu`. Detalhes em [`AGENTS.md §5`](AGENTS.md).
- **26 hooks bloqueadores + 2 soft warnings + 5 lifecycle + 1 infra (`_lib.js`) = 34 hooks Node** — tabela completa em [`.claude/rules/roldao-method.md`](templates/.claude/rules/roldao-method.md). Inclui: destrutivo, secrets, mascaramento, mock em integration, TODO sem ID, dado real em fixture, URLs hardcoded, chave Pix em log, fix sem investigação, readiness, sequência de agentes, escopo /quick-dev, checkpoint antes de merge, 3 auditores antes de commit, jargão PT-BR, pergunta de confirmação, pipeline incompleto.
- **13 skills BR core** — validar-cpf-cnpj (com CNPJ alfanumérico jul/2026), validar-chave-acesso-nfe (44 dígitos NF-e/NFC-e/CT-e/MDF-e), validar-codigo-municipio-ibge (DV modulo 10), validar-pix, validar-cep, validar-ie (27 UFs), validar-boleto, gerar-br-code, gerar-test-fixture-br, gerar-adr-pt-br, traduzir-jargao, brainstormar-ideia, checklist-lgpd. +18 nos addons = **31 skills** (inclui `calculadora-reforma-paralela` pra LC 214/2025 e `validar-cns-cartao-sus` pra SUS).
- **12 templates de spec** PT-BR (PRD, story, architecture, fullstack-arch, brownfield-PRD, PRD-fiscal, decision-log, PRFAQ, product-brief, UX-design, headless-schemas, épico).
- **8 checklists auditáveis** + **7 knowledge bases** + **7 addons verticais BR**.

> **Escopo honesto das verificações:** são guarda-corpos para um agente IA atento mas distraído (o caso comum). Barram o erro óbvio na hora. **Não substituem revisão humana** — quem tem permissão de escrita pode mexer nas próprias regras. É defesa em camadas, não cofre. Funcionam em qualquer computador com Node 18+ instalado (Windows puro inclusive, desde a v1.0).

## Cobertura BR — IDs rastreáveis em commit

`REGRAS-INEGOCIAVEIS.md` tem a lista completa: **46 regras operacionais em 7 categorias** — INV-001..006 (6 invariantes gerais), SEC-001..005 (5 segurança), TST-001..004 (4 testes), LGPD-001..010 (10 proteção de dados), FISCAL-001..010 (10 fiscal BR — NF-e, NFS-e nacional, MDF-e/CT-e, Reforma, split payment), PIX-001..005 (5 Pix/Open Finance), INV-AGENT-001..006 (6 regras pra agentes IA). Cada regra cita-se em commit/ADR/PR (ex: `fix: ajusta validação CPF (LGPD-001)`).

## 7 addons verticais

| Addon | Pra quem é | Foco técnico |
|---|---|---|
| [`electron-br`](addons/electron-br/) | Quem cria app de desktop que o cliente instala (Windows/Mac/Linux) | IPC seguro + SQLite + LGPD local |
| [`fiscal-br-completo`](addons/fiscal-br-completo/) | Quem emite nota fiscal e vai entrar na Reforma Tributária 2026-2033 | NF-e 55, NFC-e, NFS-e, CNPJ alfanumérico |
| [`lgpd-compliance`](addons/lgpd-compliance/) | Quem precisa de DPO, RIPD e canal do titular pra LGPD | Plano de incidente 72h, base legal por feature |
| [`fintech-br`](addons/fintech-br/) | Quem integra pagamento Pix ou Open Finance | BR Code, webhook HMAC, devolução, Pix Automático |
| [`esocial-completo`](addons/esocial-completo/) | Empresa que manda eventos pro eSocial (folha, SST, CIPA) | Eventos S-1000 a S-3000, prazo legal, retificação |
| [`varejo-pdv-br`](addons/varejo-pdv-br/) | Quem opera caixa/PDV físico (loja, restaurante, padaria) | SAT-CF-e, NFC-e, TEF, integração com balança/impressora |
| [`healthtech-br`](addons/healthtech-br/) (beta) | Clínica, telemedicina, prontuário eletrônico, plano de saúde | CFM 2.314, ANS RN 305, CNS/SUS, TISS/TUSS, LGPD Art. 11 |

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

Hooks Node puros rodam **só no Claude Code** (único IDE que expõe o ciclo PreToolUse/PostToolUse/Stop). Nos outros 8 IDEs a disciplina vem por **prompt textual** (regra carregada via `.cursorrules`/`.windsurf/rules`/etc.).

| Feature | Claude Code | Cursor | Windsurf | Continue | Cline | Roo | Aider | Gemini | Codex |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Agentes (15) | ✅ exec | 📝 texto | 📝 texto | 📝 texto | 📝 texto | 📝 texto | 📝 texto | 📝 texto | 📝 texto |
| Hooks bloqueadores (26) | ✅ exit 2 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Comandos (26) | ✅ exec | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Skills (13 core) | ✅ exec | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
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

## 💼 Apoio profissional · Sponsors

Core é MIT puro. Para empresas/PMEs que querem **adoção mais rápida**, **suporte SLA** ou **auditoria reversa** de repo legado: ver [`docs/CONSULTORIA.md`](docs/CONSULTORIA.md). Sponsors individuais e corporativos: [GitHub Sponsors](https://github.com/sponsors/roldaobatista).

---

**Criado por:** Roldão · **Inspirado por:** experiência real construindo SaaS regulado no Brasil
