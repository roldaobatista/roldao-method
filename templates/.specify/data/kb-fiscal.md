---
tipo: knowledge-base
id: KB-FISCAL
versao: 1
status: stable
owner: fiscal-br
revisado-em: 2026-05-18
---

# KB — Conhecimento fiscal brasileiro

> Base de conhecimento que o agente `fiscal-br` consulta. Memória externa de regras, prazos e siglas que não dá pra deduzir do código.

## Documentos fiscais eletrônicos

| Sigla | Nome | Quando usar | Norma base |
|---|---|---|---|
| **NF-e** | Nota Fiscal eletrônica modelo 55 | Venda de mercadoria entre empresas (B2B) ou empresa→pessoa | Ajuste SINIEF 07/2005 |
| **NFC-e** | Nota Fiscal de Consumidor modelo 65 | Venda no varejo direto a consumidor (substitui cupom fiscal) | Ajuste SINIEF 19/2016 |
| **NFS-e** | Nota Fiscal de Serviço eletrônica | Prestação de serviço — municipal, padrão varia por município | LC 116/2003 |
| **CT-e** | Conhecimento de Transporte eletrônico | Frete de carga | Ajuste SINIEF 09/2007 |
| **MDF-e** | Manifesto de Documentos Fiscais eletrônicos | Transporte de várias notas ao mesmo tempo | Ajuste SINIEF 21/2010 |
| **CF-e** (SAT) | Cupom Fiscal eletrônico SAT | Varejo em alguns estados (SP, CE) | Convênio ICMS 09/2009 |
| **BP-e** | Bilhete de Passagem eletrônico | Transporte de passageiros | Ajuste SINIEF 01/2017 |

## Ambientes SEFAZ

- **Ambiente 1 — Produção**: NF-e oficial, gera obrigação tributária real.
- **Ambiente 2 — Homologação**: NF-e de teste, sem valor fiscal, **com aviso obrigatório no DANFE**: "SEM VALOR FISCAL — EMITIDA EM AMBIENTE DE HOMOLOGAÇÃO".

Em dev, sempre ambiente 2. Promoção pra ambiente 1 = release crítico.

## Webservices NF-e (por UF, autorizador)

Cada UF tem URL própria. Algumas usam SVAN (Sefaz Virtual do Ambiente Nacional) ou SVRS (Sefaz Virtual do RS):

| UF | Autorizador |
|---|---|
| SP, MG, RS, BA, GO, MS, PR, MT, PE | Próprio |
| Demais (AC, AL, AP, CE, DF, ES, MA, PA, PB, PI, RJ, RN, RO, RR, SC, SE, TO) | Geralmente SVRS/SVAN |

Contingências:
- **SVC-AN** (Ambiente Nacional)
- **SVC-RS** (Rio Grande do Sul)
- **EPEC** (Evento Prévio de Emissão em Contingência)

Limite legal em contingência: emitir em contingência é OK, **mas transmitir em 168h** após emissão.

## Status de NF-e (cStat principais)

- `100` — Autorizado o uso da NF-e ✅
- `101` — Cancelamento homologado
- `102` — Inutilização homologada
- `110` — Uso denegado (contribuinte irregular)
- `135` — Evento registrado e vinculado a NF-e (ex: CC-e)
- `204` — Duplicidade de NF-e (chave já autorizada)
- `217` — NF-e não consta na base
- `225` — Falha no schema XML

## Cálculo tributário — atenções

- **Arredondamento**: 2 casas para valores em real (BRL), 4 casas para alíquotas. Modo HALF_EVEN ou conforme MOC.
- **Base de cálculo**: cada tributo tem regra própria. ICMS por dentro, PIS/COFINS sobre receita bruta, ISS sobre valor do serviço.
- **Substituição tributária (ST)**: ICMS-ST exige cálculo de MVA, base de retenção, antecipação.
- **DIFAL**: diferencial de alíquota interestadual.

## Reforma Tributária 2026-2033

Cronograma simplificado:

| Período | O que acontece |
|---|---|
| **2026** | CBS 0,9% + IBS 0,1% em teste (compensável). Sistema deve emitir com ambos tributos calculados ao lado de PIS/COFINS/ICMS/ISS. |
| **2027** | CBS substitui PIS/COFINS — alíquota cheia. PIS/COFINS extintos. |
| **2029-2032** | Redução gradual de ICMS+ISS, aumento gradual de IBS. |
| **2033** | Regime novo pleno: CBS + IBS + IS (Imposto Seletivo). ICMS/ISS extintos. |

Tributos novos:
- **CBS** — Contribuição sobre Bens e Serviços (federal)
- **IBS** — Imposto sobre Bens e Serviços (estadual + municipal)
- **IS** — Imposto Seletivo ("imposto do pecado" — cigarro, bebida alcoólica, açucarado, poluente)

Princípios da reforma:
- **Não-cumulatividade plena** — crédito amplo em toda cadeia.
- **Destino** — tributo arrecadado no estado/município do consumo (não da origem).
- **Cashback** — devolução pra famílias de baixa renda.

## CNPJ alfanumérico (jul/2026)

A partir de **julho/2026**, novos CNPJs podem ter letras (não só números). Total continua **14 caracteres**, com 2 dígitos verificadores numéricos no final.

- Sistema deve aceitar CNPJ com letras (A-Z, exceto I/O pra evitar confusão).
- Validação de DV: algoritmo módulo 11 sobre os 12 primeiros caracteres tratados conforme tabela oficial.
- CNPJs antigos (só numéricos) continuam válidos pra sempre.

Skill `validar-cpf-cnpj` cobre os dois formatos.

## Obrigações acessórias principais

| Obrigação | O que é | Prazo |
|---|---|---|
| **SPED Fiscal** | Escrituração ICMS/IPI | Dia 25 do mês seguinte |
| **SPED Contribuições** | Escrituração PIS/COFINS | Dia 10 do 2º mês seguinte |
| **ECD** | Escrituração Contábil Digital | Maio do ano seguinte |
| **ECF** | Escrituração Contábil Fiscal | Julho do ano seguinte |
| **eSocial** | Eventos trabalhistas | Eventos com prazo variado (S-1000 cadastro, S-2200 admissão, S-1200 folha) |
| **REINF** | Retenções (PIS/COFINS/CSLL, INSS) | Dia 15 do mês seguinte |
| **DCTFWeb** | Consolida eSocial + REINF | Dia 15 do mês seguinte |
| **DIRF** | Imposto de Renda Retido | **Extinta** a partir de fatos geradores ≥ 2025 (IN RFB 2.181/2024). Substituída pela DCTFWeb + eSocial + EFD-Reinf. Última entrega: fevereiro/2025 referente a 2024. |

## Certificado digital

- **A1**: arquivo `.pfx`/`.p12`, validade 1 ano, pode ser usado em servidor.
- **A3**: token/cartão físico ou em nuvem, validade até 5 anos.
- **e-CNPJ vs e-CPF**: e-CNPJ assina pela pessoa jurídica; e-CPF assina pela pessoa física.
- ICP-Brasil é o único padrão aceito por SEFAZ.

## Anti-padrões fiscais

❌ Regerar XML autorizado — XML autorizado é imutável (FISCAL-001).
❌ Compartilhar certificado entre tenants — cada empresa tem o seu (FISCAL-002).
❌ Hardcoded ambiente=produção — tem que ser config (FISCAL-003).
❌ Emitir sem contingência quando SEFAZ cai — perde venda (FISCAL-004).
❌ Hardcoded alíquota — Reforma 2026-2033 muda a cada ano (FISCAL-006).
❌ CPF/CNPJ em log em texto puro — LGPD-004.
❌ Cancelar NF-e após 24h — regra geral nacional. **Atenção:** SEFAZ-SP permite cancelamento extemporâneo (após 24h, dentro de 480h/20 dias) com sujeição a multa, conforme Portaria CAT 12/2015 — exceção restrita a casos específicos (não usar como rotina). Outros estados podem ter regras próprias — sempre consultar a SEFAZ da UF.

## Referências oficiais

- Portal NF-e: <https://www.nfe.fazenda.gov.br/>
- Manual de Orientação do Contribuinte (MOC): atualizado regularmente
- Tabela de UFs e autorizadores: SEFAZ-AC a SEFAZ-TO
- Comitê Gestor da Reforma Tributária: <https://www.gov.br/fazenda/pt-br/assuntos/reforma-tributaria>
