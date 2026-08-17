---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 150
proposito: adendo do harness Claude Code para o tempo-cli — perfil do dono, idioma do canal, ambiente Windows + Git Bash
---

<!--
arquivo: CLAUDE.md do projeto-exemplo tempo-cli.
contexto: CLI Rust solo. Tudo canônico mora em AGENTS.md; aqui só especificidades de Claude Code.
-->

@AGENTS.md

# CLAUDE.md — tempo-cli

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence. CLAUDE.md é o mais específico (canal Claude Code) e o mais fácil de mudar.

> Este arquivo é o adendo do harness Claude Code. A fonte canônica é [`AGENTS.md`](./AGENTS.md). Em conflito, AGENTS.md vence (e acima dele, REGRAS-INEGOCIAVEIS.md e constitution.md).

## 1. Perfil do usuário e linguagem

O dono do projeto (Roldão) **não programa**. É idealizador/dono de produto.

Regra de linguagem e tabela de tradução de jargão: ver **INV-AGENT-010** em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) (a tabela canônica vive no anexo 2.A da INV; este arquivo apenas referencia).

Regra de pró-atividade (executar reversíveis sem perguntar, lista destrutiva exige confirmação): ver **INV-AGENT-004** em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md) e §13 do `AGENTS.md` (que lista os destrutivos específicos deste projeto, incluindo `cargo publish` e `cargo yank`).

## 2. Regra de investigação antes de editar

Ver **INV-AGENT-003** em [`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md).

Aplicação prática neste projeto: bug reportado em comando do CLI? Antes de mudar código:
1. Rodar o comando exatamente como o usuário rodou.
2. Abrir `~/.tempo-cli/db.sqlite` com `sqlite3` e olhar o estado real das tabelas.
3. Conferir saída de `--verbose` se existir.
Só DEPOIS editar.

## 3. Idioma do canal

- Conversar em **PT-BR**.
- Código, identificadores, nomes de comando e mensagens de erro ao usuário em **inglês** (convenção CLI).
- Mensagens de commit em **PT-BR** com prefixo curto em inglês (`fix:`, `feat:`, `docs:`).

## 4. Estado do ambiente

| Item | Valor |
|---|---|
| Sistema operacional padrão | Windows 11 Pro (máquina do dono); CI em Linux + macOS + Windows |
| Shell | bash (git-bash no Windows) |
| Gerenciador de pacotes | cargo |
| Versão da runtime | Rust 1.78+ (MSRV declarado em `Cargo.toml`) |
| Banco local | SQLite via `rusqlite` (bundled, sem precisar instalar SQLite) |

## 5. Notas de plataforma

Quirks relevantes para este projeto:

- Windows: usar `/` em paths no bash; `NUL` não existe no bash, usar `/dev/null`.
- Windows: o home do usuário no Rust é `dirs::home_dir()` — funciona cross-platform; **não** hardcodar `~` em string.
- macOS/Linux: `~/.tempo-cli/` deve respeitar XDG (`$XDG_DATA_HOME` se setado) — usar crate `directories`.
- CI testa em `ubuntu-latest`, `macos-latest`, `windows-latest`.

## 6. O que NÃO repetir aqui

Itens já cobertos em outros contratos. **Não duplicar — referenciar**:

- Política de commits (atômicos, sem `--no-verify`, sem `--force` em main). → `REGRAS-INEGOCIAVEIS.md` INV-AGENT-002, INV-AGENT-007.
- Stack, comandos canônicos, ADRs ativas. → `AGENTS.md §2, §6, §10`.
- Lista de destrutivos específicos do projeto (`cargo publish`, `cargo yank`, deleção do banco do dono). → `AGENTS.md §13`.
- Invariantes de produto/agente (INV-AGENT-NNN). → `REGRAS-INEGOCIAVEIS.md`.
- Princípios fundadores. → `.claude/memory/constitution.md`.
- O que o projeto NÃO faz (LGPD, multi-tenant, on-call). → `nao-aplica.md`.

<!-- Se sentir vontade de copiar conteúdo dos arquivos acima pra cá, PARE.
     Adicione referência, não cópia. CLAUDE.md fala só do que é específico do harness Claude Code. -->
