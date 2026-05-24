---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: coerencia-pt-br
nota: 6.5/10
---

# Auditoria Coerência PT-BR — 2026-05-24

## Resumo executivo
**Nota: 6.5/10.** Área mais bem cuidada: skill `traduzir-jargao` e agente `tech-writer` (Camila) — tabela canônica clara, tom didático e consistente. Área mais negligenciada: comandos e descrições internas de agentes técnicos (`devops-infra`, `dba-dados`, `tech-lead`, `revisor`, `dev-senior`), que usam jargão sem tradução como linguagem nativa — INV-AGENT-001 é pregada na doc do framework mas violada dentro do próprio framework.

## O que está coeso (manter)
- `.claude/skills/traduzir-jargao/SKILL.md:19-40` — tabela de tradução canônica completa, replicada coerentemente em `block-jargon-pt-br.js:80-86` e em `CLAUDE.md` global do usuário.
- `.claude/agents/tech-writer.md:11-19` — identidade Camila com `comunicacao: "Direta, clara, sem jargao tecnico"`.
- `.claude/commands/explicar-para-cliente.md:19-32` — único comando que traduz ativamente jargão; serve como modelo.
- `README.md:1-3` — pitch de capa em PT-BR claro pra dono de produto.
- `REGRAS-INEGOCIAVEIS.md` — acentuação 100% correta, tom uniforme.

## Jargão sem tradução (P0)
- **`commit/branch/merge/PR`** em `checkpoint.md:2-3,12,37,55` — argumento "[branch | PR-N | commit-sha]" e título "review humano de mudança antes de merge" não traduzem nada. Sugestão: "[ramo | proposta-N | identificador da gravação]" + glossário inline.
- **`endpoint`** em `inicio.md:36` ("1 endpoint/tela de exemplo") e `dba-dados.md:56,77`. Sugestão: "rota / serviço que responde".
- **`refactor`** em `refactor.md:8,10,21,23,39` e título do próprio comando — saída "reorganizar sem mudar comportamento" existe no h1, mas o corpo volta a usar "refactor" 6x.
- **`rollback`** em `devops-infra.md:19,20,28,30,57,67,77` e `auditor-produto.md:68,129` — termo central, nunca traduzido. Sugestão: "plano de volta pra versão anterior".
- **`deploy`** em `devops-infra.md:3,19,20,26,28,50,56,57,65,68,77` (11 ocorrências num agente só) e `MAPA-VISUAL.md:35`. Sugestão: "subida pro servidor de produção".
- **`build/lint/CI`** em `brownfield.md:23,56` e `inicio.md:34` (`"Configuração de teste, lint, formatador"`).
- **`mock/fixture`** em `auditor-qualidade.md:44` e `revisor.md:65`. Sugestão: "dados falsos".
- **`stack trace / build`** em `explicar-para-cliente.md:19` — irônico: comando que prega traduzir usa "Stack trace / erro de build" no próprio título de exemplo.
- **`migration`** em `devops-infra.md:20,50,77` e `dba-dados.md:17,27,55,71`. Sugestão: "mudança na estrutura dos dados salvos".
- **`branch protection / cherry-pick / stash / bisect / rebase`** todos no `block-jargon-pt-br.js:11-25` como termos detectados — mas o `checkpoint.md` e `hotfix.md` os usam livremente sem aspas explicativas, configurando contradição: o hook bloqueia ao usuário mas a doc interna libera.

## Acentuação faltando (P1)
- **`comunicacao`, `traducao`, `versao`, `dominio`, `regulacao`, `funcao`, `producao`, `nao`, `voce`** em `analista.md:10-16,33-40` — frontmatter inteiro sem acento.
- **`traducao`, `producao`, `nao`, `usuario`, `tecnico`** em `tech-writer.md:3,14-19,40-48` — agente que cuida da clareza não acentua.
- **`Codigo`, `logica`, `critica`, `validacao`, `proximo`** em `dev-senior.md:11-16` (frontmatter).
- **`producao`, `validacao`, `funcao`** em `validar-pix/SKILL.md:51,55`.
- **`nao`, `voce`, `tambem`** ocorrem em **15 de 17 arquivos** de `.claude/agents/` (todos exceto `MAPA-VISUAL.md` e `PERSONAS.md`).
- **`Sao Paulo`, `Sao` por `São`** — pulverizado em comentários de hooks.
- Inconsistência interna no MESMO arquivo `tech-writer.md` — corpo principal usa "Você é o Tech Writer" com acento, frontmatter usa "Voce e o" sem.

## Inconsistência de tom entre agentes (P1)
- **`analista.md`** (frontmatter sem acento, prosa sem acento, tom "Mariana curiosa") vs **`auditor-seguranca.md`** (frontmatter com acento completo, tom seco e técnico) — leitor sente que são produtos diferentes.
- **`devops-infra.md`** é o agente MAIS jargonizado do framework (32+ termos técnicos em inglês), enquanto **`gerente-produto.md`** e **`tech-writer.md`** são os mais cuidadosos. Não há "linha do meio" — é polarizado.
- **Frontmatters dos 17 agentes**: ~50% sem acento (analista, dev-senior, gerente-produto, tech-writer, ux-designer, fiscal-br) e ~50% com acento (auditor-*, dba-dados, devops-infra, maestro, revisor, tech-lead).

## `block-jargon-pt-br.js` — falsos negativos óbvios (P2)
A lista em `block-jargon-pt-br.js:8-26` cobre git, deploy/CI, arquitetura básica. **Falta:**
- **`mock`, `fixture`** — apesar de constarem na tabela de tradução, NÃO estão na regex do hook.
- **`migration`** — mesmo caso.
- **`backend`, `frontend`, `cache`, `webhook`, `token`, `JWT`, `API`, `database`, `DB`, `payload`** — todos na tabela `traduzir-jargao` mas ausentes do hook.
- **`stack trace`, `null pointer`, `race condition`, `edge case`** — comuns, ausentes.
- **`hotfix`, `pipeline`, `gate`** — usados pelo próprio framework e não bloqueados.

Recomendação: sincronizar a regex do hook com a tabela canônica de `traduzir-jargao/SKILL.md` (a tabela tem ~20 termos a mais).

## Veredito
O framework **prega PT-BR rigoroso mas pratica PT-BR de fachada nas próprias entranhas**. As 3 camadas voltadas pro usuário leigo (README, `tech-writer`, skill `traduzir-jargao`) são exemplares. As camadas internas (agentes técnicos `devops-infra`/`dba-dados`/`dev-senior`, comandos `checkpoint`/`refactor`/`hotfix`, frontmatters sem acento em 50% dos agentes) tratam PT-BR como exigência de saída, não como contrato do próprio produto. O hook `block-jargon-pt-br.js` reforça essa contradição: bloqueia o leitor final mas omite `mock/fixture/migration/backend/cache`. **Correção prioritária:** (1) sincronizar regex do hook com a tabela `traduzir-jargao`, (2) normalizar acentuação dos frontmatters dos 17 agentes (script automatizável), (3) reescrever `devops-infra.md` e `dba-dados.md` ou criar exceção declarada ("estes agentes falam com dev, não com leigo").
