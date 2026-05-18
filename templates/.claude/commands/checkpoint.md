---
description: Walkthrough guiado de uma mudança (PR, branch, commit) antes de subir pra produção. Audita propósito, riscos e contexto.
argument-hint: "[branch | PR-N | commit-sha]"
disable-model-invocation: true
---

# /checkpoint — review humano de mudança antes de merge

Use ANTES de subir pra produção ou abrir PR. Garante que a mudança faz sentido isoladamente e que riscos estão mapeados.

`$ARGUMENTS` = referência da mudança (branch atual por default, ou nome de branch, PR ou SHA).

## Etapa 1 — Coletar (investigador)

Invoque `investigador`:
- Diff completo da mudança (`git diff main...HEAD` ou equivalente).
- Lista de arquivos tocados, com motivo de cada um.
- Stories/US-NNN referenciadas em commit messages.
- ADRs criados/alterados.
- Testes adicionados/removidos.
- Migrações de schema (atenção especial).

## Etapa 2 — Análise (3 lentes em paralelo)

Invoque em paralelo:

- `revisor` — aderência ao que foi pedido na story; anti-padrões; coverage de AC.
- `auditor-seguranca` — secrets, validação de input, LGPD, supply-chain de deps novas.
- `auditor-qualidade` — testes proporcionais, mocks indevidos, anti-mascaramento.

## Etapa 3 — Sumário walkthrough

Saída em PT-BR estruturada:

```markdown
# CHECKPOINT — <branch/PR/SHA>

## Propósito em 1 frase
<frase única>

## O que muda pro cliente final
- <muda X>
- <NÃO muda Y (non-goal)>

## Arquivos tocados
- <arquivo>: <motivo>
- ...

## Riscos identificados
| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|

## Migrações de dados
- <sim/não — se sim, plano de rollback>

## Dependências adicionadas
- <lib> v<versão> — <motivo + auditoria de supply chain>

## Testes
- Unit: N (era X, agora Y)
- Integration: N
- E2E: N
- Cobertura crítica: <%>

## Decisões de revisor / auditores
- Revisor: APROVADO / RESSALVAS: <lista>
- Auditor segurança: APROVADO / RESSALVAS / BLOQUEADO
- Auditor qualidade: APROVADO / RESSALVAS / BLOQUEADO

## Próximo passo recomendado
- [ ] Merge agora (todos APROVADOS)
- [ ] Aguardar correção (RESSALVAS bloqueantes)
- [ ] Escalar pra humano (decisão fora do escopo do agente)
```

## Etapa 4 — Decisão

- Se **todos auditores aprovados** → recomendar merge e executar (não perguntar).
- Se **ressalvas não-bloqueantes** → aplicar fix e re-checkpoint.
- Se **ressalva bloqueante** → reverter pra dev, listar correções.
- Se **decisão fora do escopo** (ex: aprovação jurídica de LGPD) → escalar ao usuário com pergunta clara.

## Importante

- **NUNCA aprovar PR com auditor BLOQUEADO** sem autorização explícita do usuário.
- **Apresentar sumário em PT-BR** — sem stack trace, sem stack de testes inteiro.
- Salvar como `docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md`.
