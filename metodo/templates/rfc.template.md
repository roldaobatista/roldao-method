---
owner: <AutorPrincipal>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 200
proposito: propor mudança pública e coletar feedback aberto da comunidade antes de decidir
---

<!--
template: rfc.template.md
uso: copiar para docs/comunidade/rfcs/RFC-NNNN-<slug>.md (NNNN sequencial 4 dígitos).
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C12

RFC (Request For Comments) = proposta PÚBLICA, COLABORATIVA, EXTERNA.
ADR = decisão TOMADA, INTERNA, registro de "já escolhemos isso".

Use RFC quando: a mudanca afeta usuarios da biblioteca/produto open-source,
exige consenso de varios maintainers ou impacta a comunidade.

Use ADR quando: a decisao e interna ao time, ja foi tomada e voce so
quer registrar contexto e consequencias.

Fluxo tipico: RFC aprovada -> ADR de implementacao -> codigo.

Status validos: draft | review | accepted | rejected | withdrawn | superseded.
-->

# RFC-NNNN: <titulo curto imperativo>

## Header

- **Numero:** RFC-NNNN
- **Titulo:** <titulo completo>
- **Autor(es):** <nome 1>, <nome 2>
- **Status:** draft
- **Criado em:** <YYYY-MM-DD>
- **Atualizado em:** <YYYY-MM-DD>
- **Periodo de comentarios:** <YYYY-MM-DD ate YYYY-MM-DD> (minimo <N> dias)
- **Discussao:** <link para issue/forum/discussao publica>
- **Substitui:** <RFC-NNNN ou vazio>
- **Substituida por:** <RFC-NNNN ou vazio>

## Sumario

<3 linhas. Resposta direta para "o que esta sendo proposto?" — sem contexto, sem motivacao, so a proposta nua.>

## Motivacao

### Problema
<Qual dor ou limitacao concreta esta proposta resolve? Quem sente essa dor? Como ela se manifesta hoje?>

### Por que agora
<Por que esta e a hora de resolver? O que mudou? Qual evento ou aprendizado tornou esta proposta relevante neste momento?>

### Quem se beneficia
- <persona/grupo 1 — beneficio esperado>
- <persona/grupo 2 — beneficio esperado>

## Proposta detalhada

<Coracao da RFC. Explicar a proposta em detalhe suficiente para que um implementador consiga comecar sem perguntar. Inclua:>

### Visao geral
<paragrafo de abertura — desenho da solucao em alto nivel>

### Comportamento esperado
<descrever o comportamento como o usuario/consumidor da API/feature vai ver>

### API / interface (se aplicavel)
```
<exemplo de uso da API ou interface proposta>
```

### Especificacao tecnica
<detalhes de implementacao relevantes para revisores entenderem viabilidade — estruturas de dados, fluxo, dependencias, mudancas em modulos existentes>

### Exemplos de uso
1. <caso de uso 1 — como fica>
2. <caso de uso 2 — como fica>
3. <caso de uso de borda — como fica>

## Alternativas consideradas

### Alternativa 1: <nome curto>
- **Como funcionaria:** <descricao>
- **Por que NAO escolhida:** <motivo>

### Alternativa 2: <nome curto>
- **Como funcionaria:** <descricao>
- **Por que NAO escolhida:** <motivo>

### Alternativa 0: nao fazer nada
- **Consequencia:** <o que acontece se a proposta NAO for adotada>

## Tradeoffs

### Pros
- <ganho 1>
- <ganho 2>

### Contras
- <custo 1>
- <custo 2>

### O que estamos aceitando perder
- <tradeoff explicito — feature X fica mais lenta, codigo Y fica mais complexo, etc>

## Impacto em usuarios atuais

### Breaking changes?
- [ ] Sim
- [ ] Nao

### Se sim, qual o caminho de migracao?
- **Versao em que a mudanca entra:** <versao>
- **Versao em que o comportamento antigo deixa de funcionar:** <versao>
- **Janela de deprecation:** <N versoes ou N meses>
- **Ferramenta de migracao automatica:** <link ou N/A>
- **Documento de migracao:** <link>

### Se NAO breaking
<Como a coexistencia entre comportamento novo e antigo funciona? Feature flag? Opt-in?>

## Questoes em aberto

- <pergunta 1 que ainda precisa de resposta da comunidade>
- <pergunta 2 — tradeoff que o autor nao decidiu>
- <pergunta 3 — area cinza>

## Plano de implementacao

### Fase 1: <nome> — <prazo>
- <entrega 1>
- <entrega 2>

### Fase 2: <nome> — <prazo>
- <entrega 1>

### Fase 3: <nome> — <prazo>
- <entrega 1>

### Dependencias
- <RFC ou ADR ou tarefa que precisa ser concluida antes>

## Criterio de aceite

A RFC e considerada IMPLEMENTADA com sucesso quando:

- [ ] <gate verificavel 1>
- [ ] <gate verificavel 2>
- [ ] <gate verificavel 3 — ex: documentacao publicada>
- [ ] <gate verificavel 4 — ex: anuncio feito no canal X>

## Processo de decisao

- **Modelo:** <lazy consensus | consenso explicito | votacao>
- **Quorum (se votacao):** <N maintainers>
- **Maioria exigida:** <simples | 2/3 | unanimidade>
- **Quem decide em caso de empate:** <papel definido na governanca>
- **Referencia:** ver `docs/comunidade/governanca.md`

## Referencias

- Discussao original: <link>
- ADRs relacionados: <lista>
- RFCs relacionadas: <lista>
- Implementacoes em outros projetos: <link>
- Documentos externos: <link>

---
> Termos tecnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
