---
tipo: resposta-titular-exclusao
data: AAAA-MM-DD
protocolo: _(ID interno)_
titular: _(nome / email — não publicar)_
status: respondido
---

# Resposta a Pedido de Eliminação (Art. 18, VI LGPD)

> **Modelo padronizado.** SLA: **15 dias** corridos. Atenção: nem tudo pode ser excluído (obrigação legal vence).

---

**Para:** _(nome do titular)_
**Assunto:** Resposta ao seu pedido de eliminação de dados — protocolo _(ID)_
**De:** _(DPO — dpo@empresa.com.br)_

Olá _(nome)_,

Recebemos em _(data do pedido)_ seu pedido de eliminação dos dados pessoais que tratamos sobre você. Em cumprimento ao Art. 18, VI da LGPD (Lei 13.709/2018):

## 1. O que foi eliminado

Excluímos em _(data)_ os seguintes dados:

| Categoria | Dados | Sistema | Status |
|---|---|---|---|
| Conta | Nome, email, telefone, endereço | Banco principal | ✅ Excluído |
| Marketing | Email na base de campanhas | Mailchimp/SendGrid | ✅ Excluído |
| Analytics | ID pseudonimizado | Mixpanel | ✅ Pedido enviado ao operador (até 30 dias) |
| Logs operacionais | IP em logs de aplicação | Datadog | ✅ Pedido enviado ao operador (até 30 dias) |
| Backups | Snapshots dos últimos 30 dias | S3 cold | ✅ Marcado pra anonimização no próximo ciclo |

## 2. O que NÃO podemos excluir (obrigação legal — Art. 16, I LGPD)

Por **obrigação legal**, mantemos pelo prazo indicado:

| Dado | Por quê | Por quanto tempo | Acesso restrito? |
|---|---|---|---|
| Histórico de compras (CNPJ/CPF, valor, data, NF-e) | Receita Federal (5 anos) | Até _(data)_ | Sim — apenas fiscal/contábil |
| Logs de transação financeira | Antifraude + obrigação Bacen | 5 anos | Sim — apenas equipe de risco |
| Comunicação prévia (SAC/jurídico) | Defesa de direitos em processo (Art. 7, VI) | Enquanto durar prescrição | Sim — apenas jurídico |
| Notas fiscais emitidas (NF-e/NFC-e) | Imutáveis após autorização SEFAZ | 5 anos (CTN Art. 174) | Sim — apenas fiscal |

Esses dados ficam armazenados de forma **segregada**, com acesso restrito ao mínimo necessário pra cumprir a obrigação legal. Não são usados pra marketing, perfil ou qualquer outra finalidade.

## 3. Confirmação técnica

- **Data da exclusão na base principal:** _(data + hora)_
- **Protocolo de exclusão nos operadores:** anexo
- **Próxima passagem do backup pra remoção física:** _(data — geralmente 30 dias)_

## 4. Reativação

Se mudou de ideia, pode criar uma nova conta a qualquer momento. **Os dados antigos não serão restaurados.**

## 5. Outros direitos

Mantém seus direitos sobre os dados que não podemos excluir:
- Acesso aos dados ainda mantidos.
- Correção.
- Restrição de tratamento.
- Informação sobre compartilhamento.

Email: _(dpo@empresa.com.br)_

## 6. Reclamação

Se discorda da nossa decisão sobre algum dado mantido, pode procurar a ANPD em <https://www.gov.br/anpd>.

Atenciosamente,

**_(Nome do DPO)_**
Encarregado pela Proteção de Dados Pessoais
_(empresa)_

---

_Esta resposta foi gerada em _(data)_, dentro do prazo de 15 dias (Art. 19 LGPD). Comprovante técnico de exclusão arquivado em _(sistema interno)_ — protocolo _(ID)_._
