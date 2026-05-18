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

## 12 agentes (papéis mentais)

Mariana 🔎 (analista), Sofia 📋 (PM), Lia 🎨 (UX), Rafael 🏛️ (tech-lead), Detetive 🔬 (investigador), Bruno 💻 (dev), Inês ✅ (revisor), Caio 🛡️ (segurança), Júlia 🧪 (qualidade), Pedro 🎯 (produto), Dona Marta 🧾 (fiscal), Camila 📝 (tech-writer).

---

_Framework completo: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
