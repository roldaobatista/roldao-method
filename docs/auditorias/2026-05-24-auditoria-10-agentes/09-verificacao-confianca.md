---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: verificacao-confianca
nota: 7/10
---

# Auditoria Verificação e Confiança — 2026-05-24

## Resumo executivo
**Nota: 7/10 pra "Roldão pode confiar que 'feito' é mesmo feito".** O framework tem instrumentação séria — `audit_sha` de diff em pass markers, exigência de `investigation-*.json`, `validate-story-approvals` lendo frontmatter YAML — mas tem falsificáveis óbvios (override por `touch`/`echo` documentado em mensagens de erro, anti-mascaramento sem cobrir `if (false)`/teste comentado, `/checkpoint` é prosa, sem campo "comando rodado + saída"), e nada amarra "auditor disse APROVADO" a uma evidência real de que ele leu o diff.

## Verificações ROBUSTAS (manter)
- **`require-auditors-pass-before-commit.js`** — calcula `sha256(git diff HEAD)`, compara com `audit_sha` salvo em cada pass marker, e bloqueia se "stale" (auditor aprovou diff A, dev mexeu, marker virou inválido). Combina 3 estados (`blocked`/`missing`/`stale`) e bloqueia em qualquer um. Esse é o melhor anti-rubber-stamp do repo.
- **`require-investigador-before-fix.js` GATE 2** — não basta `investigator-invoked` marker; com `bug-active-*` presente exige `investigation-*.json` em disco. Sem prova mecânica do que foi lido, REGRA #0 viraria teatro. Excelente.
- **`validate-story-approvals.js`** — valida frontmatter persistente em `docs/stories/US-NNN-*.md` (não marker efêmero), exige 7 etapas obrigatórias, conta `status: reprovado|bloqueado` e bloqueia. Audit trail sobrevive ao fim da sessão.
- **`block-destructive.js`** — fail-closed real, não teórico (bloqueou o próprio auditor neste audit).

## Verificações FALSIFICÁVEIS (P0)
- **`require-checkpoint-before-merge.js`** — falsificável literal: o próprio hook **ensina o bypass na mensagem de erro** (linha 54: `mkdir -p "${runtime}" && touch "${markCheckpoint}"`). Cenário: agente cansado lê stderr, copia o `touch`, commit passa. Marker é arquivo vazio — não tem conteúdo verificável. **Correção:** exigir que o marker contenha SHA do checkpoint salvo (`docs/checkpoints/CHK-*.md`) + `audit_sha` do diff coberto.
- **`require-auditors-pass-before-commit.js` override (linha 108-111)** — também ensina o bypass: 3 `touch` criam markers sem `audit_sha`. Como o staleness check só roda `if (auditSha && auditSha !== currentSha)`, marker vazio passa ileso (`auditSha=''` → não compara). **Cenário literal:** `touch .claude/.runtime/auditor-{seg,qual,prod}-pass-$SESS` → commit passa sem auditor algum ter rodado. **Correção:** rejeitar marker sem JSON parseável + `audit_sha`.
- **`require-investigador-before-fix.js` GATE 2 bypass (linha 68)** — ensina: `echo '{"lido":["bypass: confiei no usuario"],"achado":"trivial"}' > investigation-bypass.json`. O hook só checa que existe `investigation-*.json`, não que `lido` é array não-vazio com paths reais nem que `achado` ≠ "trivial". **Correção:** validar shape mínimo (≥1 path real existente em `lido`, `achado` ≥ 20 chars).

## Anti-mascaramento com buracos (P0/P1)
- **Não cobre `if (false) { ... }` ou `if (0) {`** — bloco inteiro de teste vira morto silenciosamente. Auditor-qualidade lista isso como anti-padrão na prosa, mas hook não bloqueia.
- **Não cobre teste comentado (`/* it('...', ...) */` ou `// it(...)`)** — anula assertion sem disparar regex.
- **Não cobre `expect(x).toBeDefined()` quando antes tinha `toEqual(...)`** — relaxar assertion é mascaramento clássico, exige análise semântica (P2 — fora de regex).
- **Não cobre `return` precoce em função de teste** (`it('x', () => { return; expect(...) })`).
- **`xdescribe(`** está no checklist da regra mas FALTA no array de patterns. Confirmado por leitura: array tem `xit`, `fit`, `fdescribe`, **não tem `xdescribe`**. Cenário: `xdescribe('financeiro', () => { ... 200 testes ... })` passa direto.

## Critérios vagos onde deveria ter checklist (P1)
- **`revisor.md` § "Causa raiz vs sintoma"** — pede confronto com `investigation-<ref>.json` mas critério "arquivo_correcao/linha_aproximada bate com onde o diff mexeu" é subjetivo. **Sugestão:** revisor obrigado a colar 1 linha do JSON + 1 linha do diff no relatório.
- **`auditor-qualidade.md` cobertura** — diz "Cobertura proporcional ao risco" mas não exige rodar `npm test -- --coverage` e colar % real. **Sugestão:** saída obrigatória inclui linha "rodei: `<comando>` — resultado: `<%>`".
- **`/checkpoint` Etapa 2** — "auditor-seguranca: APROVADO / RESSALVAS / BLOQUEADO" sem campo "comando que rodou pra concluir isso". Rubber-stamp possível.

## Diff/evidência invisível ao Roldão (P1)
- Nenhum command obriga mostrar `git diff --stat` em PT-BR ao Roldão no fim. `/checkpoint` Etapa 3 lista "Arquivos tocados: motivo" mas é narrativa do agente — Roldão não vê o diff.
- **Sugestão:** `/checkpoint` Etapa 3 inclui bloco fixo "Mudanças mensuráveis: N arquivos, +X/-Y linhas, M testes novos" + link para CHK e o diff bruto salvo em `docs/checkpoints/CHK-*.diff` (artefato persistente).
- `/release` Etapa 0 fala "gates verdes: rode `npm test`" mas não exige colar saída.

## Trilha auditável faltando (P1)
- **Markers em `.claude/.runtime/` são efêmeros** — `maestro.md` linha 157 deleta no fim do pipeline. 6 meses depois não dá pra responder "quem auditou US-042 e em que diff sha?". Trilha vive só no `aprovacoes:` da story, que tem `data` mas **não tem `audit_sha`** (formato em `audit-trail.md` linha 27-60).
- **Sugestão:** `aprovacoes:` ganha campo `audit_sha: <sha>` por etapa de auditor; `validate-story-approvals` valida que cada `audit_sha` casa com `git log` de algum commit alcançável.
- **`metrics.jsonl`** existe, mas só registra bloqueios — não há "approvalRecorded" registrando quando auditor passou. Auditoria forense fica cega.

## Veredito
Quando o agente diz "pronto", o framework dá ao Roldão **evidência verificável parcial**: `audit_sha` em pass marker é a peça mais forte, `investigation-*.json` exige prova real, frontmatter de story persiste audit trail. **Mas** as mensagens de erro dos próprios hooks ensinam o bypass (`touch` + `echo {}`), anti-mascaramento não cobre `if (false)`/`xdescribe`/teste comentado, e nada obriga auditor/revisor a colar a saída do comando que rodou. **Confiança realista:** Roldão pode confiar em commit fechado por pipeline `/feature` honesto (~80% verificável); commit feito por agente apressado que copiou o bypass da stderr passa ileso e parece igual. Os 3 P0 acima fecham o gap de "marker vazio = aprovação" — uma vez aplicados, a nota sobe pra 9/10.
