---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: autonomia-agentes
nota: 8/10
---

# Auditoria Autonomia de Agentes — 2026-05-24

## Resumo executivo
Nota geral: **8/10**. Autonomia é doutrina FORTE (INV-AGENT-006, hook `block-confirmation-questions.js`) e a maioria dos agentes obedece. Mais autônomo: **investigador** (resolve ambiguidade gravando em `pendencias[]` no JSON, NÃO pausa o pipeline). Menos autônomos: **analista** ("1-3 perguntas pendentes que o PM precisa responder") e **dba-dados/devops-infra** que listam "Pergunta:" como parte do método operacional, ambíguo se é pra usuário ou pra inferir do contexto.

## Agentes AUTÔNOMOS (modelo a seguir)
- **investigador** (`investigador.md:45`) — "**NÃO pare o pipeline pra perguntar — registre as 2-3 interpretações possíveis**. O orquestrador decide se vale perguntar". Padrão correto.
- **maestro** (`maestro.md:61, 73, 194`) — "Não pergunte — anuncie 'Assumido US-NNN'", decide REGRA #0 sozinho, escolhe Rafael skip vs run pelo JSON do investigador.
- **gerente-produto/Sofia** (`gerente-produto.md:67-75, 106`) — "Resolva sozinho na maioria dos casos... documente em `premissas:` no frontmatter". Lista 4 exemplos de "quando NÃO perguntar".
- **tech-writer/Camila** (`tech-writer.md:93`) — "Identifique o modo pelo gatilho do comando... Não pergunte — escolha pelo contexto e reporte a escolha".
- **dba-dados** (`dba-dados.md:61`) e **devops-infra** (`devops-infra.md:65`) — disclaimer explícito "Não pergunte — escolha pelo contexto e reporte".
- **3 auditores** — todos com seção "Conserte direto e reporte. Aplica sem perguntar" (`auditor-produto.md:72`, `auditor-qualidade.md:87`, `auditor-seguranca.md:78`).

## Agentes que jogam decisão de volta no usuário (P0)
- **analista/Mariana** (`analista.md:103`) — saída obrigatória inclui *"1-3 perguntas pendentes que o PM precisa responder antes de virar PRD"*. **Reformulação:** trocar por "1-3 premissas que o PM deve confirmar com o investigador/código antes de cristalizar AC — só escalar pro usuário se afetar comportamento observável".
- **dba-dados** (`dba-dados.md:53`) e **devops-infra** (`devops-infra.md:56-57`) — modos descrevem o método como `**MOD** — Modelagem nova. Pergunta padrão de acesso esperado, cardinalidade...`. Linguagem ambígua. **Reformulação:** trocar "Pergunta padrão de X" por "Infere de X (lendo schema/CI yaml/Dockerfile); se faltar, assume default `Y` e marca premissa".
- **/bug** (`bug.md:22`) — *"Se o investigador disser 'preciso de mais info', **pergunte ao usuário ANTES** de propor solução"*. Conflita com `investigador.md:45`. **Reformulação:** "Se o investigador marcou item em `pendencias[]` com `impacto: comportamento-visivel`, dispare AskUserQuestion com as opções já listadas no JSON. Caso contrário, escolha o default".

## Pipelines que param desnecessariamente (P1)
- **/inicio** (`inicio.md:70`) — "Só pergunte se houver conflito real" — bom. MAS não diz como inferir nome do projeto, modelo SaaS/app, cliente. **Sugestão:** ler `package.json#name` → fallback `basename($PWD)`; modelo padrão = "app interno"; cliente = "definir depois".
- **/prd etapa 2** (`prd.md:28`) — analista joga "1-3 perguntas" no doc. Cadeia inteira pode parar.

## Defaults faltando que forçam pergunta ao leigo (P1)
- **AGENTS.md template** (campos `_(preencher)_`) — `/inicio` etapa 4 precisa preencher 7 campos de Stack + 7 de Comandos. Sem default, agente vai perguntar. **Sugestão:** auto-detectar via mesma heurística do `/brownfield` (que JÁ faz isso bem em `brownfield.md:17-31`).
- **Nome do projeto** — `/inicio` aceita `[nome-projeto opcional]` mas não diz fallback se vazio.
- **Modo do agente** — todos têm "menu" com 3-6 modos. Agente invocado direto pelo usuário pode parar.

## Onde AskUserQuestion deveria substituir texto livre (P2)
- **/clarificar** já usa corretamente.
- **/bug etapa 2** — usa, mas mistura com "pergunte ao usuário" texto livre. Padronizar pra SEMPRE `AskUserQuestion` com opções vindas do `pendencias[]`.
- **/inicio etapa 4 confirmação** — quando agente acha 2 stacks viáveis, em vez de texto livre, AskUserQuestion: `[Node+TS] [Python+FastAPI] [Java+Spring]`.

## Falsos positivos / cobertura do hook `block-confirmation-questions.js`
- **Cobertura:** sólida — 16 patterns, incluindo EN ("do you want me to", "would you like me to"). Exceção LEGIT corretamente isenta operações destrutivas.
- **Gap:** não cobre "Confirma que posso seguir?", "Vou prosseguir?" (sem "que eu"), "Aceita esse caminho?", "Tudo certo aí?". **Sugestão:** adicionar `/\b(confirma|aceita|tudo certo|tudo bem)\b.*\?/i` e `/\bvou (prosseguir|seguir|continuar|aplicar|fazer)\b\?/i`.

## Veredito
Os agentes respeitam INV-AGENT-006 na PRÁTICA, não só na doutrina — o hook ativo bloqueia mecanicamente, e 13 dos 15 agentes têm seção explícita "não pergunte, decida". O Roldão consegue rodar `/feature US-NNN` inteira sem digitar nada além do request inicial, contanto que: (1) readiness do épico esteja PRONTO, (2) US já exista no disco, (3) o `analista` não tenha sido invocado. O ponto mais frágil é o **`/inicio` de projeto greenfield SEM dados pra inferir** — falta auto-fill que reuse a heurística já existente em `/brownfield`. Corrigindo os 3 P0 e adicionando os 2 patterns no hook, a nota sobe pra 9.5/10.
