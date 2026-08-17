---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: CLAUDE.md — projeto @conciliab/csv-parser
adendo específico do harness Claude Code.
-->

@AGENTS.md

# CLAUDE.md — @conciliab/csv-parser

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence. CLAUDE.md é o mais específico (canal Claude Code) e o mais fácil de mudar.

> Este arquivo é o adendo do harness Claude Code. A fonte canônica é [`AGENTS.md`](./AGENTS.md). Em conflito, AGENTS.md vence (e acima dele, REGRAS-INEGOCIAVEIS.md e constitution.md).

## 1. Perfil do usuário e linguagem

O dono do projeto **não programa**. É idealizador/dono de produto, não desenvolvedor. Conhece o domínio (extratos bancários, conciliação) melhor que ninguém, mas não lê código nem stack trace.

Regra de linguagem e tabela de tradução de jargão: ver **INV-AGENT-010** em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) (a tabela canônica vive no anexo 2.A da INV; este arquivo apenas referencia).

Regra de pró-atividade (executar reversíveis sem perguntar, lista destrutiva exige confirmação): ver **INV-AGENT-004** em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md).

## 2. Regra de investigação antes de editar

Ver **INV-AGENT-003** em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md).

Em particular para esta lib: ao reportar bug de parsing, **antes** de mexer no parser, pedir/obter o arquivo de input real (ou um snapshot mínimo reproduzindo o problema). Mudar regex ou regra sem ver o input é a forma mais rápida de quebrar 3 outros bancos pra "consertar" 1.

## 3. Idioma do canal

- Conversar em **PT-BR**.
- Código, identificadores e nomes de arquivo em **inglês** (compat npm + comunidade OSS internacional).
- Mensagens de commit em **inglês** (alinhamento com convencional commits e changesets).

## 4. Estado do ambiente

| Item | Valor |
|---|---|
| Sistema operacional padrão | Windows 11 Pro |
| Shell | bash (Git Bash) |
| Gerenciador de pacotes | pnpm 9 |
| Versão da runtime | Node 20 LTS (dev local); CI roda matriz Node 20/22 + Deno 1.40 + Bun 1.1 |
| Banco local | N/A — lib pura |

## 5. Notas de plataforma

- **Windows:** usar `/` em paths no bash; `NUL` não existe no bash, usar `/dev/null`.
- **Line endings:** `.gitattributes` força `LF` em `*.ts`, `*.json`, `*.md` — CRLF do Windows quebraria parsers de CSV no diff/snapshot.
- **Símbolos de moeda:** snapshots têm `R$` e caracteres acentuados; sempre rodar bash em UTF-8 (`chcp 65001` se hint disso aparecer no terminal).

## 6. O que NÃO repetir aqui

Itens já cobertos em outros contratos. **Não duplicar — referenciar**:

- Política de commits (atômicos, sem `--no-verify`, sem `--force` em main). → `REGRAS-INEGOCIAVEIS.md` INV-AGENT-002, INV-AGENT-007.
- Stack, comandos canônicos, ADRs ativas. → `AGENTS.md §2, §6, §10`.
- Invariantes de produto/agente (INV-PARSER-NNN, INV-AGENT-NNN). → `REGRAS-INEGOCIAVEIS.md`.
- Princípios fundadores. → `.claude/memory/constitution.md`.
- Fluxo de PR/release. → `CONTRIBUTING.md`.

<!-- Se sentir vontade de copiar conteúdo dos arquivos acima pra cá, PARE.
     Adicione referência, não cópia. CLAUDE.md fala só do que é específico do harness Claude Code. -->
