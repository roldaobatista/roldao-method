---
name: checklist-lgpd
description: Aplica checklist LGPD a uma feature ou fluxo de tratamento de dados pessoais. Pergunta dirigida + arvore de decisao de base legal (Art. 7 / Art. 11). Use antes de implementar coleta/armazenamento/compartilhamento de dado pessoal.
owner: framework
revisado-em: 2026-05-18
status: stable
---

# checklist-lgpd

Skill operacional pra cumprir LGPD-001 a LGPD-010 antes de codar.

## Quando usar

- Antes de implementar formulario que coleta dado pessoal.
- Ao integrar com fornecedor que recebe dado pessoal (CRM, e-mail marketing, gateway de pagamento).
- Ao criar feature de export/download de dados.
- Ao escrever ADR de feature regulada.

## Arvore de decisao — qual base legal usar?

Cobre os 10 incisos do Art. 7 (consentimento NAO e default). Para dado sensivel, ir para Art. 11.

```
1. Os dados sao SENSIVEIS? (saude, biometria, religiao, raca, orientacao sexual, politica, sindicato)
   SIM  -> usar Art. 11 (bases mais restritas: consentimento especifico OU obrigacao legal OU
           tutela da saude OU pesquisa em saude OU exercicio regular OU protecao da vida)
   NAO  -> ir para Art. 7

2. Estado/admin publica processando dado pra atribuicao legal (politica publica)?
   SIM  -> Art. 7, III - tratamento pela administracao publica
   NAO  -> ir para 3

3. E pra estudo por orgao de pesquisa (anonimizacao quando possivel)?
   SIM  -> Art. 7, IV - estudos por orgao de pesquisa
   NAO  -> ir para 4

4. Eu PRECISO desse dado pra cumprir um CONTRATO com o titular (ou procedimento preliminar)?
   SIM  -> Art. 7, V - execucao de contrato
   NAO  -> ir para 5

5. Existe LEI que me obriga a coletar? (NF-e exige CPF do destinatario)
   SIM  -> Art. 7, II - cumprimento de obrigacao legal pelo controlador
   NAO  -> ir para 6

6. E pra exercer regularmente direito em processo judicial/administrativo/arbitral?
   SIM  -> Art. 7, VI - exercicio regular de direitos
   NAO  -> ir para 7

7. E pra protecao da vida ou da incolumidade fisica do titular ou de terceiro?
   SIM  -> Art. 7, VII - protecao da vida
   NAO  -> ir para 8

8. E pra tutela da saude por profissional/servico/autoridade sanitaria?
   SIM  -> Art. 7, VIII - tutela da saude
   NAO  -> ir para 9

9. E pra protecao do credito (bureau, scoring legitimo)?
   SIM  -> Art. 7, X - protecao do credito
   NAO  -> ir para 10

10. Tenho interesse legitimo claro E que nao viola direitos do titular?
    SIM  -> Art. 7, IX - interesse legitimo (documentar teste de balanceamento + transparencia ativa)
    NAO  -> ir para 11

11. Ultimo recurso: pedir CONSENTIMENTO livre, informado, especifico, revogavel.
    -> Art. 7, I - consentimento (precisa de UI clara e log do consentimento)
```

## Checklist da feature

Antes de mergear:

- [ ] **LGPD-001** — Cada campo pessoal tem base legal documentada no ADR/PRD?
- [ ] **LGPD-002** — Existe rota de exclusao (titular consegue apagar conta + dados)?
- [ ] **LGPD-003** — Coletamos so o necessario? Removemos campos opcionais que nao usamos?
- [ ] **LGPD-004** — Acesso a dado sensivel (saude, financeiro) e logado em trilha imutavel?
- [ ] **LGPD-005** — Algum dado vai pra fora do Brasil? Tem DPA + base legal especifica?
- [ ] **LGPD-006** — Plano de incidente existe? Quem comunica ANPD em 72h?
- [ ] **LGPD-007** — Texto da politica de privacidade cita a base legal usada?
- [ ] **LGPD-008** — Tratamento e de alto risco? Se sim, RIPD esta feito?
- [ ] **LGPD-009** — Canal do titular (e-mail/form do DPO) esta funcional?
- [ ] **LGPD-010** — Decisao automatizada? Titular consegue pedir revisao humana?

## Anti-padroes

- "Consentimento" como base default — quase sempre e execucao de contrato ou obrigacao legal.
- Checkbox "li e aceito" gigante misturando termos + privacidade.
- Salvar IP, geolocalizacao, fingerprint sem base legal.
- Compartilhar com fornecedor sem DPA assinado.
- Botao "excluir conta" que so marca `ativo=false` (LGPD-002 exige exclusao efetiva ou crypto-shredding).
- Log de erro com CPF/email/cartao em texto puro.

## Saida esperada da skill

Quando invocada, a skill produz:

1. **Base legal recomendada** (com justificativa em 1 linha).
2. **Lista de itens a documentar** no PRD/ADR.
3. **Lista de campos a remover** (minimizacao, LGPD-003).
4. **Lista de hooks/log a adicionar** (trilha LGPD-004 se for sensivel).
5. **Texto pronto pra politica de privacidade** (paragrafo curto citando base legal).

## Referencias

- Lei 13.709/2018 (LGPD).
- Guia ANPD de Boas Praticas.
- Guia ANPD de Tratamento de Dados Pessoais por Pessoa Natural.
- Decreto 11.674/2023 (DPO e canal).
