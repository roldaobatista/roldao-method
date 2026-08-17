---
description: Classifica o pedido no tier de risco da Fabrica (0-4) e arma a cerimonia proporcional — tier 3+ trava subida sem checklist; tier 4 exige aprovacao do dono.
argument-hint: "[descricao-do-pedido]"
disable-model-invocation: false
allowed-tools: Read, Glob, Grep, Bash(mkdir:*), Bash(touch:*), Bash(printf:*), Bash(tr:*), Bash(node -e*), AskUserQuestion
model: haiku
---

# /tier — classificar o pedido no tier de risco da Fábrica

Use `$ARGUMENTS` como a descrição do pedido. Se vazio, use o último pedido do usuário na conversa.

## Régua (fabrica/FABRICA.md — na dúvida entre dois, use o MAIOR)

| Tier | Sinal no pedido |
|---|---|
| **0 — Experimento** | protótipo, estudo, descartável, "só pra testar" |
| **1 — Interno** | script auxiliar, relatório interno, ajuste de doc |
| **2 — Padrão** | tela/fluxo comum do app em produção |
| **3 — Alto** | financeiro, fiscal, dados de cliente, migração de banco, contrato de API |
| **4 — Regulado** | metrologia legal (Inmetro), certificados, LGPD sensível, NF-e |

## Fluxo

1. **Classifique** o pedido pela régua. Palavras-gatilho de tier 3+: pagamento, boleto, Pix, imposto, NF-e, CPF/CNPJ, certificado, migração, "dados do cliente". Tier 4: Inmetro, metrologia, portaria, lacre, certificado digital, dado sensível LGPD (saúde, biometria).

2. **Grave o marker da sessão** (mecânico — o vigia `enforce-tier-ceremony` usa):

   ```bash
   SESSION_HASH=$(printf '%s' "${CLAUDE_SESSION_ID:-default}" | tr -cd 'a-zA-Z0-9')
   [ -z "$SESSION_HASH" ] && SESSION_HASH=default
   mkdir -p .claude/.runtime
   node -e "require('fs').writeFileSync('.claude/.runtime/tier-active-$SESSION_HASH', JSON.stringify({tier: N, pedido: process.argv[1], timestamp: new Date().toISOString()}))" "<pedido em 1 frase>"
   ```

   (troque `N` pelo tier decidido).

3. **Anuncie ao usuário** em 1 linha: "Classifiquei como tier N (<motivo>). Caminho: <comando>." e **siga o caminho**:
   - Tier 0-1 → `/quick-dev` se couber nos limites dele (3 arquivos/50 linhas, sem regra de negócio); senão `/feature`.
   - Tier 2 → `/feature`.
   - Tier 3 → `/feature`; antes de subir pro servidor, preencher `docs/fabrica/checklist-release-*.md` (template em `fabrica/templates/checklist-release.template.md`) — o vigia bloqueia a subida sem ele.
   - Tier 4 → igual ao 3 **+ aprovação explícita do dono**: na hora de subir, faça UMA `AskUserQuestion` ("Subida de mudança regulada — aprova?") e, se aprovado, grave o marker:
     ```bash
     node -e "require('fs').writeFileSync('.claude/.runtime/dono-aprovou-$SESSION_HASH', JSON.stringify({aprovado_em: new Date().toISOString(), pedido: process.argv[1]}))" "<pedido>"
     ```
     O vigia bloqueia `git push`/deploy de tier 4 sem esse marker.

4. **Bug reportado é sempre `/bug`**, em qualquer tier — a REGRA #0 não tem atalho.

## Por que existe

A Fábrica define cerimônia proporcional ao risco (fabrica/FABRICA.md), mas até a v2.0.1 os tiers eram só prosa — quem travava de verdade eram apenas os comandos do guarda-corpos. `/tier` + `enforce-tier-ceremony.js` tornam a régua mecânica: tier alto sem checklist (ou sem aval do dono, no 4) não sobe.
