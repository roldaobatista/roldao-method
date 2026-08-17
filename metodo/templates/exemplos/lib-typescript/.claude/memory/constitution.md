---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 90
proposito: princípios fundadores não-negociáveis do @conciliab/csv-parser. Lido primeiro em toda sessão de agente IA.
---

<!--
arquivo: .claude/memory/constitution.md do projeto-exemplo @conciliab/csv-parser.
-->

# Constituição do @conciliab/csv-parser

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence.

Princípios fundadores. Mudança requer ADR explícita + consenso. Cada princípio aqui sobrescreve qualquer decisão arquitetural ou de produto que o conflite.

## Missão

`@conciliab/csv-parser` existe para que qualquer desenvolvedor brasileiro possa transformar um extrato bancário cru (OFX, CNAB240, CSV) em uma lista de transações normalizada, **com a mesma confiança que confia no `JSON.parse` da linguagem**. Servimos devs solo, pequenas empresas e ferramentas de conciliação que não podem custear parsers proprietários ou serviços terceirizados.

## Valores não-negociáveis

1. **Pureza acima de conveniência** — a lib não lê arquivo, não acessa rede, não consulta relógio. Quem chama controla I/O. Determinismo é base da confiança.
2. **SemVer é contrato sagrado** — quebrar API silenciosamente em `patch` ou `minor` mata a confiança da comunidade e nunca se recupera. Em dúvida, bump pra cima.
3. **Dado real do consumidor é veneno no repo** — snapshots usam exclusivamente dados sintéticos. Extrato bancário real, mesmo "anonimizado", nunca entra no repositório.
4. **Comunidade pequena merece o mesmo rigor de comunidade grande** — não economizamos governança porque "somos só nós". Quando crescer, escala sem refatorar processo.
5. **Falhas silenciosas proibidas** — parser que aceita input ambíguo sem flag explícita produz bug financeiro silencioso no consumidor. Erro alto, mensagem clara.

## Postura ética

- **Transparência com o consumidor** — qualquer comportamento "heurístico" do parser (decimal por vírgula vs ponto, fuso de data) é configurável por flag explícita, com default conservador.
- **Dados pessoais nunca em logs** — operacionalizado em INV-AGENT-008 + INV-SNAPSHOT-001. A lib não loga (não tem I/O), e snapshots são sintéticos.
- **Crédito a contribuidores** — toda contribuição externa creditada no `CHANGELOG.md` e no release notes do GitHub.
- **Sem dark pattern de licenciamento** — MIT permanente. Sem dual license. Sem "open core" surpresa.

## Restrições legais permanentes

- **LGPD (Lei 13.709/2018)** — embora a lib não trate PII diretamente, snapshots e fixtures **podem** vazar dado pessoal se commitados crus. INV-SNAPSHOT-001 + hook `snapshot-pii-scanner.sh` aplicam.
- **MIT License (Open Source Initiative)** — obrigação de manter aviso de copyright nos forks. Não há compromisso público adicional.
- **Política do npm sobre `unpublish`** — versão publicada há mais de 72h não pode ser despublicada exceto via suporte do npm. Isso reforça INV-AGENT-001 (publicação exige confirmação humana — não dá pra "desfazer").

## Mecanismo de aplicação

Princípio sem mecanismo é decoração. Cada princípio canônico precisa de pelo menos **um** auditor, **um** hook ou **uma** INV. Tabela vigente:

| Princípio | Auditor que aplica | Hook | INV relacionada | Se ausente |
|---|---|---|---|---|
| Pureza acima de conveniência | `auditor-pureza` | `purity-check.sh` | INV-PARSER-001 | mantido |
| SemVer é contrato sagrado | `auditor-semver` | `api-extractor.sh` | INV-SEMVER-001 | mantido |
| Dado real é veneno no repo | `auditor-seguranca` | `snapshot-pii-scanner.sh` | INV-SNAPSHOT-001, INV-AGENT-008 | mantido |
| Falhas silenciosas proibidas | `auditor-qualidade` | `anti-mascaramento.sh` | TST-001, INV-AGENT-006 | mantido |
| Nenhum secret em código | `auditor-seguranca` | `secrets-scanner.sh` (gitleaks) | SEC-001, INV-AGENT-009 | mantido |
| Não publicar sem confirmação humana | `limites-agente-ia` | `block-destructive.sh` | INV-AGENT-001, INV-AGENT-004 | mantido |
| Evidência antes de afirmação | `auditor-revisao` (skill `code-review`) | TODO: `post-claim-evidence.sh` | INV-AGENT-005 | mantido (hook em TODO) |
| Investigar antes de mexer | `auditor-doc-quality` (regra B) | TODO: `pre-edit-evidence.sh` | INV-AGENT-003 | mantido (hook em TODO) |
| Linguagem acessível ao dono | `auditor-doc-quality` (regra E) | TODO: `frontmatter-validator` | INV-AGENT-010 | mantido (hook em TODO) |
| Contrato de INV é estável | `auditor-processo` | `inv-change-guard.sh` | INV-AGENT-011 | mantido |

## O que NÃO está nesta constituição

- Stack técnica (vai em ADR-0001).
- Política de distribuição (vai em ADR-0002).
- Política de versionamento (vai em ADR-0003).
- Suporte de runtime (vai em ADR-0004).
- Cronograma e roadmap.
- Decisões reversíveis (vão em ADRs comuns).
- Regras operacionais (vão em `REGRAS-INEGOCIAVEIS.md`).

## Processo de alteração

1. Proposta via ADR específica (`docs/adr/ADR-NNNN-altera-constituicao.md`).
2. Revisão por skills `code-review` + `security-review` (substitui convocação formal de subagentes em projeto solo).
3. Aprovação humana do dono (Roldão).
4. Constituição editada + commit cita ADR + `CHANGELOG.md` registra via changeset `major`.

## Referências

- [`../../AGENTS.md`](../../AGENTS.md) — canônico de produto e arquitetura.
- [`../../REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — invariantes operacionalizáveis.
- [`../../docs/adr/ADR-0000-uso-de-ia.md`](../../docs/adr/ADR-0000-uso-de-ia.md) — Uso de IA neste projeto.
