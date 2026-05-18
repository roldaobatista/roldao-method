---
name: gerar-canal-dpo
description: Gera template completo do canal de DPO — pagina publica, email funcional, fluxo de atendimento, SLA 15 dias. Use ao implementar o canal pela primeira vez ou ao revisar canal existente.
---

# gerar-canal-dpo

Canal do DPO não pode ser decorativo. Art. 41 da LGPD exige publicação + canal funcional. Art. 19 dá SLA de 15 dias pro titular.

## O que precisa existir

1. **Página pública** `/privacidade/dpo` ou similar:
   - Nome do DPO (pessoa física ou razão social se terceirizado).
   - Email funcional + (opcional) formulário.
   - Endereço postal (opcional, mas recomendado).
   - Lista de direitos (Art. 18 LGPD).
   - SLA de resposta.

2. **Email funcional** `dpo@suaempresa.com.br`:
   - Caixa monitorada (não `legal@` genérico abandonado).
   - Auto-resposta com confirmação de recebimento e número de protocolo.
   - Encaminhamento pra fluxo interno.

3. **Fluxo de atendimento interno**:
   - Recebe email → registra ticket → classifica direito → busca dado → responde em 15 dias.

4. **Política de retenção** das comunicações.

## Template — página de DPO

```markdown
# Encarregado de Proteção de Dados (DPO)

Em cumprimento ao Art. 41 da Lei Geral de Proteção de Dados (Lei 13.709/2018),
informamos os dados do nosso Encarregado pelo Tratamento de Dados Pessoais.

## Quem é o DPO

- **Nome:** _(nome completo do responsável)_
- **Empresa (se terceirizado):** _(razão social)_
- **Função:** Encarregado de Proteção de Dados (DPO/Data Protection Officer)

## Como entrar em contato

- **Email:** dpo@suaempresa.com.br
- **Formulário:** _(link para formulário web, opcional)_
- **Endereço postal:** _(opcional)_

## Seus direitos (Art. 18 LGPD)

Como titular dos dados, você pode:

1. **Confirmar** que tratamos seus dados.
2. **Acessar** os dados que temos.
3. **Corrigir** dados incompletos ou desatualizados.
4. **Pedir anonimização, bloqueio ou exclusão** de dados desnecessários ou tratados em
   desconformidade.
5. **Portabilidade** — receber seus dados em formato estruturado.
6. **Eliminar** dados tratados com consentimento (salvo retenção legal).
7. **Saber com quem compartilhamos** seus dados.
8. **Ser informado** sobre a possibilidade de não consentir.
9. **Revogar consentimento** a qualquer momento.
10. **Pedir revisão humana** de decisões automatizadas.

## Como solicitar

1. Envie email pra dpo@suaempresa.com.br informando:
   - Seu nome completo.
   - CPF (para identificarmos seus dados).
   - Direito que deseja exercer.
   - Forma preferida de resposta (email, postal).
2. Em até 2 dias úteis, você recebe **confirmação com número de protocolo**.
3. Em até **15 dias**, recebe a resposta com a ação tomada.

## Reclamação à ANPD

Se você não estiver satisfeito com nossa resposta, pode reclamar à
Autoridade Nacional de Proteção de Dados (ANPD): <https://www.gov.br/anpd>.

## Atualizações

Esta página foi atualizada em: AAAA-MM-DD
```

## Template — auto-resposta de email

```
Olá,

Recebemos sua solicitação relacionada à proteção de dados pessoais.

**Número de protocolo:** DPO-{ano}-{sequencial-6dig}
**Data:** {data atual}
**Prazo legal de resposta:** 15 dias corridos (Art. 19 LGPD)

Nossa equipe vai analisar e retornar pelo mesmo email.
Caso precise complementar a solicitação, responda este email mantendo
o número de protocolo no assunto.

Para acompanhar:
- Por email: dpo@suaempresa.com.br (responda este)
- Site: https://suaempresa.com.br/privacidade/dpo

Atenciosamente,
DPO — {Nome da Empresa}
```

## Template — fluxo interno

```yaml
# Fluxo de atendimento DPO
recebimento:
  canal: dpo@suaempresa.com.br
  responsável: DPO + assistente
  prazo_confirmacao_titular: 2 dias úteis
  registro: sistema de ticket (Jira / Linear / planilha versionada)

classificacao:
  - acesso (Art. 18 II)
  - correção (Art. 18 III)
  - exclusao (Art. 18 IV ou VI)
  - portabilidade (Art. 18 V)
  - informação sobre compartilhamento (Art. 18 VII)
  - revogação de consentimento (Art. 18 IX)
  - revisão de decisão automatizada (Art. 20)

execução:
  - dpo classifica
  - tech-lead executa busca / extração / exclusão técnica
  - dpo revisa resposta
  - dpo envia ao titular dentro do SLA

retencao:
  - email original: 6 meses (auditoria)
  - ticket: 5 anos (Art. 41 + prudência)
  - resposta: 5 anos
```

## Checklist de implementação

- [ ] Email `dpo@` criado e direcionado a caixa monitorada.
- [ ] Auto-resposta configurada com protocolo numerado.
- [ ] Página `/privacidade/dpo` publicada no site.
- [ ] Link no rodapé de todas as páginas + footer de emails.
- [ ] Política de Privacidade aponta pro canal.
- [ ] Time treinado no fluxo (DPO + um substituto pra férias).
- [ ] Templates de resposta prontos (skill `resposta-titular`).
- [ ] Sistema de ticket configurado.
- [ ] SLA monitorado (alerta se > 10 dias sem resposta).
- [ ] Métricas: pedidos/mês, tempo médio, tipos mais comuns.

## Anti-padrões

❌ Email `legal@` genérico sem dono claro.
❌ DPO publicado mas caixa não monitorada (titular reclama na ANPD).
❌ Resposta após o SLA sem justificativa formal.
❌ Pedir documentação excessiva pra "validar" o titular (CPF + nome são suficientes; documento com foto só se há dúvida real).
❌ Negar pedido sem fundamentar.
❌ Não logar interação (perde histórico em caso de auditoria).
