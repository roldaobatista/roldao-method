---
modulo: conciliacao
owner: <PRODUCT>
revisado-em: 2026-05-27
status: stable
origem: problema.md
proximo: plan.md
idioma: pt-BR
limite-linhas: 150
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: docs/dominios/financas/modulos/conciliacao/spec.md
(preenchido no exemplo saas-python-regulado)
-->

# Spec — conciliacao

## US-CONC-001: Conciliacao de extratos bancarios em CSV

> US (Historia do Usuario) — primeiro fluxo fim-a-fim do produto. Permite que
> o cliente envie um extrato CSV e veja, ao final do processamento, quais
> transacoes bateram (com regra explicita aplicada) e quais ficaram em
> divergencia para revisao manual.

**Como** socio-administrador de PME,
**quero** subir o CSV do meu extrato bancario do mes
**e cruza-lo com as contas a pagar/receber que ja cadastrei no conciliab**,
**para** descobrir em minutos (em vez de horas) o que bateu e o que precisa
de atencao manual.

### Criterios de aceite

- **AC-CONC-001-1** (happy path):
  GIVEN tenant `T` autenticado com 50 contas a receber cadastradas
  WHEN faz `POST /v1/conciliacoes` com arquivo CSV contendo 50 transacoes que
       casam exatamente (valor + data ±1 dia) com as 50 contas
  THEN job de conciliacao termina em < 60s
   AND retorna 50 matches automaticos com `regra_aplicada = "match-exato-valor-data"`
   AND grava 50 linhas em `audit_log` (uma por match).

- **AC-CONC-001-2** (match parcial — diferenca de centavos por taxa bancaria):
  GIVEN conta a receber de R$ 1.000,00 prevista para 2026-04-10
  WHEN CSV contem credito de R$ 998,50 em 2026-04-10
  THEN sistema marca match com `regra_aplicada = "match-parcial-tolerancia-taxa"`
   AND diferenca de R$ 1,50 e classificada automaticamente como "taxa bancaria"
       se < R$ 5,00 OU < 1% do valor.

- **AC-CONC-001-3** (divergencia — sem match):
  GIVEN tenant `T`
  WHEN CSV contem credito de R$ 333,33 que nao casa com nenhuma conta a receber
  THEN linha entra como `status = "divergencia"` com `motivo = "sem-conta-correspondente"`
   AND aparece no painel de revisao manual do cliente.

- **AC-CONC-001-4** (CSV invalido):
  GIVEN CSV com colunas em ordem errada OU encoding nao-UTF8
  WHEN POST `/v1/conciliacoes`
  THEN retorna HTTP 422 com mensagem clara em PT-BR (nao "encoding mismatch
       at byte 0x7F")
   AND nao cria registro em `conciliacao_tenanted`.

- **AC-CONC-001-5** (isolamento entre tenants — INV-TENANT-001):
  GIVEN tenants `T1` e `T2`, cada um com contas a receber proprias
  WHEN `T1` envia CSV cujas linhas, por coincidencia, casariam com contas de `T2`
  THEN nenhum match cross-tenant acontece
   AND linhas do CSV de `T1` ficam como divergencia (sem-conta-correspondente)
   AND teste `tests/isolation/test_conciliacao_tenant_isolation.py` passa.

- **AC-CONC-001-6** (PII nao vaza em log — INV-AGENT-008):
  GIVEN CSV contendo emails, nomes e numeros de conta bancaria do cliente
  WHEN job de conciliacao roda e grava log estruturado
  THEN nenhum log linha contem dado bruto — todos passam por `mask_pii()`
   AND teste `tests/unit/test_pii_masker.py::test_conciliacao_logs_mascarados` passa.

- **AC-CONC-001-7** (trilha imutavel — INV-AUDIT-002):
  GIVEN match feito automaticamente
  WHEN tentativa de UPDATE ou DELETE em `audit_log` (mesmo por admin)
  THEN trigger `prevent_update_delete` bloqueia com erro PG
   AND linha original permanece intacta.

**Invariantes citadas:** INV-001, INV-TENANT-001, INV-TENANT-002, INV-AGENT-008,
INV-AUDIT-001, INV-AUDIT-002, INV-LGPD-001.

**Dependencias:** ADR-0001 (stack), ADR-0002 (RLS), ADR-0003 (storage S3),
modulo `arquivo-recebido` (upload S3), modulo `regras-match` (catalogo de
regras), `mask_pii()` util.

**Non-goals (esta US NAO faz):**
- Conciliacao em OFX (vira em US-CONC-002).
- Conciliacao via Open Finance (gate ICP-Brasil — US futura).
- UI de revisao manual de divergencia (US-CONC-003).
- Regra de match configuravel pelo cliente (US-CONC-005; nesta US o catalogo
  e fixo, 3 regras built-in).
- Notificacao por e-mail quando conciliacao termina (US-NOTIF-001).
- Relatorio mensal exportavel (US-REL-001).

## Riscos de produto

Riscos relacionados ao VALOR entregue ao usuario/negocio — riscos tecnicos
ficam em `plan.md` (§"Riscos de implementacao").

- **R-PROD-001 — Cliente sobe CSV "errado" (banco diferente, mes diferente) e
  acha que o produto e burro.**
  Mitigacao: detectar formato pelo header e mostrar pre-visualizacao das 3
  primeiras linhas + total de linhas, com botao "isso e o extrato que eu
  esperava?". Bloquear processamento ate confirmacao na primeira vez.

- **R-PROD-002 — Match parcial com tolerancia errada gera bate-cabeca:
  cliente acha que o "match-parcial-tolerancia-taxa" mascarou erro.**
  Mitigacao: tolerancia padrao conservadora (≤ R$ 5,00 OU ≤ 1%); regra
  aplicada SEMPRE aparece no detalhe da linha (cliente sabe o que aconteceu);
  cliente pode contestar com 1 clique e o sistema desfaz para divergencia.

- **R-PROD-003 — Tempo de processamento > 60s frustra usuario que esperava
  resposta instantanea.**
  Mitigacao: barra de progresso ao vivo (websocket); job iniciado em background
  retorna ticket imediato (HTTP 202); cliente pode fechar a tela e voltar.

- **R-PROD-004 — Cliente quebra contrato de upload (envia PDF/imagem em vez
  de CSV) e abandona porque a mensagem de erro nao orienta.**
  Mitigacao: mensagem de erro PT-BR clara ("voce enviou um PDF. Esta tela
  aceita so .csv. Quer ajuda para exportar CSV do <Itau|Santander|...>?
  ver tutorial.") + link para tutorial por banco.

---
> Termos tecnicos: ver `docs/glossario.md`.
