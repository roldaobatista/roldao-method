---
owner: tech-lead
revisado-em: 2026-05-26
status: aceito
decidido-em: 2026-05-26
decidido-por: Roldao Batista
prd: PRD-004
epico: EP-003
story: transversal (US-117..US-127)
supersedes: []
superseded-by: null
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Decisao explicita do Roldao em 2026-05-26 durante consolidacao do PRD-004"
  sintoma-observado: "Tendencia natural do agente a 'consolidar', 'limpar', 'simplificar' — Roldao reage: cada capacidade da v2.0.0 e patrimonio; refatorar OK, perder capacidade NAO."
---

# ADR-031 — Principio de preservacao de capacidade na v3.0.0

> Decisao **aceita** em 2026-05-26 pelo Roldao a partir de feedback explicito dele proprio.
>
> **Este ADR e o ADR-mae do PRD-004.** Vincula transversalmente as 11 stories (US-117..US-127). Toda decisao de refatoracao no v3 precisa passar por este filtro.

---

## Contexto

Durante a consolidacao do PRD-004 (a partir das 3 auditorias paralelas de 2026-05-26), houve tendencia natural do agente a propor consolidacoes tipo "28 comandos viram 12 nucleo + 16 alias" ou "substituir sentinel markers por JSON consolidado". Roldao reagiu explicitamente:

> "Nao e so questao de manter o que tem, pode melhorar, pode criar algo novo que tenha algo que tinha antes e etc, a questao e nao perder capacidades, funcoes e funcionalidades que ja tinha."

Isso clarificou a regra: **refatoracao OK, perder capacidade NAO.** Toda mudanca estrutural precisa provar que o caminho antigo continua possivel (via alias, modo, ou flag de compatibilidade) ate o ciclo formal de deprecation.

Sem ADR formalizando isso, cada decisao de design futura no v3 vai re-debater o mesmo principio.

## Decisao

**Toda mudanca estrutural na v3 precisa preservar capacidades pre-existentes. Refatoracao OK; renomeacao OK (com alias); consolidacao OK (com modos); substituicao OK (com flag de compat). Remocao SO em major bump posterior (v4.0.0) com aviso explicito de deprecation em pelo menos 1 release minor anterior.**

### Aplicabilidade

A regra aplica a tudo da v2.0.0 que ja virou contrato com usuarios:

| Categoria | v2.0.0 conta | Regra |
|---|---|---|
| Comandos slash | 28 | Pode renomear, mas precisa de alias funcional pra v3 inteira |
| Hooks bloqueadores | 35 | Cada cenario bloqueado em v2 continua bloqueado em v3 (cobertura nao diminui) |
| Hooks de soft warning | 7 | Continuam ativos; podem ganhar paths_skip |
| Hooks de lifecycle | 8 | Continuam ativos; podem ser otimizados |
| Agentes especialistas | 17 | Cada agente continua acionavel pelos mesmos gatilhos; snapshot test prova frase-ancora |
| Skills BR | 19 | Cada skill continua funcionando com mesma interface |
| ADRs aceitos | 22 | Nao sao revogados em massa; cada um pode ser superseded via `superseded-by:` |
| Templates | 12+ | Continuam disponiveis; podem ganhar variantes |
| Comandos npm | 5 (`install`, `update`, `add`, `search`, `doctor`) | Mantidos; podem ganhar subcomandos |

### O que e refatoracao permitida

- ✅ **Adicionar:** novo comando, novo hook, novo agente, novo addon
- ✅ **Estender:** comando existente ganha flag nova (`/feature --rascunho`)
- ✅ **Otimizar:** hook ganha fast-path por path (sem perder cobertura)
- ✅ **Renomear:** comando antigo continua funcionando como alias do novo nome
- ✅ **Reorganizar:** memoria movida pra sub-pasta tematica, com `MEMORY.md` apontando corretamente
- ✅ **Substituir formato interno:** sentinel markers + JSON consolidado coexistem 1 release; flag `ROLDAO_METHOD_LEGACY_MARKERS=1` controla precedencia

### O que e perda de capacidade (proibido em v3)

- ❌ **Remover comando** sem alias funcional
- ❌ **Deixar de bloquear** cenario que era bloqueado em v2 (cobertura ENCOLHE)
- ❌ **Remover agente** sem substituto que entrega o mesmo
- ❌ **Apagar skill** sem aviso de deprecation
- ❌ **Mudar interface de skill** de forma incompativel sem flag `--legacy`
- ❌ **Apagar memoria** do usuario sem confirmacao (telemetria nao conta — JSONL pode rodar com `=0`)

### Mecanismos de preservacao

1. **Alias funcional** — comando antigo continua respondendo. Implementado como arquivo `.claude/commands/<antigo>.md` que delega pra novo. Documentado em `MIGRATION-v3.md`.
2. **Modo via flag** — comando ganha flag (`--legacy`, `--v2-compat`) que aciona comportamento antigo.
3. **Flag de runtime** — `ROLDAO_METHOD_LEGACY_*=1` ativa modo de compatibilidade global (ex: `ROLDAO_METHOD_LEGACY_MARKERS=1` do ADR-021).
4. **Snapshot test** — `evals/agent-snapshot/<agente>.snapshot.eval.md` (PRD-004 US-126 AC-126-4) prova que agente continua produzindo frases-ancora obrigatorias. Refactor de prompt nao pode quebrar snapshot sem ajuste explicito.
5. **Suite de regressao** — `__tests__/regressao-v2-hooks.test.js` (PRD-004 US-117 T-117-015) garante que cada hook bloqueador de v2 continua bloqueando os cenarios documentados.

### Ciclo de deprecation formal

```
v3.0.0 — capacidade refatorada, alias funcional ativo, modo legacy default
v3.1.0 — soft warning ao usar caminho antigo: "deprecated, vai sair em v4"
v3.2.0 — flag de runtime ROLDAO_METHOD_LEGACY_*=0 default (caminho antigo so com flag explicita)
v4.0.0 — remocao formal. MIGRATION-v4.md obrigatorio
```

Pelo menos **2 releases minor de aviso** antes da remocao final. Nunca remocao surpresa.

### Decisoes do PRD-004 alinhadas com este ADR

| Onda | Mudanca | Como preserva |
|---|---|---|
| US-117 | Fast-path por path em hooks | Hook sem `@hook-meta` continua rodando (fallback) |
| US-118 | Memory router tag-based | Memoria sem `tags:` continua sendo carregada (fallback); `/memoria-all` mantem comportamento antigo |
| US-119 | Pipeline state JSON | `ROLDAO_METHOD_LEGACY_MARKERS=1` mantem sentinels |
| US-119 | Handoff payload tipado | v3.0 soft warning; v3.1 bloqueio (2 releases de aviso) |
| US-120 | Audit findings JSONL | `audit_sha` continua valido; findings adicionam camada |
| US-120 | ADR-Lite (DN-NNN) | ADR completo continua valido pra decisoes estruturais |
| US-122 | Hooks novos (INV-007..LGPD-011) | Modo warning em v3.0, block em v3.1 |
| US-123 | Addon electron-br | Aditivo; nao mexe no core |

### Quem aplica este ADR

- **Sofia (gerente-produto)** — ao escrever US nova, valida que mudanca respeita preservacao
- **Rafael (tech-lead)** — ao escrever ADR decorrente, declara mecanismo de preservacao
- **Bruno (dev-senior)** — ao implementar, garante que suite de regressao passa
- **Ines (revisor)** — ao revisar diff, verifica que nada foi silenciosamente removido
- **Otavio (meta-cetico)** — ao propor sunset de regra, exige 2 releases de warning antes

## Alternativas consideradas

### Alternativa 1 — Nao formalizar como ADR, manter como diretriz oral (recusada)

Vantagem: menos burocracia. Desvantagens:

- Diretriz oral some entre sessoes
- Agente novo nao tem como saber sem alguem contar
- Conflito acontece toda vez que tendencia de "consolidar" aparece

**Recusada.** ADR formal garante referencia citavel.

### Alternativa 2 — Permitir remocao em minor com aviso (recusada)

Mais agil. Vantagens: codigo fica mais limpo mais rapido. Desvantagens:

- Projetos clientes podem nao acompanhar releases minor
- Quebra confianca do mercado (mantenedor de addon precisa de previsibilidade)
- Viola contrato implicito do framework como produto

**Recusada.** Major bump pra remocao + 2 releases minor de aviso e contrato firme.

### Alternativa 3 — Estabelecer apenas pra v3, sem comprometer v4 (recusada)

Vantagem: flexibilidade futura. Desvantagens: cada major bump vai re-debater o mesmo principio.

**Recusada.** Principio permanente. Major bump muda regras, mas o **ciclo de deprecation** (aviso antes de remover) e regra perene.

## Consequencias

### Positivas

- Roldao tem garantia formal: cada capacidade da v2.0.0 vai estar acessivel no v3
- Mantenedor de addon ganha previsibilidade pra acompanhar versoes
- Tendencia "consolidar/limpar" do agente fica contida por regra citavel
- ADR-mae que vincula todo o PRD-004 — cada decisao filha referencia este
- Confianca do mercado: framework nao quebra projeto cliente em update

### Negativas

- Codigo do framework cresce mais que diminui (overhead arquitetural)
- Manter aliases e modos legacy custa esforco de manutencao
- Debito tecnico acumula ate o major bump permitir remocao
- Suite de regressao cresce a cada release (mas isso e bom — mais protecao)
- v4.0.0 vai exigir trabalho de cleanup grande quando finalmente acontecer

### Compativel com

- **ADR-016** (Politica SemVer) — major bump pra mudanca incompativel; preservacao casa
- **ADR-021** (Flag legacy markers v2) — instancia concreta do principio
- **INV-001** — preservacao = doc continua sendo estado compartilhado
- **INV-005** — aliases sao linhas em command files, nao crescem AGENTS.md
- **INV-AGENT-005** — confirmar antes de mudanca publica; preservacao alinha

## Gatilhos de reabertura

- v4.0.0 chega → reabrir pra revisar ciclo de deprecation (provavelmente mantido)
- Manutencao de aliases acumular > 30% do tempo de release → revisar ciclo (talvez 1 release de aviso em vez de 2)
- Bug critico em capacidade legacy mantida → caso especifico de remocao por seguranca (excecao documentada via ADR proprio)
- Roldao mudar de opiniao explicitamente → revisar este ADR

## Como verificar

- Suite `__tests__/regressao-v2-hooks.test.js` passa em cada release v3
- Snapshot test de agente passa em cada release v3
- Comandos antigos respondem em sandbox (`/qa`, `/historia`, etc.)
- Memoria sem `tags:` continua carregada via fallback
- `ROLDAO_METHOD_LEGACY_MARKERS=1` ativa sentinels em projeto v3

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial a partir de feedback explicito do Roldao — aguardando aceite |
