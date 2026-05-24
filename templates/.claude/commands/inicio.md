---
description: Inicia um projeto novo do zero — gerente-produto define escopo, tech-lead decide stack, dev-senior monta esqueleto.
argument-hint: "[nome-projeto opcional]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(mkdir:*), Bash(npm:*), Task
---

# /inicio — projeto novo

Você vai conduzir o início de um projeto novo. **Não pule etapas.**

## Etapa 1 — Gerente de Produto

Invoque o subagente `gerente-produto` e peça:
- Levantar o problema que o cliente quer resolver.
- Listar 3-5 user stories essenciais (US-001 a US-005) com critérios de aceitação.
- **Listar non-goals** — o que NÃO está no escopo da v1.

Salve as US em `docs/stories/US-NNN-*.md` (arquivo é o estado, INV-001) e prossiga pra Etapa 2. Reporte no final "US-001 a US-NNN criadas; rodando Tech Lead".

## Etapa 2 — Tech Lead

Invoque `tech-lead` e peça:
- Stack recomendada (backend, banco, frontend, hospedagem).
- 2-3 ADRs iniciais: ADR-0001 (stack), ADR-0002 (estrutura de dados), ADR-0003 (autenticação se aplicável).
- Tradeoffs explícitos pra cada decisão.

Salve os ADRs em `docs/decisions/ADR-NNNN-*.md` e prossiga. Reporte "ADRs ADR-0001 a ADR-NNNN salvos; rodando esqueleto".

## Etapa 3 — Dev Sênior (esqueleto)

Invoque `dev-senior` pra montar:
- Estrutura mínima de pastas.
- Configuração de teste, lint, formatador.
- Setup local funcionando (`docker compose up` ou equivalente).
- 1 endpoint/tela de exemplo pra validar que o ambiente funciona.

## Etapa 4 — Preencher documentos do projeto

Vários arquivos do projeto têm campos marcados com `_(preencher)_`. Preencha:

- **`AGENTS.md`** — quem usa, o que o projeto faz, com qual tecnologia.
- **`REGRAS-INEGOCIAVEIS.md`** — adicionar regras próprias do projeto (se houver alguma específica do seu negócio).
- **`AGENTS.md` seção 10 ("O que está pendente")** — registrar onde paramos (é o mesmo lugar que o `/retro` atualiza no final do dia).

Reporte "documentos do projeto preenchidos" e siga.

## Etapa 5 — Primeiro pacote de trabalho + sinal verde pra começar

O `/feature` (comando que pega uma user story e implementa) só roda se enxergar um sinal verde dizendo "esse pacote tá pronto pra começar". Sem esse sinal, ele para com mensagem chata. Como você acabou de definir a stack e montar o esqueleto, dá pra emitir o sinal verde agora — é honesto.

1. **Criar o pacote inicial:** novo arquivo `docs/epicos/EP-000-bootstrap.md` agrupando as user stories `US-001..US-NNN` que você criou na Etapa 1. Use `.specify/templates/epico.md` como base.
2. **Conectar cada US ao pacote:** em cada arquivo `docs/stories/US-NNN-*.md`, garantir que a referência ao pacote (`epico: EP-000`) está no cabeçalho.
3. **Emitir o sinal verde:** criar `docs/readiness/EP-000-status.md` com `status: PRONTO` e listar o que já está pronto (stack escolhida, esqueleto rodando, testes configurados).

Pronto. Agora o `/feature US-001` vai funcionar sem reclamar.

## Saída final

```
PROJETO INICIADO

User stories criadas: US-001 a US-NNN (agrupadas no pacote inicial EP-000).
Decisões técnicas registradas: ADR-0001 a ADR-NNN.
Pacote inicial: liberado pra começar (sinal verde emitido).
Esqueleto: rodando em <comando>.
Próximo passo: rodar /feature US-001 pra começar a primeira história.
```

## Importante

- **Sem jargão técnico** se o usuário não é programador.
- **Reportar a cada etapa** com 1 linha do que foi feito — não pedir confirmação (INV-AGENT-006). O arquivo em disco é a validação (INV-001).
- **Non-goals explícitos** em cada ADR/user story.
- **Só pergunte** se houver conflito real (ex: stack incompatível com plataforma alvo, ou US duplicada de iniciativa existente).
