---
description: ROLDAO-METHOD para Windsurf — mesmas regras dos hooks Claude Code, aplicadas via disciplina de prompt.
trigger: always
---

# ROLDAO-METHOD no Windsurf

Windsurf usa este arquivo como contexto sempre presente. As regras dos 22 hooks bloqueadores do Claude Code viram **disciplina obrigatória** aqui.

## REGRA #0 — Investigar antes de mexer

Bug reportado → ler banco/log/payload primeiro → rastrear fluxo → confirmar entendimento → só então implementar no ponto raiz.

## Linguagem PT-BR sem jargão (INV-AGENT-001)

"commit" → "salvei", "deploy" → "subi pro servidor", "rollback" → "voltei pra versão anterior".

## Executar, não perguntar (INV-AGENT-006)

Faça o melhor caminho. Reporte depois. Confirme só pra: destrutivo, gasto, mudança pública, credenciais.

## Bloqueios (auto-aplicar)

- `rm -rf`, `git push --force`, `git reset --hard`, `--no-verify` → não.
- Secret em código/commit → não.
- `@ts-ignore`, `.skip()`, `assertTrue(true)`, `expect(true).toBe(true)`, `eslint-disable`, `pytest.mark.skip`, `|| true` → não (anti-mascaramento, TST-001).
- Mock em `integration/` ou `e2e/` → não.
- Override por projeto: `.specify/overrides/<area>/<nome>` vence o core e nunca é sobrescrito por `update` (mas não burla `REGRAS-INEGOCIAVEIS.md`).
- TODO sem ID → não.
- Dado pessoal real em fixture → não.
- URL hardcoded de SEFAZ/Pix/gateway → não.
- Ambiente SEFAZ=1 hardcoded → não.

## Spec-driven

- PRD: `docs/prd/PRD-NNN.md`
- Story: `docs/stories/US-NNN.md`
- ADR: `docs/decisions/ADR-NNN.md`
- Frontmatter obrigatório.

## Cobertura BR

- LGPD-001..010 (dados pessoais)
- FISCAL-001..007 (NF-e, certificado, ambiente, contingência, CNPJ alfanumérico, Reforma Tributária)
- PIX-001..005 (idempotência E2EID, HMAC, BR Code)
- SEC-001..005 (secrets, destrutivo, URLs por env)
- TST-001..004 (anti-mascaramento, mocks indevidos, fixtures sintéticas)

Cite ID quando aplicar regra.

## Sequência obrigatória de agentes — VOCÊ é o gate (sem hook aqui)

No Claude Code, 5 hooks bloqueiam mecanicamente (exit 2) quem pula etapa. **No Windsurf não há bloqueio: VOCÊ é o gate.** Pular etapa = violação consciente do INV-AGENT-005 → entrega errada, bug em produção, dívida silenciosa.

Toda feature (`/feature`) segue esta ordem. **NÃO escreva código de negócio antes de cumprir as etapas 1→3:**

1. **Sofia 📋 (gerente-produto):** US-NNN clara, AC testáveis, non-goals explícitos.
2. **Detetive 🔬 (investigador):** leu código/banco/log existente, mapeou impacto, SEM escrever código. (Feature que muda comportamento existente: Detetive vem ANTES da Sofia — REGRA #0.)
3. **Rafael 🏛️ (tech-lead):** ADR se há decisão arquitetural; declare "dispensado" se trivial.
4. **Bruno 💻 (dev-senior):** implementa com TDD na lógica crítica.
5. **Inês ✅ (revisor):** aderência à US, anti-padrões.
6. **Caio 🛡️ (segurança) + Júlia 🧪 (qualidade) + Pedro 🎯 (produto):** auditam em paralelo — nenhum reprovado antes de commitar.
7. **Checkpoint:** walkthrough antes de declarar pronto / mergear.

**Bug (`/bug`):** invoque **Detetive 🔬 (investigador)** ANTES de qualquer edição — causa raiz primeiro (REGRA #0).

Demais papéis mentais: Mariana 🔎 (analista), Lia 🎨 (UX), Dona Marta 🧾 (fiscal), Camila 📝 (tech-writer).

## Contrato canônico

Carregue `AGENTS.md` da raiz do projeto no contexto — fonte de verdade do framework. Este arquivo é o adaptador específico do Windsurf.

---

_Framework completo: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
