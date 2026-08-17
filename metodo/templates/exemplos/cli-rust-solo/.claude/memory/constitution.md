---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 90
proposito: princípios fundadores não-negociáveis do tempo-cli. Lido primeiro em toda sessão de agente IA.
---

<!--
arquivo: .claude/memory/constitution.md do projeto-exemplo tempo-cli.
-->

# Constituição do tempo-cli

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > CLAUDE.md
> Em qualquer conflito, o documento mais alto vence.

## Missão

Devolver controle ao usuário sobre o próprio tempo: um CLI pequeno, rápido e local que registra "comecei a fazer X às 14h, parei às 15h32" sem exigir cadastro, internet ou cliente web. O usuário é dono do dado dele — o dado mora no computador dele, em arquivo aberto (SQLite), que ele pode ler/copiar/apagar a qualquer momento.

## Valores não-negociáveis

1. **O dado é do usuário.** Banco fica em `~/.tempo-cli/db.sqlite`, arquivo aberto, sem criptografia obscura, sem dependência de servidor nosso. O usuário pode abrir com `sqlite3` a qualquer momento e fazer o que quiser.
2. **Não enviamos nada sem permissão explícita.** A integração com Toggl (v0.3) será opt-in via comando explícito. Por padrão, o CLI é 100% offline.
3. **Falha barulhenta, nunca silenciosa.** Erro de I/O, migration falhou, banco corrompido — o CLI sai com código `!= 0` e mensagem clara. Proibido swallow de `Result` (INV-AGENT-006).
4. **Versão publicada é contrato.** `cargo publish` é irreversível — uma vez no crates.io, aquela versão fica lá. Toda publicação exige changelog atualizado e aprovação humana.

## Postura ética

- Transparência ao usuário: `tempo --help` e `tempo <subcomando> --help` documentam tudo que o CLI faz. Nenhuma chamada externa silenciosa.
- Dados pessoais nunca em logs externos (operacionalizado em INV-AGENT-008 quando reativada — ver `nao-aplica.md`). Por enquanto não há logs externos.
- Sem scraping, sem coleta de telemetria, sem analytics. Se um dia houver telemetria, será opt-in com confirmação no primeiro uso e documentação clara.

## Restrições legais permanentes

- **LGPD:** projeto não trata PII de terceiros (ver `nao-aplica.md`). Se mudar (integração com serviço terceiro envolvendo outros usuários), abrir `docs/lgpd/ROPA.md` antes do release.
- **Licença MIT:** todo contribuidor concorda com MIT ao abrir PR. Sem CLA por enquanto.
- **Crates.io ToS:** publicação respeita as regras do crates.io (não-spam, não-malware, sem republicar versão).

## Mecanismo de aplicação

Princípio sem mecanismo é decoração. Cada princípio precisa de pelo menos **um** auditor, **um** hook ou **uma** INV.

| Princípio | Auditor que aplica | Hook | INV relacionada | Se ausente |
|---|---|---|---|---|
| Dado é do usuário (arquivo aberto, sem lock-in) | revisão humana | revisão de PR de schema | DAT-001 | mantido |
| Nada enviado sem permissão (offline-first) | revisão humana | `secrets-scanner` (futuro, quando entrar Toggl) | INV-AGENT-009 | mantido |
| Falha barulhenta | revisão humana | `anti-mascaramento.sh` (busca `.unwrap()` em main, `let _ =` em `Result`, `#[allow(unused_must_use)]`) | TST-001, INV-AGENT-006 | mantido |
| Versão publicada é contrato | dono (humano) | `block-destructive.sh` (lista inclui `cargo publish`, `cargo yank`) | INV-AGENT-001, INV-AGENT-002 | mantido |
| Evidência antes de afirmação | revisão humana | TODO: `post-claim-evidence.sh` | INV-AGENT-005 | mantido |
| Investigar antes de mexer em lógica | revisão humana | TODO: `pre-edit-evidence.sh` | INV-AGENT-003 | mantido |
| Linguagem acessível ao dono | revisão humana | `frontmatter-validator` (futuro) | INV-AGENT-010 | mantido |
| Contrato de INV é estável | dono (humano) | `inv-change-guard.sh` (futuro) | INV-AGENT-011 | mantido |

## O que NÃO está nesta constituição

- Stack técnica (vai em ADR-0001).
- Distribuição (vai em ADR-0002).
- Cronograma e roadmap (vai em Issues do GitHub).
- Decisões reversíveis (vão em ADRs comuns).
- Regras operacionais (vão em `REGRAS-INEGOCIAVEIS.md`).

## Processo de alteração

1. Proposta via ADR específica (`docs/adr/ADR-NNNN-altera-constituicao.md`).
2. Em projeto solo, o "consenso de subagentes" reduz a: revisão honesta do dono contra os argumentos da ADR (auto-revisão), preferencialmente com 1 dia de cooldown entre escrita e aceite.
3. Aprovação humana do dono.
4. Constituição editada + commit cita ADR + `CHANGELOG.md` registra.

## Referências

- [`../../AGENTS.md`](../../AGENTS.md) — canônico de produto.
- [`../../REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — invariantes operacionalizáveis.
- [`../../docs/adr/ADR-0000-uso-de-ia.md`](../../docs/adr/ADR-0000-uso-de-ia.md) — Uso de IA neste projeto.
