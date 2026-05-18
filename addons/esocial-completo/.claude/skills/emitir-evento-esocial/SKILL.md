---
name: emitir-evento-esocial
description: Guia de implementação para emissão de evento eSocial — escolha do schema, prazo legal, fila + retentativa, validação local antes do envio, retificação via S-3000. Use ao implementar integração eSocial pela primeira vez OU ao auditar integração existente.
owner: esocial-completo
revisado-em: 2026-05-18
status: stable
---

# emitir-evento-esocial

Skill que orienta implementação de cada tipo de evento eSocial com checklist específico.

## Quando usar

- Antes de implementar evento eSocial novo.
- Em revisão de PR que toca eSocial.
- Em design de fila/retentativa.

## Tipos de evento cobertos

### S-1000 — Informações do empregador

**Quando:** antes do primeiro evento operacional.
**Schema:** S-1000.xsd
**Conteúdo:** CNPJ, razão social, classificação tributária, indicativo de cooperativa, dados do contato técnico.
**Prazo:** anterior ao primeiro evento.
**Único?** Sim, 1 por empresa. Alteração via novo S-1000.

### S-1005 a S-1099 — Tabelas (estabelecimentos, lotações, etc)

**Quando:** antes de qualquer evento que referencia.
**Prazo:** anterior ao uso.
**Tipicamente:** cadastrar 1x na implantação.

### S-2200 — Admissão de trabalhador

**Quando:** novo colaborador.
**Conteúdo:** PIS/PASEP (validar com `validar-pis-pasep`), CPF, dados pessoais, contrato, CBO, dependentes, deficiência, CTPS.
**Prazo:** **até o dia imediatamente anterior ao do início da prestação dos serviços** (MOS, leiaute S-1.3). Para contratação de última hora (admissão no mesmo dia), use o **S-2190 (Admissão Preliminar)** antes do início e complete com o S-2200 depois.
**Atenção:** atraso vira multa (R$ 500-24k).

### S-2206 — Alteração contratual

**Quando:** mudança de cargo, salário, jornada.
**Prazo:** dia 15 do mês seguinte.

### S-2210 — CAT (Comunicação de Acidente)

**Quando:** acidente de trabalho.
**Prazo:** **1 dia útil** (imediato se fatal).
**Atenção:** atraso é o mais multado.

### S-2230 — Afastamento temporário

**Quando:** afastamento > 15 dias (atestado, INSS, licença maternidade, etc).
**Prazo:** dia 15 do mês seguinte ao início.

### S-2240 — Condições ambientais (SST)

**Quando:** novo agente nocivo (NR-15/16), mudança de ambiente.
**Prazo:** dia 15 do mês seguinte.

### S-2299 — Desligamento

**Quando:** desligamento.
**Conteúdo:** motivo, projeção de férias, aviso prévio, verba rescisória.
**Prazo:** **até o 10º dia subsequente** OU no envio do TRCT/recibo, o que ocorrer primeiro.

### S-1200 — Remuneração (folha)

**Quando:** mensal.
**Prazo:** dia 15 do mês seguinte.

### S-1210 — Pagamentos

**Quando:** após pagar (folha, férias, 13º).
**Prazo:** dia 15 do mês seguinte ao pagamento.

### S-1299 — Fechamento

**Quando:** após enviar S-1200 e S-1210 do mês.
**Sem fechamento, mês não é considerado processado.**

### S-3000 — Exclusão/Retificação

**Quando:** identificar erro em evento já enviado.
**Como:** referencia o evento original; retificar = exclusão + reenvio.

## Checklist por evento (genérico)

- [ ] Schema XSD da versão atual do eSocial validado.
- [ ] Validações locais ANTES do envio (PIS/PASEP, CPF, datas, CBO).
- [ ] Idempotência por chave (CPF+data+tipo de evento).
- [ ] Fila com retentativa exponencial.
- [ ] Persistir protocolo + status + tentativas.
- [ ] Monitorar prazo legal (alerta T-2 dias do prazo).
- [ ] Trilha de auditoria.
- [ ] Plano de retificação documentado.
- [ ] Ambiente vem de env (ESOCIAL-003).

## Arquitetura recomendada (resumo)

```
[Sistema do usuário]
        ↓
[Fila (BullMQ/Sidekiq/Celery)]
        ↓
[Validador local: XSD + DV PIS]
        ↓
[Webservice eSocial — env configurável]
        ↓
[Banco: protocolo + status + tentativas]
        ↓
[Notificação ao sistema do usuário]
```

## Anti-padrões

| Errado | Por quê | Certo |
|---|---|---|
| Envio síncrono | Webservice é lento | Fila + retentativa |
| UPDATE pra corrigir | eSocial não permite | S-3000 exclusão + reenvio |
| `tpAmb = 1` hardcoded | Vai pra produção em dev | Variável de ambiente |
| Sem monitoramento de prazo | Vira multa | Alerta T-2 dias |
| Reusa CPF como chave de idempotência | Mesmo CPF pode ter eventos diferentes | CPF + data + tipo |

## Integração com outros addons

- `fiscal-br-completo`: empresa que emite NF-e geralmente também tem folha → casa bem.
- `lgpd-compliance`: PIS, CPF, dependentes são dados pessoais — RIPD pode ser necessário em escala.

## Referências

- Manual de Orientação do eSocial: <https://www.gov.br/esocial/pt-br/documentacao-tecnica>
- Decreto 8.373/2014 (multas)
- Skill complementar: `validar-pis-pasep`
- KB: `templates/.specify/data/kb-fiscal.md` (seção eSocial)
