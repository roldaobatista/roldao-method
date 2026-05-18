---
tipo: resposta-titular-portabilidade
data: AAAA-MM-DD
protocolo: _(ID interno)_
titular: _(nome / email — não publicar)_
status: respondido
formato-entregue: json
---

# Resposta a Pedido de Portabilidade (Art. 18, V LGPD)

> **Modelo padronizado.** SLA: **15 dias** corridos. Formato preferencial: estruturado (JSON, CSV), interoperável.

---

**Para:** _(nome do titular)_
**Assunto:** Portabilidade dos seus dados — protocolo _(ID)_
**De:** _(DPO — dpo@empresa.com.br)_

Olá _(nome)_,

Recebemos em _(data do pedido)_ seu pedido de portabilidade dos dados pessoais que tratamos sobre você. Em cumprimento ao Art. 18, V da LGPD (Lei 13.709/2018):

## 1. Arquivo entregue

| Campo | Valor |
|---|---|
| Formato | JSON (UTF-8, indentação 2 espaços) |
| Tamanho | _(ex: 142 KB)_ |
| Hash SHA-256 | _(integridade do arquivo)_ |
| Forma de entrega | _(anexo / link com expiração 7 dias / SFTP)_ |
| Senha de descompactação | _(enviada por canal separado — SMS/Signal)_ |

## 2. O que está no arquivo

| Bloco JSON | Conteúdo |
|---|---|
| `perfil` | nome, CPF, email, telefone, endereço(s), data de cadastro |
| `pedidos` | histórico completo de compras (data, produtos, valor, status) |
| `pagamento` | cartões cadastrados (apenas terminação, bandeira, validade — sem PAN completo) |
| `preferencias` | idioma, fuso, opt-in de marketing, configurações de privacidade |
| `enderecos_entrega` | endereços usados em entregas |
| `comunicacao` | últimos 50 emails transacionais enviados a você (assunto + data) |
| `consentimentos` | histórico de aceite/revogação de consentimentos |
| `interacoes` | últimos 30 acessos (data, IP truncado, device tipo) |
| `metadados` | versão do schema, data de geração, escopo |

## 3. O que NÃO está incluído

Conforme **Art. 18 §4** (portabilidade exclui segredo comercial e industrial):

- Score interno de risco / antifraude (algoritmo proprietário).
- Rankings de recomendação personalizada (modelo interno).
- Logs técnicos de servidor.
- Dados de terceiros relacionados a você (ex: nome do entregador, vendedor parceiro).

Caso queira **acesso** (não portabilidade) a essas informações, use o canal de pedido de acesso (Art. 18, II).

## 4. Como usar o arquivo

O JSON segue padrão aberto:
- Versão do schema: `1.0`
- Documentação do schema: _(URL ou anexo)_
- Validador online: _(URL)_

Você pode importar em qualquer ferramenta que aceite JSON UTF-8.

## 5. Pra qual operador entregar?

Se quiser que enviemos diretamente para outro fornecedor de serviço (Art. 18, V — "transmissão a outro fornecedor"), responda este email indicando:
- Nome e CNPJ do destinatário.
- Endpoint de recepção (URL ou email seguro).
- Autorização escrita sua identificando o destinatário.

SLA: 15 dias adicionais a partir da sua autorização.

## 6. Validade do link / arquivo

- Link/arquivo expira em **7 dias** (segurança).
- Se precisar de nova cópia: peça novamente pelo canal do DPO.

## 7. Outros direitos

Acesso, correção, eliminação, portabilidade, revogação — exercíveis a qualquer momento via _(dpo@empresa.com.br)_.

Atenciosamente,

**_(Nome do DPO)_**
Encarregado pela Proteção de Dados Pessoais
_(empresa)_

---

_Esta resposta foi gerada em _(data)_, dentro do prazo de 15 dias (Art. 19 LGPD). Comprovante de geração + envio arquivado em _(sistema interno)_ — protocolo _(ID)_._
