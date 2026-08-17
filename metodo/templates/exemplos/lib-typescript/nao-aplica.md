---
owner: roldao
revisado-em: 2026-05-27
idioma: pt-BR
status: stable
limite-linhas: 80
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: nao-aplica.md — projeto @conciliab/csv-parser
proposito: registrar o que este projeto deliberadamente NÃO faz da estrutura canônica.
-->

# Não aplica — @conciliab/csv-parser

> O que este projeto deliberadamente NÃO faz da estrutura canônica, e quando reavaliar.

## Regras de uso

- **Toda entrada exige evidência concreta.** Justificativa textual sozinha não basta — precisa link para schema, ADR, screenshot, configuração, ou outro artefato que prove a ausência.
- **Toda entrada exige `revalidacao-em` (data concreta).** Nenhuma exceção fica "pra sempre".
- **Toda entrada exige `responsavel-revalidacao`** — quem confere na data.
- Gatilho de reavaliação deve ser **evento observável**, não "talvez no futuro".
- Quando o gatilho disparar OU `revalidacao-em` vencer, mover a linha pra histórico e implementar a camada (ou justificar nova entrada com novo prazo).

## Tabela de exceções

| Camada / Artefato | Não aplica porque | Evidência | Responsável revalidação | Revalidação em | Reavaliar quando |
|---|---|---|---|---|---|
| C6 / `docs/lgpd/` (ROPA, plano de incidente, DPO) | Biblioteca pura — não persiste, não loga, não transmite dado pessoal. Quem chama é responsável pelo tratamento LGPD do extrato. Risco LGPD da própria lib = zero. | Assinaturas em `src/index.ts` aceitam `string \| Uint8Array` e devolvem `Transacao[]`. Zero `import` de `node:fs`, `node:net`, `node:http` em `src/` (verificado pelo hook `purity-check.sh`). ADR-0001 documenta. | roldao | 2026-11-27 | Lib passar a oferecer função de I/O (ex: `parseFromFile(path)`) OU adicionar telemetria/logging. |
| C8 / `docs/operacao/runbooks/`, on-call, SLO, dashboards de produção | Biblioteca, não serviço hospedado. Não temos servidor, não temos uptime, não temos cliente conectado a uma instância nossa. Resposta a incidente em lib = publicar patch no npm e avisar via release notes. | `package.json → type: "module"` + ausência de `bin/`, `Dockerfile`, `helm/`, `k8s/`. Repo não tem ambiente de produção. | roldao | 2026-11-27 | Projeto passar a oferecer serviço hospedado (ex: API SaaS de parsing). |
| C8b / SLA de uptime, monitoring de latência, métricas Prometheus | Mesma razão do C8 — não há serviço pra monitorar. SLA da lib se resume a "responder report de bug em 72h" (em `SECURITY.md`). | `SECURITY.md` define SLA de **resposta a vulnerabilidade**, não de uptime. | roldao | 2026-11-27 | Mesmo gatilho do C8. |
| C9b / arquivo `.cursorrules`, `.continuerc` | Projeto usa apenas Claude Code como harness de IA. | `.claude/` é o único diretório de harness no repo; `package.json` não referencia Cursor/Continue. | roldao | 2026-11-27 | Contribuidor externo entrar no projeto usando Cursor/Continue como ferramenta principal. |
| C5 / `docs/i18n/` (internacionalização) | Documentação do projeto em PT-BR; mensagens de erro da lib em **inglês** (compatibilidade com comunidade OSS internacional). Sem plano de localização. | `README.md` em PT-BR; strings de erro em `src/` em inglês (ex: `throw new Error('Invalid OFX header')`). | roldao | 2026-11-27 | Demanda de comunidade não-anglófona não-brasileira (espanhol, francês) por mensagens localizadas. |
| C0 / `docs/glossario.md` arquivo separado | Lib pequena — glossário inline em `CONTRIBUTING.md §0` (12 termos técnicos do fluxo OSS) + tabela canônica de tradução em `REGRAS-INEGOCIAVEIS.md §2.A` (24 termos). Total ≥ 20 conforme exigido pelo checklist. | `CONTRIBUTING.md §0` + `REGRAS-INEGOCIAVEIS.md §2.A` somam 36 entradas. | roldao | 2026-11-27 | Lib passar de 10 contribuidores externos ativos OU surgir domínio específico (regulação bancária) que justifique glossário separado. |
| C0 / `docs/PRD.md` | Lib pequena, único módulo (`parser`). PRD substituído por §1 do `AGENTS.md` (identidade do produto) + `docs/dominios/core/modulos/parser/spec.md`. Manter PRD separado com 1 módulo é cerimônia vazia. | `AGENTS.md §1` define escopo, cliente piloto, modelo de negócio. `spec.md` define US e ACs. | roldao | 2026-11-27 | Lib adquirir 2+ módulos com domínios distintos (ex: módulo `parser` + módulo `validator`). |
| Núcleo de hooks: `frontmatter-validator`, `override-ledger.sh` | Lib pequena com 1 mantenedor. Hooks de validação de frontmatter e override-ledger têm custo de implementação alto e ROI baixo nesta escala (revisão visual em PR é suficiente com 1 reviewer humano). Hooks núcleo de **segurança** (`block-destructive`, `secrets-scanner`, `anti-mascaramento`) estão ativos. | `.husky/pre-commit` lista os 3 hooks de segurança ativos. ADR não foi feita pra esta exceção (avaliar criar). | roldao | 2026-08-27 | 5+ contribuidores externos ativos no repo OU primeira violação manual de frontmatter ou override não registrado. |
| Auditores customizados em `.claude/agents/` (≥5 com golden cases) | Projeto solo, comunidade pequena. Usamos skills embutidas do Claude Code (`code-review`, `security-review`) para review de diff e auditoria de segurança antes de release. Criar auditores customizados antes da demanda real é over-engineering. | `.claude/agents/` ausente. CI roda `code-review` skill em cada PR via GitHub Action experimental. | roldao | 2026-11-27 | 5+ contribuidores externos ativos OU 2+ incidentes de qualidade em 6 meses que skills embutidas não pegaram. |
| `.mcp.json` + `docs/governanca/politica-mcp.md` | Projeto não usa nenhum MCP (Model Context Protocol). Toda interação IA é via skills embutidas do Claude Code. | `.mcp.json` ausente; `package.json` não tem dependência `@modelcontextprotocol/*`. | roldao | 2026-11-27 | Adoção de MCP server (ex: para acessar specs OFX/CNAB externas durante desenvolvimento). |
| `kickoff-fase.md` para F-1 | Lib pequena, fase 1 = MVP do parser. O conteúdo de um kickoff-fase formal (escopo da fase, ACs prioritários, riscos) já está distribuído em `spec.md`, `plan.md` e `tasks.md` do módulo `parser`. Replicar = duplicação. | `docs/dominios/core/modulos/parser/{spec,plan,tasks}.md` cobre o escopo de F-1 integralmente. | roldao | 2026-08-27 | Iniciar F-2 (adicionar segundo módulo) — aí kickoff faz sentido pra delimitar escopo entre módulos. |
| `docs/testes/estrategia.md` arquivo separado | Lib pequena, estratégia de teste documentada inline em `CONTRIBUTING.md §6` (gates) + `AGENTS.md §6` (comandos) + `plan.md → Testes 1:1 com ACs`. Estratégia: vitest unitário + snapshots golden + matriz Node/Deno/Bun no CI. | Trinca de arquivos acima. | roldao | 2026-11-27 | Lib adquirir testes E2E ou integração com I/O real (improvável — viola INV-PARSER-001). |
| C12 / `docs/comunidade/rfcs/` + `docs/comunidade/governanca.md` | Projeto **solo** (ver `MAINTAINERS.md §1`). Fluxo de decisão é PR + ADR — sem necessidade de RFC público nem de estrutura de eleição/votação/papéis comunitários. Adicionar essas camadas antes da demanda real é cerimônia vazia. | `MAINTAINERS.md` lista 1 mantenedor; `docs/adr/` é o fluxo de decisão (5 ADRs ativas). | roldao | 2026-11-27 | Adicionar 2º mantenedor ativo (gatilho em `MAINTAINERS.md §5`) OU receber > 5 PRs externos/mês em média por 3 meses consecutivos — aí RFC + governança comunitária passam a fazer sentido. |
| C4 / `docs/dominios/<dom>/contratos/<contrato>.md` (data-contract) | Lib **pura** sem contrato produtor↔consumidor de eventos/APIs internas. A única superfície de contrato é a API pública exportada em `src/index.ts`, governada por `ADR-0003` (SemVer estrito) + `api-extractor` (auditoria mecânica). Não há fluxo de mensagens, evento ou schema entre serviços. | `src/index.ts` é fronteira única; `package.json → exports` impede consumidor de acoplar em path interno; `api-check` no CI compara `.d.ts` com baseline. | roldao | 2026-11-27 | Lib passar a expor formato serializado estável (ex: salvar `Transacao[]` em JSON com schema versionado consumido por outro serviço) — aí `data-contract.md` fixa o schema e regra de evolução. |
| C6 / `docs/conformidade/lgpd/ropa.md` + `docs/conformidade/lgpd/retencao-dados.md` | Biblioteca pura — não persiste, não loga, não transmite. Já tratado em `AGENTS.md §12` e na entrada C6 (`docs/lgpd/`) acima desta tabela. Repetimos aqui por completude do índice canônico C6 do método. ROPA e retenção são responsabilidade de quem **chama** a lib. | Mesma evidência da entrada C6 anterior (assinaturas em `src/index.ts`, zero imports de I/O em `src/`); `AGENTS.md §12` formaliza. | roldao | 2026-11-27 | Mesmo gatilho da entrada C6 anterior: lib passar a oferecer função de I/O OU telemetria/logging. |

<!-- Adicionar uma linha por camada/artefato pulado. NUNCA pular sem registrar aqui. -->

## Histórico (camadas reativadas)

<!-- Quando uma camada antes "não aplica" passa a aplicar, registrar aqui em vez de apagar. -->

| Camada | Data reativação | Motivo (gatilho que disparou) |
|---|---|---|
| _(vazio — projeto recém-criado)_ | | |

---

> **Link bidirecional:** revisar este NÃO-APLICA em cada `revalidacao-em` listada acima — se o gatilho mudou ou a evidência envelheceu, reabrir o doc original (LGPD, glossário, etc.) e mover a linha para o histórico.
