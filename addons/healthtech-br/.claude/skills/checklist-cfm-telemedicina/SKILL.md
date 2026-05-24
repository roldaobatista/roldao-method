---
name: checklist-cfm-telemedicina
description: Checklist obrigatorio pra plataforma de telemedicina BR conforme CFM 2.314/2022 + LGPD Art. 11. Use ANTES de subir feature de consulta online, segunda opiniao, teleconsulta urgencia. Cobre 8 pontos nao-negociaveis — sem todos, a plataforma nao e telemedicina valida no Brasil.
owner: healthtech-br
revisado-em: 2026-05-24
status: beta
---

# checklist-cfm-telemedicina

> **Status: BETA** — texto inicial baseado na CFM 2.314/2022. Validar com advogado de saúde antes de usar em produção.

Checklist binário pra plataforma de telemedicina. Cada item é obrigatório — falha em qualquer um = a plataforma NÃO é telemedicina válida no Brasil, mesmo que tecnicamente funcione.

## Os 8 pontos (CFM 2.314/2022 + LGPD)

### 1. Identificação do médico
- [ ] Nome completo visível ao paciente durante a consulta
- [ ] CRM + UF de registro exibidos
- [ ] Foto do médico (não obrigatório por CFM, mas obrigatório pelo usuário pra confiar)
- [ ] Validação prévia do CRM contra base do CFM (CFM-API ou consulta manual)

### 2. Consentimento expresso do paciente
- [ ] Tela explícita ANTES da consulta começar — não pode ser "checkbox escondido nos termos"
- [ ] Texto cita: modalidade (vídeo/áudio/chat), forma de prescrição, gravação ou não, armazenamento, retenção
- [ ] Aceite registrado com data/hora + IP + identificação do paciente
- [ ] Paciente pode revogar consentimento (LGPD-007 + LGPD-009)

### 3. Vínculo médico-paciente
- [ ] Plataforma estabelece vínculo claro (1º atendimento na plataforma = teleconsulta; retorno presencial = continuidade)
- [ ] CFM 2.314 exige que telemedicina respeite a relação contínua — não vale "médico aleatório toda vez" pra paciente crônico

### 4. Gravação (opcional)
- [ ] Se grava: consentimento ESPECÍFICO pra gravação, separado do consentimento da consulta
- [ ] Se grava: tempo de retenção declarado (CFM sugere mesmo prazo do prontuário = 20 anos)
- [ ] Se NÃO grava: paciente pode pedir transcrição/resumo escrito

### 5. Prescrição digital
- [ ] Receita gerada após a consulta tem assinatura ICP-Brasil do médico (A1 ou A3)
- [ ] Medicamento controlado (Portaria 344/98) — assinatura ICP é OBRIGATÓRIA, farmácia não dispensa sem
- [ ] Receita comum — recomendação CFM desde 2020 é ICP, mas alguns estados aceitam sem (verificar UF)
- [ ] QR Code ou link público pra farmácia validar a receita (Memed, Nexodata, plataforma própria)

### 6. Sigilo e proteção (LGPD Art. 11)
- [ ] Conexão criptografada (TLS 1.2+)
- [ ] Vídeo/áudio criptografado em trânsito (não basta TLS do site — o stream em si)
- [ ] Gravação (se houver) criptografada em repouso
- [ ] Acesso ao histórico do paciente: logado e auditado (LGPD-004)
- [ ] Base legal Art. 11 declarada — geralmente "tutela da saúde do titular" + consentimento

### 7. Prontuário e retenção
- [ ] Cada consulta gera entrada no prontuário (CFM 1.821/2007)
- [ ] Assinatura digital ICP do médico no prontuário (sem ICP, não tem valor legal)
- [ ] Retenção 20 anos após última visita do paciente
- [ ] Trilha de auditoria imutável de quem acessou/alterou

### 8. Continuidade do atendimento
- [ ] Médico oferece forma de contato pós-consulta (mensagem, e-mail) por período razoável
- [ ] Encaminhamento presencial se o caso exige
- [ ] Paciente sabe o que fazer se a consulta cair na metade

## Como usar este checklist

Antes de subir a feature pra produção: rode os 8 pontos no ambiente real (não em homologação). Cada `[ ]` que ficar sem marcar é um bloqueador.

## O que este checklist NÃO cobre

- Ética da especialidade (telepsiquiatria, teledermatologia têm normas específicas)
- Conformidade ANVISA (se prescrever produto regulado)
- Relação trabalhista com o médico (CLT, PJ, cooperativa) — fora do escopo
- Cobertura por plano de saúde (TISS/TUSS — ver HEALTH-EXT-004)

## Aderente a

HEALTH-EXT-002, HEALTH-EXT-005, LGPD-001, LGPD-007, LGPD-008 (RIPD obrigatório pra telemedicina), INV-003 (non-goals).

## Referências

- CFM 2.314/2022 — Resolução de telemedicina
- CFM 1.821/2007 — Prontuário eletrônico
- MP 2.200-2/2001 — ICP-Brasil
- Portaria 344/1998 ANVISA — Medicamento controlado
- LGPD Art. 11 — Dado pessoal sensível
