# ROLDAO-METHOD

> Framework de desenvolvimento ágil assistido por IA, **em português brasileiro**, com especialistas virtuais, regras automáticas e fluxos guiados.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Português](https://img.shields.io/badge/idioma-pt--br-green.svg)](#)

---

## O problema

Ferramentas de IA pra desenvolvimento (BMAD, Cursor rules, agentes Claude Code) são **todas em inglês**. Devs brasileiros que dependem dessas ferramentas perdem nuance, traduzem mal e ainda têm que adaptar exemplos gringos pra realidade BR (LGPD, NF-e, Pix, integração Receita).

E pior: a maioria dessas ferramentas pula direto pra escrever código. **Sem investigar**. Sem ler o estado real do banco, dos logs, do payload. Resultado: bugs mascarados, retrabalho, e o usuário não-técnico achando que o agente "não entende o produto dele".

## A solução

**ROLDAO-METHOD** é um framework que:

- 🇧🇷 **Fala português nativo** — não é tradução
- 🔍 **Investiga antes de mexer** — REGRA #0 codificada nos workflows
- 👥 **8 especialistas virtuais** com papéis claros (PM, Tech Lead, Dev, Revisor, 3 Auditores)
- 🛡️ **5 regras automáticas** que bloqueiam erros antes de acontecer (secrets, comandos destrutivos, mascaramento) + 1 runner de testes pros próprios hooks
- 📜 **Spec-driven** — primeiro a especificação, depois o código
- 🎯 **Foco no mercado BR** — LGPD, NF-e, Pix, fiscal, padrões brasileiros

## Instalação

```bash
npx roldao-method install
```

Detecta automaticamente sua ferramenta (Claude Code, Cursor) e instala os arquivos no lugar certo.

## Especialistas virtuais

| Agente | Papel |
|---|---|
| **Investigador** | Lê código, banco, logs ANTES de propor solução. Bloqueia chute. |
| **Gerente de Produto** | Traduz pedido vago em demanda clara. Faz pergunta certa. |
| **Tech Lead** | Decide arquitetura. Avalia tradeoffs. Escolhe stack. |
| **Dev Sênior** | Implementa. Código simples, testável, sem over-engineering. |
| **Revisor** | Audita o que foi feito. Caça bug, vulnerabilidade, débito. |
| **Auditor de Segurança** | LGPD, secrets, vulnerabilidades, supply chain. |
| **Auditor de Qualidade** | Testes, cobertura, mocks indevidos, anti-padrões. |
| **Auditor de Produto** | Aderência ao que o cliente pediu. Non-goals. |

## Workflows

| Comando | Quando |
|---|---|
| `/inicio` | Projeto novo do zero |
| `/feature` | Nova funcionalidade |
| `/bug` | Corrigir comportamento errado (investigador obrigatório) |
| `/refactor` | Reorganizar código |
| `/auditoria` | Passar os 3 auditores |

## Regras automáticas (hooks)

5 hooks bloqueadores + 1 runner de testes:

- `block-destructive` — barra `rm -rf`, `git push --force`, `drop table`
- `secrets-scanner` — bloqueia escrita de `.env`, chaves, credenciais
- `anti-mascaramento` — barra `--no-verify`, `@ts-ignore`, `assertTrue(true)` (mascarar bug)
- `context-budget` — avisa quando contexto está ficando longo
- `paths-frontmatter-validator` — garante metadado em docs
- `_test-runner` — runner de testes pros próprios hooks (não bloqueia nada)

## Diferencial vs BMAD-METHOD

| | BMAD-METHOD | ROLDAO-METHOD |
|---|---|---|
| Idioma | Inglês | 🇧🇷 Português nativo |
| Mercado-foco | Global/genérico | Brasil (LGPD, fiscal, BR) |
| Investigação | Opcional | Obrigatória no `/bug` |
| Regras automáticas | Não tem | 6 hooks bloqueadores |
| Auditores | Não tem | 3 auditores dedicados |
| Spec-driven | Parcial | Total (`.specify/` core) |

## Licença

MIT. Use, modifique, distribua à vontade.

## Contribuir

Pull requests bem-vindos. Foco em qualidade e clareza > volume de features.

---

**Criado por:** Roldão · **Baseado em:** experiência real construindo SaaS regulado no Brasil
