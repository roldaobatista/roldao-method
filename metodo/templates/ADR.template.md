---
id: <AdrId>
titulo: <TituloCurtoImperativo>
status: proposta
data-proposta: <YYYY-MM-DD>
data-aceite: <DataAceiteOuVazio>
depende-de: []
bloqueia-fase: <F-NNN|vazio>  # Lista das fases que dependem desta decisão (forma canônica F-NNN). Vazio = informativo, não bloqueia.
superseded-by: <AdrIdOuVazio>
owner: <Quem>
revisado-em: <YYYY-MM-DD>
idioma: pt-BR
limite-linhas: 250
proposito: registro imutável de decisão arquitetural — contexto, alternativas, decisão e consequências
---

<!--
template: ADR.template.md
uso: copiar para docs/adr/ADR-NNNN-<slug>.md (NNNN = sequencial 4 dígitos, slug em kebab-case).
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C2
schema-frontmatter: ADRs usam schema próprio (id/titulo/status/data-proposta/data-aceite/depende-de/bloqueia-fase/superseded-by) em vez do padrão owner/revisado-em/status. Documentado em CONVENCOES-DOC.md §"schemas alternativos".
-->


<!--
template: docs/adr/ADR-NNNN-<slug>.md
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C3
status válidos: proposta | aceita | substituida | deprecada
(decisão é substantivo feminino — todos os status são femininos)

Diferença entre `data-aceite` e `ultima-conferencia`:
- `data-aceite`: a data em que a decisão foi aceita. Não muda mais.
- `ultima-conferencia`: a última vez em que alguém releu o ADR e confirmou
  que continua válido no contexto atual. ADR aceito NÃO é revisado nem
  reescrito — se a decisão precisa mudar, abre-se um ADR novo que faz
  `superseded-by` apontar para este.
-->

# ADR-NNNN: <título>

## Contexto

<2-5 parágrafos. Qual problema motivou esta decisão? Qual restrição (técnica, de negócio, de prazo) força a escolha? Que decisões anteriores moldam o espaço de soluções? Citar ADRs em `depende-de`.>

## Opções consideradas

### Opção 1: <nome curto>

- **Prós:** <lista>
- **Contras:** <lista>
- **Custo:** <esforço/prazo/risco>

### Opção 2: <nome curto>

- **Prós:** <lista>
- **Contras:** <lista>
- **Custo:** <esforço/prazo/risco>

### Opção 3: <nome curto>

- **Prós:** <lista>
- **Contras:** <lista>
- **Custo:** <esforço/prazo/risco>

<!-- Mínimo 2 opções consideradas. Se só houver 1, justificar por que não havia alternativa. -->

## Decisão

Escolhemos a **Opção <N>: <nome>**.

<1-2 parágrafos justificando: qual critério decidiu? por que os contras foram aceitáveis?>

## Consequências

### Positivas
- <impacto bom esperado>
- <impacto bom esperado>

### Negativas
- <custo aceito>
- <débito assumido — citar issue/tarefa se aplicável>

### Reversibilidade
<baixa | média | alta>. <Como reverter se a decisão se mostrar errada? Custo de reverter?>

## Non-goals

Esta ADR NÃO decide:
- <o que fica de fora>
- <o que fica de fora>

## Como validar (gates)

Critérios binários que comprovam que a decisão foi implementada conforme esperado:

- [ ] <gate verificável — ex.: "auditor-stack reporta passou=true para todos os módulos novos">
- [ ] <gate verificável — ex.: "build de exemplo roda em <X> segundos">
- [ ] <gate verificável>

## Referências

- <link interno: spec, módulo, outra ADR>
- <link externo: RFC, post, doc oficial>
- <issue / discussão que originou>

<!-- ============================================================ -->
<!-- exemplo preenchido — copiar como ponto de partida ao criar    -->
<!-- um ADR real. Salvar em docs/adr/ADR-0001-<slug>.md            -->
<!-- ============================================================ -->

<!--
EXEMPLO COMPLETO (não faz parte do template; serve como referência):

---
id: ADR-0001
titulo: Adotar SQLite como banco padrão até o produto atingir 10k clientes
status: aceita
data-proposta: 2026-01-10
data-aceite: 2026-01-17
depende-de: []
bloqueia-fase: F-1, F-2
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-20
---

# ADR-0001: Adotar SQLite como banco padrão até o produto atingir 10k clientes

## Contexto

O produto está em fase inicial, sem clientes pagantes em produção. Precisamos
de um banco de dados que rode sem servidor separado (o produto é desktop,
empacotado em Electron) e que tenha tooling maduro em Node.js.

Volume esperado nos próximos 12 meses: < 100 instalações ativas, cada uma
com seu banco local. Não há requisito de acesso multi-usuário concorrente
em uma mesma base.

## Opções consideradas

### Opção 1: SQLite (via better-sqlite3)

- Prós: zero configuração, embedded no app, performance excelente para
  leitura, tooling consolidado, sem custo de hospedagem.
- Contras: escrita concorrente limitada (1 escritor por vez), não suporta
  acesso de múltiplas instâncias na mesma base.
- Custo: baixo. ~1 dia para integrar.

### Opção 2: PostgreSQL local empacotado

- Prós: feature-completo, suporta concorrência, mesmo motor pode ser usado
  em servidor no futuro.
- Contras: empacotar Postgres em Electron é frágil; tamanho do instalador
  cresce ~150MB; suporte multi-plataforma é complexo.
- Custo: alto. 1-2 semanas de integração e empacotamento.

### Opção 3: PostgreSQL em servidor (modo cliente-servidor)

- Prós: arquitetura limpa, escala depois.
- Contras: muda o modelo do produto (passa a depender de internet e
  servidor nosso); custo mensal por cliente; latência; LGPD vira problema
  maior (dado em servidor nosso).
- Custo: muito alto. Reescreve produto.

## Decisão

Escolhemos a **Opção 1: SQLite via better-sqlite3**.

O produto é, por design, um aplicativo desktop com banco local por
instalação. SQLite atende todos os requisitos atuais com complexidade
mínima. Quando passarmos de 10k clientes ou surgir requisito de
sincronização, abrimos um ADR novo que faz superseded-by deste.

## Consequências

### Positivas
- Instalador pequeno (~80MB total).
- Backup é cópia de arquivo — runbook trivial.
- Zero custo de hospedagem de banco.

### Negativas
- Não daremos suporte a múltiplos usuários simultâneos no mesmo banco
  até futura migração.
- Migração futura para Postgres exigirá ADR e plano de transição.

### Reversibilidade
Média. As queries são escritas em SQL padrão; better-sqlite3 e node-postgres
têm APIs parecidas o suficiente. Custo estimado de migração futura:
2-3 semanas se feito antes de 5k clientes; 4-6 semanas depois.

## Non-goals

Esta ADR NÃO decide:
- Estratégia de sincronização entre instalações (assunto de ADR futura).
- Backup em nuvem (assunto de outro ADR).

## Como validar (gates)

- [x] better-sqlite3 instalado e empacotado no build de release.
- [x] Migração inicial roda em < 2 segundos em máquina de referência.
- [x] Runbook de backup/restore publicado em docs/operacao/runbooks/.

## Referências

- https://www.sqlite.org/whentouse.html
- https://github.com/WiseLibs/better-sqlite3
- discussão #12 no repositório
-->

