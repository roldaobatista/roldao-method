---
tipo: knowledge-base
id: KB-STACK-BR
versao: 1
status: stable
owner: tech-lead
revisado-em: 2026-05-18
---

# KB — Stack recomendada para projetos BR

> Memória do que costuma funcionar (e do que costuma queimar) em projetos brasileiros. Use como ponto de partida, **não** como dogma — cada projeto decide via ADR.

## Hospedagem

| Necessidade | Recomendação | Por quê |
|---|---|---|
| Dado pessoal LGPD | AWS São Paulo (sa-east-1), GCP São Paulo, ou Magalu Cloud | Residência no Brasil simplifica LGPD-005 |
| Latência baixa pra usuário BR | Cloudflare + edge no Brasil | Reduz RTT |
| Startup pequena (custo) | Render / Railway / Fly.io | Free tier ou previsível |
| App pago corporativo | AWS / Azure / GCP | Compliance + suporte |
| Bancário/PCI | Bancos / processadores certificados | Auditoria PCI-DSS local |

**Cuidado:** AWS US tem ~50% do custo da AWS São Paulo. Mas dado pessoal BR em US exige cláusulas-padrão ANPD ou consentimento.

## Backend

| Stack | Quando usar | Atenções BR |
|---|---|---|
| **Node.js + TypeScript** | Maioria dos SaaS BR; abundância de devs | Fuso horário: usar `America/Sao_Paulo` explícito |
| **Python + FastAPI/Django** | Análise de dados, ML, integrações fiscais | Bibliotecas NF-e: `pynfe`, `erpbrasil-edoc` |
| **Go** | API de alta performance, microsserviço | Pouco material PT-BR; menos devs |
| **Elixir/Phoenix** | Real-time (Pix, chat) | Comunidade pequena BR mas ativa |
| **Java/Kotlin** | Bancário, corporativo | Padrão SPB Bacen muitas vezes java/.NET |
| **.NET 8+** | Corporativo, setor público | Demanda alta em órgãos públicos |
| **Ruby on Rails** | MVP rápido | Comunidade BR em retração |

## Banco

| Banco | Quando | Atenção BR |
|---|---|---|
| **PostgreSQL** | Default sólido pra 90% dos casos | Use `pt_BR.UTF-8` collation; cuidado com `LIKE 'José'` que precisa de `unaccent` |
| **MySQL/MariaDB** | Quando o cliente já tem DBA Mysql | Versão >= 8 pra utf8mb4 |
| **SQLite** | Mobile, Electron offline | Backup automático crítico (ver addon `electron-br`) |
| **MongoDB** | Documentos sem schema fixo | Cuidado com transações multi-doc |
| **Redis** | Cache, fila, lock distribuído | `maxmemory-policy` definido sempre |
| **Cassandra/Scylla** | Escala extrema (Bacen, telecom) | Curva de aprendizado alta |
| **DuckDB** | Análise local de CSV/Parquet | Não é OLTP |

## Frontend

| Stack | Quando | Atenção BR |
|---|---|---|
| **React + Next.js** | SaaS default | Locale `pt-BR`, formatador `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` |
| **Vue + Nuxt** | Time vindo de Vue | Comunidade BR forte |
| **Angular** | Corporativo, time grande | Mais verboso, mas previsível |
| **Svelte/SvelteKit** | App leve | Menos devs no BR |
| **HTMX + servidor renderizado** | App interno simples | Volta a fazer sentido em 2026 |

Componentes: shadcn/ui + Tailwind virou padrão em 2025-2026.

## Mobile

| Stack | Quando |
|---|---|
| **React Native + Expo** | Maioria dos apps BR (compartilha com web) |
| **Flutter** | Times que querem UI consistente Android+iOS |
| **Kotlin Multiplatform** | Times Android-first abrindo iOS |
| **Nativo (Swift/Kotlin)** | App de banco, alto requisito de performance/segurança |

## Filas e jobs

| Solução | Quando |
|---|---|
| **BullMQ (Redis)** | Default Node.js |
| **Celery (Redis/RabbitMQ)** | Default Python |
| **Sidekiq** | Ruby on Rails |
| **AWS SQS + Lambda** | Serverless, escala automática |
| **Kafka** | Eventos em volume alto, várias consumidoras |
| **NATS** | Mensageria leve, baixa latência |

## Pagamentos BR

| Solução | Cobertura |
|---|---|
| **Pagar.me** (Stone) | Cartão + Pix + boleto, foco BR |
| **Stripe** | Internacional, suporta Pix desde 2024 |
| **Asaas** | PME/MEI, painel simples |
| **Pagseguro/PagBank** | Marketplace, mais antigo |
| **Mercado Pago** | E-commerce, B2C |
| **Cielo / Rede / Getnet** | Adquirência tradicional |
| **EFI/Gerencianet** | Pix BaaS |

Para Pix direto: integrar com banco (Itaú, Bradesco, Santander, Inter, Sicoob, etc.) via API Pix Bacen.

## Email transacional

- **Resend** — DX excelente
- **Postmark** — confiabilidade alta
- **AWS SES** — barato em escala
- **Sendgrid / Mailgun** — clássicos
- **Locaweb / KingHost** — providers BR

## Observabilidade

| Solução | Free tier |
|---|---|
| **Sentry** | Sim, generoso |
| **Highlight.io** | Sim |
| **OpenTelemetry + Grafana Cloud** | Sim |
| **Datadog** | Pago |
| **New Relic** | Pago |

## CI/CD

- **GitHub Actions** — default
- **GitLab CI** — quando GitLab self-hosted
- **CircleCI** — antigo, ainda usado
- **Buildkite** — escala enterprise

## NF-e e fiscal

| Solução | Modelo |
|---|---|
| **TecnoSpeed / PlugNotas** | SaaS, abstrai SEFAZ |
| **NFE.io** | SaaS, dev-friendly |
| **eNotas** | SaaS |
| **Migrate / Sankhya** | ERP completo |
| **Bibliotecas open-source** | `pynfe` (Python), `node-nfe` (Node), `nfe-utils-br` |

Recomendação: SaaS pra MVP; biblioteca quando precisa controle fino.

## Anti-padrões de stack BR

❌ Servidor em US sem cláusula-padrão ANPD pra dado pessoal BR.
❌ Fuso UTC sem conversão pra `America/Sao_Paulo` em UI/relatório.
❌ Formato de data ISO em UI pra usuário final (`2026-05-18` confunde — use `18/05/2026`).
❌ Moeda em USD/EUR no banco quando o produto é BR — usar BRL e `numeric(15,2)`.
❌ Validação de CEP só por regex sem normalização (`01.310-100` vs `01310100`).
❌ Bibliotecas de NF-e abandonadas (`brasilfiscal-*` desatualizado).
❌ Pix sem webhook de confirmação — confiar só em resposta síncrona.

## Princípio

**Stack BR é stack mundial + adaptações.** Não há "stack brasileira" — há ajustes de locale, fuso, formato, moeda, regulação. Use o melhor da indústria, configure o locale, e siga as regras BR.
