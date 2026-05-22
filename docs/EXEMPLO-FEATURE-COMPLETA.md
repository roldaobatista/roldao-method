---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Exemplo — feature ponta-a-ponta com /feature

Transcrição realista de uma feature passando pelos 7 agentes principais (Sofia, Detetive, Rafael, Bruno, Revisor + 3 auditores), da demanda informal até o código entregue.

> **Veja também:** [`COMO-FUNCIONA.md`](COMO-FUNCIONA.md) (visão geral dos fluxos), prompts dos agentes em `.claude/agents/`.

## Cenário

Você é Roldão, dono de uma SaaS contábil em PT-BR. Cliente reclama: "Não consigo cadastrar PJ na nova versão." Você quer adicionar suporte ao **CNPJ alfanumérico** que entra em vigor jul/2026.

## Comando

```
/feature aceitar CNPJ alfanumérico no cadastro de cliente PJ
```

## Etapa 1 — Sofia (gerente-produto)

Sofia infere o que pode do contexto e documenta premissas em vez de perguntar. Ela cria `docs/stories/US-042-cnpj-alfanumerico.md`:

```yaml
---
id: US-042
titulo: Aceitar CNPJ alfanumérico no cadastro
epico: EP-007
status: aprovado
premissas:
  - "tela manual primeiro; importação de planilha fica fora"
  - "retrocompat dos CNPJs numéricos antigos é obrigatória"
---

Como  dono de PME contábil
Quero cadastrar cliente PJ usando CNPJ alfanumérico (12.ABC.345/01DE-35)
Para  estar pronto pra vigência em jul/2026 (FISCAL-005)

Critérios de aceitação:
  AC-042-1: campo aceita 0-9 e A-Z maiúsculas; 2 últimos são dígitos
  AC-042-2: máscara aceita XX.AAA.NNN/AANN-NN ou só caracteres
  AC-042-3: DV inválido mostra mensagem PT-BR clara (sem stack trace)
  AC-042-4: CNPJ numérico legado continua aceito
  AC-042-5: banco armazena 14 chars em maiúscula, sem máscara

Non-goals (INV-003):
  - import de planilha (próxima story)
  - integração com Receita pra confirmar existência
  - troca de UI do formulário

Regulamentação BR: FISCAL-005, LGPD-007 (base legal: execução de contrato)
```

Sofia reporta: "US-042 criada com 5 AC e 3 non-goals; premissas registradas; rodando Detetive." **Não pediu confirmação** — o arquivo é o estado (INV-001).

## Etapa 2 — Detetive (investigador)

```
Lendo código nas áreas de cliente PJ...

Achei:
  - src/cliente/CadastroPJ.tsx           (form de cadastro)
  - src/cliente/cnpj-validator.ts        (validação client-side)
  - src/api/clientes.routes.ts           (POST /clientes)
  - src/db/migrations/0023_clientes.sql  (cnpj BIGINT — VAI QUEBRAR)
  - tests/integration/cadastro-pj.test.ts (5 casos)

Problemas:
  1. CRÍTICO — coluna cnpj é BIGINT. Precisa migrar pra VARCHAR(14).
  2. ALTO    — regex no front /^\d{14}$/. Só dígitos.
  3. ALTO    — isValidCnpj() rejeita letras silenciosamente.
  4. MÉDIO   — testes não cobrem alfanumérico.
  5. BAIXO   — mensagem de erro genérica.

Pendências (orquestrador decide): nenhuma — escopo claro pela US.
JSON: .claude/.runtime/investigation-US-042.json
```

## Etapa 3 — Rafael (tech-lead)

```
Decisão arquitetural: migração de coluna.

Opções:
  A) ALTER COLUMN cnpj TYPE VARCHAR(14) com cast direto.
     Custo: bloqueio durante migração. Aceitável se janela curta.
  B) Coluna nova cnpj_v2, dual-write, switch depois.
     Custo: 2x complexidade no código durante transição.

Recomendo A. Tabela tem ~50k linhas, migração em ~3 segundos.
ADR escrito em docs/decisions/ADR-0007-cnpj-alfanumerico.md.

Readiness:
  [x] Story existe (US-042) com AC testáveis
  [x] Non-goals listados
  [x] ADR-0007 criado
  [x] FISCAL-005 citado
  [x] Plano de teste mínimo proposto
```

## Etapa 4 — Bruno (dev-senior)

TDD em lógica crítica:

```
1. Testes vermelhos:
   - CNPJ numérico legado continua válido
   - CNPJ alfanumérico oficial RFB passa
   - minúsculo normaliza pra maiúsculo
   - DV errado em alfanumérico é rejeitado
   - mensagem de erro em PT-BR sem stack

2. Implementar mínimo (verde):
   - cnpj-validator.ts: algoritmo ord(c)-48 (compatível)
   - aceitar [0-9A-Z]{12} + [0-9]{2} no DV
   - normalizar maiúsculo no input

3. Migration:
   - 0042_cnpj_varchar.sql: ALTER COLUMN cnpj TYPE VARCHAR(14)
   - update pós-migration: UPPER(cnpj)

4. Refator: extrair _calc_dv() em util, regex única como constante exportada.

5. Suite: 12/12 verdes.

Commits atômicos:
  - feat: aceita CNPJ alfanumérico no validator (FISCAL-005 US-042)
  - feat: migra coluna cnpj para VARCHAR(14) (FISCAL-005 T-042-2)
  - feat: ajusta form e regex client-side (US-042 AC-042-2)
  - test: cobre CNPJ alfanumérico em integration (TST-003 US-042)
```

## Etapa 5 — Revisor

```
Aderência US-042: 5/5 AC verificados.
Regras: INV-002, INV-004, TST-001, FISCAL-005 OK.
Anti-padrões: sem mock em integration, sem TODO sem ID, commits atômicos.
APROVADO.
```

## Etapa 6 — Auditores (paralelo, com hash do diff)

```
[auditor-seguranca]  — SQL prepared, LGPD-007 documentado. APROVADO.
[auditor-qualidade]  — unit 100%, integration 5 casos. APROVADO.
[auditor-produto]    — 5 AC verificados, non-goals respeitados. APROVADO.
```

## Saída final

```
FEATURE ENTREGUE

US: US-042 — Aceitar CNPJ alfanumérico no cadastro
ADR criado: ADR-0007
Arquivos tocados: 7
Testes adicionados: 5 unit + 3 integration
Migração: 0042_cnpj_varchar.sql (3s)
Revisor: APROVADO
Auditores: APROVADO
Checkpoint: docs/checkpoints/CHK-2026-05-22-cnpj-alfanumerico.md

Próximo passo: agendar migração em janela noturna e fazer release.
```

## O que aconteceu por baixo

- **7 agentes**, cada um com função clara, sem misturar papéis.
- **Story em disco** (`docs/stories/US-042-*.md`), rastreável — Sofia não pediu confirmação (INV-AGENT-006).
- **ADR registrado** (`docs/decisions/ADR-0007-*.md`).
- **JSON do investigador** (`.claude/.runtime/investigation-US-042.json`) consumido por Bruno e Revisor.
- **TDD nos pontos críticos** (validator com 100% cobertura).
- **Hooks bloquearam zero** — não houve tentativa de `--no-verify`, mock em integration, ou TODO sem ID.
- **Citação rastreável** em todo commit (`FISCAL-005`, `US-042`).
- **PT-BR ponta a ponta** — sem "stakeholder", "spike", "PR" sem traduzir.

Quando alguma etapa for trivial, `/feature` permite pular (dev-senior direto) — mas a estrutura de papéis fica explícita.
