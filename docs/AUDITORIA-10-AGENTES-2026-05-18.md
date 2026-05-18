---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Auditoria 10-agentes — round 5 (v0.10.0)

Quinta rodada de auditoria cruzada em 2026-05-18. Dez agentes paralelos com escopos distintos. Round anterior (v0.9.0) fechou 24 achados; este fechou 18 (10 P0 + 8 P1) e adicionou cobertura nova.

## Escopo dos 10 agentes

| # | Foco |
|---|---|
| 1 | Segurança dos hooks bash (injection, traversal, race) |
| 2 | Qualidade de código JS (`bin/install.js`, `tools/validar-templates.js`, `evals/run.js`) |
| 3 | Cobertura e qualidade de testes |
| 4 | DX e jornada do novato |
| 5 | Consistência de documentação |
| 6 | Cross-platform Windows/macOS/Linux |
| 7 | Performance dos hooks |
| 8 | Corretude técnica BR (fiscal, LGPD, Pix, eSocial) |
| 9 | Paridade entre adapters multi-IDE |
| 10 | Posicionamento de produto e gaps competitivos |

## Achados P0 fechados

1. **Adapters Cline/Aider/Roo em subpastas inertes.** `.clinerules`, `.aider.conf.yml`, `.roorules` agora ficam na raiz (não em `.cline/`, `.aider/`, `.roo/`). Antes, ferramentas-alvo nunca liam os arquivos.
2. **`detectTools()` cosmético.** `walkAndCopy(templates/)` copiava todos os 7 adapters em todo projeto. Agora padrão instala só Claude; flags `--adapters=cursor,windsurf` e `--all-adapters` permitem escolha.
3. **LGPD: Art. 7 II vs V trocados em `checklist-lgpd/SKILL.md`.** Execução de contrato é Art. 7 V; Art. 7 II é obrigação legal. Risco regulatório direto.
4. **Contagens inconsistentes em README/ROADMAP/CHANGELOG.** README anunciava "16 regras" + "21 bloqueadores" + "18+5+1" no mesmo arquivo. ROADMAP dizia v0.8.0 quando atual era v0.9.0. "Novidades v0.5.0" no topo de README v0.9.0. Padronizado.
5. **`sed -i` GNU-only quebrava macOS BSD** no `_test-runner.sh:257`. Trocado por `perl -i -pe`.
6. **`/tmp/roldao-test-*` com nomes fixos** — rodadas paralelas e CI matrix colidiam. Agora `mktemp -d` isolado + `trap` cleanup.
7. **Hooks sem teste real**: `context-budget` (zero casos), `no-amend-after-push` (sem caso de bloqueio), `mcp-validator` (sem caso de bloqueio). Adicionados 8 casos com repo bare local.
8. **NF-e: RSA-SHA-1 ensinado como atual.** MOC 7.00+ (NT 2023.001) usa RSA-SHA-256. Corrigido com nota sobre OpenSSL 3.x.
9. **BR Code: chars combinantes literais na regex** podiam sumir em conversão de encoding (cp1252, JSON). Trocado por escape unicode `̀-ͯ`.
10. **Pix TxId: regex aceitava 1-35 chars** quando `cob`/`cobv` exigem 26-35 (Manual Pix Bacen).

## Achados P1 fechados

- **JSON manual via heredoc** em `block-jargon-pt-br.sh` e `block-confirmation-questions.sh` quebrava com payload do agente contendo `"` ou newline. Agora gerado via `perl encode_json`.
- **`no-amend-after-push.sh` não usava `_lib.sh`** — atuava em `$PWD` sem sanitização. Agora sourceia lib e faz `cd "$PROJDIR"`. Glob `*--amend*` substituído por regex `\b--amend\b`.
- **`python3` hardcoded em 5 skills Python** — Windows usa `python.exe`. Adicionada nota explícita em cada SKILL.md.
- **`.gitattributes`** sem cobertura pra `*.py`, `*.pl`, `*.js`. CRLF em script Python com shebang quebrava em Linux/macOS. Adicionados.
- **`process.platform !== undefined`** em `install.js:64` era tautologia. Removida.
- **`evals/run.js applyValidation`** era código morto (chamada só em bloco comentado). Removida.

## Achados P2 anotados (rounds futuros)

- Performance: `_test-runner.sh` leva 3m53s no Windows Git Bash devido a spawn de bash+perl 2-3s por caso. Paralelização via `xargs -P` ou rewrite em Node levaria a <5s. (auditor #7)
- `copyFile` dry-run duplica lógica do path real — risco de drift. (auditor #2)
- `listAddonsAvailable`/`listAddonsInstalled` fazem I/O dobrado quando ambos são chamados em sequência (`list` command). (auditor #2)
- `isDangerousCwd` mistura paths Windows e Unix sem comentário; nenhum cobre `/home` e `C:\Users` sem subpasta. (auditor #2)
- Falta exemplo "hello world" demonstrável fora de docs (GIF/asciinema de 90s mostrando hook bloqueando). (auditor #10)
- "ROLDAO-METHOD" tem fricção de busca — registrar `#roldaomethod` consistente. (auditor #10)
- Risco estratégico médio-prazo: dependência de Git Bash no Windows. Porte dos 21 hooks pra Node puro elimina o gap quando IDEs empurrarem terminal nativo. (auditor #10)

## Resultados quantitativos

- **Testes**: 124 → **132** (8 novos: context-budget×4, mcp-validator×2, no-amend-after-push×2).
- **Hooks**: 28 (21 bloqueadores + 5 auxiliares + 2 infra).
- **Skills**: 8 core + 14 addons = 22 (antes documentado como 17).
- **Templates spec**: 12 (antes documentado como 11).
- **Checklists**: 8 (antes documentado como 7).
- **Adapters funcionais**: 7 (todos com path correto).

## Próximos passos

- Round 6 sugerido foca em: porte Node puro dos hooks (mata gap de Windows PowerShell e paraleliza test-runner), DX (GIF demonstrativo, hello-world projeto), e implementar modo live dos evals.
