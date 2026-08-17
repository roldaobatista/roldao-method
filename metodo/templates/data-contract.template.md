---
template: data-contract.template.md
destino: docs/dominios/<dom>/contratos/<contrato>.md
owner: <produtor-do-contrato>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
proposito: contrato de dado entre produtor e consumidor, com schema, SLA e regras de evolucao
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C4
limite-linhas: 250
---

# Data Contract — <nome-do-contrato>

> **Contrato de dado** = acordo formal entre quem **produz** o dado e quem **consome**. Define schema, garantias e regras de mudanca. Evita que mudanca silenciosa em um lado quebre o outro.

## 1. Identificacao

| Campo | Valor |
|---|---|
| Nome | <nome-do-contrato> |
| Versao | <SemVer — MAJOR.MINOR.PATCH, ex: 1.2.0> |
| Tipo | <evento | tabela | endpoint-api | arquivo> |
| Status | <draft | active | deprecated | retired> |
| Owner produtor | <time/pessoa que gera o dado> |
| Consumidores conhecidos | <lista de consumidores cadastrados — ver §8> |
| Dominio | <dominio-de-negocio — ex: pedidos, faturamento> |
| Criado em | <YYYY-MM-DD> |
| Vigente desde | <YYYY-MM-DD> |

## 2. Proposito de negocio

Em 2-4 linhas, explicar:

- **O que** este dado representa no mundo real.
- **Por que** existe (que decisao/processo depende dele).
- **Como** se diferencia de contratos parecidos.

Exemplo: "Evento `pedido.confirmado` representa o momento em que pagamento + estoque foram confirmados. Diferente de `pedido.criado` (so registro de intencao) e `pedido.entregue` (encerramento)."

## 3. Schema

### 3.1 Campos obrigatorios

| Campo | Tipo | Restricoes | Descricao |
|---|---|---|---|
| `_version` | string | SemVer do contrato (ex: "1.2.0") | versao usada para emitir este payload |
| `_id` | string (UUID v4) | unico, imutavel | identificador do registro/evento |
| `_emitted_at` | string (ISO 8601 UTC) | nao-futuro | quando o produtor emitiu |
| `<campo-negocio-1>` | <tipo> | <restricao> | <descricao> |
| `<campo-negocio-2>` | <tipo> | <restricao> | <descricao> |

### 3.2 Campos opcionais

| Campo | Tipo | Default quando ausente | Descricao |
|---|---|---|---|
| `<campo-opcional-1>` | <tipo> | `null` / <valor> | <descricao> |
| `<campo-opcional-2>` | <tipo> | <valor> | <descricao> |

### 3.3 Restricoes globais

- Encoding: UTF-8.
- Campos `null` explicito **permitido** em opcionais; **proibido** em obrigatorios.
- Tamanho maximo do payload: <ex: 64 KB>.
- Campos desconhecidos pelo consumidor: **ignorar** (forward compat).
- Campos sensiveis (LGPD): listados em §6 com nivel de sensibilidade.

### 3.4 Exemplo de payload

```json
{
  "_version": "1.2.0",
  "_id": "f4a8e0b6-3d2c-4a01-9b8e-1c0d2e3f4a5b",
  "_emitted_at": "2026-05-27T14:30:00Z",
  "<campo-negocio-1>": "<exemplo>",
  "<campo-negocio-2>": 42
}
```

## 4. SLA

| Metrica | Garantia | Como mede |
|---|---|---|
| Volume estimado | <ex: 10k eventos/dia, pico 200/min> | metrica do produtor |
| Latencia p95 (producao → consumo possivel) | <ex: 5 segundos> | dashboard `<link>` |
| Freshness (idade max ao consumir) | <ex: 1 minuto> | timestamp do payload |
| Disponibilidade | <ex: 99.5%/mes> | janela movel |
| Ordem de entrega | <total | por-chave | sem-garantia> | depende do transporte |
| Entrega | <at-least-once | exactly-once | at-most-once> | configurar consumer accordingly |
| Duplicacao esperada | <sim/nao + janela> | idempotencia obrigatoria do lado do consumer se "sim" |

## 5. Evolucao do contrato

### 5.1 Regras SemVer

| Mudanca | Bump | Periodo de deprecacao |
|---|---|---|
| Bug fix em descricao/exemplo sem alterar schema | PATCH | nao se aplica |
| Adicionar campo **opcional** | MINOR | nao se aplica |
| Tornar campo opcional em obrigatorio (apertar regra) | **MAJOR** | <N releases ou 90 dias> |
| Remover campo | **MAJOR** | <N releases ou 90 dias> |
| Renomear campo | **MAJOR** | <N releases ou 90 dias> |
| Mudar tipo de campo | **MAJOR** | <N releases ou 90 dias> |
| Mudar significado semantico de campo | **MAJOR** | <N releases ou 90 dias> |

**Backward compat** obrigatoria em MINOR e PATCH: payload v1.2.0 deve ser aceito por consumer v1.1.0.

### 5.2 Processo de breaking change

1. Anuncio formal no canal `<canal-de-contratos>` com >= <N releases> de antecedencia.
2. Versao MAJOR nova publicada **em paralelo** com a antiga.
3. Produtor emite em **ambas** as versoes durante o periodo de deprecacao.
4. Consumidores migram um a um, sinalizando no registro de consumidores.
5. Versao antiga retirada apos: todos consumidores migrados **e** prazo cumprido.
6. Registro de retirada na secao 9 com data efetiva.

## 6. Dados pessoais (LGPD)

| Campo | Categoria | Base legal | Vinculo |
|---|---|---|---|
| <campo-com-dado-pessoal> | <comum/sensivel — Art. 5> | <Art. 7, X> | linha N do `ropa.md` |

Campos **sem** dado pessoal: explicitar "nenhum dado pessoal" se for o caso, para auditoria.

Retencao: definida em `docs/conformidade/lgpd/retencao-dados.md`. Categoria aqui aponta para qual linha de retencao se aplica.

## 7. Dead-letter / erro (so eventos)

| Situacao | Acao do consumer | Acao do produtor |
|---|---|---|
| Payload mal-formado (nao decoda) | enviar para DLQ `<nome-da-dlq>` | alerta imediato + investigacao |
| Schema invalido (campo obrigatorio ausente) | DLQ + log | alerta + correcao |
| Versao do payload nao suportada (MAJOR fora) | DLQ + alerta | confirmar migracao |
| Erro transiente no consumer | retry com backoff exponencial (max <N>) | n/a |
| Falha apos N retries | DLQ + ticket | n/a |

DLQ tem retencao propria de <X dias>. Apos o prazo, eventos sao descartados com registro.

## 8. Registro de consumidores

Quem consome este contrato (auto-cadastro via PR neste arquivo):

| Consumidor | Versao consumida | Owner | Contato | Cadastrado em |
|---|---|---|---|---|
| <servico/time-1> | <ex: ^1.0.0> | <time> | <contato> | <YYYY-MM-DD> |
| <servico/time-2> | <ex: ^1.0.0> | <time> | <contato> | <YYYY-MM-DD> |

Produtor **avisa** todos os consumidores antes de mudanca MAJOR. Consumidor nao cadastrado = produtor nao se responsabiliza.

## 9. Validacao

- **Schema formal**: arquivo de schema em `<path/ao/schema.json|.avsc|.proto>`, autoritativo sobre esta tabela.
- **Teste em CI**: produtor roda teste que emite payload de exemplo e valida contra o schema, a cada PR.
- **Teste de consumer**: cada consumer mantem teste que decoda fixtures do contrato e quebra se o contrato mudar em forma incompativel.
- **Contract test cross-team**: roda em pipeline compartilhado, falha bloqueia merge de mudancas que quebrem compat.

## 10. Versionamento de payload

Todo payload inclui `_version` (campo obrigatorio em §3.1). Regras:

- Produtor **incrementa** ao subir versao do contrato.
- Consumer **inspeciona** `_version` e ajusta logica se necessario.
- MAJOR diferente do esperado: consumer envia ao DLQ (§7).
- MINOR maior que o esperado: consumer processa normalmente, ignorando campos novos.

## 11. Historico

| Versao | Data | Mudanca | Autor |
|---|---|---|---|
| <1.0.0> | <YYYY-MM-DD> | versao inicial | <autor> |

## 12. Vinculacao com

- `spec.template.md` — quando este contrato vem de uma feature, referencia a spec que o originou.
- ADRs em `docs/decisoes/` — decisoes sobre formato (JSON vs Avro), particionamento, idempotencia.
- `ropa.md` — operacoes LGPD que tocam dados pessoais deste contrato.
- `retencao-dados.md` — prazos de guarda alinhados.
- `INV-DOM-CONTRACT-*` — invariantes que validam emissao e consumo.
- Schema formal em `<path/ao/schema>` — fonte de verdade tecnica.
- Auditor `auditor-contratos` — valida consistencia.
