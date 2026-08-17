---
owner: <DPO-nome>
ultima-conferencia: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!-- proposito: politica de retencao e descarte de dados pessoais (LGPD Art. 15, 16, 18) -->

# Politica de Retencao e Descarte de Dados — conciliab

> **Retencao** = por quanto tempo guardamos cada tipo de dado.
> **Descarte (expurgo)** = como apagamos quando o prazo acaba ou quando o
> titular pede.
>
> Atende LGPD Art. 15 (termino do tratamento), Art. 16 (conservacao apos
> termino, com excecoes legais) e Art. 18, VI (direito do titular pedir
> eliminacao).

## 1. Categorias de dado

| Categoria | Exemplos no conciliab | Sensibilidade |
|---|---|---|
| Dado pessoal comum | Nome do socio, e-mail, telefone, CPF do responsavel | media |
| Dado bancario | Numero de conta, agencia, transacoes (com pagador/recebedor) | media-alta (regulado pelo Bacen, mas nao "sensivel" no sentido do Art. 5, II) |
| Dado pessoal sensivel (Art. 5, II) | nao tratamos | n/a |
| Dado transacional / fiscal | NF, fatura, contrato com cliente, audit_log | media (obrigacao fiscal) |
| Logs de aplicacao | Trilha de acoes do usuario, IPs, user-agent | baixa-media |
| Logs de seguranca / acesso | Logins, falhas de autenticacao, tentativas suspeitas | media |
| Telemetria / metricas | Tempo de resposta, contagem de uso (sem identificar pessoa) | baixa |

Exemplo preenchido: tabela `tenant_admin` contem nome, CPF, e-mail, telefone do
socio responsavel → categoria "dado pessoal comum".

## 2. Prazo de retencao por categoria

| Categoria | Prazo | Justificativa | Base legal |
|---|---|---|---|
| Cadastro de tenant + admin | enquanto vigente contrato + 5 anos | obrigacao fiscal (Lei 8.846/94) + possivel disputa civil (CC Art. 206, §5) | execucao de contrato + obrigacao legal |
| Extratos bancarios brutos (S3) | enquanto vigente contrato + 5 anos | obrigacao fiscal (Decreto 70.235/72) | obrigacao legal |
| Dado de cobranca / token Stripe | 5 anos apos ultima cobranca | obrigacao fiscal (NF-e) | obrigacao legal |
| `audit_log` | 5 anos (WORM — so INSERT, INV-AUDIT-002) | comprovacao para auditor externo, disputa fiscal | obrigacao legal |
| Logs de aplicacao com identificacao | 6 meses | investigacao de incidente, fraude | legitimo interesse |
| Logs de seguranca / acesso (Cognito + WAF) | 12 meses | resposta a incidente, Marco Civil Art. 15 | legitimo interesse + Marco Civil |
| Telemetria anonimizada (Datadog) | 13 meses (rolling window do plano) | analise de performance | n/a (anonimizada) |
| Backup contendo dados pessoais | conforme `backup.md` (diario 30d, semanal 12sem, mensal 12m, anual 5a) | retencao alinhada com obrigacao fiscal | execucao de contrato + obrigacao legal |
| Tickets de suporte | 24 meses apos encerramento | melhoria de produto + auditoria | legitimo interesse |
| Pedido do titular (registro) | 5 anos apos atendimento | prova de cumprimento de obrigacao legal LGPD | obrigacao legal |

> Sempre que dois prazos competirem (ex: titular pede eliminacao mas dado tem
> obrigacao fiscal de 5 anos), prevalece o prazo legal. Justificar formalmente
> ao titular (Art. 18, §4).

## 3. Processo de expurgo

| Tipo | Como acontece | Frequencia |
|---|---|---|
| Logs de aplicacao | cron `expurgo_logs_aplicacao` (CloudWatch Logs retention 6 meses) | diario (automatico) |
| Logs Cognito | retention 12 meses (config do user pool) | diario (automatico) |
| Arquivos brutos S3 vencidos | S3 lifecycle policy → Glacier apos 90 dias, expurgo apos 5 anos + vigencia | automatico |
| Cadastros vencidos (tenant cancelado + 5 anos) | job mensal Celery `expurgo_tenants_vencidos` | mensal |
| Pedido de titular (Art. 18, VI) | runbook `atender-pedido-eliminacao.md`, trigger manual | sob demanda, prazo 15 dias |
| Conta cancelada pelo cliente | hard-delete dos dados nao-fiscais apos 30 dias de "soft-delete" (mantem fiscais por obrigacao legal) | trigger por evento de cancelamento |
| Tickets de suporte > 24 meses | export + delete via API do Front | mensal |

Soft-delete = `deleted_at IS NOT NULL` mas dados permanecem (permite
arrependimento). Hard-delete = `DELETE` real (com filtro por tenant + RLS).

## 4. Auditoria de expurgo

Cada operacao de expurgo gera linha em `audit_expurgo_tenanted`:

| Campo | Conteudo |
|---|---|
| timestamp | quando rodou |
| tenant_id | em qual tenant (NULL para expurgo cross-tenant de log) |
| categoria | tipo de dado expurgado |
| volume | quantos registros |
| criterio | regra que disparou o expurgo |
| executor | usuario / cron / sistema |
| referencia | id do pedido do titular, se aplicavel |

Logs de auditoria sao **imutaveis** (so INSERT — INV-AUDIT-002) e tem retencao
propria de 5 anos.

## 5. Excecoes (quando NAO podemos apagar)

Mesmo com pedido do titular ou prazo vencido, NAO apagamos se houver:

- **Obrigacao fiscal** (5 anos para NF, escrituracao contabil — Lei 8.846/94,
  Decreto 70.235/72).
- **Investigacao em curso** (fraude, lavagem, ordem judicial — Art. 16, II).
- **Processo judicial em curso** envolvendo aquele dado (preservar evidencia).
- **Auditoria externa do cliente** em andamento e o `audit_log` e a evidencia
  central.

Em caso de excecao aplicada, comunicar ao titular em ate 15 dias, citando o
fundamento legal (Art. 18, §5 + §6).

## 6. Direito de eliminacao (Art. 18, VI)

Titular pode pedir que seus dados sejam apagados quando:
- Tratamento for desnecessario ou excessivo.
- Tratamento for ilicito.
- Consentimento foi a base legal E ele esta sendo revogado (no nosso caso, a
  base legal padrao e execucao de contrato — pedido de eliminacao implica
  cancelamento do contrato).

Processo interno:
1. **Recebimento:** canal `lgpd@conciliab.com.br` ou rota `POST /v1/lgpd/pedidos`.
2. **Identificacao:** confirmar identidade (CPF + e-mail cadastrado, ou outro
   meio robusto).
3. **Analise:** verificar se ha excecao aplicavel (§5).
4. **Execucao:** rodar runbook `docs/operacao/runbooks/atender-pedido-eliminacao.md`.
5. **Confirmacao ao titular:** e-mail formal em ate 15 dias informando o que
   foi apagado, o que ficou retido (com fundamento), e proximos passos.
6. **Registro:** linha em `audit_pedidos_titular_tenanted`.

## 7. Anonimizacao vs eliminacao

| Tecnica | O que faz | Quando usar |
|---|---|---|
| **Eliminacao** (hard-delete) | apaga registro do banco + objeto S3 | titular pediu E nao ha excecao; ou prazo legal venceu |
| **Anonimizacao** (Art. 12) | remove tudo que identifica a pessoa, mantem dado agregado | precisamos do dado para metrica/produto mas nao precisamos saber DE QUEM (ex: media de tempo de conciliacao por mes) |
| **Pseudonimizacao** | substitui identificadores por chave (reversivel) | seguranca interna, NAO substitui anonimizacao para fins de LGPD |

Anonimizacao bem feita tira o dado do escopo da LGPD (Art. 12).
Pseudonimizacao **nao**.

## 8. Responsaveis

| Papel | Quem | O que faz |
|---|---|---|
| DPO (Encarregado) | <DPO-nome> | aprova mudancas, atende ANPD e titular, revisao anual |
| Dono do dado (data owner) | <DEV-1> (tabelas tecnicas) + <PRODUCT> (cadastro de cliente) | define se o dado dele tem excecao aplicavel |
| Auditor interno | <DPO-nome> (acumula) | confere trimestralmente se jobs de expurgo rodaram e se pedidos foram atendidos no prazo |

## 9. Historico de revisoes

| Data | Revisor | Mudanca |
|---|---|---|
| 2026-02-15 | <DPO-nome> | criacao inicial |
| 2026-05-15 | <DPO-nome> | auditoria anual concluida; adicionada linha "Tickets de suporte" apos contratacao do Front |
