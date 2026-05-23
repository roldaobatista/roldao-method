---
description: Roda os 3 auditores especializados (segurança, qualidade, produto) no código atual. Use antes de release/marco ou periodicamente.
argument-hint: "[escopo: \"modulo X\" | \"tudo desde release Y\" | vazio = tudo]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(git diff:*), Bash(git log:*), Bash(npm test:*), Bash(npm run:*), Task
model: opus
---

# /auditoria — 3 auditores em paralelo

Você vai invocar os 3 auditores **em paralelo** (uma única mensagem com 3 chamadas).

Use `$ARGUMENTS` como escopo da auditoria (ex: "Wave A completa", "módulo financeiro", "tudo desde última release").

## Invocação paralela

Em UMA ÚNICA MENSAGEM, invoque os 3:

1. `auditor-seguranca` — LGPD, secrets, OWASP, supply chain. Roda `.specify/checklists/lgpd-privacy-review.md` (+ `pix-compliance.md` se houver Pix).
2. `auditor-qualidade` — testes, cobertura, anti-padrões, débito. Roda `.specify/checklists/audit-trail.md` (trilha US→AC→T→commit completa antes de "entregue").
3. `auditor-produto` — aderência a user stories, UX, BR.

Cada auditor reporta independentemente.

## Consolidação

Após os 3 reportarem, consolidar em um único relatório:

```
RELATÓRIO DE AUDITORIA

Escopo: <descrição>
Data: <YYYY-MM-DD>

═══════════════════════════════════════
AUDITOR DE SEGURANÇA
═══════════════════════════════════════
Veredito: <APROVADO | BLOQUEADO>
Achados críticos: <N>
Achados médios: <N>
Achados baixos: <N>

Top 3 itens (em ordem de prioridade):
1. <achado>
2. <achado>
3. <achado>

═══════════════════════════════════════
AUDITOR DE QUALIDADE
═══════════════════════════════════════
Veredito: <APROVADO | APROVADO COM RESSALVAS | BLOQUEADO>
Cobertura: <X%>
Mascaramentos detectados: <N>
Débito técnico: <baixo | médio | alto>

Top 3 itens:
1. ...

═══════════════════════════════════════
AUDITOR DE PRODUTO
═══════════════════════════════════════
Veredito: <APROVADO | APROVADO COM RESSALVAS | NÃO ENTREGAR>
User stories não atendidas: <lista>
Violações de non-goals: <N>
Brasil-ready: <SIM | NÃO + lista de ajustes>

Top 3 itens:
1. ...

═══════════════════════════════════════
VEREDITO CONSOLIDADO
═══════════════════════════════════════
<PRONTO PRO CLIENTE | AJUSTES OBRIGATÓRIOS | NÃO SUBIR>

Ações obrigatórias antes de subir (priorizadas):
1. ...
2. ...
3. ...

Recomendado fazer também (não bloqueante):
- ...
- ...
```

## Importante

- **3 auditores são INDEPENDENTES.** Ao consolidar, não dilua nem misture os vereditos individuais — cada um vê uma perspectiva diferente e o relatório final preserva os três separadamente.
- Se 1 dos 3 disser BLOQUEADO/NÃO ENTREGAR, **o consolidado também bloqueia**, mesmo que os outros 2 aprovem.
- Apresentar consolidado ao usuário em **PT-BR sem jargão**.
