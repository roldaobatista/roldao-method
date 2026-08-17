---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 300
proposito: índice de templates copy-paste extraídos do manual principal.
---

# Templates copy-paste

> **Nota:** este arquivo é o **catálogo** dos templates do método. Para o README do projeto destino, ver [`README.template.md`](./README.template.md).

Templates literais que o agente IA **copia** para o repositório de destino, em vez de transcrever prosa do manual.

> Referência completa: [`../ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`](../ESTRUTURA-PROJETO-NOVO-DO-ZERO.md).
> Convenção: arquivos terminam em `.template.md` / `.template.json` / `.template.sh`. Ao copiar, **remova o sufixo `.template`** e os comentários de cabeçalho `<!-- template: ... -->`.
> Datas como `<YYYY-MM-DD>` são placeholders intencionais: `bootstrap.sh` substitui pela data de criação. Em cópia manual, o agente precisa preencher a data real antes de salvar.

## Índice por camada

### C0 — Raiz do repositório
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`README.template.md`](./README.template.md) | `/README.md` | Sempre. |
| [`AGENTS.template.md`](./AGENTS.template.md) | `/AGENTS.md` | Sempre. |
| [`CLAUDE.template.md`](./CLAUDE.template.md) | `/CLAUDE.md` | Sempre (adendo do harness Claude Code). |
| [`cursorrules.template`](./cursorrules.template) | `/.cursorrules` | Se usa Cursor. |
| [`windsurfrules.template`](./windsurfrules.template) | `/.windsurfrules` | Se usa Windsurf. |
| [`kiro-steering.template.md`](./kiro-steering.template.md) | `/.kiro/steering/00-agents.md` | Se usa Kiro. |
| [`gitignore.template`](./gitignore.template) | `/.gitignore` | Sempre. Ignora `.claude/.override-reason`, `.env`, build artifacts. |
| [`CONTRIBUTING.template.md`](./CONTRIBUTING.template.md) | `/CONTRIBUTING.md` | Sempre. |
| [`SECURITY.template.md`](./SECURITY.template.md) | `/SECURITY.md` | Sempre (exceto experimento). |
| [`MAINTAINERS.template.md`](./MAINTAINERS.template.md) | `/MAINTAINERS.md` | Sempre (mesmo solo, declara dono e sucessão). |
| [`REGRAS-INEGOCIAVEIS.template.md`](./REGRAS-INEGOCIAVEIS.template.md) | `/REGRAS-INEGOCIAVEIS.md` | Sempre. |
| [`CHECKLIST-PRONTO-PRA-CODAR.template.md`](./CHECKLIST-PRONTO-PRA-CODAR.template.md) | `/CHECKLIST-PRONTO-PRA-CODAR.md` | Antes da primeira linha de código. |
| [`CODEOWNERS.template`](./CODEOWNERS.template) | `/CODEOWNERS` ou `/.github/CODEOWNERS` | Sempre que tem equipe (≥2 pessoas) ou OSS. |
| [`CHANGELOG.template.md`](./CHANGELOG.template.md) | `/CHANGELOG.md` | Sempre que publica versão (CLI/lib/OSS/SaaS regulado). |
| [`LICENSE.template`](./LICENSE.template) | `/LICENSE` | Sempre. Default MIT; ajustar conforme tipo. |

### C1 — Descoberta
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`problema.template.md`](./problema.template.md) | `docs/descoberta/problema.md` | Sempre (não-experimento). |
| [`personas.template.md`](./personas.template.md) | `docs/descoberta/personas.md` | Sempre (não-experimento). 2-5 personas. |
| [`jornadas.template.md`](./jornadas.template.md) | `docs/descoberta/jornadas.md` | Sempre (não-experimento). 3-7 jornadas. |
| [`business-model-canvas.template.md`](./business-model-canvas.template.md) | `docs/descoberta/business-model-canvas.md` | Sempre (não-experimento). |
| [`value-proposition-canvas.template.md`](./value-proposition-canvas.template.md) | `docs/descoberta/value-proposition-canvas.md` | Sempre (não-experimento). |
| [`gtm-pricing.template.md`](./gtm-pricing.template.md) | `docs/descoberta/gtm-pricing.md` | Recomendado (🟡) — só para projetos com modelo comercial. |
| [`concorrentes.template.md`](./concorrentes.template.md) | `docs/descoberta/concorrentes.md` | Sempre (não-experimento). |
| [`mercado-regulatorio.template.md`](./mercado-regulatorio.template.md) | `docs/descoberta/mercado-regulatorio.md` | Condicional (🔵) — só se domínio regulado (LGPD/Bacen/Anvisa/etc.). |
| [`nao-fazer.template.md`](./nao-fazer.template.md) | `docs/descoberta/nao-fazer.md` | Sempre. Non-goals explícitos. |
| [`riscos.template.md`](./riscos.template.md) | `docs/descoberta/riscos.md` | Sempre (não-experimento). |
| [`restricoes.template.md`](./restricoes.template.md) | `docs/descoberta/restricoes.md` | Recomendado (🟡). |
| [`hipoteses-a-validar.template.md`](./hipoteses-a-validar.template.md) | `docs/descoberta/hipoteses-a-validar.md` | Recomendado (🟡). |
| [`metricas-chave.template.md`](./metricas-chave.template.md) | `docs/descoberta/metricas-chave.md` | Sempre (não-experimento). NSM + guardrails. |
| [`dados-existentes.template.md`](./dados-existentes.template.md) | `docs/descoberta/dados-existentes.md` | Condicional (🔵) — só se migra sistema legado. |
| [`integracoes-externas.template.md`](./integracoes-externas.template.md) | `docs/descoberta/integracoes-externas.md` | Condicional (🔵) — só se depende de APIs/serviços externos. |
| [`sintese-final.template.md`](./sintese-final.template.md) | `docs/descoberta/sintese-final.md` | Sempre (não-experimento). **GATE para C2 ADRs.** |
| [`glossario.template.md`](./glossario.template.md) | `docs/glossario.md` | Sempre. |

Ordem declarada no frontmatter: `ordem-descoberta: 01/17` a `17/17` e `proximo:` apontando para o próximo artefato.

### C2 — ADRs
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`ADR.template.md`](./ADR.template.md) | `docs/adr/ADR-NNNN-<slug>.md` | Por decisão arquitetural. |

### C3 — Arquitetura
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`visao-geral.template.md`](./visao-geral.template.md) | `docs/dominios/visao-geral.md` ou `docs/arquitetura/visao-geral.md` | Sempre. C4 nível 1 e 2. |
| [`modelo-dados-canonico.template.md`](./modelo-dados-canonico.template.md) | `docs/dominios/<dom>/modelo.md` ou `docs/dados/modelo-canonico.md` | Sempre que persiste dado. |
| [`data-dictionary.template.md`](./data-dictionary.template.md) | `docs/dados/dicionario.md` | Sempre que persiste dado. Nível físico. |

### C4 — Produto
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`prd.template.md`](./prd.template.md) | `docs/produto/prd-v<N>.md` ou `docs/dominios/<dom>/prd.md` | Por versão de produto. |
| [`spec.template.md`](./spec.template.md) | `docs/dominios/<dom>/modulos/<mod>/spec.md` | Por módulo. |
| [`plan.template.md`](./plan.template.md) | `docs/dominios/<dom>/modulos/<mod>/plan.md` | Por módulo. |
| [`tasks.template.md`](./tasks.template.md) | `docs/dominios/<dom>/modulos/<mod>/tasks.md` | Por módulo. |
| [`revisao.template.md`](./revisao.template.md) | `docs/dominios/<dom>/modulos/<mod>/revisoes/<US-ID>-<agente>.md` | Por revisão de subagente. |
| [`data-contract.template.md`](./data-contract.template.md) | `docs/dominios/<dom>/contratos/<contrato>.md` | Por contrato produtor↔consumidor (eventos, APIs internas). |
| [`model-card.template.md`](./model-card.template.md) | `docs/dominios/ia/modelos/<modelo>/model-card.md` | Se projeto usa IA/ML em produção. |
| [`data-card.template.md`](./data-card.template.md) | `docs/dominios/ia/datasets/<dataset>/data-card.md` | Se projeto treina/avalia modelo com dataset próprio. |

### C5 — Faseamento
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`kickoff-fase.template.md`](./kickoff-fase.template.md) | `docs/faseamento/<F-N>/kickoff.md` | Kickoff de Fase de produto (F-1, F-2…). |
| [`kickoff-foundation.template.md`](./kickoff-foundation.template.md) | `docs/faseamento/<F-X>/kickoff.md` | Kickoff de Foundation (F-A, F-B…). Capacidade transversal — vem antes de Fases de produto. |
| [`finalizacao-fase.template.md`](./finalizacao-fase.template.md) | `docs/faseamento/<fase>/finalizacao.md` | Gate de SAÍDA com PASS ZERO ao fim de cada fase. Inegociável. |

### C6 — Conformidade e segurança
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`ropa.template.md`](./ropa.template.md) | `docs/conformidade/lgpd/ropa.md` | Se trata dado pessoal. |
| [`retencao-dados.template.md`](./retencao-dados.template.md) | `docs/conformidade/lgpd/retencao-dados.md` | Se trata dado pessoal. |
| [`direitos-do-titular.template.md`](./direitos-do-titular.template.md) | `docs/conformidade/lgpd/direitos-do-titular.md` | Se trata dado pessoal. |
| [`dpo-action-plan.template.md`](./dpo-action-plan.template.md) | `docs/conformidade/lgpd/dpo-action-plan.md` | Se trata dado pessoal ou regulado. |
| [`aipd.template.md`](./aipd.template.md) | `docs/conformidade/lgpd/aipd.md` | Se há IA, dado sensível, alto risco ou escala relevante. |
| [`atender-pedido-eliminacao-runbook.template.md`](./atender-pedido-eliminacao-runbook.template.md) | `docs/operacao/runbooks/atender-pedido-eliminacao.md` | Runbook LGPD Art. 18. |
| [`threat-model.template.md`](./threat-model.template.md) | `docs/seguranca/threat-model.md` | Sempre (STRIDE por componente). Obrigatório em produção crítica. |
| [`dependency-policy.template.md`](./dependency-policy.template.md) | `docs/seguranca/dependency-policy.md` | Sempre (critério de aceitação de pacotes, max-age, SBOM, scanning). |
| [`criptografia-policy.template.md`](./criptografia-policy.template.md) | `docs/seguranca/criptografia-policy.md` | Se persiste dado relevante ou opera em produção. |
| [`key-management-policy.template.md`](./key-management-policy.template.md) | `docs/seguranca/key-management-policy.md` | Se usa chaves, tokens, segredos ou assinatura. |
| [`resposta-incidente.template.md`](./resposta-incidente.template.md) | `docs/seguranca/resposta-incidente.md` | Plano de resposta a incidente de segurança. |

### C7 — Governança / auditoria
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`auditor.template.md`](./auditor.template.md) | `.claude/agents/auditor-<dominio>.md` | Por auditor novo. |
| [`auditor-pro-atividade.template.md`](./auditor-pro-atividade.template.md) | `.claude/agents/auditor-pro-atividade.md` | Mede pró-atividade em transcripts (INV-AGENT-004). Recomendado, sobretudo em modo solo. |
| [`catalogo-auditores.template.md`](./catalogo-auditores.template.md) | `docs/governanca/catalogo-auditores.md` | Sempre que houver mais de 1 auditor ativo. *(se ausente no projeto destino, agente IA cria seguindo o template.)* |
| [`maestro.template.md`](./maestro.template.md) | `.claude/agents/maestro.md` | Sempre. Orquestrador-mestre do ciclo problema→spec→plan→tasks→marco. |

### C8 — Operação
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`runbook.template.md`](./runbook.template.md) | `docs/operacao/runbooks/<procedimento>.md` | Por procedimento operacional. |
| [`post-mortem.template.md`](./post-mortem.template.md) | `docs/operacao/incidentes/<YYYY-MM-DD-slug>.md` | Por incidente. |
| [`slo-sli.template.md`](./slo-sli.template.md) | `docs/operacao/slo-sli.md` | Se serviço crítico. |
| [`on-call.template.md`](./on-call.template.md) | `docs/operacao/on-call.md` | Se o serviço tem plantão. |
| [`backup.template.md`](./backup.template.md) | `docs/operacao/backup.md` | Se persiste dado relevante. |
| [`disaster-recovery.template.md`](./disaster-recovery.template.md) | `docs/operacao/disaster-recovery.md` | Se há RTO/RPO contratado. |
| [`change-management.template.md`](./change-management.template.md) | `docs/operacao/change-management.md` | Sempre (controle de mudança em produção). |
| [`observabilidade.template.md`](./observabilidade.template.md) | `docs/operacao/observabilidade.md` | Sempre que rodar em produção (logs/metrics/traces). |
| [`release-process.template.md`](./release-process.template.md) | `docs/operacao/release-process.md` | Sempre que publicar (versão pública). |
| [`deployment-strategy.template.md`](./deployment-strategy.template.md) | `docs/operacao/deployment-strategy.md` | Se deploys em produção (rolling/blue-green/canary). |
| [`capacity-planning.template.md`](./capacity-planning.template.md) | `docs/operacao/capacity-planning.md` | Se serviço crítico (forecast, auto-scaling, custo/unit). |
| [`performance-testing.template.md`](./performance-testing.template.md) | `docs/operacao/performance-testing.md` | Se serviço crítico (load/stress/soak/spike). |

### C9 — Harness do agente IA

#### C9a — Defesa universal (pre-commit + CI)
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`pre-commit-config.template.yaml`](./pre-commit-config.template.yaml) | `/.pre-commit-config.yaml` | **Sempre.** Defesa real, multiplataforma, funciona em qualquer harness. |

#### C9b — Adendos por harness
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`settings.template.json`](./settings.template.json) | `.claude/settings.json` | Se usa Claude Code. |
| [`hook-block-destructive.template.sh`](./hook-block-destructive.template.sh) | `.claude/hooks/block-destructive.sh` | Claude Code. UX/defesa em profundidade. |
| [`hook-anti-mascaramento.template.sh`](./hook-anti-mascaramento.template.sh) | `.claude/hooks/anti-mascaramento.sh` | Claude Code. Impede skip/baseline. |
| [`hook-frontmatter-validator.template.sh`](./hook-frontmatter-validator.template.sh) | `.claude/hooks/frontmatter-validator.sh` | Claude Code. Valida frontmatter + staleness. |
| [`hook-override-ledger.template.sh`](./hook-override-ledger.template.sh) | `.claude/hooks/override-ledger.sh` | Claude Code (PreToolUse). Registra overrides com `$USER`+timestamp (não apaga o arquivo). |
| [`hook-override-consume.template.sh`](./hook-override-consume.template.sh) | `.claude/hooks/override-consume.sh` | Claude Code (PostToolUse). Apaga `.claude/.override-reason` após o comando executar (uso único). |
| [`hook-secrets-scanner.template.sh`](./hook-secrets-scanner.template.sh) | `.claude/hooks/secrets-scanner.sh` | Claude Code. Bloqueia segredos + PII brasileira (CPF/CNPJ/telefone). |
| [`hook-doc-line-counter.template.sh`](./hook-doc-line-counter.template.sh) | `.claude/hooks/doc-line-counter.sh` | Claude Code. Enforce `limite-linhas` do frontmatter. |
| [`hook-staleness-checker.template.sh`](./hook-staleness-checker.template.sh) | `.claude/hooks/staleness-checker.sh` | Claude Code (SessionStart). Warning em docs críticos com `revisado-em` > 365 dias. |
| [`hook-check-deps.template.sh`](./hook-check-deps.template.sh) | `.claude/hooks/check-deps.sh` | Claude Code (SessionStart). Verifica `jq`/`bash` (importante em Windows nativo). |
| [`hook-inject-context.template.sh`](./hook-inject-context.template.sh) | `.claude/hooks/inject-context.sh` | Claude Code (UserPromptSubmit). Injeta lembrete de INV-AGENT-003/004/010 a cada turno. |
| [`hook-phase-gate.template.sh`](./hook-phase-gate.template.sh) | `.claude/hooks/phase-gate.sh` | Claude Code. Bloqueia escrita em `src/` enquanto `docs/descoberta/sintese-final.md` não estiver `stable` e ADR-0001 não estiver `aceita`. Override via `.claude/.override-reason`; bypass total via `.claude/.phase-gate-disabled` (experimento/solo). |
| [`hook-no-verify-bypass.template.sh`](./hook-no-verify-bypass.template.sh) | `.claude/hooks/no-verify-bypass.sh` | Claude Code. Bloqueia `--no-verify`, `-c core.hooksPath=`, `HUSKY=0`, `SKIP=...`. |
| [`hook-auditor-commit-hygiene.template.sh`](./hook-auditor-commit-hygiene.template.sh) | `.claude/hooks/auditor-commit-hygiene.sh` | Claude Code. Warn em `git add .` cego e commit misturando áreas. |

> **Ativação no destino:** o `bootstrap.sh` na raiz deste meta-template copia 15 hooks, remove sufixo `.template`, e dá `chmod +x`. O `settings.json` ativa 13 deles por padrão. Após o bootstrap, **reinicie o Claude Code apontando para a pasta do projeto destino** para que `settings.json` seja carregado e os hooks comecem a rodar. A primeira sessão (que executou o bootstrap) NÃO tem hooks ativos — é o paradoxo do bootstrap, esperado.

#### C9c — Hooks opt-in (não ativos por padrão)

Hooks adicionais documentados em `matriz-harness.md §1.1`. São copiados pelo bootstrap, mas não entram em `settings.template.json` padrão. Ativar projeto a projeto.

| Arquivo | Destino | Quando usar |
|---|---|---|
| [`hook-pre-edit-evidence.template.sh`](./hook-pre-edit-evidence.template.sh) | `.claude/hooks/pre-edit-evidence.sh` | INV-AGENT-003. Warn em edição de lógica de negócio sem leitura prévia. Útil em SaaS regulado/financeiro. |
| [`hook-post-claim-evidence.template.sh`](./hook-post-claim-evidence.template.sh) | `.claude/hooks/post-claim-evidence.sh` | INV-AGENT-005. Warn ao fim de turno em afirmações "pronto/implementado" sem evidência. Requer `.claude/transcripts/`. |

### C10 — Convenções e índice
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`CONVENCOES-DOC.template.md`](./CONVENCOES-DOC.template.md) | `docs/CONVENCOES-DOC.md` | Sempre. Ler ANTES de criar qualquer arquivo. |
| [`INDICE.template.md`](./INDICE.template.md) | `docs/INDICE.md` | Sempre. |
| [`documentos-do-projeto.template.md`](./documentos-do-projeto.template.md) | `docs/documentos-do-projeto.md` | Sempre. |
| [`nao-aplica.template.md`](./nao-aplica.template.md) | `docs/nao-aplica.md` | Sempre (camadas que não se aplicam ao projeto). |

### C11 — Estado vivo
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`constitution.template.md`](./constitution.template.md) | `.claude/memory/constitution.md` | Sempre. Princípios fundadores. |
| [`CURRENT.template.md`](./CURRENT.template.md) | `.agent/CURRENT.md` | Sempre. Atualizar toda sessão que muda foco. |

### C12 — Comunidade (projetos open-source / comunidade grande)
| Arquivo | Destino | Quando usar |
|---|---|---|
| [`rfc.template.md`](./rfc.template.md) | `docs/comunidade/rfcs/RFC-NNNN-<slug>.md` | Por proposta pública/colaborativa. |
| [`governanca-comunidade.template.md`](./governanca-comunidade.template.md) | `docs/comunidade/governanca.md` | Se projeto tem comunidade externa (papéis, votação, eleição de maintainer). |

### Exemplos pré-preenchidos (referência)

Exemplos fim-a-fim do estado final esperado após aplicar o método. Use como referência ao classificar o tipo de projeto destino.

| Pasta | Caso |
|---|---|
| [`exemplos/cli-rust-solo/`](./exemplos/cli-rust-solo/) | CLI Rust solo, sem LGPD, sem multi-tenant. Modo enxuto. |
| [`exemplos/saas-python-regulado/`](./exemplos/saas-python-regulado/) | SaaS B2B multi-tenant Python/FastAPI, LGPD, time pequeno. Regime completo. |
| [`exemplos/lib-typescript/`](./exemplos/lib-typescript/) | Biblioteca npm TypeScript dual ESM+CJS, OSS, sem LGPD. |

## Como o agente IA usa

1. **Lê o manual principal** ([`../ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`](../ESTRUTURA-PROJETO-NOVO-DO-ZERO.md)) pra entender método e fluxo.
2. **Lê `CONVENCOES-DOC.template.md`** antes de criar qualquer arquivo — política de nomenclatura aplica a tudo.
3. **Decide quais templates aplicar** pelo tipo de projeto (Seção 15 do manual + tabela de matriz em §19).
4. **Copia o template** pro destino correto da tabela acima.
5. **Renomeia** removendo `.template`.
6. **Substitui placeholders** `<...>` pelos dados do projeto.
7. **Remove comentários** `<!-- template: ... -->` do topo (são metadados pro agente, não pro projeto destino).

## Templates faltantes

Quando um documento descrito no manual ainda não tem template (`MAINTAINERS.md`, `release-process.md`, etc.), o agente IA cria o arquivo seguindo a descrição do manual e propõe um template novo aqui para reuso futuro.
