---
owner: <Responsavel>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 150
proposito: tabela central com status de cada documento obrigatório do projeto — usada pelo auditor-doc-quality em PASS ZERO
---

<!--
template: documentos-do-projeto.md
destino: docs/documentos-do-projeto.md
uso: registro central do status de cada documento contratual.
-->

# Documentos do Projeto — <NomeDoProjeto>

Lista única e canônica de documentos contratuais do projeto. Sempre que um documento for criado, promovido ou marcado como obsoleto, atualizar a tabela abaixo.

## 1. Legenda de status
- `draft` — em construção, conteúdo ainda pode mudar substancialmente.
- `stable` — aprovado, qualquer mudança exige ADR ou aprovação do owner.
- `deprecated` — não usar; manter por referência histórica até remoção combinada.

## 2. Tabela

Lista mínima de documentos contratuais que todo projeto deve registrar (adicione/remova linhas conforme o tipo do projeto):

| Caminho | Status | Owner | Última revisão | Bloqueia próxima fase? |
|---|---|---|---|---|
| `README.md` | draft | <nome> | <YYYY-MM-DD> | não |
| `AGENTS.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `CLAUDE.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `CONTRIBUTING.md` | draft | <nome> | <YYYY-MM-DD> | não |
| `MAINTAINERS.md` | draft | <nome> | <YYYY-MM-DD> | não |
| `SECURITY.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `REGRAS-INEGOCIAVEIS.md` | stable | <nome> | <YYYY-MM-DD> | sim |
| `CHECKLIST-PRONTO-PRA-CODAR.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `docs/INDICE.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `docs/CONVENCOES-DOC.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `docs/glossario.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `docs/nao-aplica.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `docs/adr/ADR-0001-stack.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `docs/conformidade/lgpd/ropa.md` | draft | <nome> | <YYYY-MM-DD> | sim (se trata dado pessoal) |
| `docs/conformidade/lgpd/retencao-dados.md` | draft | <nome> | <YYYY-MM-DD> | sim (se trata dado pessoal) |
| `docs/governanca/catalogo-auditores.md` | draft | <nome> | <YYYY-MM-DD> | sim (se houver >1 auditor) |
| `.claude/agents/maestro.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `docs/operacao/slo-sli.md` | draft | <nome> | <YYYY-MM-DD> | não |
| `docs/operacao/runbooks/` (pasta) | draft | <nome> | <YYYY-MM-DD> | sim (se serviço crítico) |
| `docs/operacao/on-call.md` | draft | <nome> | <YYYY-MM-DD> | sim (se há plantão) |
| `docs/operacao/backup.md` | draft | <nome> | <YYYY-MM-DD> | sim (se persiste dado) |
| `docs/operacao/disaster-recovery.md` | draft | <nome> | <YYYY-MM-DD> | sim (se há RTO/RPO) |
| `docs/operacao/change-management.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `.claude/memory/constitution.md` | draft | <nome> | <YYYY-MM-DD> | sim |
| `.agent/CURRENT.md` | draft | <nome> | <YYYY-MM-DD> | não |

## 3. Regras de manutenção
- Promover `draft` → `stable` exige aprovação explícita do owner registrada em commit.
- Promover qualquer documento como bloqueante de fase exige amarração no `kickoff.md` da fase correspondente.
- Documento `deprecated` deve manter no topo um aviso indicando substituto.
