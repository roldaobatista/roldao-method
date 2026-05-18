---
tipo: architecture
id: ARQ-NNN
versao: 1
status: draft
owner: _(preencher)_
revisado-em: AAAA-MM-DD
---

# ARQ-NNN — Documento de Arquitetura

> Visão de alto nível de como o sistema está organizado. Não substitui ADRs (que registram decisões pontuais) — referencia-os.

---

## 1. Contexto

_(1 parágrafo: o que o sistema faz, pra quem, em qual escala.)_

---

## 2. Diagrama de camadas (ASCII ou mermaid)

```
+--------------------+
|   UI / Frontend    |
+--------------------+
          v
+--------------------+
|   API / Backend    |
+--------------------+
          v
+--------------------+
|   Banco / Storage  |
+--------------------+
```

_(Substituir pelo diagrama real. Mermaid também é bem-vindo.)_

---

## 3. Componentes

| Componente | Responsabilidade | Tecnologia | ADR |
|---|---|---|---|
| _(ex: API REST)_ | _(...)_ | _(ex: Node + Express)_ | ADR-0001 |
| _(ex: Banco principal)_ | _(...)_ | _(ex: PostgreSQL 16)_ | ADR-0002 |
| _(...)_ | _(...)_ | _(...)_ | _(...)_ |

---

## 4. Decisões registradas (ADRs)

| ID | Decisão | Data | Status |
|---|---|---|---|
| ADR-0001 | _(...)_ | AAAA-MM-DD | aceita |
| ADR-0002 | _(...)_ | AAAA-MM-DD | aceita |

---

## 5. Fluxos críticos

### 5.1 Fluxo de _(ex: cadastro de cliente)_

```
Cliente → Frontend → API → Validação CPF → DB → Resposta
```

_(passos numerados, pontos de falha conhecidos, plano B)_

---

## 6. Pontos de extensão

- _(ex: filas)_
- _(ex: webhooks)_
- _(ex: MCP servers — ver .mcp.json)_

---

## 7. Non-goals (o que esta arquitetura NÃO faz)

- _(ex: multi-região)_
- _(ex: high-frequency trading)_

---

## 8. Riscos arquiteturais conhecidos

| Risco | Mitigação atual | Plano B |
|---|---|---|
| _(...)_ | _(...)_ | _(...)_ |

---

## 9. Regulamentação BR aplicável

_(IDs do REGRAS-INEGOCIAVEIS.md que impactam arquitetura)_

- _(ex: LGPD-005 — banco principal em São Paulo, sem transferência internacional)_
- _(ex: FISCAL-002 — certificado A1 isolado por tenant em cofre)_

---

## 10. Histórico

| Data | Versão | Autor | Mudança |
|---|---|---|---|
| AAAA-MM-DD | 1 | _(quem)_ | criação |
