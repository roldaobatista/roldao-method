---
tipo: dpa
versao: 1.0
data: AAAA-MM-DD
status: rascunho
controlador: _(razão social + CNPJ)_
operador: _(razão social + CNPJ + país)_
---

# Acordo de Tratamento de Dados (DPA — Data Processing Agreement)

> **Modelo base.** Adaptar com jurídico. Compatível com LGPD (Brasil) e SCC da Comissão Europeia quando há transferência internacional.

## Partes

- **CONTROLADOR:** _(razão social, CNPJ, endereço)_, doravante "Controlador".
- **OPERADOR:** _(razão social, CNPJ ou registro local, endereço, país)_, doravante "Operador".

## 1. Definições

Termos seguem LGPD Art. 5 (titular, dado pessoal, dado pessoal sensível, controlador, operador, tratamento, anonimização, consentimento, base legal, ANPD).

## 2. Objeto

O Operador trata dados pessoais em nome do Controlador no contexto do serviço _(descrever serviço, ex: "hospedagem em nuvem", "envio de email transacional", "observabilidade")_.

## 3. Instruções do Controlador

O Operador trata dados pessoais **estritamente conforme instruções documentadas** do Controlador. Sem autorização escrita, o Operador não:
- Usa dados pessoais pra finalidade própria.
- Compartilha com terceiros (exceto sub-operadores aprovados).
- Transfere pra país sem garantia legal.

## 4. Categorias de titulares e dados tratados

| Titulares | Categorias de dados | Sensível? |
|---|---|---|
| Clientes finais do Controlador | _(ex: nome, email, IP)_ | _(não/sim)_ |
| Colaboradores do Controlador | _(ex: login, ações de admin)_ | não |

## 5. Duração

Vigência: enquanto durar o contrato principal + _(período de retenção pós-término, ex: 30 dias pra exclusão completa)_.

## 6. Confidencialidade

O Operador garante que pessoas autorizadas a tratar dados pessoais assinaram compromisso de confidencialidade.

## 7. Segurança (Art. 46-49 LGPD)

O Operador implementa:
- **Criptografia** em repouso (AES-256) e em trânsito (TLS 1.3).
- **Controle de acesso** por menor privilégio, autenticação multifator pra acesso administrativo.
- **Trilha de acesso** com retenção mínima 6 meses.
- **Backup** criptografado e testado periodicamente.
- **Plano de continuidade** documentado.
- **Avaliação de segurança** anual (pentest, SOC 2, ISO 27001 ou equivalente).
- **Treinamento** anual da equipe em proteção de dados.

## 8. Sub-operadores

- Lista de sub-operadores autorizados: _(anexo ou URL pública)_.
- Mudança de sub-operador: aviso prévio de **30 dias** ao Controlador, que pode objetar.
- Em caso de objeção: Operador propõe alternativa ou Controlador pode rescindir sem multa.

## 9. Direitos dos titulares

O Operador assiste o Controlador no atendimento aos direitos do Art. 18 LGPD:
- Acesso, correção, portabilidade, eliminação: fornecer ferramenta/API ou atender em até **10 dias úteis** após pedido formal.
- SLA total do Controlador é 15 dias; Operador entrega em 10.

## 10. Incidente de segurança

- **Notificação ao Controlador:** **imediata** (máx **24 horas**) após ciência do incidente.
- **Conteúdo da notificação:** natureza, dados afetados, titulares afetados, ações tomadas, contato técnico.
- **Apoio à comunicação ANPD:** Operador fornece todas as informações necessárias para o Controlador cumprir o prazo de **72 horas** (Resolução ANPD 15/2024).

## 11. Auditoria

- Controlador pode auditar o Operador **1× ao ano**, com aviso de 30 dias.
- Em vez de auditoria presencial, Operador pode fornecer relatório SOC 2 Type II ou ISO 27001 vigente.

## 12. Transferência internacional

_(Se aplicável — Operador fora do Brasil.)_
- País: _(ex: EUA)_.
- Garantia legal: _(Cláusulas Padrão Contratuais ANPD; SCC EU se houver dado europeu também; binding corporate rules; certificação de adequação)_.
- Anexo com cláusulas padrão aplicáveis.

## 13. Retorno e eliminação de dados

Após término do contrato, em até **30 dias**:
- Devolver todos os dados pessoais em formato estruturado (JSON/CSV).
- Excluir todas as cópias (produção, backups, logs), exceto onde lei obrigue retenção.
- Fornecer **atestado escrito** de eliminação.

## 14. Responsabilidade

Operador responde por danos causados por descumprimento deste DPA conforme LGPD Art. 42 e ss.

## 15. Disposições finais

- Foro: _(Comarca pactuada)_.
- Lei aplicável: lei brasileira (LGPD).
- Anexos: lista de sub-operadores, cláusulas padrão de transferência internacional, descrição técnica do serviço.

## Assinaturas

| Parte | Nome | Cargo | Data |
|---|---|---|---|
| Controlador | | | |
| Operador | | | |

---

_Referências:_
- LGPD Art. 39-45 (operador).
- ANPD Resolução 15/2024 (incidente).
- Modelo de Cláusulas Padrão Contratuais ANPD (Resolução 19/2024).
