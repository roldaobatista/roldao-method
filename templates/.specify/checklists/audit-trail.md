---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Checklist — audit trail de story entregue

Use ao marcar `status: entregue` no frontmatter de uma user story (`docs/stories/US-NNN-*.md`). O hook `validate-story-approvals.sh` valida que todos os campos abaixo estejam preenchidos antes de aceitar o commit.

## Formato exigido (o que o hook `validate-story-approvals.sh` valida)

O audit trail vive no bloco `aprovacoes:` do frontmatter da própria story — **exatamente** o formato do template `.specify/templates/story.md`. O hook bloqueia `status: entregue` se faltar qualquer etapa abaixo ou se houver entrada `reprovado`/`bloqueado`.

```yaml
---
tipo: story
id: US-NNN
versao: 1
status: entregue          # so passa com aprovacoes completo
prd: PRD-NNN
epico: EP-NNN
tamanho: M                # P | M | G
owner: <responsavel>
revisado-em: AAAA-MM-DD
depende-de: []            # US-NNN que vieram antes (validate-story-dependencies.sh)
aprovacoes:
  - etapa: gerente-produto
    agente: Sofia
    data: AAAA-MM-DD
    status: aprovado        # aprovado | dispensado | reprovado | bloqueado
    notas: "AC testaveis, non-goals OK"
  - etapa: investigador
    agente: Detetive
    data: AAAA-MM-DD
    status: aprovado
  - etapa: tech-lead        # status: dispensado se feature trivial
    agente: Rafael
    data: AAAA-MM-DD
    status: aprovado
  - etapa: dev-senior
    agente: Bruno
    data: AAAA-MM-DD
    status: aprovado
  - etapa: revisor
    data: AAAA-MM-DD
    status: aprovado
  - etapa: auditor-seguranca
    agente: Caio
    data: AAAA-MM-DD
    status: aprovado
  - etapa: auditor-qualidade
    agente: Julia
    data: AAAA-MM-DD
    status: aprovado
  - etapa: auditor-produto
    agente: Pedro
    data: AAAA-MM-DD
    status: aprovado
---
```

Etapas obrigatórias (todas devem aparecer como item `- etapa:`): `gerente-produto`, `investigador`, `tech-lead` (pode ser `dispensado`), `dev-senior`, `revisor`, `auditor-seguranca`, `auditor-qualidade`, `auditor-produto`. Causa-raiz de bug e contagem de testes vão no **corpo** da story (seção de implementação), não no frontmatter — o hook não os exige ali, mas o checklist humano abaixo continua valendo.

## Checklist humano (antes de declarar entregue)

- [ ] AC da story todos passam (rodar testes e confirmar)
- [ ] Hook `require-auditors-pass-before-commit.sh` deixou commitar (3 markers pass com `audit_sha` bate)
- [ ] Hook `require-checkpoint-before-merge.sh` deixou subir
- [ ] Hook `validate-story-approvals.sh` deixou marcar como `entregue`
- [ ] Frontmatter da story preenche TODOS os campos acima
- [ ] CHANGELOG atualizado (tech-writer)
- [ ] Se era bug: relatório do investigador citado e causa-raiz descrita no corpo da story (1 linha: "no handler X a flag Y era Z em vez de W")
- [ ] Se era feature: ≥1 teste unitário adicionado, ou justificativa explícita nos non-goals da story

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
