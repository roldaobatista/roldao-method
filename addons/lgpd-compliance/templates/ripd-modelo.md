---
tipo: ripd
versao: 1.0
data: AAAA-MM-DD
revisao: 1
controlador: _(nome da empresa)_
encarregado-dpo: _(nome / email)_
status: rascunho
---

# Relatório de Impacto à Proteção de Dados Pessoais (RIPD)

> Conforme LGPD Art. 38 e Guia ANPD de RIPD (Resolução CD/ANPD nº 1/2021).
> **Quando exigir:** tratamento de alto risco — dado sensível em escala, decisão automatizada relevante, monitoramento sistemático, criança/adolescente, transferência internacional, base legal "interesse legítimo".

## 1. Identificação do tratamento

| Campo | Conteúdo |
|---|---|
| Nome do tratamento | _(ex: "Cadastro biométrico no app")_ |
| Sistema/produto | |
| Iniciativa/projeto | _(US-NNN ou PRD-NNN)_ |
| Data prevista de início | |
| Operadores envolvidos | _(terceiros que tratam os dados)_ |

## 2. Finalidade

- **Propósito específico:** _(uma frase clara)_
- **Resultado esperado pro titular:** _(o que ele ganha)_
- **Resultado esperado pro controlador:** _(o que a empresa ganha)_

## 3. Base legal (Art. 7 ou Art. 11)

- **Base escolhida:** _(consentimento / execução de contrato / obrigação legal / interesse legítimo / proteção da vida / política pública / pesquisa / proteção do crédito)_
- **Justificativa:** _(por que essa e não outra; ver árvore de decisão em `kb-lgpd.md`)_
- **Se interesse legítimo:** teste de balanceamento documentado (necessidade × proporcionalidade × salvaguardas).

## 4. Dados tratados

| Categoria | Itens específicos | Sensível? (Art. 5 II) | Origem |
|---|---|---|---|
| _(ex: identificação)_ | nome, CPF | não | formulário |
| _(ex: biometria)_ | facial template | **sim** | câmera do app |

- **Minimização:** justificar cada item — está sendo coletado o mínimo necessário?

## 5. Titulares afetados

- **Volume estimado:** _(número de pessoas)_
- **Categorias:** _(clientes / colaboradores / crianças / fornecedores)_
- **Vulneráveis envolvidos:** _(crianças, idosos, pessoas com deficiência?)_

## 6. Ciclo de vida do dado

| Etapa | Sistema | Local | Retenção | Quem acessa |
|---|---|---|---|---|
| Coleta | | | | |
| Armazenamento | | | | |
| Tratamento | | | | |
| Compartilhamento | | | | |
| Eliminação | | | | |

## 7. Compartilhamento

- **Internos:** _(setores que acessam)_
- **Operadores (DPA):** _(Sentry, Mixpanel, OpenAI, AWS, etc — DPA assinado?)_
- **Transferência internacional:** _(país? cláusulas padrão? ANPD adequação?)_

## 8. Riscos identificados

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Vazamento por SQL injection | baixa | alto | input validation + WAF + pentest |
| Acesso indevido por colaborador | média | médio | RBAC + trilha de acesso (LGPD-004) |
| Reidentificação após pseudonimização | baixa | alto | hash com sal por tenant + rotação |
| Uso secundário não autorizado | baixa | médio | log de finalidade + auditoria |
| _(adicionar...)_ | | | |

## 9. Salvaguardas técnicas e organizacionais

- [ ] Criptografia em repouso e em trânsito.
- [ ] Trilha de acesso (LGPD-004) com retenção mínima 6 meses.
- [ ] Princípio do menor privilégio (RBAC).
- [ ] Backup criptografado com plano de teste de restauração.
- [ ] Plano de resposta a incidente (72h ANPD — ver `kb-lgpd.md`).
- [ ] Treinamento dos operadores em LGPD.
- [ ] Contratos DPA com operadores.
- [ ] Avaliação periódica (anual ou em mudança material).

## 10. Direitos do titular (Art. 18)

SLA padrão: **15 dias corridos** (Art. 19 II — acesso em formato completo; demais direitos seguem o mesmo prazo por prática consolidada).

| Direito | Como o titular exerce | SLA atendimento | Implementado? |
|---|---|---|---|
| Confirmação + acesso | Canal DPO | 15 dias corridos | [ ] |
| Correção | Tela "Meus dados" | 15 dias corridos | [ ] |
| Anonimização/bloqueio/eliminação | Canal DPO | 15 dias corridos | [ ] |
| Portabilidade | Exporta JSON/CSV no app | 15 dias corridos | [ ] |
| Informação de compartilhamento | Política de privacidade | n/a | [ ] |
| Revogação de consentimento | Tela de privacidade | imediata | [ ] |
| Revisão de decisão automatizada (Art. 20) | Canal DPO | 15 dias corridos | [ ] |

## 11. Decisão automatizada (se aplicável)

- **Há decisão automatizada que afeta interesse do titular?** sim / não
- **Lógica usada:** _(descrever em alto nível, sem segredo industrial absoluto)_
- **Critérios determinantes:** _(quais variáveis pesam mais)_
- **Direito a revisão humana:** _(como é exercido)_

## 12. Conclusão e plano de ação

- **Risco residual:** baixo / médio / alto
- **Aceitável?** sim / não / com mitigação adicional
- **Pendências antes de produção:**
  - [ ] _(item)_
  - [ ] _(item)_
- **Próxima revisão:** _(data — pelo menos anual)_

## 13. Assinaturas

| Função | Nome | Data |
|---|---|---|
| DPO | | |
| Tech Lead | | |
| Patrocinador do produto | | |

---

_Referências:_
- LGPD (Lei 13.709/2018), Art. 38.
- Guia ANPD de RIPD: <https://www.gov.br/anpd/pt-br/documentos-e-publicacoes/guia_ripd.pdf>
- Knowledge base: `templates/.specify/data/kb-lgpd.md`
- Checklist: `templates/.specify/checklists/lgpd-privacy-review.md`
