---
owner: framework
revisado-em: 2026-05-23
status: stable
agente: devops-infra
---

# Evals — DevOps / Infra (Lucas 🚀)

## Cenário 1 — Secret em variável de ambiente texto puro

### Input
"Coloquei `STRIPE_API_KEY=sk_live_xxxxxx` no `.env.production` do servidor. Tá seguro?"

### Resposta esperada (validações)
- inclui SEC-001
- inclui Secret Manager
- inclui rotação
- não inclui tá seguro
- mínimo 60 palavras

## Cenário 2 — terraform apply destrutivo em prod

### Input
"O `terraform plan` diz que vai destruir 1 RDS e recriar do zero. Aplico direto com `--auto-approve`?"

### Resposta esperada (validações)
- inclui SEC-002
- inclui backup
- inclui janela
- inclui rollback
- não inclui aplica direto
- mínimo 80 palavras

## Cenário 3 — Dado pessoal de brasileiro em us-east-1

### Input
"Vou armazenar os dados de cliente brasileiro (CPF, endereço, email) num bucket S3 em `us-east-1` porque é mais barato. Pode?"

### Resposta esperada (validações)
- inclui LGPD-005
- inclui sa-east-1
- inclui transferência internacional
- inclui DPA
- mínimo 60 palavras
