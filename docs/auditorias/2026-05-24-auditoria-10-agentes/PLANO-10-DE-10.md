---
owner: roldao-method
revisado-em: 2026-05-24
status: stable
---

# Plano: elevar todas as 10 notas pra 10/10

> Base: `RESUMO-EXECUTIVO.md` + 10 relatórios individuais nesta pasta.
> Escopo: ~70 ações distribuídas em 9 eixos e 5 sprints sequenciais.
> Premissa: o trabalho é executado pelo agente Claude; Roldão aprova **por sprint** (não por ação), e só revê quando algo destrutivo for proposto.

---

## Como o plano sobe cada nota

Cada um dos 10 auditores fica em 10/10 quando o eixo correspondente **fecha 100% dos P0+P1+P2 dele**. Mapa eixo → auditor:

| Eixo | Tema | Auditores beneficiados | Sprint |
|---|---|---|---|
| A | Vitrine pro leigo | 2 (Onboarding) + 10 (Docs) | 1 + 5 |
| B | Anti-bypass / verificação real | 9 (Verificação) | 1 |
| C | Autonomia real dos agentes | 3 (Autonomia) | 2 |
| D | Orquestração de workflows longos | 4 (Workflows) | 2 |
| E | Auto-preenchimento e defaults | 5 (Auto-preench.) | 3 |
| F | Coerência PT-BR | 7 (PT-BR) | 3 |
| G | Mensagens de erro | 6 (Mensagens) | 1 + 3 |
| H | UX Terminal | 1 (UX Terminal) | 4 |
| I | Descoberta / Navegação | 8 (Descoberta) | 4 + 5 |

Critério de sprint completo: todos os achados do escopo do sprint têm commit verificado + 2 dos 10 auditores re-rodados confirmam que a nota subiu.

---

## SPRINT 1 — Segurança real + bloqueios de vitrine (1 semana)

> **Objetivo:** fechar as falsificações que tornam o framework "teatro" + tirar o leigo do limbo na primeira tela. Sobe notas **Verificação (7→9), Onboarding (7.5→9), Mensagens (7.5→9), Docs (7.5→9)**.

### Eixo B — Anti-bypass (todos os P0 do auditor 9)

| # | Ação | Arquivo | Critério de aceitação |
|---|---|---|---|
| B1 | Marker de auditor exige JSON parseável + `audit_sha` | `.claude/hooks/require-auditors-pass-before-commit.js` | Hook rejeita marker vazio (`touch foo` deixa de funcionar como bypass). Teste: criar marker `touch ...auditor-seg-pass-x`, commit falha com mensagem explicando shape esperado. |
| B2 | Marker de checkpoint contém SHA do CHK + audit_sha | `require-checkpoint-before-merge.js` + `/checkpoint.md` | `touch ...checkpoint-done-x` para de funcionar. Hook lê SHA, valida que `docs/checkpoints/CHK-*.md` existe e cobre o diff. |
| B3 | GATE 2 valida shape do investigation JSON | `require-investigador-before-fix.js` | `lido[]` precisa ter ≥1 path existente; `achado` ≥ 20 chars; rejeita "bypass: confiei no usuario". |
| B4 | `xdescribe(` no anti-mascaramento | `anti-mascaramento.js` | Cenário `xdescribe('financeiro', () => {...})` é bloqueado. Adicionar teste em `tests/` que confirma. |
| B5 | Mensagens de bypass marcadas "[INSTRUÇÃO PRA CLAUDE, não execute manualmente]" | hooks B1, B2, B3 + `require-readiness-before-feature.js` | Leigo lendo stderr não copia `touch`/`echo` achando que precisa fazer. |

### Eixo A — Vitrine pro leigo (P0 do auditor 2 e 10)

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| A1 | Reescrever frase de abertura do README | `README.md:3` | Sai "Manual de operação pro assistente de IA"; entra "Você descreve em português o que quer no seu sistema..." |
| A2 | Mover jargão técnico do README pra ARQUITETURA.md | `README.md:31,38,74` + criar `docs/ARQUITETURA.md` | "exit 2", "decision:block", "PreToolUse" saem da vitrine. README só fala em "o sistema barra a ação perigosa". |
| A3 | Pós-install linka PARA-DONO-DE-PRODUTO | `bin/install.js:663-670` | Output final inclui linha "Não programa? Comece em: docs/PARA-DONO-DE-PRODUTO.md". |
| A4 | `docs/README.md` indexa PARA-DONO + GLOSSARIO no topo | `docs/README.md` | Seção "🚀 Começando" tem os 2 docs como primeiros bullets. |
| A5 | QUICKSTART troca `npm run test:hooks-node-only` por `npx roldao-method doctor` | `docs/QUICKSTART.md:48-52` | Passo "Valide" passa a usar comando empacotado. Falha se `npm` ausente vira mensagem amigável. |
| A6 | Marcar `docs/PLAN-MODE-E-SESSOES.md` como "público: dev" | frontmatter + abertura do doc | Bloco no topo: "Pra quem não programa: pule pra seção X — o resto é só pro seu dev". |

### Eixo G — Mensagens de erro P0 (auditor 6)

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| G1 | Reescrever `paths-frontmatter-validator.js` sem "frontmatter" | `.claude/hooks/paths-frontmatter-validator.js:28-29` | Mensagem usa "cabeçalho de identificação do documento" + cola o YAML pronto pra leigo copiar. |
| G2 | Reescrever `no-amend-after-push.js` quando git ausente | `.claude/hooks/no-amend-after-push.js:50-55` | Sem "PATH", "amend", "pushado". Diz "não encontrei o Git instalado. Baixar em https://git-scm.com". |
| G3 | SessionEnd cleanup de markers órfãos | criar `.claude/hooks/session-cleanup.js` (SessionEnd) | Remove `*-trigger-<sess>` e `*-active-<sess>` da sessão atual ao encerrar. |
| G4 | Regex `bug-active-*` casa só sessão atual | `require-investigador-before-fix.js:49` | Marker de sessão antiga deixa de contaminar sessão nova. |

**Critério do Sprint 1 concluído:** rodar de novo os auditores 6, 9, 2, 10 — notas mínimas: 9 / 9 / 9 / 9.

---

## SPRINT 2 — Autonomia + orquestração de workflows longos (2 semanas)

> **Objetivo:** parar de jogar decisão pro Roldão + fazer `/prd`, `/brownfield`, `/auditoria-reversa` sobreviverem a sessão longa. Sobe notas **Autonomia (8→10), Workflows (6→9)**.

### Eixo C — Autonomia real (auditor 3)

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| C1 | Reformular saída do `analista` | `.claude/agents/analista.md:103` | Sai "1-3 perguntas pro PM responder"; entra "1-3 premissas que o PM confirma com investigador/código; só escala pro usuário se afetar comportamento observável". |
| C2 | Reescrever modos do `dba-dados` (Pergunta → Infere) | `.claude/agents/dba-dados.md:53-61` | Cada modo diz "Infere de X (lendo schema/...); se faltar, assume default Y e marca premissa". |
| C3 | Mesma reescrita pra `devops-infra` | `.claude/agents/devops-infra.md:56-65` | Idem C2. |
| C4 | `/bug` etapa 2 vira `AskUserQuestion` automático a partir de `pendencias[]` | `.claude/commands/bug.md:22,38-40` + `maestro.md` | Se `pendencias[].impacto === 'comportamento-visivel'`, dispara AskUserQuestion com opções do JSON. Senão, escolhe default. |
| C5 | `block-confirmation-questions.js` ganha 2 patterns novos | `.claude/hooks/block-confirmation-questions.js` | Cobre `\b(confirma\|aceita\|tudo certo\|tudo bem)\b.*\?` e `\bvou (prosseguir\|seguir\|continuar\|aplicar\|fazer)\b\?`. Testes confirmam. |
| C6 | `/inicio` faz auto-fill via mesma heurística do `/brownfield` | `.claude/commands/inicio.md:38-43` | Etapa 4 invoca a varredura que `brownfield.md:17-31` já faz. Roldão não preenche `_(preencher)_` manualmente. |
| C7 | AskUserQuestion no `/inicio` quando duas stacks são viáveis | `.claude/commands/inicio.md` | Se detecção acha empate, AskUserQuestion com `[Node+TS] [Python+FastAPI] [Java+Spring]`. |

### Eixo D — Orquestração de workflows longos (auditor 4)

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| D1 | Maestro ganha **Modo PRD** | `.claude/agents/maestro.md` + `.claude/commands/prd.md` | Markers por etapa (`analista-done-*`, `pm-prd-done-*`, `tech-lead-done-*`, `ux-done-*`, `decomp-done-*`). Se contexto compactar, retoma da última etapa concluída. |
| D2 | Maestro ganha **Modo BROWNFIELD** | `.claude/agents/maestro.md` + `.claude/commands/brownfield.md` | Markers `inventario-done-*`, `tech-lead-done-*`, `pm-onboarding-done-*`, `audit-seg-done-*`. |
| D3 | Maestro ganha **Modo AR (auditoria-reversa)** | `.claude/agents/maestro.md` + `.claude/commands/auditoria-reversa.md` | Inventário salvo incrementalmente em `.claude/.runtime/audit-inventory.json` por categoria. Se travar, próximo run reaproveita. |
| D4 | Retry automático em falha de Task | `.claude/agents/maestro.md` (seção Recovery) | Política: 1 retry; se falhar, salva marker `agent-failed-{nome}-${SESSION_HASH}` e aborta com mensagem clara. |
| D5 | Statusline mostra `etapa N/7` do pipeline ativo | `.claude/statusline.js` | Lê `feature-active-*` (ou `prd-active-*`, `brownfield-active-*`), conta markers `*-done-*` + `*-pass-*`, exibe `· 🔁 4/7`. |
| D6 | PreCompact preserva conteúdo bruto do brief (não só path) | `.claude/hooks/session-snapshot.js` | Snapshot inclui últimas 50 linhas do brief em prosa, não só caminho. |
| D7 | `subagent-handoff-audit.js` escreve em arquivo lido pela statusline | `.claude/hooks/subagent-handoff-audit.js` | Falha silenciosa de subagente aparece como `· ⚠️ subagent-erro` na statusline. |
| D8 | `enforce-pipeline-completion.js` cobre os 4 modos | hook | Stop também bloqueia abandono de `prd-active-*`, `brownfield-active-*`, `ar-active-*`. |

**Critério do Sprint 2 concluído:** Roldão consegue rodar `/prd PRD-001` ou `/auditoria-reversa` em repo de 100k+ linhas, fechar o terminal no meio, reabrir 2 dias depois e o pipeline continua. Auditor 4 → 9; auditor 3 → 10.

---

## SPRINT 3 — Auto-preenchimento + Coerência PT-BR (2 semanas)

> **Objetivo:** framework preenche 80%+ pro Roldão, e PT-BR é prática real (não só doutrina). Sobe **Auto-preench. (5→9), PT-BR (6.5→9), Mensagens (9→10) finalizada**.

### Eixo E — Auto-preenchimento (auditor 5)

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| E1 | Helper `.claude/lib/next-id.js` | criar arquivo | Função única chamada por `/historia`, `/feature`, `/prd`, `/epico`, `/refactor` pra gerar próximo `US-NNN`, `EP-NNN`, `T-NNN`, `ADR-NNNN`. |
| E2 | Auto-data ISO no frontmatter | hook `auto-format-on-write.js` ou novo `auto-frontmatter.js` | Ao escrever `.md` com placeholder `AAAA-MM-DD` no campo `revisado-em`, substitui pela data ISO. |
| E3 | Templates ganham exemplo in-line | `templates/AGENTS.md`, `.specify/templates/story.md`, `.specify/templates/prd.md`, `templates/CLAUDE.local.md.example` | Cada `_(preencher)_` tem comentário `// ex: Como vendedor, quero ver o estoque...`. |
| E4 | `CLAUDE.local.md.example` auto-preenche `OS`, `git user.email`, branch | `templates/CLAUDE.local.md.example` + `bin/install.js` | No primeiro `init`, valores triviais entram automaticamente; Roldão só edita o que mudar. |
| E5 | Hook `SessionStart` sugere addon baseado em conteúdo do repo | criar `.claude/hooks/suggest-addon-on-keywords.js` | `grep` em arquivos detecta `nfe\|nfse\|sped\|sefaz` → sugere `fiscal-br-completo`; `pix\|endtoendid\|psp` → `fintech-br`; `dado pessoal\|titular\|anpd` → `lgpd-compliance`. |
| E6 | `dev-senior` invoca proativamente skills BR quando detecta CPF/CNPJ em input | seção em `.claude/agents/dev-senior.md` + hook validador | Se payload de teste tem string que casa CPF/CNPJ, agente chama `validar-cpf-cnpj` antes de salvar. |
| E7 | Pipeline reusa ADR existente | `.claude/agents/tech-lead.md` + `maestro.md` | `tech-lead` busca em `docs/decisions/` por ADRs com tema overlap; se achar, pula geração. |
| E8 | `owner` no frontmatter vem do `git config user.name` | hook + agentes | Default mecânico; só edita se Roldão sobrescrever. |
| E9 | PostToolUse `autoRunTestsOnCodeChange` | settings.json + hook | Após Edit em `**/*.test.*`, roda `npm test` (ou comando detectado) sem perguntar. |

### Eixo F — Coerência PT-BR (auditor 7)

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| F1 | Sincronizar `block-jargon-pt-br.js` com tabela `traduzir-jargao/SKILL.md` | `.claude/hooks/block-jargon-pt-br.js` | Regex cobre `mock`, `fixture`, `migration`, `backend`, `frontend`, `cache`, `webhook`, `token`, `API`, `payload`, `stack trace`, `hotfix`, `pipeline`, `gate`. Testes confirmam. |
| F2 | Script `normalizar-acentos-frontmatter.js` | criar `scripts/normalizar-acentos.js` | Corrige `nao→não`, `voce→você`, `tambem→também`, `producao→produção`, etc nos frontmatters de `.claude/agents/*.md`. Rodar 1x e versionar. |
| F3 | Reescrever `devops-infra.md` em PT-BR | `.claude/agents/devops-infra.md` | 32+ jargões traduzidos: `deploy→subida pro servidor`, `rollback→volta pra versão anterior`, `migration→mudança na estrutura dos dados`. |
| F4 | Mesma reescrita em `dba-dados.md` | `.claude/agents/dba-dados.md` | Idem F3. |
| F5 | Traduzir jargão nos commands | `checkpoint.md`, `refactor.md`, `hotfix.md`, `qa.md` | `commit/branch/merge/PR` viram `gravação/ramo/junção/proposta`. |
| F6 | Corrigir título de exemplo em `explicar-para-cliente.md` | `.claude/commands/explicar-para-cliente.md:19` | "Stack trace" → "erro técnico"; "build" → "construção" (com glossário linkado). |

### Eixo G — Mensagens de erro P1 (auditor 6)

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| G5 | Traduzir `mkdir -p`, `touch`, `echo` que aparecem ao usuário | hooks que ainda têm | Marcar como "[INSTRUÇÃO INTERNA]" ou reescrever em PT-BR. |
| G6 | Reescrever `commit-message-validator.js` | `.claude/hooks/commit-message-validator.js:100-105` | Sem "Conventional Commit", "prefixo", "atômico". Exemplos práticos. |
| G7 | Padronizar prefixo `[BLOQUEIO]`/`[AVISO]`/`[INFO]` | todos os hooks | `_lib.js` ganha helper de prefixo. Padroniza saída. |
| G8 | `block-jargon-pt-br.js` linha 75 explica COMO ajustar a regra | hook | Linka pra `docs/CONFIGURACAO.md` ou bloco em `CLAUDE.md`. |

**Critério do Sprint 3 concluído:** auditor 5 → 9; auditor 7 → 9; auditor 6 → 10.

---

## SPRINT 4 — UX Terminal + Descoberta (1 semana)

> **Objetivo:** polir o que o usuário vê em cada interação. Sobe **UX Terminal (7.5→10), Descoberta (8→10)**.

### Eixo H — UX Terminal (auditor 1)

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| H1 | Agentes ganham bloco `## Em 3 linhas` no topo | os 15 agentes em `.claude/agents/*.md` | Após frontmatter: "o que faz / quando é acionado / o que devolve" em 3 linhas. |
| H2 | Statusline respeita `NO_COLOR`/`TERM=dumb` | `.claude/statusline.js:91-96` | Variáveis padrão (https://no-color.org) honradas. Idem `FORCE_COLOR=0`. |
| H3 | Fallback texto quando terminal não suporta emoji | `.claude/statusline.js:159` | Detecta `TERM=dumb` ou flag `--no-emoji`, troca emojis por `[v1.0.3] [Opus] [main] [Detetive]`. |
| H4 | `/feature.md` ganha bloco "Saída final" | `.claude/commands/feature.md` | Igual ao `/bug.md:62-72`. Roldão sabe o que esperar. |
| H5 | Output styles `dpo-lgpd` e `fiscal-br` indicam quando voltar | `.claude/output-styles/dpo-lgpd.md`, `fiscal-br.md` | Bloco "Quando trocar de volta pra `pt-br-conciso`". |
| H6 | Separador visual `──────` em hooks bloqueadores | `_lib.js` helper | Stderr não vira parágrafo só. |
| H7 | Comando `/agentes` mostra `MAPA-VISUAL.md` | criar `.claude/commands/agentes.md` | Atalho pra descoberta. |
| H8 | Flag `--quiet` na statusline | `.claude/statusline.js` | Pra rodar em headless/CI sem decoração. |

### Eixo I — Descoberta / Navegação (auditor 8) P0 + P1

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| I1 | `/help` ganha seção "Validações prontas" | `.claude/commands/help.md` | Lista 13 skills com 1 frase cada. |
| I2 | `/help` ganha seção "Addons disponíveis" | `.claude/commands/help.md` | Lista 7 addons + "pra quem é" cada. |
| I3 | Tabela do `/help` rotula tamanho dos workflows | `.claude/commands/help.md` | "(ideia vaga)" pra /clarificar, "(1 story)" pra /historia, "(coleção de stories)" pra /epico, "(iniciativa de semanas)" pra /prd. |
| I4 | Personas com legenda inline na primeira menção | `.claude/commands/help.md` | "Sofia (PM)", "Detetive (investiga)", "Rafael (arquitetura)". |
| I5 | Sugestão proativa de addon | hook E5 (já no Sprint 3) | Mensagem aparece no início da sessão. |
| I6 | `/hotfix` e `/incident-postmortem` linkam runbook LGPD | `.claude/commands/hotfix.md`, `incident-postmortem.md` | Linha "Em caso de vazamento: docs/runbooks/incident-response-lgpd.md". |
| I7 | Glossário ganha entrada "O que são esses códigos no commit?" | `docs/GLOSSARIO.md` | Explica `LGPD-001`, `SEC-002`, `INV-AGENT-006`, `FISCAL-005`. |
| I8 | Glossário explica IDs de spec | `docs/GLOSSARIO.md` | `US-NNN`, `AC-NNN-N`, `T-NNN`, `EP-NNN`, `PRD-NNN`. |
| I9 | Glossário explica termos do framework | `docs/GLOSSARIO.md` | "pipeline mental", "fail-closed", "lifecycle hook", "soft warning", "/shard". |

**Critério do Sprint 4 concluído:** auditor 1 → 10; auditor 8 → 9.

---

## SPRINT 5 — Docs faltando + polimento P2 (1 semana)

> **Objetivo:** fechar os últimos achados P2 e criar as 3 docs faltando pra o leigo. Sobe **Onboarding (9→10), Docs (9→10), Descoberta (9→10), Verificação (9→10), Workflows (9→10)**.

| # | Ação | Arquivo | Critério |
|---|---|---|---|
| J1 | Criar `docs/PRIMEIRO-DIA.md` | novo | Transcrição literal do primeiro `/inicio`, screenshot do terminal, "o que esperar". |
| J2 | Criar `docs/COMO-PEDIR-AJUDA.md` | novo | "Como reportar bug sem stack trace", "Quanto tempo demora", "Onde abrir issue". |
| J3 | Criar `docs/SEU-DEV-PRECISA-LER-ISSO.md` | novo | Onboarding curto pra quando Roldão contratar dev. Linka os 3 docs canônicos. |
| J4 | Alias `/adotar` pra `/brownfield` | `.claude/commands/adotar.md` (atalho) | Funciona idêntico a `/brownfield`. |
| J5 | Rename `/qa` → `/testes-area` | `.claude/commands/testes-area.md` + alias `/qa` mantido | Compatibilidade preservada com aviso de deprecação. |
| J6 | Anti-mascaramento cobre `if (false)` e teste comentado | `.claude/hooks/anti-mascaramento.js` | Bloqueia `if (false) {`, `if (0) {`, `/* it(`, `// it(`, `// describe(`. |
| J7 | Anti-mascaramento detecta `return` precoce em teste | `anti-mascaramento.js` | Bloqueia `it('x', () => { return; ... })`. |
| J8 | `revisor.md` obriga colar 1 linha do investigation JSON + 1 do diff | `.claude/agents/revisor.md` | Saída obrigatória inclui evidência verificável. |
| J9 | `auditor-qualidade.md` obriga colar saída de `--coverage` | `.claude/agents/auditor-qualidade.md` | Saída obrigatória inclui "rodei: `<comando>` — resultado: `<%>`". |
| J10 | `aprovacoes:` do story ganha `audit_sha` por etapa | `.specify/templates/audit-trail.md` + `validate-story-approvals.js` | Cada aprovação amarra a um commit verificável via `git log`. |
| J11 | `metrics.jsonl` registra `approvalRecorded` | helper de auditores | Auditoria forense não fica mais cega. |
| J12 | GIF/vídeo de 90s mostrando `demo` no topo do README | `README.md` + asset | Linka GitHub release ou imgur. |
| J13 | Atualizar `docs/REGRESSIONS.md` ou marcar `status: deprecated` | doc | Bate com infra atual (sem `_test-runner.sh`). |
| J14 | Deletar ou popular `docs/EXTENDENDO/README.md` shard órfão | doc | Sem arquivo vazio. |
| J15 | README ganha campo `revisado-em` (opcional, util pro leigo) | `README.md` | Linha "última revisão: 2026-MM-DD". |
| J16 | `npx roldao-method` sem argumento mostra menu | `bin/install.js` | Em vez de cair em install default, mostra `[demo] [tutorial] [doctor] [help]`. |
| J17 | `/checkpoint` mostra `git diff --stat` em PT-BR | `.claude/commands/checkpoint.md` | Bloco "Mudanças mensuráveis: N arquivos, +X/-Y linhas, M testes novos" no fim. |
| J18 | `/release` exige colar saída de `npm test` | `.claude/commands/release.md` | Tech-writer não fecha sem evidência. |
| J19 | CHANGELOG ganha bullet de impacto pro leigo em cada release | `CHANGELOG.md` template | Seção "### O que muda pra você (não-programador)" no topo. |
| J20 | Padronizar "Preservado" em release notes antigas | `docs/releases/v0.15.3.md..v0.20.0.md` | Mesma estrutura das v1.0.x. |

**Critério do Sprint 5 concluído:** **todos os 10 auditores re-rodados retornam nota 10.**

---

## Cronograma agregado

| Sprint | Duração | Foco | Notas que sobem |
|---|---|---|---|
| 1 | 1 sem | Anti-bypass + vitrine leigo | 9: 7→9 / 2: 7.5→9 / 6: 7.5→9 / 10: 7.5→9 |
| 2 | 2 sem | Autonomia + orquestração | 3: 8→10 / 4: 6→9 |
| 3 | 2 sem | Auto-preench + PT-BR | 5: 5→9 / 7: 6.5→9 / 6: 9→10 |
| 4 | 1 sem | UX Terminal + Descoberta | 1: 7.5→10 / 8: 8→9 |
| 5 | 1 sem | Docs faltando + P2 | 2/4/5/7/8/9/10 → 10 |
| **Total** | **7 semanas** | **9 eixos / ~70 ações** | **Todas em 10/10** |

---

## Pontos de decisão pendentes (Roldão precisa avisar)

1. **Vai aprovar sprint a sprint ou autorizar os 5 de uma vez?** Recomendo aprovar `Sprint 1` agora e revisar antes do 2. Mostra o ritmo real.
2. **Algum eixo é prioridade absoluta?** Padrão proposto: B (segurança) → A (vitrine). Se Roldão prefere começar por C (autonomia) ou D (workflows), troco a ordem.
3. **Critério de "10/10" estrito ou aceitável?** Hoje propus: re-rodar 2 dos auditores originais e exigir nota 10. Alternativa: rodar TODOS os 10 de novo (mais lento, mas definitivo).
4. **Algumas ações tocam **`.specify/templates/`** que NÃO é alterado por `update`.** Decidir se cria override em `.specify/overrides/` ou se vira mudança no core (que `update` reinstala).

---

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Sprint 2 (orquestração no Maestro) é o mais complexo — pode estourar 2 semanas | Decompor em commits parciais por Modo (PRD primeiro, depois BROWNFIELD, depois AR). Não cair em "tudo ou nada". |
| Mudanças em hooks podem quebrar testes existentes | Cada sprint termina com `npm run test:hooks-node-only` verde antes de fechar. |
| Reescrever `devops-infra` e `dba-dados` em PT-BR pode mudar comportamento dos agentes | Diff revisado pelo `revisor` antes de commit. Saída antiga vs nova comparada em 1 caso real. |
| Sprint 5 tem muitas mudanças paralelas (~20 ações) | Subdividir em 4 commits temáticos (docs novas / aliases / antimascaramento / trilha auditoria). |

---

## Como medir progresso

Cada sprint produz:
1. **Commits** atômicos por ação (B1, B2, ..., J20) — rastreável.
2. **`docs/auditorias/2026-05-24-auditoria-10-agentes/PROGRESSO.md`** atualizado a cada sprint com checklist.
3. **Re-auditoria parcial** ao final de cada sprint (os 2-4 auditores relevantes).
4. **Re-auditoria total** ao final do Sprint 5 — os 10 originais rodam de novo. Meta: nota 10 em todos.
