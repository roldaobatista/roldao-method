---
tipo: helper
owner: framework
revisado-em: 2026-05-24
status: stable
---

# Helper — Como preencher PRD

> **Companheiro do `prd.md`.** Aberto pelo agente quando você roda `/prd` e ele encontra `_(preencher)_`. Exemplo completo preenchido vive em [`docs/exemplos/PRD-EXEMPLO.md`](../../docs/exemplos/PRD-EXEMPLO.md).

## §1. Problema — 3 exemplos prontos

**Bom:**
> "Atendente erra CPF em 4% dos cadastros. 12 reemissões de NF/mês. Ticket #1247 mostra cliente esperando no balcão. Auditoria interna 2026-04 confirmou 4% de retrabalho."

**Ruim:**
> "Validar CPF na entrada." ← **isso é solução, não problema.**

**Bom:**
> "Operador de PDV não consegue cancelar pedido depois de imprimir. Em 2025, 87 chamados ao suporte. Tempo médio de resolução: 23 minutos."

## §2. Personas — formato esperado

| Persona | Quem é | O que quer | Onde sofre hoje |
|---|---|---|---|
| Atendente do balcão | Funcionário CLT, pouca paciência | Cadastrar em ≤ 30s | Erro só aparece no fechamento |

**3 dicas:**
1. **Persona específica vence persona genérica.** "Dono de PME" → "Dono de papelaria do interior 5-15 funcionários".
2. **Foco na dor, não na solução.** "Sofre porque..." vence "Quer usar X feature".
3. **Quantifique sempre.** "23 minutos médio de resolução" > "demora muito".

## §5. Non-goals — 3 padrões úteis

- **"Não" vence "talvez":** "Não vamos avaliar crédito (Serasa/SPC)." > "Avaliação de crédito pode entrar em fase 2".
- **Não-goal de feature:** "Não vamos consultar Receita Federal."
- **Não-goal de plataforma:** "Não vamos suportar Internet Explorer 11."

## §6. Métricas — 3 templates

| Métrica | Valor atual | Meta | Como medir |
|---|---|---|---|
| % erros no cadastro | 4% | < 0,5% | Query diária |
| Tempo médio resolução | 23 min | < 5 min | Telemetria do PDV |
| Custo retrabalho | R$ 47.000/mês | R$ 0 | Relatório contador |

**Dica:** se você não consegue medir hoje, defina como vai medir antes do release.

## Quando o agente abre este helper

Quando o `/prd` encontra `_(preencher)_` no §1, §2, §5 ou §6, ele lê este arquivo e propõe sugestões baseadas nos 3 exemplos. Você pode editar à vontade — é só ponto de partida.
