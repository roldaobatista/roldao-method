---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Estendendo o ROLDAO-METHOD

> **TL;DR**
> - **Agente:** copie `templates/.claude/agents/dev-senior.md` → ajuste `name`/`description`/`tools`.
> - **Hook:** esqueleto na seção 2 + registrar em `templates/.claude/settings.json` + caso de teste em `_test-runner.sh`.
> - **Skill:** `templates/.claude/skills/<nome>/SKILL.md` + script Python stdlib.
> - **Addon:** `addons/<nome>/addon.yaml` + estrutura `.claude/` espelhada.
> - **Antes de commitar:** `npm test` (roda validadores + testes).

Pré-requisito: ler [`ARQUITETURA.md`](ARQUITETURA.md) e [`COMO-FUNCIONA.md`](COMO-FUNCIONA.md).

| Quando criar | O quê |
|---|---|
| Papel novo no time virtual | Agente |
| Regra mecânica de bloqueio/aviso | Hook |
| Procedimento reutilizável com gatilho | Skill |
| Pacote completo de domínio (Electron, Pix, eSocial) | Addon |

---

## 1. Agente novo

Em `.claude/agents/<nome>.md`:

```markdown
---
name: nome-do-agente
description: 1 frase em PT-BR sobre quando invocar.
tools: Read, Glob, Grep, Edit, Write
model: inherit
color: blue
identity:
  nome: "Camila"
  icone: "📝"
---

# Nome do agente

Você é a Camila 📝 — _(papel curto)_.

## Princípios
1. PT-BR sem jargão.
2. Verifica antes de afirmar.

## Modos
(se houver — gatilho de cada)

## Saída esperada
(formato exato — bloco markdown, JSON, etc.)
```

**Checklist:**
- Frontmatter completo (`name`, `description`, `tools`, `model`, `color`)
- `tools:` restrito ao mínimo (SEC-004)
- Não duplica agente existente — leia os 12 antes
- Inclui exemplo de saída

Valide com `node tools/validar-templates.js`.

---

## 2. Hook novo

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

**Checklist:**
- Trata stdin vazio
- Mensagem PT-BR com regra citada e instrução acionável
- Funciona em Windows Git Bash (sem `jq`)

---

## 3. Skill nova

Em `.claude/skills/<nome>/SKILL.md`:

```markdown
---
name: minha-skill
description: 1 frase PT-BR — quando o agente invoca.
allowed-tools: Read, Bash(python3:*), Bash(python:*)
owner: framework
revisado-em: AAAA-MM-DD
status: stable
---

# minha-skill

## Quando usar
- Cenário 1.

## Uso

```bash
python3 scripts/minha-skill.py argumento
```

## Saída esperada
(Formato exato.)
```

Script em `scripts/<nome>.py` — Python 3 stdlib pura, sem `pip install`.

**Checklist:**
- Frontmatter completo (`name`, `description`, `allowed-tools`, `owner`, `revisado-em`, `status`)
- Algoritmo embutido (sem dependência runtime)
- Offline por padrão (rede só com flag explícita)

---

## 4. Addon novo

Em `addons/<nome>/`:

```
addons/meu-addon/
├── addon.yaml          <- manifesto obrigatório
├── README.md
├── .claude/{agents,commands,hooks,skills}/
├── .specify/templates/
└── docs/
```

`addon.yaml` mínimo:

```yaml
name: meu-addon
version: 0.1.0
description: 1 linha PT-BR
authors: [<nome>]
license: MIT
status: beta
revisado-em: AAAA-MM-DD
requires:
  roldao-method: ">=0.15.0"
provoca:
  agents: []
  commands: []
  hooks: []
  skills: []
  templates: []
regras:
  - id: MEU-001
    titulo: <título>
    descricao: <regra>
requisitos:
  - <pré-requisito do projeto>
non-goals:
  - <o que NÃO faz>
```

`provoca:` cita pelo nome cada artefato. O validador confere se cada item existe.

**Checklist:**
- `addon.yaml` válido contra `addon.schema.json`
- Prefixo de regras único (não colidir com `LGPD-*`, `FISCAL-*`, `PIX-*`, `SEC-*`, `TST-*`, `INV-*`)
- `non-goals` declarados

---

## 5. Quando NÃO criar

- Agente: 12 já é o teto. Refine o existente em vez de criar 13.
- Hook: cenário que acontece 1x por mês vira regex frágil — não compensa.
- Skill: padrão só repetiu 1-2 vezes — espere 3 (regra de 3).
- Addon: domínio cabe em 1 skill — addon é overhead.

---

## 6. Quality gates

```bash
npm test
```

Equivale a: validar templates + roda hooks + install + skills + addons + adapters. Detalhes em [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## Apêndice — Referência rápida

### Lifecycle dos hooks

| Evento | Quando | Hooks atuais (exemplos) |
|---|---|---|
| `SessionStart` | Nova sessão | `mcp-validator`, `session-restore`, `context-budget` |
| `PreToolUse` | Antes de cada ferramenta | `block-destructive`, `secrets-scanner`, `anti-mascaramento`, `require-investigador-before-fix` |
| `PostToolUse` | Após cada ferramenta | `auto-format-on-write`, `block-jargon-pt-br`, `block-confirmation-questions` |
| `SubagentStop` | Subagente termina | `subagent-handoff-audit` |
| `Stop` | Turno do agente termina | `regra-zero-reminder` |
| `SessionEnd` | Sessão fecha | `session-snapshot` |

**Bloquear erro:** `PreToolUse` com `exit 2`. **Avisar depois:** `PostToolUse` com `decision: block`.

### Funções de `_lib.sh`

- `sanitize_projdir` — `PROJDIR` seguro
- `sanitize_session_hash` — hash da sessão
- `safe_runtime_dir <projdir>` — cria `.claude/.runtime`
- `safe_tmpfile [prefix]` — tmpfile isolado
- `secret_token_patterns` — regex de tokens (canônico)
- `hook_block_header <nome> <motivo>` — cabeçalho de bloqueio padrão

Carregue com `. "$(dirname "$0")/_lib.sh"`.

### Exemplos de referência

- Agente: `templates/.claude/agents/dev-senior.md`, `analista.md`
- Hook bloqueador: `block-destructive.sh`, `secrets-scanner.sh`
- Hook auxiliar: `regra-zero-reminder.sh`
- Skill com Python: `templates/.claude/skills/validar-cpf-cnpj/`
- Skill de guia: `templates/.claude/skills/gerar-adr-pt-br/`
- Addon completo: `addons/fintech-br/`

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
