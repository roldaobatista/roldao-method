---
owner: fiscal-br
revisado-em: 2026-05-24
status: stable
---

# Checklist — Obrigação acessória mensal BR (FISCAL-007)

> Toda feature que **gera, lê ou persiste dado fiscal/trabalhista** precisa pensar na obrigação acessória esperada pelo contador **ANTES** de modelar a tabela. Refazer schema depois de 6 meses de produção é caro e arriscado.
>
> Use antes de modelar tabela nova de pedido, fatura, NF-e, folha, contrato CLT, retenção, ou qualquer registro com efeito fiscal.

## Regra envolvida

**FISCAL-007 — Obrigação acessória mensal**: Cliente PJ tem obrigação acessória mensal (SPED Fiscal, SPED Contribuições, ECF, ECD, eSocial S-1000 a S-3000, REINF). Feature que gera dado fiscal precisa pensar no formato de exportação esperado pelo contador antes de modelar a tabela.

## Checklist

### 1. Identifique a obrigação acessória

- [ ] **SPED Fiscal (EFD-ICMS/IPI)** — toca operação com mercadoria (entrada/saída, estoque, ajuste)?
- [ ] **SPED Contribuições (EFD-Contribuições)** — toca PIS/COFINS (receita, custo, crédito presumido)?
- [ ] **ECD (Escrituração Contábil Digital)** — toca lançamento contábil (débito/crédito)?
- [ ] **ECF (Escrituração Contábil Fiscal)** — toca apuração de IRPJ/CSLL?
- [ ] **eSocial S-1000 a S-3000** — toca empregado, contratação, folha, afastamento, rescisão?
- [ ] **REINF** — toca retenção de PIS/COFINS/CSLL, comissão, INSS retido?
- [ ] **DCTFWeb** — toca débito de tributo federal apurado?
- [ ] **DIRF** (até 2024) / **DIMOB** (imóveis) / **outros** — caso específico do cliente.

### 2. Confirme com o contador

- [ ] Conversei com o contador do cliente (ou DPO/responsável fiscal) sobre o formato esperado?
- [ ] Tenho exemplo do arquivo final (.txt SPED, XML eSocial, ou planilha de conciliação)?
- [ ] Sei a periodicidade (mensal? anual? evento por evento?) e o prazo legal?
- [ ] Sei quem assina/transmite (cliente direto via Receitanet? contador?).

### 3. Modele a tabela pensando na exportação

- [ ] Campos obrigatórios da obrigação acessória **existem como coluna** (não derivados sob demanda)? Ex: SPED Fiscal exige CST, CFOP, NCM — modelar como coluna NÃO NULL evita NULL na hora de gerar.
- [ ] Identificador fiscal (NF-e chave de acesso, CTe, NFC-e) é coluna indexada — UNIQUE quando aplicável (FISCAL-001).
- [ ] CNPJ como `VARCHAR(14)` aceitando alfanumérico (FISCAL-005), NÃO `BIGINT`.
- [ ] Data/hora com timezone explícito (`TIMESTAMPTZ` ou `TIMESTAMP` UTC) — SPED espera fuso BR; conversão na exportação.
- [ ] Valores monetários como `NUMERIC(15,2)` (não `FLOAT`).
- [ ] Status do registro permite reprocessamento (`pendente`, `transmitido`, `rejeitado`, `cancelado`, `retificado`).

### 4. Implemente exportação

- [ ] Função/endpoint dedicado pra exportar o registro no formato da obrigação (não improvisar SELECT na hora do contador pedir).
- [ ] Função aceita filtro por competência (`AAAA-MM`) ou intervalo de datas.
- [ ] Saída em formato canônico (TXT SPED com pipe `|`, XML schema oficial, CSV UTF-8).
- [ ] Encoding correto (UTF-8 ou ISO-8859-1 conforme o leiaute exige).
- [ ] Arquivo nomeado com convenção do contador (`SPED-FISCAL-AAAAMM-CNPJ.txt`).

### 5. Teste com dado real (sintético)

- [ ] Fixture com 1 evento completo de cada tipo (entrada, saída, ajuste, cancelamento).
- [ ] Saída validada contra leiaute oficial (PVA SPED Fiscal, validador eSocial, etc.) em CI ou em pre-merge manual.
- [ ] Cenário de retificação testado (gerar, transmitir, retificar, retransmitir).

### 6. Trilha e auditabilidade (LGPD-004)

- [ ] Toda geração de arquivo registrada em log imutável (quem gerou, quando, hash do arquivo).
- [ ] Versão do leiaute usada gravada com o registro (SPED muda anualmente).
- [ ] Cliente consegue baixar arquivo histórico (auditoria fiscal pode pedir 5 anos depois).

### 7. ADR

- [ ] ADR documenta: qual obrigação acessória cobre, periodicidade, leiaute, responsável pela transmissão, plano de retificação.
- [ ] ADR cita FISCAL-007 (e FISCAL-001 a FISCAL-006 conforme aplicável).

## Sintomas de "não passou no checklist"

- Contador pede arquivo e dev refaz schema de tabela.
- Migration pra adicionar coluna NCM/CFOP **6 meses depois** do produto em produção.
- Cliente paga multa por entrega atrasada da obrigação porque o sistema não tinha histórico.
- "Vou exportar via Excel manual mesmo" — gambiarra que dura 2 anos.

## Referências

- [Portal SPED — Receita Federal](http://sped.rfb.gov.br/)
- [eSocial — leiautes oficiais](https://www.gov.br/esocial/)
- [LC 214/2025 — Reforma Tributária](https://www.gov.br/) (impacta SPED a partir de 2026)
- Skill `calculadora-reforma-paralela` (addon `fiscal-br-completo`) — cálculo paralelo regime atual/novo.
- ADR-template em `templates/.specify/templates/decision-log.md`.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
