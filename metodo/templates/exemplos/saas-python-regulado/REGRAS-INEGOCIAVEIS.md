---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 220
proposito: invariantes inegociáveis do conciliab — INV-001, INV-TENANT-*, INV-LGPD-*, INV-AUDIT-*, INV-AGENT-*
---

<!--
arquivo: REGRAS-INEGOCIAVEIS.md (preenchido no exemplo saas-python-regulado)
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C0
-->

# Regras inegociáveis — conciliab

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md

> Fonte única de verdade das invariantes operacionalizáveis. Toda outra doc
> referencia por ID, nunca redeclara. Cada INV declara: regra, motivação, hook
> que aplica e auditor relacionado. Invariante sem mecanismo de aplicação é
> decoração — não entra aqui.

## 1. Invariantes de produto (INV-NNN)

| ID | Regra | Por que (motivação) | Hook que aplica | Auditor relacionado |
|---|---|---|---|---|
| INV-001 | Toda query a tabela com `tenant_id` filtra explicitamente por tenant via `app.current_tenant_id` da sessao PG. | Vazamento entre clientes = morte do produto. | `tenant-id-validator.sh` | `auditor-seguranca` |
| INV-TENANT-001 | Toda tabela com sufixo `_tenanted` tem RLS habilitada + policy ativa. | Backup contra esquecimento de filtro aplicacional. | `migration-rls-check.sh` | `auditor-seguranca` |
| INV-TENANT-002 | Nome da tabela tem sufixo `_tenanted` se e somente se tiver coluna `tenant_id`. | Consistencia de nomenclatura permite auditoria automatica. | `migration-rls-check.sh` | `auditor-seguranca` |
| INV-TENANT-003 | Proibido `SET LOCAL ROLE` ou `BYPASSRLS` em codigo de aplicacao (so DBA em runbook destrutivo). | Pular RLS sem auditoria = vazamento silencioso. | `bypass-rls-scanner.sh` | `auditor-seguranca` |
| INV-LGPD-001 | Toda operacao nova que toca PII entra como linha nova em `docs/conformidade/lgpd/ropa.md` antes do deploy. | LGPD Art. 37 + responsabilizacao do controlador. | `ropa-consistency.sh` | `auditor-lgpd` |
| INV-LGPD-002 | Pedido de eliminacao do titular (Art. 18, VI) atendido em ≤ 15 dias corridos via runbook `atender-pedido-eliminacao.md`. | Obrigacao legal LGPD Art. 19. | (manual + alerta de SLA) | `auditor-lgpd` |
| INV-LGPD-003 | Incidente de seguranca envolvendo PII comunicado a ANPD em ≤ 72h apos ciencia. | LGPD Art. 48. | (runbook + checklist) | `auditor-lgpd` |
| INV-AUDIT-001 | Toda mutacao em tabela financeira (`fiscal_*`, `pagamento_*`, `conciliacao_*`) gera linha em `audit_log`. | Reconstituicao para auditoria fiscal (5 anos). | trigger `audit_trail_*` no PG | `auditor-fiscal-audit` |
| INV-AUDIT-002 | Tabela `audit_log` so admite INSERT. UPDATE e DELETE bloqueados via trigger `prevent_update_delete`. | WORM: trilha imutavel e premissa de auditoria. | trigger PG + `worm-check.sh` no CI | `auditor-fiscal-audit` |
| INV-AUDIT-003 | Relatorio fiscal exportado (PDF/CSV) carrega hash SHA-256 do snapshot da query no rodape + entrada em `fiscal_export_snapshot`. | Comprovar integridade do que foi entregue ao cliente/fisco. | `fiscal-export-validator.sh` | `auditor-fiscal-audit` |
| SEC-001 | Nenhum secret (chave, token, senha) em codigo-fonte ou historico git. | Vazamento publico irreversivel. | `gitleaks` + `secrets-scanner.sh` | `auditor-seguranca` |
| TST-001 | Teste nao pode ser silenciado (`@pytest.mark.skip`, `xfail` sem motivo), pulado ou afrouxado sem ADR. | Esconde bug e quebra confianca na suite. | `anti-mascaramento.sh` | `auditor-qualidade` |

## 2. Invariantes para agentes IA (INV-AGENT-NNN)

| ID | Regra | Por que (motivação) | Hook que aplica | Auditor relacionado |
|---|---|---|---|---|
| INV-AGENT-001 | Agente IA NAO deleta dado de producao sem confirmacao humana explicita. | Perda irreversivel, sem backup viavel em janela curta. | `block-destructive.sh` | `limites-agente-ia` |
| INV-AGENT-002 | Proibido `--no-verify`, `--force`, `--force-with-lease` em `main`. Qualquer override exige entrada no override-ledger. | Pula quality gate e/ou destroi historico compartilhado. | `block-destructive.sh` + `override-ledger.sh` | `limites-agente-ia` |
| INV-AGENT-003 | Investigar antes de mexer em logica de negocio: ler banco/log/payload/console **antes** de editar codigo. | Mudar template/UI sem confirmar o estado real produz voltas e bug pior. | `pre-edit-evidence.sh` (PreToolUse Edit\|Write) | `auditor-doc-quality` (regra B) |
| INV-AGENT-004 | Pro-atividade: executar acoes reversiveis sem perguntar. Confirmar antes so para a lista destrutiva. | Empurrar tarefa executavel pro dono quebra fluxo e ele nao programa. | `override-ledger.sh` | `limites-agente-ia` |
| INV-AGENT-005 | Validar antes de afirmar: nunca dizer "pronto/implementado/corrigido" sem rodar verificacao e mostrar resultado. | Afirmacao sem evidencia erode confianca e mascara regressoes. | `post-claim-evidence.sh` (Stop hook) | `auditor-revisao` |
| INV-AGENT-006 | Causa raiz, nunca sintoma. Proibido `pytest.skip`, `assert True`, `# type: ignore` sem ticket, `# noqa` cego, `\|\| true`, asercao relaxada. | Mascarar erro transforma bug pequeno em incidente caro. | `anti-mascaramento.sh` | `auditor-qualidade` |
| INV-AGENT-007 | Commits atomicos. Antes de `git commit`: rodar `git status` + `git diff --staged` + `git log -3 --oneline`. Proibido `git add .` / `git add -A` cego. Stage seletivo por arquivo nomeado. | Commit misto polui historico e impede revert cirurgico. | `auditor-commit-hygiene.sh` (PreToolUse Bash) | `auditor-commit-hygiene` |
| INV-AGENT-008 | PII (CPF, e-mail, telefone, endereco, dado bancario) nunca em logs nem em prints. Mascarar/tokenizar via `mask_pii()` antes de logar. | LGPD Art. 46 + risco reputacional + obrigacao contratual com cliente. | `secrets-scanner.sh` (ampliado para PII) + `tests/unit/test_pii_masker.py` | `auditor-seguranca` |
| INV-AGENT-009 | Nenhum segredo (chave, token, credencial, certificado) em arquivo versionado. Usa AWS Secrets Manager + `.env` local. | Historico git e eterno; segredo vazado = rotacao imediata. | `gitleaks` + `secrets-scanner.sh` | `auditor-seguranca` |
| INV-AGENT-010 | Linguagem acessivel: traduzir jargao tecnico na primeira ocorrencia por canal. Dono nao programa. Tabela canonica no anexo 2.A. | Jargao sem traducao exclui o tomador de decisao do loop. | `frontmatter-validator` | `auditor-doc-quality` (regra E) |
| INV-AGENT-011 | Alteracao de qualquer INV-* exige PR dedicado + aprovacao do dono + entrada em `docs/governanca/decisoes-inv.md`. | INV e contrato; mudanca silenciosa destroi o contrato. | `inv-change-guard.sh` | `auditor-processo` |

### 2.A — Anexo da INV-AGENT-010: tradução canônica de jargão

A fonte única de tradução de jargão **vive em** [`../../../GLOSSARIO-ROLDAO.md`](../../../GLOSSARIO-ROLDAO.md) (no projeto destino real: `GLOSSARIO-ROLDAO.md` da raiz). Não duplicar aqui — drift garantido se houver duas fontes.

Termos específicos deste projeto (RLS, WORM, tenant, Cognito, ECS Fargate, Open Finance, CNAB, ICP-Brasil, Bacen) já estão no glossário canônico.

Regra (INV-AGENT-010): ao usar qualquer termo do glossário em conversa com o dono, traduzir na primeira ocorrência por canal. Auditor `auditor-doc-quality` regra E verifica.

**Pró-atividade (referência a INV-AGENT-004):** o agente executa ações reversíveis sem perguntar e reporta no formato "fiz X, resolvi Y, já comecei Z". Detalhes e lista destrutiva vivem em INV-AGENT-004; este anexo é só de linguagem.

## 3. Processo de alteracao das INVs

1. PR dedicado, **um INV por PR**, mensagem cita o ID alterado.
2. Aprovacao do dono (Roldao) obrigatoria — nao ha override por agente.
3. Entrada em `docs/governanca/decisoes-inv.md` com: data, ID, motivo,
   antes/depois, aprovador.
4. Atualizacao (ou criacao) do hook/auditor correspondente no mesmo PR. INV
   sem mecanismo nao e aceito.
5. `CHANGELOG.md` registra a mudanca.

## 4. Referencias

- [`.claude/memory/constitution.md`](./.claude/memory/constitution.md) — principios fundadores (autoridade maxima).
- [`AGENTS.md`](./AGENTS.md) — canonico de produto.
- [`CLAUDE.md`](./CLAUDE.md) — adendo do harness Claude Code.
- [`docs/governanca/catalogo-auditores.md`](./docs/governanca/catalogo-auditores.md) — auditores citados acima.
- [`docs/governanca/decisoes-inv.md`](./docs/governanca/decisoes-inv.md) — historico de alteracoes de INV.
