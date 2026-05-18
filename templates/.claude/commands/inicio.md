---
description: Inicia um projeto novo do zero — gerente-produto define escopo, tech-lead decide stack, dev-senior monta esqueleto.
argument-hint: "[nome-projeto opcional]"
disable-model-invocation: true
---

# /inicio — projeto novo

Você vai conduzir o início de um projeto novo. **Não pule etapas.**

## Etapa 1 — Gerente de Produto

Invoque o subagente `gerente-produto` e peça:
- Levantar o problema que o cliente quer resolver.
- Listar 3-5 user stories essenciais (US-001 a US-005) com critérios de aceitação.
- **Listar non-goals** — o que NÃO está no escopo da v1.

Apresente o resultado ao usuário e **confirme** antes de seguir.

## Etapa 2 — Tech Lead

Após confirmação, invoque `tech-lead` e peça:
- Stack recomendada (backend, banco, frontend, hospedagem).
- 2-3 ADRs iniciais: ADR-0001 (stack), ADR-0002 (estrutura de dados), ADR-0003 (autenticação se aplicável).
- Tradeoffs explícitos pra cada decisão.

Apresente os ADRs e **confirme** antes de seguir.

## Etapa 3 — Dev Sênior (esqueleto)

Após confirmação, invoque `dev-senior` pra montar:
- Estrutura mínima de pastas.
- Configuração de teste, lint, formatador.
- Setup local funcionando (`docker compose up` ou equivalente).
- 1 endpoint/tela de exemplo pra validar que o ambiente funciona.

## Etapa 4 — Atualizar documentos contratuais

Preencher os campos `_(preencher)_` em:
- `AGENTS.md` — identidade, stack, comandos.
- `REGRAS-INEGOCIAVEIS.md` — adicionar regras específicas do projeto se houver.
- `.agent/CURRENT.md` — registrar onde paramos.

## Saída final

```
PROJETO INICIADO

User stories: US-001 a US-NNN definidas.
ADRs: ADR-0001 a ADR-NNN aceitos.
Esqueleto: rodando em <comando>.
Próximo passo: começar US-001 via /feature.
```

## Importante

- **Sem jargão técnico** se o usuário não é programador.
- **Confirmar a cada etapa** — não tomar decisões grandes em sequência sem validação.
- **Non-goals explícitos** em cada ADR/user story.
