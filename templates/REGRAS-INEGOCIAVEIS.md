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
Proibido: `skip`, `assertTrue(true)`, `@ts-ignore`, `eslint-disable`, regra desligada, baseline pra esconder erro, `|| true`, `--quiet`. Hook `anti-mascaramento` bloqueia.

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
SEFAZ cai. Operação não pode parar. Implementar pelo menos um modo de contingência (EPEC, FS-DA, SVC-AN, SVC-RS conforme UF). Documentar no ADR. Testar trimestralmente.

### FISCAL-005 — CNPJ alfanumérico (vigor jul/2026)
Toda persistência, validação, regex, índice e integração que toca CNPJ precisa aceitar `[0-9A-Z]{14}` a partir de 2026-07. Skill `validar-cpf-cnpj` já suporta. Auditar coluna do banco (`VARCHAR(14)`, não `BIGINT`).

### FISCAL-006 — Reforma Tributária (LC 214/2025)
Período de transição 2026-2033 exige cálculo paralelo de ICMS/ISS/PIS/COFINS (regime atual) e CBS/IBS/IS (regime novo). ADR da feature tributária declara qual período cobre. Split payment pode entrar em vigor antes do regime pleno.

### FISCAL-007 — Obrigação acessória mensal
Cliente PJ tem obrigação acessória mensal (SPED Fiscal, SPED Contribuições, ECF, ECD, eSocial S-1000 a S-3000, REINF). Feature que gera dado fiscal precisa pensar no formato de exportação esperado pelo contador antes de modelar a tabela.

---

## PIX — Pagamentos Pix e Open Finance Brasil

> **IDs canônicos**, citáveis em qualquer ADR/PR mesmo sem o addon instalado. A implementação operacional (hooks, agentes, skills, fluxos detalhados) vive no addon `fintech-br` — instale com `npx roldao-method add fintech-br` quando o projeto integrar Pix.

### PIX-001 — Idempotência por TxId em criação de cobrança
TxId determinístico (hash do pedido) + Idempotency-Key + lock distribuído + UNIQUE no banco. Combinar camadas — é a única defesa contra dupla cobrança/devolução. Detalhes operacionais no agente `pix-arch` do addon `fintech-br`.

### PIX-002 — Webhook valida assinatura na primeira linha do handler
HMAC + IP de origem validados ANTES de qualquer lógica de negócio. Falha → 401 imediato. Hook `validate-webhook-signature.sh` (addon) bloqueia handler que pula validação.

### PIX-003 — EndToEndId persistido em coluna indexada
Pivô único de conciliação financeira (extrato bancário ↔ pedido). Matching por nome+valor é proibido. Coluna indexada, idealmente UNIQUE.

### PIX-004 — Chave Pix é dado pessoal (LGPD-001 + LGPD-004)
Logs não podem vazar chave Pix completa em texto puro. Mascarar (`***@***`, `***.***.***-99`). Acesso a chaves logado e auditado.

### PIX-005 — URL do PSP/Bacen via env (SEC-005)
`BACEN_BASE_URL`, `PSP_BASE_URL` vêm de variável de ambiente — sandbox ↔ produção sem deploy. Hardcoded chamando produção em teste é incidente. Hook `no-hardcoded-env-urls.sh` bloqueia.

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

## Como citar uma regra

Em ADR: `aderente a INV-002, SEC-001`
Em commit: `fix: ajusta validação CPF (LGPD-001)`
Em PR: `Verifica INV-AGENT-002 — investigador rodou antes`
Em código (comentário, só quando justificável): `// TST-001 — não usar skip aqui`

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
