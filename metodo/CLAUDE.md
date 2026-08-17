---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: ativa o ritual do meta-template quando Claude Code abre nesta pasta.
---

@AGENTS.md

# CLAUDE.md — camada metodo/ do roldao-method

> **Você (Claude Code) está DENTRO da camada metodo/ do roldao-method.** Esta pasta não é um produto. É o método canônico que você executa para CRIAR projetos novos em outra pasta.

## 1. Reconhecimento de contexto — leia primeiro

Se o usuário pediu algo que pareça **iniciar um projeto novo** (frases como "quero criar", "novo projeto", "começar um sistema", "fazer um app/CLI/lib/SaaS para X"):

1. **NÃO escreva código nem arquivos dentro desta pasta** (`metodo/`). Esta pasta é o método; ela permanece intacta.
2. **Leia agora**, em ordem:
   - [`QUICKSTART.md`](./QUICKSTART.md) — 3 passos resumidos.
   - [`ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`](./ESTRUTURA-PROJETO-NOVO-DO-ZERO.md) §0 (linhas ~51-83) e §15 (árvore) e §20 (passo prático).
   - [`templates/README.md`](./templates/README.md) — catálogo dos templates.
3. **Pergunte ao usuário só o nome** do projeto se ele não disse (1 pergunta, com `AskUserQuestion`). Use isso para definir a pasta destino: `../<nome-kebab-case>/`.
4. **Tipo é HIPÓTESE, não decisão.** O método é **descoberta-first**: a categoria do produto (SaaS regulado? CLI? lib?) deve sair da Descoberta (C1), não ser decidida no kickoff. Você pode formar uma hipótese inicial ("parece CLI", "parece SaaS-regulado") pela árvore §15, mas isso é só etiqueta provisória — não materializa C6/C8 ainda.
5. **Execute bootstrap fase-1 (descoberta-first)**:
   ```bash
   bash bootstrap.sh "<caminho-destino-absoluto>" "<nome-do-projeto>" [hipótese-de-tipo]
   ```
   Materializa só: C0 raiz + C1 descoberta completa (16 esqueletos) + C9 harness + C2 pasta + C7 catálogo + C10 convenções. **NÃO cria C6 (LGPD/segurança) nem C8 (operação)** — isso é fase-2.
6. **Conduza C1 com o usuário.** Inferir do briefing, perguntar 3-5 coisas concretas (não 4 abertas), preencher problema → personas → jornadas → BMC → VPC → ... → sintese-final. Status `draft` até validar com o dono.
7. **Quando `docs/descoberta/sintese-final.md` virar `status: stable`**, classifique o tipo DEFINITIVO (reaplicando árvore §15 com o que descobriu) e rode fase-2:
   ```bash
   bash bootstrap-fase-2.sh "<caminho-destino-absoluto>" "<tipo-definitivo>"
   ```
   Materializa C5 kickoff-foundation + C6 conformidade (só se aplica) + C8 operação (só se aplica) + C12 comunidade (só OSS).
8. **Abra ADR-0001 (stack) e ADR-0002 (tenancy/storage)** em `docs/adr/`. Antes disso, `phase-gate.sh` bloqueia escrita em `src/`.
9. **Reporte no fim**: o que criou em cada fase, o que pulou (com justificativa em `nao-aplica.md`), o que ficou pendente.

## 2. Se o usuário pediu para AUDITAR, EVOLUIR ou CORRIGIR este meta-template

Aí sim você pode editar arquivos DENTRO desta pasta. Sinais: "auditoria", "revisar manual", "criar template novo", "atualizar matriz", "corrigir achado". Continue normalmente respeitando os limites de linha do frontmatter de cada arquivo.

## 3. Linguagem e perfil do usuário

Detalhes em `AGENTS.md §1` (este meta-template). Resumo inegociável:

- **Roldão não programa.** Traduzir todo jargão (PR, branch, CI, merge, commit, deploy, refactor...). Tabela de tradução canônica (fonte única): `GLOSSARIO-ROLDAO.md`; a regra que a torna obrigatória é INV-AGENT-010 em `templates/REGRAS-INEGOCIAVEIS.template.md`.
- **Pró-atividade total** (INV-AGENT-004): ações reversíveis e sem custo são executadas sem perguntar. Nunca escrever `"Quer que eu...?"`, `"Posso fazer X?"`, `"Devo continuar?"`. Aplique a matriz 2×2 do `templates/AGENTS.template.md §13.1`.
- **Investigar antes de editar** (INV-AGENT-003): ler banco/log/payload/console e entender a causa antes de mexer em lógica — nunca trocar template/UI no chute.
- **Causa raiz, nunca sintoma** (INV-AGENT-006): proibido mascarar erro (`skip`, `@ts-ignore`, `eslint-disable`, `|| true`, baseline pra esconder, asserção relaxada).
- **Conversar em pt-BR**. Código e identificadores em inglês.

## 4. Estado do ambiente (defaults — não perguntar)

| Item | Valor |
|---|---|
| Sistema operacional | Windows 11 |
| Shell | bash (Git for Windows ≥ 2.40) |
| Caminhos com espaço | sempre entre aspas duplas |
| Paths Unix | `/` em vez de `\` |
| `/dev/null` | em vez de `NUL` |

## 5. O que NÃO repetir aqui

Já coberto em outros docs desta pasta — referencie, não copie:

- Como executar o ritual passo a passo → `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md` §0, §15, §20.
- Catálogo de templates e destinos → `templates/README.md`.
- Hierarquia de fontes de verdade → `README.md` linhas 18-29.
- Matriz de comportamento de hooks → `matriz-harness.md`.
- Compatibilidade multi-harness → `matriz-multi-harness.md`.
- Glossário do método → `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md` §1.5 + `GLOSSARIO-ROLDAO.md`.

<!-- Se sentir vontade de copiar conteúdo dos arquivos acima pra cá, PARE.
     Adicione referência, não cópia. -->
