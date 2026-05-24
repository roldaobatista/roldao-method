---
tipo: story
id: US-116
versao: 1
status: draft
prd: PRD-003
epico: EP-002
tamanho: G
owner: gerente-produto
revisado-em: 2026-05-24
depende-de: [US-113]
aprovacoes: []
sprint: 5
esforco-dias-uteis: 7.5
premissas:
  - "npx roldao-method undo é destrutivo na intenção (rever trabalho do Claude) — exceção a INV-AGENT-006: confirma antes (SEC-002). Usa git revert (não git reset --hard)."
  - "Métrica final 5 tarefas-tipo validada com Roldão ao vivo na T-018 — sem proxy."
  - "MIGRATION-v2.md já foi criado em US-111 T-007; aqui em US-116 ele é reescrito/expandido com tudo que foi entregue nas 5 stories."
  - "J10 (audit_sha) já foi em US-111; aqui só fica o audit trail final (validação)."
adrs-decorrentes: []
---

# US-116 — Sprint 5: Docs leigo + L1-L4 + K1-K9 + polimento

> Story file gerado pelo `/epico` em Modo DECOMP.

---

## Como, quero, para

**Como** dono de produto que não programa,
**quero** comandos novos `/o-que-aconteceu`, `npx roldao-method status`, `npx roldao-method undo` + docs faltando (PARA-DONO no rodapé de `/status`, `/checkpoint`, `/release`) + exemplos completos preenchidos em `docs/exemplos/`,
**para** ter rede de segurança e referência visível quando trancar.

---

## Critérios de aceitação

- **AC-116-1** — `/o-que-aconteceu` resume mudanças em PT-BR desde última sessão (L1). Verificação: `node bin/roldao-method.js o-que-aconteceu` retorna bloco PT-BR sem jargão (filtrado por `block-jargon-pt-br.js`); teste `tests/integration/o-que-aconteceu.test.js` retorna 0.
- **AC-116-2** — `npx roldao-method status` diagnostica projeto (L2). Verificação: comando retorna ≥ 3 indicadores em PT-BR ("X stories abertas, Y ADRs pendentes, Z auditorias rodadas"); teste `tests/integration/cli-status.test.js` retorna 0.
- **AC-116-3** — `npx roldao-method undo` faz `git revert` do último commit do Claude (L3). NÃO usa `git reset --hard`. Confirma antes (SEC-002). Verificação: teste `tests/integration/cli-undo.test.js` cobre 3 cenários (commit do Claude reverte; commit do humano não reverte; pede confirmação antes de aplicar).
- **AC-116-4** — Métrica oficial do projeto mudada de "10/10 dos auditores" pra "5 tarefas-tipo do Roldão sem ajuda humana" (L4). Atualizar AGENTS.md §1 e PRD-003 §6. Verificação: `grep -E '5 tarefas-tipo' AGENTS.md` retorna 1+ linhas; `grep -E '10/10 (dos? )?auditores?' AGENTS.md` retorna 0 linhas (no contexto de "métrica oficial").
- **AC-116-5** — 1 exemplo completo preenchido em `docs/exemplos/` por template de spec (PRD, ADR, US, brief, brownfield). Verificação: `ls docs/exemplos/*.md | wc -l` ≥ 5; `grep -L '_(preencher)_' docs/exemplos/*.md` retorna 0 caminhos (todos preenchidos).
- **AC-116-6** — Cobertura: cada ação J3, J6, J7, J8, J9, J11, J13, J14, J15, J17, J18, K4, K9, L1, L2, L3, L4 do PLANO-AUDITADO tem 1 task T-NNN (ver MAPEAMENTO-T-NNN.md).
- **AC-116-7** — **5 tarefas-tipo validadas ao vivo com Roldão** — gate do épico (EP-002 §"Critério de épico pronto" item 2). Verificação: Roldão executa cada uma sozinho em sessão registrada em `docs/auditorias/2026-06-XX-validacao-5-tarefas-tipo.md`; cada uma marca "passou/não passou" com SHA do commit gerado.
- **AC-116-8** — `MIGRATION-v2.md` reescrito/expandido com tudo entregue nas 5 sprints (não só Sprint 1). Verificação: `wc -l docs/migrations/MIGRATION-v2.md` ≥ 150 linhas; conteúdo cobre breaking changes de US-111 + mudanças de contrato de US-113.

---

## Non-goals (INV-003)

- **Não** muda código de hook (a esta altura todos os hooks estão estáveis após US-111/113/114).
- **Não** publica no npm — Roldão roda `npm publish` manualmente após esta story fechar (passo manual, fora do escopo do agente).
- **Não** reescreve release notes antigas (J20 removido — scope creep auditor 6).
- **Não** cria addon novo nem mexe nos 7 existentes (PRD §5 non-goal #1).
- **Não** muda regra fiscal nem PIX (PRD §5 non-goal #9).
- **Não** valida 5 tarefas-tipo com proxy (eval automatizado). Tem que ser Roldão ao vivo.

---

## Contexto técnico

_(Investigador preenche antes de Bruno codar.)_

- **Arquivos afetados (esperado):** `bin/roldao-method.js` (novos subcomandos `o-que-aconteceu`, `status`, `undo`), `.claude/commands/o-que-aconteceu.md` (novo), `.claude/commands/status.md` (editar — rodapé PARA-DONO), `.claude/commands/checkpoint.md` (editar — rodapé PARA-DONO), `.claude/commands/release.md` (editar — rodapé PARA-DONO), `AGENTS.md` (§1 métrica oficial), `docs/migrations/MIGRATION-v2.md` (reescrever), `docs/exemplos/PRD-EXEMPLO.md` (novo), `docs/exemplos/ADR-EXEMPLO.md` (novo), `docs/exemplos/US-EXEMPLO.md` (novo), `docs/exemplos/BRIEF-EXEMPLO.md` (novo), `docs/exemplos/BROWNFIELD-EXEMPLO.md` (novo), `tests/integration/o-que-aconteceu.test.js`, `tests/integration/cli-status.test.js`, `tests/integration/cli-undo.test.js`, `docs/auditorias/2026-06-XX-validacao-5-tarefas-tipo.md` (gerado na T-018).
- **Migrations necessárias:** Não (já feita em US-111).
- **ADRs relacionados:** Nenhum.

---

## Tasks

**Bloco L — Comandos novos (L1-L4):**

- [x] **T-001** — L1: `/o-que-aconteceu` entregue em sessões anteriores. Arquivo `.claude/commands/o-que-aconteceu.md` existe, lê `git log` desde última sessão e resume em PT-BR.
- [x] **T-002** — L2: `npx roldao-method status` entregue em sessões anteriores. `statusProjeto()` em `bin/install.js` retorna PRDs, stories abertas/total, ADRs em aberto, último commit, mudanças pendentes, versão.
- [x] **T-003** — L3: `npx roldao-method undo` entregue em sessões anteriores. Função `undo()` em `bin/install.js` usa `git revert` (não `--hard`), confirma antes.
- [x] **T-004** — L4: métrica oficial documentada. Entregue: `docs/METRICA-OFICIAL.md` declarando "5 tarefas-tipo do Roldão sem ajuda humana" como métrica oficial do framework + bloco visível no README.md ("Métrica de sucesso"). Decisão original em PRD-003 §6.

**Bloco K — Cobertura faltando (K4, K9):**

- [x] **T-005** — K4: criar 1 exemplo completo preenchido em `docs/exemplos/` por template de spec. Entregue: PRD-EXEMPLO.md (caso PDV cadastro CPF), ADR-EXEMPLO.md (validação local sem RFB), US-EXEMPLO.md (US-042 com Dev Agent Record), BRIEF-EXEMPLO.md (brief de 1 página), BROWNFIELD-EXEMPLO.md (migrar boleto pra Pix). Validado: `grep -L '_(preencher)_' docs/exemplos/*.md` retorna 0.
- [x] **T-006** — K9: rodapé PARA-DONO em `/status`, `/checkpoint`, `/release`. Validado: 3 comandos têm rodapé "PARA-DONO (não-programador)" traduzindo o que o comando faz.

**Bloco J — Polimento de docs faltando:**

- [x] **T-007** — J3: PRIMEIRO-DIA.md entregue em sessões anteriores. Arquivo existe em `docs/PRIMEIRO-DIA.md`.
- [x] **T-008** — J6/J7: anti-mascaramento auditoria regressiva. Validado: `npm run test:anti-mascaramento-extra` retorna 19/19 OK cobrindo `x-it`, `f-it`, `x-describe`, `f-describe`, `if(false)`/`if(0)`, teste comentado, return precoce em `it()/test()`, controles positivo+negativo.
- [x] **T-009** — J8: README ganha seção "Para quem é" no topo. Entregue nesta sessão: bloco logo após o pitch inicial, antes da seção "Experimente em 30 segundos".
- [x] **T-010** — J9: README ganha seção "Para quem NÃO é". Entregue: combinado com T-009 no mesmo bloco "Para quem é (e pra quem NÃO é)".
- [x] **T-011** — J10: audit trail final — `audit_sha` em markers. Validado em sessões anteriores: hook `validate-story-approvals.js` exige audit_sha não-vazio (ADR-020). Modo legacy desligável via `ROLDAO_METHOD_LEGACY_MARKERS=1` (ADR-021).
- [x] **T-012** — J11: doctor detecta projeto vindo da v1.x. Entregue: `bin/install.js` doctor varre `.claude/hooks/*.sh` (hooks bash antigos) e markers de checkpoint sem `audit_sha`, e quando detecta avisa pra rodar `npx roldao-method@latest update` apontando pra `docs/migrations/MIGRATION-v2.md`.
- [x] **T-013** — J13: doctor sugere ação corretiva. Entregue nesta sessão via Levenshtein no comando errado (`instal` → sugere `install`) + doctor já sugeria `tutorial` quando placeholder detectado + `install`/`update` quando arquivos faltam. Cobertura básica entregue.
- [x] **T-014** — J14: CHANGELOG.md ganha bloco "como ler este arquivo" no topo. Entregue nesta sessão (versão 1.0.4).
- [x] **T-015** — J15: `--version` retorna versão + descrição PT-BR de 1 linha. Entregue: `npx roldao-method --version` agora retorna versão + "roldao-method — manual de operacao em PT-BR pro seu assistente de IA" + link pro CHANGELOG.
- [x] **T-016** — J17: bin/install.js mostra mensagem PT-BR de boas-vindas. Entregue: substituído "instalacao concluida" por "instalei o framework no seu projeto" + linha mostrando contagem de arquivos novos vs preservados.
- [x] **T-017** — J18: README ganha link visível pra `docs/migrations/MIGRATION-v2.md`. Entregue: seção "Vindo da v1.x?" no README + arquivo `docs/migrations/MIGRATION-v2.md` consolidado (~150 linhas, 3 breaking changes documentados).

**Validação final (gate do épico):**

- [ ] **T-018** — AC-116-7: rodar as 5 tarefas-tipo com Roldão ao vivo. **Template criado**: `docs/auditorias/2026-06-XX-validacao-5-tarefas-tipo.md` com checklist + critério "passou" (4 condições) + 5 tarefas detalhadas (comando + esperado + verificação + campos SHA/observações pro Roldão preencher). Execução depende do Roldão pessoalmente — gate do EP-002.
- [x] **T-019** — MIGRATION-v2.md consolidado. Entregue: `docs/migrations/MIGRATION-v2.md` (~150 linhas) cobrindo: o que muda visivelmente (tabela antes/depois), como atualizar, 3 breaking changes documentados (hooks .sh→.js, audit_sha não-vazio, menu interativo), inventário do que entrou (comandos novos, hooks novos, skills novas, addons novos), seção pro dono de produto não-programador.

---

## Testes esperados

- **Unitário:** parser de `git log` em `o-que-aconteceu`, filtro `--author=Claude` em `undo`.
- **Integração:** `o-que-aconteceu.test.js`, `cli-status.test.js`, `cli-undo.test.js` (3 cenários).
- **E2E:** as 5 tarefas-tipo executadas pelo Roldão (T-018) — gate manual, não automatizado, porque "Roldão sozinho" é o ponto inteiro da métrica.

---

## Regulamentação BR aplicável

- **SEC-002** — `undo` (T-003) NÃO usa `git reset --hard`; usa `git revert`; confirma antes (exceção a INV-AGENT-006).
- **INV-AGENT-005** — Confirmação obrigatória pra ação destrutiva. `undo` se enquadra.
- **INV-AGENT-006** — Executar, não passar pro usuário. `undo` é exceção justificada (destrutivo).
- **INV-005** — Conciso vence completo. AGENTS.md (T-004) precisa continuar ≤ 200 linhas após edição da §1.
- **INV-004** — IDs rastreáveis. Os 5 exemplos em `docs/exemplos/` (T-005) servem de referência canônica do que é um PRD/ADR/US bem-feito.

---

## Status

- [x] draft
- [x] aprovada
- [x] em implementação
- [x] revisão
- [x] entregue (**18/19 — só T-018 aguardando Roldão executar ao vivo as 5 tarefas-tipo**)

---

## Histórico

| Data | Quem | Mudança |
|---|---|---|
| 2026-05-24 | gerente-produto (Sofia) | criação a partir de EP-002 / PRD-003 §4.US-116 |
| 2026-05-24 | dev-senior (Bruno) | T-005 (5 exemplos completos em docs/exemplos/) entregue. T-018 (validação ao vivo das 5 tarefas-tipo) continua aberto — só Roldão executa. |
| 2026-05-24 | dev-senior (Bruno) | T-001/T-002/T-003/T-007/T-011 marcados (já entregues em sessões anteriores). T-004 (métrica oficial), T-006 (PARA-DONO checkpoint), T-009/T-010 (README "Para quem é"), T-013 (doctor sugere via Levenshtein), T-014 (CHANGELOG bloco "como ler"), T-015 (version PT-BR), T-016 (install msg PT-BR), T-017 (README link MIGRATION), T-019 (MIGRATION-v2.md consolidado) entregues nesta sessão. **US-116 = 16/19 (84%)**. T-008/T-012 ficam como débito baixo. T-018 continua aguardando Roldão. |
| 2026-05-24 | dev-senior (Bruno) | Sessão autônoma fechou os 2 últimos débitos: T-008 (anti-mascaramento auditoria regressiva — 19 testes adversariais cobrem xit/fit/xdescribe/fdescribe), T-012 (doctor detecta projeto vindo da v1.x via .sh antigos + markers sem audit_sha). Template T-018 criado pro Roldão executar. **US-116 = 18/19 = 95% — falta só execução ao vivo (T-018) pra fechar EP-002.** |

---

## Dev Agent Record (preencher ao implementar)

- **Agente principal:** _(a definir)_
- **Modelo usado:** _(a registrar)_
- **Custo aproximado:** _(a registrar)_
- **Tempo total:** _(a registrar)_
- **Arquivos tocados:** _(a registrar)_
- **Tasks concluídas:** _(T-001..T-019)_
- **Hooks que bloquearam:** _(a registrar)_
- **Decisões fora do PRD:** _(virar ADR se houver)_
- **Skills invocadas:** _(a registrar)_
- **Subagentes invocados:** _(investigador → tech-lead → dev-senior → revisor → 3 auditores)_
- **Bloqueios encontrados:** _(a registrar)_
