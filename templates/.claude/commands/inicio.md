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
- `AGENTS.md` seção 10 ("O que está pendente") — registrar onde paramos (mesmo lugar que o `/retro` atualiza).

## Etapa 5 — Épico inicial + readiness (destrava o /feature)

`/feature` tem gate mecânico (`require-readiness-before-feature.sh`): exige `docs/readiness/EP-NNN-status.md` com `status: PRONTO`. `/inicio` já fez o trabalho de prontidão (stack, ADRs, esqueleto na Etapa 2-3), então registre-o — senão o usuário roda `/feature US-001` e bate em bloqueio sem explicação.

1. Criar `docs/epicos/EP-000-bootstrap.md` (use `.specify/templates/epico.md` como base) agrupando US-001..US-NNN como stories filhas. `prd:` pode ser `null` (greenfield direto). Frontmatter: `tipo: epico`, `id: EP-000`, `status: aprovado`, `owner`, `revisado-em`.
2. Em cada `docs/stories/US-NNN-*.md`, garantir `epico: EP-000` no frontmatter (o hook resolve o readiness via esse campo).
3. Criar `docs/readiness/EP-000-status.md` com frontmatter `owner`, `revisado-em`, `status: PRONTO` e corpo listando o que já está pronto (stack decidida via ADR-0001, esqueleto rodando, ambiente de teste configurado). Isto é honesto: a prontidão foi efetivamente avaliada nas Etapas 2-3.

## Saída final

```
PROJETO INICIADO

User stories: US-001 a US-NNN definidas (épico EP-000).
ADRs: ADR-0001 a ADR-NNN aceitos.
Readiness: EP-000 PRONTO.
Esqueleto: rodando em <comando>.
Próximo passo: começar US-001 via /feature US-001 (gate de readiness já satisfeito).
```

## Importante

- **Sem jargão técnico** se o usuário não é programador.
- **Confirmar a cada etapa** — não tomar decisões grandes em sequência sem validação.
- **Non-goals explícitos** em cada ADR/user story.
