---
tipo: adr-contingencia-fiscal
id: ADR-CONTINGENCIA-FISCAL
versao: 1
status: stable
owner: tech-lead
revisado-em: 2026-05-24
---

# Template — ADR de contingência fiscal (FISCAL-004)

> Copie pra `docs/decisions/ADR-NNN-contingencia-<dominio>.md` e preencha. Toda feature de emissão fiscal (NF-e, NFC-e, NFS-e, CT-e, MDF-e) precisa de ADR de contingência **antes** de subir pra produção — SEFAZ cai e operação não pode parar.
>
> Codifica FISCAL-004 (contingência prevista) + FISCAL-003 (ambiente de homologação).

---

# ADR-NNN — Contingência fiscal de `<feature/módulo>`

## Contexto

`<descrever o cenário: qual módulo emite o quê, em qual UF, qual SEFAZ atende, qual o impacto de operação se SEFAZ cair X minutos>`

Histórico recente de indisponibilidade SEFAZ (consultar [Painel de Disponibilidade SEFAZ](http://www.nfe.fazenda.gov.br/portal/disponibilidade.aspx)):
- `<UF>: <data> — X horas off`
- ...

## Decisão

**Modo de contingência primário escolhido:** _(marcar 1)_

- [ ] **SVC-AN** (Sefaz Virtual de Contingência — Ambiente Nacional) — recomendado pra UF que tem SVC-AN como alternativa oficial.
- [ ] **SVC-RS** (Sefaz Virtual de Contingência — Rio Grande do Sul) — pra UFs cuja contingência oficial é SVC-RS.
- [ ] **EPEC** (Evento Prévio de Emissão em Contingência) — só transmite o resumo da NF-e; XML completo enviado depois. Não permite venda imediata pra todas as UF.
- [ ] **FS-DA** (Formulário de Segurança — Documento Auxiliar) — emissão em papel pré-impresso com numeração própria. Último recurso.

**Trigger automático:** após `<N>` segundos de timeout consecutivo do webservice principal, alternar pra contingência.

**Trigger manual:** botão "Emitir em contingência" no operador, com motivo registrado.

## Alternativas consideradas

1. **`<modo>`** — descartado por `<motivo>`.
2. **`<modo>`** — descartado por `<motivo>`.

## Consequências

**Positivas:**
- Operação não para em queda do SEFAZ principal.
- `<outras>`

**Negativas:**
- Custo de manter 2 fluxos de emissão.
- Conciliação posterior dos documentos emitidos em contingência (re-transmissão quando SEFAZ volta).
- `<outras>`

## Plano operacional

- [ ] **Monitoramento ativo do SEFAZ** — health check a cada `<N>` segundos, registra latência e disponibilidade.
- [ ] **Re-transmissão automática** — quando SEFAZ volta, XMLs gerados em contingência são reenviados em background dentro do prazo legal (varia por modo: SVC e EPEC têm prazo de 168h; FS-DA tem 168h também, mas autorização posterior depende de envio do XML).
- [ ] **Alerta operacional** — quando entra em contingência, notifica operador + responsável fiscal por canal definido (e-mail/Slack/SMS).
- [ ] **Trilha auditável** (LGPD-004 + FISCAL-001) — todo XML gerado em contingência é registrado com flag `contingencia=true`, motivo, timestamp, modo usado.
- [ ] **Conciliação de numeração** — série de contingência separada (geralmente série 900-999) pra não conflitar com série de produção normal.
- [ ] **Teste trimestral** — exercício de contingência em ambiente de homologação SEFAZ 1x por trimestre. Documentar resultado.

## Ambientes

- [ ] Implementado em **homologação SEFAZ** (FISCAL-003) — `SEFAZ_AMBIENTE=2`.
- [ ] Testado o fluxo "principal cai → contingência ativa → SEFAZ volta → re-transmissão" em homologação.
- [ ] Variável `SEFAZ_BASE_URL` separada por ambiente (SEC-005 / PIX-005 análogo).
- [ ] Variável `SEFAZ_CONTINGENCIA_URL` distinta da principal.

## Não escopo (non-goals — INV-003)

- `<o que esta feature NÃO cobre, ex: "não cobre operação interestadual com SVC de outra UF">`.
- `<...>`

## Verificação trimestral

- **Data do próximo teste:** `<AAAA-MM-DD>`
- **Responsável:** `<nome/papel>`
- **Critério de sucesso:** emitir 3 NF-e em contingência, conciliar quando SEFAZ "voltar" no ambiente de teste, sem perda nem duplicação.

## Regras envolvidas

FISCAL-004 (contingência prevista), FISCAL-003 (homologação obrigatória), FISCAL-001 (XML imutável após emissão), SEC-005 (URLs via env).

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
