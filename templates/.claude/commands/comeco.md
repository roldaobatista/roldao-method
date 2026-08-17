---
description: Entrevista guiada (5 perguntas, 1 de cada vez) que preenche AGENTS.md §1 §2 §6 — resolve a "armadilha do _(preencher)_". Pra projeto novo OU AGENTS.md ainda em branco apos install.
argument-hint: "[--continuar | --completar]"
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(node:*), Bash(npx:*), Bash(git add:*), Bash(git commit:*), Task
---

# /comeco — entrevista guiada de 5 perguntas

Comando pro PRIMEIRO momento depois de instalar o framework. O usuário chega num projeto novo (ou brownfield), `AGENTS.md` tem `_(preencher)_` em 5 lugares — `/comeco` resolve isso de forma humana, 1 pergunta de cada vez, sem despejar formulario gigante.

## Quando usar

1. **Primeira vez no projeto:** ao detectar `AGENTS.md` ainda com campos `_(preencher)_` numa sessao nova
2. **Manual:** quando o usuario quer preencher contratos vazios
3. **`/comeco --continuar`:** retomar entrevista interrompida
4. **`/comeco --completar`:** preencher campos restantes de `AGENTS.md` que ainda estao em `_(preencher)_`

## Estado em disco

Marker `.claude/.runtime/onboarding.json`:
```json
{
  "step": 3,
  "started_at": "...",
  "respostas": {
    "nome": "...",
    "frase": "...",
    "quem-usa": "..."
  }
}
```

## Etapa 1 — Detectar contexto

- Existe `.claude/.runtime/onboarding.json`? Carregar e perguntar "continuar de onde parou?" (S/N).
- AGENTS.md ja preenchido? Mostrar diff entre atual e proposto, perguntar se quer atualizar (ressalva: edit, nao replace).
- `package.json` existe? Detectar stack automaticamente — propor preenchido pra usuario confirmar.

## Etapa 2 — 5 perguntas (1 de cada vez)

### Pergunta 1 — Nome do projeto

```
Pergunta 1 de 5 — Nome do projeto

Como voce chama esse projeto? (1-3 palavras)

> _
```

Resposta vira `AGENTS.md §1 Nome`.

### Pergunta 2 — Frase do que faz

```
Pergunta 2 de 5 — O que esse projeto faz?

Em UMA frase (sem jargao tecnico). Imagine que voce esta explicando pra um amigo nao-programador.

Exemplos:
- "Sistema de emissao de NF-e pra prestadores autonomos."
- "App pra controlar fluxo de caixa de barbearia."
- "Framework agentic em PT-BR pra dev BR usar com IA."

> _
```

Resposta vira `AGENTS.md §1 Escopo`.

### Pergunta 3 — Quem usa

```
Pergunta 3 de 5 — Quem usa esse projeto?

Pode ser:
- 1 pessoa (voce mesmo, dono de produto)
- N pessoas (equipe interna de uma empresa)
- Publico (clientes finais, qualquer pessoa)

Exemplos:
- "Eu mesmo, pra organizar minhas despesas"
- "Equipe de 5 atendentes de loja"
- "PMEs do segmento de servicos"

> _
```

Resposta vira `AGENTS.md §1 Cliente/usuario`.

### Pergunta 4 — Tipo de produto

```
Pergunta 4 de 5 — Tipo de produto

Escolhe 1:
  [1] SaaS web (acessivel por navegador)
  [2] App movel (iOS e/ou Android)
  [3] App desktop (Electron, Mac/Win/Linux)
  [4] Biblioteca/CLI (devs usam via npm/pip/cargo)
  [5] Outro (descrever)

> _
```

Resposta vira `AGENTS.md §1 Modelo`.

Se `3` (Electron): perguntar "Instalo o addon `electron-br` agora? (recomendado) (S/N)" — apos resposta, rodar `npx roldao-method add electron-br` se S.

Se `4` (Biblioteca/CLI): sugerir templates apropriados.

### Pergunta 5 — Stack tecnica (com proposta auto-detectada)

Detectar automaticamente:
- `package.json` → Node + framework (React/Vue/Next/Electron)
- `requirements.txt` ou `pyproject.toml` → Python + framework
- `go.mod` → Go
- `Cargo.toml` → Rust
- `pubspec.yaml` → Flutter
- Banco: procurar `prisma/`, `migrations/`, `schema.sql`, deps `pg|mysql|sqlite|drizzle`

```
Pergunta 5 de 5 — Stack tecnica

Detectei (pode estar errado, confirme):

Backend:      Node.js 20 + TypeScript
Frontend:     React 19 + Vite
Banco:        better-sqlite3 (local) + sqlite-vec
Empacotamento: Electron + electron-vite

Confirma? (S/N)
Se N: descrever a stack real.

> _
```

Resposta preenche `AGENTS.md §2 Stack` tabela completa.

## Etapa 3 — Diff visual + confirmacao final

Apos coletar todas as respostas:

```
PRONTO PRA APLICAR

Diff a aplicar em AGENTS.md:

§1. Identidade do projeto
- **Nome:** _(preencher)_                  → NOME-DO-PROJETO
- **Escopo:** _(preencher)_                → Frase curta do que o projeto faz.
- **Modelo:** _(preencher)_                → Biblioteca/CLI (npm)
- **Cliente/usuario:** _(preencher)_       → Dono de produto que nao programa

§2. Stack
[tabela preenchida]

§6. Comandos do projeto
Setup local: _(preencher)_                  → npm install + npx roldao-method install
Rodar testes: _(preencher)_                → npm test

Aplicar essas mudancas? (S/N)
```

Apos S:
- Edit em AGENTS.md (preserva resto do arquivo — INV-007)
- 1 commit atomico: `chore(onboarding): preencher AGENTS.md §1 §2 §6 via /comeco`
- Marker `.claude/.runtime/onboarding.json` atualizado com `completed_at`
- Mensagem final:

```
AGENTS.md preenchido. Voce pode comecar agora:
- /historia US-NNN  — criar primeira story
- /feature US-NNN   — implementar story existente
- /help             — ver a lista completa de workflows disponiveis
- /painel           — ver tela de instrumentos
```

## Limites

- **1 pergunta por vez.** Nao despejar formulario inteiro.
- **Detectar antes de perguntar.** Stack tecnica detectada via `package.json` etc — usuario so confirma.
- **Salvar progresso.** `.claude/.runtime/onboarding.json` permite interromper a qualquer momento.
- **NUNCA sobrescrever AGENTS.md sem confirmacao.** INV-007.
- **`--continuar`** retoma do ultimo step salvo.
- **`--completar`** so toca campos que ainda estao em `_(preencher)_` — preserva o resto.
