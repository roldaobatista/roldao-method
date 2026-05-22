---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Criar um hook novo

Em `.claude/hooks/<nome>.sh`. Esqueleto bloqueador (`PreToolUse`):

```bash
#!/usr/bin/env bash
# meu-hook.sh — descreve o que protege (SEC-XXX / INV-XXX).
set -u
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $j = decode_json(<STDIN>);
  print $j->{tool_input}->{file_path} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && [ -z "$INPUT" ] && exit 0

if printf '%s' "$FILE_PATH" | grep -qE 'padrao-proibido'; then
  cat >&2 <<EOF
[meu-hook] Bloqueei: <motivo>.
Arquivo: $FILE_PATH
Regra: MEU-001.
Como destravar: <instrução acionável>.
EOF
  exit 2
fi
exit 0
```

Registre em `templates/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/meu-hook.sh" }
        ]
      }
    ]
  }
}
```

Adicione caso de teste em `_test-runner.sh`:

```bash
test_meu_hook() {
  local out
  out=$(printf '{"tool_input":{"file_path":"path/proibido"}}' | bash "$HOOKS_DIR/meu-hook.sh" 2>&1)
  [ $? -eq 2 ] && ok "meu-hook bloqueia path proibido" || fail "deveria bloquear" "$out"
}
test_meu_hook
```

> Atualize `EXPECTED_TOTAL` no topo — o guard anti-falso-verde aborta se o número não bater.

## Checklist

- Trata stdin vazio
- Mensagem PT-BR com regra citada e instrução acionável
- Funciona em Windows Git Bash (sem `jq`)
- Tem teste em `_test-runner.sh`

## Lifecycle

| Evento | Quando | Hooks atuais (exemplos) |
|---|---|---|
| `SessionStart` | Nova sessão | `mcp-validator`, `session-restore`, `context-budget` |
| `UserPromptSubmit` | Antes de cada prompt | `regra-zero-reminder` |
| `PreToolUse` | Antes de cada ferramenta | `block-destructive`, `secrets-scanner`, `anti-mascaramento`, `require-investigador-before-fix` |
| `PostToolUse` | Após cada ferramenta | `auto-format-on-write` |
| `SubagentStop` | Subagente termina | `subagent-handoff-audit` |
| `Stop` | Turno do agente termina | `block-jargon-pt-br`, `block-confirmation-questions`, `enforce-pipeline-completion` |
| `PreCompact` | Antes de compactação | `session-snapshot` |
| `SessionEnd` | Sessão fecha | `session-snapshot` |

**Bloquear erro:** `PreToolUse` com `exit 2`. **Avisar depois:** `Stop`/`PostToolUse` com JSON `{"decision":"block","reason":"..."}`.

## Funções de `_lib.sh`

- `sanitize_projdir` — `PROJDIR` seguro
- `sanitize_session_hash` — hash da sessão
- `safe_runtime_dir <projdir>` — cria `.claude/.runtime`
- `safe_tmpfile [prefix]` — tmpfile isolado
- `secret_token_patterns` — regex de tokens (canônico)
- `hook_block_header <nome> <motivo>` — cabeçalho de bloqueio padrão

Carregue com `. "$(dirname "$0")/_lib.sh"`.

## Referência

- Bloqueador: `block-destructive.sh`, `secrets-scanner.sh`, `enforce-pipeline-completion.sh`
- Auxiliar: `regra-zero-reminder.sh`, `block-jargon-pt-br.sh`
