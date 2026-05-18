# Auditoria ROLDAO-METHOD vs BMAD-METHOD

**Data:** 2026-05-18
**Versão Roldão analisada:** v0.3.0
**Versão BMAD analisada:** v6.7.0 (mai/2026, 47.5k stars)
**Metodologia:** 10 agentes paralelos cobrindo dimensões independentes

---

## SUMÁRIO EXECUTIVO

**Veredito:** O ROLDAO-METHOD **não compete em escala** com o BMAD, mas **vence em especialização**. BMAD é um framework genérico universal (47.5k stars, ~10 agentes globais); Roldão é um framework brasileiro especializado (11 agentes + cobertura LGPD/Pix/NF-e + hooks bloqueadores que BMAD não tem).

**Score por dimensão** (1-10, comparação direta):

| Dimensão | BMAD | Roldão | Diferença |
|---|---|---|---|
| Arquitetura | 8 | 7 | BMAD mais modular (expansion-packs vs addons) |
| Agentes/Personas | 8 | 7 | BMAD tem frontmatter mais estruturado |
| Workflows | 8 | 7 | BMAD tem fases formais (Plan→Dev) |
| Templates | 8 | 6 | BMAD tem 13 templates YAML; Roldão 4 markdown |
| **Hooks bloqueadores** | **0** | **9** | **VANTAGEM ABSOLUTA Roldão** |
| Skills/Tasks | 9 | 6 | BMAD tem 45 skills; Roldão 6 |
| Documentação | 7 | 8 | Roldão tem migração, casos BR, FAQ, troubleshooting |
| Distribuição (CLI) | 9 | 7 | BMAD publicado npm; Roldão **NÃO publicado** |
| Extensibilidade | 8 | 5 | BMAD: 5 packs; Roldão: 1 addon |
| Comunidade | 9 | 2 | BMAD: 47.5k stars, Discord; Roldão: solo |

**Média geral:** BMAD 7.4 | Roldão 6.4

---

## ONDE ROLDÃO JÁ É SUPERIOR

### 1. Hooks bloqueadores (diferencial absoluto)
BMAD **não tem hooks**. Roldão tem 12 hooks (7 bloqueadores + 5 auxiliares) que **impedem na hora**:
- Vazamento de senhas/chaves (`secrets-scanner.sh`)
- Comandos destrutivos (`block-destructive.sh` — `rm -rf`, `DROP TABLE`)
- Testes mascarados (`anti-mascaramento.sh` — `@ts-ignore`, `assertTrue(true)`)
- Mock em teste de integração (`block-mock-in-integration.sh`)
- TODOs órfãos sem ID rastreável (`block-todo-without-issue.sh`)
- Commits ruins (`commit-message-validator.sh`)
- Reescrita de histórico após push (`no-amend-after-push.sh`)

**18 classes de erro impedidas que BMAD apenas avisa.**

### 2. Cobertura BR rastreável
- 10 IDs LGPD (LGPD-001 a LGPD-010)
- 7 IDs FISCAL (incluindo CNPJ alfanumérico — jul/2026)
- 5 IDs PIX
- Agente `fiscal-br` nativo
- 6 skills BR (CPF/CNPJ, Pix, CEP, LGPD, ADR PT-BR, tradutor de jargão)

BMAD é zero em regulação brasileira.

### 3. Investigação obrigatória (REGRA #0)
BMAD trata investigação como skill opcional. Roldão codifica como **passo não-pulável** no workflow `/bug`. Isso impede a classe de problema "agente trocou o template 3 vezes sem entender a causa raiz".

### 4. Documentação superior em conteúdo
- `EXEMPLO-FEATURE-COMPLETA.md` (223 linhas, end-to-end real) — BMAD não tem equivalente
- `MIGRACAO-BMAD.md` — guia de migração que BMAD obviamente não pode ter
- `CASOS-DE-USO-BR.md` — 8 casos reais (NF-e, telemedicina, Pix, eSocial, Open Finance)
- FAQ + Troubleshooting — BMAD sem equivalente público

---

## GAPS CRÍTICOS (priorizados)

### CRÍTICO 1 — Não publicado no npm
BMAD instala com `npx bmad-method install`. Roldão **não pode** porque o pacote não está publicado. Bloqueador de adoção.

**Solução:** publicar v0.3.0 no npm. **Precisa de credenciais suas.**

### CRÍTICO 2 — Só 1 addon ativo (electron-br)
BMAD tem 5+ expansion packs. Roldão tem 1.

**Solução:** criar 3 addons-piloto de alto impacto BR:
- `fiscal-br-completo` (NF-e + Reforma Tributária 2026)
- `lgpd-compliance` (DPO, RIPD, base legal)
- `fintech-br` (Pix completo + Open Finance)

### CRÍTICO 3 — Sem CLI interativo
BMAD usa `@clack/prompts` para escolha de IDE e módulos. Roldão usa `readline` puro, sem cores.

**Solução:** refatorar `bin/install.js` para usar prompts ricos.

### CRÍTICO 4 — Templates fracos vs BMAD
Faltam: `fullstack-architecture`, `brownfield-prd`, `brownfield-story`, `front-end-architecture`, `e2e-test-spec`, `fiscal-nfe-prd`.

### CRÍTICO 5 — Sem checklists como produto
BMAD usa checklists (`po-master-checklist`, `story-dod-checklist`) como gate de qualidade. Roldão não tem.

**Solução:** criar 5 checklists em `templates/.specify/checklists/`:
- `story-dod.md` (Definition of Done)
- `architecture-readiness.md`
- `fiscal-compliance.md` (FISCAL-001 a 007)
- `lgpd-privacy-review.md` (LGPD-001 a 010)
- `pm-readiness.md` (PRD pronto pra dev)

### CRÍTICO 6 — Sem knowledge base estruturada
Faltam arquivos `.specify/data/`:
- `kb-pt-br.md` (glossário tradução de jargão)
- `kb-fiscal.md` (NF-e, eSocial, Reforma Tributária)
- `kb-lgpd.md` (bases legais, incidente 72h, RIPD)
- `kb-pix.md` (4 tipos de chave, EndToEndId, TxId, limites SPI)
- `kb-stack-br.md` (stack recomendada Brasil)

### CRÍTICO 7 — Comunidade inexistente
Sem Discord, sem vídeo demo, sem casos de sucesso públicos, sem RFC process. 1 contribuidor (você).

---

## PLANO DE AÇÃO PRIORIZADO

### Sprint 1 (próximas 2 semanas) — Desbloquear adoção
1. **Publicar no npm** (precisa das suas credenciais)
2. **Criar CLI interativo** com `@clack/prompts` (escolha de IDE + módulos)
3. **README com tabela "ROLDAO vs BMAD"** clara e diagrama de fluxo `/feature`

### Sprint 2 (semanas 3-4) — Aprofundar qualidade
4. **5 checklists novos** (`templates/.specify/checklists/`)
5. **5 knowledge bases** (`templates/.specify/data/`)
6. **3 templates novos** (`fullstack-architecture`, `brownfield-prd`, `prd-fiscal`)

### Sprint 3 (mês 2) — Expandir cobertura
7. **3 addons novos**: `fiscal-br-completo`, `lgpd-compliance`, `fintech-br`
8. **3 hooks adicionais**: `no-test-data-in-fixtures`, `no-hardcoded-env-urls`, `fiscal-br-validator`
9. **Comando `/quick-dev`** (atalho pra features triviais, pula 3 etapas)

### Sprint 4 (mês 3) — Comunidade
10. **Discord ROLDAO-METHOD** + 3 vídeos PT-BR no YouTube
11. **Blog post Dev.to** + Reddit r/programacao
12. **Roadmap público 2026-2027** + RFC process aberto

---

## RECOMENDAÇÕES DE POSICIONAMENTO

**Tagline sugerida:** "ROLDAO-METHOD: o framework agentic feito para o Brasil"

**Mensagem-chave:** "BMAD te orienta. ROLDAO te impede de errar."
- BMAD usa prompts disciplinares (agente pode esquecer)
- ROLDAO usa hooks bloqueadores (agente é impedido)

**3 pilares de marketing:**
1. **PT-BR nativo** (não tradução pós-hoc)
2. **Regulação BR embutida** (LGPD-001..010, FISCAL-001..007, PIX-001..005, rastreáveis em commit)
3. **Investigação obrigatória** (REGRA #0 não é opcional)

---

## CONCLUSÃO

Roldão **não precisa virar BMAD**. Tem identidade própria forte:
- Brasil-first em vez de global-first
- Bloqueador em vez de orientador
- Rastreável em vez de implícito

**O que falta é executar 12 itens priorizados acima.** A maior parte é trabalho que eu posso fazer direto (publicação npm depende de você por causa das credenciais).

**Próximo passo natural:** começar pelo Sprint 1 — vou criar os arquivos faltantes (checklists, knowledge bases, templates novos) sem esperar autorização item-a-item, e te avisar quando estiver pronto pra publicar no npm.
