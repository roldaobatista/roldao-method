---
owner: <DpoDoProjeto>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 180
proposito: política de retenção e descarte de dados pessoais — prazos, base legal, processo de expurgo, definição de vigência e soft vs hard delete
---

<!--
template: retencao-dados.template.md
uso: copiar para docs/conformidade/lgpd/retencao-dados.md.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C6 + LGPD Art. 15, 16, 18.
-->

# Política de Retenção e Descarte de Dados — <NomeDoProjeto>

> **Documento CONDICIONAL.** Só se aplica a projeto regulado ou que trate dado pessoal. Se o produto não guarda dado de pessoas, **não preencha** — registre o motivo em `docs/nao-aplica.md`.

> **Retenção** = por quanto tempo guardamos cada tipo de dado.
> **Descarte (expurgo)** = como apagamos quando o prazo acaba ou quando o titular pede.
>
> Atende LGPD Art. 15 (término do tratamento), Art. 16 (conservação após término, com exceções legais) e Art. 18, VI (direito do titular pedir eliminação).

## 1. Categorias de dado

| Categoria | Exemplos | Sensibilidade |
|---|---|---|
| Dado pessoal comum | nome, e-mail, telefone, endereço, CPF | média |
| Dado pessoal sensível (Art. 5, II) | saúde, biometria, orientação sexual, dado de criança | alta |
| Dado transacional | NF, pagamento, contrato, fatura | média (obrigação fiscal) |
| Logs de aplicação | trilha de ações do usuário, IPs, user-agent | baixa-média |
| Telemetria / métricas | tempo de resposta, contagem de uso (sem identificar pessoa) | baixa |

Exemplo preenchido: tabela `clientes` contém nome, CPF, e-mail, telefone → categoria "dado pessoal comum".

## 2. Prazo de retenção por categoria

| Categoria | Prazo | Justificativa | Base legal |
|---|---|---|---|
| Cadastro de cliente (comum) | enquanto vigente contrato + 5 anos | possível disputa civil (Art. 206, §5 CC) | execução de contrato + obrigação legal |
| Dado de pagamento / fiscal | 5 anos após exercício | obrigação fiscal (Decreto 70.235/72, NF-e) | obrigação legal |
| Dado de saúde / sensível | enquanto necessário + 1 ano após término | minimização | consentimento ou tutela da saúde |
| Logs de aplicação com identificação | 6 meses | investigação de incidente, fraude | legítimo interesse |
| Logs de segurança / acesso | 12 meses | resposta a incidente, auditoria | legítimo interesse + Marco Civil |
| Telemetria anonimizada | indefinido | não é mais dado pessoal após anonimizar | n/a |
| Backup contendo dados pessoais | conforme política de backup (ver `backup.md`) | retenção alinhada | execução de contrato |

> Sempre que dois prazos competirem (ex: titular pede eliminação mas dado tem obrigação fiscal de 5 anos), prevalece o prazo legal. Justificar formalmente ao titular (Art. 18, §4).

### 2.1 Definição operacional de "vigência" e "término"

Para evitar ambiguidade no contador dos prazos da tabela acima:

| Termo | Definição operacional |
|---|---|
| **Contrato vigente** | Contrato cuja data de início ≤ hoje **E** (data de término futura **OU** data de cancelamento futura **OU** sem data de término definida e cliente ativo nos últimos 12 meses). |
| **Término do contrato** | Marco temporal a partir do qual o prazo de retenção começa a contar. Vale o **mais cedo** entre: (a) cancelamento formal pelo cliente, (b) inadimplência > 90 dias com perda de acesso, (c) data de término contratual sem renovação, (d) inatividade total > 24 meses (presunção de abandono). |
| **Soft-delete** | Marca registro como inativo (`deleted_at IS NOT NULL`), mantém linha no banco e nos backups. Permite arrependimento; **não** atende ao Art. 18, VI do titular sozinho. |
| **Hard-delete** | Remove fisicamente a linha do banco principal **e** das réplicas operacionais. Backups antigos seguem o ciclo de vida do bucket — **soft-delete + lifecycle do backup** é a forma de chegar a apagamento completo respeitando obrigação fiscal. |
| **Pedido do titular (Art. 18, VI)** | Dispara hard-delete imediato em todos os sistemas onde a exceção legal (§5) não se aplica. Onde se aplica, fica em retenção legal com flag `legal_hold = true` e expurgo automático ao fim do prazo. |

## 3. Processo de expurgo

| Tipo | Como acontece | Frequência |
|---|---|---|
| Logs de aplicação | cron automático (`cron-expurgo-logs`) | diário |
| Cadastros vencidos | job mensal `job-expurgo-cadastros` | mensal |
| Backups vencidos | lifecycle policy do bucket (S3 / equivalente) | automático |
| Pedido de titular (Art. 18, VI) | trigger manual via runbook | sob demanda, prazo de 15 dias |
| Conta cancelada pelo cliente | hard-delete após 30 dias de "soft-delete" | trigger por evento |

Soft-delete = marcar como inativo mas manter os dados (permite arrependimento). Hard-delete = apagar de verdade.

## 4. Auditoria de expurgo

Cada operação de expurgo gera linha em `audit_expurgo`:

| Campo | Conteúdo |
|---|---|
| timestamp | quando rodou |
| categoria | tipo de dado expurgado |
| volume | quantos registros |
| critério | regra que disparou o expurgo |
| executor | usuário / cron / sistema |
| referência | id do ticket / pedido do titular, se aplicável |

Logs de auditoria são **imutáveis** (somente append) e têm retenção própria de 5 anos.

## 5. Exceções (quando NÃO podemos apagar)

Mesmo com pedido do titular ou prazo vencido, NÃO apagamos se houver:

- **Obrigação fiscal** (5 anos para NF-e, escrituração contábil — Lei 8.846/94).
- **Obrigação regulatória setorial** (ex: setor de saúde tem prazos específicos do CFM).
- **Processo judicial em curso** envolvendo aquele dado (preservar evidência).
- **Investigação em curso** (fraude, lavagem, etc) — Art. 16, II.
- **Estudo por órgão de pesquisa** anonimizado (Art. 16, III).

Em caso de exceção aplicada, comunicar ao titular em até 15 dias, citando o fundamento legal (Art. 18, §5 + §6).

## 6. Direito de eliminação (Art. 18, VI)

Titular pode pedir que seus dados sejam apagados quando:
- Tratamento for desnecessário ou excessivo.
- Tratamento for ilícito.
- Consentimento foi a base legal E ele está sendo revogado.

Processo interno:
1. **Recebimento:** canal `<lgpd@exemplo.com>` ou formulário em `<site>/lgpd`.
2. **Identificação:** confirmar identidade do solicitante (CPF + e-mail cadastrado, ou outro meio).
3. **Análise:** verificar se há exceção aplicável (§5).
4. **Execução:** rodar runbook `docs/operacao/runbooks/atender-pedido-eliminacao.md`.
5. **Confirmação ao titular:** e-mail formal em até 15 dias informando o que foi apagado, o que ficou retido (com fundamento), e próximos passos.
6. **Registro:** linha em `audit_pedidos_titular`.

## 7. Anonimização vs eliminação

| Técnica | O que faz | Quando usar |
|---|---|---|
| **Eliminação** (hard-delete) | apaga registro do banco | titular pediu E não há exceção; ou prazo legal venceu |
| **Anonimização** (Art. 12) | remove tudo que identifica a pessoa, mantém dado agregado | precisamos do dado para estatística/produto mas não precisamos saber DE QUEM |
| **Pseudonimização** | substitui identificadores por chave (reversível com a chave) | segurança interna, NÃO substitui anonimização para fins de LGPD |

Anonimização bem feita tira o dado do escopo da LGPD (Art. 12). Pseudonimização **não**.

## 8. Responsáveis

| Papel | Quem | O que faz |
|---|---|---|
| DPO (Encarregado) | <nome-DPO> | aprova mudanças, atende ANPD e titular, revisão anual |
| Dono do dado (data owner) | <varia-por-tabela> | define se o dado dele tem exceção aplicável |
| Auditor interno | <nome-auditor> | confere trimestralmente se os jobs de expurgo rodaram e se os pedidos foram atendidos no prazo |

## 9. Histórico de revisões

| Data | Revisor | Mudança |
|---|---|---|
| <YYYY-MM-DD> | <nome> | criação inicial |

## 10. Checklist de promoção draft → stable

- [ ] Confirmado que o projeto trata dado pessoal (senão, não usar — registrar em `docs/nao-aplica.md`).
- [ ] **Toda categoria de dado** que o sistema guarda tem prazo de retenção definido (seção 2).
- [ ] Prazos conferidos contra os prazos legais setoriais em `docs/descoberta/mercado-regulatorio.md`.
- [ ] Cada prazo aponta base legal e justificativa (seção 2).
- [ ] Processo de expurgo (seção 3) tem responsável e gatilho para cada categoria.
- [ ] Exceções legais ao apagamento (seção 5) mapeadas para o setor do projeto.
- [ ] Canal e prazo do pedido de eliminação do titular (seção 6) funcionam ponta-a-ponta.
- [ ] Prazos batem com a coluna "Prazo de retenção" do ROPA (`docs/conformidade/lgpd/ropa.md`).
- [ ] Frontmatter `revisado-em` atualizado; `status: stable`.
