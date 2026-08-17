---
template: model-card.template.md
destino: docs/dominios/ia/modelos/<modelo>/model-card.md
owner: <responsavel-ia>
revisado-em: <YYYY-MM-DD>
status: draft
proposito: documentar identidade, uso, metricas, vieses e conformidade de um modelo de IA
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C7
idioma: pt-BR
limite-linhas: 200
---

<!--
Inspirado em Google Model Cards (Mitchell et al., 2019) e nos requisitos
de documentacao da EU AI Act. Preencher TODAS as secoes — campo vazio e
sinal de modelo sem dono ou sem avaliacao formal.

Categoria IA Act:
- minimal: filtros de spam, recomendacao de produto trivial.
- limited: chatbot, geracao de conteudo (precisa de disclosure).
- high-risk: credito, RH, saude, biometria, educacao, justica.
- prohibited: scoring social, manipulacao subliminar.
-->

# Model Card — <nome-do-modelo>

> **CONDICIONAL** — só se aplica a projeto que usa modelos de IA. Se o produto NAO usa IA, marcar este arquivo como N/A em `docs/nao-aplica.md` com gatilho de reavaliacao.

## 1. Identificacao

- **Nome:** <nome-canonico>
- **Versao:** <semver ou hash do checkpoint>
- **Tipo:** <classifier | regressor | LLM-finetune | embedder | ranker | recommender | outro>
- **Arquitetura base:** <ex: BERT-base, XGBoost, GPT-4o-finetune, custom CNN>
- **Framework:** <PyTorch | TensorFlow | sklearn | HuggingFace | outro>
- **Tamanho:** <numero de parametros | tamanho em MB do artefato>
- **Data de treino:** <YYYY-MM-DD>
- **Local do artefato:** <S3 path | registry URL | git LFS path>

## 2. Uso pretendido

### Casos de uso primarios
- <caso 1: descricao + persona + valor entregue>
- <caso 2>

### Usos fora de escopo (NAO usar para)
- <caso proibido 1 — ex: decisao final sem revisao humana>
- <caso proibido 2 — ex: dominio diferente do treinado>
- <caso proibido 3 — ex: populacao demografica nao representada>

## 3. Metricas

### Performance
| metrica | valor | dataset de avaliacao |
| --- | --- | --- |
| <acuracia | F1 | AUC | MAE | BLEU | etc> | <valor> | <link a data-card> |
| <latencia p50> | <ms> | <hardware> |
| <latencia p99> | <ms> | <hardware> |
| <throughput> | <req/s> | <hardware> |

### Custo
- **Custo por inferencia:** <R$ ou USD>
- **Custo de treino full:** <total>
- **Custo de re-treino incremental:** <total>

## 4. Dataset

- **Treino:** <link a data-card do dataset de treino> — <volume>
- **Validacao:** <link> — <volume>
- **Teste (holdout):** <link> — <volume>
- **Leakage check:** <metodo aplicado | data-cutoff | hash-overlap>

## 5. Avaliacao de vieses e fairness

### Grupos avaliados
<Listar grupos demograficos ou de borda relevantes para o caso de uso. Se o caso for credito, listar grupos protegidos. Se for saude, listar faixas etarias. Etc.>

| grupo | metrica | valor | gap vs media |
| --- | --- | --- | --- |
| <ex: feminino> | <F1> | <valor> | <%> |
| <ex: masculino> | <F1> | <valor> | <%> |
| <ex: 18-25> | <F1> | <valor> | <%> |

### Metricas de fairness aplicadas
- <demographic parity | equal opportunity | calibration | outra>: <resultado>

### Casos de borda testados
- <input adversarial | input fora de distribuicao | input vazio | etc>

## 6. Limitacoes conhecidas

- <limitacao 1: dominio, idioma, formato>
- <limitacao 2: degradacao em sub-populacao X>
- <limitacao 3: dependencia de feature Y disponivel apenas em ambiente Z>

## 7. Requisitos de hardware e recursos

- **Inferencia:** <CPU | GPU minimo | RAM | disco>
- **Treino:** <GPU/TPU exigida | horas estimadas | memoria>
- **Servico em producao:** <containers | autoscaling | latencia alvo>

## 8. Monitoring em producao

- **Drift detection:** <metodo — PSI | KS | feature distribution | embedding distance>
- **Performance drop alert:** <threshold | janela de avaliacao>
- **Logging:** <quais inputs/outputs sao registrados | retencao | PII handling>
- **Trigger de re-treino:** <criterio binario>
- **Dashboard:** <link>

## 9. Versionamento

- Toda chamada de inferencia retorna `model_version: <id>` no payload.
- Mudancas de versao seguem semver: MAJOR = breaking schema, MINOR = nova feature, PATCH = re-treino sem mudanca de comportamento.
- Rollback testado em: <YYYY-MM-DD>

## 10. Conformidade IA Act EU

- **Categoria:** <minimal | limited | high-risk>
- **Justificativa:** <por que esta categoria>
- **Requisitos adicionais aplicaveis:**
  - [ ] Disclosure ao usuario final (limited / high-risk)
  - [ ] Avaliacao de conformidade documentada (high-risk)
  - [ ] Sistema de gestao de risco (high-risk)
  - [ ] Supervisao humana definida (high-risk)
  - [ ] Logging de inferencias por 6 meses (high-risk)
  - [ ] Registro na base EU (high-risk)

> **Decisao automatizada sobre pessoas?** Se o modelo decide ou pontua titular (escore, recomendacao, recusa, ranking que afeta a pessoa), a LGPD Art. 20 e o EU AI Act Art. 13-14 exigem **AIPD/DPIA** com supervisao humana descrita. Abrir `docs/conformidade/lgpd/aipd-<tratamento>.md` (template `aipd.template.md`) antes de subir o modelo para producao.

## 11. Responsabilidade

- **Owner tecnico:** <nome>
- **Owner de produto:** <nome>
- **Comite de etica/revisao:** <nome ou N/A>
- **Data da ultima revisao:** <YYYY-MM-DD>
- **Proxima revisao programada:** <YYYY-MM-DD>

## 12. Referencias

- Data-card do dataset de treino: <link>
- ADR de adocao do modelo: <ADR-NNNN>
- RFC associada (se houver): <RFC-NNNN>
- AIPD/DPIA (se ha decisao automatizada): <link para aipd-<tratamento>.md>
- Paper / artigo de referencia: <link>

## 13. Checklist de promocao draft -> stable

- [ ] Identificacao (§1) e uso pretendido (§2) preenchidos, com usos fora de escopo claros.
- [ ] Metricas (§3) medidas em dataset de avaliacao com link a data-card.
- [ ] Avaliacao de vieses (§5) feita nos grupos relevantes ao caso de uso.
- [ ] Categoria IA Act (§10) classificada e justificada.
- [ ] Se ha decisao automatizada sobre pessoas: AIPD/DPIA aberta e vinculada (§10, §12).
- [ ] Owner tecnico e de produto (§11) nomeados.
- [ ] `revisado-em` atualizado; `status: stable`.

---
> Termos tecnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
