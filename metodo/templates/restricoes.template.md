---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 10/17
proximo: docs/descoberta/hipoteses-a-validar.md
idioma: pt-BR
limite-linhas: 120
proposito: restrições do projeto — orçamento, prazo, equipe, geografia, dependências.
---

<!--
template: restricoes.md
destino: docs/descoberta/restricoes.md
uso: limites duros que moldam decisões. Recomendado (🟡).
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3
limite: ≤120 linhas.
-->

# Restrições — <NomeDoProjeto>

> Não é "lista de desejos" — é o que limita decisões. Tudo aqui afeta arquitetura, escopo e cronograma.

## 1. Orçamento

- **Total disponível V1**: R$ <X>
- **Mensal recorrente máximo (infra + ferramentas)**: R$ <Y>
- **Caixa em meses até break-even ou nova rodada**: <N meses>
- **Fonte**: <caixa próprio | aporte de investidor | empréstimo>

## 2. Prazo

- **MVP visível ao cliente**: <YYYY-MM-DD>
- **Primeira venda real**: <YYYY-MM-DD>
- **Break-even**: <YYYY-MM-DD>
- **Limite duro (não pode passar)**: <YYYY-MM-DD> — <motivo: compromisso com investidor / regulação / etc.>

## 3. Equipe

- **Tamanho atual**: <N pessoas>
- **Composição**: <2 devs full-stack, 1 dono/PM, 0 designers>
- **Crescimento previsto**: <+1 dev em F-2, +1 designer em F-3>
- **Disponibilidade**: <full-time / part-time / hora-extra>

## 4. Geografia

- **Idioma do produto**: <pt-BR | pt-BR + en | multi-idioma>
- **Hospedagem permitida**: <Brasil obrigatório | global ok | UE proibido por sanção>
- **Mercado-alvo**: <Brasil | América Latina | global>
- **Fuso horário do suporte**: <BRT | 24/7>

## 5. Dependências externas

| Dependência | Função | Risco se cair | Plano B |
|---|---|---|---|
| <ex.: AWS sa-east-1> | <hospedagem> | <indisponibilidade> | <multi-region em F-3> |
| <ex.: Bacen Open Finance> | <integração bancária> | <atraso de regulação> | <CSV/OFX no V1> |
| <ex.: Cognito> | <auth> | <vendor lock-in> | <ADR-0001 documenta saída> |

## 6. Stack pré-decidida (se houver)

- **Linguagem**: <ex.: Python imposto por skill set do time>
- **Cloud**: <ex.: AWS imposto por contrato corporativo>
- **Banco**: <ex.: Postgres por familiaridade>
- **Razão**: <decisão prévia, não revisada nesta fase>

> Se nenhuma stack pré-decidida, marcar "ADR-0001 livre".

## 7. Restrições de processo

- **Compliance imposta** (LGPD, fiscal): ver [`mercado-regulatorio.md`](./mercado-regulatorio.md).
- **Política do investidor**: <ex.: reporting trimestral, board mensal>
- **Política do cliente piloto**: <ex.: NDA, on-prem opcional, treinamento presencial>

## 8. Não-restrições (o que NÃO limita)

> Confirmar para evitar suposição equivocada de agente IA ou contributor.

- <ex.: "não há restrição de licença open-source — MIT/Apache/BSD ok">
- <ex.: "não há restrição de modelo de IA — pode usar Anthropic, OpenAI, OSS">

## Critério para promover de `draft` para `stable`

- [ ] Orçamento total + mensal preenchidos.
- [ ] Prazo de MVP definido (data, não "alguns meses").
- [ ] Equipe atual nomeada (cargos, não nomes em projeto solo).
- [ ] ≥2 dependências externas mapeadas com plano B.
