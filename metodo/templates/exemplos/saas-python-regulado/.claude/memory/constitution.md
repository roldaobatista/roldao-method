---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 120
proposito: principios fundadores nao-negociaveis do conciliab. Lido primeiro em toda sessao de agente IA.
---

<!--
arquivo: .claude/memory/constitution.md (preenchido no exemplo saas-python-regulado)
-->

# Constituicao do conciliab

> **Hierarquia de precedencia (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md

Principios fundadores. Mudanca requer ADR explicita (`docs/adr/ADR-NNNN-<slug>.md`)
+ consenso dos subagentes pertinentes. Cada principio aqui sobrescreve qualquer
decisao arquitetural ou de produto que o conflite.

## Missao

Tirar o financeiro de PME brasileira da planilha de conciliacao manual e
devolver tempo de socio-administrador para o negocio. O conciliab so existe se
o cliente sai de "passo 3 horas por semana batendo extrato" para "abro
o sistema e ja vejo o que nao conferiu".

## Valores nao-negociaveis

1. **Dados do cliente sao do cliente.** Nao usamos transacao financeira de
   cliente para treinar modelo, gerar benchmark publico ou enriquecer outro
   produto. Operamos a conciliacao DELE, ponto.
2. **Isolamento entre tenants e premissa, nao feature.** Vazamento entre
   clientes mata o produto. Defesa em camadas: aplicacao + RLS no banco.
3. **Trilha imutavel para dado financeiro.** Cliente precisa reconstituir
   qualquer mexida na conciliacao para auditor externo. `audit_log` so aceita
   INSERT.
4. **Falhar barulhento.** Job de conciliacao que erra notifica o cliente +
   abre alerta interno. Proibido `try/except: pass`, proibido `assert True`,
   proibido baseline para esconder teste vermelho.

## Postura etica

- Transparencia ao cliente sobre regras automaticas de match — toda regra
  aplicada em uma conciliacao automatica aparece no detalhe da linha
  (auditavel pelo cliente).
- Dados pessoais nunca em logs nem em prints (operacionalizado em INV-AGENT-008 +
  INV-LGPD-001).
- Nada de scraping de bancos sem consentimento do correntista — entrada de
  dado e sempre por upload (CSV/OFX) ou Open Finance autorizado.

## Restricoes legais permanentes

- **LGPD** (Lei 13.709/2018): tratamento de PII com base legal "execucao de
  contrato" (Art. 7, V). DPO designado. ROPA mantido vivo. Incidente comunicado
  a ANPD em ≤ 72h.
- **Obrigacao fiscal**: dado fiscal preservado por 5 anos (Lei 8.846/94 + Decreto
  70.235/72). Backup mensal congelado.
- **Bacen / Open Finance** (quando ativarmos): ICP-Brasil obrigatorio,
  certificacao previa.
- **Marco Civil da Internet** (Lei 12.965/2014): logs de acesso por 12 meses.

## Mecanismo de aplicacao

Cada principio canonico precisa de pelo menos **um** auditor, **um** hook ou
**uma** INV. Principio sem mecanismo e decoracao.

| Principio | Auditor que aplica | Hook | INV relacionada | Se ausente |
|---|---|---|---|---|
| Dados do cliente sao do cliente | `auditor-seguranca` | `tenant-id-validator.sh`, `migration-rls-check.sh` | INV-001, INV-TENANT-001..003 | mantido |
| Isolamento entre tenants e premissa | `auditor-seguranca` | `migration-rls-check.sh`, `bypass-rls-scanner.sh` | INV-TENANT-001..003 | mantido |
| Trilha imutavel para dado financeiro | `auditor-fiscal-audit` | trigger PG `prevent_update_delete` + `worm-check.sh` | INV-AUDIT-001..003 | mantido |
| Falhar barulhento (causa raiz) | `auditor-qualidade` | `anti-mascaramento.sh` | TST-001, INV-AGENT-006 | mantido |
| Nenhum secret/PII em codigo ou logs | `auditor-seguranca` | `gitleaks`, `secrets-scanner.sh` | SEC-001, INV-AGENT-008, INV-AGENT-009 | mantido |
| Nao destruir sem confirmacao humana | `limites-agente-ia` | `block-destructive.sh`, `override-ledger.sh` | INV-AGENT-001, INV-AGENT-002, INV-AGENT-004 | mantido |
| Evidencia antes de afirmacao | `auditor-revisao` | TODO: `post-claim-evidence.sh` | INV-AGENT-005 | mantido (hook em TODO) |
| Investigar antes de mexer em logica | `auditor-doc-quality` (regra B) | TODO: `pre-edit-evidence.sh` | INV-AGENT-003 | mantido (hook em TODO) |
| Linguagem acessivel ao dono | `auditor-doc-quality` (regra E) | `frontmatter-validator` | INV-AGENT-010 | mantido |
| LGPD viva (ROPA atualizado) | `auditor-lgpd` | `ropa-consistency.sh` | INV-LGPD-001..003 | mantido |
| Contrato de INV e estavel | `auditor-processo` | `inv-change-guard.sh` | INV-AGENT-011 | mantido |

## O que NAO esta nesta constituicao

- Stack tecnica (vai em ADR-0001).
- Cronograma e roadmap (vai em PRD e faseamento).
- Decisoes reversiveis (vao em ADRs comuns).
- Regras operacionais (vao em `REGRAS-INEGOCIAVEIS.md`).

## Processo de alteracao

1. Proposta via ADR especifica (`docs/adr/ADR-NNNN-altera-constituicao.md`).
2. Convocacao de TODOS os subagentes pertinentes — minimo `auditor-seguranca`,
   `auditor-lgpd`, `auditor-fiscal-audit`, `auditor-processo`.
3. Aprovacao unanime obrigatoria; uma reprovacao bloqueia.
4. Aprovacao humana do dono (Roldao).
5. Constituicao editada + commit cita ADR + `CHANGELOG.md` registra.

## Referencias

- [`../../AGENTS.md`](../../AGENTS.md) — canonico de produto e arquitetura.
- [`../../REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — invariantes operacionalizaveis.
- [`../../docs/adr/ADR-0000-uso-de-ia.md`](../../docs/adr/ADR-0000-uso-de-ia.md) — Uso de IA / agentes.
