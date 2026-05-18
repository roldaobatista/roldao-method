---
name: estruturar-open-finance
description: Guia de implementacao Open Finance Brasil — OAuth 2.0 + FAPI + mTLS + DCR. Use ao integrar com Open Finance pela primeira vez (Fase 2 dados, Fase 3 iniciacao de pagamento).
owner: fintech-br
revisado-em: 2026-05-18
status: stable
---

# estruturar-open-finance

Open Finance Brasil exige stack específica de autenticação + autorização. Esta skill orienta a estrutura inicial.

## Pré-requisitos

- [ ] Empresa registrada no Diretório Open Finance Brasil (papel: Receptora ou Transmissora).
- [ ] Certificado ICP-Brasil de assinatura digital.
- [ ] Certificado de transporte (mTLS) emitido pela ICP-Brasil ou OPFB.
- [ ] Sandbox configurado para desenvolvimento.

## Fases relevantes

| Fase | Foco | Quem participa |
|---|---|---|
| **Fase 1** | Dados públicos das instituições | N/A (já em produção) |
| **Fase 2** | Dados cadastrais e transacionais | Receptoras + Transmissoras |
| **Fase 3** | Iniciação de pagamento (Pix incluso) | ITPs (Iniciadoras) |
| **Fase 4** | Outros produtos (investimento, câmbio, seguros, previdência) | Idem |

## Stack obrigatória

| Componente | Padrão |
|---|---|
| Autenticação cliente | mTLS (Mutual TLS) |
| Autorização | OAuth 2.0 com FAPI 1 Baseline / Advanced |
| Identidade do titular | OpenID Connect |
| Registro dinâmico de cliente | DCR (Dynamic Client Registration) |
| Certificado | ICP-Brasil ou OPFB |
| Algoritmo de assinatura | PS256 (RSA-PSS SHA-256) |
| Algoritmo de criptografia (opcional) | RSA-OAEP-256 + A256GCM |

## Fluxo de consentimento (Fase 2)

```
[Titular no site da Receptora] → "Quero importar dados do meu banco"
   ↓
[Receptora] gera consent request → assina com cert ICP
   ↓
[Transmissora] recebe consent → autentica titular (login no banco)
   ↓
[Titular] aprova consentimento (escopos, prazo)
   ↓
[Transmissora] redireciona pra Receptora com authorization code
   ↓
[Receptora] troca code por access_token (mTLS + DPoP)
   ↓
[Receptora] consulta APIs com access_token (extrato, saldo, cartão)
```

## Implementação mínima (TypeScript)

```typescript
import https from 'https';
import fs from 'fs';

// mTLS agent — usado em TODAS as chamadas Open Finance
const opfbAgent = new https.Agent({
  cert: fs.readFileSync(process.env.OPFB_CLIENT_CERT_PATH!),
  key: fs.readFileSync(process.env.OPFB_CLIENT_KEY_PATH!),
  ca: fs.readFileSync(process.env.OPFB_CA_BUNDLE_PATH!),
  rejectUnauthorized: true,
});

// Criar consentimento (Fase 2)
async function criarConsentimento(transmissoraBaseUrl: string, dados: {
  loggedUser: { document: { identification: string; rel: 'CPF' | 'CNPJ' } };
  permissions: string[];
  expirationDateTime: string;
}) {
  const accessToken = await obterTokenClientCredentials(transmissoraBaseUrl);

  const res = await fetch(`${transmissoraBaseUrl}/open-banking/consents/v3/consents`, {
    method: 'POST',
    agent: opfbAgent,  // mTLS
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'x-fapi-interaction-id': crypto.randomUUID(),
    },
    body: JSON.stringify({ data: dados }),
  });

  return res.json();
}
```

## Iniciação de pagamento (Fase 3)

Iniciar Pix via Open Finance:

```typescript
async function iniciarPagamentoPix(
  transmissoraBaseUrl: string,
  consentId: string,
  pagamento: { valor: string; chaveDestino: string; pagador: any; recebedor: any },
) {
  const token = await obterTokenComConsent(consentId);

  const res = await fetch(`${transmissoraBaseUrl}/open-banking/payments/v4/pix/payments`, {
    method: 'POST',
    agent: opfbAgent,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/jwt',  // payload assinado
      'x-fapi-interaction-id': crypto.randomUUID(),
      'x-idempotency-key': crypto.randomUUID(),
    },
    body: jwsAssinado(pagamento),  // assinatura PS256
  });

  return res.json();
}
```

## Permissões mais comuns (Fase 2)

- `CUSTOMERS_PERSONAL_IDENTIFICATIONS_READ` — dados cadastrais PF
- `CUSTOMERS_BUSINESS_IDENTIFICATIONS_READ` — dados cadastrais PJ
- `ACCOUNTS_READ` — lista de contas
- `ACCOUNTS_BALANCES_READ` — saldo
- `ACCOUNTS_TRANSACTIONS_READ` — extrato
- `CREDIT_CARDS_ACCOUNTS_READ` — cartões
- `CREDIT_CARDS_ACCOUNTS_TRANSACTIONS_READ` — fatura
- `LOANS_READ` — empréstimos
- `FINANCINGS_READ` — financiamentos
- `INVESTMENTS_READ` — investimentos

## Headers obrigatórios FAPI

- `Authorization: Bearer <token>`
- `x-fapi-interaction-id` (UUID por requisição)
- `x-fapi-auth-date` (opcional, quando aplicável)
- `x-fapi-customer-ip-address` (opcional)
- `x-customer-user-agent` (opcional)

## Diretório Open Finance Brasil

- **Produção**: <https://web.directory.openfinancebrasil.org.br>
- **Sandbox**: <https://web.sandbox.directory.openfinancebrasil.org.br>

No diretório:
- Cadastra organização.
- Obtém certificados.
- Lista instituições disponíveis.
- Configura webhooks.

## LGPD aplicada

- **Consentimento explícito do titular** é a base legal (LGPD Art. 7 I).
- Cliente revoga a qualquer momento — sistema obriga a respeitar.
- Dados recebidos têm finalidade específica do consent.
- Compartilhamento com terceiro exige novo consentimento.

## Anti-padrões

❌ Reutilizar consent expirado.
❌ Não validar `x-fapi-interaction-id` em logs (perde rastreabilidade).
❌ Não persistir `consent_id` — não consegue revogar nem auditar.
❌ Esquecer mTLS — falha de certificate validation deixa requisição vulnerável.
❌ Algoritmo de assinatura errado (deve ser PS256, não RS256).
❌ Não tratar revogação de consent — continua chamando após cliente revogar.
❌ Hardcoded URL da transmissora — vem do diretório (mudam).

## Referências

- Portal: <https://openfinancebrasil.org.br/>
- Documentação técnica: <https://openfinancebrasil.atlassian.net/wiki/spaces/OF>
- Especificações OpenAPI: <https://github.com/OpenBanking-Brasil/openapi>
- FAPI Profile: <https://openid.net/specs/openid-financial-api-part-1-1_0.html>
