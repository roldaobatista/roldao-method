---
owner: addon
revisado-em: 2026-05-18
status: stable
---

# lgpd-compliance — Addon ROLDAO-METHOD para LGPD operacional

LGPD não é só rodar `checklist-lgpd` antes da feature — é processo contínuo: RIPD pra tratamentos de alto risco, canal de DPO funcional, plano de resposta a incidente em 72h, atendimento a direitos do titular em 15 dias. Este addon traz:

- **1 agente:** `dpo-virtual` — atua como consultor LGPD do projeto.
- **1 command:** `/lgpd-audit` — roda auditoria LGPD ampla na codebase.
- **3 skills:**
  - `gerar-ripd` — Relatório de Impacto à Proteção de Dados (Art. 38).
  - `gerar-canal-dpo` — gera template de página + email + fluxo de resposta.
  - `resposta-titular` — gera resposta a direito exercido (acesso, exclusão, portabilidade).
- **2 regras novas:** `LGPD-EXT-001` (RIPD versionado), `LGPD-EXT-002` (canal DPO ativo).

## Quando usar

- Sistema trata dado pessoal em qualquer volume.
- Empresa precisa designar DPO (>250 colaboradores ou alto risco).
- Cliente exige relatório de impacto (RIPD) pra venda B2B.
- Setor regulado (saúde, financeiro, educação infantil, fintech).

## Como instalar (manual)

Copie `addons/lgpd-compliance/.claude/` pro `.claude/` do seu projeto.

## Regras

### LGPD-EXT-001 — RIPD versionado junto com a feature
Tratamento de alto risco (dado sensível em escala, decisão automatizada, monitoramento sistemático, criança/adolescente) exige RIPD no mesmo branch da feature. Skill `gerar-ripd` gera template.

### LGPD-EXT-002 — Canal de DPO funcional, não decorativo
DPO publicado no site (Art. 41) tem caixa de entrada monitorada e SLA de **15 dias** (Art. 19). Email genérico `legal@` sem dono = descumprimento. Skill `gerar-canal-dpo` estabelece o fluxo.

## O agente DPO virtual

Atua como ponte entre tech e jurídico:
- Lê features novas e identifica obrigações LGPD.
- Sugere base legal (Art. 7 ou 11) com justificativa.
- Aponta quando precisa de RIPD.
- Gera resposta-padrão pra direitos exercidos.
- **Não substitui** advogado/consultoria — orienta.

## Workflow `/lgpd-audit`

1. Mapeia todos os pontos do código que tocam dado pessoal (CPF, email, telefone, etc.).
2. Confere se cada um tem base legal documentada.
3. Confere se há trilha de acesso (LGPD-004).
4. Confere se rota de exclusão (LGPD-002) chega ao banco + backups + terceiros.
5. Confere se logs não vazam dado pessoal em texto puro.
6. Gera relatório markdown com gaps priorizados.

## Cenários cobertos

- Coleta de CPF/email em formulário → base legal + minimização.
- Compartilhamento com terceiro (Sentry, Mixpanel, OpenAI) → DPA.
- Dado de criança/adolescente → consentimento de responsável (Art. 14).
- Decisão automatizada (score, crédito, preço dinâmico) → direito a revisão (Art. 20).
- Vazamento → comunicação à ANPD em 72h + titulares afetados.
- Direito exercido → resposta em 15 dias com template padronizado.

## Templates incluídos

- `templates/ripd-modelo.md` — Relatório de Impacto.
- `templates/politica-privacidade.md` — Política de Privacidade base.
- `templates/dpa-operador.md` — Contrato com operador.
- `templates/resposta-titular/acesso.md` — Resposta a pedido de acesso.
- `templates/resposta-titular/exclusao.md` — Resposta a pedido de exclusão.
- `templates/resposta-titular/portabilidade.md` — Resposta a portabilidade.

## Non-goals

- Substituir advogado/consultoria especializada em proteção de dados.
- Garantir certificação ou aprovação ANPD.
- Tratar de privacidade fora do escopo LGPD (GDPR, CCPA — usar addon dedicado se precisar).

## Referências

- LGPD: <https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm>
- ANPD: <https://www.gov.br/anpd>
- Knowledge base: `templates/.specify/data/kb-lgpd.md`
- Checklist base: `templates/.specify/checklists/lgpd-privacy-review.md`
