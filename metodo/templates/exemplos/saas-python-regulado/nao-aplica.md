---
owner: roldao
revisado-em: 2026-05-27
idioma: pt-BR
status: stable
limite-linhas: 120
proposito: registrar o que o conciliab deliberadamente NAO faz da estrutura canonica, com gatilho de reavaliacao concreto
---

<!--
arquivo: nao-aplica.md (preenchido no exemplo saas-python-regulado)
proposito: como projeto regulado em REGIME COMPLETO, quase tudo aplica - a lista e curta.
-->

# Nao aplica — conciliab

> O que este projeto deliberadamente NAO faz da estrutura canonica, e quando reavaliar.

## Regras de uso

- **Toda entrada exige evidencia concreta.**
- **Toda entrada exige `revalidacao-em`** (data concreta).
- **Toda entrada exige `responsavel-revalidacao`**.
- Gatilho de reavaliacao deve ser **evento observavel**.
- `auditor-doc-quality` le este arquivo: o que esta aqui nao gera finding; o que esta faltando gera.

## Tabela de excecoes

| Camada / Artefato | Nao aplica porque | Evidencia | Responsavel revalidacao | Revalidacao em | Reavaliar quando |
|---|---|---|---|---|---|
| C5 / `docs/i18n/` | Produto monolingue PT-BR para PME brasileira; cliente fora do Brasil nao esta no pipeline. | UI strings em PT-BR no `conciliab-web` (repo separado); ADR-0001 documenta escopo Brasil-only; sa-east-1 e a unica regiao. | Roldao | 2027-02-28 | Cliente fora do Brasil entrar no pipeline, ou expansao para Mercosul aprovada. |
| C9b / arquivo `.cursorrules` | Time pequeno (3 devs) usa exclusivamente Claude Code como harness de IA. | `.claude/` e o unico diretorio de harness no repo; `pyproject.toml` nao referencia Cursor; survey interna 2026-04-15 confirmou ferramenta unica. | Ana Silva | 2027-04-15 | Dev novo entrar usando Cursor, ou survey trimestral mostrar uso de outro editor. |
| C9b / arquivo `.windsurfrules` | Mesmo motivo do `.cursorrules` acima — time padronizado em Claude Code. | Mesma evidencia (survey 2026-04-15). | Ana Silva | 2027-04-15 | Mesmo gatilho do `.cursorrules`. |
| C9b / `kiro-steering` | Mesmo motivo — nao usamos Kiro como harness. | Mesma evidencia (survey 2026-04-15). | Ana Silva | 2027-04-15 | Adocao de Kiro pelo time. |
| C8 / on-call 24/7 com pager dedicado | Time tem 3 devs e produto esta em beta privado (sem SLA contratual de 24/7). Cobertura horario comercial PT-BR + best-effort fora cobre o caso atual. SLO 99,5% mensal permite janela noturna. | [`docs/operacao/slo-sli.md`](./docs/operacao/slo-sli.md) define 99,5%/mes; ADR-0001 §Operacao documenta postura; [`docs/operacao/on-call.md`](./docs/operacao/on-call.md) descreve postura best-effort; contrato beta com 3 clientes-piloto nao define SLA externo. | Ana Silva | 2026-11-30 | Sair de beta para self-service publico; OU 1 incidente noturno por mes durante 3 meses consecutivos; OU cliente enterprise demandar SLA 24/7. |
| C12 / `docs/comunidade/rfcs/` + governanca de comunidade | Produto e fechado (SaaS proprietario), nao open-source. Decisoes arquiteturais usam ADR em `docs/adr/`, nao RFC publica. | `README.md` declara licenca "Proprietary"; `pyproject.toml` `license = "Proprietary"`; repo GitHub e privado. | Roldao | 2027-05-27 | Decisao de abrir codigo-fonte (ex: matcher de conciliacao como OSS para captacao tecnica) — exige ADR + revisao juridica completa. |
| C7 / `model-card.md` + `data-card.md` | Conciliab nao usa modelo de IA/ML em producao. Matcher de conciliacao e heuristica deterministica (regras + fuzzy string matching `rapidfuzz`), nao ML. | `pyproject.toml` nao tem `scikit-learn`, `torch`, `transformers`; `conciliab/financas/conciliacao/matcher.py` e codigo procedural. | Ana Silva | 2027-05-27 | Adocao de modelo ML para matching (ex: bert para categorizacao de transacao). |
| C4 / `data-contract.md` | Sem produtor/consumidor interno separado por contrato versionado. Fila Celery e consumo interno do mesmo monolito (mesmo schema Python). | `conciliab/financas/conciliacao/tasks.py` declara `@celery_app.task` consumido pelos workers do mesmo deployment, mesma versao. | Diego Tavares | 2026-11-30 | Quebra do monolito em servico separado (ex: extraco-bancario-parser); OU consumidor externo (ERP do cliente puxa eventos via webhook). |
| C1 / `jornadas.md`, `business-model-canvas.md`, `value-proposition-canvas.md`, `concorrentes.md` (artefato dedicado), `riscos.md` (artefato dedicado), `restricoes.md`, `hipoteses-a-validar.md` (artefato dedicado), `dados-existentes.md`, `integracoes-externas.md`, `gtm-pricing.md` | Conteudo essencial vive em `docs/descoberta/problema.md`, `personas.md`, `nao-fazer.md`, `metricas-chave.md`, `sintese-final.md` (5 arquivos preenchidos). Os outros 10 ficam como divida documentada — exemplo ilustrativo, nao produto real. | `docs/descoberta/sintese-final.md` §11 lista os pendentes. | Roldao | 2027-05-27 | Promover este projeto-exemplo para projeto real (sair do `templates/exemplos/`); OU completar o exemplo conforme houver tempo. |

## Historico (camadas reativadas)

| Camada | Data reativacao | Motivo (gatilho que disparou) |
|---|---|---|
| (vazio — projeto ainda jovem) | | |

---

> **Link bidirecional:** revisar este NAO-APLICA na data de `revalidacao-em` —
> se o gatilho mudou ou a evidencia envelheceu, reabrir o doc original e mover
> a linha para o historico acima.
