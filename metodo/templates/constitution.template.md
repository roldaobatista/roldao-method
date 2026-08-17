---
owner: <dono-do-projeto>
revisado-em: <YYYY-MM-DD>
status: stable
idioma: pt-BR
limite-linhas: 90
proposito: princípios fundadores não-negociáveis do <NomeDoProjeto>. Lido primeiro em toda sessão de agente IA.
---

<!--
template: princípios fundadores do projeto. Tamanho-alvo ≤90 linhas.
Copiar para `.claude/memory/constitution.md` no repositório destino.
Fallback: harnesses sem suporte a `.claude/` replicam em `.agent/constitution.md`.
Precedência entre cópias: `.claude/memory/constitution.md` vence quando ambas existem.
Mudança requer ADR explícita + consenso de todos os subagentes pertinentes.
ordem: frontmatter → este HTML comment → corpo.
-->

# Constituição do <NomeDoProjeto>

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence. CLAUDE.md é o mais específico (canal Claude Code) e o mais fácil de mudar.

Princípios fundadores. Mudança requer ADR explícita (`docs/adr/ADR-NNNN-<slug>.md`) + consenso dos subagentes pertinentes. Cada princípio aqui sobrescreve qualquer decisão arquitetural ou de produto que o conflite.

## Missão

<1-3 frases. Por que este projeto existe; quem ele serve; qual problema central resolve.>

## Valores não-negociáveis

1. **<Valor 1>** — <1 frase>.
2. **<Valor 2>** — <...>.
3. **<Valor 3>** — <...>.

> Exemplos: "Dados do cliente são propriedade do cliente — nunca usados para treinar IA sem consentimento"; "Falhas silenciosas proibidas"; "Reprodutibilidade > velocidade".

## Postura ética

- <Transparência ao usuário sobre decisão automatizada>.
- <Dados pessoais nunca em logs (operacionalizado em INV-AGENT-008)>.
- <Nada de scraping não-autorizado / concorrência leal>.

## Restrições legais permanentes

- <Marco regulatório aplicável (LGPD Art. 6, GDPR Art. 5, HIPAA, ...)>.
- <Obrigações setoriais (emissão fiscal, auditoria CVM, ...)>.
- <Compromissos públicos (privacy policy, SLA, ...)>.

## Mecanismo de aplicação

Princípio sem mecanismo é decoração. Cada princípio canônico precisa de pelo menos **um** auditor, **um** hook ou **uma** INV. Tabela vigente:

| Princípio | Auditor que aplica | Hook | INV relacionada | Se ausente |
|---|---|---|---|---|
| Dados do cliente são propriedade do cliente | `auditor-seguranca` | `tenant-id-validator.sh`, `migration-rls-check.sh` | INV-001, INV-TENANT-001 | mantido |
| Nenhum secret/PII em código ou logs | `auditor-seguranca` | `secrets-scanner.sh` | SEC-001, INV-AGENT-008, INV-AGENT-009 | mantido |
| Falhas silenciosas proibidas (causa raiz) | `auditor-qualidade` | `anti-mascaramento.sh` | TST-001, INV-AGENT-006 | mantido |
| Não destruir sem confirmação humana | `limites-agente-ia` | `block-destructive.sh`, `override-ledger.sh` | INV-AGENT-001, INV-AGENT-002, INV-AGENT-004 | mantido |
| Evidência antes de afirmação | `auditor-revisao` | `post-claim-evidence.sh` (opt-in) | INV-AGENT-005 | mantido |
| Investigar antes de mexer em lógica | `auditor-doc-quality` (regra B) | `pre-edit-evidence.sh` (opt-in) | INV-AGENT-003 | mantido |
| Linguagem acessível ao dono | `auditor-doc-quality` (regra E) | `frontmatter-validator` | INV-AGENT-010 | mantido |
| Contrato de INV é estável | `auditor-processo` | `inv-change-guard.sh` | INV-AGENT-011 | mantido |

Princípio sem nenhuma das três colunas (auditor, hook ou INV) deve aparecer marcado como **"candidato a remoção"** na coluna "Se ausente" e ser revisto no próximo ciclo.

## O que NÃO está nesta constituição

- Stack técnica (vai em ADR-0001).
- Cronograma e roadmap (vai em PRD e faseamento).
- Decisões reversíveis (vão em ADRs comuns).
- Regras operacionais (vão em `REGRAS-INEGOCIAVEIS.md`).

## Processo de alteração

1. Proposta via ADR específica (`docs/adr/ADR-NNNN-altera-constituicao.md`).
2. Convocação de TODOS os subagentes pertinentes — mínimo `tech-lead`, `especialista-juridico`, `especialista-dominio`, `security-engineer`.
3. Aprovação unânime obrigatória; uma reprovação bloqueia.
4. Aprovação humana do dono.
5. Constituição editada + commit cita ADR + `CHANGELOG.md` registra.

## Referências

- [`AGENTS.md`](../../AGENTS.md) — canônico de produto e arquitetura.
- [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — invariantes operacionalizáveis derivadas destes princípios.
- [`docs/adr/ADR-0000-uso-de-ia.md`](../../docs/adr/ADR-0000-uso-de-ia.md) — Uso de IA / agentes neste projeto.
