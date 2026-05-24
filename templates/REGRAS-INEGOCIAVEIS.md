# REGRAS INEGOCIÁVEIS

> Regras com IDs rastreáveis. Cada ID é citável em código, ADR, commit e PR.
>
> **Convenção:** `INV-NNN` (invariantes gerais), `SEC-NNN` (segurança), `TST-NNN` (testes), `LGPD-NNN` (proteção de dados BR), `FISCAL-NNN` (fiscal BR), `PIX-NNN` (Pix/Open Finance — addon `fintech-br` traz hooks/agentes), `INV-AGENT-NNN` (regras pra agentes IA).
>
> **Relação com `.specify/memory/constitution.md`:** a constituição é o **manifesto** que explica o "por quê" de cada princípio (em prosa, didático). Este arquivo é a **operacional** com IDs pra usar em commits/PRs/comentários. Citar `INV-001` é melhor do que escrever "respeitar o princípio de que doc é estado compartilhado".

---

## INV — Invariantes gerais

### INV-001 — Documento é estado compartilhado
Decisões precisam estar em doc versionado. Memória de conversa não conta.

### INV-002 — Spec gera código
A especificação é a verdade. Código é derivado. Discrepância = corrigir o código pra alinhar com a spec, ou atualizar a spec se o código revelou problema na decisão.

### INV-003 — Non-goals explícitos
Toda spec/ADR declara o que NÃO está no escopo. Sem isso, o agente expande indefinidamente.

### INV-004 — IDs rastreáveis
`US-NNN` (user story) → `AC-NNN-N` (acceptance criteria) → `T-NNN` (task) → commit. Hook `paths-frontmatter-validator` verifica.

### INV-005 — Conciso vence completo
AGENTS.md ≤ 200 linhas. CLAUDE.md ≤ 150 linhas. Hook `context-budget` avisa.

### INV-006 — Causa raiz, nunca sintoma
Bug em comportamento de produto = primeiro investigar dados reais (banco, log, payload). Mudar template/UI sem investigar é proibido. Workflow `/bug` codifica isso.

---

## SEC — Segurança

### SEC-001 — Nunca commitar secrets
`.env`, chaves privadas, tokens, credenciais. Hook `secrets-scanner` bloqueia escrita.

### SEC-002 — Nunca executar destrutivo sem confirmação
`rm -rf`, `git push --force`, `git reset --hard`, `drop table`, `truncate`, migration destrutiva. Hook `block-destructive` bloqueia.

### SEC-003 — Sempre validar entrada externa
User input, API externa, payload. Nunca confiar.

### SEC-004 — Princípio do menor privilégio
Permissões mínimas necessárias. Roles segregados.

### SEC-005 — URLs/hosts de serviço externo via variável de ambiente
URLs de SEFAZ, Pix Bacen, gateways de pagamento, APIs pagas e webservices sensíveis vêm de variável de ambiente, nunca hardcoded em código. Permite trocar homologação ↔ produção sem deploy, evita chamar produção em teste, deixa dependência visível pro operador. Hook `no-hardcoded-env-urls` bloqueia.

---

## TST — Testes

### TST-001 — Nunca mascarar teste que falha
Proibido em código de teste/CI: `skip`, `xit`, `xdescribe`, `assertTrue(true)`, `@ts-ignore` sobre teste, `eslint-disable` sobre teste, regra desligada pra esconder erro, baseline pra esconder erro, `|| true` em comando de teste. Hook `anti-mascaramento` bloqueia. Flags como `--quiet`/`--silent` só são bloqueadas se silenciarem o resultado do teste em si — silenciar output de instalador/build não é mascaramento.

### TST-002 — Teste falhou = problema no sistema
Corrigir código. Não relaxar assertiva. Não comentar teste.

### TST-003 — Não testar com mock o que vai pra produção real
Integrações críticas (banco, fiscal, pagamento) testar em ambiente que reproduz produção. Mock só pra testes unitários.

### TST-004 — Dados de teste sintéticos
Fixtures, seeds e dados de teste usam valores sintéticos — nunca CPF/CNPJ/email/telefone de cliente real. Dado real em fixture vaza pra repo, CI, ambiente dev e logs de teste. Use domínios reservados (`example.com`, `test.local`, `exemplo.com.br`), CPFs com padrão de teste (`12345678909`), telefones (11) 99999-9999. Hook `no-test-data-in-fixtures` bloqueia.

---

## LGPD — Proteção de dados (Brasil)

### LGPD-001 — Dado pessoal exige base legal documentada
CPF, RG, endereço, telefone, e-mail, dados financeiros. Cada coleta precisa de base legal (consentimento, contrato, obrigação legal, etc.).

### LGPD-002 — Direito ao esquecimento
Sistema precisa permitir exclusão efetiva de dados pessoais. Crypto-shredding ou exclusão física.

### LGPD-003 — Minimização
Coletar só o necessário. Não pedir CPF se não precisa de CPF.

### LGPD-004 — Trilha de auditoria
Acessos a dados pessoais sensíveis (saúde, financeiro) ficam logados. Imutável.

### LGPD-005 — Transferência internacional
Dado pessoal de brasileiro saindo do Brasil exige base legal específica + DPA com fornecedor.

### LGPD-006 — Incidente de segurança = notificar ANPD
Vazamento ou comprometimento de dado pessoal exige comunicação à ANPD e aos titulares em **prazo razoável** (entendimento atual: até 72h após ciência). Não é "se", é "quando" — o plano de resposta deve existir antes do incidente.

### LGPD-007 — Base legal explícita (Art. 7º / Art. 11)
Toda coleta de dado pessoal precisa apontar 1 das 10 bases legais do art. 7 (dados gerais) ou art. 11 (sensíveis). Skill `checklist-lgpd` tem árvore de decisão. Citar a base no momento da decisão de produto, não na auditoria.

### LGPD-008 — RIPD para tratamento de alto risco
Relatório de Impacto à Proteção de Dados é obrigatório para: dado sensível em larga escala, decisão automatizada com efeito jurídico, monitoramento sistemático, transferência internacional. Documentar antes de ligar o tratamento.

### LGPD-009 — DPO + canal do titular
Encarregado (DPO) nomeado e canal funcional pro titular exercer direitos (acesso, correção, exclusão, portabilidade, revogação). Endereço de e-mail no rodapé do site + SLA de resposta declarado.

### LGPD-010 — Decisão automatizada (Art. 20)
Sistema que toma decisão automatizada afetando o titular (crédito, contratação, preço dinâmico) precisa: (a) informar o titular, (b) permitir revisão humana sob pedido, (c) explicar critérios. Documentar no ADR da feature.

---

## FISCAL — Regras fiscais e tributárias BR

### FISCAL-001 — NF-e/NFS-e imutável após emissão
XML emitido e autorizado pela SEFAZ não pode ser alterado. Correção exige Carta de Correção Eletrônica (CC-e, limites de uso) ou cancelamento dentro do prazo legal. Nunca editar o XML armazenado.

### FISCAL-002 — Certificado digital A1/A3 por tenant
Multi-tenant que emite NF-e armazena 1 certificado por CNPJ emissor, criptografado em repouso. Nunca compartilhar certificado entre clientes. Nunca commitar `.pfx`/`.p12`. Senha em cofre, não em variável de ambiente em texto puro.

### FISCAL-003 — Ambiente de homologação obrigatório
Toda integração fiscal (NF-e, NFS-e, eSocial, REINF) começa em ambiente de homologação da SEFAZ/RFB. Subir pra produção exige checklist explícito (CNPJ certo, ambiente=1, certificado de produção, série configurada).

### FISCAL-004 — Contingência prevista
SEFAZ cai. Operação não pode parar. Implementar pelo menos um modo de contingência. Padrão moderno: **SVC** (SVC-AN para a maioria das UFs, SVC-RS para AM/PR/RS) e **EPEC** (Evento Prévio de Emissão em Contingência, mod. 55). FS-DA está em desuso desde 2023 (Manual NF-e 7.00) — não desenhar feature nova em cima dele. Documentar a estratégia no ADR. Testar trimestralmente.

### FISCAL-005 — CNPJ alfanumérico (vigor jul/2026)
Toda persistência, validação, regex, índice e integração que toca CNPJ precisa aceitar `[0-9A-Z]{14}` a partir de 2026-07. Skill `validar-cpf-cnpj` já suporta. Auditar coluna do banco (`VARCHAR(14)`, não `BIGINT`).

### FISCAL-006 — Reforma Tributária (LC 214/2025)
Período de transição 2026-2033 exige cálculo paralelo de ICMS/ISS/PIS/COFINS (regime atual) e CBS/IBS/IS (regime novo). ADR da feature tributária declara qual período cobre. Split payment pode entrar em vigor antes do regime pleno.

### FISCAL-007 — Obrigação acessória mensal
Cliente PJ tem obrigação acessória mensal (SPED Fiscal, SPED Contribuições, ECF, ECD, eSocial S-1000 a S-3000, REINF). Feature que gera dado fiscal precisa pensar no formato de exportação esperado pelo contador antes de modelar a tabela.

### FISCAL-008 — NFS-e padrão nacional (LC 116/2003 + LC 214/2025)
Emissão de NFS-e adere ao padrão nacional unificado (ABRASF/RFB) progressivamente vigente desde 2023. Município com padrão próprio (Ginfes, Tinus, IPM, DSF, etc.) continua válido na transição, mas feature nova deve modelar pelo padrão nacional como alvo. Persistir o município emissor e a versão do schema explicitamente — não assumir um único padrão.

### FISCAL-009 — MDF-e e CT-e para transporte
Operação de transportadora, operador logístico, marketplace com entrega própria ou e-commerce com frota emite CT-e (modelo 57) e/ou MDF-e (modelo 58). MDF-e é obrigatório para qualquer carga que cruza fronteira de UF com mais de uma NF-e no veículo. Tratar como cidadão de primeira classe — não como caso especial de NF-e modelo 55.

### FISCAL-010 — Split payment (Reforma Tributária)
Split payment (recolhimento do CBS/IBS direto pelo adquirente/PSP no momento do pagamento) entra em vigor em fases a partir de 2027 conforme regulamentação da LC 214/2025. Feature que integra Pix/cartão/boleto deve **prever ponto de extensão para split**, mesmo antes de obrigatório. Hardcoded "valor cheio entra na conta" vai virar débito técnico fiscal grande.

---

## PIX — Pagamentos Pix e Open Finance Brasil

> **IDs canônicos**, citáveis em qualquer ADR/PR mesmo sem o addon instalado. A implementação operacional (hooks, agentes, skills, fluxos detalhados) vive no addon `fintech-br` — instale com `npx roldao-method add fintech-br` quando o projeto integrar Pix.

### PIX-001 — Idempotência por TxId em criação de cobrança
TxId determinístico (hash do pedido) + Idempotency-Key + lock distribuído + UNIQUE no banco. Combinar camadas — é a única defesa contra dupla cobrança/devolução. Detalhes operacionais no agente `pix-arch` do addon `fintech-br`.

### PIX-002 — Webhook valida assinatura na primeira linha do handler
HMAC + IP de origem validados ANTES de qualquer lógica de negócio. Falha → 401 imediato. Hook `validate-webhook-signature.js` (addon) bloqueia handler que pula validação.

### PIX-003 — EndToEndId persistido em coluna indexada
Pivô único de conciliação financeira (extrato bancário ↔ pedido). Matching por nome+valor é proibido. Coluna indexada, idealmente UNIQUE.

### PIX-004 — Chave Pix é dado pessoal (LGPD-001 + LGPD-004)
Logs não podem vazar chave Pix completa em texto puro. Mascarar (`***@***`, `***.***.***-99`). Acesso a chaves logado e auditado.

### PIX-005 — URL do PSP/Bacen via env (SEC-005)
`BACEN_BASE_URL`, `PSP_BASE_URL` vêm de variável de ambiente — sandbox ↔ produção sem deploy. Hardcoded chamando produção em teste é incidente. Hook `no-hardcoded-env-urls.js` bloqueia.

---

## INV-AGENT — Regras pra agentes IA

### INV-AGENT-001 — Sem jargão com usuário não-técnico
Traduzir termos técnicos. Tabela em `CLAUDE.md`.

### INV-AGENT-002 — Investigar antes de mexer em lógica
REGRA #0. Ler estado real antes de propor solução.

### INV-AGENT-003 — Pró-atividade, não permissão
Ao identificar gap/bug/débito: resolver. Não perguntar "quer que eu corrija?".

### INV-AGENT-004 — Verificar antes de afirmar
Nunca dizer "pronto" sem rodar verificação e mostrar resultado.

### INV-AGENT-005 — Confirmar apenas pra ações destrutivas
Confirmação obrigatória: dados de produção, drop table, rotação de credenciais, mudanças legais, gastos com terceiros, push --force, reset --hard, rm -rf.

### INV-AGENT-006 — Executar, não passar pro usuário
Tudo que o agente PODE fazer (tem a ferramenta, não é destrutivo, não custa dinheiro), o agente DEVE fazer sem perguntar. Empurrar tarefa executável pro usuário não-técnico quebra o fluxo. Exemplos: criar release no GitHub, abrir issue/PR, rodar testes, aplicar correção identificada em auditoria. Sinal de alerta: "quer que eu...?", "posso fazer X?" → PARE e execute. Confirmação só pras ações listadas em INV-AGENT-005 + npm publish + gastos.

---

## Mapa de cobertura (ID → onde é aplicado)

Nem toda regra tem hook bloqueador: algumas são **doutrinárias** (decisão de produto/legal), outras **vivem em addon** (operacional quando o projeto integrar), outras **rodam por workflow** (não há toque de ferramenta pra interceptar). Esta tabela deixa claro onde checar:

| ID | Codificado em hook? | Onde aplicar |
|---|---|---|
| INV-001 | não — doutrinário | Revisão de PR; agente `revisor` |
| INV-002 | parcial | `paths-frontmatter-validator.js`; `/feature` exige spec antes de dev |
| INV-003 | não — doutrinário | Templates de PRD/ADR pedem "Non-goals"; `auditor-produto` reprova spec sem |
| INV-004 | sim | `commit-message-validator.js`, `block-todo-without-issue.js`, `paths-frontmatter-validator.js` |
| INV-005 | sim | `context-budget.js` (warning) |
| INV-006 | sim | `require-investigador-before-fix.js`, `regra-zero-reminder.js` |
| SEC-001 | sim | `secrets-scanner.js`, `block-secrets-in-commit-message.js` |
| SEC-002 | sim | `block-destructive.js` |
| SEC-003 | não — doutrinário | `auditor-seguranca` cobre em revisão |
| SEC-004 | não — doutrinário | `auditor-seguranca` cobre em revisão |
| SEC-005 | sim | `no-hardcoded-env-urls.js` |
| TST-001 | sim | `anti-mascaramento.js`, `validar-self-masking.js` (lint do próprio repo) |
| TST-002 | não — doutrinário | `auditor-qualidade` em release |
| TST-003 | sim | `block-mock-in-integration.js` |
| TST-004 | sim | `no-test-data-in-fixtures.js` |
| LGPD-001 | parcial | `lgpd-base-legal-reminder.js` (soft warning); `auditor-seguranca` reprova |
| LGPD-002 | não — doutrinário | RIPD + ADR; addon `lgpd-compliance` traz checklist |
| LGPD-003 | não — doutrinário | `auditor-seguranca` + checklist `lgpd-privacy-review.md` |
| LGPD-004 | parcial | `no-log-pix-key.js`; skills `validar-cpf-cnpj/ie/chave-nfe/pix` trazem helper de mascaramento |
| LGPD-005 | não — doutrinário | ADR de integração + DPA assinado fora do código |
| LGPD-006 | não — operacional | Workflow `/incident-postmortem`; skill `responder-incidente-anpd` (addon `lgpd-compliance`) |
| LGPD-007 | sim (soft) | `lgpd-base-legal-reminder.js`; skill `checklist-lgpd` |
| LGPD-008 | não — doutrinário | Skill `gerar-ripd` (addon `lgpd-compliance`); `auditor-seguranca` |
| LGPD-009 | não — operacional | Skill `gerar-canal-dpo` (addon `lgpd-compliance`) |
| LGPD-010 | não — doutrinário | ADR obrigatório em feature com decisão automatizada |
| FISCAL-001 | não — doutrinário | `fiscal-br` reprova em revisão |
| FISCAL-002 | parcial | `secrets-scanner.js` pega `.pfx`/`.p12` |
| FISCAL-003 | sim | `fiscal-br-validator.js` (bloqueia `ambiente=1` hardcoded) |
| FISCAL-004 | não — doutrinário | ADR obrigatório (template `adr-contingencia-fiscal.md`) |
| FISCAL-005 | sim | Skill `validar-cpf-cnpj` aceita `[0-9A-Z]{14}`; `dba-dados` audita coluna |
| FISCAL-006 | não — doutrinário | `fiscal-br` orienta cálculo paralelo; ADR declara período coberto |
| FISCAL-007 | não — doutrinário | Checklist `obrigacao-acessoria-br.md` |
| FISCAL-008 | não — doutrinário | `fiscal-br` orienta padrão ABRASF/RFB nacional |
| FISCAL-009 | não — doutrinário | `fiscal-br` modela CT-e/MDF-e como cidadão 1ª classe |
| FISCAL-010 | não — doutrinário | ADR de integração Pix/cartão/boleto prevê extensão pra split |
| PIX-001 | não — no addon | Hook + agente `pix-arch` no addon `fintech-br` |
| PIX-002 | não — no addon | Hook `validate-webhook-signature.js` no addon `fintech-br` |
| PIX-003 | não — no addon | `dba-dados` audita; addon `fintech-br` traz modelo |
| PIX-004 | sim | `no-log-pix-key.js`; skill `validar-pix` traz helper de mascaramento |
| PIX-005 | sim | `no-hardcoded-env-urls.js` |
| INV-AGENT-001 | sim | `block-jargon-pt-br.js` (soft block) |
| INV-AGENT-002 | sim | `require-investigador-before-fix.js`, `regra-zero-reminder.js` |
| INV-AGENT-003 | não — doutrinário | Output style + treino dos agentes |
| INV-AGENT-004 | não — doutrinário | Output style; PR review verifica "comando + resultado" |
| INV-AGENT-005 | sim | `block-destructive.js` cobre o caso destrutivo; resto é doutrinário |
| INV-AGENT-006 | sim | `block-confirmation-questions.js` (soft block) |

**Legenda:** "sim" = hook bloqueia/avisa em runtime; "parcial" = parte coberta; "não — doutrinário" = depende de agente/revisor humano; "não — no addon" = vive no addon citado; "não — operacional" = workflow ou skill dedicada cobre.

---

## Como citar uma regra

Em ADR: `aderente a INV-002, SEC-001`
Em commit: `fix: ajusta validação CPF (LGPD-001)`
Em PR: `Verifica INV-AGENT-002 — investigador rodou antes`
Em código (comentário, só quando justificável): `// TST-001 — não usar skip aqui`

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
