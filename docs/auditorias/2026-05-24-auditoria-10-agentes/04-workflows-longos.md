---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: workflows-longos
nota: 6/10
---

# Auditoria Workflows Longos — 2026-05-24

## Resumo executivo
Nota **6/10** pra "Roldão pode deixar rodando 30min e voltar". A infra de snapshot/markers está montada e o pipeline `/feature` é mecânico (Maestro), mas **falta retry/recovery automático** e o **fluxo /prd não tem orquestrador equivalente** — depende do LLM principal seguir o markdown. Em runs > 200k tokens sem header `[1m]`, compactação acontece, mas markers sobrevivem; a perda real é o raciocínio entre etapas.

## Resiliência atual (o que JÁ funciona)
- **Marker filesystem** — `.claude/.runtime/feature-active-${SESSION_HASH}`, `sofia-done-*`, `detetive-done-*`, `auditor-{seg,qual,prod}-pass-*`. Sobrevivem entre sessões.
- **Snapshot dual em PreCompact + SessionEnd** — `session-snapshot.js:37-115` grava `session-snapshot.md` (humano) + `session-state.json` (machine). `session-snapshot-restore.js:32-60` recria markers ativos no SessionStart (TTL 7 dias).
- **`audit_sha` evita auditoria stale** — `require-auditors-pass-before-commit.js:53-66` compara hash do diff atual com o gravado no marker; se Bruno mexer depois, auditor é re-disparado.
- **Statusline mostra contexto em %** com cores: amarelo ≥50%, vermelho ≥75%, vermelho-bold ≥90% (`statusline.js:137-141`).
- **`enforce-pipeline-completion.js` (Stop hook)** recusa encerrar sessão com `feature-active-*` sem `checkpoint-done-*`.
- **`subagent-handoff-audit.js`** avisa (não bloqueia) quando investigador/auditor encerra sem gravar artefato.

## Pontos cegos críticos (P0)
- **Sem retry automático em falha de Task** — se Sofia retorna erro/timeout no meio de `/feature`, Maestro não tem laço de retry definido (`maestro.md:75-89`). **Sugestão:** adicionar seção "Recovery" no `maestro.md` com política "se Task falhar, re-disparar 1x; se falhar de novo, salvar marker `agent-failed-{nome}-${SESSION_HASH}` e abortar pipeline com instrução pro usuário".
- **`/prd` é puramente sequencial sem orquestrador** — 6 etapas (analista→PM→tech-lead→ux→PM-decomp) conduzidas pelo LLM principal lendo markdown (`prd.md:22-66`). Nenhum marker entre etapas, nenhum agente equivalente ao Maestro. Se contexto compactar no meio da Etapa 4, o LLM pode pular pra Etapa 6. **Sugestão:** criar agente `maestro-prd` ou estender Maestro com Modo PRD.
- **`/brownfield`, `/auditoria-reversa` e `/release` também sem orquestrador** — mesma vulnerabilidade. Em `/auditoria-reversa` em repo grande (>100k linhas), Etapa 1 (investigador) pode levar 30+ min e estourar contexto antes mesmo dos 3 auditores em paralelo. **Sugestão:** Modo AR no Maestro, com salvamento incremental do inventário em `.claude/.runtime/audit-inventory.json` por categoria.

## Progresso/visibilidade insuficientes (P1)
- Statusline mostra **último agente concluído**, não **etapa N de 7**. Roldão vê "👤 🛡️ Caio" e não sabe se é etapa 6/7 ou se ainda falta Pedro+Júlia+checkpoint. **Sugestão:** statusline ler `feature-active-*` + contar markers `*-done-*` + `*-pass-*` da sessão e mostrar `· 🔁 4/7`.
- `subagent-handoff-audit.js:34` escreve aviso em stderr — Roldão não vê em statusline. Falha silenciosa de subagente só aparece se ele abrir transcript.

## Compactação/contexto em risco (P1)
- `/prd` completo (analista lê mercado + PM escreve PRD 9 seções + tech-lead lista ADRs + ux + decomp em N stories) facilmente passa de 200k tokens em projeto médio. Sem header `[1m]`, compactação dispara e o LLM principal perde detalhes do brief que o PM precisa. PreCompact grava snapshot mas é narrativo — **não preserva o conteúdo bruto do brief**, só o caminho `docs/research/<slug>.md`.
- `/auditoria-reversa` com `--profile=geral` em repo legado de 200k+ linhas: investigador na Etapa 1 (inventário) facilmente enche contexto. Não há salvamento incremental.

## Auditoria final: real ou teatro? (P0)
**Real, com 1 vulnerabilidade.** `require-auditors-pass-before-commit.js:69` bloqueia `git commit/merge/push` com `exit 2` se faltar qualquer um dos 3 markers `auditor-{seg,qual,prod}-pass-*` ou se `audit_sha` divergir do diff atual. **Override manual existe** (instruções no próprio hook, linhas 107-111) — Roldão não-programador é instruído a `touch` os 3 markers se quiser bypass. Aceitável mas vale documentar no `/help` que isso é exceção destrutiva.

## Veredito
**Parcial.** Pra `/feature` simples (1 story, ≤10 arquivos, sem compactação): Roldão pode iniciar, tomar café 30min, voltar — Maestro orquestra, markers garantem, auditores bloqueiam merge inválido. **Pra `/prd`, `/brownfield`, `/auditoria-reversa`, `/release`: NÃO** — falta orquestrador equivalente ao Maestro, falta retry, falta salvamento incremental. Em repo grande, `/auditoria-reversa` pode estourar contexto na Etapa 1 e perder tudo silenciosamente. **Condição mínima pra promover pra "sim, deixa rodando":** criar `Modo PRD`, `Modo BROWNFIELD`, `Modo AR` no Maestro com markers por etapa + retry 1x + salvamento incremental.
