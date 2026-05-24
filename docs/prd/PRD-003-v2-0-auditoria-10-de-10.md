---
tipo: prd
id: PRD-003
versao: 1
status: draft
owner: gerente-produto
revisado-em: 2026-05-24
escopo: evolucao interna do framework ROLDAO-METHOD pra fechar gap entre doutrina e pratica — release v2.0.0
fontes:
  - docs/research/auditoria-10-de-10.md
  - docs/auditorias/2026-05-24-auditoria-10-agentes/PLANO-AUDITADO.md
  - docs/auditorias/2026-05-24-auditoria-10-agentes/RESUMO-EXECUTIVO.md
epico-filho-previsto: EP-002
stories-filhas-previstas:
  - US-111 (Sprint 1 — Bloqueadores + alta-prioridade leigo)
  - US-112 (Sprint 2A — Autonomia dos agentes)
  - US-113 (Sprint 2B — Orquestracao Maestro multi-modo)
  - US-114 (Sprint 3 — Auto-preenchimento + PT-BR)
  - US-115 (Sprint 4 — UX Terminal + Descoberta)
  - US-116 (Sprint 5 — Docs faltando + L1-L4 + K1-K9 + polimento)
adrs-decorrentes-previstos:
  - ADR-019 (Maestro multi-modo — PRD/BROWNFIELD/AR)
  - ADR-020 (Contrato audit_sha em markers de aprovacao)
  - ADR-021 (Janela de compatibilidade ROLDAO_METHOD_LEGACY_MARKERS)
premissas:
  - "Versionamento confirmado pelo Roldao como v2.0.0 major bump, com MIGRATION-v2.md."
  - "Nomes de comandos publicos NAO mudam (/qa segue /qa; sem alias /adotar). Decisao do Roldao."
  - "Metrica final NAO e 10/10 dos auditores — e 5 tarefas-tipo do Roldao sem ajuda humana. Decisao do Roldao."
  - "Este PRD faz parte do dogfood — usar o proprio framework pra planejar. Decisao do Roldao."
  - "Numeracao verificada em disco: PRD-001 e PRD-002 existem -> este e PRD-003. EP-001 existe -> proximo e EP-002. US-101..US-110 existem -> proximas comecam em US-111. ADR-001..ADR-018 existem -> proximo ADR comeca em ADR-019."
  - "Hook block-jargon-pt-br.js depende de array literal de termos (sem fallback pra tabela canonica) — confirmado no brief secao 'Perguntas pendentes pra investigador'. Investigador deve reconfirmar em US-114 antes do dev mexer."
  - "Markers de auditor hoje aceitam arquivo vazio sem audit_sha — confirmado no brief secao 3 item 2. Investigador deve reproduzir cenario em sandbox antes do AC de US-111."
  - "Cronograma realista de 10 semanas inclui 1 semana de buffer pra hotfix paralelo, conforme auditor 7."
  - "Sprint 1 destrava todos os demais. Sprint 2B depende de Sprint 2A. Sprints 3-4-5 podem rodar em paralelo apos Sprint 2B (definido na secao 7 deste PRD)."
---

# PRD-003 — v2.0.0 Auditoria 10 de 10

> **PRD = Product Requirements Document.** Em PT-BR claro: documento que diz o que vamos construir, pra quem, por que, e como saberemos que deu certo. Spec-as-source (INV-002): este documento gera as user stories filhas (US-111..US-116) e o codigo, nao o contrario.
>
> **Contexto:** este PRD e o resultado do framework ROLDAO-METHOD se auditando com 10 lentes independentes (auditoria de 2026-05-24) e usando o proprio fluxo `/prd` pra planejar a propria evolucao. Dogfood (INV-002, ADR-005).

---

## 1. Problema

O framework ROLDAO-METHOD hoje funciona muito bem **pra quem ja e da area de programacao**. Mas a promessa central do produto e outra: servir o **dono de produto que NAO programa** — o Roldao — pra ele tocar projeto serio com ajuda de assistente de IA sem depender de tradutor humano intermediario.

Os 10 auditores independentes convergiram em um diagnostico desconfortavel: o framework **prega doutrina mais forte do que cumpre nas proprias entranhas**. Os textos voltados pra "vitrine" (README inicial, agente que escreve em PT-BR claro, skill de traducao de jargao) sao exemplares. Mas as camadas internas (agentes tecnicos como `devops-infra` e `dba-dados`, mensagens de erro de hook, templates a preencher, comandos longos como `/prd` e `/brownfield`) tratam o usuario leigo como caso especial, nao como contrato do produto.

**Resultado pratico:** o Roldao atinge ~60% das tarefas sozinho, mas trava nos 40% restantes em pontos onde o framework **sabia a resposta e nao a entregou** — placeholder `_(preencher)_` sem botao de ajuda, agente que devolve "1-3 perguntas pendentes pro PM responder", bypass de auditor literalmente ensinado na mensagem de erro do proprio hook (`touch` em 3 arquivos vazios "aprova" sem nenhum auditor ter rodado).

**Evidencia:**

- **Nota agregada da auditoria: 6.95 / 10** (10 lentes independentes).
- **5 lacunas abaixo de 7.5:** auto-preenchimento (5.0), workflows longos (6.0), coerencia PT-BR (6.5), descoberta/navegacao (8.0 — mas skills/addons quase invisiveis no `/help`).
- **3 bypasses ensinados na propria stderr dos hooks:** `require-auditors-pass-before-commit.js` linhas 108-111, `require-checkpoint-before-merge.js` linha 54, `require-investigador-before-fix.js` GATE 2 linha 68.
- **32+ jargoes em ingles no mesmo agente interno** (`devops-infra.md` usa "deploy" 11x, "rollback" 7x, "migration" 3x) enquanto o hook `block-jargon-pt-br.js` bloqueia o usuario por escrever "commit".
- **`xdescribe` literalmente ausente** do array de patterns do `anti-mascaramento.js` — `xdescribe('financeiro', () => { ... 200 testes ... })` passa direto.

---

## 2. Personas

| Persona | Quem e | O que quer | Onde sofre hoje |
|---|---|---|---|
| **Roldao — dono de produto BR** | Idealizador/dono de produto que NAO programa. Conhece o produto melhor que ninguem, mas nao escreve codigo nem traduz mensagem tecnica. | Tocar projeto serio com IA sem chamar dev humano pra traduzir o que o framework devolve. Iniciar projeto, adotar repo legado, reportar bug, pedir feature, fechar release — tudo sozinho, em PT-BR claro. | Trava em placeholder `_(preencher)_` sem orientacao. Recebe `analista` devolvendo "perguntas pro PM" no meio do fluxo. Le commit `feat(T-031): ...` e nao sabe o que e T-031. Bate em hook que bloqueia "commit" mas deixa "deploy" passar. |
| **Dev que adota o framework em projeto terceiro** | Programador experiente que usou outras ferramentas e esta adotando ROLDAO-METHOD num cliente. Quer estabilidade e migracao previsivel. | Atualizar o framework sem quebrar o que ja funciona no projeto dele. Saber exatamente o que mudou e por que. | Hoje breaking change em hook (fechar bypass `touch`) chega sem aviso em release minor. Sem `MIGRATION-v2.md` e sem janela de compatibilidade. |
| **Mantenedor de addon (`fintech-br`, `fiscal-br-completo`)** | Autor de addon que estende o core do ROLDAO-METHOD. Depende do contrato de markers e do shape de `_lib.js`. | Saber quando o core muda contrato que ele consome. Receber sinal claro pra atualizar o addon antes do core quebrar. | Hoje contrato de marker (`auditor-{seg,qual,prod}-pass-$SESS`) e implicito. Mudanca em D1-D3 (Maestro multi-modo) muda shape sem aviso. |

---

## 3. Hipotese de solucao

Fechar o gap entre **doutrina (regras INV/SEC/TST/LGPD que o framework prega)** e **pratica (o que os 34 hooks + 17 agentes + 26 comandos + 13 skills entregam mecanicamente)**. Nao e reescrita arquitetural — sao **ajustes pontuais em ~15 arquivos** que somados eliminam o trafego de decisao tecnica que hoje volta pro Roldao no meio do fluxo.

A solucao se decompoe em 5 sprints (mais 1 semana de buffer), totalizando **10 semanas**, lancada como **v2.0.0 (major bump honesto)** com `MIGRATION-v2.md` e flag de compatibilidade `ROLDAO_METHOD_LEGACY_MARKERS=1` valida por 1 release.

Cada sprint vira 1 user story filha (US-111..US-116) com criterios de aceitacao binarios e comando verificavel (sem "o usuario vai entender"). A metrica final do produto NAO e "10/10 dos auditores" — e **"o Roldao completa 5 tarefas-tipo sozinho sem ajuda humana"** (definidas na secao 6).

---

## 4. User stories (rastreaveis)

> Cada US filha sera criada na Etapa 6 (Modo DECOMP) com criterios de aceitacao testaveis (`AC-NNN-N`). Cadeia: `PRD-003` -> `EP-002` -> `US-111..US-116` -> `AC-NNN-N` -> `T-NNN` -> commit. Ver INV-004.
>
> Aqui no PRD listamos so o titulo + objetivo + AC de alto nivel de cada sprint. O detalhamento completo de AC (com comando verificavel) vai pras stories filhas.

### US-111 — Sprint 1: Bloqueadores + alta-prioridade leigo

**Como** dono de produto que nao programa, **quero** que o framework respeite as proprias regras que prega (INV-003, INV-004, INV-AGENT-006) e que os bypasses ensinados na stderr dos hooks sejam fechados, **para** confiar que aprovacao significa aprovacao de verdade.

**Criterios de aceitacao (alto nivel):**
- **AC-111-1** — Markers de auditor exigem `audit_sha` valido (arquivo vazio nao aprova). Comando: `tests/hooks/require-auditors-pass.test.js` retorna 0.
- **AC-111-2** — `xdescribe` bloqueado pelo `anti-mascaramento.js` (junto com `xit`, `fit`, `fdescribe`). Teste adversarial: 1 caso passa + 1 caso bloqueia.
- **AC-111-3** — Release marcada como `v2.0.0` no `plugin.json` + `MIGRATION-v2.md` em `docs/migrations/`.
- **AC-111-4** — Flag `ROLDAO_METHOD_LEGACY_MARKERS=1` reativa comportamento antigo por 1 release.
- **AC-111-5** — Mapeamento `B/A/C/D/E/F/G/H/I/J -> T-NNN` documentado em US-111 (cumprir INV-004 — commit-message-validator nao vai bloquear).
- **AC-111-6** — Ajustes movidos do plano original pro Sprint 1: G7 (`_lib.js` prefixo), F1 (regex jargao expandida), J10 (`audit_sha` em aprovacoes), J12 (GIF/video README), J16 (`npx roldao-method` menu sem arg), J19 (CHANGELOG pro leigo), J1 (PRIMEIRO-DIA.md), J2 (COMO-PEDIR-AJUDA.md), I7 (glossario de IDs).
- **AC-111-7** — Consolidacao: B4 + J6 + J7 viram 1 commit atomico em `anti-mascaramento.js`.

**Tamanho estimado:** G (grande — 1.5 semanas).

### US-112 — Sprint 2A: Autonomia dos agentes (C1-C7)

**Como** dono de produto, **quero** que agentes tecnicos (`analista`, `devops-infra`, `dba-dados`) decidam sozinhos em vez de devolver "1-3 perguntas pendentes pro PM", **para** nao precisar tomar decisao tecnica que nao sei tomar.

**Criterios de aceitacao (alto nivel):**
- **AC-112-1** — `analista.md` reescrito sem secao "perguntas pendentes pro PM" — viola INV-AGENT-006. Premissas viram `premissas:` no frontmatter, validacao fica pro investigador depois.
- **AC-112-2** — `dba-dados.md` e `devops-infra.md` reescritos sem "Pergunta padrao de X". Decisao tecnica e assumida e documentada como premissa.
- **AC-112-3** — Eval comportamental em `evals/agent-behavior/` mostra que os 3 agentes NAO devolvem pergunta evitavel pro usuario (taxa < 5%).
- **AC-112-4** — Cobertura das acoes C1-C7 do PLANO-AUDITADO.

**Tamanho estimado:** M (medio — 1.5 semanas).

### US-113 — Sprint 2B: Orquestracao Maestro multi-modo (D1-D8)

**Como** dono de produto, **quero** que workflows longos (`/prd`, `/brownfield`, `/auditoria-reversa`) tenham orquestrador igual `/feature` tem, **para** nao precisar saber qual e o proximo agente.

**Criterios de aceitacao (alto nivel):**
- **AC-113-1** — ADR-019 escrito documentando os 3 modos novos do Maestro (PRD/BROWNFIELD/AR). Sem ADR, INV-002 e violada.
- **AC-113-2** — Statusline mostra etapa N/7 quando dentro de pipeline (D5 do plano).
- **AC-113-3** — Contrato marker -> etapa documentado em ADR-019.
- **AC-113-4** — Cobertura das acoes D1-D8 do PLANO-AUDITADO.
- **AC-113-5** — Cada hook editado ganha 2 testes adversariais (passa + bloqueia) em `tests/hooks/*.test.js` no mesmo commit.

**Dependencia:** depende de US-112 (autonomia dos agentes) — orquestrador so funciona se agentes individuais nao devolverem perguntas.

**Tamanho estimado:** G (grande — 2 semanas).

### US-114 — Sprint 3: Auto-preenchimento + PT-BR (E + F2-F6)

**Como** dono de produto, **quero** placeholders `_(preencher)_` com botao de ajuda + sincronizacao da regex do hook `block-jargon-pt-br.js` com a tabela canonica `traduzir-jargao`, **para** nao parar no meio de `/inicio` Etapa 4 sem saber o que escrever, e pra agentes internos nao usarem jargao que o usuario e bloqueado de usar.

**Criterios de aceitacao (alto nivel):**
- **AC-114-1** — Helper unico `next-id.js` formata proximo ID disponivel (US/ADR/T/PRD/EP). Comando: `node .specify/scripts/next-id.js us` retorna `US-117`.
- **AC-114-2** — Etapas 4-5 do `/inicio` chamam varredura de stack que ja existe no `/brownfield` (deduplicacao).
- **AC-114-3** — Regex do `block-jargon-pt-br.js` cobre os termos faltantes confirmados pelo investigador na premissa: `mock`, `migration`, `backend`, `cache`, `webhook`, `token`, `API`, `payload`, `stack trace`, `null pointer`, `race condition`, `edge case`.
- **AC-114-4** — `devops-infra.md` e `dba-dados.md` reescritos em PT-BR sem 32+ jargoes nao-traduzidos (F3, F4).
- **AC-114-5** — Cobertura das acoes E1-E5 + F2-F6 do PLANO-AUDITADO. F1 ja foi no Sprint 1.

**Dependencia:** rodar em paralelo com US-115 e US-116 apos US-113 terminar.

**Tamanho estimado:** M (medio — 1.5 semanas).

### US-115 — Sprint 4: UX Terminal + Descoberta (H + I)

**Como** dono de produto, **quero** statusline que respeita `NO_COLOR`, TL;DR no topo de cada agente, e skills/addons visiveis no `/help`, **para** descobrir sozinho o que o framework oferece.

**Criterios de aceitacao (alto nivel):**
- **AC-115-1** — `statusline.js` consolidado num unico refactor cobrindo D5 + D7 + H2 + H3 + H8 (auditor 3 — consolidacao).
- **AC-115-2** — TL;DR de 3 linhas no topo dos 17 agentes (`personas.md` + 15 agentes + MAPA-VISUAL).
- **AC-115-3** — `/help` mostra skills + addons (hoje quase invisiveis — nota 8.0 do auditor 8).
- **AC-115-4** — `/help "<frase em PT-BR>"` busca fuzzy (K5).
- **AC-115-5** — Cobertura das acoes H1-H8 + I1-I7 (menos I5 removido por duplicacao com E5).

**Dependencia:** paralelo com US-114 e US-116 apos US-113.

**Tamanho estimado:** M (medio — 1 semana).

### US-116 — Sprint 5: Docs faltando + L1-L4 + K1-K9 + polimento

**Como** dono de produto, **quero** comandos novos `/o-que-aconteceu`, `npx roldao-method status`, `npx roldao-method undo` + docs faltando (PARA-DONO no rodape de `/status`, `/checkpoint`, `/release`) + exemplos completos em `docs/exemplos/`, **para** ter rede de seguranca e referencia visivel.

**Criterios de aceitacao (alto nivel):**
- **AC-116-1** — `/o-que-aconteceu` resume mudancas em PT-BR desde ultima sessao (L1).
- **AC-116-2** — `npx roldao-method status` diagnostica projeto ("3 stories abertas, 1 ADR pendente") (L2).
- **AC-116-3** — `npx roldao-method undo` faz revert do ultimo commit do Claude (L3). NAO usa `git reset --hard` (SEC-002).
- **AC-116-4** — Metrica oficial do projeto mudada de "10/10 dos auditores" pra "5 tarefas-tipo do Roldao sem ajuda humana" (L4). Atualizar AGENTS.md secao 1.
- **AC-116-5** — 1 exemplo completo preenchido em `docs/exemplos/` por template de spec (PRD, ADR, US, brief, brownfield).
- **AC-116-6** — Cobertura das acoes K1-K9 (menos K removidos por duplicacao).
- **AC-116-7** — Validar as 5 tarefas-tipo (metrica final) com Roldao executando ao vivo.

**Dependencia:** paralelo com US-114 e US-115 apos US-113.

**Tamanho estimado:** G (grande — 1.5 semanas).

---

## 5. Non-goals (INV-003)

O que **NAO esta no escopo** desta iniciativa v2.0.0:

1. **NAO cria addon novo.** Toda evolucao toca o core (`.claude/`, `.specify/`, `templates/`, `docs/`). Addons existentes (`fintech-br`, `fiscal-br-completo`, `electron-br`, `esocial-completo`, `lgpd-compliance`, `varejo-pdv-br`, `healthtech-br`) recebem so notas de migracao no `MIGRATION-v2.md` quando o contrato de marker muda — nao recebem reescrita.
2. **NAO toca MCP nem runtime do Claude Code.** O framework e adapter — nao mexe em `~/.claude/settings.json` global, nao adiciona MCP server, nao muda como o Claude Code carrega hooks.
3. **NAO renomeia comando publico.** `/qa` continua `/qa`. NAO existe alias `/adotar` pra `/brownfield`. Decisao do Roldao — vale a estabilidade pra quem ja usa contra 1 ponto de descoberta.
4. **NAO publica no npm.** `npm publish` exige credenciais que so o Roldao tem (memoria global). Agente prepara `package.json`, gera release notes e tag — Roldao roda `npm publish` manualmente.
5. **NAO promete +nota se re-auditoria for mesmo modelo/dia.** Metrica oficial e binaria (5 tarefas-tipo passou/nao passou). Re-rodar os 10 auditores com mesmo prompt em dias diferentes da deltas de ±0.5 que nao significam progresso real.
6. **NAO reescreve `.specify/templates/` core.** Qualquer adaptacao de template do projeto vai em `.specify/overrides/<area>/<nome>.md` (precedencia explicita em `roldao-method.md`, ADR-003). `update` nao toca override.
7. **NAO adiciona dependencia runtime.** Continua zero deps runtime (ADR-001). Node puro, hooks Node, skills Python embutido. Nenhum `npm install` novo na arvore do usuario.
8. **NAO cobre split payment (FISCAL-010 / Reforma Tributaria pos-2027).** Split payment e do addon `fintech-br` evoluido. v2.0.0 e sobre fechar gap doutrina vs pratica, nao sobre Reforma Tributaria.
9. **NAO toca fiscal-br-validator nem regra fiscal nenhuma.** Nenhum dos 5 sprints muda FISCAL-001 a FISCAL-010. O escopo e core do framework — regra fiscal continua nos addons.
10. **NAO altera `lgpd-base-legal-reminder` de soft warning pra bloqueador.** A decisao de mante-lo soft e intencional (LGPD-007 ate hoje exige juizo humano sobre base legal). Endurecer e tema pra outro PRD.
11. **NAO refaz release notes antigas (v0.15.x).** J20 do plano original foi removido por scope creep (auditor 6). CHANGELOG atual ganha melhoria pro leigo (J19) so daqui pra frente.
12. **NAO troca runtime de hooks pra bash novamente.** Hooks Node sao decisao firmada (ADR-012, ADR-013). Sem regressao.

---

## 6. Metricas de sucesso

> **Metrica oficial:** as 5 tarefas-tipo abaixo viram cenarios de aceitacao do epico filho EP-002. Cada uma e binaria — Roldao completou sozinho? sim/nao. Nao tem "quase passou".

| # | Tarefa-tipo | Valor atual | Meta | Como medir |
|---|---|---|---|---|
| 1 | **Iniciar projeto novo do zero** | Roldao chama dev pra preencher AGENTS.md | Completa sozinho | Rodar `/inicio`, preencher 4 perguntas em PT-BR claro, terminar com AGENTS.md preenchido (sem `_(preencher)_` restante) e 1 story de exemplo em `docs/stories/`. Verificacao: `grep -r '_(preencher)_' AGENTS.md docs/stories/` retorna 0 linhas. |
| 2 | **Adotar repo legado** | Roldao recebe diagnostico com 32+ jargoes | Completa sozinho | Rodar `/brownfield` em projeto existente, terminar com diagnostico em 1 pagina, 3 riscos listados em PT-BR, sem jargao tecnico nao-traduzido. Verificacao: `node .claude/hooks/block-jargon-pt-br.js < diagnostico.md` retorna 0. |
| 3 | **Reportar um bug** | Roldao recebe "quer que eu investigue?" | Completa sozinho | Rodar `/bug` descrevendo sintoma em 1 frase. Investigador roda automatico, le estado real (banco/log/payload), agente entrega "causa raiz: X, vou corrigir em Y" sem perguntar permissao. Verificacao: nenhuma mensagem do agente contem padrao "quer que eu", "posso fazer", "devo continuar" (hook `block-confirmation-questions.js`). |
| 4 | **Pedir feature pequena** | Pipeline para no meio pedindo decisao | Completa sozinho | Rodar `/feature "adicionar exportacao CSV no relatorio financeiro"`. Pipeline completo executa (Sofia -> Detetive -> Rafael -> Bruno -> Ines -> 3 auditores) sem nenhuma etapa devolver pergunta evitavel. Verificacao: marker `feature-active-*` percorre as 7 etapas sem `_blocked` ate auditor ultimo. |
| 5 | **Fechar release** | CHANGELOG tem "refactor", "lint", "build" | Completa sozinho | Rodar `/release`, Roldao le CHANGELOG.md gerado e entende 100% do conteudo sem ajuda. Verificacao: bullets em linguagem de impacto pro cliente (J19); `node .claude/hooks/block-jargon-pt-br.js < CHANGELOG.md` retorna 0 na secao da release nova. |

**Metricas secundarias (sinal de saude, nao gate de release):**

| Metrica | Atual | Meta | Como medir |
|---|---|---|---|
| Taxa de bypass de auditor via `touch` | 100% sucesso | 0% | Teste adversarial `tests/hooks/require-auditors-pass.test.js`. |
| Jargoes em `devops-infra.md` | 32+ | 0 | `node .claude/hooks/block-jargon-pt-br.js < .claude/agents/devops-infra.md`. |
| Placeholders `_(preencher)_` em template core sem botao de ajuda | 15+ | 0 | `grep -rn '_(preencher)_' .specify/templates/` cruzado com `templates/*-helper.md` (cada placeholder tem helper irmao). |
| Comando publico sem orquestrador | 3 (`/prd`, `/brownfield`, `/auditoria-reversa`) | 0 | Cada comando longo chama Maestro modo PRD/BROWNFIELD/AR. ADR-019. |
| Pergunta evitavel devolvida por agente | analista (3), devops-infra (2), dba-dados (2) | 0 | Eval `evals/agent-behavior/no-evitable-questions.eval`. |

---

## 7. Riscos e mitigacao

> Riscos consolidados: 4 bloqueadores do PLANO-AUDITADO (auditor 10 — aderencia ao framework, auditor 9 — risco oculto, auditor 8 — impacto leigo, auditor 2+7 — esforco/realismo) + 4 riscos altos do auditor 9.

| # | Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|---|
| R1 | **Plano viola as proprias regras** (INV-003 zero non-goals, INV-004 commits T-NNN sem mapeamento, INV-AGENT-006 plano original tinha 4 perguntas pendentes pro Roldao) | Confirmada (ja aconteceu no plano v1) | Alta — hooks bloqueariam o proprio commit do framework | US-111 inclui mapeamento B/A/C/D/E/F/G/H/I/J -> T-NNN, este PRD tem secao 5 (non-goals) com 12 itens, decisoes obrigatorias do Roldao foram pre-decididas (cabecalho do PRD). |
| R2 | **Breaking change quebra projetos terceiros** que dependem do bypass `touch` ou do shape de marker | Alta | Alta — clientes pagos param de versionar | Release marcada como `v2.0.0` (major bump honesto), `MIGRATION-v2.md` em `docs/migrations/`, flag `ROLDAO_METHOD_LEGACY_MARKERS=1` valida por 1 release (US-111 AC-111-4). |
| R3 | **Ordem invertida vs valor pro leigo** (Sprint 1 alto impacto, Sprints 2-3-4 polimento invisivel, Sprint 5 alto impacto -> 5 semanas de "nada visivel") | Alta (auditor 8) | Media — Roldao perde confianca no meio | Sprint 1 ja move 9 acoes de alto impacto leigo do final pro inicio (J12, J16, J19, J1, J2, I7, G7, F1, J10 — ver US-111 AC-111-6). |
| R4 | **Sprint 2 era epico disfarcado de sprint** (D1-D3 sozinhos somam 9-12 dias, sobravam 0 dias pras outras 12 acoes) | Confirmada | Alta — sprint termina sem entregar | Sprint 2 quebrado em **2A (US-112 — autonomia)** e **2B (US-113 — orquestracao Maestro)**, 1.5 e 2 semanas. |
| R5 | **`/o-que-aconteceu` e `npx roldao-method status` viram surface area nova nao testada** | Media | Media | Cada comando novo em US-116 entra com 2 testes (golden path + caso adversarial) e atualizacao no `/help`. |
| R6 | **`npx roldao-method undo` pode revert errado** se Roldao usar depois de commit manual | Media | Alta — perde trabalho | `undo` so opera em commits com autor `Claude` (filtro `git log --author=Claude`). NAO usa `--hard`. Confirma antes (excecao a INV-AGENT-006 — destrutivo, SEC-002). |
| R7 | **Reescrita de `devops-infra.md` e `dba-dados.md` em PT-BR pode mudar comportamento dos agentes** alem da linguagem | Media | Media | Eval comportamental em `evals/agent-behavior/` mede taxa de "pergunta evitavel" antes/depois (US-114 AC-114-4). Comportamento muda so na direcao desejada. |
| R8 | **10 semanas e otimista** se Sprint 2B (Maestro multi-modo) atrasar — atrasa todos os paralelos (3-4-5) | Media | Alta | Buffer de 1 semana ja contratado (auditor 7). Sprint 2B tem AC-113-1 (ADR-019 escrito ANTES de codar) — sem ADR aprovado, dev nao comeca. |

---

## 8. Regulamentacao BR aplicavel

> Nenhuma regra do `REGRAS-INEGOCIAVEIS.md` precisa ser criada ou modificada nesta release. Todas as melhorias **fortalecem o cumprimento mecanico** de regras que ja existem.

**Regras INV (invariantes gerais):**

- **INV-001** — Documento e estado compartilhado. Este PRD e ADR-019 (Maestro multi-modo) sao o estado canonico — nao decisao em conversa.
- **INV-002** — Spec gera codigo. US-111..US-116 geram o codigo; o codigo nao gera as US.
- **INV-003** — Non-goals explicitos. Secao 5 lista 12 itens. Plano original violava com 0 itens.
- **INV-004** — IDs rastreaveis. PRD-003 -> EP-002 -> US-111..US-116 -> AC-NNN-N -> T-NNN -> commit. US-111 inclui mapeamento B/A/C/.../J -> T-NNN pra commit-message-validator nao bloquear.
- **INV-005** — Conciso vence completo. AGENTS.md ≤ 200 linhas, CLAUDE.md ≤ 150 linhas. US-116 valida.
- **INV-006** — Causa raiz, nunca sintoma. Sprint 1 nao mascara bypass — fecha no ponto raiz (marker exige `audit_sha`).

**Regras INV-AGENT (regras pra agentes IA):**

- **INV-AGENT-001** — Sem jargao com usuario nao-tecnico. US-114 (sincronizar regex jargao) + US-112 (reescrever `analista`/`devops-infra`/`dba-dados` em PT-BR).
- **INV-AGENT-003** — Pro-atividade, nao permissao. US-112 (3 agentes deixam de devolver pergunta evitavel).
- **INV-AGENT-004** — Verificar antes de afirmar. US-111 (fechar bypass `touch` — aprovacao exige `audit_sha` real, nao arquivo vazio).
- **INV-AGENT-006** — Executar, nao passar pro usuario. US-112 (`analista.md` deixa de devolver "perguntas pro PM"). Este PRD ja aplica — as 4 decisoes do Roldao foram pre-decididas no cabecalho.

**Regras TST (testes):**

- **TST-001** — Nunca mascarar teste que falha. US-111 AC-111-2 adiciona `xdescribe` aos patterns bloqueados do `anti-mascaramento.js`.
- **TST-002** — Teste falhou = problema no sistema. Cada hook editado em US-111/113/114 ganha 2 testes adversariais (passa + bloqueia) no mesmo commit.

**Regras LGPD (proteção de dados):**

- **LGPD-009** — DPO + canal do titular. US-114 (reescrever agentes tecnicos em PT-BR) cruza com LGPD-009 porque mensagens internas viram externas (release notes que titular le, mensagens de erro de producao). Mensagem clara pro titular comeca em mensagem clara pro dev.

**Regras SEC (seguranca):**

- **SEC-002** — Nunca executar destrutivo sem confirmacao. US-116 AC-116-3 — `npx roldao-method undo` NAO usa `git reset --hard`, usa `git revert`, confirma antes de aplicar.
- **SEC-005** — URLs/hosts de servico externo via variavel de ambiente. Possivel impacto em hook E5 do Sprint 3 (auto-sugestao de addon) se algum addon expor URL hardcoded. Auditar.

**Fora de escopo (citado explicitamente):**

- **FISCAL-001 a FISCAL-010** — nenhum sprint toca regra fiscal. Vive nos addons.
- **PIX-001 a PIX-005** — nenhum sprint toca Pix. Vive no addon `fintech-br`.
- **Split payment (FISCAL-010 / Reforma Tributaria pos-2027)** — non-goal #8.

---

## 9. Historico de mudancas

| Data | Versao | Autor | Mudanca |
|---|---|---|---|
| 2026-05-24 | 1 | gerente-produto (Sofia) | Criacao a partir do brief `docs/research/auditoria-10-de-10.md` + `docs/auditorias/2026-05-24-auditoria-10-agentes/PLANO-AUDITADO.md`. 4 decisoes do Roldao pre-incorporadas no cabecalho (v2.0.0 / sem rename / metrica 5 tarefas / dogfood). |

---

## 10. Menu de adaptacao por dominio

> Aplicavel: **10.D — CLI / Biblioteca / Framework**. ROLDAO-METHOD e framework distribuido como CLI Node (`npx roldao-method ...`) + diretorio `.claude/` portado pro projeto do usuario.

### 10.D — CLI / Biblioteca / Framework

- **Plataformas suportadas:** Windows / macOS / Linux. Resolvido pelo PRD-001 (windows-sem-bash). Hooks Node, skills Python embutido — sem bash em rota critica.
- **Versao de runtime minima:** Node 18+ (ja documentado em `package.json`). Python 3.8+ pras skills (ADR-018).
- **Instalacao:** `npx roldao-method install` em projeto novo / `npx roldao-method update` em projeto existente. Sem `npm install -g` (decisao firmada — evita conflito com outras CLIs).
- **Breaking changes:** politica semver formal em ADR-016. v2.0.0 e major bump honesto — fecha bypass `touch`, muda contrato de marker, mas mantem janela de compatibilidade via `ROLDAO_METHOD_LEGACY_MARKERS=1` por 1 release.
- **Deprecation:** flag `LEGACY_MARKERS` valida por 1 release (v2.1.0). Aviso no `MIGRATION-v2.md` + no statusline quando flag esta ativa.
- **API estavel vs experimental:** `_lib.js` versionado (ADR-017). Comandos `/o-que-aconteceu`, `npx roldao-method status`, `npx roldao-method undo` (US-116) entram como **stable** desde v2.0.0 — passaram por eval comportamental antes do release.
