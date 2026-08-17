---
owner: Ana Silva
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 250
proposito: modelagem de ameacas (STRIDE) do conciliab, com mitigacoes, controles e risco residual por componente
---

<!-- destino: docs/seguranca/threat-model.md (preenchido no exemplo saas-python-regulado) -->

# Threat Model — conciliab

> **Hierarquia:** constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE.
> Este documento operacionaliza as INV-TENANT-*, INV-LGPD-*, INV-AGENT-008/009 e SEC-001.

> **TTL de revisao: 12 meses** (ou ao incluir componente novo, mudar trust boundary, ou apos incidente classificado >= MEDIO).

## 1. Escopo

| Componente | Tipo | Trust zone |
|---|---|---|
| API publica `api.conciliab.com.br` (FastAPI/uvicorn em ECS Fargate) | servico HTTP exposto na Internet | externa |
| API interna `/internal/*` (admin, jobs, webhooks Stripe) | servico HTTP so acessivel via VPC privada | interna |
| PostgreSQL 16 RDS `conciliab-prod-rds` com RLS por `tenant_id` | armazenamento persistente | privada |
| AWS Cognito (user pools `conciliab-tenants`) | IdP gerenciado | gerenciada-AWS |
| AWS S3 `s3://conciliab-uploads-saeast1` (extratos CSV/OFX) | object storage | privada |
| Fila de conciliacao (Redis 7 + Celery 5, `queue: conciliacao`) | mensageria assincrona | interna |
| AWS Secrets Manager (`conciliab/prod/*`) | gestao de credenciais | privada-restrita |
| Frontend `conciliab-web` (Next.js 14, repo separado) | aplicacao do usuario final | nao-confiavel |

Fora do escopo: infra AWS abaixo do IaaS (hypervisor, rede fisica — coberto pelo Shared Responsibility Model AWS); Stripe (operador PCI-DSS sob contrato).

## 2. Data flow diagram (DFD textual)

```
[Browser Next.js] --(1) HTTPS + JWT Cognito--> [API publica FastAPI]
       |                                            |
       |                                            +--(2) SQL TLS + RLS--> [PostgreSQL RDS]
       |                                            +--(3) PutObject SSE-KMS--> [S3 uploads]
       |                                            +--(4) lpush AUTH--> [Redis fila]
       |                                                                       |
       |                                            [Worker Celery] <--(5) brpop--+
       |                                                  |
       |                                                  +--(6) SQL TLS + RLS--> [PostgreSQL]
       |                                                  +--(7) GetObject--> [S3]
       |
       +--(8) /v1/auth/*--> [AWS Cognito]
       
[Stripe webhook] --(9) HTTPS + assinatura HMAC--> [API interna /internal/stripe]
[Workers/API] --(10) GetSecretValue IAM role--> [Secrets Manager]
```

## 3. Assets criticos

| Asset | Tipo | Criticidade | Onde vive |
|---|---|---|---|
| Extratos bancarios brutos (CSV/OFX) | dado pessoal + bancario (LGPD) | alta | S3 `uploads-saeast1` + parsed em PG |
| `audit_log` (WORM) | dado fiscal + LGPD evidencia | critica | PG (so INSERT, INV-AUDIT-002) |
| Token JWT Cognito + chave de assinatura | segredo de autenticacao | critica | Cognito (gerenciado AWS) |
| Credenciais RDS, chave Stripe, SMTP | segredo | critica | AWS Secrets Manager |
| Tabela `tenant_admin` (PII socio responsavel: nome, CPF, e-mail) | PII | alta (LGPD Art. 5) | PG + backups |
| Snapshots RDS (diarios 30d + mensais 12m + anuais 5a) | dado fiscal + PII | alta | RDS automated + cross-region us-east-1 |

## 4. Perfis de atacante

| Perfil | Capacidade | Motivacao tipica no conciliab | Vetor |
|---|---|---|---|
| Externo casual | scanners (sqlmap, nuclei) | defacement, credenciais default | endpoints expostos, `/v1/auth/*` |
| Externo direcionado | exploits, recon prolongado | vazamento de extrato bancario (mercado paralelo) | spear phishing dev, exploit FastAPI/dep CVE |
| Insider acidental | dev com acesso prod | erro humano em migration / log com PII | commit de segredo, `DELETE` sem `WHERE tenant_id` |
| Insider malicioso | dev ou contratado | exfiltrar lista de clientes (PJ concorrente) | dump de RLS via `SET LOCAL ROLE` | 
| Supply chain | controle de dep upstream Python | minerador, exfiltracao silenciosa | pacote pypi typosquat (`fastapi-utils`, `psycopg-2`) |
| Concorrente de PME-cliente | conhece a vitima | sabotagem comercial (apagar conciliacao de mes fiscal) | conta comprometida do cliente |

## 5. STRIDE por componente

> Severidade segue: CRITICO/ALTO/MEDIO/BAIXO. Controle aponta para INV ou hook ja existente.

### 5.1 API publica (FastAPI)

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Owner |
|---|---|---|---|---|---|
| Spoofing | atacante forja JWT Cognito | Cognito RS256 + kid rotativo + validacao iss/aud no middleware FastAPI | INV-TENANT-001 + auditor-seguranca | baixo | Ana Silva |
| Tampering | mudanca de `tenant_id` no payload pra ler dados de outro | `tenant_id` sempre derivado do claim JWT, NUNCA do body; RLS de fallback | INV-001 + INV-TENANT-001 + `tenant-id-validator.sh` | baixo | Ana Silva |
| Repudiation | tenant nega ter aprovado conciliacao | `audit_log` WORM com `user_sub` Cognito + hash SHA-256 | INV-AUDIT-001/002 | baixo | Carlos Mendes DPO |
| Info disclosure | mensagem de erro vaza SQL ou PII | exception handler global mascara em prod; `mask_pii()` em logs | INV-AGENT-008 + `secrets-scanner.sh` | baixo | Ana Silva |
| DoS | flood em `/v1/conciliacoes` (upload pesado) | rate-limit Redis 30 req/min/tenant + max body 25MB + WAF AWS | INV-SEC-RL-01 (planejada) | medio | Ana Silva |
| Elevation | bypass de autorizacao em rota admin | guard `require_role("admin")` centralizado + teste por rota | INV-001 + auditor-tenant | baixo | Ana Silva |

### 5.2 PostgreSQL com RLS

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Owner |
|---|---|---|---|---|---|
| Tampering | escrita direta fora da app (psql humano) | role `app` sem `BYPASSRLS`; DBA usa role separada com auditoria; trigger `prevent_update_delete` em `audit_log` | INV-TENANT-003 + INV-AUDIT-002 + `bypass-rls-scanner.sh` | baixo | Bruno Costa |
| Info disclosure | dump RDS roubado (snapshot exportado) | RDS storage encryption + KMS CMK + IAM denyAll cross-account exceto role DR | INV-LGPD-001 | baixo | Bruno Costa |
| Info disclosure | query sem `WHERE tenant_id` em codigo | RLS de fallback (policy `tenant_isolation`) + auditor-tenant grep AST | INV-001 + INV-TENANT-001/002 | baixo | Ana Silva |
| DoS | query custosa derruba RDS (full scan) | `statement_timeout = 30s` + `idle_in_transaction_session_timeout = 60s` + pool limit 50 | (config PG + alerta Datadog) | medio | Bruno Costa |
| Elevation | dev usa `SET LOCAL ROLE` em codigo | hook `bypass-rls-scanner.sh` falha pre-commit | INV-TENANT-003 | baixo | Ana Silva |

### 5.3 AWS Cognito

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Owner |
|---|---|---|---|---|---|
| Spoofing | conta comprometida (credential stuffing) | MFA obrigatorio em conta admin, opt-in user; rate-limit Cognito; alerta "geo-impossible login" Datadog | INV-LGPD-003 | medio | Ana Silva |
| Info disclosure | enumeracao de usuario (resposta diferente para "nao existe" vs "senha errada") | resposta padronizada generica + delay constante | (rota custom `/v1/auth/login`) | baixo | Ana Silva |
| DoS | Cognito sa-east-1 indisponivel | runbook `cognito-degradado.md` + SLA AWS 99.9% aceito por contrato | (runbook + SLA contratual) | medio (depende AWS) | Ana Silva |

### 5.4 S3 (extratos)

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Owner |
|---|---|---|---|---|---|
| Info disclosure | bucket exposto publicamente | Block Public Access habilitado conta-wide; bucket policy denyAll exceto role app; Trusted Advisor alerta | INV-LGPD-001 + SEC-001 | baixo | Bruno Costa |
| Tampering | upload de arquivo malicioso (CSV com formula `=cmd`) | parser em sandbox, nunca abre como Excel; antivirus ClamAV em Lambda pre-trigger | (config + scanner) | baixo | Ana Silva |
| Repudiation | tenant nega upload | versioning + Object Lock 90d + entry em `audit_log` | INV-AUDIT-001 | baixo | Carlos Mendes DPO |

### 5.5 Fila de conciliacao (Redis + Celery)

| Categoria | Ameaca | Mitigacao | Controle | Risco residual | Owner |
|---|---|---|---|---|---|
| Tampering | job injetado por atacante (sem passar pela API) | Redis AUTH + acesso so via VPC + IAM ElastiCache | (config IAM + VPC) | baixo | Bruno Costa |
| DoS | fila trava por job lento (PDF gigante) | `task_time_limit = 300s` + `max_retries = 3` + dead-letter | (config Celery + runbook `api-erro-elevado.md`) | medio | Ana Silva |
| Info disclosure | payload do job contem PII em log | `mask_pii()` antes de `task.delay()` + filtro no logger | INV-AGENT-008 | baixo | Ana Silva |

## 6. Trust boundaries

| Fronteira | De → Para | Controles na travessia |
|---|---|---|
| Internet → ALB → API | nao-confiavel → externa | WAF + TLS 1.3 + rate-limit + JWT |
| API → RDS | externa → privada | Security Group restrito + IAM auth opcional + TLS + RLS |
| API → Cognito | externa → AWS-gerenciada | HTTPS + IAM role da task |
| API → Secrets Manager | externa → privada-restrita | IAM role short-lived (1h) + audit CloudTrail |
| Worker → S3 | interna → privada | VPC endpoint + bucket policy + SSE-KMS |
| Stripe → API interna | externa nao-confiavel → interna | assinatura HMAC obrigatoria + IP allowlist Stripe |

## 7. Attack surface

- Endpoints HTTP publicos: 23 (listados em `docs/api/openapi.yaml`, fora deste exemplo).
- Webhooks recebidos: Stripe (`/internal/stripe/webhook`), Cognito (post-confirmation Lambda).
- Filas que consomem mensagem externa: nenhuma (so Celery interno).
- Upload de arquivo: sim, CSV/OFX ate 25MB, validacao MIME + parser em sandbox.
- Endpoints administrativos: `/v1/admin/*` restritos por role + MFA + IP da VPN.

## 8. Anti-padroes a evitar (aplicados ao conciliab)

- Comparacao de token com `==` curto-circuito — usar `hmac.compare_digest`.
- Stack trace em `HTTPException(detail=...)` em prod — handler global sanitiza.
- Resposta diferente em `/v1/auth/login` para "nao existe" vs "senha errada" — padronizar (ver §5.3).
- Header `Server: uvicorn` — remover via middleware.
- Hash de senha rapido — Cognito gerencia (PBKDF2 com 100k iter); nao reinventamos.
- IP como identidade — proibido; sempre JWT.
- Segredo em URL — sempre header `Authorization`.

## 9. Manutencao deste modelo

- Revisao anual (proximo: 2027-05-27).
- Revisao adicional ao: adicionar componente novo (ex: Open Finance), mudar trust boundary, apos incidente MEDIO+.
- Cada ameaca tem owner de aceitacao; sem owner = correcao obrigatoria.

## 10. Vinculacao com

- [`SECURITY.md`](../../SECURITY.md) — politica geral, canal de divulgacao, SLA.
- [`dependency-policy.md`](./dependency-policy.md) — vetor supply chain (perfil §4).
- [`resposta-incidente.md`](./resposta-incidente.md) — quando mitigacao falha.
- [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — INVs citadas como controle.
- Auditores `auditor-seguranca`, `auditor-tenant`, `auditor-lgpd` em `.claude/agents/`.
- [`ADR-0002`](../adr/ADR-0002-multi-tenant-rls.md) — escolha RLS vs schema-per-tenant.
