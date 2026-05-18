# ROLDAO-METHOD

> Framework de desenvolvimento ágil assistido por IA, **em português brasileiro**, com especialistas virtuais, regras automáticas e fluxos guiados para Claude Code e Cursor.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Português](https://img.shields.io/badge/idioma-pt--br-green.svg)](#)
[![Versão](https://img.shields.io/badge/versão-0.3.0-blue.svg)](#)
[![Hooks: 35/35](https://img.shields.io/badge/hooks-35%2F35-green.svg)](#)

---

## O problema

Ferramentas de IA pra desenvolvimento (BMAD, Cursor rules, agentes Claude Code) são **todas em inglês**. Devs brasileiros perdem nuance e ainda têm que adaptar exemplos gringos pra realidade BR (LGPD, NF-e, Pix, Receita Federal).

E pior: a maioria pula direto pra escrever código. **Sem investigar.** Sem ler o estado real do banco, dos logs, do payload. Resultado: bugs mascarados, retrabalho, e o usuário não-técnico achando que o agente "não entende o produto dele".

## A solução

**ROLDAO-METHOD** é um framework que:

- 🇧🇷 **Fala português nativo** — não é tradução
- 🔍 **Investiga antes de mexer** — REGRA #0 codificada no workflow `/bug`
- 👥 **11 especialistas virtuais** com papéis claros (analista, PM, UX, tech-lead, investigador, dev, revisor, 3 auditores, fiscal-BR)
- 🛡️ **7 regras automáticas que bloqueiam** erros antes de acontecer (secrets, comandos destrutivos, mascaramento, mock em integration, TODO sem ID, commit mal formado, amend após push)
- 📜 **Spec-driven total** — templates de PRD, story, architecture, decision-log em PT-BR
- 🎯 **Cobertura BR real** — 10 IDs LGPD, 7 IDs FISCAL, 5 IDs PIX; skills validam CPF/CNPJ alfanumérico (jul/2026), chave Pix, CEP, checklist LGPD

## Instalação

```bash
npx roldao-method install
```

Detecta Claude Code, Cursor, Windsurf, Continue, Aider. Sub-comandos:

```bash
npx roldao-method update       # atualiza framework, preserva customizações
npx roldao-method doctor       # diagnostica instalação
npx roldao-method uninstall    # remove (preserva AGENTS.md, CLAUDE.md, REGRAS)
npx roldao-method help
```

Flags: `--yes` (CI), `--force`, `--dry-run`.

## 11 especialistas virtuais

| Agente | Papel | Modelo |
|---|---|---|
| **Analista** | Pesquisa de mercado, brief, PRFAQ, regulamentação BR | haiku |
| **Gerente de Produto** | PRD, story, decomposição (4 modos: brief/PRD/story/decomp) | haiku |
| **UX Designer** | Wireframe ASCII, 5 estados por tela, mensagens PT-BR | haiku |
| **Tech Lead** | Arquitetura, ADR, ARQ, checklist de readiness | sonnet |
| **Investigador** | Lê estado real antes de mexer. Obrigatório em `/bug` | sonnet |
| **Dev Sênior** | Implementa com TDD onde paga | sonnet |
| **Revisor** | Aderência à US + anti-padrões | sonnet |
| **Auditor de Segurança** | LGPD, secrets, OWASP, supply chain | sonnet |
| **Auditor de Qualidade** | Cobertura, mocks indevidos, TST-* | sonnet |
| **Auditor de Produto** | Aderência ao pedido, non-goals | haiku |
| **Fiscal BR** | NF-e, certificado, eSocial, Reforma Tributária, CNPJ alfanum. | sonnet |

## 11 workflows (slash commands)

| Comando | Quando |
|---|---|
| `/inicio` | Projeto novo do zero |
| `/brownfield` | Adotar o framework em projeto que já existe |
| `/prd` | Iniciativa grande (vários meses) |
| `/epico` | Decompor coisa grande em várias histórias |
| `/historia` | 1 funcionalidade — gera `US-NNN` em disco |
| `/feature` | Implementar funcionalidade nova |
| `/bug` | Corrigir comportamento (investigador obrigatório) |
| `/refactor` | Reorganizar sem mudar comportamento |
| `/qa` | Gerar/auditar testes de uma área |
| `/auditoria` | Passar pelos 3 auditores |
| `/retro` | Retrospectiva pós-marco |

## 7 hooks bloqueadores + 5 auxiliares

**Bloqueadores** (retornam exit 2, barram a ação):

- `block-destructive` — `rm -rf`, `git push --force`, `DROP TABLE`, `--no-verify`
- `secrets-scanner` — `.env`, chaves, tokens (AWS, OpenAI, Anthropic, GitHub, Slack)
- `anti-mascaramento` — `@ts-ignore`, `.skip`, `assertTrue(true)`, `|| true`
- `block-mock-in-integration` — mock em arquivo de integration/e2e (TST-003)
- `block-todo-without-issue` — `TODO`/`FIXME` sem ID rastreável
- `commit-message-validator` — commits misturando prefixos ou primeira linha > 72
- `no-amend-after-push` — `git commit --amend` em commit já pushado

**Auxiliares** (avisam, não bloqueiam):

- `context-budget` — AGENTS.md > 200 ou CLAUDE.md > 150 linhas
- `mcp-validator` — MCP server fora da allowlist
- `regra-zero-reminder` — injeta REGRA #0 quando detecta gatilho de bug
- `paths-frontmatter-validator` — exige frontmatter em `docs/*.md`
- `_test-runner` — 35 casos contra os hooks (manual / CI)

## 6 skills BR

- **gerar-adr-pt-br** — cria ADR a partir do template oficial
- **traduzir-jargao** — traduz texto técnico pra PT-BR claro
- **validar-cpf-cnpj** — valida CPF + CNPJ numérico **+ CNPJ alfanumérico (vigor jul/2026)**
- **validar-pix** — valida chave Pix (CPF/CNPJ/email/telefone/UUID) + EndToEndId + TxId
- **validar-cep** — valida CEP (formato + opcional ViaCEP)
- **checklist-lgpd** — árvore de decisão de base legal (Art. 7 / Art. 11) + 10 checks

## Cobertura BR — IDs rastreáveis em commit

- **LGPD-001 a LGPD-010** — bases legais, esquecimento, minimização, trilha, transfer. internacional, incidente/ANPD, RIPD, DPO, decisão automatizada
- **FISCAL-001 a FISCAL-007** — imutabilidade NF-e, certificado por tenant, homologação, contingência, CNPJ alfanumérico, Reforma Tributária 2026-2033, obrigação acessória
- **SEC-001 a SEC-004** — secrets, destrutivo, validar entrada, menor privilégio
- **TST-001 a TST-003** — anti-mascaramento, causa raiz, mock fora de integration
- **INV-001 a INV-006** — documento, spec-as-source, non-goals, IDs, concisão, causa raiz
- **INV-AGENT-001 a 006** — sem jargão, REGRA #0, pró-atividade, verificar antes, confirmar destruição, executar não passar pro usuário

## O que o ROLDAO-METHOD NÃO faz (non-goals)

- ❌ Não é runtime de IA — depende de Claude Code, Cursor ou similares.
- ❌ Não gera código sozinho — estrutura o trabalho do agente.
- ❌ Não é IDE/editor.
- ❌ Não substitui CI/CD do produto final.
- ❌ Não é certificação legal/fiscal — orienta, não certifica.
- ❌ Não trava idiomas além de PT-BR.
- ❌ Não é template de projeto (Django/React/etc).

## Diferencial vs BMAD-METHOD

| | BMAD-METHOD | ROLDAO-METHOD |
|---|---|---|
| Idioma | Inglês (+CN/VN, sem PT-BR) | 🇧🇷 PT-BR nativo |
| Mercado-foco | Global/genérico | Brasil (LGPD, fiscal, BR) |
| Investigação em bug | Opcional | **Obrigatória** (REGRA #0) |
| Regras automáticas | Não tem | **7 hooks bloqueadores** |
| Auditores | Não tem | 3 auditores dedicados |
| Agente fiscal BR | Não tem | `fiscal-br` |
| Skills BR | Zero | 6 (CPF/CNPJ alfanum, Pix, CEP, LGPD) |
| Spec-driven | Parcial | Total (`.specify/templates/`) |
| CNPJ alfanumérico 2026 | Não cobre | Já suportado |
| Reforma Tributária 2026 | Não cobre | `FISCAL-006` + agente fiscal |

Migração de BMAD: ver [docs/MIGRACAO-BMAD.md](docs/MIGRACAO-BMAD.md).

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
- [Addons](addons/README.md) — sistema de extensão

## Licença

MIT. Use, modifique, distribua à vontade.

## Contribuir

Pull requests bem-vindos. Foco em qualidade e clareza > volume de features. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Suporte

- Issues: https://github.com/roldaobatista/roldao-method/issues
- Discussões: https://github.com/roldaobatista/roldao-method/discussions

---

**Criado por:** Roldão · **Inspirado por:** experiência real construindo SaaS regulado no Brasil
