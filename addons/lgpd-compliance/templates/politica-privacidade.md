---
tipo: politica-privacidade
versao: 1.0
data: AAAA-MM-DD
status: rascunho
controlador: _(razão social + CNPJ)_
encarregado-dpo: _(nome + email funcional)_
---

# Política de Privacidade — _(nome do produto)_

> **Modelo base.** Adaptar pra realidade do seu produto e validar com advogado antes de publicar. Esta política não substitui assessoria jurídica — é ponto de partida estruturado por LGPD.

**Última atualização:** _(data)_

## 1. Quem somos

_(Razão social, CNPJ, endereço da matriz, canal DPO/encarregado, email funcional monitorado.)_

## 2. Que dados coletamos

| Categoria | Dados | Quando coletamos | Por quê |
|---|---|---|---|
| Identificação | Nome, CPF, email | Cadastro | Vincular conta |
| Contato | Telefone, endereço | Compra | Entrega e contato |
| Pagamento | Cartão (tokenizado) | Compra | Processar transação |
| Navegação | IP, cookies, device | Uso do site | Segurança + analytics |
| _(adicione conforme seu produto)_ | | | |

**Não coletamos dado sensível** _(saúde, biometria, religião, opinião política, origem racial, vida sexual, dado genético, sindical)_ — _(se coletar, listar aqui com base legal específica do Art. 11)_.

## 3. Por que tratamos (base legal — Art. 7 e 11 LGPD)

| Finalidade | Dados usados | Base legal | Retenção |
|---|---|---|---|
| Cadastro e autenticação | Identificação | Execução de contrato | Enquanto conta ativa + 5 anos (CDC) |
| Processar pagamento | Cartão tokenizado | Execução de contrato | 5 anos (obrigação fiscal) |
| Atendimento ao cliente | Identificação + contato | Execução de contrato | 2 anos pós-último contato |
| Marketing | Email | Consentimento (opt-in revogável) | Até revogação |
| Segurança | IP, logs | Interesse legítimo | 6 meses |
| Obrigações fiscais | Pagamento, identificação | Obrigação legal | 5 anos |

## 4. Com quem compartilhamos

| Operador | Finalidade | País | Garantias |
|---|---|---|---|
| AWS / GCP / Azure | Hospedagem | _(BR ou país com adequação)_ | DPA assinado, criptografia |
| Stripe / Pagar.me / Asaas | Pagamento | _(adequação)_ | Compliance PCI-DSS |
| Sentry / Datadog | Observabilidade | EUA | Cláusulas padrão + SCC |
| Mixpanel / Amplitude | Analytics | EUA | Cláusulas padrão + IDs pseudonimizados |
| _(adicione)_ | | | |

**Não vendemos dados.** Compartilhamento é estritamente operacional.

## 5. Quanto tempo guardamos

- Dados de conta: enquanto conta ativa + 5 anos após encerramento (CDC Art. 27).
- Dados fiscais: 5 anos (Receita Federal).
- Logs de segurança: 6 meses.
- Marketing: até revogação do consentimento.
- Solicitação de exclusão (Art. 18, VI): atendida em 15 dias, exceto dados que devemos manter por obrigação legal.

## 6. Seus direitos (Art. 18 LGPD)

Você pode exercer a qualquer momento:

1. **Confirmação** de que tratamos seus dados.
2. **Acesso** aos seus dados.
3. **Correção** de dados incompletos, inexatos ou desatualizados.
4. **Anonimização, bloqueio ou eliminação** de dados desnecessários, excessivos ou tratados em desconformidade.
5. **Portabilidade** dos seus dados (formato JSON/CSV).
6. **Eliminação** dos dados tratados com consentimento.
7. **Informação sobre compartilhamento** com terceiros.
8. **Informação sobre possibilidade de não consentir** e consequências.
9. **Revogação do consentimento.**
10. **Revisão de decisão automatizada** que afete seus interesses (Art. 20).

**Como exercer:** envie email para _(dpo@empresa.com.br)_. Resposta em até **15 dias corridos** (Art. 19 II da LGPD).

## 7. Decisão automatizada

_(Se aplicável.)_ Usamos sistema automatizado para _(score de crédito / detecção de fraude / preço dinâmico / etc)_. Você tem direito a revisão humana — peça pelo canal do DPO.

## 8. Cookies e tecnologias similares

| Tipo | Finalidade | Pode desativar? |
|---|---|---|
| Essenciais | Login, carrinho, segurança | Não (quebra o serviço) |
| Funcionais | Preferências, idioma | Sim |
| Analíticos | Métricas agregadas | Sim |
| Marketing | Anúncios | Sim |

Controle pelo banner ao entrar ou nas configurações da conta.

## 9. Segurança

- Criptografia em repouso e em trânsito (TLS 1.3).
- Acesso interno por menor privilégio + trilha de acesso.
- Backup criptografado.
- Testes de penetração periódicos.
- Plano de resposta a incidente com comunicação à ANPD em 72h.

## 10. Crianças e adolescentes

_(Se aplicável — produto pra menor de 18 ou pode ser usado por eles.)_ Coletamos dados de crianças apenas com consentimento específico de um dos pais ou responsável (Art. 14 LGPD). Para excluir, contate o DPO.

## 11. Transferência internacional

Quando enviamos seus dados para fora do Brasil (operadores como AWS, Sentry, Stripe), usamos:
- Países com adequação reconhecida pela ANPD, OU
- Cláusulas Padrão Contratuais (SCC), OU
- Garantias específicas (binding corporate rules).

## 12. Encarregado pela Proteção de Dados (DPO)

- **Nome:** _(nome do DPO)_
- **Email:** _(dpo@empresa.com.br — monitorado, SLA 15 dias)_
- **Endereço:** _(opcional)_

## 13. Como reclamar

1. Tente primeiro com nosso DPO.
2. Se não satisfeito, **ANPD** — <https://www.gov.br/anpd>.

## 14. Mudanças nesta política

Vamos avisar com 30 dias de antecedência mudanças materiais. Histórico de versões disponível em _(URL ou rodapé)_.

---

**Versão:** 1.0 · **Vigência desde:** _(data)_
