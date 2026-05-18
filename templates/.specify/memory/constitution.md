# Constituição — princípios não-negociáveis

> 6 princípios universais que todo agente (humano ou IA) deve respeitar neste projeto.
>
> **Relação com `REGRAS-INEGOCIAVEIS.md`:** este arquivo é o **manifesto** (didático, explica o "por quê"). O `REGRAS-INEGOCIAVEIS.md` é a versão **operacional** com IDs citáveis (`INV-001`, `SEC-001`, etc.) pra usar em código, ADR, commit. Os dois são complementares, não redundantes.

---

## Princípio 1 — Documento é estado compartilhado

Decisões precisam estar em doc versionado. Memória de conversa não conta. Agente que decide sem doc inventa diferente toda vez.

**Aplica em:** ADRs, specs, regras, convenções.

---

## Princípio 2 — Spec gera código (spec-as-source)

A especificação é a verdade. Código é derivado. Quando código e spec discordam:
- Se a spec está certa: ajustar o código.
- Se o código revelou problema na spec: atualizar a spec primeiro, depois ajustar o código.

**Aplica em:** User stories, ADRs, REGRAS-INEGOCIAVEIS.

---

## Princípio 3 — Conciso vence completo

Doc longo ninguém lê. Doc curto e citável funciona.

**Limites (alinhados com recomendação oficial Anthropic):**
- AGENTS.md ≤ 200 linhas
- CLAUDE.md ≤ 150 linhas
- ADR ≤ 1 página por seção
- REGRA: 1 ID = 1-3 frases

---

## Princípio 4 — Non-goals explícitos

Toda spec/ADR declara o que NÃO está no escopo. Sem isso, o agente expande indefinidamente e o produto vira monstro.

**Exemplo:**
> **Escopo:** validação de CPF brasileiro.
> **Non-goals:** validação de CNPJ (fica em outra task), validação offline (não necessário agora).

---

## Princípio 5 — IDs rastreáveis

Cadeia de rastreabilidade obrigatória:

```
US-NNN  →  AC-NNN-N  →  T-NNN  →  commit
(user      (acceptance  (task)     (commit message
 story)     criteria)              cita o T-NNN)
```

**Por que:** quando algo quebra, dá pra rastrear da linha de código até a decisão original.

---

## Princípio 6 — Negócio vence conveniência do agente

Otimizar pelo produto/cliente, **não** pelo que o agente IA erra menos.

Critério "agentes dominam tecnologia X melhor que Y" é tiebreaker, nunca principal. Se Y é melhor pro negócio, escolher Y e investir em doc/regras pra ajudar o agente.

---

## Regra mestre

**Regra crítica vira hook, não só doc.** Documento sozinho não para o agente — código executável para.

Ver `.claude/hooks/` pra hooks ativos neste projeto.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method). Inspirado em Spec Kit._
