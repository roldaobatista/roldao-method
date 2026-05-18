---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Contribuidores e processo

## Como contribuir

1. **Antes de codar:** abra Discussion em <https://github.com/roldaobatista/roldao-method/discussions> descrevendo o que pretende fazer. Evita PR que vai ser fechado.
2. **Fork + branch:** trabalhe em branch nomeada (`feat/<slug>`, `fix/<slug>`, `docs/<slug>`).
3. **Quality gates locais:**
   ```bash
   npm test   # roda validar + test:hooks + test:install
   ```
4. **Commits atômicos:** um propósito por commit. Mensagem segue [Keep a Changelog convention](https://keepachangelog.com/pt-BR/1.1.0/) (feat/fix/refactor/chore/docs/test/perf/build/ci).
5. **PR pequeno:** prefira 1 PR por preocupação. Reduza atrito de review.
6. **Use Co-Authored-By Claude** quando o agente ajudou.

## O que aceitamos com prazer

- Bug fixes com teste de regressão.
- Documentação melhor / mais clara.
- Skills BR novas (ver `templates/.claude/skills/` pra padrão).
- Addons BR novos (ver `addons/README.md` pra schema).
- Casos de uso BR documentados em `docs/CASOS-DE-USO-BR.md`.
- Traduções de jargão pra `kb-pt-br.md`.
- Adapters de IDE novos (Continue, Aider, Codex, Gemini CLI, etc).

## O que rejeitamos (com motivo)

- Tradução do framework pra inglês — non-goal do roadmap. Pode ter addon de tradução.
- Skill genérica que não tem relação com BR — sugerir adaptar ou abrir como addon.
- Hook opcional que poderia ser bloqueador — vai contra a filosofia "impede, não orienta".
- PR que mistura várias preocupações — pedimos pra dividir.
- PR sem teste em código de framework — pedimos cobertura proporcional.

## Estrutura do projeto

Ver [docs/ARQUITETURA.md](docs/ARQUITETURA.md) pra mapa completo.

Resumo:
```
bin/install.js              ← CLI
templates/                  ← o que vai pra .claude/ e .specify/ do projeto do usuário
  .claude/agents/           ← 12 agentes com identity + menu + skills
  .claude/commands/         ← 19 workflows slash
  .claude/hooks/            ← 22 bloqueadores + 4 auxiliares + 2 utilitários (_lib + _test-runner) = 28 hooks (+5 em addons)
  .claude/skills/           ← 8 skills BR core
  .specify/templates/       ← 11 templates de spec
  .specify/checklists/      ← 7 checklists
  .specify/data/            ← 7 knowledge bases
  .specify/memory/          ← constitution.md (6 princípios)
addons/                     ← 6 addons BR
docs/                       ← docs do framework
test/                       ← smoke tests
tools/                      ← validadores
evals/                      ← evals dos agentes
.github/workflows/          ← CI matriz Win/Mac/Linux
```

## Padrão dos commits

```
feat(addons): novo addon agro-br com CAR e SISBOV

- Agente agro-arch
- Hook validate-car-coordinates
- Skill emitir-nota-produtor

Co-Authored-By: Claude <noreply@anthropic.com>
```

Tipos:
- `feat`: feature nova
- `fix`: correção de bug
- `refactor`: reorganização sem mudar comportamento
- `chore`: tarefas auxiliares (deps, build, configs)
- `docs`: só documentação
- `test`: só testes
- `perf`: melhoria de performance
- `build`: build/empacotamento
- `ci`: CI/CD

Hook `commit-message-validator` valida automaticamente.

## Filosofia de versionamento

[SemVer](https://semver.org/lang/pt-BR/) com algumas convenções:
- **Major (1.0+):** breaking change anunciada com 30+ dias.
- **Minor:** addons novos, hooks novos, comandos novos, skills novas.
- **Patch:** bug fix, doc fix, melhoria de mensagem.
- Toda release tem entry no CHANGELOG.md.

## Contribuidores (alfabético)

| Pessoa | Áreas | GitHub |
|---|---|---|
| Roldão Batista | Idealização, core, addons BR, regulação | [@roldaobatista](https://github.com/roldaobatista) |
| Claude (Anthropic) | Co-autoria em commits via agente | — |

Quer aparecer aqui? Mande PR. Critério: ≥ 3 PRs aceitos OU 1 addon completo OU 1 skill BR.

## Código de conduta

Em construção. Por enquanto:
- Trate todos com respeito.
- Crítica é sobre código/decisão, nunca sobre pessoa.
- Discussão em PT-BR é bem-vinda; em inglês também.
- Zero tolerância pra assédio.

## Suporte

- **Issues:** <https://github.com/roldaobatista/roldao-method/issues>
- **Discussions:** <https://github.com/roldaobatista/roldao-method/discussions>
- **Security:** ver [SECURITY.md](SECURITY.md)
- **Discord:** em planejamento (ver ROADMAP)
