---
tipo: knowledge-base
id: KB-LGPD
versao: 1
status: stable
owner: auditor-seguranca
revisado-em: 2026-05-18
---

# KB — LGPD e proteção de dados

> Base de conhecimento sobre a Lei Geral de Proteção de Dados (Lei 13.709/2018) que o agente `auditor-seguranca` e a skill `checklist-lgpd` consultam.

## Conceitos básicos

- **Dado pessoal** (Art. 5 I): toda informação relacionada a pessoa natural identificada ou identificável.
- **Dado pessoal sensível** (Art. 5 II): origem racial/étnica, convicção religiosa, opinião política, filiação a sindicato/organização religiosa/política, dado referente à saúde, vida sexual, genético, biométrico.
- **Titular**: pessoa natural a quem o dado se refere.
- **Controlador**: quem decide finalidade e meios do tratamento.
- **Operador**: quem trata em nome do controlador.
- **Encarregado (DPO)**: pessoa física indicada pelo controlador, ponto de contato com ANPD e titulares.

## Bases legais — Art. 7 (dado não-sensível)

1. **Consentimento** do titular — específico, livre, informado, destacado.
2. **Cumprimento de obrigação legal/regulatória** pelo controlador.
3. **Pela administração pública** para tratamento e uso compartilhado em execução de políticas públicas.
4. **Realização de estudos** por órgão de pesquisa, garantida anonimização.
5. **Execução de contrato** ou procedimentos preliminares a pedido do titular.
6. **Exercício regular de direitos** em processo judicial, administrativo, arbitral.
7. **Proteção da vida ou incolumidade física** do titular ou de terceiro.
8. **Tutela da saúde** por profissionais da saúde / autoridade sanitária.
9. **Legítimo interesse** do controlador ou de terceiro (exige teste de balanceamento).
10. **Proteção do crédito** (positivo/negativo).

## Bases legais — Art. 11 (dado sensível)

1. **Consentimento específico e destacado** do titular.
2. Sem consentimento, apenas se:
   a. Cumprimento de obrigação legal/regulatória.
   b. Administração pública em políticas públicas previstas em lei.
   c. Estudos por órgão de pesquisa com anonimização.
   d. Exercício regular de direitos.
   e. Proteção da vida ou incolumidade.
   f. Tutela da saúde por profissional/serviço de saúde/autoridade sanitária.
   g. Prevenção à fraude e segurança do titular nos processos de identificação.

## Direitos do titular (Art. 18)

1. **Confirmação** da existência de tratamento.
2. **Acesso** aos dados.
3. **Correção** de dados incompletos/inexatos/desatualizados.
4. **Anonimização, bloqueio ou eliminação** de dados desnecessários/excessivos/tratados em desconformidade.
5. **Portabilidade** dos dados a outro fornecedor.
6. **Eliminação** dos dados tratados com consentimento (salvo hipóteses do Art. 16).
7. **Informação** sobre entidades com quem o controlador compartilhou.
8. **Informação** sobre a possibilidade de não fornecer consentimento e suas consequências.
9. **Revogação** do consentimento.
10. **Revisão** de decisões automatizadas (Art. 20).

**SLA legal**: resposta em até **15 dias** (Art. 19).

## Incidente de segurança (Art. 48)

Quando há **risco ou dano relevante** aos titulares, controlador deve comunicar à ANPD e aos titulares afetados em **prazo razoável** — interpretação consolidada: **até 72 horas** após conhecimento.

Comunicação deve conter:
- Descrição da natureza dos dados afetados.
- Informação sobre os titulares envolvidos.
- Indicação das medidas técnicas e de segurança utilizadas.
- Riscos relacionados ao incidente.
- Motivos da demora, se houver.
- Medidas adotadas para reverter ou mitigar.

## Sanções (Art. 52)

- Advertência.
- Multa simples — **até 2% do faturamento**, limitada a **R$ 50 milhões por infração**.
- Multa diária.
- Publicização da infração.
- Bloqueio ou eliminação dos dados.
- Suspensão parcial do banco de dados (6 meses, prorrogável).
- Suspensão da atividade de tratamento (6 meses, prorrogável).
- Proibição parcial/total da atividade de tratamento.

## RIPD — Relatório de Impacto (Art. 38)

Obrigatório quando há **alto risco**:
- Tratamento em larga escala.
- Dado sensível em larga escala.
- Decisão automatizada com efeito jurídico/significativo.
- Monitoramento sistemático.
- Tratamento de criança/adolescente.
- Combinação de bases de dados com finalidades diferentes.

Conteúdo mínimo:
- Descrição dos tipos de dados.
- Metodologia para coleta e segurança.
- Análise das medidas de mitigação.
- Análise dos riscos e salvaguardas.

## Transferência internacional (Art. 33)

Permitida apenas para:
- Países com nível de proteção adequado (lista ANPD).
- Garantias específicas: cláusulas-padrão da ANPD, BCRs, selos/certificações.
- Cooperação jurídica internacional.
- Proteção da vida.
- Execução de política pública.
- Consentimento específico e destacado.
- Cumprimento de obrigação legal/regulatória.
- Execução de contrato.
- Exercício regular de direitos.

## Anonimização vs Pseudonimização

- **Anonimização** (Art. 12 §1): dado deixa de ser pessoal — irreversível, não há como reconectar.
- **Pseudonimização**: substitui identificador por código — reversível com chave separada. **Ainda é dado pessoal**.

Hash com salt forte aplicado a CPF: pseudonimização (se você guarda o salt) ou anonimização (se você joga o salt fora).

## Princípios de tratamento (Art. 6)

1. **Finalidade**: propósito legítimo, específico, explícito, informado.
2. **Adequação**: compatível com a finalidade informada.
3. **Necessidade**: mínimo necessário pra finalidade.
4. **Livre acesso**: titular consulta integral e gratuita.
5. **Qualidade**: exatidão, clareza, relevância, atualização.
6. **Transparência**: informações claras, precisas e facilmente acessíveis.
7. **Segurança**: medidas técnicas e administrativas pra proteger.
8. **Prevenção**: medidas pra prevenir danos.
9. **Não discriminação**: impossibilidade de tratamento pra fins discriminatórios.
10. **Responsabilização e prestação de contas**: demonstração de medidas eficazes.

## ANPD — Autoridade Nacional

- Site: <https://www.gov.br/anpd>
- Atuação: fiscalização, sanções, orientação, normatização.
- Resolução 2/2022: regula aplicação da LGPD a pequenas empresas/startups (proporcional).
- Resolução 4/2023: dosimetria de sanções.
- Resolução 15/2024: comunicação de incidente.

## Anti-padrões LGPD

❌ Coletar dado "pra caso de precisar" — viola necessidade.
❌ Consentimento genérico ("aceito todos os termos") pra finalidades múltiplas — Art. 8 §4 exige finalidades específicas.
❌ Negar serviço por recusa de consentimento que não é necessário pra execução — abusivo.
❌ Log com CPF/email/telefone em texto puro — viola segurança e dificulta direito ao esquecimento.
❌ Backup eterno sem critério de expurgo — viola necessidade + finalidade.
❌ DPO genérico (`legal@empresa.com.br`) sem caixa monitorada — descumpre Art. 41.
❌ Termo de uso em letras minúsculas / inglês / juridiquês — viola transparência.
❌ Compartilhar com terceiro sem DPA — controlador continua responsável.

## Referências

- LGPD: <http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm>
- ANPD: <https://www.gov.br/anpd>
- Resoluções ANPD: <https://www.gov.br/anpd/pt-br/assuntos/normas>
