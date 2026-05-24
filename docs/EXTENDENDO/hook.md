---
lang: pt-br
owner: framework
revisado-em: 2026-05-24
status: stable
---

# Criar um hook novo

> Desde a v1.0 (EP-001/ADR-013) hooks são **Node puro**, não bash. Rodam em Windows/Mac/Linux sem precisar de Git Bash, perl, jq ou awk.

Em `.claude/hooks/<nome>.js`. Esqueleto bloqueador (`PreToolUse`):

```js
#!/usr/bin/env node
// meu-hook.js — descreve o que protege (SEC-XXX / INV-XXX).
const { readStdinJson, recordMetric } = require('./_lib.js');

(async () => {
  const input = await readStdinJson();
  const filePath = input?.tool_input?.file_path || '';
  if (!filePath) process.exit(0);

  if (/padrao-proibido/.test(filePath)) {
    process.stderr.write('[meu-hook] BLOQUEADO: <motivo>.\n');
    process.stderr.write(`Arquivo: ${filePath}\n`);
    process.stderr.write('Regra: MEU-001.\n');
    process.stderr.write('Como destravar: <instrucao acionavel>.\n');
    recordMetric('block', 'meu-hook', `path: ${filePath}`);
    process.exit(2);
  }
  process.exit(0);
})();
```

Registre em `templates/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/meu-hook.js" }
        ]
      }
    ]
  }
}
```

Adicione caso de teste em `test/hooks-node-only.test.js`:

```js
test('meu-hook bloqueia path proibido', () => {
  const r = runHook('meu-hook.js', { tool_input: { file_path: 'path/proibido' } });
  assert.strictEqual(r.code, 2);
  assert.match(r.stderr, /BLOQUEADO/);
});
```

> Atualize `EXPECTED_TOTAL` no topo do test runner — o guard anti-falso-verde aborta se o número não bater.

## Checklist

- Trata stdin vazio (`exit 0` se não veio nada)
- Mensagem PT-BR com regra citada e instrução acionável
- Funciona em Windows nativo (sem Git Bash)
- Tem teste em `test/hooks-node-only.test.js`
- Chama `recordMetric('block'|'allow', '<hook>', '<detalhe>')` pra telemetria

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

**Bloquear erro:** `PreToolUse` com `exit 2`. **Avisar depois:** `Stop`/`PostToolUse` com JSON `{"decision":"block","reason":"..."}` em stdout.

## Funções de `_lib.js`

- `readStdinJson()` — lê stdin e devolve objeto JSON (ou `{}` se vazio/quebrado)
- `recordMetric(kind, hook, detail)` — grava métrica em `.claude/.runtime/metrics.jsonl`
- `secretTokenRegexes()` — lista canônica de padrões de secret (AWS, GitHub PAT, etc.)
- `safeProjDir()` / `safeRuntimeDir(projdir)` — paths seguros pra hooks de longa duração

Importe com `const { readStdinJson, recordMetric } = require('./_lib.js')`.

## Referência

- Bloqueador: `block-destructive.js`, `secrets-scanner.js`, `enforce-pipeline-completion.js`
- Soft warning: `regra-zero-reminder.js`, `lgpd-base-legal-reminder.js`
- Stop hook (JSON decision): `block-jargon-pt-br.js`, `block-confirmation-questions.js`
