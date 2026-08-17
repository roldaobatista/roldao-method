---
modulo: <nome-do-modulo>
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
origem: spec.md
proximo: tasks.md
idioma: pt-BR
limite-linhas: 150
proposito: plano tecnico de implementacao do modulo a partir da spec aprovada
---

<!--
template: docs/dominios/<dom>/modulos/<modulo>/plan.md
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C4
-->

# Plano — <nome-do-modulo>

## Estratégia
<2-4 parágrafos: como esta implementação vai ser conduzida, qual abordagem técnica escolhida, quais alternativas foram descartadas e por quê. Sequência de implementação detalhada NÃO entra aqui — ela vive em `tasks.md`. Aqui é o "como pensamos", não o "o que fazemos passo a passo".>

## Modelos/migrations
- `migrations/NNN_<nome>.sql` — <descrição>.

## Endpoints/views
- <método> <rota> — <descrição>.

## Hooks que vão validar
- `<hook>.sh` — <o que valida>.

## Testes 1:1 com ACs
- `<arquivo>.spec.ts::AC-<MOD>-NNN-1` — <happy path>.
- `<arquivo>.spec.ts::AC-<MOD>-NNN-2` — <caso inválido>.
- `<arquivo>-isolation.spec.ts` — <invariante tenant>.

## Riscos de implementação
<Riscos TÉCNICOS — banco, performance, deploy, integração, dívida. Riscos de produto/negócio ficam em `spec.md` → "Riscos de produto".>

- <Risco técnico 1>: <ex: migration pesada, índice faltando, lock de tabela>. **Mitigação:** <ação>.
- <Risco técnico 2>: <ex: dependência de serviço externo, fila pode estourar>. **Mitigação:** <ação>.

## Subagentes convocados pra review

> O maestro decide quais subagentes são aplicáveis baseado no escopo (PII → jurídico; tela → ux; deploy → devops-sre). Marca N/A nos demais sem pedir confirmação. Em modo solo, o próprio agente IA pode rodar `tech-lead` como subagente.

- [ ] tech-lead
- [ ] especialista-juridico (se toca PII)
- [ ] ux-designer (se tem tela)
- [ ] devops-sre (se afeta deploy/runbook)
- [ ] qa-engineer (se plano de teste não-trivial)

## Gate de aprovação (transição plan → tasks)

O plan transita para `tasks.md` quando os critérios abaixo aplicáveis ao modo estiverem marcados.

**Sempre obrigatório:**
- [ ] Estratégia escrita e revisada (não é só lista de bullets).
- [ ] Todos os ACs do `spec.md` têm pelo menos 1 teste 1:1 mapeado.
- [ ] Riscos técnicos identificados com mitigação concreta (não "monitorar").
- [ ] Migrations (se houver) com direção definida (expand → migrate → contract).
- [ ] `status` no frontmatter mudado para `stable`.

**Em modo `equipe`:**
- [ ] Subagentes convocados aplicáveis emitiram parecer (APROVADO ou RESSALVAS — RESSALVAS viram tasks de follow-up e NÃO bloqueiam promoção; só REPROVADO bloqueia).
- [ ] Owner do módulo aprovou (registrar em `revisoes/`).

**Em modo `solo` (`owner: agente-ia` ou `modo: solo` no frontmatter do AGENTS.md):**

> **Transição automática.** O maestro NÃO pede confirmação humana. Roda `auditor-doc-quality` + `auditor-stack` e, se ambos retornarem PASS ZERO (zero CRÍTICO/ALTO/MÉDIO), promove `status: stable` e grava `revisoes/<MOD>-maestro.md` na mesma operação. Não há checkbox manual a marcar — o resultado dos auditores É o gate. Se algum retornar achado bloqueante, maestro entra no loop de auto-correção (até 3 passadas) antes de escalar.

- (registro automático) `auditor-doc-quality` resultado: <PASS ZERO|achados>
- (registro automático) `auditor-stack` resultado: <PASS ZERO|achados>
- (registro automático) Auto-aprovação em `revisoes/<MOD>-maestro.md`: <link gerado>

> RESSALVAS viram tasks de follow-up em `tasks.md` automaticamente — promoção não bloqueia. Só REPROVADO bloqueia (loop até 3 passadas; depois escalação humana).

---
> Termos técnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
