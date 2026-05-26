---
owner: tech-lead
revisado-em: 2026-05-26
status: aceito
decidido-em: 2026-05-26
decidido-por: Roldao Batista
prd: PRD-004
epico: EP-003
story: US-118
supersedes: []
superseded-by: null
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Auditoria de fluxo interno (10 agentes) — `docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §2 (F1)"
  sintoma-observado: "Carregamento tudo-ou-nada via MEMORY.md. Agente carrega 9KB de detalhe de sprint (project-auditoria-10-10-decisoes.md) pra responder 'qual a stack?'. Orcamento de contexto degrada rapido com memoria crescendo."
---

# ADR-026 — Memory router com tag-based RAG local

> Decisao **aceita** em 2026-05-26 pelo Roldao.

---

## Contexto

A memoria do Roldao em `C:/Users/rolda/.claude/projects/C--projetos-roldao-method/memory/` tem hoje 8 arquivos `.md` (cresceu de 3 pra 8 em ~2 meses). `MEMORY.md` (o index) lista todos em 8 bullets. **Toda sessao carrega TUDO** — incluindo `project-auditoria-10-10-decisoes.md` (9KB de detalhe de sprint) pra responder "qual a stack?".

Auditoria de 2026-05-26 (§2 F1):

> "Agente carrega 9KB de detalhe de sprint pra responder 'qual a stack?'. Orcamento de contexto degrada rapido. INV-005 (≤150 linhas em CLAUDE.md) e violado de fato apesar de ninguem medir."

Conforme Roldao usa o framework mais, memoria cresce. Sem mecanismo de recuperacao seletiva, em 6 meses serao 30-50 arquivos carregados em todo prompt.

## Decisao

**`memory-router.js` (hook UserPromptSubmit) extrai keywords da pergunta do usuario, le frontmatter `tags:` de cada `.md` em `memory/`, injeta no contexto so os 3-5 mais relevantes via `<system-reminder>`. Node puro, zero deps. Fallback: se nenhuma memoria der match, carrega o `MEMORY.md` index inteiro (compat backward).**

### Algoritmo (Node puro, zero deps)

Pseudocodigo do `memory-router.js`:

```
1. Ler prompt do usuario do stdin (UserPromptSubmit recebe JSON com prompt_text)
2. Tokenizar: split em palavras, lowercase, remover stopwords PT-BR (com, para, de, etc.)
3. Filtrar palavras de tamanho >= 3
4. Carregar lista de memorias: ler frontmatter de cada .md em memory/
5. Pra cada memoria: contar match entre keywords da pergunta E array `tags:` no frontmatter
6. Ordenar por score (matches descendente)
7. Top 5 com score > 0: injetar via system-reminder
8. Se top 5 vazio: fallback — injetar MEMORY.md inteiro
```

### Frontmatter `tags:` obrigatorio em memoria nova

```yaml
---
name: project-stack
description: Stack do framework — Node puro zero-deps
metadata:
  type: project
tags: [stack, node, dependencias, runtime, framework]
---

Conteudo da memoria...
```

### Migracao automatica das 8 memorias existentes

Script `tools/migrar-memorias-pra-v3.js` (idempotente):
1. Le cada `.md` em `memory/`
2. Se frontmatter ja tem `tags:`, pula
3. Se nao: extrai keywords do titulo + primeiros 200 chars + description, propoe `tags:` em comentario
4. Roldao revisa e aceita (manual)

Tags propostas pras 8 memorias atuais:
- `project-overview.md` → `[framework, identidade, mercado-br, lgpd, fiscal, pix]`
- `project-stack.md` → `[stack, node, dependencias, runtime, framework]`
- `project-differential.md` → `[diferencial, posicionamento, vantagem, pt-br, hooks]`
- `project-paridade-speckit.md` → `[paridade, comparativo, releases]`
- `project-auditoria-10-10-decisoes.md` → `[v2, auditoria, decisao, sprint, dogfood]`
- `project-v3-framework-aprendiz.md` → `[v3, prd, epico, framework, aprendiz]`
- `feedback-npm-publish.md` → `[npm, publish, release, credenciais]`
- `feedback-posicionamento-autonomo.md` → `[posicionamento, marketing, narrativa]`

### Comando de escape `/memoria-all`

Se Roldao quiser garantir que TODA memoria seja carregada (caso de retrospectiva profunda, brainstorm de longo prazo), comando novo `/memoria-all` desliga o router por 1 turno e injeta o MEMORY.md completo.

### Compativel com agente cetico (ADR-023)

Otavio (meta-cetico) usa `tags:` pra agrupar memorias por dominio. Se 3+ memorias tem tag `[v3]` e ja sao redundantes, propoe consolidacao via `/memoria-consolidar`.

### Modo aprende vs bloqueio

| Versao | Comportamento |
|---|---|
| v3.0.0 | Memoria sem `tags:` continua funcionando (fallback: incluida sempre) |
| v3.1.0 | Soft warning ao criar memoria nova sem `tags:` |
| v3.2.0 | Bloqueio: memoria nova exige `tags:` no frontmatter |

## Alternativas consideradas

### Alternativa 1 — Embedding local (sentence-transformers) (recusada)

Vetorizar prompt + memorias, busca por cosine similarity. Vantagem: deteccao semantica boa (sinonimos, parafrase). Desvantagens:

- Quebra Node puro zero-deps (memoria `project-stack.md`)
- Modelo embedding ocupa 100-500MB
- Cold start de ~2-5s no primeiro UserPromptSubmit
- Lionclaw usa sqlite-vec — provou que vale, mas em produto Electron embarcavel; framework CLI nao tem esse luxo

**Recusada.** Tag-based simples atende 90% dos casos com zero custo.

### Alternativa 2 — Cliente Anthropic chama outro modelo pra ranking (recusada)

Toda UserPromptSubmit chama um modelo pequeno pra ranquear memorias. Desvantagens: custo extra de token; latencia; dependencia de rede.

**Recusada.** Local-first.

### Alternativa 3 — Hash de bag-of-words com TF-IDF (recusada parcial)

Score TF-IDF em vez de match simples. Vantagem: dimensiona melhor com memoria grande. Desvantagens: implementacao mais complexa pra ganho marginal em <50 memorias.

**Recusada por enquanto.** Reabrir se memoria passar de 50 arquivos.

### Alternativa 4 — Sem mudanca, carregar tudo sempre (recusada)

Vantagem: zero risco. Desvantagens: dor diagnostica continua; orcamento de contexto piora exponencialmente.

**Recusada.** US-118 nao avanca sem isso.

## Consequencias

### Positivas

- ~70% de reducao no orcamento de memoria por turno (estimativa baseada em 8 memorias atuais, top-5 carregado)
- Memoria pode crescer ate 50-100 arquivos sem degradar performance
- Otavio ganha dimensao "tag" pra propor consolidacao
- Roldao mantem capacidade de carregar tudo via `/memoria-all` (preservacao — ADR-031)
- Memoria sem `tags:` continua funcionando (compat backward)
- Fallback explicito (top-5 vazio → tudo) evita falha catastrofica

### Negativas

- Adiciona ~10-30ms ao UserPromptSubmit (negligenciavel)
- Roldao precisa pensar em tags ao criar memoria nova (ate v3.2.0)
- Memorias mal-tageadas viram invisiveis pra prompts relevantes (mitigado por Otavio + `/memoria-all`)

### Compativel com

- **ADR-001** (Node puro zero-deps) — tokenize + match em JS puro
- **ADR-023** (Framework aprendiz) — Otavio consome `tags:` pra propor consolidacao
- **ADR-031** (Preservacao de capacidade) — `/memoria-all` mantem capacidade antiga
- **INV-001** — memoria continua sendo doc versionado
- **INV-005** — reduz orcamento de contexto real

## Gatilhos de reabertura

- Top-5 retorna match score < 1 em > 30% dos prompts → tags estao ruins, revisar
- Memoria atinge 100+ arquivos → considerar TF-IDF (Alternativa 3)
- Roldao usa `/memoria-all` em > 50% dos prompts → router nao esta servindo, repensar

## Como verificar

- Prompt "qual a stack?" → log do `memory-router.js` mostra `project-stack.md` carregado, `project-auditoria-10-10-decisoes.md` ignorado
- Prompt "como esta a auditoria do framework?" → carrega `project-auditoria-*` + `project-v3-*`
- Memoria sem `tags:` no frontmatter → router faz fallback e carrega tudo
- `/memoria-all` em 1 turno → MEMORY.md inteiro injetado

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial — aguardando aceite do Roldao |
