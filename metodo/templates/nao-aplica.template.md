---
owner: <quem>
revisado-em: <YYYY-MM-DD>
idioma: pt-BR
status: draft
limite-linhas: 200
proposito: registrar camadas/templates que o projeto decidiu não aplicar e por quê, com gatilho de reavaliação
---

<!--
template: docs/nao-aplica.md
uso: copiar para docs/ na raiz.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C0
proposito: registrar camadas/artefatos da estrutura canônica que este projeto NÃO usa, com justificativa,
            evidência concreta, responsável pela revalidação e gatilho de reavaliação.
            Evita ser cobrado por auditor-meta sem ter contexto.
-->

# Não aplica — <NomeDoProjeto>

> O que este projeto deliberadamente NÃO faz da estrutura canônica, e quando reavaliar.

## Regras de uso

- **Toda entrada exige evidência concreta.** Justificativa textual sozinha não basta — precisa link para schema, ADR, screenshot, configuração, ou outro artefato que prove a ausência.
- **Toda entrada exige `revalidacao-em` (data concreta).** Nenhuma exceção fica "pra sempre".
- **Toda entrada exige `responsavel-revalidacao`** (pode ser diferente do `owner` do doc — é quem vai conferir na data).
- Gatilho de reavaliação deve ser **evento observável**, não "talvez no futuro".
- Auditor-meta lê este arquivo: o que está aqui não gera finding; o que está faltando gera.
- Quando o gatilho disparar OU `revalidacao-em` vencer, mover a linha pra histórico abaixo e implementar a camada (ou justificar nova entrada com novo prazo).

### Exemplo do nível de prova exigido

- **NÃO ACEITAR:** "Projeto não trata dado pessoal."
- **ACEITAR:** "Projeto não trata dado pessoal — schema confirma só campos técnicos (link: `docs/dados/schema.md`), ADR-0003 documenta decisão, revalidar em 6 meses."

## Tabela de exceções

| Camada / Artefato | Não aplica porque | Evidência | Responsável revalidação | Revalidação em | Reavaliar quando |
|---|---|---|---|---|---|
| C6 / `docs/lgpd/` | Projeto não trata dado pessoal — só configura instância local do próprio dono. | Schema `docs/dados/schema.md` mostra só campos técnicos; ADR-0003 documenta decisão. | <nome> | <YYYY-MM-DD> | Coletar e-mail, CPF, telefone ou qualquer identificador de pessoa física. |
| C9b / arquivo `.cursorrules` | Projeto usa só Claude Code como harness de IA. | `.claude/` é o único diretório de harness no repo; `package.json` não referencia Cursor. | <nome> | <YYYY-MM-DD> | Equipe crescer com outros editores (Cursor, Windsurf) compartilhando o repositório. |
| C5 / `docs/i18n/` | Produto monolíngue PT-BR sem plano de internacionalização. | UI strings em PT-BR no código (`src/i18n/` ausente); ADR-0005 documenta escopo Brasil-only. | <nome> | <YYYY-MM-DD> | Cliente fora do Brasil entrar no pipeline. |

<!-- Adicionar uma linha por camada/artefato pulado. NUNCA pular sem registrar aqui —
     se não está nesta tabela, é porque o projeto deveria ter o artefato. -->

## Histórico (camadas reativadas)

<!-- Quando uma camada antes "não aplica" passa a aplicar, registrar aqui em vez de apagar. -->

| Camada | Data reativação | Motivo (gatilho que disparou) |
|---|---|---|
| <vazio> | | |

---

> **Link bidirecional:** revisar este NÃO-APLICA em `<revalidacao-em>` — se o gatilho mudou ou a evidência envelheceu, reabrir o doc original (LGPD, i18n, etc.) e mover a linha para o histórico acima.
