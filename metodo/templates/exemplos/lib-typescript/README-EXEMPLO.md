---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 90
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: README-EXEMPLO.md
papel: capa do exemplo. Explica o que tem aqui e como ler.
NÃO é o README do projeto exemplo (esse é README.md, ao lado).
-->

# Exemplo fim-a-fim — biblioteca TypeScript (npm OSS)

Este diretório contém uma **materialização completa** de como ficaria um projeto **depois** de aplicar o método em `templates/`. Não é um projeto real — é um exemplo pedagógico, coerente, preenchido com dados inventados verossímeis.

## O caso usado

- **Nome:** `@conciliab/csv-parser`
- **O que é:** biblioteca TypeScript que parseia e normaliza arquivos CSV de extratos bancários brasileiros (formatos OFX 1.x, CNAB240, CSV genéricos exportados por bancos).
- **Distribuição:** npm público, dual ESM+CJS via tsup, suporta Node 20+, Deno e Bun.
- **Licença:** MIT.
- **Time:** solo (Roldão) inicialmente, OSS aberto a contribuições externas.
- **Comunidade:** pequena (estimativa 50-500 instalações no primeiro ano).

## Por que esse caso

A biblioteca isola o cenário mais comum onde o método é "exagero aparente" — mas ainda assim entrega valor:

- **Sem LGPD:** lib pura. Quem chama a função processa o dado pessoal — a lib só transforma bytes em estrutura.
- **Sem multi-tenant:** não há banco, não há tenant.
- **Sem on-call / runbooks de operação:** não é um serviço hospedado.
- **Mas tem SemVer estrito, dual ESM/CJS, responsible disclosure e governança de release** — tudo isso EXIGE contrato escrito, ou a confiança da comunidade evapora no primeiro `patch` que quebra API.

O exemplo mostra como o método se **ajusta** a um projeto pequeno: muita coisa cai no `nao-aplica.md` com justificativa, mas o que sobra (SemVer, segurança, ADRs de distribuição) fica documentado com o mesmo rigor.

## Como ler

Ordem sugerida:

1. **[`README.md`](./README.md)** — capa do projeto exemplo.
2. **[`.claude/memory/constitution.md`](./.claude/memory/constitution.md)** — princípios fundadores (autoridade máxima).
3. **[`REGRAS-INEGOCIAVEIS.md`](./REGRAS-INEGOCIAVEIS.md)** — invariantes operacionais.
4. **[`AGENTS.md`](./AGENTS.md)** — canônico de produto/processo para agentes IA.
5. **[`CLAUDE.md`](./CLAUDE.md)** — adendo do harness Claude Code.
6. **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** — fluxo OSS (fork → PR → merge → release).
7. **[`SECURITY.md`](./SECURITY.md)** — canal de divulgação responsável.
8. **[`nao-aplica.md`](./nao-aplica.md)** — o que o projeto deliberadamente NÃO faz e por quê.
9. **[`docs/descoberta/problema.md`](./docs/descoberta/problema.md)** — a dor que motiva a lib existir.
10. **[`docs/adr/`](./docs/adr/)** — decisões arquiteturais (5 ADRs: IA, stack, distribuição, SemVer, runtimes).
11. **[`docs/dominios/core/modulos/parser/`](./docs/dominios/core/modulos/parser/)** — spec + plan + tasks de uma US realista.
12. **[`CHECKLIST-PRONTO-PRA-CODAR.md`](./CHECKLIST-PRONTO-PRA-CODAR.md)** — gate de projeto, todos os itens marcados.

## O que NÃO está aqui (e por quê)

- Código real (`src/`, `tests/`) — o exemplo cobre **documentação e contratos**, não a implementação TS.
- `docs/PRD.md`, `docs/glossario.md`, `docs/testes/estrategia.md`, `kickoff-fase.md` completos — citados em referências mas fora do escopo deste exemplo materializado. Ver `templates/` para os esqueletos.
- `.claude/agents/` (auditores) — ver `templates/agents/` no método.
- Pastas operacionais (`docs/operacao/runbooks/`, `docs/lgpd/`) — caem no `nao-aplica.md` deste exemplo (projeto é lib, não serviço).

## Como adaptar pro seu projeto

1. Copie a estrutura.
2. Substitua **todos** os identificadores (`@conciliab/csv-parser`, `roldao`, datas) pelos do seu projeto.
3. Revise especialmente `nao-aplica.md`: o que cai como "não aplica" em uma lib **passa a aplicar** se você for um serviço hospedado, multi-tenant ou tratar PII.
4. Refaça os ADRs com as **suas** decisões reais — copiar ADR alheio é decoração.

> Para o catálogo dos templates em si, ver `templates/README.md` na raiz do método.
