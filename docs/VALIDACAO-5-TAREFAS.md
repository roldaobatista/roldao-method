---
owner: roldao-method
revisado-em: 2026-05-24
status: stable
publico-alvo: dono-de-produto-nao-programador
---

# Métrica final do v2.0.0: 5 tarefas-tipo do Roldão sem ajuda humana

> **Por que essa métrica existe:** auditor 8 da auditoria 2026-05-24 argumentou que medir só "10/10 dos auditores técnicos" pode esconder valor zero pro usuário real. A meta de "pronto" do v2.0.0 não é mais nota dos auditores — é o Roldão (dono de produto que não programa) conseguir fazer 5 tarefas-tipo sozinho. Decisão 3 do Roldão em 2026-05-24.

---

## As 5 tarefas

Cada tarefa tem critério binário: **conseguiu sem perguntar a programador? Sim / Não.**

### Tarefa 1 — Instalar o framework

**O quê:** Sozinho, num computador novo, instalar o framework num projeto vazio.

**Passos esperados:**
1. Abrir terminal.
2. Rodar `npx roldao-method demo` (entender que funciona).
3. Rodar `npx roldao-method install`.
4. Rodar `npx roldao-method tutorial`.

**Critério:**
- ✅ Roldão terminou os 4 passos sozinho.
- ✅ Nenhuma mensagem o forçou a procurar tradução técnica.
- ✅ Não precisou perguntar "o que é Node/npm/npx".

**Diagnóstico se falhou:**
- Mensagem do `install` usou jargão? → ajustar `bin/install.js`.
- README inicial não disse pra começar pelo `demo`? → ajustar README.

---

### Tarefa 2 — Rodar `/inicio` em projeto novo

**O quê:** No assistente (Claude Code), rodar `/inicio` num projeto novo recém-criado e ver acontecer.

**Passos esperados:**
1. Abrir Claude Code na pasta do projeto.
2. Digitar `/inicio` (com 5 perguntas já respondidas via tutorial).
3. Acompanhar agentes (Sofia → Rafael → Bruno) criando esqueleto.
4. Ver no fim: "PROJETO INICIADO".

**Critério:**
- ✅ Roldão entendeu cada etapa pelo que apareceu na tela (sem ler doc paralela).
- ✅ Nenhuma etapa pediu "como você quer fazer X" sem dar opções.
- ✅ O esqueleto final faz sentido sem ele precisar abrir o código.

**Diagnóstico se falhou:**
- `/inicio` Etapa 4 jogou "preencher AGENTS.md" sem auto-fill? → conferir T-105 / C6.
- Sofia pediu pergunta vaga em vez de AskUserQuestion? → conferir agentes T-102.

---

### Tarefa 3 — Abrir bug e ter ele resolvido

**O quê:** Reportar um comportamento errado e o agente investigar + corrigir.

**Passos esperados:**
1. Digitar `/bug <descrição em PT-BR coloquial>`.
2. Ver Detetive investigar (citando arquivos lidos).
3. Ver Bruno aplicar correção no ponto raiz.
4. Ver Inês revisar.
5. Confirmar com `/checkpoint` que o bug foi mesmo resolvido.

**Critério:**
- ✅ Roldão NÃO precisou explicar onde investigar (REGRA #0 codificada).
- ✅ A correção foi no ponto raiz, não no sintoma.
- ✅ A mensagem final disse o que foi feito SEM stack trace.

**Diagnóstico se falhou:**
- Detetive pulou investigação? → hook `require-investigador-before-fix.js` quebrado.
- Mensagem final tem jargão? → ajustar prompt do Bruno ou agente tech-writer.

---

### Tarefa 4 — Ler release notes e entender

**O quê:** Abrir o `CHANGELOG.md` da próxima release (v2.0.0) e entender o que mudou sem precisar de tradução.

**Passos esperados:**
1. Abrir `CHANGELOG.md`.
2. Ler a seção "## [2.0.0]".
3. Ver "### O que muda pra você (não-programador)" como PRIMEIRA seção.

**Critério:**
- ✅ Roldão entendeu o que mudou pro cliente final.
- ✅ Nenhum bullet exige tradução (sem `exit 2`, `decision:block`, `audit_sha`, `PreCompact`).
- ✅ Pode mandar pro cliente dele direto, sem reescrever.

**Diagnóstico se falhou:**
- Tech-writer (Camila) não seguiu template T-021 / J19? → conferir `templates/.claude/rules/tech-writer-output-templates.md`.

---

### Tarefa 5 — Entender mensagem de erro

**O quê:** Quando algo falha (hook bloqueia, agente erra), entender o que aconteceu e o próximo passo sem perguntar.

**Passos esperados:**
1. Provocar uma falha (ex: tentar editar uma story sem `audit_sha`).
2. Ler a mensagem do hook.
3. Identificar: o que aconteceu, por quê, próximo passo.

**Critério:**
- ✅ Mensagem tem `[BLOQUEIO]` / `[AVISO]` / `[INFO]` prefixo.
- ✅ Mensagem tem **Efeito**, **Causa**, **Próximo passo**.
- ✅ Sem jargão não traduzido (sem `PATH`, `frontmatter`, `amend`, `stack trace`).
- ✅ Se mostra bypass shell (`touch`/`mkdir`), está marcado `[INSTRUÇÃO PRO AGENTE CLAUDE]`.

**Diagnóstico se falhou:**
- Algum hook não foi reescrito? → conferir T-006 a T-008 (G7/G1/G2) + T-307 (G6).

---

## Como validar (procedimento)

1. **Sessão de validação real.** Roldão pega máquina limpa, abre terminal, sem dev por perto.
2. **Tempo total:** 30 minutos. Se ultrapassar, alguma tarefa travou.
3. **Marcar binariamente.** Cada tarefa: ✅ sozinho / ❌ travou.
4. **Documentar onde travou.** Se ❌, escreva exatamente a mensagem/passo que confundiu.
5. **Meta:** **5/5 sozinho.** Sem isso, v2.0.0 não sai.

## Histórico de validações

| Data | Validador | 5 tarefas | Travas relatadas |
|---|---|---|---|
| TBD (antes do v2.0.0) | Roldão | TBD | TBD |

---

## Por que não usamos "10/10 dos auditores"

A métrica anterior do PLANO-10-DE-10 era nota dos 10 auditores re-rodados.

Problema (auditor 8):
- Auditor é técnico (lê regex, conta cobertura, audita aderência ao framework).
- Pode dar 10/10 num produto que ainda confunde o Roldão.
- Mede o framework internamente, não o impacto no usuário real.

Solução: substituir métrica técnica por métrica de usuário real (decisão 3 do Roldão em 2026-05-24).

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
