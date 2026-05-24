---
owner: tech-lead
revisado-em: 2026-05-24
status: aceito
decidido-em: 2026-05-24
decidido-por: Roldao Batista (dono do produto)
---

# ADR-021 — Flag ROLDAO_METHOD_LEGACY_MARKERS e janela de compatibilidade v2.0.0

> **Decisao aceita em 2026-05-24:** janela de **1 release minor** confirmada pelo Roldao — flag aceita em v2.0.0 e v2.1.0 (~3 meses), removida em v2.2.0. Recomendacao do tech-lead mantida sem ajuste.



## Contexto

A release v2.0.0 (PRD-003) fecha o bypass `touch` em markers de auditor — decisao detalhada em ADR-020. Projetos terceiros que ja instalaram v1.x e dependem do comportamento antigo (marker vazio aprovado) vao travar no primeiro `npx roldao-method update` apos a release se os hooks novos forem hard-block desde o dia 1.

Casos reais conhecidos onde isso vai morder:
- CI de cliente que cria markers via `touch` em pipeline pre-commit (workaround documentado em issues antigas).
- Projetos que rodam `/feature` sem chamar Maestro (LLM principal seguindo `feature.md` antigo, que nao gravava `audit_sha`).
- Repos legados que adotaram ROLDAO-METHOD no meio (`/brownfield`) e tem markers historicos sem JSON.

Sem janela de transicao, atualizar pra v2.0.0 vira incidente em N clientes simultaneos. ADR-016 (Politica de SemVer) ja exige `MIGRATION-vX.md` + pre-release `rc` de 7 dias, mas pre-release nao resolve o problema do dia seguinte ao update — flag de runtime resolve.

## Decisao

Flag de ambiente `ROLDAO_METHOD_LEGACY_MARKERS=1` valida por exatamente 1 release minor (v2.0.0 ate v2.1.0 inclusive). Removida em v2.2.0.

### Comportamento da flag

Quando `ROLDAO_METHOD_LEGACY_MARKERS=1`:
- Marker vazio passa a validacao com warning em PT-BR no statusline e na stderr do hook.
- Marker com JSON malformado passa com warning.
- Marker com `audit_sha` ausente passa com warning.
- Outras validacoes (frontmatter, dependencias de story, etc.) seguem rigorosas — flag cobre so os contratos novos de marker do ADR-020.

Quando `ROLDAO_METHOD_LEGACY_MARKERS` nao esta setada ou `=0`:
- Validacao integral conforme ADR-020. Marker invalido bloqueia.

### Mensagem de warning (PT-BR leiga)

A mensagem mostrada e:

```
Aviso: este projeto esta usando aprovacao antiga (sem audit_sha).
Modo compatibilidade ativo (ROLDAO_METHOD_LEGACY_MARKERS=1).
Vai parar de funcionar em v2.2.0 (~3 meses).

O que fazer:
1. Rodar `npx roldao-method migrate markers` (faz a conversao automatica)
2. Tirar a variavel ROLDAO_METHOD_LEGACY_MARKERS do seu ambiente
3. Rodar `/auditoria` pra gerar markers novos com audit_sha

Documentacao: docs/migrations/MIGRATION-v2.md
```

Aparece no maximo 1x por sessao (hook usa marker `.claude/.runtime/legacy-warning-shown-SESSION` pra deduplicar — nao polui terminal).

### Como o usuario sai da flag

Migracao oferece 2 caminhos, escolha do operador:

**Caminho A — comando explicito (recomendado, default da documentacao):**

`npx roldao-method migrate markers`

Le markers vazios em `.claude/.runtime/`, dispara Modo AUDIT do Maestro pra gerar markers novos validos, deleta antigos. Idempotente.

**Caminho B — auto-migracao no primeiro `npx roldao-method update` pra v2.0.0:**

`update` detecta markers v1 em `.claude/.runtime/`, pergunta 1 vez "Migrar markers antigos? [S/n]". Default `S`. Se aceitar, roda Caminho A automaticamente. Se recusar, seta `ROLDAO_METHOD_LEGACY_MARKERS=1` em `.env.local` do projeto + mostra warning sobre prazo de v2.2.0.

Caminho B e ativado por padrao no `update`. Caminho A fica disponivel pra quem quer rodar manualmente (ex: CI sem terminal interativo, projetos que `update` falhou em detectar).

### Cronograma

| Release | Comportamento |
|---|---|
| v2.0.0 | Flag valida. Default sem flag = validacao integral. `update` oferece auto-migracao (Caminho B). |
| v2.1.0 | Flag valida (ultima release de tolerancia). Warning passa a aparecer em toda sessao (nao mais 1x). `MIGRATION-v2.md` ganha banner urgente. |
| v2.2.0 | Flag removida. Hook ignora `ROLDAO_METHOD_LEGACY_MARKERS` (e nao bloqueia se setada — so para de tratar como bypass). Marker invalido bloqueia sem excecao. |

## Consequencias

**Positivas:**
- Cliente pago de v1.x atualiza pra v2.0.0 sem incidente — flag protege ate ele rodar a migracao.
- Time de suporte tem mensagem PT-BR clara pra mandar pra quem reportar problema apos `update`.
- Caminho B (auto-migracao no `update`) capta a maioria dos casos sem o operador precisar saber que existe flag — Roldao-leigo nao precisa entender o conceito de "marker", so clicar `S`.
- Janela de 1 release minor (~3 meses no ritmo atual de release do framework) cobre quem atualiza trimestralmente, sem prender o framework em compat eterna.

**Negativas (custo aceito):**
- Codigo novo dos hooks carrega `if (process.env.ROLDAO_METHOD_LEGACY_MARKERS === '1')` em 6 lugares por 2 releases — debito temporario. Mitigado: helper unico em `_lib.js` (`isLegacyMarkersAllowed()`), grep facil pra remover em v2.2.0.
- Cliente que ignorar warning ate v2.2.0 quebra. Aceitavel — 3 meses de aviso, 2 caminhos de migracao, banner no statusline. Quem ignorou ignorou.
- Auto-migracao do `update` (Caminho B) escreve em `.claude/.runtime/` do projeto terceiro — pode confundir auditoria do projeto se quem audita nao souber que foi o update que mexeu. Mitigado: cada acao da migracao loga em `docs/migrations/MIGRATION-v2-log-DATA.md` no proprio projeto.

**Neutras:**
- Flag adicional no inventario de variaveis de ambiente. Documentada no `MIGRATION-v2.md` e no proprio `README.md` (secao "atualizando do v1 pro v2").

## Alternativas consideradas

### Opcao B — Flag valida por 2 releases minor (ate v2.2.0, removida em v2.3.0)

**Descartada porque** dobra o tempo de carregar codigo de compat sem ganho proporcional. ~3 meses ja cobre quem atualiza trimestralmente — 6 meses cobre quem so atualiza anualmente, mas esse perfil ja convive com debitos maiores que markers vazios. Trade desfavoravel.

### Opcao C — Sem flag, hard-block desde v2.0.0 com pre-release `rc` de 30 dias

**Descartada porque** pre-release `rc` so e testada por early adopters — cliente medio so pega a estavel. Mesmo com 30 dias de aviso publico, dia do release vira incidente em N clientes simultaneos. Custo pra eles > custo de manter flag por 1 release pra nos.

## Non-goals

O que esta decisao NAO resolve:
- **Nao migra automaticamente markers de aprovacao que ja foram commitados em frontmatter de story** (`aprovacoes:` sem `audit_sha`). Story antiga continua valida ate o proximo merge — `validate-story-approvals.js` so exige `audit_sha` em entradas novas durante a janela da flag.
- **Nao cobre flag pra outras quebras potenciais de v2.0.0** que nao envolvam markers (ex: rename de hook, mudanca de frontmatter obrigatorio). Cada quebra de outra superficie publica precisa de decisao propria (ADR-016 cobre os criterios; nenhuma quebra adicional alem dos markers esta no escopo do PRD-003).
- **Nao garante que `update` consiga detectar 100% dos markers v1** — projetos exoticos (markers fora de `.claude/.runtime/`, markers customizados de addon) podem nao ser pegos. Caminho A (comando manual) e fallback explicito.
- **Nao retorna a flag em v2.2.0 se cliente reclamar** — flag e removida sem volta. Cliente que precisa de mais tempo pinna v2.1.x.
- **Nao impede que addons de terceiros adicionem flags proprias com mesmo padrao** — o framework documenta o padrao no addon-author-guide; addons sao livres pra criar `MEU_ADDON_LEGACY_*` se precisarem.

## Como verificar aderencia

- Teste `tests/hooks/legacy-markers-flag.test.js`: 4 casos — flag ON + marker vazio = pass com warning; flag ON + JSON malformado = pass com warning; flag OFF + marker vazio = block; flag ON + marker valido = pass sem warning.
- Teste `tests/integration/migration-v2.test.js`: rodar `npx roldao-method migrate markers` em fixture com markers vazios converte todos sem perder dado.
- `docs/migrations/MIGRATION-v2.md` existe e e linkado do `CHANGELOG.md` v2.0.0.
- Warning aparece 1x por sessao em v2.0.0/v2.1.0 (verificavel via marker `legacy-warning-shown-*`).
- Em v2.2.0: procurar por `ROLDAO_METHOD_LEGACY_MARKERS` em `.claude/hooks/` retorna 0 ocorrencias.

## Como reabrir

- Se cliente grande (>10% da base) ainda estiver na flag perto da v2.2.0: revisar prazo, eventualmente estender pra v2.3.0 com publicacao explicita em release notes.
- Se aparecer outra quebra de v2.0.0 que precise da mesma janela: este ADR vira modelo, mas cada flag tem ADR proprio (nao colapsar tudo numa flag generica).
- Se padrao de flag-pra-compat virar recorrente (3+ flags ativas simultaneamente): criar abstracao `roldao-method compat-flags` que lista flags ativas e prazos de remocao.

## Referencias

- ADR-020 — Contrato canonico de `audit_sha` em markers (o que a flag cobre).
- ADR-016 — Politica de SemVer (justifica v2.0.0 major bump e `MIGRATION-vX.md`).
- ADR-019 — Maestro multi-modo (consumidor do contrato de marker; nao precisa de flag separada).
- PRD-003 secao 4 — US-111 AC-111-3 e AC-111-4.
- PRD-003 secao 7 — riscos R2 (breaking change quebra projetos terceiros).
- `docs/migrations/MIGRATION-v2.md` (sera criado em US-111).
