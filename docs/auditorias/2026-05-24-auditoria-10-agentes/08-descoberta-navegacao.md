---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: descoberta-navegacao
nota: 8/10
---

# Auditoria Descoberta e Navegação — 2026-05-24

## Resumo executivo
**Nota: 8/10.** Roldão acha o que precisa em ~5s pra 80% dos casos. **Melhor entrada:** `/help` (árvore de decisão literal "É algo que NÃO funciona? → /bug"). **Pior entrada:** descoberta de skills e addons — invisíveis pra leigo que não lê README até a linha 70.

## Pontos de entrada que JÁ funcionam
- **`/help`** — árvore de decisão visual ("É EMERGÊNCIA em produção? → /hotfix"), tabela com código curto (BG, FT, QD), cenários comuns. Suporta `/help BG` pra detalhe. Exemplar.
- **`README.md`** linha 25 — "Depois, no seu assistente de IA: `/inicio` (projeto novo) ou `/brownfield` (já tem código). `/help` lista os 26 roteiros." Citação literal direta ao ponto.
- **`docs/PARA-DONO-DE-PRODUTO.md`** — "5 momentos que você vai viver" + tabela "O que você quer / Digite" mapeia desejo → comando. Ouro pra leigo.
- **`docs/GLOSSARIO.md`** — separa "termos do dia-a-dia" / "termos do framework" / "quando o assistente disser algo estranho".
- **`MAPA-VISUAL.md`** — árvore "Por tipo de tarefa", tabela "Por workflow" + ícones+nomes. Esclarece que **leigo NÃO invoca agente direto** (chave).
- **`docs/README.md`** — índice navegável com seções "🚀 Começando", "🆘 Quando algo dá errado", "🗺️ Caminho recomendado".

## Mapas faltando (P0)
- **Catálogo de addons sem entrada própria em `/help`** — `addons/README.md` existe mas `/help` não menciona addons. Roldão integrando Pix não descobre que existe `fintech-br` salvo se ler README até linha 84. **Sugestão:** seção "Precisa de mais?" no `/help` listando 7 addons + 1 frase cada.
- **Skills invisíveis em `/help`** — `/help` cita 0 das 13 skills. **Sugestão:** adicionar `/help skills` ou bloco "Validações prontas (CPF, CNPJ, Pix, NF-e, CEP, IE, boleto, BR Code)" no `/help`.

## Naming confuso (P1)
- **`/clarificar` vs `/historia` vs `/epico` vs `/prd`** — gradiente de tamanho não óbvio. **Sugestão:** rotular na tabela como "(ideia vaga)", "(1 story)", "(coleção de stories)", "(iniciativa de semanas)".
- **`/qa` vs `/auditoria` vs `/auditoria-reversa` vs `/consistencia` vs `/readiness`** — 5 comandos "de qualidade". `/qa` (testes de área) e `/auditoria` (3 auditores no diff atual) confundem. **Sugestão:** renomear `/qa` → `/testes-area`.
- **`/inicio` vs `/brownfield`** — claro pra dev; "brownfield" é jargão pra leigo. **Sugestão:** alias `/adotar` ou `/projeto-existente`.
- **Apelidos pessoais (Sofia, Bruno, Detetive)** — ajudam em `MAPA-VISUAL.md` mas confundem em `/help` linhas 59-84 onde aparecem sem legenda. **Sugestão:** no `/help`, usar "Sofia (PM)" "Detetive (investiga)" inline na primeira menção.

## Skills/addons invisíveis (P1)
- **Skills BR validadoras** (`validar-cpf-cnpj`, `gerar-br-code`, `validar-chave-acesso-nfe`) — Roldão construindo checkout Pix nunca descobre que existe `gerar-br-code` pronto. **Sugestão:** seção no README "Validações prontas pro Brasil".
- **Addons** — `npx roldao-method search` existe mas nunca é mencionado em `/help`. Cliente que vai integrar eSocial deveria ver "Considera instalar `esocial-completo`?". **Sugestão:** hook ou linha em `/help`/`/feature` que sugere addon quando o pedido casa com keywords.
- **`docs/runbooks/incident-response-lgpd.md`** — só linkado em `docs/README.md` linha 43. Quem está em incidente de vazamento não vai abrir docs/README primeiro. `/hotfix` e `/incident-postmortem` deveriam linkar direto.

## Glossário/jargão sem porto seguro (P1)
- **IDs `INV-`, `SEC-`, `TST-`, `LGPD-`, `FISCAL-`, `PIX-`** — apareceriam em commits/PRs. Glossário tem "REGRA #0" e "ADR" mas **não tem** entrada explicando que `LGPD-001` é regra rastreável. **Sugestão:** adicionar bloco em `GLOSSARIO.md` "O que são esses códigos no commit?".
- **`US-NNN`, `AC-NNN-N`, `T-NNN`, `EP-NNN`, `PRD-NNN`** — citados em `roldao-method.md` e `/help` sem definição visível pro leigo.
- **"Pipeline mental por feature" / "fail-closed" / "lifecycle hooks" / "soft warning"** — termos sem entrada no glossário.
- **`/shard`** — palavra inglesa intraduzível pra leigo. Nem o glossário nem `/help` explicam o que é "fatiamento de PRD/ARQ longo".

## Veredito
**Sim, Roldão consegue olhar `/help` e dizer "vou usar /bug pra isso" — a árvore de decisão entrega em 5s.** O sistema de descoberta de **comandos** está maduro (3 entradas redundantes: `/help`, `README.md`, `PARA-DONO-DE-PRODUTO.md`). **O elo fraco é descoberta de skills e addons:** se Roldão pedir "validar CPF do cliente", ele depende do agente proativamente invocar `validar-cpf-cnpj` — não tem `/help skills` nem `/help addons`. Para o caso comum (criar feature, reportar bug, ver status) o framework é auto-suficiente. Para o caso especializado (escolher addon, descobrir skill BR, entender ID de regra em commit) o leigo ainda precisa de alguém apontar.
