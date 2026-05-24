---
owner: tech-writer
revisado-em: 2026-05-24
status: stable
---

# Catálogo de mensagens de bloqueio dos hooks

> **Pra quem é este arquivo:** quem vai criar hook novo, ou quem precisa entender o que o framework bloqueou e por quê. Cada mensagem segue um **padrão fixo** pra ficar previsível e em PT-BR claro.
>
> Catalogado em US-114 T-017 (G8) a partir de varredura nos 21 hooks bloqueadores.

---

## Padrão obrigatório de mensagem de hook

Todo hook que bloqueia operação (`exit 2` ou `decision: block`) deve emitir mensagem em **6 linhas mínimo**:

```
[BLOQUEIO] [<nome-do-hook>] <título curto em PT-BR claro>.

Arquivo: <path se aplicável>
Efeito: <o que NÃO aconteceu — em PT-BR>
Causa: <por que bloqueou — em PT-BR>

Próximo passo:
- <ação concreta 1>
- <ação concreta 2>

Por que: <regra do REGRAS-INEGOCIAVEIS.md tocada — INV-NNN / SEC-NNN / LGPD-NNN>
```

**Helpers em `_lib.js` que ajudam:**

| Helper | Pra quê |
|---|---|
| `hookPrefix(level, name)` | Devolve `[BLOQUEIO] [<nome>]` / `[AVISO] [<nome>]` / `[INFO] [<nome>]` padronizado. |
| `hookBlockHeader(name, reason)` | Escreve cabeçalho em stderr + dispara métrica. Use pra hook simples. |
| `failClosedMessage(name, err)` | Mensagem quando o hook **falha internamente** — não vaza stack trace pro usuário. |
| `recordMetric(kind, label, reason)` | Registra o bloqueio em `metrics.jsonl` pra contagem no statusline. |
| `recordApproval(agente, story, sha, status, motivo)` | Registra **aprovação positiva** (oposto de block). |

---

## Inventário de mensagens P1 (alta prioridade — bloqueio duro)

> Geradas por hook bloqueador. Se o usuário ver uma destas, a operação foi recusada. Cada mensagem aqui é fonte canônica — se quiser mudar o texto, edite o hook.

### Segurança

| Hook | Mensagem principal | Regra |
|---|---|---|
| `block-destructive` | `comando irreversível detectado` | SEC-002, INV-AGENT-005 |
| `secrets-scanner` | `tentativa de escrever arquivo sensível` | SEC-001 |
| `block-secrets-in-commit-message` | `mensagem de commit contem possivel segredo` | SEC-001 |
| `no-hardcoded-env-urls` | `URL de servico externo hardcoded` | SEC-005, PIX-005 |
| `no-log-pix-key` | `chave Pix em log sem mascaramento` | PIX-004, LGPD-004 |

### Testes

| Hook | Mensagem principal | Regra |
|---|---|---|
| `anti-mascaramento` | padrão de teste que esconde falha detectado | TST-001 |
| `block-mock-in-integration` | `mock detectado em teste de integracao/E2E` | TST-003 |
| `no-test-data-in-fixtures` | `dado pessoal aparentemente real em fixture/seed/teste` | TST-004, LGPD-001 |
| `validate-test-pyramid` | `criacao de teste E2E sem unit tests no modulo` | TST-002 |

### Pipeline / workflow

| Hook | Mensagem principal | Regra |
|---|---|---|
| `require-investigador-before-fix` | `Edit/Write em código de negócio sem investigador` | INV-006 (REGRA #0) |
| `require-checkpoint-before-merge` | `tentativa de commit/merge/push sem checkpoint` | INV-002 |
| `require-auditors-pass-before-commit` | `tentativa de commit/merge/push sem 3 auditores aprovados` | INV-002 |
| `require-readiness-before-feature` | `tentativa de Edit/Write em codigo sem readiness do épico` | INV-002 |
| `validate-quick-dev-scope` | `/quick-dev tocando arquivo de dominio fora do escopo permitido` | INV-002 |
| `validate-story-approvals` | `tentativa de marcar story como entregue sem audit trail` | INV-002, INV-004 |
| `validate-story-dependencies` | `<US-NNN> tem dependencias nao entregues` | INV-002 |

### Rastreabilidade / docs

| Hook | Mensagem principal | Regra |
|---|---|---|
| `commit-message-validator` | `mensagem da gravacao nao segue a regra do projeto (T-NNN obrigatório)` | INV-004 |
| `block-todo-without-issue` | `TODO/FIXME/XXX/HACK sem ID rastreavel` | INV-004 |
| `paths-frontmatter-validator` | `documento na pasta docs/ precisa de cabecalho de identificacao no topo` | INV-004 |
| `no-amend-after-push` | `nao encontrei o programa Git instalado no computador` (fail-closed) | INV-002 |

---

## Mensagens P2 (soft warning — não bloqueia)

> Hook continua a operação (exit 0) mas grita pra chamar atenção. Use quando a regra é doutrinária (LGPD base legal, jargão PT-BR) — a operação não pode parar.

| Hook | Mensagem | Regra |
|---|---|---|
| `block-jargon-pt-br` | `resposta tem jargão técnico sem tradução PT-BR` | INV-AGENT-001 |
| `block-confirmation-questions` | `resposta contém pergunta de confirmação ("quer que eu...?")` | INV-AGENT-006 |
| `lgpd-base-legal-reminder` | `código toca dado pessoal sem declarar base legal` | LGPD-001, LGPD-007 |
| `regra-zero-reminder` | injeta lembrete da REGRA #0 antes de comando `/bug` | INV-006 |

---

## Como criar mensagem nova (passo a passo)

1. **Identifique a regra tocada.** Procure o ID em `REGRAS-INEGOCIAVEIS.md`. Se não tem regra, primeiro adicione a regra — não invente bloqueio sem ID rastreável.
2. **Use `hookPrefix('block', '<nome>')`** do `_lib.js` em vez de hardcoded.
3. **Mensagem em PT-BR sem jargão.** Lembre que pode bater no dono de produto não-programador.
4. **Sempre 3 blocos:** o que aconteceu, por que bloqueou, próximo passo.
5. **Termine com a regra:** `Por que: INV-006 (REGRA #0).`
6. **Dispare `recordMetric('block', nome, reason)`** pra contagem no statusline.
7. **Adicione cenário positivo + negativo** em `test/hooks-node-only.test.js`.

---

## Mensagem de fail-closed (quando o hook falha)

Hook NÃO deve crashar com stack trace pro usuário. Se algo deu errado internamente, use:

```js
.catch((err) => {
  process.stderr.write(failClosedMessage('meu-hook', err));
  process.exit(2);
});
```

Resultado pro usuário (PT-BR claro):

```
[BLOQUEIO] [meu-hook] erro interno ao validar a operacao.
Efeito: a operacao foi RECUSADA por seguranca (fail-closed).
Causa: o sistema de protecao do framework nao conseguiu rodar normalmente.
Proximo passo:
  - Tentar de novo (pode ser falha temporaria de leitura/escrita).
  - Se persistir, peca pro agente Claude diagnosticar com 'npx roldao-method doctor'.
  - Pra desenvolvedor: detalhe tecnico -> <erro real>
```

Stack trace fica em `err.message` — não no terminal do usuário.

---

## Manter este catálogo atualizado

- **Quem mexe num hook** atualiza a linha aqui se mudou a mensagem principal.
- **Quem cria hook novo** adiciona linha na seção correspondente (Segurança / Testes / Pipeline / Rastreabilidade).
- Gerar varredura automática (fonte da verdade): `grep -nE "process\.stderr\.write\(.\[BLOQUEIO\]" .claude/hooks/*.js`.

---

_Origem: US-114 T-017 (G8) — PRD-003 / EP-002._
