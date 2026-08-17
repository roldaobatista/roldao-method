---
owner: <Responsavel>
revisado-em: <YYYY-MM-DD>
data-ultima-auditoria-lgpd: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 280
proposito: Registro das Operações de Tratamento de Dados Pessoais (LGPD Art. 37) — finalidade, base legal, retenção, compartilhamento, transferência internacional
---

<!--
template: ropa.md
destino: docs/conformidade/lgpd/ropa.md
uso: Registro de Operações de Tratamento de Dados Pessoais (LGPD Art. 37).
Se passar do limite, fatie por área de tratamento.
-->

# ROPA — Registro de Operações de Tratamento de Dados Pessoais

> **Documento CONDICIONAL.** Só se aplica a projeto regulado ou que trate dado pessoal. Se o seu produto não trata nenhum dado pessoal (ex: ferramenta local sem cadastro de gente), **não preencha este registro** — apenas anote o motivo em `docs/nao-aplica.md`.

Este documento atende ao **Art. 37 da LGPD**, que exige o registro das operações de tratamento de dados pessoais realizadas pelo controlador.

> Este registro deve estar **sempre atualizado**. O subagente `auditor-lgpd` valida a consistência entre esta tabela, o código que toca dados pessoais e os contratos de operação. Qualquer nova operação que trate dado pessoal só entra em produção após linha correspondente aqui.

## 1. Controlador (Art. 41 LGPD)

Identificação da empresa responsável pelas decisões sobre o tratamento dos dados pessoais.

| Campo | Valor |
|---|---|
| Razão social | <razao-social-completa> |
| CNPJ | <00.000.000/0000-00> |
| Endereço | <logradouro, número, complemento, bairro, cidade/UF, CEP> |
| E-mail de contato | <contato@exemplo.com> |
| Telefone | <(00) 0000-0000> |

## 2. Encarregado pelo tratamento — DPO (Art. 41 LGPD)

Pessoa responsável por receber comunicações de titulares e da ANPD (Autoridade Nacional de Proteção de Dados).

| Campo | Valor |
|---|---|
| Nome | <nome-completo-do-encarregado> |
| E-mail | <dpo@exemplo.com> |
| Telefone | <(00) 0000-0000> |

## 3. Definições rápidas (para quem não é da área jurídica)

- **Operação de tratamento**: qualquer atividade do sistema que processa dado pessoal (cadastro, cobrança, envio de e-mail, exportação para parceiro, etc.).
- **Categoria de titular**: tipo de pessoa cujos dados são tratados (cliente final, colaborador, fornecedor, candidato).
- **Base legal**: a hipótese da LGPD (Art. 7 para dados comuns ou Art. 11 para dados sensíveis) que autoriza tratar o dado. Sem base legal, o tratamento é ilegal.
- **Compartilhamento**: terceiros que recebem o dado (operadores, suboperadores ou outros controladores).
- **Controlador**: a empresa que decide POR QUE e COMO tratar o dado (nós, neste documento).
- **Operador**: a empresa contratada que trata o dado SEGUINDO ORDENS do controlador (ex: provedor de e-mail, processador de pagamento).
- **Transferência internacional**: enviar dado pessoal para fora do Brasil. Exige base legal específica (Art. 33).

## 4. Registro de operações de tratamento

<!-- exemplo ilustrativo abaixo — substituir TODOS os campos antes de usar em produção.
     Linhas preenchidas com `<...>` indicam onde colocar dados reais do controlador.
     A linha "Cadastro de cliente" e "Cobrança recorrente" são modelos de preenchimento;
     remova-as ou ajuste integralmente para a realidade do seu projeto. -->

| Operação | Dados tratados | Categoria de titular | Base legal | Finalidade | Prazo de retenção | Compartilhamento | Medidas de segurança técnicas | Medidas administrativas | Transferência internacional | Responsável |
|---|---|---|---|---|---|---|---|---|---|---|
| <operação-1, ex: Cadastro de cliente> | <dados, ex: nome, e-mail> | <categoria, ex: cliente final> | <base legal, ex: execução de contrato — Art. 7, V> | <finalidade> | <prazo> | <terceiros — operadores e suboperadores> | <criptografia em trânsito/repouso; controle de acesso; pseudonimização> | <treinamento; política; contrato de operação> | <sim/não — se sim, país e base legal Art. 33> | <responsável> |
| <operação-2> | <dados> | <categoria> | <base-legal> | <finalidade> | <prazo> | <terceiros> | <medidas técnicas> | <medidas administrativas> | <sim/não, país, base legal> | <responsável> |
| <operação-3> | <dados> | <categoria> | <base-legal> | <finalidade> | <prazo> | <terceiros> | <medidas técnicas> | <medidas administrativas> | <sim/não, país, base legal> | <responsável> |

> **Prazos de retenção setoriais.** A coluna "Prazo de retenção" acima deve refletir os prazos legais do seu setor, levantados na descoberta de mercado. Conferir antes de preencher: `docs/descoberta/mercado-regulatorio.md` (exigências do setor) e a política detalhada em `docs/conformidade/lgpd/retencao-dados.md` (prazo, base legal e processo de descarte de cada categoria de dado).

> Notas de leitura (vocabulário comum em ROPA, mantidas para referência mesmo após substituir os exemplos da tabela):
> - **"tokenizados"**: dado original substituído por um código sem valor por si só. Vazar o código não vaza o número do cartão.
> - **"intermediador de pagamento"** (antes "gateway"): empresa que conecta o sistema às bandeiras de cartão (ex: Stone, Cielo).
> - **"antifraude"**: serviço que avalia se uma compra parece legítima antes de aprovar.
> - **"Art. 7, V — execução de contrato"**: a LGPD permite tratar o dado porque sem ele não é possível cumprir o contrato com o cliente.

### 4.1 Transferência internacional — Art. 33 LGPD (preencher com precisão)

Se a coluna "Transferência internacional" do registro acima for **sim**, preencher base legal Art. 33 LGPD especificando QUAL inciso aplica. Não escrever apenas "sim — EUA". A ANPD exige fundamentação:

| Inciso Art. 33 | Quando aplica | Exemplo típico |
|---|---|---|
| I — país com nível adequado | Destino reconhecido pela ANPD como adequado | UE pós-decisão de adequação (ainda não emitida pela ANPD; lista oficial em construção) |
| II — garantias específicas (cláusulas contratuais padrão, normas corporativas, selos, códigos) | Contrato com operador estrangeiro com SCC/BCR | AWS, Google Cloud, MongoDB Atlas sob DPA + SCC |
| III — cooperação jurídica internacional | Ordem judicial estrangeira via cooperação Brasil-país | Raro; investigação penal transnacional |
| IV — proteção da vida do titular ou terceiro | Emergência médica internacional | Raro |
| V — exercício regular de direitos em processo judicial | Litígio internacional | Empresa com processo em corte estrangeira |
| VI — consentimento específico do titular | Titular consentiu **especificamente** com a transferência (não vale consentimento genérico) | Plataforma onde usuário escolhe armazenar dado em servidor estrangeiro |
| VII — execução de contrato com o titular | Sem a transferência, contrato não pode ser cumprido | SaaS hospedado em país estrangeiro escolhido pelo cliente |
| VIII — execução de política pública | Tratamento pelo poder público sob lei específica | Governo |
| IX — cumprimento de obrigação legal | Lei brasileira obriga a transferir | RFB compartilhando dado com fisco estrangeiro |

**Distinção crítica Brasil↔EUA vs Brasil↔UE:**
- **Brasil↔EUA**: nenhum dos dois é "adequado" pelo outro automaticamente. Operadores AWS/Google/Microsoft em região US exigem DPA + Standard Contractual Clauses (Art. 33-II).
- **Brasil↔UE**: GDPR (UE) já reconheceu Brasil como destino seguro em alguns contextos via SCC; ANPD ainda não emitiu lista de países adequados. **Sempre** preferir hospedar em região sa-east-1 (São Paulo) ou similar quando o dado é de pessoa física brasileira, evitando o problema.

## 5. Plano de resposta a incidente de vazamento (Art. 48 LGPD)

Procedimento obrigatório quando há **incidente de segurança que possa acarretar risco ou dano relevante** aos titulares.

### 5.1 Critério para notificar a ANPD

Notificar a ANPD quando o incidente envolver pelo menos um destes:
- Vazamento de dado sensível (saúde, biometria, origem racial, religião, etc. — Art. 5, II).
- Vazamento de dado de criança ou adolescente.
- Volume relevante de titulares afetados (≥ 100 titulares como referência conservadora).
- Possibilidade de fraude financeira (CPF + dados bancários, cartão exposto, etc.).
- Em dúvida: notificar. A omissão é punida; a notificação preventiva, não.

### 5.2 Prazo

- **Notificação à ANPD: até 72 horas** após ciência do incidente (referência da prática internacional adotada como padrão interno).
- **Comunicação aos titulares afetados: tão logo a investigação confirme o risco**, sem prejuízo do prazo da ANPD.

### 5.3 Modelo de comunicação ao titular

```
Assunto: Comunicado importante sobre seus dados pessoais

Prezado(a) <nome>,

Em <data>, identificamos um incidente de segurança envolvendo dados pessoais
sob nossa responsabilidade. Esta comunicação cumpre o Art. 48 da LGPD.

O que aconteceu: <descrição em linguagem simples>.
Dados envolvidos: <lista — ex: nome, e-mail; NÃO foram afetados senha, cartão, CPF>.
Quando aconteceu: <data de início e detecção>.
O que já fizemos: <medidas técnicas tomadas — bloqueio, rotação de credenciais, etc.>.
O que recomendamos a você: <ex: trocar senha, monitorar extrato>.

Encarregado (DPO): <nome>, <e-mail>, <telefone>.
Você pode procurar a ANPD: https://www.gov.br/anpd

Atenciosamente,
<Razão social>
```

### 5.4 Quem aciona

| Papel | Responsabilidade |
|---|---|
| Detector do incidente | comunica imediatamente o DPO e o owner técnico |
| DPO | conduz comunicação à ANPD e aos titulares |
| Owner técnico | conduz contenção, investigação e relatório de causa raiz |
| Jurídico | revisa textos antes do envio à ANPD |

## 6. Regras de manutenção do registro

- Toda nova operação que trate dado pessoal entra como linha nova **antes** do primeiro deploy que a executa.
- Mudança de base legal exige aprovação do DPO.
- Remoção de operação exige registro do motivo e do procedimento de descarte do dado.
- Compartilhamentos novos exigem contrato de operação assinado **antes** do registro aqui.
- Auditoria completa do ROPA é anual; data registrada em `data-ultima-auditoria-lgpd`.

## 7. Direitos dos titulares

Procedimentos para atender pedidos do titular (acesso, correção, anonimização, portabilidade, eliminação) estão em `docs/conformidade/lgpd/direitos-do-titular.md`.

## 8. Checklist de promoção draft → stable

- [ ] Confirmado que o projeto **trata dado pessoal** (senão, não usar este documento — registrar em `docs/nao-aplica.md`).
- [ ] **Toda operação de tratamento ativo** está registrada na tabela da seção 4 (nenhuma operação roda em produção sem linha correspondente).
- [ ] Controlador (seção 1) e Encarregado/DPO (seção 2) preenchidos com dados reais.
- [ ] Toda linha tem base legal explícita (Art. 7 ou Art. 11) e finalidade clara.
- [ ] Prazos de retenção conferidos contra `mercado-regulatorio.md` e `retencao-dados.md`.
- [ ] Transferências internacionais (seção 4.1) com inciso do Art. 33 especificado, não apenas "sim".
- [ ] Compartilhamentos com terceiros têm contrato de operação assinado.
- [ ] Plano de resposta a incidente (seção 5) com DPO e canais definidos.
- [ ] Frontmatter `revisado-em` e `data-ultima-auditoria-lgpd` atualizados; `status: stable`.
