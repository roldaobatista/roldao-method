---
tipo: brief
data: 2026-05-24
owner: analista
revisado-em: 2026-05-24
status: stable
escopo: melhoria interna do framework ROLDAO-METHOD (dogfood — usar o próprio método pra planejar a evolução dele)
fontes: docs/auditorias/2026-05-24-auditoria-10-agentes/ (10 relatórios + RESUMO-EXECUTIVO + PLANO-AUDITADO)
---

# Brief — Auditoria 10 de 10

> Brief interno do produto ROLDAO-METHOD a partir da auditoria de 10 lentes realizada em 2026-05-24. **Não é pesquisa de mercado externa** — é consolidação da auditoria que o próprio framework fez sobre si mesmo, pra alimentar o PRD da v2.0.0.

---

## 1. Problema

O framework hoje funciona muito bem **pra quem já é da área de programação**. Mas a promessa central do produto é outra: servir o Roldão — **dono de produto que não programa** — pra ele tocar projeto sério com ajuda de assistente de IA sem depender de tradução humana intermediária. Os 10 auditores convergiram em um diagnóstico desconfortável: o framework **prega doutrina mais forte do que cumpre nas próprias entranhas**. Os textos voltados pra "vitrine" (README inicial, agente que escreve em PT-BR claro, skill de tradução de jargão) são exemplares. Mas as camadas internas (agentes técnicos, mensagens de erro de hook, templates a preencher, comandos de comando longo como `/prd` e `/brownfield`) tratam o usuário leigo como caso especial, não como contrato do produto. O resultado prático: o Roldão atinge ~60% das tarefas sozinho, mas trava nos 40% restantes em pontos onde o framework **sabia a resposta e não a entregou** — placeholder `_(preencher)_` sem ajuda, agente que devolve "perguntas pra você", bypass de auditor ensinado na mensagem de erro do próprio hook.

---

## 2. Estado atual quantificado

**Nota agregada: 6.95 / 10** (10 auditores independentes, cada um com uma lente).

| # | Lente | Nota | Lacuna principal |
|---|---|---|---|
| 1 | UX Terminal | 7.5 | Falta TL;DR nos agentes; statusline não respeita `NO_COLOR` |
| 2 | Onboarding pra leigo | 7.5 | Frase de abertura do README ainda fala "pra dev" |
| 3 | Autonomia dos agentes | 8.0 | 3 agentes (analista, devops-infra, dba-dados) ainda jogam decisão pro usuário |
| 4 | Workflows longos | 6.0 | `/prd`, `/brownfield`, `/auditoria-reversa` rodam sem orquestrador |
| 5 | Auto-preenchimento | 5.0 | 15+ placeholders sem botão de ajuda; sem helper único pra próximo ID |
| 6 | Mensagens de erro | 7.5 | Jargão escapa (frontmatter, PATH); markers órfãos travam sessão nova |
| 7 | Coerência PT-BR | 6.5 | `devops-infra.md` tem 32+ jargões; 15 de 17 agentes sem acento no frontmatter |
| 8 | Descoberta / navegação | 8.0 | Skills e addons quase invisíveis no `/help` |
| 9 | Verificação e confiança | 7.0 | 3 bypasses (touch/echo) ensinados na própria mensagem de stderr dos hooks |
| 10 | Docs pra leigo | 7.5 | PARA-DONO-DE-PRODUTO é doc órfã; CHANGELOG técnico demais |

**Maiores buracos (nota ≤ 6.5):** auto-preenchimento, workflows longos, coerência PT-BR.
**Pontos mais fortes (nota ≥ 8.0):** autonomia individual de agentes, descoberta via `/help`.

---

## 3. Padrão recorrente — doutrina mais forte que prática

Os 10 auditores convergiram sem combinar prévia: o framework cobra de fora o que não cumpre dentro. Cinco exemplos literais retirados dos relatórios:

1. **Coerência PT-BR (auditor 7):** o agente `devops-infra.md` usa "deploy" 11 vezes, "rollback" 7 vezes, "migration" 3 vezes, "build/lint/CI" sem tradução — **32+ termos em inglês no mesmo arquivo**. No mesmo repo, o hook `block-jargon-pt-br.js` bloqueia o usuário se ele escreve "commit" — mas não bloqueia o próprio agente interno.

2. **Verificação (auditor 9):** o hook `require-auditors-pass-before-commit.js` **ensina o bypass na própria mensagem de stderr** (linha 108-111): basta `touch` em 3 arquivos pra "aprovar" sem nenhum auditor ter rodado. O mesmo padrão se repete em `require-checkpoint-before-merge.js` (linha 54) e `require-investigador-before-fix.js` GATE 2 (linha 68). Marker vazio passa como aprovação válida.

3. **Anti-mascaramento (auditor 9):** a regra TST-001 lista `xdescribe` como anti-padrão proibido. O hook `anti-mascaramento.js` tem `xit`, `fit`, `fdescribe` no array de patterns — **falta literalmente `xdescribe`**. `xdescribe('financeiro', () => { ...200 testes... })` passa direto.

4. **Autonomia (auditor 3 + 7):** o agente `analista.md` tem como saída obrigatória "1-3 perguntas pendentes pro PM responder" — viola INV-AGENT-006 ("executar não passar pro usuário") no próprio contrato do agente. Mesmo padrão em `dba-dados.md` ("Pergunta padrão de X") e `devops-infra.md`.

5. **Auto-preenchimento (auditor 5):** o framework já tem `/brownfield` que varre `package.json` e detecta stack. Mas `/inicio` Etapa 4 manda o Roldão preencher manualmente os campos `_(preencher)_` em AGENTS.md — sem chamar a varredura que já existe três comandos ao lado.

**O denominador comum:** as 4 brechas exigem ajuste pontual em ~15 arquivos. Nenhuma exige reescrita arquitetural. Mas, somadas, são o que separa o framework de cumprir a promessa.

---

## 4. Concorrência — não é outro framework, é a alternativa

O ROLDAO-METHOD não compete com outros frameworks agentic por nome — compete com **as duas alternativas que o dono de produto leigo BR considera quando pensa em fazer software com IA**.

**Alternativa A — não usar framework nenhum (Claude/ChatGPT puro).** Funciona pra perguntar, brainstormar, gerar um trecho de código solto. Falha pro Roldão quando o projeto vira sério: não tem memória de decisões (cada sessão começa do zero), não tem bloqueio mecânico contra deletar dado, não tem trilha de quem decidiu o quê, não traduz jargão automaticamente. Roldão até consegue fazer 1 demo, mas o segundo projeto repete os mesmos erros. **Sem contrato versionado, o assistente reinventa diferente toda vez** — exatamente o problema que INV-001 nomeia.

**Alternativa B — plataforma SaaS de bot pronto (n8n + GPT custom, Make + assistente, Zapier AI, etc.).** Funciona pra fluxo simples: "quando chegar email X, salva no Sheets". Falha pro Roldão BR quando precisa de regra fiscal (NF-e, certificado A1 por tenant, contingência SVC/EPEC), Pix (idempotência por TxId, webhook com HMAC), LGPD (base legal por coleta, RIPD pra dado sensível) — nada disso vem pronto. O Roldão precisaria contratar dev pra integrar cada peça, e o dev acaba fazendo o que faria sem o SaaS. **Bot pronto não tem doutrina BR codificada em hook bloqueador** — é a única coisa que esse framework entrega que ninguém mais entrega no mercado.

**Conclusão competitiva:** se o ROLDAO-METHOD não fechar o gap entre doutrina e prática (item 3 acima), ele perde a vantagem real. Vira "documentação bonita" que o dev culto admira e o Roldão não consegue usar sem chamar dev. Cai pra empate técnico com a alternativa A.

---

## 5. Regulamentação aplicável

As melhorias propostas tocam zonas regulatórias indiretamente — não por mudança de comportamento legal, mas por **reforçar mecanismos que já protegem essas zonas**.

| Sprint / frente | Regras tocadas | Como toca |
|---|---|---|
| Sprint 1 — fechar bypass de auditor (P0 #4, #5, #6) | INV-AGENT-004 (verificar antes de afirmar), TST-001 (anti-mascaramento), TST-002 (teste falhou = problema) | Hoje os bypasses (`touch` + `xdescribe`) permitem aprovar sem evidência. Fechar isso é cumprir mecanicamente o que INV-AGENT-004 já promete. |
| Sprint 2 — reescrever agentes técnicos PT-BR (P0 #8) | INV-AGENT-001 (sem jargão), LGPD-009 (canal do titular precisa ser claro) | Coerência PT-BR cruza com LGPD-009 porque mensagens internas viram externas (release notes, erros de produção que o titular vê). |
| Sprint 2 — sincronizar regex do hook com tabela `traduzir-jargao` | INV-AGENT-001 | Hoje hook bloqueia parcial — `mock`, `migration`, `backend`, `cache`, `webhook`, `token`, `API`, `payload`, `stack trace` ficam de fora. |
| Sprint 3 — auto-preenchimento (P1) | INV-002 (spec gera código), INV-004 (IDs rastreáveis) | Helper único `next-id.js` reduz a chance de US duplicada / ADR sem número correto — protege rastreabilidade. |
| Sprint 4 — Maestro pra `/prd`, `/brownfield`, `/auditoria-reversa` | INV-AGENT-003 (pró-atividade), INV-AGENT-006 (executar não passar) | Workflows longos sem orquestrador hoje devolvem decisão pro usuário no meio do caminho. |
| Transversal — `lgpd-base-legal-reminder` continua soft | LGPD-001 a LGPD-010 | Não é alterado nesta release; mantido como soft warning intencional. |
| Transversal — `no-log-pix-key` continua bloqueador | PIX-004 + LGPD-001/004 | Não é alterado nesta release; já está fail-closed. |
| Fora de escopo | FISCAL-001 a FISCAL-010, trabalhista/eSocial, split payment | Nenhuma melhoria desta v2.0.0 toca regra fiscal/trabalhista — essas vivem no addon `fiscal-br-completo` e não fazem parte do core. |

**Nenhuma regra precisa ser criada ou modificada.** Todas as melhorias **fortalecem o cumprimento mecânico** de regras que já existem.

---

## 6. Métrica de sucesso (decisão 3 do Roldão)

A métrica antiga "10/10 dos auditores" foi **descartada** — vira teatro de número. A métrica nova é **5 tarefas-tipo concretas que o Roldão consegue fazer sozinho ao final**, sem chamar dev, sem traduzir mensagem de erro, sem decidir qual ID vem a seguir.

| # | Tarefa-tipo | Como medir |
|---|---|---|
| 1 | Iniciar projeto novo do zero | Rodar `/inicio`, preencher 4 perguntas em PT-BR claro, terminar com AGENTS.md preenchido (sem `_(preencher)_` restante) e 1 story de exemplo em `docs/stories/`. Sem chamar dev. |
| 2 | Adotar repo legado | Rodar `/brownfield` em projeto existente, terminar com diagnóstico em 1 página, 3 riscos listados em PT-BR, e plano de adoção sem jargão técnico não-traduzido. |
| 3 | Reportar um bug | Rodar `/bug` descrevendo o sintoma em 1 frase. O investigador roda automático, lê estado real (banco/log/payload), e o agente entrega "causa raiz: X, vou corrigir em Y" — sem perguntar "quer que eu investigue?". |
| 4 | Pedir uma feature pequena | Rodar `/feature "adicionar exportação CSV no relatório financeiro"`. Pipeline completo executa (Sofia → Detetive → Rafael → Bruno → Inês → 3 auditores) sem nenhuma etapa devolver pergunta evitável. |
| 5 | Fechar uma release | Rodar `/release`, ler CHANGELOG.md gerado e entender 100% do conteúdo sem ajuda — bullets em linguagem de impacto pro cliente, não em jargão técnico. |

**Como verificar:** as 5 tarefas viram cenários de aceitação do épico EP-001-v2.0.0. Cada tarefa tem AC binário (passou / não passou) baseado em "o Roldão completou sozinho?" e "alguma mensagem do agente forçou tradução humana?".

---

## 7. Risco principal

**Se a v2.0.0 NÃO acontecer:** o framework continua útil pra dev experiente — `audit_sha` real, hooks bloqueadores sérios, REGRA #0 codificada — mas **falha na promessa central de servir o dono de produto que não programa**. O Roldão, na prática, continuará dependendo de dev humano pra:

- Traduzir mensagens internas dos agentes técnicos.
- Bypassar hooks que ensinam o próprio bypass (vira convite a corrigir errado).
- Decidir qual ID usar quando o template diz "preencher".
- Orquestrar workflows longos (`/prd`, `/brownfield`) que hoje rodam soltos.

**Consequência competitiva:** o diferencial real do produto — "framework agentic em PT-BR pro dono de produto BR não-programador" — vira marketing sem lastro. Cai pra empate com a Alternativa A (Claude/ChatGPT puro) porque o usuário-alvo não consegue extrair o valor. A Alternativa B (n8n / Make) continua não atendendo, mas isso deixa de ser vantagem nossa — vira só lacuna do mercado que ninguém preenche.

**Consequência interna:** mantém o débito de "doutrina forte / prática frouxa" como característica do produto, em vez de tratar como bug. Próximas auditorias vão repetir os mesmos achados — porque os achados estão codificados nas mensagens de erro dos próprios hooks.

---

## Perguntas pendentes pra confirmar com investigador / código (não pro usuário)

> Estas premissas o PM (`gerente-produto`) deve confirmar lendo código ou rodando hook — não escalar pro Roldão a menos que afete comportamento observável. Padrão INV-AGENT-006.

1. **Premissa:** o hook `block-jargon-pt-br.js` realmente só lê regex no array da linha 8-26 (sem fallback pra tabela canônica)? Confirmar lendo o arquivo antes do PRD definir Sprint 2.
2. **Premissa:** os 3 markers de auditor (`auditor-{seg,qual,prod}-pass-$SESS`) hoje aceitam arquivo vazio sem `audit_sha`? Confirmar reproduzindo o cenário do auditor 9 (`touch` direto + `git commit`) em sandbox antes de definir AC do Sprint 1.
3. **Premissa:** existe algum cenário em que mudar `analista.md` (remover "perguntas pendentes pro PM") quebra workflow que dependa dessa seção? Confirmar com grep em `.claude/commands/` por referências literais à seção "perguntas pendentes".

---

_Próximo passo: PM (Sofia / `gerente-produto`) usa este brief como input do `/prd` pra gerar `docs/prd/PRD-001-v2.0.0-auditoria-10-de-10.md` com user stories testáveis cobrindo as 5 tarefas-tipo da seção 6._
