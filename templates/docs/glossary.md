---
tipo: glossario
versao: 1
status: ativo
owner: _(quem mantem)_
revisado-em: AAAA-MM-DD
---

# Glossario — _(nome do projeto)_

> Regras de negocio nomeadas, citáveis em codigo/PR/commit como `INV-NNN`. Inspirado no `docs/internal/glossary.md` do lionclaw (US-125).
>
> **Diferente de:** `REGRAS-INEGOCIAVEIS.md` (regras do FRAMEWORK), termos de produto (`AGENTS.md`), ADRs (decisoes arquiteturais). Aqui mora a **doutrina de negocio do projeto cliente** — regras especificas do dominio dele.

---

## Como citar

Em codigo: `// G3 — calculo de juros usa regime de capitalizacao simples`
Em commit: `fix: ajusta calculo de IOF (G7)`
Em PR: `Conforme G2, validacao de CEP usa ViaCEP com fallback offline`
Em conversa: `Roldao, isso fere G5 — vale revisar a regra ou abrir excecao?`

---

## Regras de negocio (G1-Gn)

### G1 — _(nome curto)_

**Regra:** _(declaracao normativa em 1-2 linhas)_

**Por que existe:** _(motivo — incidente que originou, requisito regulatorio, decisao do dono de produto)_

**Como aplicar:** _(comportamento esperado — onde aparece no codigo, qual fluxo afeta)_

**Excecoes conhecidas:** _(se ha cenario legitimo onde a regra nao aplica)_

**Relacionado a:** _(ADR-NNN, INV-NNN, LGPD-NNN — se houver)_

**Citada em:**
- `src/financeiro/juros.ts:42`
- ADR-007

---

### G2 — _(nome curto)_

_(replicar estrutura)_

---

### G3 — _(...)_

---

## Glossario de termos (jargao do dominio)

> Termos especificos do negocio que aparecem repetidamente. Aliados ao agente `tech-writer` (Camila) — quando ela escreve pra Roldao, traduz termos tecnicos genericos, mas mantem os termos de negocio do dominio (`G1`, `nota fiscal`, `chave Pix`, etc.).

| Termo | Definicao | Sinonimos NAO usar |
|---|---|---|
| _(ex: cliente PJ)_ | _(definicao)_ | _(ex: nao usar "empresa cliente")_ |
| _(ex: ciclo de cobranca)_ | _(definicao)_ | _(sinonimos)_ |

---

## Relacao com REGRAS-INEGOCIAVEIS.md

| ID local | ID inegociavel (framework) | Relacao |
|---|---|---|
| G3 | LGPD-001 | G3 implementa LGPD-001 no dominio especifico |
| G5 | FISCAL-001 | G5 espelha FISCAL-001 com excecao Y |

---

## Padroes recorrentes (proposta meta-cetico)

> Se 3 regras de negocio (G1, G5, G8) compartilham dominio, meta-cetico sugere consolidar em "macro-regra" OU virar ADR estrutural.

- _(nenhum padrao detectado ainda)_

---

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | criacao do glossario |
| AAAA-MM-DD | _(quem)_ | G3 adicionada — origem: incidente INC-002 |
| AAAA-MM-DD | _(quem)_ | G7 marcada como deprecated, supersedida por G12 |
