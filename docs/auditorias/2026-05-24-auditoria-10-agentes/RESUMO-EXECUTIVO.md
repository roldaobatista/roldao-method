---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
---

# Auditoria 10 agentes — Resumo Executivo

> 10 auditores independentes (não usaram o framework — auditaram ele como produto), cada um com uma lente: UX terminal, onboarding leigo, autonomia, workflows longos, auto-preenchimento, mensagens de erro, coerência PT-BR, descoberta/navegação, verificação/confiança, docs pra leigo.

## Nota agregada: **6.95 / 10**

| # | Lente | Nota | Veredito 1 linha |
|---|---|---|---|
| 1 | UX Terminal | 7.5 | Bom, falta TL;DR nos agentes + `NO_COLOR`/fallback emoji |
| 2 | Onboarding Leigo | 7.5 | Demo+tutorial ótimos, vitrine (README) ainda fala "pra dev" |
| 3 | Autonomia Agentes | 8.0 | Doutrina forte e prática boa; 3 agentes ainda jogam decisão pro user |
| 4 | Workflows Longos | 6.0 | `/feature` é mecânico; `/prd`, `/brownfield`, `/auditoria-reversa` sem orquestrador |
| 5 | Auto-Preenchimento | 5.0 | Framework sabe muito mas não conecta — placeholders sem ajuda |
| 6 | Mensagens de Erro | 7.5 | Padrão bom, jargão escapa (frontmatter, PATH, touch) + markers órfãos |
| 7 | Coerência PT-BR | 6.5 | Boca fora prega, dentro pratica jargão (devops-infra, dba-dados) |
| 8 | Descoberta/Navegação | 8.0 | `/help` exemplar; skills e addons invisíveis |
| 9 | Verificação/Confiança | 7.0 | `audit_sha` robusto; bypass por `touch` documentado em stderr |
| 10 | Docs pra Leigo | 7.5 | PARA-DONO ótimo, CHANGELOG técnico, PLAN-MODE-E-SESSOES enganoso |

---

## Top 10 ações P0 (corrigir antes da próxima release)

### Bloqueios de leigo
1. **Reescrever frase de abertura do README** (auditor 2) — "Manual de operação pro assistente de IA" → "Você descreve em português... O assistente segue roteiro seguro... Você não precisa programar"
2. **Mover jargão técnico do README** (auditor 2) — `exit 2`, `decision:block`, `PreToolUse` saem da vitrine pra `ARQUITETURA.md`
3. **Linkar PARA-DONO-DE-PRODUTO no `docs/README.md`** (auditor 10) — doc órfã hoje, é a melhor entrada pro leigo

### Falsificáveis e segurança
4. **Fechar bypass dos 3 markers de auditor** (auditor 9) — exigir JSON parseável + `audit_sha` no marker; rejeitar marker vazio (`touch` deixa de funcionar como bypass)
5. **Adicionar `xdescribe(` ao `anti-mascaramento.js`** (auditor 9) — buraco confirmado: regex tem `xit`, `fit`, `fdescribe`, falta `xdescribe`
6. **GATE 2 do investigador validar shape** (auditor 9) — `lido[]` precisa ter ≥1 path real existente, `achado` ≥ 20 chars

### Autonomia
7. **Reformular saída do `analista`** (auditor 3) — trocar "1-3 perguntas pro PM responder" por "1-3 premissas que o PM confirma com investigador/código; só escala pro usuário se afetar comportamento observável"
8. **Reescrever `dba-dados.md` e `devops-infra.md`** (auditor 3 + 7) — "Pergunta padrão de X" → "Infere de X; default Y; marca premissa". Também resolver 32+ jargões em `devops-infra.md`

### Workflows longos
9. **Criar Modo PRD / Modo BROWNFIELD / Modo AR no Maestro** (auditor 4) — `/prd`, `/brownfield`, `/auditoria-reversa` hoje rodam sem orquestrador; markers por etapa + retry 1x + salvamento incremental

### Mensagens
10. **SessionEnd cleanup de markers órfãos** (auditor 6) — `*-trigger-<sess>` e `*-active-<sess>` da sessão atual; e fixar regex de `bug-active-*` pra casar só sessão atual (hoje marker antigo bloqueia sessão nova)

---

## P1 (próximo ciclo — 2-4 semanas)

### Auto-preenchimento (auditor 5)
- Helper único `.claude/lib/next-id.js` pra US/T/ADR/EP (5 workflows reimplementam)
- Auto-data ISO no frontmatter ao escrever (em vez de placeholder `AAAA-MM-DD`)
- `/inicio` Etapa 4 chamar varredura do `/brownfield` (não pedir Roldão preencher)
- Hook `SessionStart` detecta `nfe|pix|lgpd` e sugere addon
- Templates ganham exemplo in-line (não só `_(preencher)_`)

### PT-BR (auditor 7)
- Sincronizar regex `block-jargon-pt-br.js` com tabela `traduzir-jargao/SKILL.md` (faltam `mock`, `fixture`, `migration`, `backend`, `frontend`, `cache`, `webhook`, `token`, `API`, `payload`, `stack trace`)
- Normalizar acentuação dos frontmatters dos 17 agentes (15/17 sem acento)
- Reescrever `devops-infra.md` (32+ jargões) e `dba-dados.md`

### Verificação (auditor 9)
- Revisor obrigado a colar 1 linha do investigation JSON + 1 linha do diff
- Auditor-qualidade obrigado a colar saída de `--coverage`
- `aprovacoes:` do story ganha `audit_sha` por etapa

### UX/Workflows
- Statusline mostra etapa N/7 do pipeline ativo (auditor 1+4)
- Agentes ganham bloco `## Em 3 linhas` no topo (auditor 1)
- Statusline respeita `NO_COLOR`/`TERM=dumb` (auditor 1)
- `/help skills` e `/help addons` (auditor 8)
- Rotular tabela do `/help` com tamanhos: `/historia (1 story)`, `/prd (semanas)` (auditor 8)
- Reescrever CHANGELOG com bullet de impacto pro leigo (auditor 10)
- Marcar `docs/PLAN-MODE-E-SESSOES.md` como conteúdo de dev (auditor 10)

---

## P2 (oportunidade — quando der)

- Alias `/adotar` pra `/brownfield` (auditor 8)
- Rename `/qa` pra `/testes-area` (auditor 8)
- Glossário ganha entrada explicando IDs (`LGPD-001`, `US-042`, `EP-003`) (auditor 8)
- Padronizar prefixo dos hooks: `[BLOQUEIO]`/`[AVISO]`/`[INFO]` (auditor 6)
- `npx roldao-method` (sem argumento) mostra menu (auditor 2)
- GIF/vídeo de `demo` no topo do README (auditor 2)
- `docs/PRIMEIRO-DIA.md`, `docs/COMO-PEDIR-AJUDA.md`, `docs/SEU-DEV-PRECISA-LER-ISSO.md` (auditor 10)
- Anti-mascaramento cobrir `if (false)` e teste comentado (auditor 9)

---

## Padrões positivos encontrados (manter e replicar)

1. **Mensagem de hook em 4 partes** (`block-destructive.js`, `secrets-scanner.js`) — `BLOQUEADO + Comando + Por que + Como destravar`
2. **`audit_sha` em pass markers** — anti-rubber-stamp real
3. **GATE 2 do investigador exige JSON em disco** — REGRA #0 não vira teatro
4. **`/help` com árvore de decisão ASCII** — modelo de descoberta
5. **`docs/PARA-DONO-DE-PRODUTO.md`** — modelo de doc respeitosa ao leigo
6. **`npx roldao-method demo`** — barreira zero, sem instalar nada
7. **`investigador.md:45`** ("NÃO pare o pipeline pra perguntar — registre `pendencias[]`") — modelo de autonomia
8. **`fiscal-br-validator.js`** — mensagem por regra, traduz cada FISCAL-NNN
9. **`enforce-pipeline-completion.js`** — Stop hook impede abandono de `/feature` no meio

---

## Avaliação geral

O framework está **acima da média** pro propósito declarado, mas há um padrão recorrente: **a doutrina é mais forte que a prática nas próprias entranhas**. Exemplos:

- Prega "sem jargão com leigo" mas `devops-infra.md` tem 32 termos técnicos em inglês.
- Prega "investigar antes de mexer" mas o bypass do GATE 2 é ensinado na mensagem de erro do próprio hook.
- Prega "executar não passar pro usuário" mas `analista.md` tem como saída obrigatória "perguntas pendentes pro PM".
- Prega "INV-AGENT-004 (verificar antes de afirmar)" mas auditores podem ser bypassed com 3 `touch` documentados.

**A próxima fase do produto não é mais features — é fechar essas brechas entre o que o framework diz e o que ele exige mecanicamente.** Os 10 P0 acima fazem isso. Aplicados, a nota agregada vai pra ~8.5.

A boa notícia: nenhuma dessas correções exige reescrita arquitetural. São ajustes pontuais em ~15 arquivos.
