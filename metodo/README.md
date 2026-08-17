---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: README da camada metodo/ do ROLDAO-METHOD.
---

# metodo/ — Método canônico para projetos do zero

Esta camada do ROLDAO-METHOD é o **método canônico** que agentes IA (Claude Code, Cursor, Windsurf, Codex CLI, Kiro) seguem para construir a **estrutura documental completa** de qualquer projeto de software novo, **antes da primeira linha de código**.

Não é um framework (= ferramenta pronta com regras embutidas), não é um boilerplate (= código de exemplo pronto pra copiar) e não é um gerador (= robô que cria o projeto sozinho). É um **manual + templates + matriz de compatibilidade + glossário** que o agente IA lê, classifica o projeto e materializa no repositório de destino.

> Dono não-técnico? Comece pelo [GLOSSARIO-ROLDAO.md](GLOSSARIO-ROLDAO.md) — traduz todo o jargão usado abaixo.

## Hierarquia de fonte de verdade (qual doc edito primeiro?)

Quando agente ou humano abre um projeto gerado a partir deste modelo e há conflito ou dúvida sobre "qual regra prevalece", esta é a ordem fixa:

1. **`<repo-destino>/.claude/memory/constitution.md`** — princípios fundadores do projeto. Não muda fácil. Vence todos os demais. (Fica em `.claude/memory/` por convenção do Claude Code; outros harnesses leem via `additionalDirectories`.)
2. **`<repo-destino>/REGRAS-INEGOCIAVEIS.md`** — invariantes INV-* (segurança, processo). Vence AGENTS/CLAUDE.
3. **`<repo-destino>/AGENTS.md`** — contrato compartilhado entre todos os harnesses (Claude Code, Cursor, Windsurf, Codex, Kiro). Vence os arquivos de harness específico.
4. **`<repo-destino>/CLAUDE.md`** + `.cursorrules` + `.windsurfrules` + `.kiro/steering/*` — instruções de cada harness. São o mais específico, têm menos peso.
5. **`<repo-destino>/.agent/CURRENT.md`** — estado atual do trabalho (foco da sessão, último T concluído, próximo passo). **Canônico, cross-harness.** Não existe `.claude/memory/CURRENT.md` — para evitar drift entre duas cópias do mesmo estado. Claude Code lê de `.agent/` via `additionalDirectories` em `settings.json`.

`ESTRUTURA-PROJETO-NOVO-DO-ZERO.md` neste repo modelo é fonte de verdade do **método** (como se constrói um projeto novo). Não é regra do projeto-destino — ela é renderizada nos arquivos acima.

### Duas fontes de verdade que não se confundem

- **Fonte de MÉTODO (este repositório):** o agente lê `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md` como instrução canônica de *como construir* um projeto novo. Vale só enquanto o agente está aqui dentro, materializando outro projeto. Esta pasta nunca é editada como produto.
- **Fontes de verdade do projeto-destino (a lista numerada acima):** valem dentro do repositório que o método cria. Quando há conflito de regra *lá*, a ordem `constitution → REGRAS-INEGOCIAVEIS → AGENTS → CLAUDE/harness → CURRENT` decide.

Em uma frase: o manual deste repo diz *como fazer*; os arquivos do projeto-destino dizem *o que vale no projeto pronto*. Um não sobrepõe o outro — vivem em pastas diferentes.

> **Windows + Git Bash:** este modelo é desenvolvido e validado em Windows 11 com Git Bash (MSYS2). Pré-requisitos práticos: Git Bash, `jq` e `python3`. Hooks, paths e comandos seguem essa premissa. Detalhes de compatibilidade: `matriz-harness.md §6`.

## O que tem aqui

- **`ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`** — manual canônico. Fonte única da verdade do método. Cobre:
  - **Foundations** (capacidades transversais — login, multi-tenant, observabilidade — que vêm antes de qualquer funcionalidade).
  - **Fase** (cada etapa numerada do roteiro, com kickoff e gates próprios).
  - **Marco** (ponto de fechamento de uma fase, exige PASS ZERO para passar).
  - **PASS ZERO** (critério inegociável: zero achados CRÍTICO, ALTO ou MÉDIO em aberto para fechar marco).
  - **Invariante** (regra que nunca pode ser violada no sistema, com ID estável tipo INV-NNN).
  - **Auditor** (especialista automatizado que revisa um aspecto específico e devolve achados com severidade — não é humano).
  - **Ritual** (sequência obrigatória de passos antes/depois de cada marco).
- **`matriz-harness.md`** — contrato detalhado de comportamento do **Claude Code** (eventos × matchers × hooks × decisão × severidade). É o espelho de `templates/settings.template.json`.
- **`matriz-multi-harness.md`** — visão **cross-harness** (compatibilidade de features entre Claude Code, Cursor, Windsurf, Codex CLI, Kiro). Use esta quando o projeto-destino mistura múltiplos harnesses.
- **`templates/`** — arquivos copy-paste literal (AGENTS, REGRAS-INEGOCIAVEIS, problema, spec, plan, tasks, settings, auditor, hook, README de produto, runbooks, on-call, retenção, change-management, backup, DR, catálogo de auditores). Placeholders entre `< >` para o agente preencher.
- **`GLOSSARIO-ROLDAO.md`** — jargão técnico do método traduzido para linguagem de dono não-técnico, mais um roteiro de leitura mínima.

> **Duas matrizes, escopos distintos:** `matriz-harness.md` é específica do Claude Code (settings, hooks, permissions). `matriz-multi-harness.md` é a visão lateral entre 5 harnesses. As duas coexistem; nenhuma sobrescreve a outra.

## Como o agente IA usa (ordem canônica)

1. **Lê `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`** por inteiro (manual canônico). Para começar, foca em §0 (visão geral), §15 (árvore de decisão por tipo de projeto) e §14.15 (modo enxuto para projetos pequenos). A §22 é só uma referência rápida para projeto micro (≤2 dias descartável) — atalho de exceção, **não** o ponto de partida padrão; só caia nela depois de a árvore §15 classificar o projeto como micro/descartável.
2. **Pergunta só o nome do projeto** se ainda faltar. Não pergunta stack, regulação, equipe ou prazo no kickoff — isso sai da Descoberta (C1).
3. **Classifica o projeto destino** pela árvore de decisão (§15): SaaS multi-tenant, CLI, biblioteca, app desktop/mobile, IA/ML, embedded, pipeline de dados, projeto pessoal enxuto.
4. **Consulta `matriz-harness.md`** (se Claude Code) ou **`matriz-multi-harness.md`** (se multi-harness) para decidir onde cada regra crítica entra: pre-commit git + CI = universal; hook de harness = UX.
5. **Lê `templates/exemplos/<tipo>/`** se existir um exemplo pré-preenchido para a classe identificada. Esses exemplos são o estado-final-esperado.
6. **Decide o conjunto de templates** a copiar (matriz §19 do manual + tabela em `templates/README.md`). Registra as camadas puladas em `docs/nao-aplica.md` com justificativa + gatilho de reavaliação.
7. **Copia** do `templates/` apenas os arquivos pertinentes. Remove sufixo `.template`. Remove comentários `<!-- template: ... -->` do topo.
8. **Preenche os placeholders** (`<NomeDoProjeto>`, `<dominio>`, `<YYYY-MM-DD>`, etc.) com dados reais.
9. **Roda o ritual de PASS ZERO** (zero achados CRÍTICO/ALTO/MÉDIO em aberto) antes de fechar o marco Foundation-0 do novo projeto.
10. **Atualiza `.agent/CURRENT.md`** apontando para a próxima fase. Continua para o `kickoff-fase.md` da fase 1.

## Público-alvo

- **Dono não-técnico** — lê `GLOSSARIO-ROLDAO.md`, depois as seções **1, 2, 5 e 11** do `AGENTS.md` do projeto destino (visão, princípios, comunicação, decisões que exigem o dono) e o `REGRAS-INEGOCIAVEIS.md` do projeto destino. Não precisa ler o manual inteiro.
- **Agente IA** — lê tudo. Manual + matriz + todos os templates. É a única forma de aplicar o método sem deriva.
- **Contributor externo (humano técnico)** — lê este README + `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`. Para contribuir com regra/auditor novo, abre PR no manual e justifica.

## Estrutura do repositório

```
metodo/
├── README.md                          (você está aqui)
├── AGENTS.md                          contrato cross-harness (todos os agentes)
├── CLAUDE.md                          adendo específico do Claude Code
├── QUICKSTART.md                      entrada curta — iniciar projeto em 2 fases
├── ESTRUTURA-PROJETO-NOVO-DO-ZERO.md  manual canônico
├── matriz-harness.md                  compatibilidade entre harnesses
├── matriz-multi-harness.md            visão cross-harness (Claude Code, Cursor, Windsurf, Codex, Kiro)
├── GLOSSARIO-ROLDAO.md                jargão para dono não-técnico
├── bootstrap.sh                       fase-1 — descoberta-first (C0+C1+C9+esqueletos)
├── bootstrap-fase-2.sh                fase-2 — conformidade/operação (C5+C6+C8+C12)
└── templates/
    ├── README.md                          catálogo dos templates
    ├── README.template.md                 README do projeto destino
    ├── AGENTS.template.md
    ├── CLAUDE.template.md
    ├── cursorrules.template               .cursorrules (se usa Cursor)
    ├── windsurfrules.template             .windsurfrules (se usa Windsurf)
    ├── kiro-steering.template.md          .kiro/steering/00-agents.md (se usa Kiro)
    ├── CONTRIBUTING.template.md
    ├── SECURITY.template.md
    ├── MAINTAINERS.template.md
    ├── REGRAS-INEGOCIAVEIS.template.md
    ├── CHECKLIST-PRONTO-PRA-CODAR.template.md
    ├── INDICE.template.md
    ├── CONVENCOES-DOC.template.md
    ├── documentos-do-projeto.template.md
    ├── glossario.template.md
    ├── nao-aplica.template.md
    ├── constitution.template.md
    ├── CURRENT.template.md
    ├── ADR.template.md                    docs/adr/ADR-NNNN-<slug>.md
    ├── problema.template.md               docs/descoberta/ (C1 — descoberta-first)
    ├── personas.template.md               · jornadas · business-model-canvas
    ├── value-proposition-canvas.template.md · gtm-pricing · concorrentes
    ├── mercado-regulatorio.template.md    · nao-fazer · riscos · restricoes
    ├── hipoteses-a-validar.template.md    · metricas-chave · dados-existentes
    ├── integracoes-externas.template.md   · sintese-final  (16 esqueletos C1)
    ├── spec.template.md
    ├── plan.template.md
    ├── tasks.template.md
    ├── revisao.template.md
    ├── data-contract.template.md          docs/dominios/<dom>/contratos/<contrato>.md
    ├── model-card.template.md             docs/dominios/ia/modelos/<modelo>/model-card.md (se IA/ML)
    ├── data-card.template.md              docs/dominios/ia/datasets/<dataset>/data-card.md (se IA/ML)
    ├── kickoff-fase.template.md          (fase de produto F-N)
    ├── kickoff-foundation.template.md     (foundation F-A/B/C — transversal)
    ├── finalizacao-fase.template.md       (gate de saída PASS ZERO)
    ├── ropa.template.md
    ├── retencao-dados.template.md         docs/conformidade/lgpd/retencao-dados.md
    ├── direitos-do-titular.template.md    docs/conformidade/lgpd/direitos-do-titular.md
    ├── dpo-action-plan.template.md        docs/conformidade/lgpd/dpo-action-plan.md
    ├── aipd.template.md                   docs/conformidade/lgpd/aipd.md
    ├── atender-pedido-eliminacao-runbook.template.md
    ├── threat-model.template.md           docs/seguranca/threat-model.md
    ├── dependency-policy.template.md      docs/seguranca/dependency-policy.md
    ├── criptografia-policy.template.md    docs/seguranca/criptografia-policy.md
    ├── key-management-policy.template.md  docs/seguranca/key-management-policy.md
    ├── resposta-incidente.template.md     docs/seguranca/resposta-incidente.md
    ├── auditor.template.md
    ├── catalogo-auditores.template.md     docs/governanca/catalogo-auditores.md
    ├── runbook.template.md
    ├── post-mortem.template.md
    ├── slo-sli.template.md
    ├── on-call.template.md                docs/operacao/on-call.md
    ├── backup.template.md                 docs/operacao/backup.md
    ├── disaster-recovery.template.md      docs/operacao/disaster-recovery.md
    ├── change-management.template.md      docs/operacao/change-management.md
    ├── observabilidade.template.md        docs/operacao/observabilidade.md
    ├── release-process.template.md        docs/operacao/release-process.md
    ├── deployment-strategy.template.md    docs/operacao/deployment-strategy.md
    ├── capacity-planning.template.md      docs/operacao/capacity-planning.md
    ├── performance-testing.template.md    docs/operacao/performance-testing.md
    ├── rfc.template.md                    docs/comunidade/rfcs/RFC-NNNN-<slug>.md
    ├── governanca-comunidade.template.md  docs/comunidade/governanca.md
    ├── maestro.template.md                .claude/agents/maestro.md (orquestrador do ciclo)
    ├── gitignore.template                 .gitignore (universal)
    ├── pre-commit-config.template.yaml    .pre-commit-config.yaml (universal)
    ├── settings.template.json             .claude/settings.json (Claude Code)
    ├── hook-block-destructive.template.sh
    ├── hook-anti-mascaramento.template.sh
    ├── hook-frontmatter-validator.template.sh
    ├── hook-override-ledger.template.sh
    ├── hook-secrets-scanner.template.sh
    ├── hook-doc-line-counter.template.sh
    ├── hook-staleness-checker.template.sh
    ├── hook-check-deps.template.sh
    ├── hook-inject-context.template.sh
    ├── hook-phase-gate.template.sh
    ├── hook-no-verify-bypass.template.sh
    ├── hook-auditor-commit-hygiene.template.sh
    ├── hook-override-consume.template.sh          (PostToolUse — consome override de uso único)
    ├── hook-pre-edit-evidence.template.sh         (opt-in, INV-AGENT-003)
    ├── hook-post-claim-evidence.template.sh       (opt-in, INV-AGENT-005)
    └── exemplos/                          casos fim-a-fim pré-preenchidos
        ├── cli-rust-solo/                 CLI Rust solo, modo enxuto
        ├── saas-python-regulado/          SaaS B2B regulado, regime completo
        └── lib-typescript/                Biblioteca npm OSS
```

> **A árvore acima é um mapa resumido, não o catálogo completo.** A fonte única e sempre atualizada (todos os ~90 templates por camada C0–C12, com destino de cada um) é [`templates/README.md`](./templates/README.md) — consulte-o ao copiar templates. Se adicionar um template novo, atualize o catálogo lá; esta árvore lista só os principais.

## Princípio

O método não força ferramenta, linguagem ou framework. Força **estrutura documental** (problema → spec → plan → tasks → auditoria → marco) e **invariantes inegociáveis** (PASS ZERO C/A/M, golden cases por auditor, causa-raiz acima do sintoma). Stack é decisão do projeto destino, não desta meta-estrutura.
