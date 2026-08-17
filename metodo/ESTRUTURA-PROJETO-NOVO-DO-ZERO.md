---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 2000
proposito: instrução canônica para um agente IA construir a estrutura documental completa de QUALQUER projeto de software novo, do zero, antes da primeira linha de código.
publico-alvo: agente IA (leitura primária) + dono do produto (com tradução via `GLOSSARIO-ROLDAO.md`). O agente lê este documento como instrução canônica; o dono não-técnico consulta o glossário em paralelo para traduzir jargão.
---

## Índice

| Seção | Título | Camada Cn |
|---|---|---|
| 0 | [Como o agente usa este documento](#0-como-o-agente-usa-este-documento) | — |
| 0.5 | [Exemplo de sessão real](#05-exemplo-de-sessão-real-do-zero-ao-primeiro-commit) | — |
| 1 | [Princípios universais](#1-princípios-universais) | — |
| 1.5 | [Glossário do MÉTODO](#15-glossário-do-método) | — |
| 2 | [Raiz do repositório](#2-camada-c0--raiz-do-repositório-governança-imediata) | **C0** |
| 3 | [Descoberta](#3-camada-c1--descoberta) | **C1** |
| 4 | [Decisões arquiteturais (ADRs)](#4-camada-c2--decisões-arquiteturais-adrs) | **C2** |
| 5 | [Arquitetura](#5-camada-c3--arquitetura) | **C3** |
| 6 | [Produto (PRD e specs de módulo)](#6-camada-c4--produto-prd-e-specs-de-módulo) | **C4** |
| 7 | [Faseamento](#7-camada-c5--faseamento) | **C5** |
| 8 | [Conformidade](#8-camada-c6--conformidade-condicional--só-se-regulado) | **C6** |
| 9 | [Governança e auditoria](#9-camada-c7--governança-e-auditoria) | **C7** |
| 10 | [Operação e Segurança](#10-camada-c8--operação-e-segurança) | **C8** |
| 11 | [Harness do agente IA](#11-camada-c9--harness-do-agente-ia) | **C9** |
| 12 | [Convenções e índice](#12-camada-c10--convenções-e-índice) | **C10** |
| 13 | [Estado vivo](#13-camada-c11--estado-vivo) | **C11** |
| 14 | [Fluxo de trabalho completo — o ritual](#14-fluxo-de-trabalho-completo--o-ritual) | — |
| 15 | [Árvore de decisão — qual tipo de projeto?](#15-árvore-de-decisão--qual-tipo-de-projeto) | — |
| 16 | [Ordem prática de produção](#16-ordem-prática-de-produção-cenário-perfeito) | — |
| 17 | [Critério "pronto pra começar a codar"](#17-critério-pronto-pra-começar-a-codar) | — |
| 18 | [Anti-padrões que destroem a estrutura](#18-anti-padrões-que-destroem-a-estrutura) | — |
| 19 | [Adaptação por tipo de projeto](#19-adaptação-por-tipo-de-projeto-matriz) | — |
| 20 | [Como o agente IA cria a estrutura](#20-como-o-agente-ia-cria-a-estrutura-passo-prático) | — |
| 21 | [Manutenção da estrutura](#21-manutenção-da-estrutura) | — |
| 22 | [Referência rápida — projeto micro](#22-referência-rápida--projeto-micro-2-dias-descartável) | — |
| Anexo A | [Templates copy-paste](#anexo-a--templates-copy-paste) | — |
| Anexo B | [Matriz multi-harness](#anexo-b--matriz-multi-harness) | — |

> **Convenção de numeração:** "Camada Cn" e "Seção n" são **alinhadas** (C0 vive na Seção 2, C1 na Seção 3, ..., C11 na Seção 13). Sempre use o prefixo **C0..C11** para referenciar camadas. **Não** use "Camada 5" e "Seção 5" — gera confusão.

# Estrutura canônica de docs para projeto NOVO — manual do agente IA

> **Para o agente IA:** este é o método completo de criação documental de qualquer projeto de software, antes da primeira linha de código. Cada seção lista um arquivo ou pasta, explica **por que existe**, **o que tem dentro**, **gatilho de criação** e **tamanho-alvo**. Crie **somente o que faz sentido** pro tipo de projeto — não fabrique documentos vazios. Quando uma camada não se aplica, deixe a pasta inexistente e registre o porquê em `docs/nao-aplica.md`.

---

## 0. Como o agente usa este documento

1. **Antes de criar qualquer arquivo**, leia o repositório atual e o pedido do humano. Identifique:
   - Tipo de software (use a árvore de decisão da Seção 15 — **classifique sozinho**, não pergunte se a árvore resolve).
   - Quem é o cliente (interno/externo, regulado/não-regulado, B2B/B2C).
   - Restrições óbvias (idioma, geografia, orçamento, prazo).
2. **Classifique pela árvore §15 e SIGA.** Só pergunte ao humano o que sobrou ambíguo após classificar — tipicamente 0-2 perguntas, nunca 4 fixas. Use `AskUserQuestion` com 2-3 opções, não pergunta aberta. **Defaults seguros (não perguntar):**
   - Idioma: pt-BR (vem do CLAUDE.md global / frontmatter).
   - Cliente: "próprio dono" se solo / pessoal / experimento ≤ 2 dias.
   - SECURITY: criar se houver usuário externo, OSS público, regulação ou superfície de rede; N/A só para solo/experimento sem terceiros.
   - LGPD/PII: N/A se não trata dado de pessoa física brasileira.
   - Multi-tenant: N/A se CLI/lib/interno sem terceiros.
   Se o briefing inicial já é classificável (ex: "lib npm pra parsear CSV"), reporte a classificação e siga **sem perguntar**.
3. **Crie em ordem das camadas C0 → C11.** Camadas posteriores dependem das anteriores.
   > **Nota — ordem documental ≠ ordem de implementação prática:** a sequência C0→C11 acima é a ordem **documental/conceitual** (qual camada apoia qual). A tabela da Seção 16 ("Ordem prática de produção", por semanas) propõe uma sequência **de implementação** que mistura camadas (ex.: C8 ganha esqueleto cedo, conteúdo é incremental). As duas não são iguais — uma descreve dependências entre artefatos, a outra descreve o cronograma de produção.
4. **Execute e reporte — não peça permissão a cada passo.** Aplicar a matriz 2×2 de `AGENTS.md §13.1`: reversível + custo zero → FAZ. Pausas canônicas reduzidas e **condicionais ao tipo de projeto**:
   - **Pausa-1 (C0 raiz criada):** apenas em SaaS regulado e equipe ≥2. Solo/lib/CLI/oss/experimento: **reporta C0 criada e segue direto para C1, sem esperar**.
   - **Pausa-2 (C1 Descoberta `stable`):** apenas se houver ADR de stack em disputa. Senão, segue para C2.
   - **Pausa-3 (GATE DE CONVERGÊNCIA):** dispara na **4ª passada** de auditoria sem PASS ZERO C/A/M. **Passadas 1-3 são 100% autônomas** — agente identifica eixo, conserta causa-raiz, roda passada nova sem confirmação. **5ª passada é o teto duro** — bloqueio absoluto.

   Para tudo o mais (preenchimento de skeleton, criação de spec/plan/tasks, auditoria de rotina, atualização de docs, escolha entre 2 opções tecnicamente equivalentes) — **siga, e reporte em 1-2 parágrafos no fim**. Roldão prefere reverter algo bem-intencionado a aprovar 10 vezes.

   **Antídoto:** se prestes a escrever `"Quer que eu...?"` / `"Posso fazer X?"` / `"Devo continuar?"` para autorização de ação técnica reversível — PARE. Aplique a matriz §13.1 do AGENTS.md.
5. **Não escreva código de produto** enquanto qualquer camada bloqueante (C0-C7) estiver incompleta.
6. **Quando arquivo de leitura obrigatória (`AGENTS.md`, `CURRENT.md`, etc.) ainda não existir** porque o projeto está em construção, pule silenciosamente. Não pergunte.

### Marcações universais

- 🟢 **OBRIGATÓRIO** — todo projeto precisa, sem exceção.
- 🟡 **RECOMENDADO** — quase todo projeto se beneficia; documente decisão de pular em `docs/nao-aplica.md`.
- 🔵 **CONDICIONAL** — só se a condição listada for verdadeira.
- ⚪ **OPCIONAL** — crie só quando o padrão aparecer 3+ vezes (a "regra dos 3": três usos reais distintos antes de extrair como artefato reutilizável, evita abstração prematura).

---

## 0.5. Exemplo de sessão real (do zero ao primeiro commit)

> Diálogo ilustrativo. Pseudo-projeto: "PadariaSaaS" (gestão para padarias). Mostra o que o humano vê quando contrata o método.

```
HUMANO: quero começar um projeto novo. é um sistema pra padaria controlar
        produção, estoque e vendas. ainda não codei nada.

AGENTE: hipótese inicial pelo briefing: parece SaaS B2B (web; cliente externo;
        gestão operacional). LGPD/regulação ainda é só hipótese — pode ser
        saas-regulado, pode ser saas comum. Vai depender do que a Descoberta
        revelar. Idioma pt-BR herdado.

        Pergunto só o nome da pasta (ou aceito "padaria-saas"):
        [AskUserQuestion: "Nome do projeto?" — opções: "padaria-saas",
         "panificadora", "outra"]

HUMANO: padaria-saas

AGENTE: ok. Rodando fase-1 do bootstrap (descoberta-first). Cria a estrutura
        mínima + 16 esqueletos de descoberta. NÃO cria conformidade nem
        operação ainda — isso fica pra fase-2 depois de a Descoberta fechar.

        [agente executa: bash bootstrap.sh "C:/PROJETOS/padaria-saas" \
                              "Padaria SaaS" saas]

        [Fase-1 concluída. cerca de 50 arquivos materializados:]
        C0 (13): README.md, AGENTS.md, CLAUDE.md, CONTRIBUTING.md, SECURITY.md,
          MAINTAINERS.md, REGRAS-INEGOCIAVEIS.md, CHECKLIST-PRONTO-PRA-CODAR.md,
          CODEOWNERS, CHANGELOG.md, LICENSE, .gitignore, .pre-commit-config.yaml.
        C9 multi-harness: .pre-commit-config.yaml, .claude/settings.json,
          .cursorrules, .windsurfrules, .kiro/steering/00-agents.md,
          15 hooks copiados (chmod +x; inclui override-consume.sh em PostToolUse),
          .claude/memory/constitution.md, .claude/agents/maestro.md,
          .agent/CURRENT.md.
        C1 descoberta (16): docs/descoberta/{problema, personas, jornadas,
          business-model-canvas, value-proposition-canvas, gtm-pricing,
          concorrentes, mercado-regulatorio, nao-fazer, riscos, restricoes,
          hipoteses-a-validar, metricas-chave, dados-existentes,
          integracoes-externas, sintese-final}.md + docs/glossario.md.
        C7 esqueleto: docs/governanca/catalogo-auditores.md.
        C10: docs/{CONVENCOES-DOC, INDICE, documentos-do-projeto,
          nao-aplica}.md.
        C2 vazia: docs/adr/ (ADRs vêm depois da descoberta).

        Próximo passo: vou preencher problema.md com base no briefing —
        responda 3 perguntas, vou completando e te mostro o draft em 2 minutos:
        1) Qual é o problema #1 que a padaria tem hoje (perde estoque?
           erra preço? não sabe quanto vendeu?)?
        2) Quem usa o sistema no dia-a-dia (você, balconista, garçom, todos)?
        3) Tem 1-2 concorrentes que você conhece (mesmo informal)?

[... agente conduz C1 ao longo de uma ou mais sessões: problema → personas →
 jornadas → BMC → VPC → concorrentes → nao-fazer → riscos → metricas-chave →
 sintese-final. Cada arquivo passa de `draft` para `stable` conforme
 validação com o dono.]

AGENTE: docs/descoberta/sintese-final.md acaba de virar status:stable. Reaplicando
        árvore §15 com o que descobrimos:
          - cliente externo (PMEs do varejo Sudeste): confirmado.
          - LGPD aplica (cadastro de clientes B2B): confirmado.
          - emite NF-e a partir da V2: confirmado, mas V1 só consume CSV.
        → classificação DEFINITIVA: saas-regulado.

        Rodando fase-2 do bootstrap. Adiciona conformidade LGPD + segurança +
        operação SaaS.

        [agente executa: bash bootstrap-fase-2.sh \
                              "C:/PROJETOS/padaria-saas" saas-regulado]

        [Fase-2 concluída. +23 arquivos no exemplo saas-regulado:]
        C5: docs/faseamento/F-A/kickoff.md.
        C6 LGPD: docs/conformidade/lgpd/{ropa, retencao-dados,
          direitos-do-titular, dpo-action-plan, aipd}.md +
          docs/operacao/runbooks/atender-pedido-eliminacao.md.
        C6 segurança: docs/seguranca/{threat-model, dependency-policy,
          criptografia-policy, key-management-policy, resposta-incidente}.md.
        C8 operação: docs/operacao/{runbook, on-call, backup, disaster-recovery,
          change-management, observabilidade, release-process,
          deployment-strategy, capacity-planning, performance-testing, slo-sli}.md.

        Próximo: abrir ADR-0001 (escolha de stack). Vou propor Python+FastAPI
        baseado no que a descoberta revelou (PMEs, LGPD, NF-e tem libs Python
        boas, multi-tenant via RLS é maduro em Postgres). Se houver objeção,
        ela entra como alternativa rejeitada na própria ADR.
```

**Pontos pedagógicos do exemplo:**
- **Descoberta-first**: agente NÃO escolhe stack nem materializa conformidade no início. Tipo no kickoff é **hipótese**, decisão definitiva sai da descoberta.
- **2 fases**: `bootstrap.sh` cria estrutura mínima + C1 completo em `draft` (cerca de 50 arquivos; 49 em experimento). Quando `sintese-final.md` vira `stable`, `bootstrap-fase-2.sh` adiciona C6/C8 conforme tipo apurado.
- Agente forma **hipótese provisória** pelo briefing (ajuda a etiquetar `.agent/CURRENT.md` e a planejar perguntas), mas não decide stack até C1 fechar.
- **Não pergunta `"Quer seguir agora?"`** — reporta e segue. Humano interrompe se quiser.
- **Não pergunta 4 coisas abertas** ("qual stack? qual domínio? equipe? prazo?"). Pergunta só o NOME no início; o resto vem da descoberta.
- Quando há dúvida real (não-binária), usa `AskUserQuestion` com opções fechadas.
- "Esqueleto" antes de "conteúdo" — os 16 arquivos C1 ficam em `draft` aguardando preenchimento iterativo.
- Tipo DEFINITIVO sai da descoberta — no exemplo, hipótese era `saas`, descoberta confirmou LGPD/NF-e → `saas-regulado`. Sem 2 fases, agente teria materializado ROPA mesmo se não fosse necessário (ou pulado se hipótese errasse pra menos).
- **phase-gate** (hook em `.claude/hooks/phase-gate.sh`) bloqueia escrita em `src/` até `sintese-final.md` virar `stable` **e** ADR-0001 (stack) estar `aceita`. Sem esse gate, esquecimento é a regra.
- ADR-0001 é o **primeiro lugar onde a stack tecnológica é decidida** — não no kickoff, não no bootstrap.

---

## 1. Princípios universais

Estes 10 princípios sustentam toda a estrutura. Devem aparecer transcritos ou referenciados em `AGENTS.md`, `CONTRIBUTING.md` e `constitution.md`:

1. **Documento é estado compartilhado** — agente sem doc inventa diferente toda vez. *Violação real:* projeto onde 3 agentes consecutivos criaram 3 modelos de cliente diferentes em 1 semana.
2. **Spec gera código** (spec-as-source), não código gera spec. *Violação real:* "vou codar e depois escrevo ADR" — ADR vira ficção retroativa, perde valor de decisão.
3. **Conciso vence completo** — `AGENTS.md` ≤ 300 linhas, `CLAUDE.md` ≤ 150 linhas, ADR ≤ 200 linhas. *Violação real:* AGENTS.md com 800 linhas que ninguém lê.
4. **Non-goals explícitos** — toda spec/ADR declara o que NÃO está no escopo. Sem isso, agente fica adicionando funcionalidade sem ninguém pedir.
5. **IDs rastreáveis** — `US-<MOD>-NNN` → `AC-<MOD>-NNN-N` → `T-<MOD>-NNN` → commit. Sem rastreabilidade, ninguém consegue auditar nada.
6. **Negócio vence conveniência do agente** — não otimizar pelo que IA erra menos; otimizar pelo cliente/produto.
7. **Regra crítica vira hook**, não só doc — execução automática (pre-commit, pre-tool) > prosa que ninguém lê na pressa.
8. **Frontmatter obrigatório** em todo doc: `owner`, `revisado-em` (ou `ultima-conferencia` em docs vivos de operação), `status` (`draft|stable|deprecated|superseded`). Sem isso, o doc apodrece silenciosamente.
9. **Verificar antes de afirmar** — nunca dizer "pronto" sem executar o comando de verificação.
10. **Causa raiz, nunca sintoma** — teste falhou = código errado, nunca silenciar teste. *Violação real:* mudar template de PDF 3 vezes seguidas quando o bug estava num campo do banco gravado errado.

---

## 1.5. Glossário do MÉTODO

> Termos próprios do método. Definição curta. Use estes nomes consistentemente em todos os docs do projeto.

| Termo | Definição (1 frase) |
|---|---|
| **C0..C11** | As 12 camadas documentais (C0 = raiz; C1 = Descoberta; ...; C11 = Estado vivo). |
| **Foundation** (F-A, F-B, F-C…) | Capacidade transversal sem a qual nenhum módulo de produto funciona (multi-tenant, auth, observabilidade). Não tem auditor de Produto. |
| **Fase de produto** (F-1, F-2, F-3…) | Grupo de módulos de produto entregues juntos. Ritual completo, incluindo auditor de Produto. **Termo canônico**: Fase. "Wave" era o termo antigo — não usar mais em código/templates/ADRs novos. |
| **Marco** | Fechamento de uma Foundation ou Fase; gate inegociável de PASS ZERO C/A/M. |
| **PASS ZERO C/A/M** | Zero achados CRÍTICO, ALTO ou MÉDIO em aberto. Único critério aceito para fechar marco. |
| **Auditor** | Subagente Claude que verifica artefatos contra regras críticas (INV-*, SEC-*, TST-*, OBS-*, DAT-*, OPS-*, LEG-*) antes de marco; bloqueia código/doc se falha CRÍTICO/ALTO/MÉDIO. Catálogo completo em C7 (Seção 9). |
| **Auditores ativos** | Conjunto de auditores que rodam antes de fechar marco (segurança, qualidade, produto, doc-quality, etc.). |
| **Override** (ou `ritual-gate: skip`) | Exceção a um gate de auditoria via anotação de commit, registrada automaticamente em `docs/governanca/overrides-ledger.md`. **TTL canônico: 14 dias** (vale tanto para override pessoal quanto para disputa coletiva entre subagentes); `auditor-overrides-expired` flagra vencimento. *(Para o que TTL significa, ver `GLOSSARIO-ROLDAO.md`.)* |
| **Hotfix** | Correção mínima em produção via branch `hotfix/YYYY-MM-DD-<slug>`, seguida de dívida retroativa obrigatória em ≤48h (spec + auditoria + post-mortem). |
| **Trilha auditável** | Registro imutável de operações críticas (tenant_id, user, ação, timestamp) em logs estruturados, rastreável de ponta a ponta (end-to-end). Termo único — evite "audit trail". |
| **IDs canônicos** | Formato `<PREFIXO>-<ESCOPO>-NNN` (zero-padding 3 dígitos; exceção: `ADR-NNNN` com 4). Lista canônica de prefixos em C10 (Seção 12). |
| **Descoberta** (Discovery, sinônimo histórico) | Camada C1 — pesquisa de problema/personas/jornadas antes de decidir tecnologia. |
| **Spec Kit** | Ritual por Story: `/specify` → `/plan` → `/tasks` → `/implement`. |
| **GATE** | Critério binário verificável que destrava algo (próxima fase, próximo módulo). ID: `GATE-<NOME>-N`. |
| **Carryover** | Achado BAIXO de auditoria que não bloqueia marco mas é rastreado pra próxima Fase. |
| **Drift** | Distância silenciosa entre o que o doc diz e o que o código/projeto realmente faz. |
| **WORM** | *Write Once, Read Many* — dado gravado uma vez, jamais alterado (auditoria, log fiscal, NF-e). |
| **Crypto-shredding** | Apagar dado pessoal "destruindo a chave" que decripta, sem violar WORM (LGPD + auditoria fiscal coexistem). |
| **STRIDE** | Modelo de ameaças: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. |
| **C4 (nível 1, nível 2)** | Notação de diagrama: nível 1 = contexto (sistema vs mundo); nível 2 = containers (processos/serviços internos). |
| **Anti-corrosion layer / Ports & Adapters / Hexagonal** | Padrão DDD: produto se comunica com fora via interfaces (portas), implementações trocáveis (adapters). Permite trocar fornecedor sem reescrever. |
| **RIPD** | Relatório de Impacto à Proteção de Dados (LGPD Art. 38) — análise prévia quando tratamento de dados pessoais tem alto risco. |
| **ROPA** | Record of Processing Activities — registro de operações de tratamento (LGPD Art. 37 obrigatório). |
| **DPA** | *Data Processing Agreement* — contrato de operador com terceiros que tratam dados pessoais (LGPD Art. 39 / GDPR Art. 28). |
| **TIA** | *Transfer Impact Assessment* — análise quando dado pessoal sai pra fora do país (GDPR pós-Schrems II). |
| **DPO / Encarregado** | Pessoa designada como ponto focal de privacidade (LGPD Art. 41). |
| **SBOM** | *Software Bill of Materials* — inventário máquina-legível de todas as dependências (CycloneDX/SPDX). |
| **SLSA** | *Supply chain Levels for Software Artifacts* — framework de maturidade de cadeia de suprimentos. |
| **SLO / SLI / Error budget** | Service Level Objective (meta), Service Level Indicator (medida), orçamento de falha aceitável. |
| **RTO / RPO** | Recovery Time Objective (quanto pode demorar a voltar) / Recovery Point Objective (quanto dado pode perder). |
| **5 estados de tela** | Loading, empty, error, success, partial — convenção fixa: toda tela deve declarar comportamento nos 5. |
| **North Star Metric** | Métrica única que mede sucesso do produto a longo prazo; cercada por métricas guardrail que não podem piorar. |
| **Founder-is-customer** | Anti-padrão de validar produto só consigo mesmo, sem entrevista externa — risco crítico de viés. |
| **Mystery shopping** | Visita disfarçada de cliente ao concorrente, pra mapear experiência real. |
| **Bounded Context** | DDD — fronteira de modelo (mesmo termo significa coisa diferente em contextos diferentes; ex: "cliente" no financeiro ≠ "cliente" no marketing). |

> **Nota sobre jargão técnico:** quando este documento usa termos como `trunk-based`, `fast-forward`, `RLS`, `expand/contract`, `Schrems II`, `Sigstore/cosign`, `lefthook/husky/lint-staged`, `GIVEN/WHEN/THEN`, `STRIDE/PASTA/DREAD/OCTAVE`, `founder-is-customer`, `5xx` (família de códigos HTTP de erro de servidor), `JWT` (token web criptografado), `AST` (árvore sintática abstrata), o dono não-técnico deve consultar `GLOSSARIO-ROLDAO.md` em paralelo. O agente IA assume domínio técnico; o glossário traduz para o dono do produto.

---

## 2. Camada C0 — Raiz do repositório (governança imediata)

> **Quando criar:** primeira coisa, no momento `git init`. Bloqueia tudo abaixo.

### 🟢 `README.md`
**Tamanho:** 1 página (≤120 linhas).
**Contém:**
- Nome do projeto (1 linha) + 1 frase do que é
- Estado atual (`alpha`/`beta`/`prod`) + versão
- Como rodar localmente (3-5 comandos)
- Como rodar testes (1 comando)
- Link para `AGENTS.md` ("documentação completa")
- Licença + autor
**NÃO contém:** roadmap longo, arquitetura, decisões técnicas — vai em outros docs.
**Template:** [`templates/README.template.md`](./templates/README.template.md).

### 🟢 `AGENTS.md`
**Tamanho:** ≤ 300 linhas. Se passar, fatie em sub-docs e referencie.
**Seções fixas:**
1. **Identidade do produto** — nome (marcar `PROVISÓRIO` se não definido), escopo, modelo de negócio, cliente piloto.
2. **Stack candidata** — tabela `Camada | Escolha | Notas`. Marcar "candidata" até validação real.
3. **Princípios não-negociáveis** — referência a `constitution.md` + `REGRAS-INEGOCIAVEIS.md`.
4. **Decisões fundadoras (D-001..D-NNN)** — tabela de decisões que NÃO podem ser reabertas sem ADR.
5. **Modelo de agentes** — quais subagentes existem e quais auditores rodam pré-commit.
6. **Comandos canônicos** — tabela `Operação | Comando`.
7. **Política de commits** — atômicos, mensagem, hooks proibidos (`--no-verify`).
8. **Convenções** — idioma, pastas-chave, nomenclatura.
9. **Segurança/dados** — multi-tenancy, KMS, WORM, retenção (se aplicável).
10. **ADRs ativas** — tabela `# | Tema | Status | Bloqueia fase | Depende de`.
11. **Pendências (GATEs)** — o que falta pra próxima fase abrir.

**Template:** [`templates/AGENTS.template.md`](./templates/AGENTS.template.md).

### 🟢 `CLAUDE.md` (ou `.cursorrules`, `.windsurfrules`, equivalente)
**Tamanho:** ≤ 150 linhas.
**Contém:**
- Linha 1: `@AGENTS.md` (importa o canônico).
- Perfil do usuário (CRÍTICO se humano é não-técnico): linguagem, tabela de tradução, pró-atividade.
- Regra #0 (investigar antes de mexer em lógica de negócio).
- Idioma do canal.
- Estado do ambiente.
- Notas de plataforma (Windows/Linux/Mac).
- O QUE NÃO REPETIR: tudo que já está em `AGENTS.md`. Este arquivo é **adendo do harness**, não cópia.

### 🟢 `CONTRIBUTING.md`
**Tamanho:** 50-150 linhas.
**Contém:**
- Fluxo do agente: ler spec → propor plano → revisão → implementar → auditar → commit.
- Fluxo do humano: como propor mudança, abrir ADR, reportar bug.
- Quality gates obrigatórios antes de commit.
- O que NUNCA fazer (`--no-verify`, push --force em main).
- Como rodar auditores localmente.

### 🟢 `CODEOWNERS`
**Tamanho:** 20-80 linhas.
Paths críticos com owner: `financeiro/`, `auth/`, `tenant/`, `kms/`, `migrations/`, `.claude/hooks/`, `.github/workflows/`, `CODEOWNERS`. Em projeto solo, owner é o dono — força revisão extra via hook.

### 🟢 `LICENSE`
**Defaults por tipo (aplicar automaticamente, não perguntar):**
- `tipo: oss` → MIT.
- `tipo: lib` (npm/cargo/pypi pública) → MIT.
- `tipo: saas` → proprietária.
- `tipo: interno` → proprietária.
- `tipo: cli` solo / pessoal → MIT.

Se o dono quiser AGPL ou Apache, ele altera depois. Não copiar cego, mas também não travar perguntando.

### 🟢 `CHANGELOG.md`
Formato [Keep a Changelog](https://keepachangelog.com). Vazio no início com seção `## [Unreleased]`.

### 🟢 `REGRAS-INEGOCIAVEIS.md`
**Tamanho:** cresce com o projeto; começa com 5-10 regras.
**Contém:**
- IDs estáveis por categoria:
  - `INV-NNN` — invariantes de domínio
  - `INV-TENANT-NNN` — isolamento multi-tenant
  - `INV-AGENT-NNN` — limites do agente IA
  - `SEC-NNN` — segurança
  - `TST-NNN` — teste
  - `OBS-NNN` — observabilidade (correlation-id em logs, métricas obrigatórias)
  - `DAT-NNN` — dados / governança de dados (PII nunca em logs, WORM em audit log)
  - `OPS-NNN` — operação (backup testado, RTO/RPO documentados)
  - `LEG-NNN` — legal / compliance (NF-e assinada, ROPA atualizada)
- Cada regra: `ID | Regra (1 frase) | Justificativa (1 frase) | Severidade | Implementação-em (hook/auditor/subagente/revisão-humana) | Hook ou auditor que aplica`.
- **Fonte única** — toda outra doc referencia por ID, nunca redeclara.
**Template:** [`templates/REGRAS-INEGOCIAVEIS.template.md`](./templates/REGRAS-INEGOCIAVEIS.template.md).

### 🔵 `SECURITY.md`
**Quando criar (condicional):** projeto recebe usuário externo, é OSS público, é regulado, ou tem superfície de ataque (rede, dados de terceiros). Para projeto solo/pessoal/CLI offline/lib sem network → marcar `N/A` em `docs/nao-aplica.md` e seguir.

**Tamanho:** 30-60 linhas.
**Contém:**
- Canal de divulgação de vulnerabilidade (default: e-mail do `owner` do AGENTS.md ou Security Advisory do GitHub).
- SLA de resposta (ex: 72h pra triagem, 30 dias pra correção crítica). *(exemplo de SLA de SECURITY.md, não é TTL do método.)*
- Chave PGP opcional.
- Versões com suporte de segurança ativo.
- O que NÃO é considerado vulnerabilidade.

### 🟡 `CODE_OF_CONDUCT.md`
Copy-paste de Contributor Covenant 2.1 (se projeto receber contribuição externa).

### 🟡 `SUPPORT.md`
Como pedir ajuda — issue tracker, chat, e-mail comercial.

### 🟡 `ONBOARDING.md` (≠ `setup-local.md`)
**Contém:** primeiros 7 dias do dev novo. Leitura ordenada, tour de pastas, primeira PR de aquecimento.

### 🟢 `.gitignore`
Específico da stack. Inclui sempre: `.env*`, `*.log`, `__pycache__`, `node_modules`, `dist/`, `build/`, `.DS_Store`, `Thumbs.db`, `coverage/`, `.idea/`, `.vscode/settings.json`, `.claude/settings.local.json`, `.claude/cache/`.

### 🟡 `.editorconfig`
Padroniza tabs/espaços/line-endings entre editores.

### 🟢 `.mcp.json` (raiz, NÃO em `.claude/`)
MCP servers plugados. Começar com github; adicionar playwright/postgres/etc. sob demanda. Cada entrada tem `revisar-em: +90d` em `docs/seguranca/politica-mcp.md` (sem uso = remoção).

---

## 3. Camada C1 — Descoberta

> **Quando criar:** antes de qualquer ADR. Bloqueia decisões arquiteturais.
> **Pula (marcar N/A em `docs/nao-aplica.md`) se:**
> - projeto é continuação óbvia de outro já documentado, OU
> - experimento pessoal de ≤2 dias, OU
> - lib/CLI sem usuário final identificável (dono = único usuário), OU
> - ferramenta dev interna usada só pelo time de dev, OU
> - projeto onde produto não é vendido nem distribuído publicamente.

Pasta: `docs/descoberta/`

### 🟢 `problema.md` (1-3 páginas)
- Dor real, com evidências (cita conversa/email/dado).
- Quem sente a dor e quanto custa hoje (tempo, dinheiro ou risco).
- Por que solução existente não resolve.
- **Template:** [`templates/problema.template.md`](./templates/problema.template.md).

### 🟢 `personas.md` (1-2 páginas por persona, 2-5 personas)
- Nome (fictício), papel, contexto técnico, frustrações, "job to be done".
- Distinguir **usuário** de **comprador** se forem pessoas diferentes.

### 🟢 `jornadas.md` (1 página por jornada, 3-7 jornadas)
- Fluxo ponta-a-ponta do que persona faz HOJE (sem produto) e DEPOIS (com produto).
- Marca **momentos de dor** e **momentos de delight**.

### 🟢 `business-model-canvas.md` + `value-proposition-canvas.md`
- Canvas de Modelo de Negócio (9 blocos) + Canvas de Proposta de Valor (ganhos, dores, pílulas).
- Sem isso, produto vira *feature factory* sem clareza de monetização.

### 🟡 `gtm-pricing.md`
- Estratégia de go-to-market, pricing, free tier vs pago, plano de aquisição.

### 🟡 `entrevistas/` (pasta)
- 1 arquivo por entrevista: `EE-NNN-<nome>.md`.
- Mínimo 3 entrevistas com OUTRAS pessoas se "founder-is-customer".
- `sintese.md` agrega padrões.

### 🟢 `concorrentes.md`
- Tabela `Concorrente | Pontos fortes | Pontos fracos | Preço | Mystery shopping (sim/não)`.

### 🔵 `mercado-regulatorio.md` (se domínio é regulado)
- Leis, normas, órgãos fiscalizadores, prazos.

### 🟢 `glossario.md` (em `docs/`, NÃO em `docs/descoberta/`)
- Termos do domínio com definição canônica.
- Marca tradução PT↔EN se bilíngue.
- Coluna **`evite-sinonimos-de:`** — termos que NÃO podem ser usados como sinônimo (ex: "cliente" ≠ "usuário"). Auditor de drift faz grep no diff.
- **Toda outra doc usa estes termos.** Inconsistência de termo = bug.

### 🟢 `nao-fazer.md`
- Lista numerada do que o produto NUNCA fará (ou não fará na V1).
- Cada item com justificativa de 1 linha.

### 🟢 `riscos.md`
- IDs `R-NNN`. Cada risco: descrição, probabilidade (A/M/B), impacto (A/M/B), mitigação, responsável.

### 🟡 `restricoes.md`
- Orçamento, prazo, equipe, geografia, idioma, dependências externas.

### 🟡 `hipoteses-a-validar.md`
- Cada hipótese com critério de validação.

### 🟢 `metricas-chave.md`
- **North Star Metric** (1 só).
- 3-5 métricas guardrail.
- Como medir cada uma (fonte, fórmula).

### 🔵 `dados-existentes.md` (se vai migrar de sistema legado)
- O que existe, formato, quantos registros, qualidade.

### 🔵 `integracoes-externas.md` (se depende de APIs/sistemas terceiros)
- Provedor, finalidade, SLA, custo, plano B.

### 🟢 `sintese-final.md`
- **Destrava ADRs.** Resume os artefatos acima em 2-4 páginas.
- Status `stable` aqui = "pode começar a decidir arquitetura".

---

## 4. Camada C2 — Decisões arquiteturais (ADRs)

Pasta: `docs/adr/`. Formato de nome: `NNNN-titulo-em-kebab-case.md`.

### 🟢 Template ADR (fixo, copy-paste)

```markdown
---
id: ADR-NNNN
titulo: <título curto>
status: proposta | aceito | superseded | deprecated
data-proposta: YYYY-MM-DD
data-aceite: YYYY-MM-DD | null
depende-de: [ADR-XXXX, ADR-YYYY]
bloqueia-fase: <F-1|F-2|...> | null  # lista de fases que dependem desta decisão (forma canônica F-NNN; "Wave-A" foi descontinuado)
superseded-by: ADR-ZZZZ | null
owner: <quem>
revisado-em: YYYY-MM-DD
---

# ADR-NNNN: <título>

## Contexto
<2-5 parágrafos. Por que decidir agora? O que muda se NÃO decidir?>

## Opções consideradas
### Opção 1: <nome>
- Prós:
- Contras:
- Custo (tempo/dinheiro/risco):

### Opção 2: <nome>
...

## Decisão
<1-3 parágrafos. Qual opção e por quê.>

## Consequências
- **Positivas:**
- **Negativas / dívida assumida:**
- **Reversibilidade:** fácil | média | difícil | irreversível

## Non-goals (o que esta ADR NÃO decide)
- ...

## Como validar (gates)
- GATE-<NOME>-N: <critério binário verificável>

## Referências
- <links, papers, threads>
```

### ADRs mínimas (criar conforme aplicável)

- 🟢 **ADR-0000** — Uso de IA / agentes (como agentes participam, limites).
- 🟢 **ADR-0001** — Stack principal (linguagem, framework, banco). **Sempre com portões de validação.**
- 🔵 **ADR-0002** — Multi-tenancy (se SaaS).
- 🔵 **ADR-0003** — Estratégia mobile (se tem app).
- 🔵 **ADR-0004** — Sync offline (se mobile com conectividade ruim).
- 🟡 **ADR-NNNN** — Feature flags.
- 🟡 **ADR-NNNN** — Autorização/autenticação.
- 🟡 **ADR-NNNN** — Estratégia de UI (SSR/SPA/hybrid).
- 🔵 **ADR-NNNN** — KMS / gestão de chaves (se cripto).
- 🔵 **ADR-NNNN** — Storage de arquivos.
- 🟡 **ADR-NNNN** — Observabilidade (logs/métricas/traces).
- 🟡 **ADR-NNNN** — Filas/jobs assíncronos.
- 🔵 **ADR-NNNN** — Classificação IA Act (se produto usa IA na UE).
- 🔵 **ADR-NNNN** — Estratégia de eval de LLM (se produto tem agente).

**Regra:** uma decisão arquitetural não-trivial = uma ADR. Numeração nunca reciclada. ADR superseded vira `status: superseded`, nunca apagada. Quando ADR muda de `proposta` para `aceito`, **`auditor-doc-quality` (sub-regra b — cascata de supersession)** varre o corpus por menções literais à decisão antiga e abre tasks de atualização.

**Critério de promoção draft → stable:** ADR vira `aceito` quando ≥2 subagentes pertinentes deram APROVADO. **RESSALVAS NÃO bloqueiam** — viram tasks de follow-up que o maestro abre em `tasks.md` automaticamente; ADR é promovido. Só REPROVADO bloqueia (e dispara loop até 3 passadas; §14.7).

---

## 5. Camada C3 — Arquitetura

Pasta: `docs/arquitetura/`

### 🟢 `visao-geral.md`
- Diagrama C4 nível 1 (contexto: sistema vs mundo) e nível 2 (containers: serviços/processos internos).
- Mermaid ou imagem versionada em `docs/arquitetura/diagramas/`.
- Lista de componentes principais com 1 frase cada.

### 🟢 `bounded-contexts.md` (DDD Context Map)
- Cada bounded context: nome, propósito, linguagem ubíqua local, owner.
- Relações entre contextos: `upstream/downstream`, `Anti-Corruption Layer (ACL)`, `Conformist`, `Partnership`, `Customer-Supplier`, `Shared Kernel`.
- Diagrama do mapa de contextos.
- Sem este doc, `docs/dominios/` vira spaghetti em 6 meses.

### 🟢 `anti-corrosion-layer.md` (ports & adapters)
- Cada integração externa = **uma porta** (interface).
- Tabela: `Porta | Adapter atual | Adapters alternativos | INV relacionadas`.
- Portas comuns: `Fiscal`, `Signature`, `Storage`, `Auth`, `Queue`, `MultiTenant`, `Payment`, `Email`, `LLM`, `Analytics`, `OmniChannel`.

### 🟢 `modelo-dados-canonico.md`
- Entidades raiz: campos obrigatórios, invariantes, relações.
- Diagrama ER simplificado.
- Distingue entidade **temporal** (com vigência), **append-only** (WORM), **mutável** (config).

### 🟢 `data-dictionary.md` (dicionário de campos)
- Tabela por entidade: `Campo | Tipo | Domínio/Constraints | PII? | Base legal (se PII) | Retenção | Fonte`.
- Crítico pra LGPD/auditoria — sem isso, ROPA não fecha.

### 🟢 `contratos/openapi.yaml` (+ `asyncapi.yaml` se eventos)
- Contrato de API **máquina-legível e versionado**.
- Versionamento via SemVer + deprecação documentada.
- Gerado a partir do código OU código gerado a partir dele (decidir em ADR).
- Sem isso, cliente/consumidor/IA inventam schema diferente.

### 🟡 `eventos-canonicos.md`
- Catálogo de eventos de domínio: nome, payload, produtor, consumidores.
- Versionamento de schema (`_schema_version: vN`).
- Regras de idempotência e dead-letter.

### 🟢 `seguranca-base.md`
- Threat model resumido (STRIDE — completo em `docs/seguranca/modelo-ameacas.md`).
- Onde estão secrets, como rotacionar.
- Política de senhas/sessão.
- Multi-tenancy isolation (se aplicável).
- Referencia `docs/seguranca/modelo-ameacas.md` (não duplica).

### 🟡 `observabilidade-base.md`
- Pra cada serviço crítico: logs estruturados, métricas obrigatórias, traces.
- Referencia `docs/operacao/slo-sli.md` (não duplica).
- Onde olhar (dashboard URL placeholder).

### 🔵 `design-system.md` + `design-tokens.json` (se produto tem UI)
- Tokens de cor, spacing, tipografia, raio, sombra.
- Biblioteca de componentes (link Figma + storybook se houver).
- Voz e tom (formal/informal, microcopy patterns).

### 🔵 `i18n-strategy.md` (se bilíngue/multi-locale)
- Catálogos, pluralização, RTL, formatação numérica/data, fallback.

### 🔵 `acessibilidade-declaracao.md` (se UI)
- Nível alvo (WCAG 2.2 AA padrão), escopo, exceções declaradas, contato.

---

## 6. Camada C4 — Produto (PRD e specs de módulo)

### 🟢 `docs/prd.md` (PRD raiz)
- Visão de 1 página.
- Lista de módulos com prioridade (MVP / V1 / V2 / backlog).
- Sucesso = North Star + métricas guardrail.
- Cronograma de alto nível (trimestres, não dias).

### 🟢 `docs/testes/estrategia.md`
- Pirâmide de testes do projeto: unitário > integração > E2E.
- Cobertura mínima por camada.
- Política E2E (quando vale, quando não — caro/flaky).
- Política de dados de teste: fixtures versionadas, PII sintética, dados de produção PROIBIDOS em DEV.
- Contract tests vs mock — quando cada um.

### Por módulo: `docs/dominios/<dominio>/modulos/<modulo>/`

<!-- domínio: agrupamento lógico de funcionalidades relacionadas que compartilham linguagem ubíqua e regras de negócio próprias (financeiro, fiscal, cadastro, etc.). É um conceito DDD (bounded context); ver §5 (C3) e tabela de subagentes em §9 (C7) para "especialista-dominio". -->

### 🟢 `spec.md`
- **User stories** `US-<MOD>-NNN`. Formato: "Como <persona>, quero <ação>, para <benefício>".
- **Acceptance criteria** `AC-<MOD>-NNN-N` — **binários e verificáveis** (cada AC vira teste).
- **Invariantes** `INV-<MOD>-NNN` — regras que NUNCA podem ser violadas.
- **Non-goals** — explícitos.
- **Dependências** de outros módulos / ADRs.
- **Template:** [`templates/spec.template.md`](./templates/spec.template.md).

### 🟢 `plan.md`
- Como implementar (passo a passo, ordem).
- Estimativa em "fatias verticais".
- Riscos específicos do módulo.
- Hooks que vão validar.
- **Template:** [`templates/plan.template.md`](./templates/plan.template.md).

### 🟢 `tasks.md`
- IDs `T-<MOD>-NNN`, rastreáveis até commit.
- Cada task: descrição, AC que satisfaz, estimativa, dependência.
- **Template:** [`templates/tasks.template.md`](./templates/tasks.template.md).

### 🟡 `prd-ux.md` (se módulo tem tela)
- Para cada tela: **5 estados** obrigatórios (loading, empty, error, success, partial).
- Checklist a11y (WCAG 2.2 AA).
- Mockups linkados (Figma/print).

### 🟡 `auditoria-saida.md`
- Saída dos Auditores de Saída com PASS/FAIL/CONCERN.
- Hierarquia: por módulo (`docs/dominios/<mod>/modulos/<mod>/auditoria-saida.md`) e por fase (`docs/faseamento/<fase>/auditoria-saida.md`). Os dois existem, com escopos distintos.

---

## 7. Camada C5 — Faseamento

Pasta: `docs/faseamento/`

### 🟢 `faseamento-foundation-fases.md`
- **Foundations (F-A, F-B, F-C…)** — capacidades transversais (multi-tenant, auth, observabilidade).
- **Fases (F-1, F-2, F-3…)** — grupos de módulos de produto entregues juntos. ("Wave" era o termo antigo — descontinuado.)
- Diagrama de dependência (Foundation → Fase 1 → Fase 2).

### 🟢 `faseamento-modulos.md`
- Lista numerada de TODOS os módulos previstos.
- Pra cada um: nome, prioridade, depende-de, fase prevista.

### Por fase: `docs/faseamento/<fase>/`

> **Convenção de nome de pasta:** o ID canônico e gerado é `F-A`, `F-1`, etc. (curto, estável). Sufixos antigos como `F-A-foundations/` podem aparecer em projetos legados apenas para leitura/migração. Geração nova usa sempre o ID curto.

- `spec.md` — o que a fase entrega.
- `plan.md` — como construir (ordem, equipe, risco).
- `tasks.md` — `T-<FASE>-NNN`.
- `kickoff.md` — checklist de pré-condições (PRDs stable, ADRs aceitas, auditoria pré-Fase concluída, subagentes convocados). Ver `templates/kickoff-fase.template.md` (§7 inclui critério PASS ZERO de fechamento).
- `retrospectiva.md` — pós-marco: acertos, erros, ajustes ao ritual.
- `auditoria-saida.md` — auditoria antes de fechar a fase.

**Distinção Foundation vs Fase (exemplos concretos):**

| Item | Foundation ou Fase? | Por quê |
|---|---|---|
| Multi-tenant base (RLS, isolation) | F-A | Transversal. Sem ela, nada com `tenant_id` funciona. |
| Auth/RBAC | F-B | Transversal. Sem ela, nenhum endpoint protegido funciona. |
| Observabilidade (logs/métricas/traces) | F-C | Transversal. Sem ela, prod opera no escuro. |
| Cadastro de cliente | F-1 | Módulo de produto. Visível pro usuário. |
| Emissão de NF-e | F-1 | Módulo. Tem auditor de Produto + auditor fiscal. |
| Tela de financeiro | F-2 | Módulo. Depende de F-1 (cliente, NF-e). |

### 🟡 `docs/faseamento/auditorias/`
- Auditorias transversais (ex: "10 lentes pré-Fase 1").
- Cada uma: data, lentes aplicadas, achados (CRÍTICO/ALTO/MÉDIO/BAIXO/CONCERN), plano de conserto.

### 🟡 `docs/canceladas/`
- Pasta append-only com registro de Stories canceladas (ver §14.10.2).
- 1 arquivo por cancelamento: `YYYY-<MOD>-NNN.md` com razão, data, decisor, dependências bloqueadas.
- Nunca apagar; histórico de aprendizado de churn.
- `auditor-meta` cruza com `docs/dominios/.../spec.md status: cancelled` para detectar Story criada e cancelada sem nenhum commit (churn indicator).

---

## 8. Camada C6 — Conformidade (CONDICIONAL — só se regulado)

Pasta: `docs/conformidade/`

### 🔵 `lgpd/` (privacidade — Brasil)
- `bases-legais.md` — pra cada campo PII: base legal (consentimento/contrato/legítimo interesse/obrigação legal/cumprimento de política pública/proteção da vida/tutela da saúde/proteção do crédito/dados manifestamente públicos).
- `ropa.md` — **Record of Processing Activities** (Art. 37 LGPD, obrigatório): registro máquina-legível de operações de tratamento (finalidade, dados, base legal, prazo, compartilhamento).
- `matriz-retencao.md` — campo × prazo × justificativa legal. Conflito: prevalece o **mais longo** (mas declarar tensão com direito ao esquecimento).
- `canal-titular.md` — como titular exerce direitos (acesso/correção/eliminação/portabilidade/oposição/revisão de decisão automatizada).
- `ripd-template.md` — Relatório de Impacto à Proteção de Dados (Art. 38).
- `plano-resposta-incidente.md` — matriz de notificação à ANPD (prazo razoável ~2 dias úteis). Detecção → contenção → análise → comunicação → remediação.
- `crypto-shredding.md` — apaga dado por destruição de chave KMS sem violar WORM (auditoria fiscal exige guardar; LGPD exige esquecer; chave destruída = dado ilegível mas registro fiscal preservado).
- `cookies-consent.md` — categorias (essencial/analítico/marketing), finalidade declarada, mecanismo de revogação.
- `dados-criancas.md` — tratamento especial (Art. 14 LGPD).

### 🔵 `gdpr/` (privacidade — UE)
- Equivalentes ao LGPD + `tia-template.md` (Transfer Impact Assessment pós-Schrems II) + `dpa-template.md` (Data Processing Agreement Art. 28).

### 🔵 `comum/`
- `dpo-encarregado.md` — papel, contato público, RACI (Art. 41 LGPD / Art. 37 GDPR).
- `retencao-matriz.md` — tabela única que cruza retenção fiscal × privacidade × setorial. **Template:** [`templates/retencao-dados.template.md`](./templates/retencao-dados.template.md).

### 🔵 `ia/` (se produto usa IA — ESPECIALMENTE LLM)
- `ia-act-classificacao-risco.md` — classificação UE (proibido / alto risco / risco limitado / risco mínimo) e justificativa.
- `model-cards/` — uma model card por modelo usado (próprio ou de terceiro), formato Anthropic/Google.
- `datasheets/` — datasheet por dataset de treino/avaliação.
- `avaliacao-vies.md` — métricas de fairness por grupo demográfico (quando aplicável).
- `decisao-automatizada-auditavel.md` — trilha de explicação obrigatória (LGPD Art. 20 / GDPR Art. 22).
- `prompt-versioning.md` — versionamento de prompts críticos.
- `evals/` — golden tests, benchmarks, drift monitoring.

### 🔵 `fiscal/` (se emite NF ou calcula impostos)
- Por país/região: regras, layouts, prazos de envio.

### 🔵 `acessibilidade/`
- `wcag-checklist.md` — checklist por tela (WCAG 2.2 AA padrão).
- `declaracao-acessibilidade.md` — declaração pública (exigido EAA UE 2025+, LBI 13.146 Brasil, ADA EUA).

### 🔵 `setoriais/` (ISO/HIPAA/PCI-DSS/SOC2/NIS2/SOX/PSD2/Bacen/CVM/Anvisa)
- 1 arquivo por norma aplicável: `<norma>.md` com cláusulas, evidências necessárias, ciclo de auditoria.
- Normas frequentes a documentar:
  - `iso-27001.md` (SGSI internacional)
  - `iso-27701.md` (extensão privacidade)
  - `soc2.md` (Trust Service Criteria — Type I/II)
  - `pci-dss.md` (cartão)
  - `hipaa.md` (saúde EUA)
  - `nis2.md` (UE — cybersecurity de setor essencial/importante)
  - `sox.md` (financeiro EUA — controles internos)
  - `psd2.md` / `open-banking.md`
  - `bacen-cvm.md` (financeiro Brasil)
  - `anvisa.md` (saúde Brasil)
  - `marco-civil-internet.md` (BR — guarda de logs)

### 🔵 `lgpd-equivalentes/` (se atende usuários fora do BR/UE)
- `pdpa-singapura.md`, `popia-africa-do-sul.md`, `nlpd-suica.md`, `lei-25326-argentina.md`, `ccpa-california.md`.

---

## 9. Camada C7 — Governança e auditoria

Pasta: `docs/governanca/`

### 🟢 `raci.md`
- Tabela `Atividade | Responsável | Aprovador | Consultado | Informado`.
- Inclui papel de **DPO/Encarregado** se houver dados pessoais.

### 🟢 `limites-agente-ia.md`
- **O que IA NÃO pode fazer sozinha (exige humano):**
  - Deletar dados de produção.
  - Rotacionar credencial (qualquer secret real).
  - Abrir gasto (assinar SaaS, comprar domínio, subir plano pago).
  - Mudar visibilidade de repo (público↔privado).
  - `npm publish` / `pypi upload` / `cargo publish` — depende de credenciais pessoais.
  - `git push --force` em main; `git reset --hard` em branch remota.
  - Editar `CODEOWNERS`.
  - Editar `.github/workflows/` (pipelines são rede de segurança).
  - Editar `REGRAS-INEGOCIAVEIS.md` (fonte única; mudança exige humano + ADR).
  - Adicionar dependência nova sem aprovação do `auditor-supply-chain` + task `T-SUPPLY-CHAIN-NNN`.
  - Rodar schema migration em produção (exige marker `MIGRATE-PROD-APPROVED-<data>`).
  - Alterar schema de banco fora de `migrations/` (SQL direto = data loss; hook `schema-mutation-direct` bloqueia).
  - Operações que exigem 2FA pessoal.
- **O que IA pode fazer autonomamente (e DEVE — não pedir permissão):**
  - Editar/criar arquivos, configs, docs, memórias.
  - Criar releases/tags via `gh release create` (não-destrutivo, reversível).
  - Abrir issue/PR via `gh issue create`, `gh pr create`; comentar PRs.
  - `git push origin main` em fast-forward (com pre-commit verde).
  - Rodar testes, lint, build, type-check.
  - Aplicar correções identificadas em auditoria.
  - Continuar pro próximo passo lógico de qualquer sequência iniciada.
- **Critérios de escalação pra humano:** ver §14.12 (sinais que fluxo quebrou).
- **Solo dev:** cool-down de 24h aplica APENAS a override de CRÍTICO/ALTO. Override de MÉDIO em solo: aprovação imediata com registro automático no ledger basta (Roldão não-técnico não consegue avaliar tecnicamente todo MÉDIO; cool-down vira gargalo sem ganho real). Proposta CRÍTICO/ALTO abre Issue `[COOL-DOWN-24H]` em T0; hook bloqueia `# ritual-gate: skip` em commit sem Issue de >24h. Ledger referencia o link da Issue.

### 🟢 `politica-commits.md`
- Atômicos. Mensagem: formato livre vs Conventional Commits — decidir.
- Co-Authored-By obrigatório se IA gerou.
- Lista de flags proibidas: `--no-verify`, `--no-gpg-sign`, `--force` em main, `--skip-*`, `--ignore-*`.

### 🟢 `overrides-ledger.md` (append-only)
- Toda ocorrência de `# ritual-gate: skip` é registrada aqui automaticamente por hook.
- Formato: `data | autor | commit-sha | motivo | caducidade (+14d) | resolução`.
- Auditor mensal cobra overrides vencidos sem resolução.

### 🟢 `catalogo-auditores.md`
- Apenas **índice/tabela** que linka para `.claude/agents/auditor-*.md` (a fonte é o prompt versionado em `.claude/agents/`, não duplica aqui).
- Pra cada auditor: nome, versão, severidade, escopo, aplica-em (tipos de projeto), taxa histórica de achados (preenchido por `auditor-meta`).
- **Template:** [`templates/catalogo-auditores.template.md`](./templates/catalogo-auditores.template.md).

### 🟢 `registro-de-riscos.md`
- Linha-por-achado **BAIXO em aberto**: ID do achado, descrição curta, owner, TTL (data-limite para revisitar), status.
- PASS ZERO exige zero achados CRÍTICO/ALTO/MÉDIO em aberto — BAIXO pode ficar aberto com TTL aqui.
- Auditor mensal (`auditor-meta` ou cobrança manual no ritual de marco) varre TTLs vencidos e força reclassificação ou fechamento.
- Caminho: `docs/governanca/registro-de-riscos.md`. Sem template dedicado — formato tabular simples (ID | descrição | owner | aberto-em | TTL | gatilho-de-reavaliação | status).

### 🟢 Auditores ativos (catálogo canônico)

**Cobertura base (sempre rodam em projeto não-experimental):**

1. **`auditor-seguranca`** — SEC-*, INV-TENANT-*. CRÍTICO/ALTO.
2. **`auditor-qualidade`** — TST-*, cobertura, mascaramento de teste. ALTO/MÉDIO.
3. **`auditor-produto`** — AC binários, non-goals, glossário. ALTO/MÉDIO. *(Só em Fase de produto, não em Foundation.)*
4. **`auditor-doc-quality`** — três regras unificadas: (a) frontmatter staleness >90 dias / pendência feita / drift textual, (b) ADR superseded com referências literais não-removidas (substitui `auditor-cascata-substituicao`), (c) `TBD|preencher|TODO|FIXME|XXX|<!-- ` em docs `status: stable` (substitui `auditor-conteudo-placeholder`). MÉDIO/FAIL. **IDs no relatório:** cada sub-regra gera ID distinto (`DOC-QUAL-A-NNN`, `DOC-QUAL-B-NNN`, `DOC-QUAL-C-NNN`) — usar a letra da sub-regra para rastrear achados; o auditor é uno, os achados são separáveis.
5. **`auditor-llm-correctness`** — docstring que mente, `Any` de fuga, código órfão de US. MÉDIO. *(Roda na camada 2a do §14.5 junto com `auditor-performance`.)*
6. **`auditor-performance`** — N+1, timeout, rate-limit, query sem index. ALTO/MÉDIO.
7. **`auditor-observabilidade`** — trilha auditável, tenant_id/correlation_id em todo log. ALTO.
8. **`auditor-idempotencia`** — POST sem `Idempotency-Key`, consumer sem replay protection. ALTO.
9. **`auditor-supply-chain`** — dep nova sem justificativa, sem pin, SBOM ausente, SHA pin de actions/imagens. ALTO.
10. **`auditor-lgpd`** — PII sem base legal, endpoint expõe PII, ROPA desatualizada. CRÍTICO.
11. **`auditor-acessibilidade`** — WCAG 2.2 AA por tela (alt, contraste, foco visível, ARIA, navegação por teclado). ALTO em B2C/B2B com UI; CONSULTIVO em CLI/biblioteca.
12. **`auditor-pii-em-logs`** — regex de CPF/email/cartão/JWT em logs, telemetria, traces, mensagens 5xx. CRÍTICO em qualquer projeto que trate dado pessoal (complementa `auditor-lgpd` que olha endpoint, não log).
13. **`auditor-schema-evolution`** — migration que faz `DROP COLUMN`, `ALTER TYPE` incompatível, mudança de PK sem `expand/contract`, sem rollback testado. CRÍTICO se houver consumidor externo.
14. **`auditor-cost-finops`** — query sem `LIMIT` + index, chamada LLM sem `max_tokens`, loop emitindo eventos sem batch, sem orçamento por tenant. MÉDIO em SaaS; CONCERN em CLI.
15. **`auditor-meta`** — lint dos próprios prompts de auditores (template seguido, severidade declarada por ID, golden cases POSITIVO+NEGATIVO obrigatórios, versão bate com catálogo, taxa de FAIL/CONCERN não-zero em 3 marcos). ALTO no fechamento de fase.

**Auditores de código (rodam no `/review` e em CI):**

16. **`auditor-test-determinism`** — testes que usam `Date.now()`, `Math.random()`, `setTimeout` ou `process.env` sem mock; ordem-dependência entre testes. ALTO.
17. **`auditor-error-handling`** — catch sem log, exception engolida silenciosamente, erro genérico sem contexto, `try {} catch {}` vazio. ALTO.
18. **`auditor-api-versioning`** — endpoint removido sem período de deprecação, breaking change em schema público, descontinuação não-documentada. CRÍTICO se há consumidor externo.
19. **`auditor-migration-reversibility`** — migration forward sem rollback testado, script de reversão manual, filename sem data/contexto. CRÍTICO.
20. **`auditor-dependency-freshness`** — deps diretas >2 anos sem update, deprecation warnings em build, `npm audit`/`pip audit` não-zerado. MÉDIO.
21. **`auditor-i18n`** — chave presente em `en.json` ausente em `pt-BR.json`, fallback de locale ausente, formato de data/número não-localizado. ALTO em produto multi-locale.
22. **`auditor-architecture-fit`** — função >200 linhas, nesting >4 níveis, complexidade ciclomática >10, ciclos de import entre módulos. MÉDIO.
23. **`auditor-documentation-coverage`** — módulo novo sem README, função exportada sem docstring, classe pública sem tipos. MÉDIO.
24. **`auditor-cli-help`** — comando novo sem `--help`, alias não-documentado, exit code não-zero sem mensagem de erro. MÉDIO em CLI/dev tool.
25. **`auditor-changelog-completeness`** — release sem entrada no CHANGELOG, breaking change não-sinalizada. ALTO no `/release`.
26. **`auditor-overrides-expired`** — varre `overrides-ledger.md`; flagra override com `TTL+14d` vencido e sem resolução. ALTO mensal.
27. **`auditor-mcp-staleness`** — entrada em `.mcp.json` sem uso há >75 dias (aviso) ou >90 dias (auto-disable proposto). MÉDIO.

**Auditores condicionais por tipo (ativados via ADR):**

- `auditor-gdpr` — TIA, base legal Art.6, DPIA. (Se atende UE.)
- `auditor-ia-act` — classificação de risco, model card presente, decisão automatizada explicável. (Se produto usa IA na UE.)
- `auditor-hipaa` — (Se saúde EUA.)
- `auditor-pci-dss` — (Se processa cartão.)
- `auditor-soc2` — (Se busca certificação.)
- `auditor-ropa-completeness` — Art. 37 LGPD, varre operações vs registro. (Se trata dado pessoal.)
- `auditor-dpa-terceiros` — todo fornecedor com DPA assinado e TIA quando fora do país. (Se trata dado pessoal com terceiros.)
- `auditor-incident-readiness` — plano resposta presente, contatos atualizados, drill <90 dias. (Se SaaS prod.)

### 🟢 `auditor-TEMPLATE.md` (template canônico)

Todo auditor segue este formato — ver [`templates/auditor.template.md`](./templates/auditor.template.md).

### 🟢 Subagentes humano-substitutos

Pasta: `.claude/agents/` (ver Camada C9 para estrutura técnica).

| Subagente | Quando invocar |
|---|---|
| `tech-lead` | Decisão que adiciona/altera modelo, migration, API, fluxo técnico não-trivial. |
| `especialista-juridico` | Decisão que toca privacidade, contrato, regulatório. |
| `especialista-risco-seguros` | Decisão que altera fluxo financeiro, exposição cyber, integração com terceiro pago. |
| `especialista-dominio` | Decisão que toca regra do setor de negócio (regulado: norma X; jogo: balanceamento; ML: viés do modelo). Termo "domínio" = setor; ver glossário. |
| `ux-designer` | Tela, fluxo de usuário novo, copy crítico, microcopy de erro/empty state, design system. |
| `devops-sre` | ADR de deploy, runbook novo, mudança de RTO/RPO, observabilidade, on-call. |
| `data-engineer` | ETL, esquema analítico, retenção, particionamento, evento canônico de volume alto. |
| `especialista-ia-llm` | Decisão sobre prompt, modelo, eval, custo de token, agente novo, MCP novo. |
| `qa-engineer` | Plano de teste de US complexa, definição de E2E, estratégia mock vs contract test, golden cases. |
| `security-engineer` | Mindset red-team (distinto de `tech-lead` compliance): toda mudança de authn/authz/criptografia/permissões, threat model, penetration-test mindset. |
| `accessibility-specialist` | A11y dedicado (separado de `ux-designer`): WCAG 2.2 AA+, ARIA, keyboard nav, screen-reader compat. |
| `release-manager` | Pre-release: checklist de release, backward compat, rollback plan, staged rollout, SLA de comunicação. |

**Critério de pertinência por escopo (resolve "subagentes pertinentes" no fluxo §14):**

| Escopo da decisão | Subagentes mínimos |
|---|---|
| Toca regra de negócio ou modelo de dados | tech-lead + especialista-dominio |
| Toca endpoint/UI/fluxo (com UI) | tech-lead + ux-designer (+ accessibility-specialist se tela nova) |
| Toca terceiro pago ou cadeia de suprimento | especialista-risco-seguros |
| Toca privacidade/base legal/contrato | especialista-juridico |
| Toca LLM/agente/prompt | especialista-ia-llm |
| Toca operação/SLA/observabilidade | devops-sre |
| Toca schema/migração | tech-lead (obrigatório) |
| Toca teste de caso complexo | qa-engineer |
| Toca authn/authz/criptografia | security-engineer |
| Pre-release | release-manager + qa-engineer |
| Nenhum critério acima aplica | apenas tech-lead (mínimo) |

**Critério de invocação por etapa do Spec Kit:**

| Etapa | Auditores | Subagentes |
|---|---|---|
| `/specify` (escrever Story) | NÃO (auditor-produto consultivo no final) | NÃO |
| `/plan` (plano sem código) | base (segurança, produto) | Todos pertinentes ao escopo |
| `/tasks` | NÃO | NÃO |
| `/implement` | NÃO (hooks rodam) | NÃO |
| `/review` (code review pós-implementação) | TODOS base + de código (test-determinism, error-handling, etc.) | qa-engineer, security-engineer |
| `/release` (pre-release) | `changelog-completeness`, `api-versioning`, `dependency-freshness` | release-manager |
| Criação de ADR | Base | Todos pertinentes |
| Criação de PRD | Observabilidade, performance | tech-lead, ux-designer, especialista-dominio |

**Saídas de subagente:** APROVADO / RESSALVAS / REPROVADO. Output vira `docs/dominios/.../revisoes/<US-ID>-<agente>.md` com frontmatter `{revisao-de, agente, resultado, timestamp, opiniao-nao-vinculante}` (ver `templates/revisao.template.md`).

- **APROVADO:** segue.
- **RESSALVAS:** segue + abre task de acompanhamento; não bloqueia.
- **REPROVADO:** bloqueia até consertar.
- **2 REPROVADOs pelo MESMO subagente sobre o MESMO ponto** = escalação humana automática (issue com label `escalacao-urgente`, timeout 48h, decisão: override / re-spec / matar Story).

**Disputa humano × subagente:** quando humano dono discorda de REPROVADO, segue procedimento de 14.3.1 (Disputa).

**Aviso CRÍTICO:** subagente especialista é Claude com prompt — sem RAG legal/financeiro real. Saída vai marcada como `opiniao-nao-vinculante: true`. Parecer humano licenciado obrigatório antes de prod.

---

## 10. Camada C8 — Operação e Segurança

### Pasta `docs/operacao/`

- 🟢 `setup-local.md` — instalar dependências, subir banco, primeiro `make run`.
- 🟡 `runbooks/` — 1 arquivo por procedimento operacional (subir/derrubar, rollback, backup, restore).
- 🟡 `incidentes/` — post-mortems (template fixo: o que houve, impacto, causa raiz, ações corretivas, prevenção).
- 🟡 `marcos-revertidos/` — registro append-only de marcos fechados que precisaram ser revertidos (ver §14.10.3). 1 arquivo por reversão: `YYYY-MM-DD-<marco>.md` com motivo, diff de escopo reaberto, novo PASS ZERO atingido. Nunca apagar.
- 🟡 `slo-sli.md` — pra cada serviço crítico: SLI (medida), SLO (meta), error budget (orçamento de falha). Política de queima de error budget. **Template:** [`templates/slo-sli.template.md`](./templates/slo-sli.template.md).
- 🟡 `incident-severity-matrix.md` — SEV1-SEV4 + tempos de resposta + escalation.
- 🟡 `capacity-planning.md` — dimensionamento por carga prevista, escala horizontal, custos.
- 🟡 `backup.md` — política de backup: o que é copiado, frequência, retenção, criptografia, testes de restore. **Template:** [`templates/backup.template.md`](./templates/backup.template.md).
- 🔵 `dr-backup.md` — disaster recovery: RTO, RPO, drill de restore (data do último). **Template:** [`templates/disaster-recovery.template.md`](./templates/disaster-recovery.template.md).
- 🟡 `on-call.md` — escala on-call, contatos primário/secundário, escalation path, SLA de acknowledge. **Template:** [`templates/on-call.template.md`](./templates/on-call.template.md).
- 🟡 `change-management.md` — fluxo de mudança em produção (janela de manutenção, communication plan, rollback, aprovações). **Template:** [`templates/change-management.template.md`](./templates/change-management.template.md).

### Pasta `docs/seguranca/`

- 🟢 `modelo-ameacas.md` — STRIDE por componente crítico. Pode complementar com PASTA/DREAD/OCTAVE quando útil. **Gatilho:** cada ADR de componente novo gera entrada nova aqui.
- 🟡 `politica-mcp.md` — lista de MCP servers aprovados, auth obrigatória, auditoria de servidor novo, secret rotation pros tokens MCP, TTL de 90 dias por entrada (auditor-mcp-staleness flagra >75d).
- 🟢 `supply-chain.md` — política de deps novas (justificativa + CVE check), pin de versões, SHA pin de actions/imagens.
- 🟢 `sbom.md` — Software Bill of Materials gerado por release (CycloneDX ou SPDX). Atualização automática em CI.
- 🟡 `slsa.md` — nível de SLSA declarado (1-4). Atestações de build.
- 🟡 `release-signing.md` — assinatura de releases via Sigstore/cosign.
- 🟢 `rotacao-segredos.md` — pra cada secret: onde mora, cadência de rotação, último drill.
- 🟡 `secrets-tooling.md` — tooling (Vault / AWS Secrets Manager / Doppler / 1Password). Critério de escolha.
- 🟡 `gitleaks-historico.md` — detecção de secret leak em histórico completo do git, não só pre-commit.

---

## 11. Camada C9 — Harness do agente IA

> **Quebrada em** **C9a portátil** (vale em qualquer harness e em CI) + **C9b específica do harness** (Claude/Cursor/Windsurf/Codex/Kiro). Regra crítica deve cair em C9a, não em C9b — C9b é UX (feedback imediato pro agente), não garantia.

### Camada C9a — Portátil (universal)

#### 🟢 `AGENTS.md` (raiz — já criado em C0)
Fonte canônica que TODO harness lê. Não duplique conteúdo entre AGENTS.md e configs específicas.

#### 🟢 Pre-commit git (`.pre-commit-config.yaml` ou `lefthook.yml` ou `husky/`)
- Ferramenta: pre-commit (Python) ou lefthook (Go) ou husky+lint-staged (Node) — decidir em ADR.
- Roda **independentemente do harness**: mesmo dev que esqueceu de configurar Claude Code cai aqui.
- Hooks obrigatórios (núcleo):
  - `block-destructive` — bloqueia `rm -rf /`, `drop database`, `git push --force`.
  - `secrets-scanner` — regex de chaves AWS/GCP/Stripe/Anthropic/OpenAI/JWT.
  - `frontmatter-validator` — bloqueia doc novo sem frontmatter ou com `stable` + `revisado-em` >90 dias.
  - `anti-mascaramento` — bloqueia `assert True`, `pytest.skip` sem motivo, `# type: ignore` solto, `@ts-ignore`, `eslint-disable` sem justificativa.
  - `override-ledger` — toda ocorrência de `# ritual-gate: skip` é appendada em `docs/governanca/overrides-ledger.md` com TTL 14d (canônico).
- Hooks obrigatórios (extensão — protegem incidentes comuns):
  - `large-file-blocker` — bloqueia commit com arquivo >5MB (binários acidentais, deps grandes).
  - `merge-conflict-marker` — bloqueia commit com `<<<<<<<`, `=======`, `>>>>>>>` no staged.
  - `lockfile-tampering` — bloqueia edição manual de `package-lock.json`, `poetry.lock`, `Gemfile.lock`, `Cargo.lock` (forçar reinstalação via gerenciador).
  - `migration-direction` — migration que faz `DROP TABLE/COLUMN/SCHEMA` ou `ALTER TYPE incompatível` sem tag `-- REQUIRE-REVIEW` é bloqueada até aprovação humana.
  - `env-file-leak` — bloqueia commit de `.env*`, `*.key`, `*.pem`, `*.pfx`, `*.p12`, `credentials.json`.
- **Orçamento de tempo:** total ≤ 15s no caminho rápido. Hooks pesados rodam em CI.

#### 🟢 CI/CD (`.github/workflows/quality-gates.yml` ou equivalente)
- Roda os **mesmos** `_test-runner.sh` que pre-commit (garantia se dev pulou).
- SHA pin em todas as actions (não tag mutável).
- Artefatos: SBOM, relatório de auditores, cobertura.

#### 🟢 `.mcp.json` (já criado em C0)

#### 🟡 `scripts/agent-brief.sh` (ou `make agent-brief`)
- Consolida as 6 leituras obrigatórias do início de sessão (14.2) num único output. Agente roda 1 comando e tem briefing completo.

### Camada C9b — Específica do harness

> Cada harness tem sua estrutura. Use **só a do harness em uso**; não crie diretórios de harnesses que não vai usar.

#### Claude Code (`.claude/`)

- 🟢 `.claude/settings.json` (versionado) + `.claude/settings.local.json.example` (por-dev, `.gitignore`).
  - Permissões (allow/deny por ferramenta).
  - Hooks (PreToolUse, PostToolUse, UserPromptSubmit, SessionStart, Stop, SubagentStop, PreCompact, Notification).
  - Modelo padrão, `additionalDirectories`, `apiKeyHelper`, `env`.
  - **Template:** [`templates/settings.template.json`](./templates/settings.template.json).
- 🟢 `.claude/hooks/` — 1 hook por arquivo `.sh`. `_test-runner.sh` com fixtures POSITIVO/NEGATIVO obrigatórias. **Orçamento:** PreToolUse <300ms. **Template:** [`templates/hook-block-destructive.template.sh`](./templates/hook-block-destructive.template.sh).
- 🟢 `.claude/agents/` — subagentes (humano-substitutos E auditores) em `.md`. Frontmatter: `name`, `description`, `tools`, `model`, `version`. Bump em mudança de prompt.
- ⚪ `.claude/commands/` — slash commands. Criar quando padrão repete 3x.
- ⚪ `.claude/skills/<nome>/SKILL.md` — habilidades reutilizáveis (Anthropic Skills). Frontmatter Anthropic + `scripts/` + `references/`.
- ⚪ `.claude/rules/` — regras com `paths:` no frontmatter (lazy load por caminho).
- 🟢 `.claude/output-styles/` — *(reclassificada 🟢 quando humano é não-técnico)*. Tom canônico: PT-BR, sem emoji, tradução de jargão obrigatória.
- 🟡 `.claude/evals/` — golden tests + A/B prompts para auditores e subagentes críticos. Bump de versão exige rodar evals da versão anterior.

#### Cursor (`.cursor/`)
- `.cursorrules` (raiz) = adendo curto.
- `.cursor/rules/*.mdc` — regras por path (frontmatter `globs:`).
- `.cursor/commands/` — slash commands.

#### Windsurf (`.windsurf/`)
- `.windsurfrules` (raiz) = adendo.
- Workflows (Cascade).

#### Codex CLI
- Lê `AGENTS.md` na raiz. Sem hooks nativos (cair em pre-commit git + CI).

#### Kiro (`.kiro/`)
- `.kiro/steering/` — equivalente a rules.

### 🟢 Matriz multi-harness

Resumo da compatibilidade — ver [`matriz-harness.md`](./matriz-harness.md) para tabela completa.

| Recurso | Claude Code | Cursor | Windsurf | Codex CLI | Kiro |
|---|---|---|---|---|---|
| Hooks de tool | ✓ | ✗ | parcial | ✗ | ✗ |
| Subagentes | ✓ | ✗ | ✗ | ✗ | parcial |
| Skills | ✓ (Anthropic) | ✗ | ✗ | ✗ | ✗ |
| Commands | ✓ | ✓ | ✓ | parcial | ✓ |
| Rules por path | `.claude/rules/` | `.cursor/rules/*.mdc` | `.windsurfrules` | `AGENTS.md` | `.kiro/steering/` |
| MCP | ✓ | ✓ | ✓ | parcial | ✓ |

**Implicação:** regra crítica vai em C9a (pre-commit git + CI) — universal. C9b é UX, não rede de segurança.

---

## 12. Camada C10 — Convenções e índice

### 🟢 `docs/CONVENCOES-DOC.md`
**Política de nomenclatura canônica:**

- **Idioma de arquivo:** PT-BR por padrão. EN apenas para siglas universais (ADR, RACI, README, LICENSE, CHANGELOG, CODEOWNERS, SECURITY, SUPPORT, CODE_OF_CONDUCT) ou jargão técnico sem tradução estabelecida (registrar no glossário).
- **Caso:**
  - **Exceção declarada — documentos de contrato/governança na raiz** usam `UPPER-KEBAB` ou `UPPER_SNAKE`: `README.md`, `AGENTS.md`, `CLAUDE.md`, `MEMORY.md`, `CURRENT.md`, `REGRAS-INEGOCIAVEIS.md`, `CONVENCOES-DOC.md`, `INDICE.md`, `CHECKLIST-PRONTO-PRA-CODAR.md`, `GLOSSARIO-ROLDAO.md`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `CODEOWNERS`, `LICENSE`, `ONBOARDING.md`, `CONTRIBUTING.md`. **Demais arquivos** (conteúdo dentro de `docs/`, templates, runbooks, post-mortems) usam **`kebab-case-lowercase.md`**.
  - Pastas: sempre `kebab-case`.
- **Acentuação:** PROIBIDA em nomes de arquivo, pasta, ID e nome de agente. Conteúdo do arquivo é PT-BR com acentos normais. (Justificativa: portabilidade Windows/macOS/Linux + filesystems case-sensitive/insensitive.)
- **Formato de ID:** `<PREFIXO>-<ESCOPO>-NNN` com hífens entre todos os segmentos e zero-padding em 3 dígitos. Exceção declarada: `ADR-NNNN` (4 dígitos, convenção de mercado).
- **Lista canônica de prefixos de ID:**
  - `US-<MOD>-NNN` — User Story
  - `AC-<MOD>-NNN-N` — Acceptance Criterion
  - `T-<MOD>-NNN` ou `T-<FASE>-NNN` — Task
  - `INV-NNN`, `INV-TENANT-NNN`, `INV-AGENT-NNN` — Invariantes
  - `SEC-NNN` — Regra de segurança
  - `TST-NNN` — Regra de teste
  - `OBS-NNN` — Regra de observabilidade
  - `DAT-NNN` — Regra de dados / governança de dados
  - `OPS-NNN` — Regra de operação
  - `LEG-NNN` — Regra legal / compliance
  - `R-NNN` — Risco
  - `EE-NNN` — Entrevista de Exploração (Descoberta)
  - `ADR-NNNN` — Decisão arquitetural (4 dígitos)
  - `GATE-<NOME>-N` — Gate de validação
  - `D-NNN` — Decisão fundadora (em `AGENTS.md`)
- **Como linkar entre docs:** sempre relativo (`../glossario.md`, nunca URL absoluta interna).
- **TODO/FIXME:** sempre com data ISO e dono: `<!-- TODO 2026-05-27 @roldao: ... -->`.
- **Auditor que valida nomenclatura:** `auditor-doc-quality` (sub-regra a — drift de frontmatter / referências quebradas / nomenclatura inconsistente).

### 🟢 `docs/INDICE.md` (sitemap navegável)
- Árvore de pastas com 1 linha de descrição cada.
- Atualizado a cada doc novo (`auditor-doc-quality` sub-regra a cobra).

### 🟢 `docs/documentos-do-projeto.md`
- Tabela: `Caminho | Status | Owner | Última revisão | Bloqueia?`.
- Útil pra ver de longe quanto está `draft` vs `stable`.

### 🟢 `docs/nao-aplica.md`
- Lista de camadas/artefatos do método que NÃO existem neste projeto e o porquê.
- Sem isso, auditor de drift reclama de cada arquivo ausente.

### 🔵 `docs/upgrade/` (CONDICIONAL — só se projeto saiu do modo enxuto)
- Pasta usada quando projeto que começou em **modo enxuto** (§14.15) cresce (passou 4 semanas / 2+ devs / virou regulado) e precisa criar **retroativamente** camadas pulladas.
- Conteúdo: 1 doc por camada promovida (`C1-discovery.md`, `C3-arquitetura.md`, etc.) explicando o que foi reconstituído, com que evidência, e qual o gap aceito.
- Estrutura comum: tabela `Camada | Artefato faltava | Reconstituído? | Evidência | Gap remanescente`.
- Sem essa pasta, salto de enxuto → completo deixa cratera de débito invisível.

---

## 13. Camada C11 — Estado vivo

### 🟢 `.claude/memory/constitution.md` (versionado no repo, único por projeto)
- **Princípios fundadores** que NUNCA mudam: missão, valores não-negociáveis do produto, postura ética, restrições legais permanentes.
- **Tamanho:** ≤80 linhas. Mudança requer ADR explícita + consenso de todos os subagentes pertinentes.
- Lido **primeiro** toda sessão (ver §14.2).
- Para harnesses sem suporte a `.claude/`, replicar em `.agent/constitution.md` e referenciar em `AGENTS.md`.
- **Template:** [`templates/constitution.template.md`](./templates/constitution.template.md).

### 🟢 `.agent/CURRENT.md` (versionado no repo)
- O que está em foco AGORA (1-2 parágrafos).
- Atualizado **toda sessão que muda foco**.
- Lido logo após `constitution.md` toda vez que um agente entra.
- Auditor mensal cobra atualização (>30 dias sem mexer = STALE). *(staleness de doc — não confundir com TTL de override de 14 dias.)*
- **Template:** [`templates/CURRENT.template.md`](./templates/CURRENT.template.md).

### 🟢 `MEMORY.md` no harness (FORA do repo — local-do-usuário)
- Caminho exato em Claude Code (Linux/macOS): `~/.claude/projects/<projeto>/memory/MEMORY.md`.
- Caminho exato em Claude Code (Windows): `%USERPROFILE%\.claude\projects\<projeto>\memory\MEMORY.md`.
- **NÃO versionado** — é por máquina/usuário.
- Índice de memórias persistentes do agente (fatos do usuário, do projeto, referências externas).
- **Política de poda:** cap em 1500 linhas. Excedeu → sumarização obrigatória em `MEMORY-archive-YYYY-QN.md` no mesmo diretório.
- **Política de freshness:** memória citando "função X em arquivo Y" deve ser verificada antes de uso (regra global do CLAUDE.md do Roldão).

### 🟡 `.agent/decisoes-do-dia.md` (opcional)
- Diário curto de decisões tomadas na sessão atual (não-persistente entre sessões).

---

## 14. Fluxo de trabalho completo — o ritual

> Esta seção descreve COMO o trabalho acontece depois que a estrutura existe. Não confunda com a estrutura em si (Seções 2-13 / Camadas C0-C11).

### 14.1 Visão macro

```
   DISCOVERY (C1)
          ↓
   ADRs aceitas (C2)  ←──── subagentes especialistas opinam
          ↓
   FASEAMENTO (Foundations + Fases + Marcos — C5)
          ↓
   ┌────────────────────────────────────────┐
   │  RITUAL POR STORY (Spec Kit)           │
   │  /specify → /plan → /tasks → /implement│
   │       ↑              ↓                 │
   │       └── loop até PASS ZERO C/A/M ────┤
   └────────────────────────────────────────┘
          ↓
   MARCO FECHADO → atualiza AGENTS.md §ADRs + §Pendências + retrospectiva
          ↓
   GATEs BAIXO (carryover) rastreados → próxima Fase
```

### 14.2 Início de sessão — leitura obrigatória

Toda sessão começa lendo, **nesta ordem**:

```
1. .claude/memory/constitution.md    (princípios fundadores; ver C11)
2. REGRAS-INEGOCIAVEIS.md            (INV-*, SEC-*, TST-*, OBS-*, DAT-*, OPS-*, LEG-*)
3. .agent/CURRENT.md                 (foco AGORA)
4. AGENTS.md                         (canônico produto/arquitetura)
5. CLAUDE.md / .cursorrules / etc.   (adendo do harness em uso)
6. docs/dominios/<dom>/modulos/<mod>/ (spec do módulo em foco)
```

> Se algum arquivo da lista ainda não existir (projeto em construção), pule silenciosamente. Não interrompa para perguntar.

**Atalho:** `scripts/agent-brief.sh` (ou `make agent-brief`) consolida tudo num único output.

### 14.3 Criação de documento novo (PRD / Spec / ADR)

```
Humano pede ou agente identifica gap
            ↓
Identificar tipo (PRD / ADR / Spec / outro)
            ↓
Criar arquivo com frontmatter obrigatório (owner / revisado-em / status: draft)
            ↓
Convocar subagentes pertinentes pela tabela "Critério de pertinência por escopo"
em C7 (NÃO chamar todos — só os do escopo)
            ↓
Cada um retorna APROVADO | RESSALVAS | REPROVADO
Parecer → docs/.../revisoes/<US-ID>-<agente>.md
            ↓
LOOP até zero REPROVADOS
   ↳ 2 reprovações pelo MESMO subagente sobre o MESMO ponto
     = escalação humana automática (14.3.1)
            ↓
Doc promovido draft → stable
Atualiza INDICE.md + documentos-do-projeto.md + AGENTS.md seção 10 (ADRs) se for ADR
```

### 14.3.1 Disputa subagente × humano

Quando humano dono discorda de REPROVADO de subagente:

1. Agente IA marca parecer como `disputado: true` em frontmatter.
2. Agente IA redige contraponto técnico (1 parágrafo) — sem reprocessar o subagente cegamente.
3. Registra em `docs/dominios/.../revisoes/DISPUTAS-<US-ID>.md`: data, subagente, ponto disputado, contraponto, decisão do humano.
4. **Bloqueio crítico:** se subagente disputado é `especialista-juridico` ou `security-engineer`, **não promove a stable** sem parecer humano licenciado (advogado real, security engineer certificado). Disputa não cancela parecer especialista cego.
5. Demais subagentes (modo equipe): humano pode override; fica registrado com prazo de revisão (TTL 14 dias — canônico, alinhado com override pessoal de gate de auditoria).
6. **TTL do humano para responder a REPROVADO disputado** (anti-loop): **48h em solo, 7d em equipe**. Sem resposta no prazo → agente aplica a ressalva mais segura por default (mais restritiva) e registra em `decisoes-do-dia.md`. Humano pode reverter em 14d. Para subagentes não-críticos (não jurídico/security), agente IA pode propor override one-liner com registro automático no ledger — sem doc separado por disputa.

### 14.4 Ritual Spec Kit por Story

> **Sobre os comandos `/specify`, `/plan`, `/tasks`, `/implement`, `/review`, `/release`:** são *slash-commands* opcionais do Claude Code (definidos em `.claude/commands/<etapa>.md`). Em outros harnesses (Cursor, Codex CLI, Windsurf, Kiro), são apenas **etapas lógicas** que o agente conduz por arquivo. O que importa é o **artefato versionado** produzido em cada etapa (`spec.md`, `plan.md`, `tasks.md`, commits, review notes, release notes), não o comando literal.

```
/specify  — escrever a Story
   US-<MOD>-NNN: <título>
   Como <persona>, quero <ação>, para <benefício>
   AC-<MOD>-NNN-1: GIVEN/WHEN/THEN (binário)
   INV citadas: INV-*
   Non-goals: ...
              ↓
/plan  — plano SEM código
   • Sequência T-<MOD>-NNN
   • Modelos/migrations
   • Endpoints/views
   • Hooks que vão validar
   • Testes 1:1 com ACs
   • Riscos
              ↓
REVIEW dos N subagentes pertinentes (não todos)
Output: APROVADO | RESSALVAS | REPROVADO
              ↓
Se RESSALVAS → agente registra em `revisoes/` + abre tasks de follow-up + SEGUE.
              RESSALVAS NÃO bloqueiam promoção (alinhado com §9).
Se REPROVADO → corrige plano causa-raiz → volta pro review (até 3 passadas).
              ≥4 passadas no mesmo ponto = escalação humana (§14.7).
Se OK →
              ↓
/tasks   — quebra em T-<MOD>-NNN (1-2 commits cada)
              ↓
/implement — código por T-<MOD>-NNN (hooks rodando em cada commit)
              ↓
/review   — code review pós-implementação:
            • Auditores base + de código rodam
            • qa-engineer + security-engineer revisam (pertinência por escopo)
            • Output: PASS / CONCERNS / FAIL
              ↓
/release  — pre-release (só se está fechando Fase/marco com tag):
            • auditor-changelog-completeness, auditor-api-versioning,
              auditor-dependency-freshness
            • release-manager confirma checklist (backward compat, rollback)
```

**ACs binários:** ou passa ou não passa. Não admite "parcialmente".

> **Nota — Fase de produto vs Foundation:** `auditor-produto` roda SOMENTE em Fase de produto (módulo visível ao usuário). Em Foundation (multi-tenant, auth, observabilidade) os critérios de produto não se aplicam; rode apenas `auditor-seguranca`, `auditor-qualidade`, `auditor-observabilidade`, `auditor-doc-quality`.

> **Comandos `/specify`, `/plan`, `/tasks`, `/implement`, `/review`, `/release` são etapas LÓGICAS.** Em Claude Code podem ser implementados como `.claude/commands/<etapa>.md` opcionais. Em outros harnesses, o agente IA guia o humano por arquivo. O que importa é o ARTEFATO versionado de cada etapa (spec.md, plan.md, tasks.md, commits, review notes, release notes), não o `/comando` literal.

### 14.4.1 Estratégia git

- **Default:** trunk-based + branch curta por Story (`feat/US-<MOD>-NNN`).
- **Merge:** fast-forward após PASS ZERO C/A/M.
- **Commits:** atômicos, citando `T-<MOD>-NNN` na mensagem.
- **`/implement` complexo (>10 arquivos):** quebrar em N commits atômicos (1 por T-<MOD>-NNN), não 1 commit gigante.
- **Branches longas:** PROIBIDAS (>5 dias sem merge = abrir issue de débito).
- **`git push --force` em `main`:** PROIBIDO mesmo com `--force-with-lease`. Hook bloqueia.

### 14.5.0 Paralelismo do maestro (quando rodar em paralelo vs sequencial)

- **Paralelo** (tool calls em mesmo bloco): tasks tocando arquivos disjuntos, auditores que não escrevem, leituras independentes, sub-agentes de revisão, varreduras Grep/Glob.
- **Sequencial**: tasks com ordem semântica (migration → código → teste), edições que se sobrepõem no mesmo arquivo, operações git destrutivas, commits.
- **Default**: assumir paralelo a menos que haja dependência clara.
- Para o ciclo Spec Kit, **subagentes de revisão SEMPRE em paralelo** (cada um lê o mesmo plano e dá parecer); convergir resultados depois.

### 14.5 Durante o `/implement` — defesa em camadas

```
AGENTE EDITA ARQUIVO
       ↓
CAMADA 1 — HOOKS pre-tool (C9b — UX, feedback rápido)
  block-destructive, secrets-scanner, anti-mascaramento, frontmatter-validator
       ↓
CAMADA 2 — HOOKS pre-commit git (C9a — rede de segurança universal)
  núcleo: block-destructive, secrets-scanner, frontmatter-validator,
          anti-mascaramento, override-ledger
  extensão: large-file-blocker, merge-conflict-marker, lockfile-tampering,
            migration-direction, env-file-leak
  condicionais por path: tenant-id-validator, migration-rls-check,
                         audit-immutability
       ↓
CAMADA 2a — AUDITORES DE CÓDIGO (rodam em paralelo no pre-commit ou no /review)
  auditor-llm-correctness, auditor-performance, auditor-test-determinism,
  auditor-error-handling, auditor-architecture-fit
       ↓
CAMADA 3 — CI (C9a — última defesa)
  mesmos hooks + auditores pesados + cobertura + SBOM + signed commits
       ↓
Hook bloqueou?
  SIM → Corrige causa raiz (NUNCA --no-verify) → volta ao edit
  NÃO → Commit aceito (cita T-<MOD>-NNN)
```

### 14.6 Auditoria pós-implementação — gate de fechamento

Acontece antes de fechar Story / Fase / Marco.

```
1ª PASSADA — N auditores em paralelo (ordem: barato → caro em tokens)
  Qualidade → Segurança → Produto → demais
  Output: PASS | CONCERNS | FAIL
  Classificação: CRÍTICO | ALTO | MÉDIO | BAIXO
            ↓
Algum C/A/M aberto?
  NÃO → FASE/MARCO FECHA (BAIXO vira GATE da próxima Fase)
  SIM → vai pra 14.7 (loop de conserto)
```

**Severidade fixa por ID de regra:** `SEC-001` é sempre CRÍTICO; `TST-014` é sempre MÉDIO; não muda por instância. Auditor só reporta o ID; classificação é do `catalogo-auditores.md`.

**Regra de ouro:** MÉDIO bloqueia igual a CRÍTICO/ALTO. Override:
- **CRÍTICO/ALTO:** só do humano dono via `# ritual-gate: skip -- APROVADO POR <DONO>: <razão>` — registrado em `overrides-ledger.md`, TTL 14 dias.
- **MÉDIO (em modo solo):** agente IA pode propor override com justificativa técnica + registro automático no ledger. Humano dono pode reverter em até 14d. Inverte default de "bloqueia até dono aprovar" para "passa com registro, dono pode vetar depois" — Roldão não-técnico não consegue decidir cego entre 10 achados MÉDIO.
- **MÉDIO (em modo equipe):** override exige humano dono como antes.

### 14.7 Loop de conserto causa-raiz + GATE DE CONVERGÊNCIA

```
Batches por EIXO (não por arquivo):
  Batch S1: doc-quality (primeiro, senão outros geram mais drift)
  Batch S2: segurança + privacidade + pii-em-logs
  Batch S3: schema-evolution + migration-reversibility + idempotência
  Batch S4: observabilidade + finops + error-handling
  Batch S5: acessibilidade + produto + qualidade + test-determinism
  Batch S6: doc-quality residual + api-versioning
            ↓
2ª PASSADA dos N auditores
            ↓
PASS ZERO C/A/M (zero CRÍTICO + zero ALTO + zero MÉDIO em ABERTO)?
  Achados em status "em-progresso" (com task + responsável) NÃO bloqueiam — pulam pra próxima passada
  Achados que reabrem 2x o mesmo ponto bloqueiam
            ↓
≥ 4ª PASSADA sem convergir? → GATE DE CONVERGÊNCIA
  Agente IA CONVOCA humano com:
   • Sumário de cada auditor remanescente
   • 2-3 propostas alternativas, COM **RECOMENDAÇÃO ranqueada** ("recomendo re-spec
     porque X; alternativa B é matar Story se Y; override só se Z"). Roldão não-técnico
     não escolhe cego entre 3 opções de engenharia — agente já entrega ranking.
   • Análise de incompatibilidade entre auditores (se houver)
   • Precedência sugerida: SEC > LGPD > IA/LLM > Produto > Performance > FinOps
  Humano dono confirma a recomendação OU veta. Sem resposta em 24h: agente executa a
  recomendação top-1, registra em decisoes-do-dia.md, humano pode reverter em 7d.
            ↓
≥ 5ª PASSADA = LIMITE DURO
  Bloqueio absoluto. Decisão humana obrigatória entre:
   1. Override com `ritual-gate: skip -- RAZÃO: <descrição>` (TTL 14d, canônico)
   2. Matar Story (registra em docs/canceladas/)
   3. Re-spec (volta /specify, não /plan)
```

**Princípio:** conserto na **causa raiz**, nunca no sintoma. Hook detecta bug em N lugares → conserta o **gerador**, não os N lugares.

**Bump de auditor não dispara passada nova retroativa:** auditor V2 que rejeita o que V1 aceitava obriga reprocessamento explícito (`T-AUDIT-REPROC-NNN`), não roda silenciosamente sobre commits antigos.

### 14.8 Fechamento de Fase/Marco

```
PASS ZERO C/A/M atingido
            ↓
Agente IA PREPARA (passos 1-5):
  1. auditoria-saida.md §VEREDITO FINAL consolidada
  2. ADRs aceitas → AGENTS.md §ADRs
  3. AGENTS.md §Pendências — move "pendência" → "feito"
  4. .agent/CURRENT.md atualizado (novo foco)
  5. CHANGELOG.md seção [Unreleased]
            ↓
Humano dono confirma (CONDICIONAL — ver TTL por modo abaixo)
            ↓
TTL de confirmação por modo:

  modo: solo (Roldão não-técnico)
    Sem resposta em 48h E PASS ZERO atingido → marco fecha por timeout AUTOMÁTICO,
    registro em decisoes-do-dia.md com link da auditoria. Humano pode reverter em 7d.

  modo: equipe (regulado)
    Sem resposta em 7d → agente IA RELEMBRA (1 ping)
    Sem resposta em +3d → escala pra tech-lead (ou outro dev, se houver)
    Sem resposta em +2d → marco volta pra "em progresso"; novo gate necessário
            ↓
Agente IA EXECUTA (passos 6-7) — em modo solo, executa imediatamente após reporte
de PASS ZERO; em modo equipe, executa após confirmação humana:
  6. GATEs BAIXO → rastreados próxima Fase (carryover)
  7. MEMORY.md atualizado (sessão / projeto)
```

### 14.8.1 Retrospectiva pós-marco

`docs/faseamento/<fase>/retrospectiva.md` (3 campos):
- **Acertos:** o que ritual/ferramentas/auditores fizeram bem.
- **Erros:** onde ritual falhou (auditor que passou bug, hook que travou desnecessário, subagente que alucinou).
- **Ajustes ao ritual:** mudanças propostas pra próxima fase (bumpar prompt de auditor X, adicionar hook Y, criar subagente Z).

Alimenta auditoria transversal (14.9).

### 14.9 Auditoria transversal (a cada N marcos)

Não amarrada a Story específica — varredura ampla, com **lentes múltiplas** (segurança / privacidade / arquitetura / produto / risco / regulatório / IA / acessibilidade).

```
Saída: lista de achados (X CRÍTICOS, Y ALTOS, Z MÉDIOS)
Consolidado em docs/faseamento/auditorias/PRE-FASE-<X>-CONSOLIDADO-rodada-N.md
            ↓
Plano de N ondas de conserto
            ↓
Cada onda → novas ADRs + tasks de saneamento
            ↓
Achados podem virar ADR estrutural + sprints de saneamento antes da Fase começar
```

### 14.10 Bug em DEV — Regra #0 (investigar antes de mexer)

```
1. NÃO MEXER NO CÓDIGO AINDA
2. LER ESTADO REAL (SELECT no banco, logs, payload IPC, console)
3. RASTREAR O FLUXO (onde dado é gerado/salvo/lido; builders duplicados?)
4. CONFIRMAR ENTENDIMENTO — **apenas se** restar ambiguidade real após passos 1-3 (estado real + fluxo). Bug óbvio com causa raiz identificada → pular direto para passo 5.
5. CONSERTAR NA CAUSA RAIZ (NUNCA mudar template pra esconder bug de dados)
   • Fix <2h → vira AC novo na Story original
   • Fix ≥2h → vira US-<MOD>-NNN-BUG (Story própria, ritual Spec Kit completo)
```

### 14.10.1 Hotfix em PRODUÇÃO

> Cliente parado às 23h ≠ DEV bug. Spec Kit completo é incompatível com SLA.

```
1. INVESTIGAR DADOS DE PROD (não chutar; ver Regra #0)
2. FIX MÍNIMO direto em main com tag hotfix/YYYY-MM-DD-<slug>
   SE equipe > 1: outro dev revisa async em <30min (comentário 1 linha basta)
   SE solo dev não-técnico: agente IA sobe hotfix mínimo, registra `ritual-gate: skip` automaticamente no commit, e DÍVIDA RETROATIVA em ≤48h fica obrigatória (spec + auditoria + post-mortem). Sem revisão prévia do dono não-técnico (que não consegue revisar código).
3. COMUNICAR: status page / e-mail / canal cliente
4. MONITORAR pós-deploy (mínimo 1h):
   • Taxa de erro: se queda >10% adicional → ROLLBACK automático (revert + tag)
   • Latência p95: se degrada >20% → ROLLBACK
   • Logs: novos padrões de exception
5. DÍVIDA RETROATIVA OBRIGATÓRIA em ≤48h:
   • Spec retroativa (US-BUG-PROD-NNN)
   • Plan retroativo (com causa raiz documentada)
   • Auditoria retroativa (auditores rodam sobre o fix)
   • Post-mortem em docs/operacao/incidentes/ (template post-mortem.template.md)
6. CARRYOVER OBRIGATÓRIO: prevenir recorrência (hook novo, auditor novo, INV nova).
```

Hotfix sem dívida retroativa em 48h = `auditor-incident-readiness` falha CRÍTICO.

### 14.10.2 Cancelamento de Story

Quando US-`<MOD>`-NNN é cancelada (humano decide que feature não faz sentido, dependência quebrou, escopo cortado, risco descoberto torna infazível):

1. Story → `status: cancelled` (não deletar arquivo).
2. Registrar em `docs/canceladas/YYYY-<MOD>-NNN.md`: razão, data, quem decidiu, dependências bloqueadas.
3. Detectar Stories downstream que dependiam desta — marcar `status: bloqueada` automaticamente; listá-las em "AGUARDANDO" da próxima Fase.
4. CHANGELOG menciona cancelamento se já estava em release plan público.
5. `auditor-meta` flagra Story criada e cancelada sem nenhum commit real (possível churn indicator).

### 14.10.3 Rollback de marco fechado

Quando, depois de marco fechado (PASS ZERO), descobre-se bug CRÍTICO que quebra a especificação:

1. Abrir issue urgente com label `rollback-marco`.
2. Reproduzir + confirmar SEMPRE com dados reais (Regra #0).
3. Decidir caminho:
   - **Hotfix** (fix <2h): roda 14.10.1, marco NÃO reabre.
   - **Reverter marco** (>2h ou múltiplos pontos): reabre 14.6, mas nova passada cobre APENAS o diff vs marco anterior, não tudo. Fecha novamente com novo PASS ZERO.
4. Post-mortem obrigatório: por que auditores não pegaram? Versão do auditor estava desatualizada? Critério mal definido? Feedback vira bump de `auditor-meta`.
5. Registro: `docs/operacao/marcos-revertidos/YYYY-MM-DD-<marco>.md`.

### 14.11 Matriz de responsabilidade

| Ator | Função | Quando aparece |
|---|---|---|
| **Humano dono** | Decisão de produto, override de gates, autorização de gastos, confirmação de fechamento de marco | Em escalations e fechamentos |
| **Agente IA principal** | Implementa, escreve docs, propõe planos | Sempre |
| **Subagentes humano-substitutos** | Revisão estratégica de plano | Antes do `/tasks` |
| **Auditores de Saída** | Veto pre-commit/pre-merge/pre-fase automático | Em todo commit + fechamento de marco |
| **Hooks** | Bloqueio mecânico de erros conhecidos | Em toda edição/commit |
| **Humano licenciado** (advogado real, contador, especialista certificado) | Assinatura legal/parecer formal | SOB DEMANDA, sempre antes de prod real |

### 14.12 Sinais de que o fluxo quebrou

PARE se notar qualquer um:
- Escrevendo código sem ter aberto o PRD do módulo
- Sem ter criado Story `US-<MOD>-NNN`
- Sem ter invocado subagente algum em decisão não-trivial
- Commit não cita `T-<MOD>-NNN`
- Não rodei auditor antes do push/merge
- Implementei subset da Story sem documentar o restante
- Marquei marco FECHADO com MÉDIO em aberto
- Rotulei MÉDIO como "aceitável/cosmético/diferido"
- Mudei template/UI pra "resolver" comportamento sem olhar os dados
- Humano corrigiu minha interpretação 2x na mesma conversa
- **Story aberta há >5 dias sem fechamento**
- **>2 marcos consecutivos com GATE BAIXO crescendo**

→ **Voltar pro `/specify` e investigar.**

#### Self-healing automático (ações do maestro sem esperar humano)

Para cada sinal acima, o maestro tem ação automática — não fica esperando humano interpretar:

| Sinal detectado | Ação automática do maestro |
|---|---|
| Story aberta > 5 dias | Abre `T-SLA-NNN` com pergunta diagnóstica + segue próxima task. Humano resolve assíncrono. |
| > 2 marcos com GATE BAIXO crescendo | Consolida em ADR de "dívida acumulada" + propõe Fase dedicada de paydown. |
| Plan em rebobinada infinita (≥3 passadas no mesmo eixo) | Consolida em ADR de "decisão sob incerteza" + segue para próxima task. |
| Audit fail recorrente em mesmo eixo (≥3 marcos) | Adiciona regra em `REGRAS-INEGOCIAVEIS.md` (proposta) + tag bloqueante automática. |
| Humano corrigiu minha interpretação 2× na mesma conversa | Salva memória do tipo `feedback` e aplica retroativo nos próximos passos. |
| Auditor que sempre passa (0 catches em N marcos) | Propõe aposentar no `catalogo-auditores.md` via PR automático. |

Self-healing NÃO substitui escalação em CRÍTICO/ALTO — só evita travar em pontos onde a ação correta é deterministica.

### 14.13 Foundation vs Fase de produto — exemplos concretos

Ver tabela em C5 (Seção 7).

### 14.14 Ciclo consolidado por Marco

```
PRD do módulo (stable)
   ↓
Spec da fase em docs/faseamento/<fase>/
   ↓
Kick-off da Fase (checklist: PRDs stable + ADRs aceitas + auditoria pré-Fase OK + subagentes convocados)
   ↓
Plano revisado pelos N subagentes
   ↓
tasks.md com T-<MOD>-NNN
   ↓
LOOP POR TASK: /implement → hooks → commit (cada commit cita T-<MOD>-NNN)
   ↓
1ª passada — N auditores
   ↓ (se FAIL)
Batches conserto causa-raiz (S1..SN)
   ↓
2ª/3ª passada
   ↓
4ª passada → GATE DE CONVERGÊNCIA → humano decide
   ↓
PASS ZERO C/A/M (gate satisfeito)
   ↓
Agente prepara fechamento (passos 1-5 em 14.8)
   ↓
Humano confirma "FECHADO"
   ↓
Agente executa (passos 6-7) + retrospectiva.md
   ↓
GATEs BAIXO carryover rastreados próxima Fase
```

### 14.15 Modo enxuto — projeto solo/short

> Spec Kit completo é over-engineering pra projeto solo de 2 semanas. Use o modo enxuto.

**Gatilho:** projeto <4 semanas E equipe = 1 dev E não-regulado.

> **Classificação automática:** o agente classifica modo enxuto AUTOMATICAMENTE a partir do briefing inicial (nome do repo, contexto, manifestos detectados). Só pergunta se a duração esperada for genuinamente ambígua. Briefings óbvios — "CLI pessoal pra X", "lib utilitária pra Y", "experimento de 2 dias" — entram em modo enxuto sem confirmação.

**Compressões:**
- Subagentes: apenas `tech-lead`. Demais não invocados.
- Auditores: apenas `auditor-qualidade`, `auditor-seguranca`, `auditor-doc-quality` (3 sub-regras). Demais desligados. **Em modo enxuto, o agente avalia automaticamente se gatilhos de §15.1 (IA/LLM, dado pessoal, multi-tenant) aplicam e LIGA o auditor correspondente — sem perguntar.**
- Batches: lista linear, não eixos.
- Descoberta: comprimida em 1 `sintese-final.md` de 2 páginas (cabe `problema.md` + `personas.md` + `nao-fazer.md` fundidos).
- Faseamento: 1 Foundation + 1 Fase, sem múltiplas.
- ADRs: 0000 (uso IA) + 0001 (stack) obrigatórias; demais sob demanda.
- Retrospectiva: opcional.

**Promoção pra modo completo:** quando projeto crescer (passou 4 semanas / 2+ devs / virou regulado), agente cria as camadas pulladas RETROATIVAMENTE em `docs/upgrade/`.

**Exemplo pré-preenchido:** ver `templates/exemplos/cli-rust-solo/` para um caso completo em modo enxuto (CLI hobby, sem LGPD, sem multi-tenant). Pra casos não-enxutos, ver `templates/exemplos/saas-python-regulado/` (regime completo) e `templates/exemplos/lib-typescript/` (biblioteca OSS).

---

## 15. Árvore de decisão — qual tipo de projeto?

Antes de aplicar a matriz da Seção 19, classifique:

```
P0. Categoria estrutural especial?
    a) IA/ML em produção                       → IA/ML produto (matriz 19)
    b) Jogo                                    → Jogo (matriz 19)
    c) Embedded / IoT / firmware               → Embedded/IoT (matriz 19)
    d) Smart contract / DApp                   → Smart contract (matriz 19)
    e) Data pipeline / ETL puro (sem UI)       → Data pipeline (matriz 19)
    NENHUMA das acima → P1

P1. Tem UI visível pro usuário final?
    SIM → P2
    NÃO → P1.a
    P1.a. Sem UI — qual o tipo?
        a) API/microservice puro (REST/gRPC/GraphQL para outros sistemas)
        b) CLI / dev tool
        c) Bot de chat (Telegram/Discord/Slack/WhatsApp)
        → vai pra P5

P2. Roda onde?
    a) Browser web                             → Web app (P3)
    b) Desktop nativo (Electron/Tauri)         → Desktop app (P3 — em geral B2B)
    c) Mobile (iOS/Android)                    → Mobile app (P3 — em geral B2C/B2B)
    d) Dentro de outra plataforma — subdivide:
        d1) Browser extension (Chrome, Firefox, Safari)  → Browser extension (matriz 19)
        d2) IDE / editor plugin (VS Code, JetBrains)     → IDE/editor extension (matriz 19)
        d3) Plataforma SaaS plugin (Shopify, WordPress, Salesforce) → SaaS plugin (matriz 19)
        d4) Chat platform app (Slack, Discord, Teams)    → tratar como Bot (P1.a.c)
        d5) Outra plataforma (Figma plugin, Sketch, Blender) → mapear pelo análogo mais próximo

P3. Multi-tenant (vários clientes pagantes na mesma instância)?
    SIM → SaaS (P4)
    NÃO → Single-tenant ou app interna (P4)

P4. Quem é o cliente?
    a) Próprio dono/empresa → Internal tool/admin panel
    b) Público pago         → Produto comercial (B2B ou B2C)
    c) Público grátis OSS   → Biblioteca open-source

P5. Domínio regulado? (saúde / financeiro / governo / dados sensíveis de
    menores / IA de alto risco UE)
    SIM → Camada C6 reforçada obrigatória + auditores condicionais
    NÃO → C6 condicional, só LGPD/GDPR se trata dado pessoal

P6. Tempo de vida esperado?
    ≤2 dias descartável                       → Seção 22 micro
    ≤4 semanas MVP solo                       → Modo enxuto (14.15)
    >4 semanas produto                        → Receita completa
```

**Saída:** {categoria-estrutural?, plataforma, modelo de distribuição, perfil regulatório, escala temporal} → mapeia direto pra matriz da Seção 19.

> **Tipos da matriz §19 que entram pela P0** (não passam por P1-P6): IA/ML, Jogo, Embedded/IoT, Smart contract, Data pipeline. Cada um tem perfil próprio. Use a matriz §19 direto — P5 (regulado?) e P6 (tempo de vida?) ainda aplicam dentro do tipo.
>
> **Tipos da matriz §19 que entram por P2.d** (dentro de outra plataforma): Browser extension, IDE/editor extension, SaaS plugin. Cada um tem regras de store/marketplace próprias.

### 15.1 Decision tree executável (if-then)

Após classificar o projeto, aplique as regras abaixo determinísticamente. Cada `IF` que casar adiciona templates/camadas; cada `IF` que falhar adiciona linha no `docs/nao-aplica.md` com justificativa.

```
IF projeto for ≤2 dias descartável  THEN
    aplicar APENAS Seção 22 (micro). Pular C1, C5, C6, C8.
ELSE IF projeto for ≤4 semanas E equipe=1 E não-regulado  THEN
    aplicar modo enxuto (§14.15): C0, C1 comprimida, ADR-0000+0001, C9.
    pular: C5 multi-fase, C6 (salvo LGPD), C8 detalhado.
ELSE
    aplicar receita completa C0-C11.

IF projeto tratar dado pessoal de terceiros  THEN
    aplicar C6 LGPD: ROPA + retencao-dados + direitos-do-titular
    + dpo-action-plan + AIPD quando alto risco + runbook de eliminacao.
    aplicar segurança: threat-model + dependency-policy + criptografia-policy
    + key-management-policy + resposta-incidente.
ELSE
    registrar em nao-aplica.md: "C6 LGPD não se aplica — não trata dado pessoal de terceiros".

IF projeto for multi-tenant  THEN
    aplicar INV-TENANT-NNN obrigatórios em REGRAS-INEGOCIAVEIS.
    aplicar docs/seguranca/invariantes-tenant.md.
    aplicar `auditor-seguranca` com sub-regra de isolamento multi-tenant (valida `INV-TENANT-*`, queries sem `WHERE tenant_id`, RLS policies, JWT→`SET LOCAL app.current_tenant_id`).

IF projeto usar IA/LLM/ML em produção  THEN
    aplicar ADR-0000 (uso de IA) com escopo, riscos, custo.
    aplicar templates: model-card.md por modelo, data-card.md por dataset.
    aplicar docs/conformidade/ia-act/ se for high-risk no IA Act EU.

IF projeto for embedded/firmware  THEN
    aplicar specs de interface de hardware, pinagem, protocolo.
    aplicar calendário de certificação (FCC/CE) em docs/conformidade/.

IF projeto for data pipeline/ETL  THEN
    aplicar templates: data-contract.md por contrato produtor↔consumidor.
    aplicar lineage + data-quality rules em docs/dados/.

IF projeto for biblioteca OSS / comunidade aberta  THEN
    aplicar MAINTAINERS.md + governanca-comunidade.md + rfc.md.
    aplicar release-process.md detalhado (SemVer estrito).

IF projeto tiver SLA com cliente externo / on-call  THEN
    aplicar C8 completa: runbook + slo-sli + on-call + backup + DR + observabilidade.

IF projeto rodar em produção crítica (financeiro/saúde/governo)  THEN
    aplicar threat-model COMPONENTE-A-COMPONENTE (STRIDE).
    aplicar capacity-planning + performance-testing.
    aplicar deployment-strategy com canary obrigatório.

IF projeto for multi-harness (Claude Code + Cursor/Windsurf/Codex/Kiro)  THEN
    aplicar .cursorrules / .windsurfrules / .kiro/steering/ apontando para AGENTS.md.
    aplicar .pre-commit-config.yaml universal (lê regras de qualquer harness).
```

> **Regra de ouro:** templates puláveis viram entradas em `docs/nao-aplica.md` COM JUSTIFICATIVA + GATILHO DE REAVALIAÇÃO. Sem justificativa, falha PASS ZERO.

### 15.2 PASS ZERO no fluxo

Todo marco (fechamento de Foundation ou Fase) exige **PASS ZERO** — zero achados CRÍTICO/ALTO/MÉDIO em aberto. O critério vive em §1.5 e é operacionalizado em `templates/kickoff-fase.template.md` §7. Resumo:

- BAIXO pode ficar aberto com TTL em `docs/governanca/registro-de-riscos.md`.
- Override de PASS ZERO exige aprovação humana + TTL de reversão registrado.
- Fechamento sem PASS ZERO = bug de governança detectado pelo `auditor-meta`.

---

## 16. Ordem prática de produção (cenário perfeito)

> Ordem de **criação** (≠ ordem de **leitura** do método). Esta é a ordem temporal de produzir os docs.

| Semana | Entrega |
|--------|---------|
| 0 | C0 (raiz) + esqueleto `constitution.md` + 5-10 INV iniciais + **esqueleto C8** (`docs/operacao/`, `docs/seguranca/` vazios mas existentes) |
| 1-3 | C1 (Descoberta) — não pula nada se "founder-is-customer" |
| 4 | C2 (ADRs 0000-0005) + C10 (convenções) |
| 5 | C3 (arquitetura) + C7 (governança esqueleto) |
| 6 | C4 (PRD raiz + 1ª onda specs + estratégia de testes) |
| 7 | C5 (faseamento Foundation+Fases) |
| 8 | C6 (conformidade — se regulado) + **conteúdo C8** (runbooks iniciais, SLO/SLI, modelo de ameaças preenchido) |
| 9 | C9 (harness: settings, hooks mínimos, 4 agentes essenciais, MCP) |
| 10 | C11 (estado vivo) + revisão geral dos auditores principais |
| 11+ | **Primeira linha de código** da Foundation F-A com auditores rodando |

> **Nota — esqueleto vs conteúdo de C8:** o **esqueleto** de C8 (`docs/operacao/`, `docs/seguranca/` + sub-pastas vazias `runbooks/`, `incidentes/`, `marcos-revertidos/`) deve nascer na **Semana 1** junto com C0. O que entra depois (Semana 8) é o **conteúdo de governança operacional** — runbooks reais, SLO/SLI, post-mortems vão sendo preenchidos conforme operação acontece (post-mortem só existe se incidente aconteceu; runbook só vale se procedimento foi exercido).

**Projeto pequeno:** modo enxuto (14.15). Comprima pra 1-2 semanas, NÃO pule camadas — corte profundidade, não largura.

> **Tabela de tempos estimados por tipo de projeto** (CLI hobby, lib OSS, SaaS, ML, embedded, etc.) vive em `templates/CHECKLIST-PRONTO-PRA-CODAR.template.md` → seção "Estimativa de tempo por tipo de projeto". Use-a para dimensionar quanto demora ir de repo vazio até o gate deste §17.

---

## 17. Critério "pronto pra começar a codar"

Antes da primeira linha de código de produto, valide:

- [ ] `README.md` + `AGENTS.md` + `CONTRIBUTING.md` existem e estão `stable`; `SECURITY.md` existe ou está justificado em `docs/nao-aplica.md` quando o tipo é `experimento`.
- [ ] `REGRAS-INEGOCIAVEIS.md` tem ≥ 10 IDs com hook ou auditor mapeado.
- [ ] Descoberta: `sintese-final.md` em `stable`.
- [ ] ADR-0000 (uso de IA) + ADR-0001 (stack) aceitas.
- [ ] Glossário tem ≥ 20 termos.
- [ ] PRD raiz lista módulos com prioridade.
- [ ] `docs/testes/estrategia.md` definida.
- [ ] Foundation F-A tem `spec.md` + `plan.md` + `tasks.md`.
- [ ] Pre-commit git configurado com gitleaks, check-yaml/json, merge-conflict, large-file, anti-mascaramento, block-destructive, frontmatter-validator, doc-line-counter e secrets-scanner PII BR.
- [ ] CI rodando os mesmos hooks + auditores pesados + SBOM.
- [ ] Pelo menos 5 auditores configurados do catálogo canônico (Seção 9, itens 1-27): `auditor-seguranca`, `auditor-qualidade`, `auditor-produto`, `auditor-doc-quality`, `auditor-meta` — cada um com golden cases POSITIVO+NEGATIVO obrigatórios.
- [ ] `CODEOWNERS` cobre paths críticos previstos.
- [ ] `.gitignore` cobre a stack + `.claude/settings.local.json`.
- [ ] `.mcp.json` + `politica-mcp.md` se usa MCP.
- [ ] `nao-aplica.md` lista camadas pulladas com justificativa.

Faltando qualquer item: **NÃO CODE**.

---

## 18. Anti-padrões que destroem a estrutura

1. **Pular Descoberta** — "vou descobrir codando". Resultado: refatoração total em 3 meses.
2. **ADR retroativa** — codar e DEPOIS escrever ADR justificando. Vira ficção.
3. **Doc sem frontmatter** — apodrece sem ninguém perceber.
4. **`status: draft` por > 14 dias sem progresso** — auditor abre task; > 30 dias = auto-deprecated. *(staleness de doc — não confundir com TTL de override de 14 dias.)*
5. **Pasta criada vazia "pra depois"** — só cria quando tem conteúdo real.
6. **Spec sem AC binário** — "deve ser rápido" não é AC. "P95 < 200ms em 1k req/s" é.
7. **Auditor sem versão** — quando muda prompt, comportamento muda silenciosamente.
8. **Regra crítica só em doc** — vira hook ou auditor, senão alguém vai violar.
9. **Glossário inconsistente** — termo diferente em docs diferentes.
10. **`AGENTS.md` > 300 linhas** — ninguém lê. Fatie.
11. **Copiar template de outro projeto sem auditar** — herda decisões irrelevantes.
12. **Documentar antes de validar com humano** — gera 500 páginas que ninguém vai usar.
13. **Override sem auditoria** — `# ritual-gate: skip` sem registro central, contador mensal nem caducidade vira loophole permanente.
14. **Frontmatter zumbi** — doc `stable` com `revisado-em` > 90 dias sem revisão real. Hook marca STALE.
15. **Auditor que sempre passa** — taxa de achados ≈ 0 ao longo de N marcos = quebrado. `auditor-meta` flagra.
16. **Subagente especialista sem fonte de verdade externa** — `especialista-juridico` Claude sem RAG legal opinando como parecer. Saída marcada `opiniao-nao-vinculante`.
17. **MEMORY.md sem poda** — vira 5000 linhas, agente trunca contexto. Cap 1500 linhas + poda trimestral.
18. **Auditor bump sem reprocessamento** — versão nova sem rodar contra commits cobertos pela versão anterior. Drift silencioso permanente.
19. **Solo dev é juiz e réu** — humano dono override perde checagem externa. Cool-down de 24h em override de MÉDIO+.
20. **Cascata de supersession ignorada** — ADR superseded mas docs em prosa seguem citando decisão antiga. `auditor-doc-quality` (sub-regra b).
21. **Conteúdo placeholder cosmético** — arquivo com "TBD/preencher/TODO" há >14 dias com `status: stable`. `auditor-doc-quality` (sub-regra c).
22. **Glossário só anti-divergência, não anti-sinônimo** — "cliente" e "usuário" usados como sinônimo por descuido. Coluna `evite-sinonimos-de:` no glossário + hook grep no diff.
23. **Hook não-determinístico** — hook depende de rede (`curl` externo), data/hora ou `$RANDOM` → resultado varia entre runs. Auditoria irreproduzível.
24. **Auditor sem golden case POSITIVO+NEGATIVO** — prompt de auditor sem fixtures testadas; taxa de falso negativo/positivo desconhecida. `auditor-meta` deve bloquear.
25. **PII em prompt de auditor** — auditor recebe dados reais do banco no contexto → vazamento silencioso em logs do LLM. Sempre mascarar com fixture sintética.
26. **Credencial em `CLAUDE.md` / `AGENTS.md`** — URL com API key, token hardcoded, referência sem redação. Hook secrets-scanner roda nesses arquivos também.
27. **Versão de modelo LLM não-pinada** — `model: "latest"` ou vazio em `.claude/agents/auditor-*.md` → comportamento muda a cada update Claude. Pinar versão data+hash.
28. **Override sem detector automático de TTL** — `# ritual-gate: skip` registrado em ledger mas ninguém detecta vencimento. `auditor-overrides-expired` roda mensal.
29. **MCP server sem auth ou auth expirada** — entrada em `.mcp.json` sem credencial rotacionada há 90 dias. `auditor-mcp-staleness` flagra.
30. **Auditor crítico em path não-rastreado** — arquivo `.claude/agents/auditor-xyz.md` sem entrada em `catalogo-auditores.md` → auditor roda silenciosamente, ninguém sabe versão/severidade. `auditor-meta` bloqueia.
31. **Histórico git sem signed commits em projeto regulado** — SaaS regulado sem `gpg.signingkey` configurado e CI checando assinatura → cadeia de suprimentos vulnerável a injeção.
32. **Regra crítica de domínio em PROSA não-enforçável** — INV definida em `REGRAS-INEGOCIAVEIS.md` mas sem `Implementação-em` (hook/auditor/subagente/revisão-humana) preenchido. Regra "esperada", não enforçada.
33. **Merge conflict marker commitado** — `<<<<<<<`, `=======`, `>>>>>>>` no código staged. Hook `merge-conflict-marker` bloqueia.

---

## 19. Adaptação por tipo de projeto (matriz)

| Tipo | Camadas críticas | Camadas a reduzir | Adiciona |
|------|------------------|--------------------|----------|
| **Biblioteca open-source** | C0 (SECURITY.md crítico), C2 (ADRs), C4 (specs por feature), C6 (supply-chain, SBOM, SECURITY policy), C8 (release signing, rotação mantenedores), C9 (hooks de qualidade) | C1 (Descoberta resumida) | — |
| **CLI / dev tool** | C0, C2, C3, C4, C9 | C5 (faseamento simples); C1 resumida se comunidade ainda pequena; C6 se sem telemetria | — |
| **Web app B2C** | C0, C1 (Descoberta FORTE), C2, C4, C5, C6 (privacidade), C8, **C9 reforçada** (design system, i18n, A/B rules, copy guidelines) | C8 só em MVP | i18n, A/B testing infra |
| **Web app B2B / SaaS B2B** | TODAS | — | — |
| **SaaS regulado** (saúde, financeiro, gov) | TODAS + C6 reforçada | — | Auditorias externas, certificações |
| **Desktop app (Electron/Tauri)** | C0, C2 (sandbox/IPC/auto-update/CSP), C3 (main vs renderer), C4, C8 (code signing macOS/Windows, notarização, canal de update) | C6 se não coleta dados | ADR de auto-update + ADR de code signing |
| **Mobile app** | C0, C1, C2 (sync/offline), C3, C4, C5, **C8 (push, deeplink, attribution, crash reporting, store review, OTA são operação própria mesmo com BaaS)** | — | Store review checklists |
| **API/microservice (sem UI)** | C0, C2, C3 (OpenAPI/AsyncAPI), C4 (specs por endpoint), C8 (SLO, rate limit, deprecação versionada) | UX (C4 prd-ux) — N/A | Política de deprecação, contract testing |
| **Browser extension** | C0, C2 (manifest v3, permissões granulares), C3 (content/background/popup), C6 (privacy policy obrigatória nas stores), C8 (review da store) | C5 simplificada | Store review por navegador |
| **IDE/editor extension** (VS Code, JetBrains, Vim) | C0, C2 (extension API, activation events, telemetria opt-in), C3 (host process vs language server), C8 (marketplace review, versionamento contra IDE host) | C5 simplificada | Marketplace review + ADR de telemetria explícita |
| **SaaS plugin** (Shopify, WordPress, Salesforce) | C0, C2 (API do host, escopo de permissão, OAuth do host), C3 (webhooks, sync), C6 (audit log conforme exigência do marketplace), C8 (review do marketplace) | C5 simplificada | Marketplace review + política de dados conforme host |
| **Bot de chat (Telegram/Discord/Slack/WhatsApp)** | C0, C2 (webhooks, rate limits da plataforma), C4 (intents/commands), C8 (operação 24/7) | C1 se interno | Rate limit por plataforma |
| **Internal tool / admin panel** | C0, C3 (RBAC), C6 (audit log de ações privilegiadas, LGPD se toca cliente), C8 (SSO, rotação) | C1 resumida, C5 simplificada | Audit log granular |
| **Embedded / IoT** | C0, C2 (hardware), C3, C4, C8 (operação crítica), C6 (FCC/CE se aplicável) | — | OTA firmware update |
| **IA/ML produto** | C0, C1 (datasets!), C2 (model lifecycle), C3, C4, C6 (vieses, transparência, **IA Act**), C9 (eval) | — | **Model cards, datasheets, evals, prompt versioning, RAG indexing, lineage de dados, drift monitoring, classificação IA Act** |
| **Smart contract / DApp** | C0, C2 (consenso, gas), C3, C6 (regulatório cripto), C8 (incident response on-chain) | C1 resumida | Auditoria de contrato externa obrigatória |
| **Data pipeline / ETL** | C0, C3 (DAG), C6 (data lineage, retenção), C8 (DR) | C4 sem UX | Data quality auditor |
| **Jogo** | C0, C1 (playtest!), C2, C3, C4 (game design doc no lugar do PRD) | C6 (depende), C8 (depende de online) | Game balance + telemetria |
| **MVP throwaway que pode virar produto** | C0 + ADR-0000 + sintese-final + nao-fazer | TODO o resto | — |
| **Experimento ≤ 2 dias descartável** | Seção 22 (10 arquivos mínimos) | TUDO o resto | — |

---

## 20. Como o agente IA cria a estrutura (passo prático)

1. **Aplique a árvore de decisão da Seção 15** pra classificar o projeto.
2. **Inferir o máximo possível do briefing inicial** (nome do repo, mensagem do humano, manifestos no diretório). Perguntar APENAS o que não dá pra inferir com confiança — tipicamente 0-2 perguntas, nunca 4 fixas. Quando perguntar, usar `AskUserQuestion` com opções fechadas (Sim/Não ou 2-3 alternativas), não pergunta aberta. **Não perguntar:**
   - **Idioma** — pt-BR vem do CLAUDE.md global.
   - **Tipo de cliente** — se solo / pessoal / experimento, default "próprio dono".
   - **Regulado** — só perguntar se houver sinal de PII/fiscal no briefing.
3. **Gere `docs/nao-aplica.md`** listando camadas que NÃO vão existir e por quê.
4. **Crie C0** primeiro, com `AGENTS.md` em `draft` mas completo na estrutura (seções vazias OK, marcadas `<!-- PREENCHER -->`).
5. **Reporte C0 criada e siga DIRETO para C1.** Pause SÓ se houver decisão ambígua não resolvida pela árvore §15 OU se for SaaS regulado equipe ≥2 (caso em que `Pausa-1` aplica — ver §0, item 4). Modo solo / lib / CLI / oss / experimento: agente reporta e segue sem esperar.
6. **Para C1-C7**: gere **um esqueleto por arquivo** (frontmatter + seções + 1 parágrafo "preencher"). Não fabrique conteúdo de domínio que você não sabe.
7. **C9 (harness)**: gere com conteúdo real, copy-paste seguro (hooks funcionais, auditores prontos com os templates do Anexo A).
8. **Ao terminar**: escreva `docs/CHECKLIST-PRONTO-PRA-CODAR.md` com os itens da Seção 17 marcados ☐/☑.
9. **Reporte ao humano** em formato: "criei N arquivos, M esqueleto pra preencher, K com conteúdo real. Próximo passo é preencher Descoberta." (Sem perguntar permissão pra avançar — siga.)
10. **Inicie C1 (Descoberta) automaticamente** — abra `problema.md` em draft, faça as perguntas exploratórias da Seção 19 do template diretamente no chat. Não esperar novo prompt do humano.

---

## 21. Manutenção da estrutura

- **Semanal:** rodar `auditor-doc-quality` (3 sub-regras) em modo consultivo.
- **A cada doc novo:** atualizar `docs/INDICE.md` e `docs/documentos-do-projeto.md`.
- **A cada ADR aceita:** atualizar tabela em `AGENTS.md` seção 10 (ADRs ativas) + rodar `auditor-doc-quality` (sub-regra b — cascata de supersession) se a nova ADR supersede outra.
- **A cada fase fechada:** mover de "pendência" pra "feito" em `AGENTS.md` seção 11 (Pendências) + criar `retrospectiva.md`.
- **A cada hook novo:** adicionar caso de teste em `_test-runner.sh` (POSITIVO + NEGATIVO).
- **A cada auditor com prompt novo:** bump de versão no `catalogo-auditores.md` + reprocessamento obrigatório (task `T-AUDIT-REPROC-NNN`).
- **Trimestralmente:** poda do `MEMORY.md` (sumarização se >1500 linhas) + revisão dos overrides vencidos no ledger.
- **A cada marco:** atualização do `.agent/CURRENT.md`.
- **A cada 6 meses:** revisão do catálogo de auditores — aposentar auditor com 0 catches em N marcos.

---

## 22. Referência rápida — projeto micro (≤2 dias descartável)

Se o projeto é tão pequeno que você só pode criar 10 arquivos, crie estes:

1. `README.md`
2. `LICENSE`
3. `.gitignore`
4. `AGENTS.md` (≤100 linhas)
5. `CONTRIBUTING.md` (≤30 linhas)
6. `REGRAS-INEGOCIAVEIS.md` (5 regras)
7. `SECURITY.md` se houver usuário externo, rede, OSS ou regulação; em experimento descartável sem superfície externa, registrar N/A em `docs/nao-aplica.md`
8. `docs/descoberta/sintese-final.md` (1 página)
9. `docs/adr/0000-uso-de-ia.md` + `docs/adr/0001-stack.md`
10. `.pre-commit-config.yaml` (mínimo: secrets-scanner + block-destructive) + `.claude/settings.json` se usa Claude Code

Tudo o mais é crescimento orgânico — adicione quando o projeto pedir.

---

## Anexo A — Templates copy-paste

Os templates foram **extraídos para arquivos próprios** em [`templates/`](./templates/), pra que o agente IA possa **copiar literalmente** em vez de transcrever de prosa.

| Template | Destino no repo novo | Camada |
|---|---|---|
| [`templates/README.template.md`](./templates/README.template.md) | `/README.md` | C0 |
| [`templates/AGENTS.template.md`](./templates/AGENTS.template.md) | `/AGENTS.md` | C0 |
| [`templates/CLAUDE.template.md`](./templates/CLAUDE.template.md) | `/CLAUDE.md` (ou `.cursorrules`/`.windsurfrules`) | C0 |
| [`templates/CONTRIBUTING.template.md`](./templates/CONTRIBUTING.template.md) | `/CONTRIBUTING.md` | C0 |
| [`templates/SECURITY.template.md`](./templates/SECURITY.template.md) | `/SECURITY.md` | C0 |
| [`templates/REGRAS-INEGOCIAVEIS.template.md`](./templates/REGRAS-INEGOCIAVEIS.template.md) | `/REGRAS-INEGOCIAVEIS.md` | C0 |
| [`templates/CHECKLIST-PRONTO-PRA-CODAR.template.md`](./templates/CHECKLIST-PRONTO-PRA-CODAR.template.md) | `/CHECKLIST-PRONTO-PRA-CODAR.md` | C0 |
| [`templates/problema.template.md`](./templates/problema.template.md) | `docs/descoberta/problema.md` | C1 |
| [`templates/glossario.template.md`](./templates/glossario.template.md) | `docs/glossario.md` | C1 |
| [`templates/ADR.template.md`](./templates/ADR.template.md) | `docs/adr/NNNN-<titulo>.md` | C2 |
| [`templates/spec.template.md`](./templates/spec.template.md) | `docs/dominios/<dom>/modulos/<mod>/spec.md` | C4 |
| [`templates/plan.template.md`](./templates/plan.template.md) | `docs/dominios/<dom>/modulos/<mod>/plan.md` | C4 |
| [`templates/tasks.template.md`](./templates/tasks.template.md) | `docs/dominios/<dom>/modulos/<mod>/tasks.md` | C4 |
| [`templates/revisao.template.md`](./templates/revisao.template.md) | `docs/dominios/<dom>/modulos/<mod>/revisoes/<US-ID>-<agente>.md` | C4/C7 |
| [`templates/kickoff-fase.template.md`](./templates/kickoff-fase.template.md) | `docs/faseamento/<fase>/kickoff.md` | C5 |
| [`templates/ropa.template.md`](./templates/ropa.template.md) | `docs/conformidade/lgpd/ropa.md` | C6 |
| [`templates/auditor.template.md`](./templates/auditor.template.md) | `.claude/agents/auditor-<dominio>.md` | C7 |
| [`templates/runbook.template.md`](./templates/runbook.template.md) | `docs/operacao/runbooks/<procedimento>.md` | C8 |
| [`templates/post-mortem.template.md`](./templates/post-mortem.template.md) | `docs/operacao/incidentes/<YYYY-MM-DD-slug>.md` | C8 |
| [`templates/slo-sli.template.md`](./templates/slo-sli.template.md) | `docs/operacao/slo-sli.md` | C8 |
| [`templates/backup.template.md`](./templates/backup.template.md) | `docs/operacao/backup.md` | C8 |
| [`templates/disaster-recovery.template.md`](./templates/disaster-recovery.template.md) | `docs/operacao/disaster-recovery.md` | C8 |
| [`templates/on-call.template.md`](./templates/on-call.template.md) | `docs/operacao/on-call.md` | C8 |
| [`templates/retencao-dados.template.md`](./templates/retencao-dados.template.md) | `docs/conformidade/lgpd/retencao-dados.md` | C6 |
| [`templates/direitos-do-titular.template.md`](./templates/direitos-do-titular.template.md) | `docs/conformidade/lgpd/direitos-do-titular.md` | C6 |
| [`templates/dpo-action-plan.template.md`](./templates/dpo-action-plan.template.md) | `docs/conformidade/lgpd/dpo-action-plan.md` | C6 |
| [`templates/aipd.template.md`](./templates/aipd.template.md) | `docs/conformidade/lgpd/aipd.md` | C6 |
| [`templates/atender-pedido-eliminacao-runbook.template.md`](./templates/atender-pedido-eliminacao-runbook.template.md) | `docs/operacao/runbooks/atender-pedido-eliminacao.md` | C6/C8 |
| [`templates/change-management.template.md`](./templates/change-management.template.md) | `docs/operacao/change-management.md` | C8 |
| [`templates/catalogo-auditores.template.md`](./templates/catalogo-auditores.template.md) | `docs/governanca/catalogo-auditores.md` | C7 |
| [`templates/MAINTAINERS.template.md`](./templates/MAINTAINERS.template.md) | `/MAINTAINERS.md` | C0 |
| [`templates/data-contract.template.md`](./templates/data-contract.template.md) | `docs/dominios/<dom>/contratos/<contrato>.md` | C3 |
| [`templates/model-card.template.md`](./templates/model-card.template.md) | `docs/dominios/ia/modelos/<modelo>/model-card.md` | C3 |
| [`templates/data-card.template.md`](./templates/data-card.template.md) | `docs/dominios/ia/datasets/<dataset>/data-card.md` | C3 |
| [`templates/threat-model.template.md`](./templates/threat-model.template.md) | `docs/seguranca/threat-model.md` | C6 |
| [`templates/dependency-policy.template.md`](./templates/dependency-policy.template.md) | `docs/seguranca/dependency-policy.md` | C6 |
| [`templates/criptografia-policy.template.md`](./templates/criptografia-policy.template.md) | `docs/seguranca/criptografia-policy.md` | C6 |
| [`templates/key-management-policy.template.md`](./templates/key-management-policy.template.md) | `docs/seguranca/key-management-policy.md` | C6 |
| [`templates/resposta-incidente.template.md`](./templates/resposta-incidente.template.md) | `docs/seguranca/resposta-incidente.md` | C6 |
| [`templates/release-process.template.md`](./templates/release-process.template.md) | `docs/operacao/release-process.md` | C8 |
| [`templates/deployment-strategy.template.md`](./templates/deployment-strategy.template.md) | `docs/operacao/deployment-strategy.md` | C8 |
| [`templates/observabilidade.template.md`](./templates/observabilidade.template.md) | `docs/operacao/observabilidade.md` | C8 |
| [`templates/capacity-planning.template.md`](./templates/capacity-planning.template.md) | `docs/operacao/capacity-planning.md` | C8 |
| [`templates/performance-testing.template.md`](./templates/performance-testing.template.md) | `docs/operacao/performance-testing.md` | C8 |
| [`templates/rfc.template.md`](./templates/rfc.template.md) | `docs/comunidade/rfcs/RFC-NNNN-<slug>.md` | C12 |
| [`templates/governanca-comunidade.template.md`](./templates/governanca-comunidade.template.md) | `docs/comunidade/governanca.md` | C12 |
| [`templates/pre-commit-config.template.yaml`](./templates/pre-commit-config.template.yaml) | `/.pre-commit-config.yaml` | C9a |
| [`templates/cursorrules.template`](./templates/cursorrules.template) | `/.cursorrules` (se usa Cursor) | C9b |
| [`templates/windsurfrules.template`](./templates/windsurfrules.template) | `/.windsurfrules` (se usa Windsurf) | C9b |
| [`templates/kiro-steering.template.md`](./templates/kiro-steering.template.md) | `/.kiro/steering/00-agents.md` (se usa Kiro) | C9b |
| [`templates/settings.template.json`](./templates/settings.template.json) | `.claude/settings.json` | C9b |
| [`templates/hook-block-destructive.template.sh`](./templates/hook-block-destructive.template.sh) | `.claude/hooks/block-destructive.sh` | C9b |
| [`templates/hook-anti-mascaramento.template.sh`](./templates/hook-anti-mascaramento.template.sh) | `.claude/hooks/anti-mascaramento.sh` | C9b |
| [`templates/hook-secrets-scanner.template.sh`](./templates/hook-secrets-scanner.template.sh) | `.claude/hooks/secrets-scanner.sh` | C9b |
| [`templates/hook-frontmatter-validator.template.sh`](./templates/hook-frontmatter-validator.template.sh) | `.claude/hooks/frontmatter-validator.sh` | C9b |
| [`templates/hook-override-ledger.template.sh`](./templates/hook-override-ledger.template.sh) | `.claude/hooks/override-ledger.sh` | C9b |
| [`templates/hook-override-consume.template.sh`](./templates/hook-override-consume.template.sh) | `.claude/hooks/override-consume.sh` | C9b |
| [`templates/hook-no-verify-bypass.template.sh`](./templates/hook-no-verify-bypass.template.sh) | `.claude/hooks/no-verify-bypass.sh` | C9b |
| [`templates/hook-phase-gate.template.sh`](./templates/hook-phase-gate.template.sh) | `.claude/hooks/phase-gate.sh` | C9b |
| [`templates/hook-check-deps.template.sh`](./templates/hook-check-deps.template.sh) | `.claude/hooks/check-deps.sh` | C9b |
| [`templates/hook-staleness-checker.template.sh`](./templates/hook-staleness-checker.template.sh) | `.claude/hooks/staleness-checker.sh` | C9b |
| [`templates/hook-doc-line-counter.template.sh`](./templates/hook-doc-line-counter.template.sh) | `.claude/hooks/doc-line-counter.sh` | C9b |
| [`templates/hook-inject-context.template.sh`](./templates/hook-inject-context.template.sh) | `.claude/hooks/inject-context.sh` | C9b |
| [`templates/hook-auditor-commit-hygiene.template.sh`](./templates/hook-auditor-commit-hygiene.template.sh) | `.claude/hooks/auditor-commit-hygiene.sh` | C9b |
| [`templates/hook-pre-edit-evidence.template.sh`](./templates/hook-pre-edit-evidence.template.sh) | `.claude/hooks/pre-edit-evidence.sh` | C9b opt-in |
| [`templates/hook-post-claim-evidence.template.sh`](./templates/hook-post-claim-evidence.template.sh) | `.claude/hooks/post-claim-evidence.sh` | C9b opt-in |
| [`templates/CONVENCOES-DOC.template.md`](./templates/CONVENCOES-DOC.template.md) | `docs/CONVENCOES-DOC.md` | C10 |
| [`templates/INDICE.template.md`](./templates/INDICE.template.md) | `docs/INDICE.md` | C10 |
| [`templates/documentos-do-projeto.template.md`](./templates/documentos-do-projeto.template.md) | `docs/documentos-do-projeto.md` | C10 |
| [`templates/nao-aplica.template.md`](./templates/nao-aplica.template.md) | `docs/nao-aplica.md` | C10 |
| [`templates/CURRENT.template.md`](./templates/CURRENT.template.md) | `.agent/CURRENT.md` | C11 |
| [`templates/constitution.template.md`](./templates/constitution.template.md) | `.claude/memory/constitution.md` | C11 |

**Como usar:** copiar o template para o destino, remover sufixo `.template`, substituir placeholders `<...>` pelos dados do projeto, remover comentários `<!-- template: ... -->` do topo. Detalhes em [`templates/README.md`](./templates/README.md).

---

## Anexo B — Matriz multi-harness

Duas matrizes complementares, com escopos distintos:

- [`matriz-harness.md`](./matriz-harness.md) — contrato detalhado do **Claude Code** (eventos × matchers × hooks × decisão × severidade × permissions × modos). Espelha `templates/settings.template.json`.
- [`matriz-multi-harness.md`](./matriz-multi-harness.md) — visão **cross-harness** (compatibilidade de features entre Claude Code, Cursor, Windsurf, Codex CLI, Kiro). Use quando o projeto-destino mistura múltiplos harnesses.

**Resumo executivo:** regra crítica vive em **pre-commit git + CI** (universal, funciona em qualquer harness). Hooks/subagentes/skills do harness são **UX** (feedback imediato pro agente), não rede de segurança.

---

**Fim do manual.**

Última atualização: 2026-05-27.
Inspirado em projetos SaaS regulados em produção e generalizado para qualquer tipo de software.
