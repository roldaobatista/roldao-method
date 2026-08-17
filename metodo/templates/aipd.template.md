---
owner: <DPO-ou-Encarregado>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 280
proposito: Avaliação de Impacto à Proteção de Dados Pessoais (AIPD/DPIA) — análise de risco aos titulares antes de iniciar tratamento de alto risco (LGPD Art. 38; GDPR Art. 35; EU AI Act Art. 13-14 quando há IA)
---

<!--
template: aipd.template.md
destino: docs/conformidade/lgpd/aipd-<nome-do-tratamento>.md
uso: uma AIPD por tratamento de alto risco. Não fazer uma só para o sistema todo.
quando obrigatório:
  - tratamento sistemático e em larga escala de dado pessoal
  - dado sensível (LGPD Art. 5 II) em qualquer escala
  - decisão automatizada que afeta o titular (LGPD Art. 20 / EU AI Act)
  - monitoramento de comportamento em espaço público
  - tratamento de dado de criança / adolescente
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C6
-->

# AIPD — Avaliação de Impacto à Proteção de Dados

> **AIPD** (também chamada **DPIA** no GDPR europeu) = relatório obrigatório que mostra **o que pode dar errado para a pessoa** cujo dado vamos tratar, e o que faremos para reduzir esse risco. Sem AIPD, a ANPD pode multar e o tratamento pode ser proibido. Quando há decisão por máquina sobre a pessoa (escore, recomendação, recusa automática), o **EU AI Act Art. 13-14** também exige supervisão humana descrita aqui.

## 1. Identificação do tratamento

| Campo | Valor |
|---|---|
| Nome do tratamento | <ex: scoring automatizado de crédito para abertura de conta> |
| Sistema/módulo responsável | <ex: módulo `credit-scoring` v2.3> |
| Data desta avaliação | <YYYY-MM-DD> |
| Próxima revisão obrigatória | <YYYY-MM-DD — máximo 12 meses ou ao mudar finalidade> |
| Responsável técnico | <nome + papel> |
| Encarregado (DPO) que aprovou | <nome> |

## 2. Contexto e necessidade

Resumir em **uma única página** (alguém não-técnico precisa entender):

- **Por que** este tratamento existe? Que problema de negócio resolve?
- **O que muda** para a pessoa cujo dado é tratado, comparado à situação atual?
- **Há alternativa menos invasiva** (não coletar; coletar menos; usar dado anonimizado)? Por que foi descartada?

> **Exemplo preenchido:**
> Vamos calcular um escore de probabilidade de inadimplência usando histórico de pagamento + dados de bureau (Serasa) para aprovar/recusar abertura de conta digital sem intervenção humana imediata. Alternativa "avaliação humana sempre" foi descartada porque inviabiliza a operação (>10mil pedidos/dia). Cliente pode pedir revisão humana (Art. 20 LGPD) e tem o caminho descrito na seção 8 desta AIPD.

## 3. Dados tratados

| Categoria do dado | Item específico | É sensível? (Art. 5 II LGPD) | De onde vem | Quanto tempo guarda |
|---|---|---|---|---|
| <identificação> | <CPF, nome, data nascimento> | não | <formulário de cadastro> | <prazo + base do prazo> |
| <financeiro> | <renda declarada, histórico bureau> | não | <Serasa via API> | <prazo + base do prazo> |
| <sensível> | <se algum, marcar AQUI e justificar separadamente> | sim — exige cuidado redobrado | <origem> | <prazo + base do prazo> |

> **Atenção dado sensível:** se houver QUALQUER dado de saúde, biometria, origem racial/étnica, convicção religiosa, opinião política, filiação sindical, dado genético, vida sexual ou orientação sexual — esta AIPD vira **obrigatória e crítica**, e o DPO precisa aprovar explicitamente. Não tratar como rotina.

## 4. Base legal (LGPD Art. 7 ou Art. 11)

Qual hipótese da LGPD autoriza este tratamento? **Sem base legal, o tratamento é ilegal.**

| Inciso | Quando aplica | Aplica aqui? |
|---|---|---|
| Art. 7 I — consentimento | titular disse "sim" de forma livre, informada, inequívoca | <sim/não — se sim, como coleta o consentimento> |
| Art. 7 V — execução de contrato | sem o dado o contrato não é cumprido | <sim/não> |
| Art. 7 VI — exercício regular de direito em processo | litígio | <sim/não> |
| Art. 7 IX — interesse legítimo (Art. 10) | atende interesse do controlador SEM ferir direito do titular — exige teste de balanceamento | <sim/não — se sim, anexar teste de balanceamento> |
| Art. 11 (sensível) | bases mais restritas — consentimento específico, obrigação legal, proteção da vida, tutela da saúde, etc. | <sim/não> |

## 5. Grupos vulneráveis afetados

| Grupo | Tratamos dado dele? | Cuidado adicional aplicado |
|---|---|---|
| Crianças e adolescentes (até 18) | <sim/não> | <consentimento dos pais; dados mínimos; sem perfilamento publicitário> |
| Idosos (60+) | <sim/não> | <linguagem simples nas comunicações; canal não-digital alternativo> |
| Pessoas em vulnerabilidade econômica/social | <sim/não> | <evitar perfilamento que reforce exclusão> |
| Pacientes / titulares de dado de saúde | <sim/não> | <sigilo médico; acesso restrito por papel> |
| Usuários com deficiência | <sim/não> | <acessibilidade WCAG nos canais de exercício de direito> |

## 6. Análise de risco (probabilidade × impacto)

Cada cenário ruim recebe nota de 1 (baixo) a 5 (crítico) em probabilidade e impacto. Risco = prob × impacto. Acima de 12 exige mitigação obrigatória antes de operar.

| Cenário ruim para o titular | Prob (1-5) | Impacto (1-5) | Risco (P×I) | Mitigação aplicada | Risco residual |
|---|---|---|---|---|---|
| <ex: escore errado nega crédito sem motivo real> | 3 | 4 | 12 | <revisão humana obrigatória nos casos limítrofes; auditoria mensal de viés> | 6 |
| <ex: vazamento do banco expõe CPF + renda> | 2 | 5 | 10 | <criptografia AES-256 em repouso; acesso por IAM; backup criptografado> | 4 |
| <ex: discriminação algorítmica contra grupo protegido> | 3 | 5 | 15 | <teste de viés trimestral; métrica de paridade demográfica; canal de contestação> | 6 |
| <ex: dado usado para finalidade diferente do declarado> | 2 | 4 | 8 | <controle de acesso por finalidade; log de uso auditado> | 4 |

**Tabela de leitura do risco:**

| Faixa | Significado | Ação |
|---|---|---|
| 1-4 | risco baixo | aceitar e monitorar |
| 5-9 | risco médio | mitigar antes de operar |
| 10-14 | risco alto | mitigar obrigatoriamente + reaprovação do DPO |
| 15-25 | risco crítico | NÃO operar até reduzir; consultar ANPD se mitigação inviável (LGPD Art. 38 § único) |

## 7. Medidas mitigatórias técnicas e administrativas

| Medida | Tipo | Responsável | Status (implementada / planejada) | Teste que comprova |
|---|---|---|---|---|
| <criptografia AES-256-GCM em repouso> | técnica | <segurança> | implementada | <INV-SEC-CRYPTO-01> |
| <controle de acesso por papel — RBAC> | técnica | <segurança> | implementada | <INV-SEC-AUTHZ-01> |
| <treinamento anual da equipe em LGPD> | administrativa | <DPO> | planejada — próxima turma <data> | <registro de presença> |
| <contrato de operação com bureau Serasa> | administrativa | <jurídico> | implementada | <cópia em pasta de contratos> |
| <auditoria automatizada de viés a cada release> | técnica | <ML-owner> | planejada | <pipeline `audit-bias.yml`> |

## 8. Supervisão humana (LGPD Art. 20 + EU AI Act Art. 13-14)

**Obrigatório quando há decisão automatizada que afeta a pessoa.** Se este tratamento não envolve decisão por máquina, marcar **N/A** e justificar.

### 8.1 Direito de revisão humana
- **Como o titular pede revisão:** <descrever canal — link, e-mail, prazo>.
- **Quem revisa:** <papel + qualificação — não pode ser a mesma pessoa que opera o sistema diariamente>.
- **SLA da revisão:** <prazo — recomendado ≤15 dias úteis>.
- **O que o revisor humano pode fazer:** confirmar, reverter, ajustar manualmente, escalar para comitê.

### 8.2 Transparência (Art. 20 §1 LGPD)
- **Informação ao titular sobre os critérios usados:** <link público + linguagem simples>.
- **O que NÃO revelamos:** <pesos exatos do modelo — segredo comercial — mas revelamos a lógica geral>.

### 8.3 Monitoramento contínuo do modelo (se há ML)
- Indicadores de drift, viés, qualidade preditiva — onde vivem: <link dashboard>.
- Frequência de reavaliação: <ex: mensal>.
- Critério para retreinar / desligar: <ex: paridade demográfica >0,8 entre grupos protegidos; AUC > 0,75>.

## 9. Consulta a partes interessadas

| Parte | Foi consultada? | Quando | Posição registrada |
|---|---|---|---|
| Encarregado (DPO) | <sim/não> | <data> | <aprovou / pediu ajuste — link da ata> |
| Equipe de segurança | <sim/não> | <data> | <link> |
| Equipe jurídica | <sim/não> | <data> | <link> |
| Representante de titulares (quando aplica — ex: associação de consumidores) | <sim/não> | <data> | <link> |
| ANPD (quando risco residual permanecer ALTO) | <sim/não> | <data> | <protocolo da consulta> |

## 10. Decisão final

Marcar uma e justificar:

- [ ] **PROSSEGUIR** — risco residual aceito pelo DPO. Operação pode iniciar.
- [ ] **PROSSEGUIR COM AJUSTES** — implementar mitigação X, Y, Z antes de iniciar. Nova revisão em <data>.
- [ ] **PARAR** — risco residual incompatível com LGPD/AI Act. Repensar arquitetura ou desistir do tratamento.

**Assinatura do DPO:** <nome, data>
**Assinatura do responsável técnico:** <nome, data>

## 11. Vinculação

- ROPA: `docs/conformidade/lgpd/ropa.md` (linha do tratamento avaliado aqui).
- Threat model: `docs/seguranca/threat-model.md` (ameaças técnicas vinculadas).
- Direitos do titular: `docs/conformidade/lgpd/direitos-do-titular.md` (canal de revisão).
- Política de retenção: `docs/conformidade/lgpd/retencao-dados.md`.
- Runbook de incidente: `docs/operacao/runbooks/incidente-seguranca.md`.

## 12. Checklist de promoção draft → stable

- [ ] Todos os placeholders `<...>` substituídos por dados reais.
- [ ] Tabela de risco preenchida com mitigação para todo risco ≥10.
- [ ] Decisão final marcada e assinada pelo DPO.
- [ ] Linha correspondente existe e está atualizada no ROPA.
- [ ] Se há decisão automatizada, seção 8 está completa (canal de revisão funciona ponta-a-ponta).
- [ ] Frontmatter `revisado-em` atualizado; `status: stable`.
- [ ] Próxima revisão agendada (máximo 12 meses ou ao mudar finalidade).
