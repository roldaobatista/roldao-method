# REGRAS INEGOCIÁVEIS

> Regras com IDs rastreáveis. Cada ID é citável em código, ADR, commit e PR.
>
> **Convenção:** `INV-NNN` (invariantes gerais), `SEC-NNN` (segurança), `TST-NNN` (testes), `LGPD-NNN` (proteção de dados BR), `INV-AGENT-NNN` (regras pra agentes IA).

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
AGENTS.md ≤ 250 linhas. CLAUDE.md ≤ 150 linhas. Hook `context-budget` avisa.

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

---

## TST — Testes

### TST-001 — Nunca mascarar teste que falha
Proibido: `skip`, `assertTrue(true)`, `@ts-ignore`, `eslint-disable`, regra desligada, baseline pra esconder erro, `|| true`, `--quiet`. Hook `anti-mascaramento` bloqueia.

### TST-002 — Teste falhou = problema no sistema
Corrigir código. Não relaxar assertiva. Não comentar teste.

### TST-003 — Não testar com mock o que vai pra produção real
Integrações críticas (banco, fiscal, pagamento) testar em ambiente que reproduz produção. Mock só pra testes unitários.

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

---

## Como citar uma regra

Em ADR: `aderente a INV-002, SEC-001`
Em commit: `fix: ajusta validação CPF (LGPD-001)`
Em PR: `Verifica INV-AGENT-002 — investigador rodou antes`
Em código (comentário, só quando justificável): `// TST-001 — não usar skip aqui`

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
