---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Runbook — resposta a incidente LGPD (72h)

> Procedimento operacional pra incidente de segurança que afete dado pessoal. Cumpre **LGPD-006** (notificação ANPD em prazo razoável — entendimento atual: até **72h após ciência**).
>
> **Princípio:** plano de resposta existe **antes** do incidente. Quando ele acontece, ninguém está em condição emocional de improvisar.

---

## T+0 — Detecção (primeiros minutos)

### Quem aciona
- Pessoa que detectou o incidente notifica **imediatamente**:
  - **DPO/Encarregado** (canal interno + telefone)
  - **InfoSec / Tech Lead**
  - **Gestor responsável pelo sistema afetado**

### Não fazer
- ❌ Tentar "consertar e ver no que dá" antes de registrar o incidente.
- ❌ Apagar logs/evidências (são prova legal — preservar).
- ❌ Comunicar publicamente antes de avaliação jurídica.

### Fazer
- ✅ Abrir **registro de incidente** (ticket, doc versionado em `docs/incidentes/INC-AAAA-MM-DD-<slug>.md`).
- ✅ Isolar sistemas afetados se necessário (rede, acesso, leitura).
- ✅ Preservar evidência: snapshot de logs, payloads, configs, banco no momento.

---

## T+0 a T+24h — Investigação

### Quem participa
- DPO (lidera comunicação)
- InfoSec (técnica)
- Tech Lead (sistema afetado)
- Jurídico (se incidente confirmado)

### Perguntas a responder

| # | Pergunta | Resposta documentada em |
|---|---|---|
| 1 | **Quando** o incidente aconteceu? (UTC + horário local) | INC doc |
| 2 | **Como** foi detectado? (alerta, denúncia, log) | INC doc |
| 3 | **Que dados** foram comprometidos? (categorias — CPF, endereço, financeiro, saúde, etc.) | INC doc |
| 4 | **Quantos titulares** afetados? (faixa: 1, 10, 100, 1k, 10k+) | INC doc |
| 5 | **Quem é o atacante**? (interno, externo, acidental) | INC doc |
| 6 | **Foi exfiltração ou só exposição?** (dado saiu ou só ficou acessível?) | INC doc |
| 7 | **Persistência?** (atacante ainda tem acesso?) | INC doc |
| 8 | **Houve criptografia?** (dado vazado em texto puro ou cifrado?) | INC doc |

### Critério de severidade

- **Crítico:** dado sensível (saúde, biometria, financeiro, criança/adolescente) ou >1k titulares ou exfiltração confirmada.
- **Alto:** dado não-sensível >100 titulares OU dado sensível ≤100 titulares.
- **Médio:** dado não-sensível, <100 titulares, exposição interna sem evidência de uso indevido.
- **Baixo:** quase-incidente (configuração errada detectada antes de uso).

**Crítico + Alto → notificação ANPD obrigatória.** Médio/Baixo → avaliação caso a caso.

---

## T+24 a T+72h — Notificação ANPD

### Quem assina
- DPO/Encarregado (responsável formal).

### Como notificar
- Portal da ANPD: https://www.gov.br/anpd/pt-br (verificar URL atual antes — pode mudar).
- Formulário oficial preenchido.
- Templates em `addons/lgpd-compliance/templates/`:
  - `notificacao-anpd.md` — comunicação oficial à autoridade.
  - `notificacao-titulares.md` — comunicação aos titulares afetados.

### Conteúdo mínimo (Resolução CD/ANPD nº 15/2024)

1. **Natureza dos dados** (categorias afetadas).
2. **Titulares afetados** (número aproximado).
3. **Medidas técnicas e de segurança** usadas (antes do incidente).
4. **Riscos** (avaliação de impacto).
5. **Motivo da demora** (se notificação >72h).
6. **Medidas tomadas/planejadas** para reverter/mitigar.

### Skill que ajuda
Use `responder-incidente-anpd` (addon `lgpd-compliance`) para gerar o draft da notificação.

```bash
npx roldao-method add lgpd-compliance   # se ainda não instalou
# então invoque a skill via Claude Code
```

---

## T+24 a T+72h — Notificação aos titulares (paralelo)

### Quando obrigatório
- Risco **alto** ao titular (LGPD Art. 48 §1).
- Casos onde a ANPD determinar.

### Como
- Canal documentado (email cadastrado, push, SMS).
- Linguagem simples (não-jargão). PT-BR.
- Direitos do titular explicitados: acesso, correção, exclusão, portabilidade, revogação, revisão de decisão automatizada (Art. 18).

### Template
`addons/lgpd-compliance/templates/notificacao-titulares.md`.

---

## Pós-incidente (T+72h em diante)

### RCA (Root Cause Analysis)
- Reunião post-mortem **sem culpado** (blameless).
- Documentar: causa imediata + cadeia de eventos + falha de controle.
- Salvar em `docs/incidentes/INC-AAAA-MM-DD-postmortem.md`.

### Mitigações
- Lista priorizada de ações pra evitar reincidência.
- Owner + prazo por ação.
- Issue tracker (US/T-NNN) para cada uma.

### Atualizar
- Política de privacidade (se mudou tratamento).
- Termo de uso (se necessário).
- RIPD (Relatório de Impacto) — se incidente alterou avaliação.
- DPO comunica ANPD sobre medidas tomadas.

### Métricas
- Tempo de detecção (T-detecção - T-incidente).
- Tempo de contenção (T-contido - T-detecção).
- Tempo de notificação (T-notif-ANPD - T-detecção).
- Meta interna: detecção <4h, contenção <8h, notificação <48h.

---

## Treinamento e exercício

- **Tabletop semestral:** simulação com time técnico + DPO + jurídico.
- **Resposta documentada:** cada exercício gera relatório.
- **Atualização do runbook:** após cada incidente real ou exercício.

---

## Referências

- LGPD Art. 48 — Comunicação à ANPD e aos titulares.
- Resolução CD/ANPD nº 15/2024 — comunicado de incidente.
- LGPD-006 (REGRAS-INEGOCIAVEIS.md) — regra interna.
- Skill `responder-incidente-anpd` (addon `lgpd-compliance`).
- Skill `gerar-ripd` (addon `lgpd-compliance`).
- Skill `gerar-canal-dpo` (addon `lgpd-compliance`).

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
