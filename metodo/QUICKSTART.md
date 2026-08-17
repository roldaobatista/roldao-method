---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 120
proposito: ponto de entrada curto. Como iniciar projeto novo, em 2 fases (descoberta-first).
---

# QUICKSTART — como iniciar um projeto novo

> Leitura curta. Versão completa em `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`.

## Princípio: descoberta antes de tecnologia

O método é **descoberta-first**. A categoria do produto (SaaS regulado? CLI? lib?) e a stack tecnológica (Python? Rust? TypeScript?) **saem da descoberta** — não vêm prontas no início. O bootstrap roda em **2 fases**:

- **Fase-1**: cria estrutura mínima + descoberta completa em `draft`. Sem decidir stack ou aplicar conformidade.
- **Fase-2**: depois da descoberta fechar (`sintese-final.md` em `status: stable`), adiciona C5/C6/C8 conforme tipo apurado.

## Para o dono (Roldão)

> Travou em algum termo técnico abaixo? Abra o [GLOSSARIO-ROLDAO.md](GLOSSARIO-ROLDAO.md) — ele traduz todo o jargão para linguagem de dono não-técnico.

1. Abra Claude Code **dentro desta pasta**: `C:/projetos/Modelo-projeto-novo/`.
2. Digite o que quer criar, em linguagem livre. Exemplos:
   - *"quero criar um sistema pra padaria controlar produção, estoque e vendas"*
   - *"quero uma biblioteca pra parsear arquivos CSV"*
   - *"quero um CLI pra renomear fotos em lote"*
3. O agente vai:
   - rodar fase-1 do bootstrap (cria cerca de 50 arquivos esqueletados em `..\<nome>\`; 49 em experimento),
   - fazer 3-5 perguntas concretas para preencher a descoberta,
   - mostrar o problema, personas, jornadas, métricas, etc. em `draft`,
   - quando você der OK e a `sintese-final.md` virar `stable`, classificar o tipo e rodar fase-2,
   - abrir ADR-0001 (escolha de stack) e ADR-0002 (tenancy/storage).

Você **nunca copia arquivo à mão**, **nunca renomeia `.template`**, **nunca escolhe a stack no início**. O agente faz tudo via bootstrap.

## Para o agente IA

Você está na pasta do meta-template. Quando o usuário pedir projeto novo:

### Fase-1 — descoberta-first

1. **Leia primeiro**: `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md` §0, §15, §20 + `templates/README.md`.
2. **Pergunte só o nome** (1 pergunta com `AskUserQuestion`). Não pergunte stack, regulação, equipe — isso sai da descoberta.
3. **Forme hipótese de tipo** pela árvore §15 (provisória, só rótulo). Ex.: briefing "padaria controlar estoque" → hipótese `saas` (não `saas-regulado` ainda — confirmar via descoberta).
4. **Execute**:
   ```bash
   bash bootstrap.sh "<caminho-destino-absoluto>" "<nome-do-projeto>" [hipótese-de-tipo]
   ```
   Cria: C0 raiz (13 arquivos; 12 em experimento porque `SECURITY.md` vira N/A), C1 descoberta completa (16 arquivos em `docs/descoberta/` + `docs/glossario.md`), C9 multi-harness (`.pre-commit-config.yaml`, `.claude/settings.json`, `.cursorrules`, `.windsurfrules`, `.kiro/steering/00-agents.md`, 15 hooks copiados), C7/C10 esqueleto e C2 vazia. Cerca de 50 arquivos.

   **Quando marcar `experimento`/`solo` (NÃO gera descoberta completa):** se o briefing for claramente experimento ≤2 dias, OU lib/CLI sem usuário final (dono = único usuário), OU ferramenta dev interna, OU produto que não é vendido nem distribuído (critérios da §3 / linhas 371-376 do manual). Nesse caso só `problema.md` basta — registre o pulo da C1 detalhada em `docs/nao-aplica.md` com justificativa. Em qualquer dúvida sobre haver usuário externo, NÃO marque experimento: gere a descoberta completa.

   **Número aproximado de arquivos por tipo:**

   | Tipo | Arquivos (aprox.) |
   |---|---|
   | SaaS | ~50 |
   | lib | ~45 |
   | experimento | ~35 |
5. **Conduza C1**: preencher problema.md primeiro (perguntas concretas ao dono), depois personas, jornadas, métricas, etc. Cada arquivo `draft` → `stable` conforme preenche.
6. **Status check periódico**: reporte ao dono "preenchi X, ainda falta Y, próxima pergunta é Z". Não pedir permissão pra avançar.

### Transição fase-1 → fase-2

7. **Quando `docs/descoberta/sintese-final.md` virar `status: stable`** (gate de §11 do template), **reclassifique** o tipo aplicando árvore §15 com o que VOCÊ DESCOBRIU (pode mudar — ex: briefing "padaria" hipotetizou `saas`, descoberta revela que precisa lidar com NF-e → `saas-regulado`).
8. **Execute fase-2**:
   ```bash
   bash bootstrap-fase-2.sh "<caminho-destino-absoluto>" "<tipo-definitivo>"
   ```
   Adiciona: C5 kickoff-foundation + C6 segurança/conformidade (só se aplicar) + C8 operação (só se aplicar) + C12 comunidade (só oss-lib).

### Continuação

9. **Abra ADR-0001 (escolha de stack)** em `docs/adr/0001-stack.md` baseado no que a descoberta revelou. **Antes de ADR-0001 aceita, `phase-gate.sh` bloqueia escrita em `src/`.**
10. **Abra ADR-0002 (tenancy/storage)** se multi-tenant ou persiste dado.
11. **Comece foundation F-A** (auth + multi-tenant + observabilidade). Material em `docs/faseamento/F-A/`.
12. **Avise o dono que precisa reabrir o Claude Code** na pasta destino para os hooks ativarem.

## O que NÃO fazer

- **Não escolher stack no início.** Stack é ADR-0001, sai depois da descoberta.
- **Não materializar C6/C8 antes de C1 fechar.** Por isso bootstrap-fase-2 só roda com sintese-final em stable.
- **Não escrever código em `src/`** antes de ADR-0001 aceita. O phase-gate.sh bloqueia.
- **Não escrever arquivos DENTRO desta pasta** `Modelo-projeto-novo/`. Esta pasta é o método; permanece intacta.
- **Não fazer 4 perguntas abertas** ("qual stack? qual domínio? qual equipe? qual prazo?"). 1-2 perguntas fechadas via `AskUserQuestion`.

## Para projetos micro/experimento (atalho)

Se o briefing for claramente experimento ≤2 dias ou solo descartável:
- Passe `experimento` ou `solo` como hipótese de tipo no bootstrap fase-1.
- Crie `.claude/.phase-gate-disabled` vazio no destino — desliga o gate.
- Pode pular C1 detalhada (só `problema.md` basta) e ir direto pra código.
- Documente o pulo em `docs/nao-aplica.md` com justificativa.
