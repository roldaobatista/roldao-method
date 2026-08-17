---
modulo: <NomeDoModulo>
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
origem: problema.md
proximo: plan.md
idioma: pt-BR
limite-linhas: 150
proposito: especificacao funcional do modulo, com escopo e criterios de aceite
---

<!--
template: docs/dominios/<dom>/modulos/<modulo>/spec.md
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C4
-->

# Spec — <nome-do-modulo>

## US-<MOD>-001: <título imperativo curto>
> US (História do Usuário) — descrição curta do valor entregue na ótica de quem usa.

**Como** <persona>, **quero** <ação>, **para** <benefício>.

- **AC-<MOD>-001-1**: GIVEN <estado> WHEN <ação> THEN <resultado verificável binário>.
- **AC-<MOD>-001-2**: GIVEN <estado> WHEN <ação inválida> THEN <erro esperado>.
- **AC-<MOD>-001-3**: GIVEN <estado de borda> WHEN <ação> THEN <resultado>.

**Invariantes citadas:** INV-NNN, INV-TENANT-NNN.
**Dependências:** ADR-NNNN, módulo X, evento Y.
**Non-goals (esta US NÃO faz):** <lista>.

<!-- ACs BINÁRIOS: passa ou não passa. Não admite "parcialmente". -->
<!-- Adicione US-<MOD>-002, US-<MOD>-003, ... conforme necessário. -->

## Riscos de produto
<Riscos relacionados ao VALOR entregue ao usuário/negócio — não confundir com riscos de implementação (estes ficam em plan.md).>

- <Risco de produto 1>: <ex: usuário pode não entender a tela, recurso pode ser ignorado, fluxo pode quebrar adoção>. **Mitigação:** <ação>.
- <Risco de produto 2>: <ex: feature pode canibalizar outra, política comercial pode bloquear uso>. **Mitigação:** <ação>.
- <Risco de produto 3>: <ex: dependência de comportamento do usuário externo, sazonalidade>. **Mitigação:** <ação>.

> Riscos técnicos (banco, performance, deploy, integração) vão em `plan.md` → "Riscos de implementação".

## Gate de aceite (transição spec → plan)

A spec transita para `plan.md` quando os critérios abaixo aplicáveis ao modo estiverem marcados.

**Sempre obrigatório:**
- [ ] Todas as US têm pelo menos 1 AC binário (passa/não-passa, sem "parcialmente").
- [ ] Todas as US referenciam ao menos 1 INV (ou justificam ausência em comentário).
- [ ] Todos os non-goals listados (o que ESTA US NÃO faz).
- [ ] Riscos de produto identificados com mitigação.
- [ ] `status` no frontmatter mudado para `stable`.

**Em modo `equipe`:**
- [ ] Owner aprovou em revisão (registrar em `docs/dominios/<dom>/modulos/<modulo>/revisoes/`).

**Em modo `solo` (`owner: agente-ia` ou `modo: solo`):**
- [ ] ACs binários verificáveis (regex GIVEN/WHEN/THEN passa em todos).
- [ ] `auditor-doc-quality` passou com PASS ZERO.
- [ ] Auto-aprovação registrada em `revisoes/` pelo maestro.
- [ ] Para módulos marcados `risco: alto` no frontmatter, "Owner aprovou" continua obrigatório mesmo em solo.

> **Sem este gate batido, plan.md não inicia.** Auditor-doc-quality bloqueia marco se plan.md existe com spec em `draft`.

---
> Termos técnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
