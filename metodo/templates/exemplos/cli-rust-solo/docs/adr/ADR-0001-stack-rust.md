---
id: ADR-0001
titulo: Adotar Rust + clap + rusqlite como stack do tempo-cli
status: aceita
data-proposta: 2026-05-20
data-aceite: 2026-05-25
depende-de: []
bloqueia-fase: F-1
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0001: Adotar Rust + clap + rusqlite como stack do tempo-cli

## Contexto

O `tempo-cli` precisa ser um binário único, sem dependência de runtime instalada na máquina do usuário, com partida instantânea (<50ms — abaixo do limiar de percepção humana de lentidão num CLI) e empacotamento simples para Linux, macOS e Windows.

O dono não programa, mas a IA programa. A escolha de linguagem afeta: qualidade dos exemplos de código em prompts (linguagens mainstream têm mais código de treino), facilidade de empacotamento, performance percebida pelo usuário, e maturidade do ecossistema de CLI.

Volume esperado: <1000 comandos por dia por usuário, banco com <10MB de histórico no primeiro ano.

## Opções consideradas

### Opção 1: Rust + clap + rusqlite (bundled)

- **Prós:** binário único estático (~3MB), sem runtime; cross-compile trivial (`cargo build --target x86_64-pc-windows-gnu` etc.); `clap` é o padrão de CLI parser em Rust; `rusqlite` com feature `bundled` empacota SQLite no binário (zero dependência do sistema); type system pega muitos bugs em compile-time, importante quando o dono não consegue revisar código.
- **Contras:** tempo de compilação alto em desenvolvimento (~30s no primeiro build); curva de aprendizado de ownership/borrow checker — mitigada pelo agente IA que conhece Rust bem.
- **Custo:** baixo. Rust 1.78+ já instalado na máquina do dono.

### Opção 2: Go + Cobra + mattn/go-sqlite3

- **Prós:** compilação muito rápida; runtime stdlib enorme; ecosistema CLI maduro (`gh`, `kubectl` são Go); cross-compile fácil.
- **Contras:** GC pause (irrelevante num CLI mas ruído estético); `go-sqlite3` exige CGo, o que complica cross-compile (precisa toolchain C de cada alvo); type system mais frouxo que Rust (errors são `error` runtime, não enforcement compile-time).
- **Custo:** médio. Dono não tem Go instalado; agente IA conhece Go também.

### Opção 3: Node + oclif + better-sqlite3

- **Prós:** dono já usa Node em outros projetos; oclif tem boa estrutura.
- **Contras:** dependência de Node runtime instalada no usuário OU empacotar com `pkg`/`nexe` (resultando binário >50MB); startup time alto (>200ms); `better-sqlite3` exige rebuild nativo por plataforma.
- **Custo:** médio. Tamanho de binário e startup matam a proposta de "CLI rápido".

## Decisão

Escolhemos a **Opção 1: Rust + clap + rusqlite (bundled)**.

Critérios decisivos: (1) binário único pequeno sem runtime — entrega exata da promessa "instalei e funciona"; (2) startup <50ms em qualquer máquina razoável; (3) `rusqlite bundled` resolve o problema multi-plataforma do SQLite sem CGo; (4) type system reduz risco de bug em produto onde o dono não pode auditar código.

Custos aceitos: tempo de compilação no dev (mitigado por `cargo check` em incrementais; release só na hora de publicar) e curva inicial (a IA absorve).

## Consequências

### Positivas
- Binário ~3MB, partida <50ms — sensação de "ferramenta nativa".
- Cross-compile via `cargo build --target ...` para todos os alvos suportados.
- Forte safety net no compilador para um projeto sem revisor humano de código.

### Negativas
- Build de release com LTO leva ~2 minutos. Aceitável para publicação.
- Dependência de Rust 1.78+ MSRV. Declarado em `Cargo.toml`.

### Reversibilidade
Média-baixa. Reescrever em Go seria 2-3 semanas (SQL queries portam fácil; lógica de domínio é pequena, ~500 linhas). Mas o produto é pequeno demais para justificar — se a stack falhar, é mais barato refazer do zero do que migrar.

## Non-goals

Esta ADR NÃO decide:
- Estratégia de distribuição (assunto da ADR-0002).
- Crate de HTTP cliente para futura integração Toggl (será decidido em ADR-0003 ou quando v0.3 começar).
- Crate de TUI (caso o produto cresça para modo interativo — ADR futura).

## Como validar (gates)

- [x] `cargo build --release` produz binário <5MB em Linux x86_64.
- [x] `./tempo --version` executa em <100ms (medido com `hyperfine`).
- [x] `rusqlite` com feature `bundled` no `Cargo.toml`.
- [x] Cross-compile testado para `x86_64-pc-windows-gnu`, `x86_64-apple-darwin`, `x86_64-unknown-linux-gnu` em CI.
- [x] MSRV declarado em `Cargo.toml` (`rust-version = "1.78"`).

## Referências

- https://docs.rs/clap/latest/clap/
- https://github.com/rusqlite/rusqlite
- https://nnethercote.github.io/perf-book/ (otimização Rust)
- ADR-0002 (distribuição, dependente desta).
