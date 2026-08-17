---
owner: <PRODUCT>
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 100
proposito: personas do conciliab (preenchido a partir de EE-001..EE-008).
---

# Personas — conciliab

## P-001 — Sócio-administrador da PME

- **Papel**: dono, faz a conciliação ele mesmo ou divide com cônjuge/sócio.
- **Contexto**: PME 15-150 funcionários, faturamento R$ 500k-50M/ano.
- **Contexto técnico**: usa Excel/Google Sheets, ERP simples (Conta Azul/Bling), e-mail. Não programa.
- **Frustrações**:
  - "Toda virada de mês paro 3-5h por banco pra bater extrato"
  - "Divergência só aparece no mês seguinte, quando já é tarde"
  - "Contador cobra R$ 300/mês só pra fazer isso"
- **Job to be done**: "Quando viro o mês, quero conciliar minhas contas em ≤30 minutos, para que eu volte a tocar o negócio em vez de bater planilha."
- **Métrica de sucesso pessoal**: terminar conciliação até dia 10 do mês, sem multa fiscal.
- **Comprador?**: SIM — assina o cheque.

## P-002 — Financeiro interno (quando existe)

- **Papel**: usuário diário do produto. 1-3 pessoas no time.
- **Contexto**: PME com financeiro estruturado, faturamento ≥R$ 5M.
- **Contexto técnico**: usa ERP intensivamente, planilha avançada, alguma familiaridade com OFX/CSV.
- **Frustrações**:
  - "Quero terminar o mês antes do dia 10 — sempre estouro o prazo"
  - "Quando o sistema dá divergência sem motivo claro, perco o dia"
- **Job to be done**: "Quando recebo extrato bancário, quero conciliar com contas a pagar/receber automaticamente, identificando divergências antes do dia 5."
- **Métrica de sucesso pessoal**: zero pendência aberta no dia 10.
- **Comprador?**: NÃO — recomenda ao sócio.

## P-003 — Contador terceirizado (comprador influente)

- **Papel**: atende ~20 PMEs. Não usa o produto direto; recomenda.
- **Contexto**: escritório de contabilidade, 1-5 colaboradores.
- **Contexto técnico**: usa Domínio/Alterdata/Contmatic. Aceita PDF, OFX, planilha.
- **Frustrações**:
  - "Metade dos meus clientes me manda o extrato pra eu bater — gasto 5h/mês por cliente fazendo isso"
  - "Se o cliente batesse certo, eu vendia consultoria fiscal no lugar"
- **Job to be done**: "Quando indico ferramenta pro cliente, quero que ele consiga sozinho a partir do mês seguinte, sem precisar do meu suporte técnico."
- **Métrica de sucesso pessoal**: ≤2 perguntas técnicas por cliente no 1º mês.
- **Comprador?**: NÃO direto, mas decide indicação (≥40% dos novos clientes vêm via contador).

## Anti-personas (NÃO é o público)

- **PME com >300 funcionários** — tem ERP enterprise (TOTVS/Sankhya); não compete.
- **Pessoa física** — fluxo bancário simples, planilha basta.
- **Banco/instituição financeira** — fora do escopo regulatório.
- **PME com <50 transações/mês** — economia não justifica a mensalidade.

## Critério `stable`

- [x] 3 personas validadas em ≥8 entrevistas (EE-001..EE-008).
- [x] Comprador vs usuário distintos.
- [x] Anti-personas explícitas.

> Termos: ver `docs/glossario.md`.
