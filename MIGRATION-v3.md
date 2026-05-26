---
owner: tech-writer
revisado-em: 2026-05-26
status: draft
versao-alvo: v3.0.0
versao-base: v2.0.0
---

# MIGRATION — v2.0.0 → v3.0.0

> **Documento de migracao do ROLDAO-METHOD v2.0.0 → v3.0.0 (Framework Aprendiz).** Em PT-BR claro pra dono de produto que nao programa.
>
> **Principio fundador da v3 (ADR-031):** NUNCA PERDER CAPACIDADE. Toda capacidade da v2.0.0 continua acessivel na v3 — via alias, modo, ou flag de compatibilidade. Refatoracao OK, perder capacidade NAO.

---

## O que muda pra voce (resumo de 1 minuto)

Apos atualizar pra v3.0.0:

1. **Framework fica mais rapido.** Hooks ganham fast-path por path — Edit em README cai de 23 hooks pra ~5.
2. **Voce ve o que esta acontecendo em tempo real.** Status line dinamica, painel `/painel`, semaforo `/saude`.
3. **Voce nao perde mais trabalho quando Claude trava.** `/retomar` continua de onde parou.
4. **AGENTS.md com `_(preencher)_` deixa de virar armadilha.** Framework te ajuda a preencher via `/comeco`.
5. **Auditoria fica honesta.** Cada finding tem ID rastreavel `AF-NNN`.
6. **Framework comeca a aprender com voce.** Otavio (meta-cetico) propoe regras novas baseado no seu uso.
7. **Memoria fica organizada.** Carrega so o relevante por tarefa.
8. **Erros em PT-BR claro automaticamente.** Stack trace fica colapsado.
9. **Electron BR vira cidadao de primeira classe.** `npx roldao-method add electron-br`.
10. **Repo legado ganha doc retroativa.** `/documentar-repo` (sem nunca sobrescrever).

**O que NAO muda:** todos os 28 comandos, 44 hooks, 17 agentes, 19 skills, 22 ADRs continuam funcionando. v3 e camada nova por cima.

---

## Quem precisa atualizar

| Perfil | Acao recomendada |
|---|---|
| **Roldao (dono do framework)** | Atualizar quando o canary estiver verde apos 5 dias de soak |
| **Dev BR em projeto Electron** | Atualizar + rodar `npx roldao-method add electron-br` |
| **Mantenedor de addon (`fintech-br`, `fiscal-br-completo`)** | Atualizar e testar addon contra v3 antes de publicar nova versao do addon |
| **Projeto v1.x ainda em producao** | Atualizar primeiro pra v2.0.0 (MIGRATION-v2.md) e so depois pra v3.0.0 |

---

## Como atualizar

### Caminho recomendado (com janela de seguranca)

```bash
# 1. Antes do canary virar latest, instalar em sandbox pra testar
npx roldao-method@next install

# 2. Rodar no projeto real apos canary 5 dias verde:
npx roldao-method@latest install
```

### Atualizar com cautela em projeto critico

```bash
# Manter flag de compatibilidade ligada (default true em v3.0.0):
export ROLDAO_METHOD_LEGACY_MARKERS=1

# Em v3.0.0 a flag e default — voce nao precisa setar.
# Em v3.1.0 vira default false — voce sete explicito se ainda precisa.
# Em v4.0.0 a flag deixa de existir.
```

---

## Mudancas estruturais (com mecanismo de preservacao)

### 1. Pipeline state em JSON consolidado

**O que mudou:**
- v2 usava sentinel files vazios: `feature-active-<sess>`, `sofia-done-<sess>`, etc.
- v3 adiciona `pipeline-state-<US>.json` em `.claude/.runtime/` com payload tipado.

**O que NAO mudou:**
- Sentinel files continuam funcionando.
- Hook `migrate-runtime-markers.js` (SessionStart) sincroniza ambos automaticamente.

**Preservacao:**
- Flag `ROLDAO_METHOD_LEGACY_MARKERS=1` default `true` em v3.0.0 e v3.1.0.
- Default `false` em v3.2.0 — pra ainda usar legacy: sete `=1` explicito.
- Removida em v4.0.0.

**Compat backward:** integral. Voce nao precisa fazer nada.

---

### 2. Handoff payload tipado entre agentes

**O que mudou:**
- v2 agente fechava criando arquivo vazio.
- v3 agente escreve JSON tipado em `.claude/.runtime/handoff/<from>-para-<to>-<sess>.json`.

**Modo aprende vs bloqueio:**
- v3.0.0 — soft warning ao fechar sem payload. Marker vazio continua aceito.
- v3.1.0 — bloqueio.
- v4.0.0 — marker vazio rejeitado.

**Preservacao:** integral em v3.0.0 + v3.1.0.

---

### 3. Audit findings rastreaveis

**O que mudou:**
- v2 auditor escrevia marker `auditor-seg-pass-<sess>` com `audit_sha`.
- v3 auditor adiciona `.claude/.runtime/audit-finding-{seg|qual|prod}-${SESSION}.jsonl` com findings tipados.

**O que NAO mudou:**
- `audit_sha` continua valido.
- Hook `require-auditors-pass-before-commit.js` continua funcionando.

**Mudanca de comportamento:**
- v3 adiciona hook `require-findings-resolved.js` que bloqueia commit final se `severity: must-fix-merge` esta `open`.
- Dev cita `Fixes: AF-001, AF-003` em commit msg pra fechar.

**Modo aprende:** v3.0.0 e modo aprende — findings opcionais. v3.1.0 obrigatorios.

---

### 4. Memoria com tags

**O que mudou:**
- v2 carregava `MEMORY.md` inteiro + todos os `.md` em `memory/` em todo prompt.
- v3 carrega so memorias com tags relevantes pra pergunta (memory-router).

**O que NAO mudou:**
- Memoria sem `tags:` no frontmatter continua sendo carregada via fallback.
- Comando `/memoria-all` (novo) restaura comportamento antigo quando voce quiser.

**Migracao automatica:**
- Script `tools/migrar-memorias-pra-v3.js` propoe tags pras memorias existentes — voce revisa e aceita.

---

### 5. Hooks ganham frontmatter `@hook-meta`

**O que mudou:**
- v2 hook era `.js` solto sem metadado.
- v3 cada hook tem cabecalho `// @hook-meta {...}`.

**O que NAO mudou:**
- Hook sem `@hook-meta` continua funcionando (fallback: roda sempre, sem fast-path).
- Hook customizado pelo usuario em `.claude/hooks/_local/` (novo namespace) e preservado em updates futuros.

**Beneficio:**
- Edit em arquivo qualquer cai de ~23 hooks pra ~5 (paths_skip declarativo).

---

### 6. Regras novas codificadas (17 IDs)

**Novos IDs em `REGRAS-INEGOCIAVEIS.md`:**
- INV-007 (geracao em path do usuario exige confirmacao)
- INV-008 reforcada (god-file)
- INV-009 (logica de fase mora junto da fase)
- INV-010 (workflow e dado + funcao)
- INV-011 (saida estruturada por fase)
- INV-012 (workflow > 5 fases exige resumability)
- INV-AGENT-007 a INV-AGENT-011
- SEC-006, SEC-007, SEC-008
- TST-005, TST-006
- LGPD-011

**Modo aprende:** v3.0.0 emite soft warning. v3.1.0 bloqueia.

**Preservacao:** todas as 49 regras existentes (INV-001..006, SEC-001..005, TST-001..004, LGPD-001..010, FISCAL-001..010, PIX-001..005, INV-AGENT-001..006) continuam ativas e bloqueadoras.

---

### 7. Telemetria local-first opt-in

**O que e novo:**
- 5 JSONL em `.claude/.runtime/`: hook-stats, dismissed, usage, audit-bias, bug-pattern.
- Agente `meta-cetico` (Otavio) le esses arquivos via `/auto-auditar-framework` e propoe melhorias.

**Privacidade:**
- 100% local. Zero rede. Zero servidor. Zero PII.
- `projeto_hash` = SHA-256 do path absoluto (truncado 12 chars).
- Otavio SEMPRE propoe — NUNCA aplica sozinho (INV-AGENT-005).

**Opt-out:**
- Setar `ROLDAO_TELEMETRIA_LOCAL=0` em `.claude/settings.local.json` desliga tudo. Nada quebra.

---

### 8. Novos comandos slash (≥12 novos, sem remover nenhum dos 28)

- `/comeco` (entrevista guiada)
- `/retomar` (resumability)
- `/painel` (instrumentos)
- `/saude` (semaforo)
- `/avisos` (warnings agregados)
- `/explicar-update` (diff de versao)
- `/auto-auditar-framework` (meta-cetico)
- `/auditoria-iterativa` (3 rounds + criterio de parada)
- `/auditoria --coach` (modo pedagogico)
- `/adr-mapa` (visualizacao)
- `/adr-review` (revisao periodica)
- `/dn` (decision-note ADR-Lite)
- `/memoria-revisar`, `/memoria-consolidar`, `/memoria-all`
- `/stats-hooks`
- `/brief-framework`
- `/aprendizado-mensal`
- `/documentar-repo`

**Preservacao:** todos os 28 comandos da v2 continuam funcionando.

---

### 9. Novos agentes (5)

- `audit-arbiter` (mediador de conflito entre auditores)
- `meta-cetico` (Otavio — auto-auditor)
- `memory-skeptic` (auditor de memoria obsoleta)
- `vigia-fluxo` (Olivia — SRE do proprio fluxo)
- `documentation-master` (orquestrador do `/documentar-repo`)

**Preservacao:** todos os 17 agentes da v2 continuam.

---

### 10. Addon `electron-br` materializado

- `npx roldao-method add electron-br` instala: 2 agentes, 5 hooks, 7 skills, 8 templates Electron production-ready.
- Auto-deteccao no install: framework detecta `electron` em deps e sugere.

---

## Atencao — mudancas conceituais

Embora todas as capacidades sejam preservadas, alguns comportamentos novos podem **surpreender**:

1. **Status line mostra agente CORRENTE** (nao mais o ultimo terminado). Mudanca visual obvia.
2. **Erros vem em PT-BR antes do stack trace.** Camila modo MSG automatico. Stack trace tecnico fica em bloco colapsado.
3. **Memoria carregada e SUBCONJUNTO baseado em tags.** Se voce precisa carregar tudo (retrospectiva, brainstorm longo), rodar `/memoria-all`.
4. **Auditoria pode gerar findings JSONL.** Visivel em `.claude/.runtime/audit-finding-*.jsonl` — pode ser util pra DPO/contador externo auditar.
5. **`/feature` pode pedir `/comeco` antes** se `AGENTS.md` tem `_(preencher)_`. Excecao: `roldao.skip_onboarding: true` em settings.local.

---

## Como reverter pra v2.0.0 (emergencia)

```bash
# Se v3 quebrar algo critico em producao:
npx roldao-method@2 install --force

# Suas customizacoes em .claude/hooks/_local/ sao preservadas.
# Suas customizacoes em hooks _core/ podem ter conflito — ver `tools/diff-hooks-v2-v3.js`.
```

Janela de suporte v2: ate 6 meses apos lancamento da v3.

---

## Suporte e duvidas

- **Issue tecnica:** https://github.com/roldaobatista/roldao-method/issues
- **Duvida de uso:** comando `/help` lista os 28+12 comandos
- **Bug em PT-BR claro:** `/bug` no proprio projeto — investigador roda primeiro (REGRA #0)

---

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-writer (Camila) | esqueleto inicial — sera completado conforme ondas avancarem |
| AAAA-MM-DD | tech-writer (Camila) | secoes detalhadas apos US-127 entregue |
