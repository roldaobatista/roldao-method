---
owner: <DPO-nome>
ultima-conferencia: 2026-05-27
data-ultima-auditoria-lgpd: 2026-05-15
status: stable
idioma: pt-BR
limite-linhas: 250
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ROPA — Registro de Operacoes de Tratamento de Dados Pessoais

Este documento atende ao **Art. 37 da LGPD** (Lei 13.709/2018), que exige o
registro das operacoes de tratamento de dados pessoais realizadas pelo
controlador.

> Este registro deve estar **sempre atualizado**. O subagente `auditor-lgpd`
> valida a consistencia entre esta tabela, o codigo que toca dados pessoais e
> os contratos de operacao. Qualquer nova operacao que trate dado pessoal so
> entra em producao apos linha correspondente aqui (INV-LGPD-001).

## 1. Controlador (Art. 41 LGPD)

| Campo | Valor |
|---|---|
| Razao social | Conciliab Tecnologia Ltda. |
| CNPJ | 56.789.012/0001-34 |
| Endereco | Av. Paulista, 1842, sala 1201, Bela Vista, Sao Paulo/SP, CEP 01310-200 |
| E-mail de contato | contato@conciliab.com.br |
| Telefone | (11) 4002-8922 |

## 2. Encarregado pelo tratamento — DPO (Art. 41 LGPD)

| Campo | Valor |
|---|---|
| Nome | `<DPO-nome>` (DPO terceirizado, contrato de prestacao de servico em vigor desde 2026-02-15) |
| E-mail | dpo@conciliab.com.br |
| Telefone | (11) 4002-8923 |

## 3. Definicoes rapidas

- **Operacao de tratamento**: qualquer atividade do sistema que processa dado
  pessoal.
- **Categoria de titular**: tipo de pessoa cujos dados sao tratados.
- **Base legal**: a hipotese da LGPD (Art. 7 ou Art. 11) que autoriza tratar
  o dado.
- **Controlador**: nos (Conciliab Tecnologia Ltda.).
- **Operador**: empresa contratada que trata o dado seguindo nossas ordens
  (AWS, Sentry, etc.).
- **Tokenizados**: dado original substituido por codigo sem valor por si so.
- **Transferencia internacional**: enviar dado pessoal para fora do Brasil
  (exige Art. 33).

## 4. Registro de operacoes de tratamento

| Operacao | Dados tratados | Categoria de titular | Base legal | Finalidade | Prazo de retencao | Compartilhamento | Medidas tecnicas | Medidas administrativas | Transf. internacional | Responsavel |
|---|---|---|---|---|---|---|---|---|---|---|
| **Cadastro de tenant + admin** | Nome do socio-administrador, CNPJ da empresa, CPF do responsavel legal, e-mail, telefone | Cliente PJ (contratante) e pessoa fisica do responsavel | Art. 7, V — execucao de contrato | Permitir uso do produto, faturamento, comunicacao operacional | Vigencia do contrato + 5 anos (Lei 8.846/94 — obrigacao fiscal) | AWS Cognito (operador), Stripe (cobranca; tokeniza dados) | TLS 1.3 em transito; RDS storage encryption + KMS em repouso; RLS por tenant; MFA no console admin | Treinamento LGPD anual; contrato de operacao com AWS e Stripe; politica de acesso minimo | Nao (sa-east-1) | <DPO-nome> |
| **Ingestao e processamento de extrato bancario (CSV/OFX)** | Numero da conta bancaria do cliente, agencia, valor de transacoes, historico, descricao da transacao (que as vezes contem nome de contraparte com CPF/CNPJ) | Cliente PJ + pessoas fisicas que aparecem nas transacoes (contrapartes) | Art. 7, V — execucao de contrato (cliente PJ) + Art. 7, IX — legitimo interesse (contrapartes; impossivel obter consentimento de cada um) | Conciliacao bancaria automatica (produto core) | Vigencia do contrato + 5 anos (obrigacao fiscal — Decreto 70.235/72) | AWS S3 (operador; storage do arquivo bruto), AWS RDS (operador; dados parsados) | Upload via HTTPS; S3 com SSE-KMS; RLS no PG; logs sem PII (INV-AGENT-008) | Adesao do cliente ao contrato cobre tratamento de contrapartes; ROPA revisado a cada nova operacao | Nao (sa-east-1) | <DPO-nome> |
| **Autenticacao e gestao de sessao** | E-mail, senha hash, IP de acesso, user-agent, timestamp de login | Usuario do sistema (pessoa fisica vinculada ao tenant) | Art. 7, V — execucao de contrato | Autenticar o usuario, prevenir fraude, atender Marco Civil (registro de acesso) | Conta ativa + 12 meses apos cancelamento (Marco Civil Art. 15) | AWS Cognito (operador) | Senha hashed (Cognito gerencia); MFA disponivel; rate-limit em `/v1/auth/*` | Politica de senha forte; rotacao de tokens 90d | Nao (Cognito sa-east-1) | <DPO-nome> |
| **Cobranca recorrente** | Nome, CNPJ, e-mail; 4 ultimos digitos do cartao (tokenizados via Stripe) | Cliente PJ | Art. 7, V — execucao de contrato | Cobrar mensalidade do plano contratado | Vigencia do contrato + 5 anos | Stripe (operador; storage de cartao e PCI-DSS-compliant) | Nunca armazenamos PAN; so token Stripe; webhook Stripe assinado | Contrato de operacao com Stripe; auditoria de webhook | Sim — Stripe processa em US (Art. 33, II LGPD — clausulas-padrao contratuais assinadas com Stripe). Nota: Privacy Shield foi invalidado em Schrems II (2020); seu substituto Data Privacy Framework (DPF) cobre apenas transferencias EU-US e NAO se aplica a Brasil-US. A unica base estavel para Brasil-US continua sendo clausulas-padrao contratuais ou consentimento especifico (Art. 33 V). | <DPO-nome> |
| **Suporte ao cliente** | Nome, e-mail, conteudo da conversa (que pode conter PII) | Usuario do sistema | Art. 7, V — execucao de contrato + Art. 7, IX — legitimo interesse (melhorar produto) | Atender duvidas, resolver incidente | 24 meses apos encerramento do ticket | Front (operador; sistema de tickets) | Front com SSO; logs internos sem PII bruta | Treinamento da equipe de suporte; politica de mascaramento de PII em ticket interno | Sim — Front processa em US (Art. 33, II LGPD — clausulas-padrao contratuais assinadas com Front Inc.). Mesma observacao da operacao "Cobranca recorrente": DPF nao cobre Brasil-US. | <DPO-nome> |
| **Atendimento a pedido do titular (LGPD)** | E-mail do titular, descricao do pedido, documentos comprobatorios de identidade | Titular que exerce direito (Art. 18) | Art. 7, II — cumprimento de obrigacao legal | Atender direitos do Art. 18 (acesso, correcao, eliminacao, portabilidade) | 5 anos apos atendimento (prova de cumprimento da obrigacao legal) | nenhum (interno) | Canal dedicado `lgpd@conciliab.com.br`; acesso restrito ao DPO + 1 dev | Procedimento documentado em `docs/operacao/runbooks/atender-pedido-eliminacao.md` | Nao | <DPO-nome> |

> Notas de leitura:
> - **"Tokenizados"**: nao guardamos numero de cartao do cliente. Stripe nos
>   da um token sem valor para repetir cobrancas.
> - **"Contraparte" na ingestao bancaria**: pessoa que aparece como
>   pagador/recebedor numa transacao. A base legal e legitimo interesse porque
>   e impossivel obter consentimento de cada contraparte — o cliente PJ trata
>   esse dado para conciliar, nao para enriquecer perfil.
> - **"Art. 7, V — execucao de contrato"**: a LGPD permite tratar o dado
>   porque sem ele e impossivel cumprir o contrato com o cliente.

## 5. Plano de resposta a incidente de vazamento (Art. 48 LGPD)

Procedimento obrigatorio quando ha **incidente de seguranca que possa
acarretar risco ou dano relevante** aos titulares.

### 5.1 Criterio para notificar a ANPD

Notificar a ANPD quando o incidente envolver pelo menos um destes:
- Vazamento de dado bancario (numero de conta, agencia, transacao).
- Vazamento de CPF de pessoa fisica em volume (≥ 100 titulares).
- Vazamento que permita fraude financeira.
- Em duvida: notificar. Omissao e punida; notificacao preventiva nao.

### 5.2 Prazo

- **Notificacao a ANPD: ate 72 horas** apos ciencia do incidente
  (INV-LGPD-003).
- **Comunicacao aos titulares afetados: tao logo a investigacao confirme o
  risco**, sem prejuizo do prazo da ANPD.

### 5.3 Modelo de comunicacao ao titular

```
Assunto: Comunicado importante sobre seus dados — Conciliab

Prezado(a) <nome>,

Em <data>, identificamos um incidente de seguranca envolvendo dados pessoais
sob nossa responsabilidade. Esta comunicacao cumpre o Art. 48 da LGPD.

O que aconteceu: <descricao em linguagem simples>.
Dados envolvidos: <lista — ex: e-mail, nome da empresa; NAO foram afetados
                   senha, dados bancarios, cartao>.
Quando aconteceu: <data de inicio e deteccao>.
O que ja fizemos: <medidas tomadas — bloqueio, rotacao, etc>.
O que recomendamos a voce: <ex: revisar extrato, trocar senha>.

Encarregado (DPO): <DPO-nome>, dpo@conciliab.com.br, (11) 4002-8923.
Voce pode procurar a ANPD: https://www.gov.br/anpd

Atenciosamente,
Conciliab Tecnologia Ltda.
```

### 5.4 Quem aciona

| Papel | Responsabilidade |
|---|---|
| Detector do incidente | comunica imediatamente o DPO e o owner tecnico (`#war-room`) |
| DPO (`<DPO-nome>`) | conduz comunicacao a ANPD e aos titulares |
| Owner tecnico (`<DEV-1>`) | conduz contencao, investigacao e relatorio de causa raiz |
| Juridico (escritorio externo) | revisa textos antes do envio a ANPD |

## 6. Regras de manutencao do registro

- Toda nova operacao que trate dado pessoal entra como linha nova **antes**
  do primeiro deploy que a executa (INV-LGPD-001 — `ropa-consistency.sh`
  falha CI).
- Mudanca de base legal exige aprovacao do DPO.
- Remocao de operacao exige registro do motivo e do procedimento de descarte.
- Compartilhamentos novos exigem contrato de operacao assinado **antes** do
  registro aqui.
- Auditoria completa do ROPA e anual; data registrada em
  `data-ultima-auditoria-lgpd`.

## 7. Direitos dos titulares

Procedimentos para atender pedidos do titular (acesso, correcao, anonimizacao,
portabilidade, eliminacao) estao em
`docs/operacao/runbooks/atender-pedido-eliminacao.md` (fora deste exemplo).

Canal: `lgpd@conciliab.com.br` + endpoint `POST /v1/lgpd/pedidos`.
SLA: 15 dias corridos (INV-LGPD-002).
