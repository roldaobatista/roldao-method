---
tipo: prd
id: PRD-002
versao: 1
status: draft
owner: Roldão (decisão estratégica)
revisado-em: 2026-05-23
---

# PRD-002 — Modelo de sustentabilidade do ROLDAO-METHOD

> **Pergunta a decidir:** como o ROLDAO sobrevive 5+ anos sem queimar o mantenedor solo e sem virar projeto abandonado? Quais combinações de open core / consultoria / sponsors / fundação fazem sentido pro contexto BR?

---

## 1. Problema

ROLDAO-METHOD hoje (v0.20.0):
- 15 agentes + 26 hooks bloqueadores + 29 skills + 6 addons + 24 workflows + 12 templates de spec.
- ~4.500 linhas de código + ~12.000 linhas de doc PT-BR.
- MIT puro, 1 mantenedor (Roldão), zero receita declarada, zero sponsors.

**Risco estrutural:**
- 90% dos frameworks BR open-source viram zumbi em 18 meses. Padrão: mantenedor solo + sem modelo = abandono.
- Escopo só cresce (Reforma Tributária 2026-2033 vai exigir +N skills/atualizações por anos).
- Sem incentivo financeiro nem estrutura de governança, qualquer ausência longa (saúde, vida pessoal) congela tudo.
- Empresas que adotam framework abandonado **culpam o framework**, não a falta de modelo — danifica reputação retroativa.

**Evidência:**
- Histórico BR: BoltDB, Reactive (BR), Brigadier — todos morreram em 1-2 anos pós lançamento sem modelo.
- Internacional: spec-kit (Anthropic) tem time interno; cursor.rules é de empresa SaaS; BMAD-Code é solo mas faz consultoria. Solo + sem receita = ~6 meses até estagnação.
- Stone, Nubank, Totvs, Cobli, iFood têm times BR de centenas de devs e gastam ~$$$ em produtividade. Mercado existe.

---

## 2. Personas

| Persona | Quem é | O que quer | Onde sofre hoje |
|---|---|---|---|
| **Roldão (mantenedor)** | Solo, idealizador. | Continuar mantendo sem queimar. | Sem receita, dependente de motivação intrínseca infinita. |
| **PME usuária** | Empresa de 10-50 pessoas usando ROLDAO em produto fiscal/Pix. | Garantia de continuidade — não quer reescrever em 2 anos. | Sem contrato/suporte formal, dependem de "esperança". |
| **Empresa média (50-500 devs)** | Cobli, Magalu, Nubank, Stone. | Produtividade BR + compliance LGPD/fiscal embutido. | Adotam frameworks gringos e mantêm fork interno. Pagariam por solução BR pronta. |
| **Consultoria** | Squad de 3-15 que atende clientes finais. | Vender entrega rápida + auditoria. | Reinventam framework próprio interno por contrato. |

---

## 3. Hipótese de solução (4 modelos a comparar — não mutuamente exclusivos)

### Modelo A — Open Core

Core MIT continua aberto: 15 agentes, 26 hooks, 13 skills BR core, 24 workflows, templates. **Addons verticais avançados vão pra pago**, com licença comercial:

- `fiscal-br-completo` (NF-e 55/NFC-e/SAT, certificado A1/A3, contingência, Reforma Tributária paralela 2026-2033) → pago.
- `esocial-completo` (S-1000 a S-3000, CIPA, NRs, retificação) → pago.
- `electron-br` (multi-tenant SQLite seguro, balança/impressora, atualização OTA) → pago.
- `lgpd-compliance` (DPO virtual, RIPD, runbook ANPD 72h) → pago.

**Preço sugestivo:** R$ 297-997/mês por CNPJ usuário (escala por porte). Inclui suporte + atualizações.

**Pró:**
- Receita recorrente direta.
- Quem precisa do addon (PME fiscal/Pix) tem incentivo de pagar — substitui contratar dev sênior.
- Modelo conhecido (GitLab, Sentry, Posthog).

**Contra:**
- Comunidade pode achar "framework BR fechou".
- Suporte a clientes pagos consome tempo do mantenedor.
- Precisa CNPJ + emitir NF-e + figurar como vendor (CRM, financeiro, jurídico).

### Modelo B — Consultoria/treinamento ancorada

ROLDAO 100% MIT permanece. Roldão (e parceiros) vendem:
- **Treinamento corporativo** (1-2 dias, R$ 5-15k por turma): "Como adotar agentic com guard-rails — caso BR".
- **Consultoria de implementação** (R$ 200-400/h ou pacote 40h): "Trazemos o ROLDAO no seu repo, integramos com SEFAZ/Bacen sandbox, deixamos seu time autônomo".
- **Auditoria** (R$ 15-50k por engajamento): "Rodamos `/auditoria-reversa` no seu legado + plano de remediação".

**Pró:**
- Receita por hora ou pacote, sem CRM de SaaS.
- Casa com a ferramenta `/auditoria-reversa` adicionada na v0.20.
- Mercado BR aceita bem consultoria pontual.

**Contra:**
- Receita não escala (vende horas).
- Mantenedor vira consultor solo — pouco tempo pra evoluir framework.
- Requer marca/marketing pra fechar contrato (LinkedIn, eventos).

### Modelo C — GitHub Sponsors + patrocinadores BR

Aceitar sponsors via GitHub + abordar empresas BR diretamente:
- GitHub Sponsors: R$ 50-500/mês por sponsor (devs individuais + empresas micro).
- Patrocínio corporativo: R$ 5-50k/ano por empresa, com logo + agradecimento + 1 sessão de roadmap (Stone, Nubank, Totvs, Magalu, etc).

**Pró:**
- Setup rápido (formulário GitHub).
- Não muda nada na arquitetura (continua MIT puro).
- Patrocinadores corporativos brasileiros existem e patrocinam OSS (ex: Magalu patrocinou Spree, Buf, Vue).

**Contra:**
- Receita não previsível.
- Requer marketing constante (Roldão na frente).
- Sozinho não sustenta — combina melhor com A ou B.

### Modelo D — Fundação/governança compartilhada

Convidar 3-5 empresas BR que adotaram pra co-governar. Pode ser:
- **Software Freedom Conservancy BR** (estrutura jurídica leve).
- **Comitê técnico** com Roldão como BDFL + 4 reps de empresas usuárias.
- **Acordo de patrocínio** (R$ 20-50k/ano por membro).

**Pró:**
- Sustentabilidade institucional — não morre se Roldão sair.
- Membros corporativos têm "skin in the game", influenciam roadmap.
- Atrai outras empresas BR (efeito rede).

**Contra:**
- Setup jurídico complexo (1-3 meses).
- Decisão coletiva pode ser lenta — perde agilidade.
- Só faz sentido se atingir tração mínima (~20 empresas BR usando em produção). Hoje: zero confirmadas.

---

## 4. User stories candidatas (depende do modelo)

### Se A (Open Core):
- **US-001** — Como usuário PME, quero comprar licença comercial via cartão direto no GitHub release.
- **US-002** — Como mantenedor, quero CLI que valide a licença na hora do `add <addon-pago>`.
- **US-003** — Como dono PME, quero suporte prioritário (SLA 48h) durante a contratação.

### Se B (Consultoria):
- **US-001** — Como prospect, quero página `/consultoria` com pacotes (treinamento, implementação, auditoria) e formulário.
- **US-002** — Como cliente, quero relatório do `/auditoria-reversa` formatado como entregável vendável (PDF com logo).

### Se C (Sponsors):
- **US-001** — Como mantenedor, quero `.github/FUNDING.yml` configurado e tier de R$ 50/100/500/2000.
- **US-002** — Como sponsor corporativo, quero meu logo no README + página `/sponsors`.

### Se D (Fundação):
- **US-001** — Como empresa membro, quero participar de chamada trimestral de roadmap.
- **US-002** — Como mantenedor, quero RFC process pra mudanças grandes (BC breaking).

---

## 5. Non-goals (INV-003)

- Cobrar pelo core (15 agentes / 26 hooks / 13 skills core / 24 workflows) — ESSE permanece MIT pra sempre.
- Migrar pra licença não-OSS (BSL, Elastic, etc.) — quebra confiança que justamente queremos construir.
- Limitar uso comercial do core — qualquer empresa pode usar gratuitamente em produto fechado.
- Aceitar patrocinador com conflito de interesse evidente (banco rival do tal, gateway concorrente do outro).
- Cobrar consultoria sem que Roldão decida pessoalmente cada caso (não vira "consultoria fábrica" sem qualidade).

---

## 6. Recomendação combinada (não exclusiva)

**Fase 1 (próximos 90 dias) — C + B leve:**
- Configurar GitHub Sponsors com 4 tiers (R$ 50/200/1000/5000).
- Adicionar página `/consultoria` mínima no README com email + LinkedIn.
- Postar 1 case study no LinkedIn ("como o ROLDAO bloqueou X violações LGPD em repo legado").
- **Custo:** ~2 dias. **Receita esperada:** R$ 500-3.000/mês após 90 dias.

**Fase 2 (3-6 meses) — A leve:**
- Tornar **1 addon** (escolher entre `fiscal-br-completo` ou `esocial-completo`) pago a partir da v1.0.
- Manter outros 5 addons MIT por enquanto.
- Validar PMF de licença comercial antes de expandir.
- **Custo:** ~1 mês (CNPJ + cobrança + licenciamento simples). **Receita esperada:** R$ 3.000-15.000/mês após 6 meses se conseguir 5-20 clientes pagos.

**Fase 3 (12+ meses) — D se houver tração:**
- Se atingir 20+ empresas BR em produção, propor fundação com 3-5 membros âncora.
- Sponsors continuam.
- Consultoria continua (Roldão escolhe casos).

**Recomendação final:** começar com C (5 dias de trabalho), validar tração ao longo de 6 meses, escalar pra A leve só se receita de sponsors sinalizar interesse comercial real. D só se rede crescer.

---

## 7. Decisões pra você tomar (bloqueia execução)

1. **Está aberto a abrir CNPJ + vender licença comercial?** (define se modelo A é viável)
2. **Quer ser cara da consultoria pessoalmente, ou prefere modelo "vendor agnóstico"?** (define modelo B)
3. **Aceita listar Stone/Nubank/Totvs/Magalu como sponsors no README?** (define modelo C — alguns mantenedores acham conflito de interesse)
4. **Disposto a abordar essas empresas proativamente** ou esperar elas chegarem? (modelo C agressivo vs passivo)
5. **Há cap de horas/semana** que você quer dedicar ao framework? (calibra escolha — A exige 20h/sem mínimas, C exige 5-10h/sem)

Sem essas respostas eu posso codar uma página `/sponsors`, mas é trabalho cego. Por isso este PRD pede tua mão antes de qualquer commit que mexa em receita/posicionamento.

---

## 8. Próximo passo

Sua decisão sobre Fase 1/2/3 + respostas às 5 perguntas acima. Em seguida: `/epico modelo-sustentabilidade-fase-1` decompondo nas stories da Fase 1 escolhida.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
