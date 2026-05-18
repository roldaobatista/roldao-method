---
owner: addon
revisado-em: 2026-05-18
status: stable
---

# esocial-completo — Addon ROLDAO-METHOD para eSocial

eSocial é o sistema unificado de obrigações trabalhistas, previdenciárias e fiscais do governo federal. Cada evento tem schema XSD próprio, prazo legal específico, regras de retificação via S-3000, e a empresa pode ser autuada por atraso/erro. Este addon traz:

- **1 agente:** `esocial-arch` — decide arquitetura de integração com eSocial (envio direto vs SaaS, fila, retentativa, retificação).
- **1 hook:** `validate-esocial-prazo` — alerta quando código grava evento de admissão/desligamento sem respeitar prazo legal.
- **2 skills:**
  - `emitir-evento-esocial` — template + checklist por tipo de evento (S-1000 a S-3000).
  - `validar-pis-pasep` — validação de PIS/PASEP/NIS por módulo 11.
- **3 regras novas:** `ESOCIAL-001`, `ESOCIAL-002`, `ESOCIAL-003`.

## Quando usar

- Empresa precisa enviar eventos pra eSocial (todas as empresas no Brasil precisam, mesmo MEI em alguns casos).
- Sistema gerencia folha de pagamento, ponto, ASO, CIPA, treinamento NR.
- Sistema é integrador trabalhista pra contabilidade/escritório.

## Como instalar

```bash
npx roldao-method add esocial-completo
```

Copia `addons/esocial-completo/.claude/` pra `.claude/` do projeto e mescla o hook em `settings.json`.

## Regras

### ESOCIAL-001 — Prazos legais respeitados

Eventos trabalhistas têm prazos rígidos:

| Evento | Prazo |
|---|---|
| S-1000 (informações do empregador) | Antes do primeiro evento operacional |
| S-1005 a S-1099 (tabelas) | Antes do primeiro evento que usa |
| S-2200 (admissão) | **Até o dia imediatamente anterior ao do início da prestação dos serviços** (S-2190 p/ admissão de última hora) |
| S-2206 (alteração contratual) | Até o dia 15 do mês seguinte |
| S-2210 (CAT — acidente) | **Até o primeiro dia útil seguinte ao acidente** (fatal: imediato) |
| S-2230 (afastamento temporário) | Até o dia 15 do mês seguinte (afastamento > 15 dias) |
| S-2240 (condições ambientais — SST) | Até o dia 15 do mês seguinte ao início |
| S-2299 (desligamento) | **Até o 10º dia subsequente ao desligamento** OU no envio do TRCT/recibo, o que ocorrer primeiro |
| S-1200 (remuneração) | Até o dia 15 do mês seguinte |
| S-1210 (pagamentos) | Até o dia 15 do mês seguinte ao pagamento |
| S-1299 (fechamento) | Após enviar S-1200/S-1210 do mês |
| S-3000 (exclusão/retificação) | A qualquer tempo, mas idealmente assim que identificada divergência |

**Multa por atraso:** R$ 500 a R$ 24.000 por evento, conforme Art. 11 Decreto 8.373/2014.

Hook `validate-esocial-prazo` verifica `dataInicio`/`dataDesligamento` vs `dataEnvio` em arquivos de domínio.

### ESOCIAL-002 — Retificação via S-3000 mantém histórico

eSocial **não permite UPDATE** num evento já enviado. Pra corrigir:
1. Gera evento S-3000 (Exclusão) apontando pro original.
2. Envia novo evento corrigido (com mesmos dados de identificação + dados corretos).
3. Mantém trilha de ambos no banco (auditoria + defesa em fiscalização).

Anti-padrão: deletar registro local e enviar novo como se fosse original. Vira inconsistência entre seu banco e a base do eSocial.

### ESOCIAL-003 — Ambiente vem de variável de ambiente

```yaml
ESOCIAL_AMBIENTE: 1  # 1=Produção, 2=Produção Restrita Empresa, 3=Restrita Dados Reais, 4=Homolog
```

Equivalente ao FISCAL-003 (SEFAZ). Nunca hardcoded.

## Cenários cobertos

- **Admissão (S-2200):** com PIS/PASEP, contrato, CBO, dependentes, deficiência se houver.
- **Desligamento (S-2299):** com motivo, projeção de férias, aviso prévio, verba rescisória.
- **Folha (S-1200/S-1210/S-1299):** ciclo mensal com fechamento.
- **CAT (S-2210):** acidente de trabalho com prazo de 1 dia útil (imediato se fatal).
- **Afastamento (S-2230):** > 15 dias gera evento.
- **SST (S-2210/S-2220/S-2240):** acidente, ASO, condições ambientais (NR-15/16).
- **Retificação (S-3000):** sequência exclusão + reenvio.
- **CIPA:** mapeamento de membros eleitos vs designados (depende de S-1005 tabela).
- **NRs aplicáveis por CNAE:** consulta automatizada.

## Stack recomendada

| Linguagem | Lib recomendada |
|---|---|
| Node.js | `node-esocial` ou SaaS (Tagplus, Sage, Domínio) |
| Python | `pyesocial` (limitada) ou SaaS |
| .NET | `EsocialNet` (open-source) |
| Java | `esocial-client` (open-source) |
| Go | sem lib madura — recomenda SaaS |

## Stack recomendada para microempresas

- **Contabilidade já manda?** Mantém. Não duplique. Apenas exporte CSV pro contador no formato dele.
- **Empresa de médio porte?** Integração direta com retentativa + fila + retificação automatizada.
- **Grande?** Provavelmente já tem ERP (Sage, Senior, TOTVS, Oracle) que faz. Addon ajuda quem precisa criar from scratch.

## Templates incluídos

- `templates/eventos-esocial-cobertos.md` — lista completa de eventos com schema, prazo, lib recomendada.

## Non-goals

- Substituir software de folha de pagamento — addon ajuda integração, não calcula folha.
- Certificação eSocial — operação do produto da empresa, não do framework.
- Atualização de schemas XSD — esses vêm do governo, monitorar mudanças é da empresa.

## Documentação

- Manual de Orientação do eSocial: <https://www.gov.br/esocial/pt-br/documentacao-tecnica>
- Knowledge base relacionada: `templates/.specify/data/kb-fiscal.md` (seção eSocial)
