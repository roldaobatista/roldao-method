---
owner: <PRODUCT>
revisado-em: 2026-05-27
status: stable
origem: descoberta/ (sintese-final, entrevistas EE-001..EE-008)
proximo: spec.md
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: docs/descoberta/problema.md (preenchido no exemplo saas-python-regulado)
-->

# Problema — conciliab

## A dor

Toda PME brasileira com 50-300 transacoes bancarias por mes vive a mesma rotina
de virada de mes: o socio-administrador (ou o financeiro interno, quando existe)
abre o extrato bancario em PDF/CSV, abre o ERP, e bate linha-a-linha com as
contas a pagar/receber. Em media, leva **3 a 5 horas por banco por mes**.

EE-002 (PME do varejo de cosmetico, RJ, R$ 2,1M/ano): "todo dia 5 do mes a minha
mulher para tudo pra bater o Itau. Quando da divergencia, ela perde mais um dia
pra achar de onde veio."

EE-005 (oficina mecanica, MG, R$ 800k/ano): "uso planilha. As vezes esqueco de
lancar um PIX recebido e so descubro na conciliacao, com 2 semanas de atraso."

Quando a empresa tem mais de uma conta (operacional + reserva + investimento),
o tempo triplica. Quando paga por boleto e PIX simultaneamente, multiplica de
novo.

EE-001 (contadora terceira, atende 22 PMEs em SP): "metade dos meus clientes
me manda o extrato e pede pra eu fazer. Cobro R$ 300/mes por isso. Se eles
mesmos batessem certo, eu vendia consultoria fiscal no lugar — vale mais."

## Quem sente

- **Socio-administrador de PME (15-150 funcionarios)**: nao tem time financeiro
  dedicado. Faz a conciliacao ele mesmo ou divide com conjuge/socio. Sente como
  fardo, nao como controle.
- **Financeiro interno de PME (quando existe — 1 a 3 pessoas)**: usuario final
  diario do produto. Quer terminar o mes antes do dia 10.
- **Contador terceirizado**: comprador influente, nao usuario. Recomenda
  ferramenta pros clientes para nao precisar fazer ele.
- **Distinguir**: o **comprador** e o socio-administrador (assina cheque), mas
  o **usuario** muitas vezes e outra pessoa. Onboarding tem que considerar
  ambos.

## Quanto custa hoje

- **Custo em tempo**: 3-5h por banco por mes × 3 contas medias = ~12h/mes do
  socio. Valorizando hora-socio a R$ 80, sao R$ 960/mes em "tempo dele" so na
  conciliacao.
- **Custo em dinheiro**: PMEs que terceirizam pra contador pagam R$ 200-400/mes
  por conciliacao (a parte da consultoria fiscal).
- **Custo em risco**: divergencia nao detectada vira erro na DRE, que vira
  erro no Simples ou IRPJ. 4 dos 8 entrevistados ja pagaram multa por
  inconsistencia que comecou em conciliacao errada.

## Por que solucao existente nao resolve

- **Conta Azul / Bling / Omie** (ERPs PME): tem conciliacao mas tratam como
  feature secundaria — sem reconciliacao automatica robusta. Match e
  todo-ou-nada por valor exato. Casos parciais (taxa, juros) viram trabalho
  manual igual ao Excel.
- **Excel/Sheets** (status quo): zero automacao. Erros silenciosos. Sem trilha.
- **Bancos com OFX** (Itau, Santander, Bradesco): exportam OFX mas o ERP do
  cliente nao consome bem — formato e tratado como CSV mal-feito.
- **Open Finance**: existe em pessoa juridica desde 2024, mas adoption ainda
  baixa nas PMEs (consentimento e fluxo confuso). Vamos plugar quando o
  segmento amadurecer (gate em ADR-0001).

## Validacoes pendentes

- **Hipotese H-001**: PME paga R$ 99-199/mes por ter conciliacao automatica? —
  Validado parcial: 3 PMEs assinaram beta pago R$ 49/mes por 6 meses; precisa
  testar R$ 99 e R$ 199 nos proximos 3 meses.
- **Hipotese H-002**: contadora indica a ferramenta pros clientes? — Aberta.
  Falar com 5 contadores em junho/2026.
- **Hipotese H-003**: cliente confia em entregar OFX/CSV sem Open Finance? —
  Validado: 6 dos 8 entrevistados ja exportam OFX hoje. Subir CSV nao e barreira.

Movidas para `descoberta/hipoteses-a-validar.md` (fora deste exemplo).

---
> Termos tecnicos: ver `docs/glossario.md`.
