---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: README do projeto-exemplo tempo-cli (CLI Rust solo, modo enxuto)
---

<!--
arquivo: README.md (do projeto-exemplo tempo-cli)
nota: este é o README do PROJETO-EXEMPLO. O meta-readme que explica
      que isso aqui é exemplo está em README-EXEMPLO.md.
-->

# tempo-cli

Ferramenta de linha de comando para registrar tempo gasto em tarefas direto do terminal, com banco local em SQLite e sincronização opcional com Toggl (futura).

**Estado:** alpha · **Versão:** 0.1.0

## Rodar localmente
```bash
cargo build --release
./target/release/tempo --help
./target/release/tempo start "ajustar relatório do cliente X"
./target/release/tempo stop
./target/release/tempo report --hoje
```

## Rodar testes
```bash
cargo test
```

## Instalar (depois de publicado)
```bash
cargo install tempo-cli
# ou baixar binário pré-compilado em https://github.com/roldao/tempo-cli/releases
```

## Documentação completa
Ver `docs/INDICE.md` (quando criado) e os artefatos em `docs/descoberta/` e `docs/adr/`.

## Licença
MIT · Autor: Roldão
