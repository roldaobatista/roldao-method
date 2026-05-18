---
tipo: checklist
id: CHK-ARCH-READINESS
versao: 1
status: stable
owner: tech-lead
revisado-em: 2026-05-18
---

# Checklist — Architecture Readiness

> Aplica antes de aprovar uma decisão arquitetural (ADR proposto → ADR aceito) ou antes de começar implementação de iniciativa grande (`/prd` → primeiro `/feature`).
>
> Quem roda: `tech-lead`.

## 1. Problema bem formulado

- [ ] O problema está descrito em 1-3 parágrafos com evidência (métrica, ticket, citação).
- [ ] Não é solução procurando problema.
- [ ] Personas afetadas estão claras.

## 2. Alternativas consideradas

- [ ] Pelo menos **3 alternativas** foram listadas (incluindo "não fazer nada" se faz sentido).
- [ ] Cada alternativa tem trade-offs explícitos (custo, risco, complexidade, prazo).
- [ ] Critério de escolha está escrito (não "achei melhor").

## 3. Decisão registrada

- [ ] ADR criado via skill `gerar-adr-pt-br` com ID `ADR-NNNN`.
- [ ] ADR tem seção "Como reabrir" — quando reavaliar essa decisão.
- [ ] ADR cita ADRs anteriores que afeta ou contradiz.

## 4. Impacto mapeado

- [ ] Arquivos/módulos afetados estão listados.
- [ ] Migrations necessárias estão identificadas (e classificadas: destrutiva / aditiva).
- [ ] Breaking changes em contratos públicos estão documentados.
- [ ] Impacto em performance estimado (latência, memória, custo de infra).

## 5. Compliance BR aplicável

- [ ] Se toca dado pessoal: LGPD-NNN citados, RIPD avaliado.
- [ ] Se toca fiscal: FISCAL-NNN citados, homologação SEFAZ planejada.
- [ ] Se toca Pix/Open Finance: PIX-NNN citados, Bacen Resolução verificada.
- [ ] Se exige residência de dado no Brasil: hospedagem confirmada.

## 6. Reversibilidade

- [ ] Plano de rollback escrito (não "vamos ver na hora").
- [ ] Migration destrutiva (`DROP`, `TRUNCATE`) tem backup obrigatório e plano de restore testado.
- [ ] Feature flag prevista se mudança é arriscada em produção.

## 7. Testabilidade

- [ ] É possível testar a decisão em ambiente isolado antes de produção.
- [ ] Critério de aceitação técnica está escrito (latência X, throughput Y, erro Z).
- [ ] Plano de teste de carga existe se há expectativa de tráfego maior.

## 8. Observabilidade

- [ ] Métricas novas a coletar estão listadas.
- [ ] Alertas previstos (não "vamos ver depois").
- [ ] Log estruturado planejado, sem dado pessoal em texto puro (LGPD-004).

## 9. Custo

- [ ] Custo de infra estimado (mensal e ao crescer).
- [ ] Custo de licença/SaaS de terceiro confirmado.
- [ ] Custo de manutenção (quem dá pager) está definido.

## 10. Dependências externas

- [ ] Cada terceiro (API, SaaS, lib) tem SLA conhecido.
- [ ] Plano de fallback se terceiro cair existe (ou risco aceito explicitamente).
- [ ] Lock-in avaliado (esforço pra trocar de fornecedor).

## 11. Equipe

- [ ] Quem implementa tem o conhecimento ou plano de aprendizado existe.
- [ ] Quem mantém depois da entrega está definido.
- [ ] Documentação prevista (README do módulo, runbook se opera 24/7).

## 12. Timing

- [ ] Não há mudança crítica no produto/regulamentação que invalide essa decisão em < 6 meses.
- [ ] Cronograma realista (não otimista, não defensivo).
- [ ] Marco de revalidação marcado no calendário (ex: 3 meses pós-deploy).

---

**Sinal de bloqueio:** itens 1, 2, 3, 4, 6 marcados parcial ou faltando = ADR **não aprovado**. Volta pro `tech-lead`.

**Itens 5, 7, 8, 9, 10, 11, 12** geram aviso, não bloqueio — mas se mais de 3 estão fracos, reavaliar antes de começar.
