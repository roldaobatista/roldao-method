---
owner: roldao
revisado-em: 2026-05-27
status: stable
origem: CHECKLIST-PRONTO-PRA-CODAR.md
proximo: CURRENT.md (painel vivo)
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: docs/faseamento/F-A/kickoff.md
(preenchido no exemplo saas-python-regulado)
-->

# Kickoff — Fase F-A: Foundations (infra + primeiro fluxo fim-a-fim)

## 1. Objetivo da fase

Entregar o primeiro fluxo fim-a-fim do conciliab que justifica a tese: cliente
sobe CSV bancario, sistema concilia automaticamente contra contas a receber/pagar
ja cadastradas, e devolve a lista do que bateu (com regra explicita) e do que
caiu em divergencia. Tudo isso com isolamento multi-tenant (RLS), trilha
imutavel (audit_log WORM), e PII fora dos logs.

Ao final desta fase, os 3 clientes-piloto pagantes (beta R$ 49/mes) conseguem
rodar a conciliacao do mes deles sem usar Excel — esse e o teste binario de
sucesso da fase.

## 2. Pre-condicoes

A fase so inicia oficialmente quando TODOS os itens abaixo estiverem marcados.

- [x] PRDs das US incluidas em status `stable`.
- [x] ADRs bloqueantes aceitas (listar abaixo).
- [x] Auditoria pre-fase concluida sem itens criticos abertos.
- [x] Subagentes/auditores requeridos convocados e cientes do escopo.
- [x] `docs/documentos-do-projeto.md` atualizado para refletir documentos
      bloqueantes desta fase.
- [x] Gates de pre-projeto fechados (CHECKLIST-PRONTO-PRA-CODAR marcado).

### ADRs bloqueantes desta fase

| ID | Tema | Status exigido |
|---|---|---|
| ADR-0000 | Uso de IA (Claude Code) | aceita |
| ADR-0001 | Stack Python + FastAPI | aceita |
| ADR-0002 | Multi-tenant via RLS | aceita |
| ADR-0003 | Storage PostgreSQL + S3 | aceita |

## 3. US (Historias do Usuario) incluidas

| ID | Titulo | Dominio/Modulo | Owner | Estimativa |
|---|---|---|---|---|
| US-CONC-001 | Conciliacao de extratos bancarios em CSV | financas/conciliacao | <DEV-1> | G (5-6 dias) |
| US-AUTH-001 | Login + cadastro de tenant (via Cognito) | identidade/auth | <DEV-2> | M (3-4 dias) |
| US-CADC-001 | CRUD basico de contas a pagar/receber | financas/contas | <DEV-3> | M (3 dias) |
| US-LGPD-001 | Endpoint de pedido de eliminacao do titular (Art. 18, VI) | lgpd | <DEV-2> | M (2 dias) |

> Escala de estimativa: **P** = ate 2h, **M** = meio dia (~4h), **G** = dia ou
> mais (≥8h).

## 4. Cronograma alto nivel

| Marco | Data alvo | Criterio de conclusao |
|---|---|---|
| Inicio | 2026-03-03 | todos os itens de §2 marcados |
| Meio | 2026-04-07 | US-AUTH-001 e US-CADC-001 em revisao; US-CONC-001 em execucao |
| Encerramento | 2026-05-19 | §6 satisfeito + 3 clientes-piloto rodando conciliacao real |

## 5. Riscos identificados

| ID | Risco | Probabilidade | Impacto | Mitigacao | Owner |
|---|---|---|---|---|---|
| R-FA-001 | Cognito tem latencia alta em sa-east-1 (raro mas critico no login) | baixa | alto | medir p95 em staging na semana 2; se > 1s, abrir ADR para mover auth para Auth0 | <DEV-2> |
| R-FA-002 | RLS adiciona overhead que estoura SLO da API | media | medio | benchmark obrigatorio em T-CONC-015; se p95 > 500ms, particionar tabela `conciliacao_tenanted` por hash de tenant_id | <DEV-1> |
| R-FA-003 | Cliente-piloto descobre divergencia que NAO existe no Excel dele (false positive do matching) | media | alto | regra de match conservadora + cliente pode contestar com 1 clique; instrumentar metrica `match_contestado_pct` | <PRODUCT> |
| R-FA-004 | Beta-cliente cancela porque parser do banco dele nao foi implementado | baixa | medio | comecar pelos 3 bancos dos 3 clientes-piloto (Itau, Santander, Bradesco — confirmados em 2026-02-25) | <DEV-1> |

## 6. Criterio binario de "fase iniciada"

A fase esta formalmente iniciada quando:
- [x] Todos os itens de §2 estao marcados.
- [x] Pelo menos uma US de §3 entrou em execucao com tarefa T-CONC-001 aberta.
- [x] `.agent/CURRENT.md` referencia "F-A — US-CONC-001 T-CONC-001 a T-CONC-005"
      como foco atual.

---
> Termos tecnicos: ver `docs/glossario.md`.
