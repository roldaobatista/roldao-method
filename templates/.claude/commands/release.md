---
description: Fecha o ciclo entre checkpoint aprovado e retro — bump de versão sincronizado, CHANGELOG, tag e nota de release em PT-BR pro cliente. Nao publica em servico pago sem confirmacao.
argument-hint: "[patch|minor|major ou versão explicita ex: 1.4.0]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Bash(npm version:*), Bash(npm run:*), Bash(git add:*), Bash(git commit:*), Bash(git tag:*), Bash(git push:*), Bash(git log:*), Bash(git diff:*), Bash(git status:*), Bash(gh release:*), Bash(gh issue:*)
---

# /release — fechar e empacotar um marco

> **Dono de produto que não programa?** Este comando fecha uma versão do sistema (gera comunicação pro seu cliente). Pra entender quando usar: [`docs/PARA-DONO-DE-PRODUTO.md`](../../docs/PARA-DONO-DE-PRODUTO.md).

Use **depois** de `/checkpoint` aprovado e **antes** de `/retro`. Fecha o ciclo: versao, CHANGELOG, tag e comunicacao pro cliente. Sem isto, o passo entre "aprovado" e "retrospectiva" fica implicito e manual.

`$ARGUMENTS` = tipo de incremento (`patch`/`minor`/`major`) ou versao explicita. Default: `patch`.

## Etapa 0 — Pre-condicoes (NAO pular) — T-518 (J18)

Verifique antes de qualquer mudanca:

- Existe checkpoint aprovado recente em `docs/checkpoints/` (veredito `aprovado` ou `ressalvas`). Sem checkpoint, pare e mande rodar `/checkpoint`.
- Working tree limpa (sem mudanca solta nao commitada de outra frente).
- **Gates verdes — OBRIGATORIO colar saida REAL.** Nao basta dizer "rodei e passou". A release exige evidencia mecanica: rode `npm test` (ou comando equivalente do projeto: `pytest`, `go test ./...`, `cargo test`, etc.) e cole a ULTIMA LINHA da saida no relatorio de release. Exemplos validos:
  ```
  Tests: 442 passed, 442 total
  ```
  ```
  ok      github.com/x/y      0.123s
  ```
  Se a ultima linha contem `FAIL`, `failed`, `error`, ou exit code != 0, **pare** — release nao sai com teste vermelho. Esta evidencia entra na nota de release como "Verificacoes que rodaram: <saida>".

## Etapa 1 — Decidir a versao (SemVer)

- `patch` — so correcoes, sem mudanca de comportamento visivel.
- `minor` — funcionalidade nova compativel.
- `major` — quebra de compatibilidade (avise isso explicitamente ao cliente).

Calcule a versao nova a partir da atual. Liste o que entrou (use `git log <ultima-tag>..HEAD --oneline`).

## Etapa 2 — Bump sincronizado (todos os pontos de versao)

Atualize a versao em **todos** os lugares — fonte de drift conhecida:
- `package.json` (ou manifesto equivalente do projeto)
- README (badge de versao)
- `CHANGELOG.md` (nova secao no topo)
- adapters/manifests que carregam versao (no framework: `.claude-plugin/plugin.json`, `.continue/config.yaml`)

No proprio ROLDAO-METHOD, `tools/validar-templates.js` tem o portao doc-vs-codigo que **bloqueia** se algum desses divergir — rode-o e corrija ate passar.

## Etapa 3 — CHANGELOG (via tech-writer)

Invoque `tech-writer` para escrever a secao nova do `CHANGELOG.md` (formato Keep a Changelog, PT-BR), agrupando em **Adicionado / Corrigido / Alterado / Removido**. Linguagem do cliente, sem jargao — efeito visivel, nao stack trace.

## Etapa 4 — Tag e release

- Commit do bump: `chore(vX.Y.Z): release` (stage seletivo dos arquivos de versao + CHANGELOG).
- `git tag vX.Y.Z` + `git push origin main --tags` (fast-forward; nao force).
- Se houver `gh` autenticado: `gh release create vX.Y.Z` usando a secao do CHANGELOG como corpo.
- **Confirmar antes** apenas se o passo envolver servico pago, `npm publish` (depende de credencial do dono), ou mudanca publica irreversivel.

## Etapa 5 — Nota pro cliente (PT-BR claro)

Invoque `tech-writer` para 1 paragrafo curto que o cliente entende: o que melhorou na pratica, se ele vai ver diferenca, se precisa fazer algo. Sem "deploy", "merge", "tag" — traduzir.

## Saida final

```
RELEASE vX.Y.Z PUBLICADA

Versao: <anterior> -> <nova>
CHANGELOG: secao adicionada
Tag: vX.Y.Z (no servidor)
Nota pro cliente: <1 linha>

Proximo passo: /retro <marco> para fechar o aprendizado do ciclo.
```

## Importante

- **Nunca** publicar em servico pago / `npm publish` sem confirmacao explicita do dono.
- **Versao sincronizada e inegociavel** — bump parcial e o bug que este comando existe pra matar.
- Encadeia naturalmente em `/retro` — sugira-o no fim.
