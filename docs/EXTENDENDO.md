---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Estendendo o ROLDAO-METHOD

> **TL;DR (1 min)**
> - **Agente novo:** copie `templates/.claude/agents/dev-senior.md` → renomeie + ajuste `name`/`description`/`tools` (seção 1).
> - **Hook novo:** copie esqueleto da seção 2 + adicione em `templates/.claude/settings.json` no evento certo (PreToolUse/PostToolUse/etc.) + rode `bash templates/.claude/hooks/_test-runner.sh`.
> - **Skill nova:** crie `templates/.claude/skills/<nome>/SKILL.md` com gatilho concreto + script Python (seção 3).
> - **Addon novo:** pasta `addons/<nome>/` com `addon.yaml` + estrutura `.claude/` espelhada (seção 4).
> - **Valide:** sempre `node tools/validar-templates.js` + `npm test` antes de commitar.

Guia prático para criar **seu primeiro agente, hook, skill ou addon**. Pressuposto: você já leu [`docs/ARQUITETURA.md`](ARQUITETURA.md) e [`docs/COMO-FUNCIONA.md`](COMO-FUNCIONA.md).

> **Quando criar o quê?**
> - **Agente** — papel novo no time virtual (ex: agente jurídico, agente DBA).
> - **Hook** — regra mecânica que precisa bloquear/avisar no momento certo (PreToolUse, PostToolUse, etc.).
> - **Skill** — procedimento reaproveitável que o agente invoca por gatilho (validador, gerador, template).
> - **Addon** — pacote completo para um domínio (Electron, Pix, eSocial). Junta agentes + hooks + skills + templates.

---

## 1. Criando seu primeiro agente

Agentes vivem em `.claude/agents/<nome>.md`. Esqueleto mínimo:

```markdown
---
name: nome-do-agente
description: 1 frase em PT-BR sobre quando invocar este agente.
tools: Read, Glob, Grep, Edit, Write
model: inherit
color: blue
identity:
  nome: "Camila"
  icone: "📝"
---

# Nome do agente

## Identidade

Você é a Camila 📝 — _(descrição curta do papel)._

## Princípios

1. Princípio 1 — sempre PT-BR sem jargão.
2. Princípio 2 — verifica antes de afirmar.
3. ...

## Modos

(Se o agente tem múltiplos modos, listar com gatilho de cada um.)

## Saída esperada

(Formato exato do que devolve — bloco markdown, JSON, etc.)
```

**Checklist de qualidade:**
- [ ] Frontmatter tem todos os campos obrigatórios (`name`, `description`, `tools`, `model`, `color`).
- [ ] `tools:` restrito ao mínimo necessário (princípio do menor privilégio — SEC-004).
- [ ] Princípios numerados.
- [ ] Não duplica papel de agente existente — abra `.claude/agents/` e leia os 12 antes.
- [ ] Inclui exemplo de saída.

**Validação:**
```bash
node tools/validar-templates.js
```

Esse script verifica frontmatter, referência em README e árvore real.

---

## 2. Criando seu primeiro hook

Hooks vivem em `.claude/hooks/<nome>.sh`. Disparam em ciclos de vida do Claude Code: `PreToolUse`, `PostToolUse`, `SubagentStop`, `Stop`, `SessionStart`, `PreCompact`, `SessionEnd`.

### Esqueleto mínimo de hook bloqueador (PreToolUse)

```bash
#!/usr/bin/env bash
# meu-hook.sh — descreve o que protege e a regra (SEC-XXX / INV-XXX).
# Hook PreToolUse, matcher: Edit (ajuste pra Write, Bash, etc.).

set -u

# Carrega sanitizacao centralizada (PROJDIR, session hash, secrets canonicos).
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

# Parser perl -MJSON::PP — funciona em Windows Git Bash sem jq.
FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $j = decode_json(<STDIN>);
  print $j->{tool_input}->{file_path} // "";
' 2>/dev/null)

# Fail-closed: se nao conseguiu parsear mas tem input, escaneie cru.
[ -z "$FILE_PATH" ] && [ -z "$INPUT" ] && exit 0

# === SUA REGRA AQUI ===
if printf '%s' "$FILE_PATH" | grep -qE 'algum-padrao-proibido'; then
  cat >&2 <<EOF
[meu-hook] BLOQUEADO: <motivo curto>.

Arquivo: $FILE_PATH
Regra aplicada: MEU-001.

Como corrigir: <instrução acionável em 1 linha>.
EOF
  exit 2  # exit 2 bloqueia mecanicamente
fi

exit 0
```

### Registrar o hook em `.claude/settings.json`

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

### Adicionar caso de teste em `_test-runner.sh`

```bash
# Bloco no _test-runner.sh
test_meu_hook() {
  local out
  out=$(printf '{"tool_input":{"file_path":"path/proibido"}}' | bash "$HOOKS_DIR/meu-hook.sh" 2>&1)
  if [ $? -eq 2 ]; then ok "meu-hook  →  bloqueia path proibido"
  else fail "meu-hook  →  deveria bloquear" "$out"; fi
}
test_meu_hook
```

> **Atualize `EXPECTED_TOTAL`** no topo do `_test-runner.sh` — o guard anti-falso-verde aborta se o número de testes não bater.

**Checklist:**
- [ ] Shebang `#!/usr/bin/env bash`.
- [ ] Trata stdin vazio (`[ -z "$INPUT" ] && exit 0`).
- [ ] Carrega `_lib.sh` se precisa de `PROJDIR`/`SESSION_HASH`.
- [ ] Mensagem em PT-BR com regra citada (ID se houver).
- [ ] Caso de teste em `_test-runner.sh`.
- [ ] Funciona em Windows Git Bash (sem `jq`, usa `perl -MJSON::PP`).

---

## 3. Criando sua primeira skill

Skills vivem em `.claude/skills/<nome>/SKILL.md` (+ opcionalmente `scripts/`, `templates/`).

### Esqueleto mínimo

```markdown
---
name: minha-skill
description: 1 frase em PT-BR — quando o agente deve invocar esta skill.
allowed-tools: Read, Bash(python3:*), Bash(python:*)
owner: framework
revisado-em: AAAA-MM-DD
status: stable
---

# minha-skill

Você é um agente acionando esta skill quando o gatilho disparar.

## Quando usar
- Cenário 1.
- Cenário 2.

## Uso

```bash
python3 scripts/minha-skill.py argumento
```

## Saída esperada

(Formato exato.)
```

**Skill com algoritmo embutido** (preferido para CPF, CNPJ, Pix, PIS, CEP — qualquer validador BR):

`.claude/skills/minha-skill/scripts/minha-skill.py` (Python 3, stdlib pura, sem `pip install`).

### Frontmatter mínimo aceito pelo validador

| Campo | Obrigatório? | Notas |
|---|---|---|
| `name` | sim | kebab-case, igual ao diretório. |
| `description` | sim | 1 frase em PT-BR. |
| `allowed-tools` | sim para skills que executam comando | Listar exatamente o necessário. |
| `owner` | sim | `framework` ou nome do addon. |
| `revisado-em` | sim | Data ISO. |
| `status` | sim | `stable`, `beta` ou `deprecated`. |

**Checklist:**
- [ ] Frontmatter completo.
- [ ] Algoritmo embutido (sem dependência runtime — `requirements.txt` é vermelho).
- [ ] Funciona offline (chamadas de rede são opt-in via flag).
- [ ] Testado em `test/skills.test.js` se gera/valida dado crítico.

---

## 4. Criando seu primeiro addon

Addons vivem em `addons/<nome>/`. Esqueleto:

```
addons/meu-addon/
├── addon.yaml                    <- manifesto obrigatório
├── README.md                     <- pra que serve, como instalar
├── .claude/
│   ├── agents/                   <- agentes do addon (opcional)
│   ├── commands/                 <- commands do addon (opcional)
│   ├── hooks/                    <- hooks do addon (opcional)
│   └── skills/                   <- skills do addon (opcional)
├── .specify/templates/           <- templates extras (opcional)
└── docs/                         <- documentação do addon (opcional)
```

### `addon.yaml` mínimo

```yaml
name: meu-addon
version: 0.1.0
description: 1 linha PT-BR
authors:
  - <seu nome>
license: MIT
status: beta
revisado-em: AAAA-MM-DD

requires:
  roldao-method: ">=0.15.0"

provoca:
  agents:    []
  commands:  []
  hooks:     []
  skills:    []
  templates: []

regras:
  - id: MEU-001
    titulo: <título curto>
    descricao: <regra em 1 linha>

requisitos:
  - <pré-requisito do projeto>

non-goals:
  - <o que o addon NÃO faz>
```

`provoca:` cita pelo nome cada artefato. O validador (`tools/validar-templates.js`) confere se cada nome listado existe em disco.

**Checklist:**
- [ ] `addon.yaml` válido contra `addon.schema.json` (`tools/validar-addon-yaml.js`).
- [ ] README do addon explica o caso de uso BR concreto.
- [ ] Regras com prefixo único (não colidir com `LGPD-*`, `FISCAL-*`, `PIX-*`, `SEC-*`, `TST-*`, `INV-*`).
- [ ] `non-goals` declarados (INV-003).

---

## 5. Lifecycle dos hooks — qual roda quando?

| Lifecycle | Disparado em | Hooks atuais (exemplos) |
|---|---|---|
| `SessionStart` | Cada nova sessão Claude Code | `mcp-validator`, `session-restore`, `context-budget` |
| `PreToolUse` | Antes de cada chamada de ferramenta | `block-destructive`, `secrets-scanner`, `anti-mascaramento`, `require-investigador-before-fix`, `validate-quick-dev-scope`, etc. |
| `PostToolUse` | Após cada ferramenta executar | `auto-format-on-write`, `block-jargon-pt-br`, `block-confirmation-questions` |
| `SubagentStop` | Quando um subagente termina | `subagent-handoff-audit` |
| `Stop` | Quando o turno do agente termina | `regra-zero-reminder` (com gatilho de bug detectado) |
| `PreCompact` | Antes de o Claude compactar contexto | (espaço pra hooks futuros) |
| `SessionEnd` | Quando a sessão fecha | `session-snapshot` |

**Regra geral:** se sua regra precisa **impedir** o agente de fazer algo errado → `PreToolUse` com `exit 2`. Se a regra precisa **avisar** depois → `PostToolUse` com `decision: block` no JSON (ou stderr não-fatal).

---

## 6. Funções compartilhadas em `_lib.sh`

Centralizam sanitização — use sempre que tocar paths ou markers de sessão:

| Função | O que faz |
|---|---|
| `sanitize_projdir` | Valida e devolve `PROJDIR` seguro (bloqueia `..`, exige absoluto, suporta Windows). |
| `sanitize_session_hash` | Gera hash da sessão com fallback `default`. |
| `safe_runtime_dir <projdir>` | Cria e devolve `<projdir>/.claude/.runtime`. |
| `safe_tmpfile [prefix]` | Cria tmpfile isolado por UID (anti symlink attack em `/tmp` multi-user). |
| `secret_token_patterns` | Lista canônica de regex de tokens — consumida por `secrets-scanner.sh` e `block-secrets-in-commit-message.sh`. |
| `hook_block_header <nome> <motivo>` | Cabeçalho padrão de bloqueio em stderr. |

Carregue no topo do hook:
```bash
. "$(dirname "$0")/_lib.sh"
```

---

## 7. Quando NÃO criar agente/hook/skill

- **Não crie agente** só porque o papel é "diferente em 10%". Refine o existente — 12 agentes já é o teto saudável.
- **Não crie hook** pra cenário que acontece 1x por mês — fica débito em forma de regex frágil.
- **Não crie skill** se o padrão só se repetiu 1-2 vezes (regra de 3 — repete 3x → vira skill).
- **Não crie addon** se o domínio cabe em 1 skill — addon é overhead.

---

## 8. Quality gates antes de abrir PR

```bash
npm test
```

Equivale a:
1. `node tools/validar-templates.js`
2. `bash templates/.claude/hooks/_test-runner.sh`
3. `node test/install.test.js`
4. `node test/skills.test.js`
5. `node test/addons.test.js`
6. `node test/adapters.test.js`

Se falhar, **não abra PR** até estar verde. Detalhes em [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## 9. Onde encontrar exemplos

- **Agente:** `templates/.claude/agents/dev-senior.md` (sênior — padrão completo) ou `analista.md` (mais simples).
- **Hook bloqueador:** `templates/.claude/hooks/block-destructive.sh` (claro), `secrets-scanner.sh` (usa `_lib.sh` + `safe_tmpfile`).
- **Hook auxiliar:** `templates/.claude/hooks/regra-zero-reminder.sh`.
- **Skill com Python:** `templates/.claude/skills/validar-cpf-cnpj/`.
- **Skill só de guia:** `templates/.claude/skills/gerar-adr-pt-br/`.
- **Addon completo:** `addons/fintech-br/` (5 skills + 1 hook + 1 agente).

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
