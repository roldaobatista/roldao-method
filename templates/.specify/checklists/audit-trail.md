---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Checklist — audit trail de story entregue

Use ao marcar `status: entregue` no frontmatter de uma user story (`docs/stories/US-NNN-*.md`). O hook `validate-story-approvals.sh` valida que todos os campos abaixo estejam preenchidos antes de aceitar o commit.

## Campos obrigatórios no frontmatter

```yaml
---
us_id: US-NNN
titulo: <descricao curta>
owner: <responsavel>
revisado-em: AAAA-MM-DD
status: entregue
epico: EP-NNN | null
depende-de: [US-AAA, US-BBB] | []
auditores:
  seguranca: { veredito: APROVADO | APROVADO_COM_RESSALVAS, em: AAAA-MM-DDThh:mm:ssZ, audit_sha: <sha256> }
  qualidade: { veredito: APROVADO | APROVADO_COM_RESSALVAS, em: AAAA-MM-DDThh:mm:ssZ, audit_sha: <sha256> }
  produto:   { veredito: APROVADO | APROVADO_COM_RESSALVAS, em: AAAA-MM-DDThh:mm:ssZ, audit_sha: <sha256> }
revisor:
  veredito: APROVADO | APROVADO_COM_RESSALVAS
  em: AAAA-MM-DDThh:mm:ssZ
checkpoint:
  arquivo: docs/checkpoints/CHK-AAAA-MM-DD-<slug>.md
  em: AAAA-MM-DDThh:mm:ssZ
implementado_em:
  - <arquivo:linha-aprox de cada ponto principal do diff>
testes:
  unit: <quantidade adicionada>
  integration: <quantidade adicionada>
  e2e: <quantidade adicionada>
investigacao:
  arquivo: .claude/.runtime/investigation-US-NNN.json | null
  causa_raiz: <1 linha — se era bug, qual era a raiz>
---
```

## Checklist humano (antes de declarar entregue)

- [ ] AC da story todos passam (rodar testes e confirmar)
- [ ] Hook `require-auditors-pass-before-commit.sh` deixou commitar (3 markers pass com `audit_sha` bate)
- [ ] Hook `require-checkpoint-before-merge.sh` deixou subir
- [ ] Hook `validate-story-approvals.sh` deixou marcar como `entregue`
- [ ] Frontmatter da story preenche TODOS os campos acima
- [ ] CHANGELOG atualizado (tech-writer)
- [ ] Se era bug: `investigacao.arquivo` existe e `causa_raiz` está descrita
- [ ] Se era feature: `testes.unit` >= 1 ou justificativa explícita em `non-goals`

## Anti-padrões

- Marcar `status: entregue` sem rodar os auditores. O hook bloqueia, mas a tentação aparece.
- Copiar `audit_sha` antigo. O hook detecta diff posterior e exige re-auditoria.
- Declarar `causa_raiz: "corrigido"` — não é causa, é resultado. Causa é "no handler X, a flag Y era setada com Z em vez de W".
- Frontmatter incompleto "por enquanto" — não há "por enquanto" em audit trail.

## Pra que serve

- Auditoria externa (cliente, empresa, regulador) consegue reconstruir o histórico.
- Onboarding de dev novo entende decisões sem precisar caçar o autor.
- Se algo quebrar em produção depois, dá pra rastrear que diff foi auditado e por quem.

## Referências

- `templates/.claude/hooks/require-auditors-pass-before-commit.sh`
- `templates/.claude/hooks/validate-story-approvals.sh`
- `templates/.claude/hooks/require-checkpoint-before-merge.sh`
- `templates/.claude/commands/feature.md` (etapa 6)
