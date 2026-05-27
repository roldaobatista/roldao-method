---
owner: dev-senior
revisado-em: 2026-05-26
status: stable
story: US-115
ac-fechados-nesta-sessao: [AC-115-4]
audit_sha: ef5b8e9bedb16d2f861a7072b53c93528602ed3bc4ddbf8b119a69a7724becb2
session: default
---

# CHK-2026-05-26 — US-115 fecha AC-115-4 (fuzzy help PT-BR)

## Proposito em 1 frase

Permitir que o Roldao digite `npx roldao-method help "frase em PT-BR"` e descubra o slash command certo (`/bug`, `/inicio`, `/release`, etc) sem decorar nomes em ingles.

## O que muda pro cliente (nao-programador)

- **Antes:** pra descobrir comando, abre `--help`, le lista de ~20 subcomandos, tenta lembrar qual era do bug. Decora nome em ingles.
- **Depois:** digita `npx roldao-method help "preciso reportar bug"` e ve `/bug` no topo com descricao em PT-BR.
- **Backward compat:** `help` sem argumento mantem lista completa intacta.

## Non-goals respeitados

- Nao toca outros subcomandos do CLI.
- Nao adiciona dependencia (so usa `fs` + `path` nativos).
- Nao quebra `help` sem argumento.
- Nao mexe nos slash commands em si — so cria interface de descoberta.

## Riscos

| Risco | Mitigacao |
|---|---|
| Query mal interpretada devolver comando errado | Stopwords + tokenize + 5 cenarios obrigatorios validados em teste |
| Path traversal via query | Query nunca entra no path — `commandsDir` e constante |
| ReDoS | Query usado so como operando de `String.includes` — nunca regex pattern |
| HELP_KEYWORDS ficar desatualizado | Manutenção manual quando adicionar command novo — debito conhecido |

## Decisoes dos auditores

- **Caio (auditor-seguranca):** APROVADO. Sem secrets, LGPD, OWASP, supply chain. Path traversal impossivel (path constante). ReDoS impossivel (String.includes).
- **Julia (auditor-qualidade):** APROVADO. Teste 8/8 OK. Cobre 5 cenarios + 3 edge cases. Sem mascaramento. Style consistente com resto do arquivo. Ressalva nao-bloqueante: HELP_KEYWORDS poderia ser top-level constant (debito decorativo).
- **Pedro (auditor-produto):** APROVADO PRO CLIENTE. Aderencia ao AC-115-4 confirmada. Keywords PT-BR excelentes ("urgente cliente parado", "iniciar projeto novo"). Mensagem de erro amigavel. Ressalva nao-bloqueante: acentuacao ausente em mensagens (coerente com resto do CLI por compat Windows).

## Status final

| AC | Status |
|---|---|
| AC-115-4 | **ENTREGUE** — funcao + teste + auditores |
