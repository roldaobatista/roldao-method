---
owner: tech-lead
revisado-em: 2026-05-24
status: stable
---

# ADR-016 — Política de SemVer (o que é breaking change)

## Contexto

ROLDAO-METHOD é framework consumido por outros projetos via `npx roldao-method install/update/add`. Cada projeto tem seu próprio ritmo de adoção. Sem critério formal de "o que é breaking", cada release fica refém de julgamento ad-hoc — mantenedor futuro decide diferente, usuário pega update e quebra.

Auditoria 10-agentes (2026-05-24) marcou esta lacuna como débito arquitetural prioridade média.

## Decisão

SemVer 2.0 com **superfícies públicas explicitamente listadas**. Mudança fora dessas superfícies é interna e segue minor/patch livre.

### Superfícies públicas (mudança aqui = bump MAJOR)

1. **Contrato de hooks** — comportamento de `block`/`exit 2` em cenários documentados. Adicionar bloqueio NOVO em superfície existente também conta (cliente que escrevia código aceito ontem fica bloqueado hoje).
2. **API de `_lib.js`** — assinaturas exportadas (ver [ADR-017](ADR-017-estabilidade-lib-js.md)).
3. **Frontmatter obrigatório** de PRD/Épico/Story/ADR — adicionar campo obrigatório novo quebra docs do usuário.
4. **Comandos CLI** — flags e argumentos de `npx roldao-method <command>`. Remover ou renomear flag = MAJOR.
5. **Estrutura de diretórios consumida pelo runtime** — `.claude/`, `.specify/`, `docs/{prd,epicos,stories,decisions}/`. Renomear ou mover = MAJOR.
6. **Lista de regras inegociáveis (`INV-`, `SEC-`, `TST-`, `LGPD-`, `FISCAL-`, `PIX-`, `INV-AGENT-`)** — remover ou renumerar regra existente = MAJOR. **Adicionar** regra nova é MINOR (não quebra código existente).
7. **Nome de agente/hook/skill/command/addon** — renomear = MAJOR. Adicionar = MINOR.

### Não é breaking (MINOR ou PATCH)

- Adicionar agente, hook, skill, command, addon, regra.
- Mensagem de erro mais detalhada (mesma severidade, exit code igual).
- Refactor interno que preserva comportamento observável.
- Mudança em documentação (`docs/`).
- Mudança em ADR antigo marcado `deprecated` (sinalização explícita).
- Mudança em template `.specify/<area>/<nome>.md` quando há override `.specify/overrides/<area>/<nome>.md` no projeto consumidor.

### Pre-release

`X.Y.Z-rcN`, `X.Y.Z-beta.N`, `X.Y.Z-alpha.N` para validar breaking changes antes do MAJOR. Nesse período, breaking change é esperado e não dispara MAJOR novo.

### Comunicação de breaking

Toda MAJOR exige:
1. Entrada `### Breaking change` no CHANGELOG.md
2. Seção "Atenção" no `docs/releases/vX.0.0.md` listando o que quebrou
3. Guia de migração `docs/MIGRACAO-VX.md` (exemplo: `docs/MIGRACAO-V1.md`)
4. Pre-release `rc` mínima de 7 dias antes do MAJOR estável.

## Consequências

- Mantenedor decide com critério escrito, não opinião.
- Usuário consumidor confia que `npx roldao-method update` em MINOR/PATCH não quebra fluxo.
- Adicionar regra inegociável é MINOR — encoraja documentar regras descobertas em auditoria.
- Renomear regra antiga (mesmo "por melhoria") exige MAJOR — desencoraja churn cosmético.

## Non-goals (INV-003)

- Não vamos abrir uma RFC pública pra cada mudança não-breaking — só pra MAJOR.
- Não vamos garantir compatibilidade infinita pra trás — `deprecated` válido por 1 ciclo MAJOR (1 versão), depois pode sair.
- Não cobrimos addons de terceiros (fora deste repo) — eles definem seu próprio SemVer.

## Alternativas consideradas

- **CalVer (`2026.05.24`)** — rejeitada. Não comunica risco de breaking.
- **SemVer sem lista explícita** — status quo. Rejeitada pelo motivo do contexto.
- **Lockstep com Claude Code** — rejeitada. Framework é multi-adapter (ver [ADR-006](ADR-006-multi-adapter.md)).

## Aderente a

INV-001, INV-002, INV-003.
