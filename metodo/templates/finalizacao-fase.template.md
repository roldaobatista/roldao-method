---
owner: <Quem>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 200
proposito: gate de SAÍDA de fase com critério PASS ZERO (zero achados CRÍTICO/ALTO/MÉDIO) — fechamento de marco inegociável
---

<!--
template: finalizacao-fase.template.md
uso: copiar para docs/faseamento/<fase>/finalizacao.md ao fim de cada fase, antes de bater o marco.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C5 + §14.6-14.7 (loop de auditoria e PASS ZERO)
par: kickoff-fase.template.md (gate de ENTRADA da fase)
-->

# Finalização da fase <F-NNN> — <NomeDaFase>

> **PASS ZERO é inegociável**: marco só fecha com **zero achados CRÍTICO, ALTO ou MÉDIO** em aberto. Apenas BAIXO pode passar como carryover registrado.

## 1. Identificação

| Campo | Valor |
|---|---|
| Fase | <F-NNN> (Foundation F-A/F-B/... ou Produto F-1/F-2/...) |
| Nome | <NomeDaFase> |
| Início | <YYYY-MM-DD> (data do `kickoff.md`) |
| Marco-alvo de fechamento | <YYYY-MM-DD> |
| Dono da fase | <slug> |
| Auditores envolvidos | <lista — ver `docs/governanca/catalogo-auditores.md`> |

## 2. Escopo entregue

Listar funcionalidades / Foundations / artefatos que esta fase entregou. **Comparar com `kickoff.md`** — divergência ≠ falha, mas exige justificativa.

| Item planejado (kickoff) | Entregue? | Onde | Notas |
|---|---|---|---|
| <item-1> | sim/não/parcial | `docs/dominios/<dom>/modulos/<mod>/spec.md` | — |
| <item-2> | sim/não/parcial | — | — |

Itens cortados ou movidos para próxima fase entram em **§7. Carryover** abaixo.

## 3. Ritual cumprido (checklist)

Marcar ☐ → ☑ conforme cada item for completado. **Marco não fecha** com qualquer item ☐ desta seção.

- [ ] `kickoff.md` da fase foi escrito antes da implementação.
- [ ] Para cada módulo de produto: `problema.md` → `spec.md` → `plan.md` → `tasks.md` completos.
- [ ] ADRs do escopo da fase em status `aceita`.
- [ ] Threat-model atualizado se a fase tocou superfície de ataque (componente novo, trust boundary novo).
- [ ] ROPA atualizado se a fase tocou tratamento de PII (INV-LGPD-001 se aplicável).
- [ ] Runbooks novos publicados em `docs/operacao/runbooks/` se a fase entrega serviço crítico.
- [ ] Se a fase mexeu em serviço crítico: os indicadores de serviço (SLO) e os roteiros de emergência (runbooks) foram revisados e aprovados pelo dono de operação.
- [ ] Catálogo de auditores reflete auditores criados/ajustados na fase.
- [ ] Documentos novos indexados em `docs/INDICE.md` e tabela `docs/documentos-do-projeto.md`.

## 4. Passadas de auditoria

Cada passada roda **todos os auditores ativos** do catálogo contra o escopo da fase. Registrar:

| # Passada | Data | Achados C | Achados A | Achados M | Achados B | Conclusão |
|---|---|---|---|---|---|---|
| 1 | <YYYY-MM-DD> | <n> | <n> | <n> | <n> | continua |
| 2 | <YYYY-MM-DD> | <n> | <n> | <n> | <n> | continua |
| 3 | <YYYY-MM-DD> | <n> | <n> | <n> | <n> | continua |
| 4 | <YYYY-MM-DD> | <n> | <n> | <n> | <n> | gate de convergência → ver §5 |
| 5 | <YYYY-MM-DD> | <n> | <n> | <n> | <n> | teto duro: PASS ZERO ou escalada humana |

Passadas 1-3 são autônomas (agente identifica eixo, corrige causa-raiz, roda passada nova sem confirmação). 4ª passada dispara `Pausa-3` (gate de convergência). 5ª passada é teto absoluto.

## 5. Achados em aberto

Listar achados que ainda existem (apenas BAIXO permitido para fechar). Achados C/A/M aqui = marco **NÃO** fecha.

Classificar **por eixo** (não só código). Eixos:

- **S1 — Documentação / qualidade de texto.**
- **S2 — Segurança e privacidade** (segurança, PII em logs).
- **S3 — Dados** (evolução de schema, reversibilidade de migração, idempotência).
- **S4 — Operação** (observabilidade, custos de nuvem/FinOps, tratamento de erro, SLO, runbooks).
- **S5 — Produto e experiência** (acessibilidade, produto, qualidade, testes determinísticos).
- **S6 — Documentação residual + versionamento de API.**

| Achado | Severidade | Auditor | Eixo (S1-S6) | Status | Ação |
|---|---|---|---|---|---|
| <descrição> | BAIXO | <auditor> | <S1-S6> | aceito como carryover | <link para issue> |

> **CRÍTICO/ALTO/MÉDIO em aberto = STOP.** Voltar a passada de auditoria, corrigir causa raiz, rodar passada nova.

## 6. Evidências verificadas (INV-AGENT-005)

Anexar prova de execução. Sem evidência = não conta.

- [ ] Suíte de testes do escopo da fase: `<comando>` → resultado <verde/quantos passaram>.
- [ ] Lint + type-check: `<comando>` → resultado.
- [ ] Cobertura: `<%>` (alvo ≥ <%>).
- [ ] Build de release (se aplicável): artefato em `<path>`.
- [ ] Auditores rodaram: relatório em `<path>`.
- [ ] Performance/load (se aplicável): `docs/operacao/performance-testing.md` resultado.

## 7. Carryover para próxima fase

Itens deliberadamente movidos. Cada um vira tarefa do `kickoff.md` da fase seguinte.

| Item | Razão de mover | Próxima fase |
|---|---|---|
| <item> | <razão> | <F-NNN+1> |

## 8. Lições aprendidas (retrospectiva curta)

3 perguntas, 1-2 frases cada:

- **Funcionou:** <o que repetir>
- **Não funcionou:** <o que evitar>
- **Surpresa:** <aprendizado inesperado>

## 9. Assinatura do marco

Marco fecha quando dono **e** todos os auditores principais assinam.

| Quem | Papel | Data | Aprovado? |
|---|---|---|---|
| <dono> | dono do projeto | <YYYY-MM-DD> | ☐ |
| <auditor-1> | <papel> | <YYYY-MM-DD> | ☐ |
| <auditor-2> | <papel> | <YYYY-MM-DD> | ☐ |

## 10. Próximo passo

Após assinatura: atualizar `.agent/CURRENT.md` apontando para `<F-NNN+1>` e copiar `templates/kickoff-fase.template.md` para `docs/faseamento/<F-NNN+1>/kickoff.md`.

Marcar nesta fase: `status: stable` no frontmatter, atualizar `revisado-em` para a data do fechamento.
