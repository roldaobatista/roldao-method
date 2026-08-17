---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: contrato cross-harness do meta-template (Claude Code, Cursor, Windsurf, Codex CLI, Kiro).
---

# AGENTS.md — meta-template "Modelo Projeto Novo"

> **Você (agente IA, qualquer harness) está DENTRO do meta-template.** Esta pasta não é um produto. É o método canônico que materializa projetos novos em OUTRA pasta.

## 1. Perfil do usuário (inegociável)

**Roldão não programa.** É dono/idealizador de produto. Conhece o produto melhor que ninguém, mas não lê código nem stack trace.

- **Linguagem**: pt-BR. Traduzir jargão técnico (PR → "pedido de revisão"; branch → "linha de trabalho"; commit → "salvar no sistema"; deploy → "subir pro servidor"; etc.). Tabela de tradução canônica (fonte única): `GLOSSARIO-ROLDAO.md`. A regra que a torna obrigatória é INV-AGENT-010 (que aponta para o glossário, não duplica a tabela).
- **Pró-atividade**: agente executa reversíveis sem perguntar. Nunca escreve `"Quer que eu...?"` ou `"Posso fazer X?"`. Confirma apenas destrutivo/irreversível/com custo. Matriz 2×2 em §13.1 do `templates/AGENTS.template.md`.
- **Causa raiz, nunca sintoma** (INV-AGENT-006): proibido mascarar erro (`skip`, `@ts-ignore`, `eslint-disable`, `|| true`, baseline pra esconder, asserção relaxada). Conserte a origem.
- **Reportar sempre** no formato: "fiz X, resolvi Y, comecei Z" — nunca "posso fazer Y?".

> As REGRAS-INEGOCIÁVEIS são **11** (INV-AGENT-001 a INV-AGENT-011) e vivem **completas** em `templates/REGRAS-INEGOCIAVEIS.template.md` (com gatilho, motivo, hook e auditor de cada uma). Esta seção cita só o subconjunto mais usado no dia a dia; a lista canônica é sempre a do template.

Detalhe completo: leia `templates/AGENTS.template.md` §1 e `templates/REGRAS-INEGOCIAVEIS.template.md` (especialmente INV-AGENT-003, INV-AGENT-004, INV-AGENT-005, INV-AGENT-006, INV-AGENT-010).

## 2. Reconhecimento de contexto — leia primeiro

Se o usuário pediu algo que pareça **iniciar um projeto novo** (frases como "quero criar", "novo projeto", "começar um sistema", "fazer um app/CLI/lib/SaaS para X"):

1. **NÃO escreva código nem arquivos dentro desta pasta.** Esta pasta é o método; permanece intacta.
2. Leia: `QUICKSTART.md` → `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md` §0 + §15 + §20 → `templates/README.md`.
3. **Pergunte só o nome** (se ainda não disse) → pasta destino `../<nome-kebab-case>/`. Não pergunte stack, regulação, equipe — isso sai da descoberta.
4. **Tipo é HIPÓTESE provisória**, não decisão. Use árvore §15 para etiquetar inicialmente; **decisão real do tipo só depois de C1 sintese-final em status:stable**.
5. **Fase-1 (descoberta-first)**: `bash bootstrap.sh "<destino>" "<nome>" [hipótese-de-tipo]`. Materializa só C0 + C1 (16 arquivos em `docs/descoberta/` + `docs/glossario.md`) + C9 multi-harness + C7/C10 esqueleto. NÃO materializa C6 nem C8.
6. **Conduza C1** com o usuário: preencher problema → personas → jornadas → BMC → VPC → ... → sintese-final. Inferir do briefing; perguntas concretas, não abertas.
7. **Quando sintese-final.md virar status:stable**, classifique tipo DEFINITIVO e rode `bash bootstrap-fase-2.sh "<destino>" "<tipo-definitivo>"`. Adiciona C5 + C6 (se aplicar) + C8 (se aplicar) + C12 (se OSS).
8. **Abrir ADR-0001 (stack) + ADR-0002 (tenancy/storage)** em docs/adr/. Antes disso, phase-gate.sh bloqueia src/.
9. **Reporte** no fim de cada fase: criado / pulado (com justificativa em `docs/nao-aplica.md`) / pendente.

### 2.1 Tipos canônicos de projeto

Estes são os tipos aceitos como argumento de `bootstrap.sh`/`bootstrap-fase-2.sh` e classificados pela árvore de decisão (`ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §15`). Use exatamente um destes rótulos:

`solo` · `experimento` · `cli` · `lib` · `oss-lib` · `interno` · `saas` · `saas-regulado` · `mobile` · `desktop` · `ia-ml` · `pipeline` · `bot` · `browser-ext` · `ide-ext` · `embedded` · `jogo` · `smart-contract` · `api-microservice`

> Esta é a lista única de referência. A árvore §15 explica como chegar a cada um; o que muda por tipo está na matriz §19. Na fase-1 o tipo é só hipótese; o definitivo sai da descoberta (C1).

## 3. Se o usuário pediu para AUDITAR, EVOLUIR ou CORRIGIR este meta-template

Aí sim pode editar arquivos DENTRO desta pasta. Sinais: "auditoria", "revisar manual", "criar template novo", "atualizar matriz", "corrigir achado". Respeitar `limite-linhas` do frontmatter.

## 4. Hierarquia de fontes de verdade (deste meta-template)

> **Atenção — duas hierarquias diferentes.** A lista abaixo vale AQUI DENTRO (no meta-template, que não tem `constitution.md`). O **projeto-destino** que você cria tem outra hierarquia, com a `constitution.md` no topo: `constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md`. Os modelos em `templates/` já trazem essa ordem porque vão pro projeto criado. Não confunda: a `constitution.md` só existe no projeto-destino, nunca neste meta-template.

Hierarquia DESTE meta-template:

1. `REGRAS-INEGOCIAVEIS` aplicáveis ao meta-template (linguagem do usuário, pró-atividade, causa-raiz/anti-mascaramento) — as **11** INV-AGENT-001 a INV-AGENT-011 vivem completas em `templates/REGRAS-INEGOCIAVEIS.template.md`.
2. **Este `AGENTS.md`** — contrato cross-harness.
3. `CLAUDE.md` — adendo específico do Claude Code (carregamento automático, ferramentas exclusivas).
4. `.cursorrules`, `.windsurfrules`, `.kiro/steering/00-agents.md` — quando existirem na raiz (atualmente só há os templates em `templates/`).

Em conflito: doc mais alto vence.

## 5. Convenções deste meta-template

- **Idioma**: pt-BR em prosa, código/identificadores em inglês quando aplicável.
- **Frontmatter obrigatório** em todo `.md` da raiz e de `templates/`. Campos mínimos: `owner`, `revisado-em` (ISO; ou `ultima-conferencia` em docs vivos de operação), `status` (`draft|stable|deprecated|superseded`), `idioma`, `limite-linhas`, `proposito`.
- **Templates** terminam em `.template.md` / `.template.json` / `.template.sh` / `.template.yaml` / `.template` (este último para arquivos sem extensão fixa: `.gitignore`, `.cursorrules`, `.windsurfrules`).
- **Caminhos com espaço**: sempre entre aspas duplas (Windows + Git Bash). Use `/`, nunca `\`.
- Não duplicar regra em mais de um arquivo desta raiz — referencie sempre.

## 6. Comandos canônicos (meta-template)

| Operação | Comando |
|---|---|
| Validar consistência dos templates | (não há ainda — dívida) |
| Iniciar projeto novo no destino | `bash bootstrap.sh "<destino>" "<nome>" [hipótese-de-tipo]` |
| Listar templates por camada | abrir `templates/README.md` |

## 7. Multi-harness — paridade real vs aspiracional

- **Claude Code**: cobertura completa (CLAUDE.md, hooks, subagentes, settings.json, Skills).
- **Cursor / Windsurf / Kiro**: leem `AGENTS.md` + `.cursorrules`/`.windsurfrules`/`.kiro/steering/`. **Hooks não rodam** — caem no pre-commit do git.
- **Codex CLI**: lê `AGENTS.md` nativamente. Sem hook próprio. Cai no pre-commit.

Detalhes: `matriz-multi-harness.md`. Piso de segurança comum (pre-commit + CI) está em `templates/pre-commit-config.template.yaml`.

## 8. O que NÃO repetir aqui

- Como executar o ritual passo a passo → `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`.
- Catálogo de templates → `templates/README.md`.
- Glossário → `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md` §1.5 + `GLOSSARIO-ROLDAO.md`.
- Matriz de hooks Claude Code → `matriz-harness.md`.
- Matriz multi-harness → `matriz-multi-harness.md`.
- INV-AGENT-NNN completos → `templates/REGRAS-INEGOCIAVEIS.template.md`.

<!-- Adicionar referência, não cópia. -->
