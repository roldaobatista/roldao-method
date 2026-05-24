---
description: Resumo PT-BR claro do que mudou no projeto desde a última sessão (commits, stories tocadas, decisões registradas). Pra dono de produto que volta no projeto depois de dias/semanas e quer entender o estado atual sem ler git log.
argument-hint: "[periodo opcional: 1d | 1w | 1m]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(git rev-parse:*), Task
model: haiku
---

# /o-que-aconteceu — resumo PT-BR pro dono de produto

Use ANTES de pedir nova feature, quando você volta no projeto depois de uns dias/semanas. Substitui ler `git log` na mão.

`$ARGUMENTS` = período (default = última semana; aceita `1d`, `1w`, `1m`).

## Etapa 1 — Coletar mudanças

Invoque `tech-writer` (Camila) em modo STATUS:

- `git log --since="<periodo>" --pretty=format:"%h %ai %s"` — pega commits do período.
- Conta arquivos tocados por área (docs/ vs src/ vs test/).
- Lê stories tocadas (`docs/stories/US-NNN-*.md` que foram modificados).
- Lê ADRs novos (`docs/decisions/ADR-NNN-*.md` adicionados).
- Lê CHANGELOG.md (entradas adicionadas).

## Etapa 2 — Traduzir pro Roldão

Saída obrigatória em PT-BR claro, **sem jargão técnico**, **5 seções**:

```markdown
# O que aconteceu desde <data>

## 1. O que mudou pro cliente final
- <bullet em linguagem do dono — não cite arquivo nem código>
- <ex: "Boleto pra cliente PJ agora calcula desconto progressivo automaticamente">

## 2. O que ficou mais seguro
- <correção de segurança/bug crítico em linguagem leiga>
- <ex: "Sistema agora barra senha em log antes de aparecer">

## 3. O que está em andamento (não terminou ainda)
- <stories abertas + estimativa de quando termina>

## 4. Decisões importantes registradas
- <ADRs em PT-BR — explica o "por quê", não o "como">

## 5. Próximo passo recomendado
- <1 ação: "rodar /feature US-118 — boleto Pix"; ou "fechar release v1.2.0 com /release"; ou "nada urgente">
```

## Etapa 3 — Validações

- **Linguagem leiga.** Se citou "commit/branch/merge/deploy/refactor", trocou por equivalente PT-BR (tabela em `docs/GLOSSARIO.md`).
- **Sem `git diff` cru.** Resumo, não código.
- **Limite de 1 página.** Se ultrapassar, agrupar (ex: "8 correções de UX detalhadas em `CHANGELOG.md`").

## Importante

- Este comando NÃO modifica nada — só lê e resume.
- Se o período não tiver commit nenhum, reportar: "Nenhuma mudança desde <data>. Pode pedir nova feature."
- Se você quer detalhe técnico (qual arquivo, qual função), use `git log` direto. Este comando é o oposto: alto nível, leigo.
