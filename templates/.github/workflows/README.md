# Workflows GitHub Actions — ROLDAO-METHOD

Templates de workflow para repositórios que adotam o framework. Copie pro `.github/workflows/` do seu projeto.

## `claude-review.yml`

Aciona o Claude quando alguém comenta `@claude` num PR/issue. Usa o **Claude Code Action oficial** (`anthropics/claude-code-action@v1`) com prompt em PT-BR que invoca os agentes do framework.

**Setup:**

1. Instale o GitHub App Claude: https://github.com/apps/claude ou rode `/install-github-app` no Claude Code local.
2. Adicione o secret `ANTHROPIC_API_KEY` em **Settings → Secrets → Actions**.
3. Copie `claude-review.yml` pra `.github/workflows/`.

**Como usar:**

Em qualquer PR/issue, comente:

```
@claude revise este PR pela ótica do auditor-seguranca e do fiscal-br
```

Claude responde como bot no próprio PR.

## `claude-headless-lgpd.yml`

Auditoria LGPD **automática** em todo PR que toca arquivo de dado pessoal. Usa `claude -p` em modo headless com `--output-format json` e posta veredito formatado no PR.

**Setup:**

1. Secret `ANTHROPIC_API_KEY` (mesmo do anterior).
2. Copie o arquivo. Ajuste o `paths:` do `on.pull_request` pra refletir os arquivos do seu projeto que tocam dado pessoal.

**Veredito possível:**

- `APROVADO` — segue o PR.
- `RESSALVAS` — comentário com violações, mas não bloqueia.
- `BLOQUEADO` — workflow falha (exit 1) e o PR não pode mergear até resolver.

## Outros workflows úteis (não distribuídos por padrão)

- **`claude-release-notes.yml`** — gera release notes em PT-BR quando tag é criada. Use o agente `tech-writer`.
- **`claude-daily-status.yml`** — cron diário pra rodar `/status` e postar resumo em issue/discussion.
- **`claude-fiscal-check.yml`** — auditoria fiscal headless (FISCAL-001..007) em PRs que tocam emissão de nota.

Veja a [doc oficial do Claude Code Action](https://github.com/anthropics/claude-code-action) pra mais cenários.

## Custos

Cada workflow chama API Claude. Use `--max-turns N` baixo (5-10) e modelo apropriado (`haiku` pra status, `sonnet` pra revisão padrão, `opus` só pra auditoria crítica).
