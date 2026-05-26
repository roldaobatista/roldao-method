---
tipo: spec-agregada
versao: 1
status: draft
prd: PRD-NNN
epico: EP-NNN
owner: _(tech-lead — Rafael, com apoio do gerente-produto)_
revisado-em: AAAA-MM-DD
escopo: _(ex: pipeline X, modulo Y, integracao Z)_
---

# SPEC — _(nome curto do agregado)_

> **Spec agregada** complementa as stories individuais (`docs/stories/US-NNN.md`). Usada quando epico tem **muitas stories interligadas** (>8) com dependencias cruzadas — caso em que ler 13 stories soltas perde o todo. Inspirado no `SPEC.md` do lionclaw.
>
> **Diferente de PRD:** PRD = problema, mercado, metricas, riscos. SPEC = arquitetura concreta, schema de dados, contratos API, sequencia de execucao.
>
> **Acompanhamento de execucao:** ver `SPEC_PROGRESS.md` irmao.

---

## 1. Resumo (1 paragrafo)

_(O que a SPEC entrega tecnicamente. Linguagem tecnica OK aqui — SPEC e pra dev/tech-lead.)_

---

## 2. Public-alvo

_(Quem usa o que esta sendo especificado. Personas com nome se aplicavel.)_

| Persona | Pra que ela usa |
|---|---|
| _(ex: dono PME)_ | _(ex: emitir NF-e)_ |

---

## 3. User stories cobertas

> Tabela autoritativa. Cada US-NNN vive em `docs/stories/US-NNN-*.md`. Aqui e so o indice agregado.

| US | Titulo | Dominio | Depende de | Status |
|---|---|---|---|---|
| US-117 | Performance + Visibilidade | infra | - | em-andamento |
| US-118 | Onboarding + Memoria | onboarding | US-117 | draft |
| ... | ... | ... | ... | ... |

---

## 4. Stack tocada

| Camada | Tecnologia | Decisao |
|---|---|---|
| Frontend | _(React/Vue/Svelte/...)_ | ADR-NNN |
| Backend | _(Node/Python/Go/...)_ | ADR-NNN |
| Banco | _(Postgres/SQLite/...)_ | ADR-NNN |
| Filas | _(Bull/Redis/...)_ | ADR-NNN |
| Hospedagem | _(Vercel/AWS/...)_ | ADR-NNN |

---

## 5. Plataformas-alvo

| Plataforma | Versao minima | Status |
|---|---|---|
| Windows 10+ | _ | suportado |
| macOS 12+ | _ | suportado |
| Linux Ubuntu 22+ | _ | suportado |

---

## 6. Database Schema

> Detalhar TABELA por TABELA. Campos com tipo, nullability, default, constraints. Para colunas JSON (blob), abrir subsection por chave conhecida.

### 6.1 — Tabela `nome_tabela`

| Campo | Tipo | Nullable | Default | Constraints | Notas |
|---|---|---|---|---|---|
| `id` | TEXT | NO | - | PRIMARY KEY | UUID v4 |
| `created_at` | TEXT | NO | _(unix epoch)_ | - | ISO-8601 |
| `payload` | TEXT | YES | NULL | - | JSON, ver 6.1.1 |

#### 6.1.1 — Sub-schema de `payload` (JSON)

```json
{
  "campo_x": "string",
  "campo_y": 42
}
```

### 6.2 — Tabela `outra_tabela`

_(replicar)_

---

## 7. Contratos de API/IPC

### 7.1 — Endpoint `POST /api/...`

**Request:**
```json
{
  "campo": "valor"
}
```

**Response 200:**
```json
{
  "resultado": "ok"
}
```

**Response 4xx:**
- 400: validacao falhou (detalhar campos)
- 401: nao autenticado
- 403: sem permissao

**Quem pode chamar:** _(roles/agentes)_

---

## 8. Sequencia de execucao (fluxo principal)

```
1. Usuario faz X
2. Frontend chama API Y
3. Backend valida (regra Z, regra W)
4. Persiste em tabela T
5. Emite evento E pra fila F
6. Worker consome, atualiza U
7. Notifica usuario via canal N
```

---

## 9. Regulamentacao BR aplicavel

| ID | Onde aplica nesta SPEC |
|---|---|
| LGPD-001 | tabela `usuarios` armazena CPF — base legal: contrato |
| FISCAL-001 | emissao de NF-e no fluxo 8.3 |
| PIX-002 | webhook em 7.2 |

---

## 10. ADRs decorrentes desta SPEC

- ADR-NNN — _(decisao tecnica importante)_
- ADR-MMM — _(...)_

---

## 11. Non-goals (INV-003)

- _(item)_
- _(item)_

---

## 12. Historico

| Data | Quem | Mudanca |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | criacao |
