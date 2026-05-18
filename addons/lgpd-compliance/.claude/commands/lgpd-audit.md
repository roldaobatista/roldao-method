---
description: Roda auditoria LGPD ampla na codebase — mapeia dado pessoal, base legal, trilha, exclusão, terceiros. Gera relatório com gaps priorizados.
argument-hint: "[escopo-opcional]"
disable-model-invocation: true
---

# /lgpd-audit — auditoria LGPD da codebase

Auditoria ampla de aderência LGPD do projeto. Use `$ARGUMENTS` pra restringir escopo (ex: "só backend", "só módulo cobrança").

## Etapa 1 — Mapeamento de dado pessoal

Invoque `dpo-virtual`:

1. Grep por padrões que indicam dado pessoal:
   - Schemas / models com campos `cpf`, `cnpj`, `email`, `phone`, `address`, `birthdate`, `rg`.
   - Formulários com input de dado pessoal.
   - Migrations criando colunas com esses nomes.
   - Logs / prints com dado pessoal.
   - Calls pra terceiros (Sentry, Stripe, OpenAI) com payload de dado pessoal.

2. Produzir tabela:
   ```
   | Arquivo:linha | Dado | Tipo (comum/sensível) | Finalidade aparente |
   ```

## Etapa 2 — Base legal por ponto

Para cada ponto mapeado:

- [ ] PRD / story / ADR documenta a base legal?
- [ ] Base legal é coerente (não usar consentimento onde deveria ser execução de contrato)?
- [ ] Se sensível: usa Art. 11 (não Art. 7)?

## Etapa 3 — Direito ao esquecimento

- [ ] Existe rota de exclusão end-to-end?
- [ ] Exclusão chega ao banco?
- [ ] Exclusão chega aos backups (em prazo razoável)?
- [ ] Exclusão notifica terceiros que receberam o dado?

## Etapa 4 — Trilha de acesso (Art. 37, LGPD-004)

- [ ] Acesso humano a dado pessoal é logado?
- [ ] Log tem: quem, quando, o quê, finalidade?
- [ ] Acesso em massa gera alerta?

## Etapa 5 — Compartilhamento com terceiros

- [ ] Cada SaaS/lib que recebe dado pessoal tem DPA?
- [ ] DPA está versionado/arquivado?
- [ ] Política de Privacidade lista o terceiro?
- [ ] Terceiro em país com nível adequado (lista ANPD) ou cláusulas-padrão?

## Etapa 6 — Logs e telemetria

- [ ] Logs estruturados (não texto cru com dado pessoal misturado)?
- [ ] CPF/email/telefone redacted em logs?
- [ ] Sentry/observabilidade tem scrubbing de PII configurado?

## Etapa 7 — Canal do DPO

- [ ] DPO publicado no site (Art. 41)?
- [ ] Email do DPO tem caixa monitorada?
- [ ] SLA de 15 dias está documentado e medido?

## Etapa 8 — RIPD pra tratamentos de alto risco

- [ ] Identificar tratamentos de alto risco (Art. 38).
- [ ] Cada um tem RIPD versionado?
- [ ] RIPD atualizado nos últimos 12 meses?

## Etapa 9 — Plano de incidente

- [ ] Plano de resposta a incidente existe?
- [ ] Template de comunicação à ANPD pronto?
- [ ] Template de comunicação ao titular pronto?
- [ ] Última simulação foi em < 12 meses?

## Etapa 10 — Relatório

Saída no formato `docs/lgpd/LGPD-AUDIT-AAAA-MM-DD.md`:

```markdown
# Auditoria LGPD — AAAA-MM-DD

## Resumo executivo
- Pontos de tratamento: N
- Bases legais documentadas: X/N
- Sem trilha: Y pontos
- Sem DPA: Z terceiros
- RIPD pendentes: W tratamentos

## Gaps críticos (bloqueiam compliance)
1. [Arquivo:linha] descrição — sanção possível
2. ...

## Gaps relevantes (regularizar em 90 dias)
1. ...

## Recomendações operacionais
1. ...

## Pontos de excelência (manter)
1. ...
```

## Importante

- Audit **não substitui** consultoria jurídica — orienta.
- Gaps críticos viram tickets imediatos.
- Próxima auditoria: em 6 meses ou após mudança regulatória relevante.
