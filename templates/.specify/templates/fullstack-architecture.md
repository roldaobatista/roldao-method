---
tipo: architecture
subtipo: fullstack
id: ARQ-NNN
versao: 1
status: draft
owner: tech-lead
revisado-em: AAAA-MM-DD
---

# ARQ-NNN — Arquitetura Fullstack — _(nome da iniciativa)_

> Template para arquitetura que cobre **frontend + backend + banco + integrações**. Use quando a iniciativa toca múltiplas camadas. Se for só backend ou só frontend, use `architecture.md` simples.
>
> Spec-as-source (INV-002): este documento descreve a estrutura técnica que vai existir. Não é "documentação depois do código".

---

## 1. Resumo executivo

_(3-5 frases. Que problema essa arquitetura resolve, em quais camadas, e qual é a forma geral.)_

---

## 2. Diagrama em alto nível

```
[Cliente — Browser/Mobile]
    ↓ (HTTPS)
[CDN / Cache]
    ↓
[API Gateway / Load Balancer]
    ↓
[Backend — serviço(s)]
    ↓                    ↘
[Banco principal]       [Fila / cache]
    ↓                    ↘
[Backups]               [Workers async]
```

_(Substituir por diagrama real do projeto. Ferramentas: ASCII, Mermaid, ou imagem com link.)_

---

## 3. Frontend

### 3.1 Stack

| Camada | Escolha | Versão |
|---|---|---|
| Framework | _(ex: Next.js)_ | _(15.x)_ |
| Linguagem | _(TypeScript)_ | _(5.x)_ |
| Estado | _(ex: Zustand / Redux / TanStack Query)_ | |
| Routing | _(file-based / react-router)_ | |
| UI | _(shadcn/ui + Tailwind)_ | |
| Build/Bundler | _(Vite / Turbopack / Webpack)_ | |
| Testes | _(Vitest + Playwright)_ | |

### 3.2 Estrutura de pastas

```
frontend/
├── app/                  # rotas
├── components/           # UI reutilizável
├── features/             # módulos por domínio
├── lib/                  # utilitários
├── hooks/                # hooks customizados
├── stores/               # estado global
└── tests/                # unit + e2e
```

### 3.3 Estados e mensagens (UX)

Cada tela deve cobrir 5 estados (ver agente `ux-designer`):
- **Vazio** — sem dado ainda
- **Carregando** — buscando dado
- **Sucesso** — dado disponível
- **Erro** — falha técnica
- **Restrição** — sem permissão / fora do horário

### 3.4 Internacionalização e locale

- **Idioma padrão:** `pt-BR`
- **Fuso:** `America/Sao_Paulo` (ou exibe horário do servidor com timezone explícito)
- **Moeda:** BRL — `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- **Data:** `dd/MM/yyyy` na UI, ISO no banco
- **CPF/CNPJ:** sempre formatado pra exibição, normalizado (só dígitos) pra persistência

---

## 4. Backend

### 4.1 Stack

| Camada | Escolha | Versão |
|---|---|---|
| Runtime | _(Node 22 / Python 3.13 / Go 1.23)_ | |
| Framework | _(Express / Fastify / NestJS / FastAPI / Django)_ | |
| Linguagem | _(TypeScript / Python / Go)_ | |
| ORM/Query | _(Prisma / Drizzle / SQLAlchemy / Knex)_ | |
| Validação | _(Zod / Pydantic)_ | |
| Auth | _(JWT / OAuth2 / session)_ | |
| Testes | _(Vitest / pytest)_ | |

### 4.2 Estrutura de pastas

```
backend/
├── src/
│   ├── routes/           # endpoints
│   ├── controllers/      # entrada
│   ├── services/         # regra de negócio
│   ├── repositories/     # acesso a dado
│   ├── models/           # entidades
│   ├── middlewares/      # auth, logging, validation
│   ├── workers/          # jobs assíncronos
│   └── lib/              # utilitários
└── tests/
    ├── unit/
    ├── integration/      # banco real, sem mock
    └── e2e/
```

### 4.3 Endpoints principais

| Método | Rota | Descrição | Auth |
|---|---|---|---|
| GET | `/api/...` | _(...)_ | _(sim/não)_ |
| POST | `/api/...` | _(...)_ | _(...)_ |

### 4.4 Workers e jobs assíncronos

| Worker | Quando roda | O que faz |
|---|---|---|
| _(ex: email-sender)_ | Fila BullMQ | Envia email transacional |
| _(ex: nf-e-emitter)_ | Cron + evento | Emite NF-e pendente |

### 4.5 Integrações externas

| Sistema | Direção | Quando | Fallback |
|---|---|---|---|
| _(ex: SEFAZ)_ | Saída | Emissão NF-e | Contingência SVC-AN |
| _(ex: Pix Bacen)_ | Bi-direcional | Pagamento + webhook | Reprocessamento |
| _(ex: Email provider)_ | Saída | Notificação | Fila com retry |

---

## 5. Banco de dados

### 5.1 Banco principal

- **SGBD:** _(PostgreSQL 16 / MySQL 8 / SQLite)_
- **Hospedagem:** _(AWS RDS sa-east-1 / Supabase / Neon / self-hosted)_
- **Backup:** _(automático diário / PITR / WAL streaming)_
- **Retention:** _(30 dias / 90 dias)_

### 5.2 Entidades principais

```sql
-- exemplo
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT NOT NULL,  -- criptografado em coluna se sensível
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  ...
);
```

### 5.3 Estratégia de índices

- Quais campos têm índice e por quê.
- Cuidado com índice em coluna criptografada (não funciona).

### 5.4 Migrations

- **Ferramenta:** _(Prisma migrate / Knex / Alembic / Flyway)_
- **Política:** sempre aditiva primeiro, destrutiva em release separado com backup.
- **Backup antes de migration destrutiva:** obrigatório (ver `architecture-readiness.md`).

### 5.5 Banco secundário (cache, fila, busca)

| Banco | Uso | TTL/política |
|---|---|---|
| Redis | Cache + fila | `maxmemory-policy=allkeys-lru` |
| OpenSearch/Meilisearch | Busca full-text | Indexação assíncrona |

---

## 6. Integrações e contratos

### 6.1 Webhooks recebidos

| Origem | Endpoint | Verificação |
|---|---|---|
| _(Pix Bacen)_ | `POST /webhook/pix` | HMAC + IP whitelist |
| _(Stripe)_ | `POST /webhook/stripe` | Signature header |

### 6.2 Webhooks enviados

- Retry policy (exponencial: 1s, 5s, 30s, 5min, 1h).
- Idempotência via `X-Request-Id` ou `event_id`.

### 6.3 Filas internas

| Fila | Producer | Consumer | Tipo |
|---|---|---|---|
| `email-out` | API | worker-email | At-least-once |
| `nfe-emit` | API | worker-nfe | Exactly-once com lock |

---

## 7. Segurança

- **Auth**: _(JWT em cookie httpOnly secure / OAuth2 com refresh)_
- **Autorização**: _(RBAC / ABAC, middleware de scope)_
- **Secrets**: _(Vault / AWS Secrets Manager / .env só local)_
- **Criptografia em repouso**: _(AES-256 em coluna pra dado sensível, full-disk no banco)_
- **TLS**: _(1.2+ obrigatório)_
- **Rate limit**: _(N req/min por IP, por usuário)_
- **CORS**: _(allowlist explícita)_
- **CSP**: _(política definida)_

Regras: `SEC-001` (secrets), `SEC-002` (validação), `SEC-003` (URLs por env), `SEC-004` (menor privilégio).

---

## 8. LGPD aplicável

- **Dados pessoais tratados:** _(lista)_
- **Bases legais:** _(LGPD-001 por dado/finalidade)_
- **Direito ao esquecimento:** _(rota + processo)_
- **Trilha de acesso:** _(quem consulta o quê)_
- **DPO:** _(canal de contato)_

Ver checklist `lgpd-privacy-review.md`.

---

## 9. Fiscal aplicável

_(Se a iniciativa NÃO é fiscal, escrever "N/A")_

- **Documentos emitidos:** _(NF-e / NFS-e / NFC-e)_
- **Ambiente SEFAZ:** _(homologação em dev, produção controlada)_
- **Certificado digital:** _(A1 por tenant, armazenado em Vault)_
- **Reforma Tributária:** _(prepara cálculo paralelo)_

Ver checklist `fiscal-compliance.md`.

---

## 10. Observabilidade

| Sinal | Ferramenta | Alerta |
|---|---|---|
| Logs estruturados | _(Pino / Loguru)_ | erro crítico → on-call |
| Métricas | _(Prometheus / OpenTelemetry)_ | latência p95 > X |
| Traces | _(Tempo / Jaeger)_ | trace lento > Y |
| Erros | _(Sentry / Highlight)_ | erro novo → Slack |
| Uptime | _(Better Uptime / UptimeRobot)_ | down → on-call |

---

## 11. Deploy e ambiente

| Ambiente | Hospedagem | Banco | Quem acessa |
|---|---|---|---|
| Dev local | Docker compose | SQLite/Postgres local | Devs |
| Homologação | _(...)_ | _(...)_ | Time + alguns clientes |
| Produção | _(...)_ | _(...)_ | Cliente final |

Pipeline CI/CD: _(GitHub Actions, etc.)_

---

## 12. Decisões registradas (ADRs)

| ID | Decisão | Status |
|---|---|---|
| ADR-NNNN | _(ex: Postgres em vez de MySQL)_ | aceito |

---

## 13. Pontos abertos

- [ ] _(o que ainda precisa decidir)_

---

## 14. Histórico

| Data | Quem | Mudança |
|---|---|---|
| AAAA-MM-DD | _(quem)_ | criação |
