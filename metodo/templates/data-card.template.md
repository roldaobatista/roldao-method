---
template: data-card.template.md
destino: docs/dominios/ia/datasets/<dataset>/data-card.md
owner: <responsavel-dados>
revisado-em: <YYYY-MM-DD>
status: draft
proposito: documentar origem, composicao, vieses e licenca de um dataset usado em IA
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C7
idioma: pt-BR
limite-linhas: 200
---

<!--
Inspirado em Google Data Cards (Pushkarna et al., 2022) e Datasheets for
Datasets (Gebru et al., 2018). Todo dataset que alimenta modelo em
producao precisa de data-card publicado e revisado. Sem data-card,
nao se aprova model-card que dependa do dataset.
-->

# Data Card — <nome-do-dataset>

> **CONDICIONAL** — só se aplica a projeto que usa IA com dados pessoais/regulados. Se o produto NAO trata dado pessoal ou nao usa modelos, marcar este arquivo como N/A em `docs/nao-aplica.md` com gatilho de reavaliacao.

## 1. Identificacao

- **Nome:** <nome-canonico>
- **Versao:** <semver | snapshot YYYY-MM-DD | hash>
- **Tipo:** <tabular | texto | imagem | audio | video | multimodal | grafo>
- **Volume:** <numero de registros | tamanho em GB>
- **Fonte primaria:** <sistema interno | API externa | crawl | parceiro | publico>
- **Local do artefato:** <S3 path | DVC | git LFS | data warehouse>
- **Cadencia de atualizacao:** <one-shot | diaria | semanal | mensal | sob demanda>

## 2. Composicao

### Volume e estrutura
- **Total de registros:** <N>
- **Numero de features/colunas:** <N>
- **Schema:** <link para schema formal — JSON Schema, Avro, dbt model>

### Distribuicao de classes (se aplicavel)
| classe | volume | % do total |
| --- | --- | --- |
| <classe A> | <N> | <%> |
| <classe B> | <N> | <%> |
| <classe C> | <N> | <%> |

### Distribuicao por dimensao demografica/temporal (se aplicavel)
| dimensao | distribuicao |
| --- | --- |
| <idade> | <faixas + %> |
| <regiao> | <% por regiao> |
| <periodo> | <% por trimestre/ano> |

## 3. Coleta

- **Metodo de coleta:** <formulario | log de produto | scraping | parceria | comprado>
- **Periodo de coleta:** <YYYY-MM-DD ate YYYY-MM-DD>
- **Consentimento:** <opt-in explicito | termo de uso | base legal LGPD: <inciso>>
- **Anonimizacao aplicada:** <nenhuma | hash de identificadores | k-anonymity | differential privacy | tokenizacao>
- **Re-identificacao possivel?** <sim/nao + justificativa>

## 4. Processamento

### Limpezas aplicadas
- <remocao de duplicatas — criterio>
- <tratamento de valores ausentes — estrategia>
- <remocao de outliers — criterio e volume removido>
- <correcao de encoding | normalizacao de strings>

### Transformacoes aplicadas
- <normalizacao numerica — min-max | z-score>
- <encoding categorico — one-hot | target | embedding>
- <feature engineering — features derivadas>
- <balanceamento — oversampling | undersampling | SMOTE>

### Pipeline de processamento
- **Codigo:** <link para o repo/script>
- **Hash do pipeline:** <commit ou versao>
- **Reproducibilidade:** <seed fixo | DAG versionado>

## 5. Divisao train/val/test

- **Train:** <%> — <N registros>
- **Validation:** <%> — <N registros>
- **Test (holdout):** <%> — <N registros>
- **Estrategia de divisao:** <random | estratificada por <feature> | temporal | por grupo>
- **Leakage check:** <metodo aplicado — group-aware split | data cutoff | hash-overlap | feature audit>
- **Resultado do leakage check:** <passou/falhou + detalhes>

## 6. Variaveis sensiveis

### PII presente
- [ ] Nome
- [ ] CPF/CNPJ
- [ ] Email
- [ ] Telefone
- [ ] Endereco
- [ ] IP
- [ ] Dado biometrico
- [ ] Dado de saude
- [ ] Dado financeiro
- [ ] Geolocalizacao
- [ ] Outro: <especificar>

### Variaveis demograficas / protegidas
- <genero | raca/etnia | religiao | orientacao | idade | renda | outra>

### Vinculo com ROPA / LGPD
- **Registro ROPA:** <link para entrada no ROPA — Registro de Operacoes de Tratamento>
- **Base legal:** <consentimento | execucao de contrato | obrigacao legal | legitimo interesse | outra>
- **DPO notificado:** <sim/nao + data>

## 7. Licenca

- **Licenca de uso:** <proprietario | CC-BY | CC0 | MIT | Apache 2.0 | comercial | outra>
- **Atribuicao exigida:** <texto exato a usar | N/A>
- **Restricoes:** <comercial | redistribuicao | derivativo>
- **Validade:** <indefinida | ate YYYY-MM-DD | sujeita a renovacao>

## 8. Uso recomendado vs proibido

### Recomendado
- <treino de modelos para o caso X>
- <benchmarking interno>

### Proibido
- <treino de modelo para decisao automatizada de credito | RH | etc>
- <redistribuicao publica>
- <uso fora do tenant que originou os dados>

## 9. Vieses conhecidos

- <sobre-representacao de grupo X — % e impacto esperado em modelos>
- <coleta concentrada em periodo/regiao — impacto em generalizacao>
- <vies de selecao no metodo de coleta>
- <ausencia de grupo Y — modelos NAO devem ser usados para esse grupo>

## 10. Manutencao

- **Owner tecnico:** <nome>
- **Owner de produto:** <nome>
- **Cadencia de atualizacao:** <periodicidade>
- **Politica de retencao:** <tempo + criterio de exclusao>
- **Politica de exclusao a pedido (LGPD):** <processo + SLA>
- **Data da ultima revisao:** <YYYY-MM-DD>
- **Proxima revisao programada:** <YYYY-MM-DD>

## 11. Referencias

- Schema formal: <link>
- Pipeline de processamento: <link>
- ROPA: <link>
- Model-cards que usam este dataset: <lista>

## 12. Checklist de promocao draft -> stable

- [ ] Identificacao (§1) e composicao (§2) preenchidas com volumes reais (nao placeholder).
- [ ] Coleta (§3) com base legal LGPD declarada e consentimento documentado.
- [ ] Variaveis sensiveis (§6) auditadas; vinculo com ROPA preenchido.
- [ ] Licenca (§7) confirmada com juridico; restricoes claras.
- [ ] Vieses conhecidos (§9) listados a partir da distribuicao real.
- [ ] Owner tecnico e de produto (§10) nomeados.
- [ ] `revisado-em` atualizado; `status: stable`.

---
> Termos tecnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
