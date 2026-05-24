---
owner: framework
revisado-em: 2026-05-24
status: draft
---

# healthtech-br (addon)

> **DRAFT — v0.1.0.** Esqueleto inicial criado em 2026-05-24 a partir da auditoria 10-agentes. Não use em produção com dado real de paciente sem antes validar com advogado de saúde/LGPD.

Regras e ferramentas pra healthtech brasileira: ANS, CFM, TISS/TUSS, LGPD Art. 11 (dado sensível), retenção de prontuário, e-prescrição.

## Para quem é

Time desenvolvendo:
- Prontuário eletrônico (PEP) ou sistema de gestão clínica
- Plataforma de telemedicina (consulta online, segunda opinião)
- Agenda médica com integração de operadora de saúde
- Aplicativo de prescrição digital
- Marketplace de profissionais de saúde
- Aplicativo de paciente (carteira de exames, histórico)

## O que entrega

### Agente
- `healthtech-arch` — especialista em regulamentação BR de saúde, RN 305, CFM 2.314, TISS/TUSS, LGPD Art. 11. Use ao desenhar feature nova que toca dado de saúde.

### Skills
- `checklist-cfm-telemedicina` — checklist obrigatório pra plataforma de telemedicina (consentimento, identificação, assinatura, gravação)
- `validar-cns-cartao-sus` — valida CNS (Cartão Nacional de Saúde, 15 dígitos com módulo 11)

### Regras (6)
HEALTH-EXT-001 a HEALTH-EXT-006 — ver `addon.yaml`.

## Como instalar

```bash
npx roldao-method add healthtech-br
```

## Como usar

Após instalar, o agente `healthtech-arch` fica disponível e as 2 skills aparecem no contexto do agente.

Em PRD/ADR de feature de saúde, citar regra: `aderente a HEALTH-EXT-001, LGPD-008`.

## Aviso legal

Este addon é **orientação automatizada**, não substitui:
- Consultoria jurídica especializada em saúde
- Conformidade ANVISA (medicamento)
- Conformidade CFM (ética médica)
- Validação ANS (regulamentação suplementar atual)

Use como guard-rail, não como certificação.

## Status atual

| Item | Status |
|---|---|
| Esqueleto do addon | DRAFT |
| Regras HEALTH-EXT-001..006 documentadas | DRAFT (texto inicial) |
| Skill `checklist-cfm-telemedicina` | STUB |
| Skill `validar-cns-cartao-sus` | STUB |
| Agente `healthtech-arch` | STUB |
| Validação por advogado | PENDENTE |
| Issue de evolução | a criar |

## Roadmap (não decidido — depende de adoção real)

- v0.2: skill `validar-cns-cartao-sus` funcional (com algoritmo módulo 11)
- v0.3: skill `gerar-receita-icp-brasil` (template de prescrição com placeholder de assinatura)
- v0.4: agente `healthtech-arch` com tradeoffs concretos (PEP próprio vs SaaS, FHIR vs ABRASF)
- v1.0: validação por advogado + 3 implantações reais

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
