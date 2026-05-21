---
owner: framework
revisado-em: 2026-05-20
status: stable
---

# Troubleshooting — erros e soluções

## Instalação

### `npx roldao-method install` trava aguardando input no CI
**Causa:** sem TTY o `readline` não consegue ler resposta.
**Fix:** use `--yes`:
```bash
npx roldao-method install --yes
```

### "recusa: diretório atual parece sensível"
**Causa:** rodando em raiz do disco, home ou pasta do sistema (Program Files, /etc, /usr).
**Fix:** entre numa pasta de projeto antes:
```bash
cd ~/projetos/meu-app
npx roldao-method install
```

### "pulando (já existe)" pra todos os arquivos
**Causa:** o framework já foi instalado e `install` é conservador.
**Fix:** use `update` (sobrescreve mantendo customizações com `.bak`):
```bash
npx roldao-method update
```

### `npx` está pegando versão antiga
**Causa:** cache local.
**Fix:**
```bash
npm cache clean --force
npx roldao-method@latest install
```

## Hooks

### Hook bloqueou e você acha que era caso legítimo

**Anti-mascaramento bloqueou `@ts-ignore`:**
```typescript
// @ts-ignore TST-001-exception: lib X exporta tipo errado e dev mantém issue #45
```

**Block-mock-in-integration bloqueou `vi.mock`:**
```typescript
// TST-003-exception: gateway X está fora do ar; mock temporário enquanto fornecedor não corrige
vi.mock('./gateway-x');
```

**Block-todo-without-issue bloqueou TODO:**
```typescript
// TODO(#123): refatorar quando US-007 entrar
```

**Block-destructive bloqueou comando legítimo:**
Não tem exceção. O comando é mesmo destrutivo. Peça autorização explícita do dono do projeto antes de prosseguir, ou edite `.claude/settings.json` removendo a entrada da deny list (responsabilidade sua).

### Hooks não estão rodando no Cursor
Cursor não tem `PreToolUse`. Os hooks rodam apenas no Claude Code. Em Cursor, as regras viram texto em `AGENTS.md`/`.cursorrules` — disciplina por prompt, não bloqueio.

### Hooks não rodam no Windows (silencioso)
**Sintoma:** o framework parece instalado, mas hooks nunca bloqueiam nada.
**Causa principal:** os 22 hooks bloqueadores são scripts `bash` que usam `perl -MJSON::PP` pra parsear o JSON de input do Claude Code. PowerShell e CMD não têm bash nem perl no PATH.
**Fix obrigatório:**
1. Instale o **Git for Windows** (https://git-scm.com/download/win) — ele vem com Git Bash, bash e perl.
2. Abra o **Git Bash** (não PowerShell, não CMD).
3. Rode o Claude Code (ou Cursor com terminal) a partir do Git Bash.
4. Confira: `which bash && which perl && bash --version`. Tudo precisa existir.
5. Se usa Cursor/Windsurf: configure o terminal padrão pra Git Bash em Settings → Terminal → Default Profile.

**Diagnóstico rápido:**
```bash
npx roldao-method doctor
```
A partir da v0.5.0 o `doctor` reporta "Hooks vão rodar?" com base em bash+perl detectados.

### Hook quebra no Windows com erro de comando
**Sintoma:** `bash: command not found` ou erro de perl/grep.
**Causa:** PATH do Git Bash não está completo.
**Fix:** abra o Git Bash (vem com Git for Windows) e rode o Claude Code a partir dele. Ou ajuste `claude` pra usar o `bash.exe` do Git.

### `paths-frontmatter-validator` bloqueia arquivo de doc legítimo
**Causa:** arquivo `.md` em `docs/` sem frontmatter (`owner`, `revisado-em`, `status`).
**Fix 1:** adicionar frontmatter:
```yaml
---
owner: <quem>
revisado-em: 2026-05-17
status: draft
---
```
**Fix 2:** se o arquivo é do framework e não muda, adicionar na whitelist do hook.

## Skills

### `validar-cpf-cnpj` rejeita CNPJ que parece válido
**Cenário:** o CNPJ tem letras (alfanumérico, novo formato 2026).
**Fix:** já suportado a partir da v0.3.0. Atualize: `npx roldao-method update`.

### `validar-cep --remoto` falha com timeout
**Causa:** ViaCEP fora do ar ou rede lenta.
**Fix:** valide sem `--remoto` (offline) e tente novamente depois. Não dependa de ViaCEP em fluxo crítico.

### Skill Python falha com "ModuleNotFoundError"
**Causa:** Python 3 não está no PATH.
**Fix:** garanta que `python3` (ou `python`) está disponível. No Windows, use o Python da Microsoft Store ou python.org.

### `npm test` mostra "SKIP skills Python: interpretador não encontrado"
**Causa:** Python 3.8+ não está instalado no dev local. CI tem um job dedicado que cobre as 5 skills Python (CPF/CNPJ, Pix, CEP, PIS, fixtures BR), então **isto não bloqueia release** — só cobertura local.

**Detecção:** o teste procura `python3` → `python` → `py` (nesta ordem). `py` é o Python Launcher do Windows (vem com o instalador oficial de python.org).

**Fix Windows (recomendado):**
1. Baixe Python 3.11+ em https://python.org/downloads/windows.
2. **Marque "Add python.exe to PATH"** no primeiro passo do instalador (sem isto, nem `python` nem `py` ficam disponíveis no Git Bash).
3. Feche e reabra o Git Bash.
4. Confirme: `python --version` ou `py --version`.

**Fix Windows (alternativo):** instale via Microsoft Store ("Python 3.11").

**Fix macOS:** `brew install python@3.11` (Homebrew) ou já vem com algumas versões.

**Fix Linux:** geralmente já vem. Se não: `sudo apt install python3` (Debian/Ubuntu) ou equivalente da sua distro.

### Hook bash falha com "perl: command not found"
**Causa:** 25 dos 28 hooks usam `perl -MJSON::PP` pra parsear o JSON de input. Perl não está no PATH.

**Fix Windows:** instale o **Git for Windows** (https://git-scm.com/download/win) — já traz `bash`, `perl` e `grep` num pacote. Rode o Claude Code/Cursor a partir do Git Bash que vem junto.

**Fix Linux:** `sudo apt install perl` (já vem em quase toda distro).

**Fix macOS:** já vem com o sistema.

**Confirme:** `perl --version` deve mostrar 5.12+ (qualquer versão recente serve).

## MCP

### `mcp-validator` avisa sobre server desconhecido
**Causa:** seu `.mcp.json` tem server fora da allowlist conservadora.
**Decisão:** se você confia no autor do MCP, é só aviso, não bloqueio. Para silenciar, adicione o pattern do server na allowlist do hook (`templates/.claude/hooks/mcp-validator.sh`).

### MCP server não conecta
- Verifique se as variáveis de ambiente (`${VAR}` no `.mcp.json`) estão setadas.
- Veja log do Claude Code (`/doctor` no CLI).
- Confirme que o servidor está acessível (URL/comando).

## Workflows

### `/feature` está pulando o investigador
**Cenário:** comando rodou direto pro dev-senior.
**Causa:** o agente decidiu que era trivial.
**Fix:** se for bug, use `/bug` (investigador obrigatório). Se for feature complexa, fale na 1ª mensagem: "feature tem impacto em vários módulos, exige investigador".

### `/output-style` não ativa o pt-br-conciso
**Causa:** o estilo é externo ao framework — precisa ser ativado manualmente no Claude Code.
**Fix:** rode `/output-style` no terminal do Claude Code e escolha `pt-br-conciso` na lista.

### Agente não respeita as regras inegociáveis
**Causa:** ou ele não leu, ou as regras estão desligadas no settings.json.
**Fix:**
1. Confirme que `AGENTS.md` e `REGRAS-INEGOCIAVEIS.md` existem na raiz.
2. Confirme que `CLAUDE.md` importa `@AGENTS.md`.
3. Rode `npx roldao-method doctor`.

## Performance

### Contexto enchendo rápido
**Causa:** AGENTS.md/CLAUDE.md ficaram grandes.
**Fix:** o hook `context-budget` avisa. Limites: AGENTS ≤ 200 linhas, CLAUDE ≤ 150. Mover detalhe pra docs/ separadas.

### Resposta muito lenta
**Causa:** agente usando `sonnet`/`opus` quando `haiku` bastaria.
**Fix:** edite frontmatter do agente, troque `model: sonnet` por `model: haiku` em PM/UX/Analista.

## Reportar problema

Não achou seu caso aqui? Abra issue em https://github.com/roldaobatista/roldao-method/issues com:
- versão (`npx roldao-method version`)
- SO + shell
- comando que deu errado + erro literal
- saída de `npx roldao-method doctor`
