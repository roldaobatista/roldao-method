---
owner: framework
revisado-em: 2026-05-23
status: stable
---

# Migração v0.x → v1.0

> Guia oficial pra atualizar projetos que estão em **v0.20.0** ou anterior pra **v1.0.0-rc1+**. O coração do framework mudou — hooks bash + perl viraram Node.js puro (EP-001).

## TL;DR

```bash
cd /meu/projeto
npx roldao-method@latest update
npx roldao-method doctor
```

Se `doctor` mostrar tudo OK, terminou. Sem leitura adicional necessária.

Se quiser entender o que mudou ou tem customização local, continue lendo.

---

## O que muda na prática

| Antes (v0.x) | Depois (v1.0) |
|---|---|
| `templates/.claude/hooks/block-destructive.sh` | `templates/.claude/hooks/block-destructive.js` |
| `bash _test-runner.sh` | `npm run test:hooks-node-only` |
| Requer Git Bash em Windows | Roda em PowerShell/CMD puro |
| Requer `perl` no PATH | Não precisa |
| Suite roda `bash` + `node` | Suite roda só `node` |

**O que NÃO muda:**

- Comportamento dos 26 hooks (paridade byte-a-byte validada por 216 cenários verdes em v0.20).
- `AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md`, `settings.local.json` — `update` preserva.
- Permissões em `settings.json` (allow/ask/deny).
- Estrutura de `.claude/`, `.specify/`, `docs/`.

---

## Passo a passo

### 1. Antes de atualizar

```bash
# Confirme em qual versão você está
cat node_modules/roldao-method/package.json 2>/dev/null | grep version
# OU
grep version templates/.claude-plugin/plugin.json
```

Se < `1.0.0-rc1`, prossiga.

### 2. Faça backup do que é seu

Se você tem hook `.sh` **customizado** (não os do framework, mas seu próprio):

```bash
# Mover hooks personalizados pra overrides (intocado pelo update)
mkdir -p .specify/overrides/.claude/hooks
mv .claude/hooks/MEU-HOOK-CUSTOMIZADO.sh .specify/overrides/.claude/hooks/
```

Hook `.sh` em `.specify/overrides/` continua funcionando — o Claude Code aceita qualquer executável; basta apontar no `settings.json` ou em `settings.local.json`.

### 3. Atualize

```bash
npx roldao-method@latest update
```

O `update`:
- Copia 26 `.js` novos pra `templates/.claude/hooks/`.
- Substitui `settings.json` apontando pra `node hook.js`.
- Faz backup `.bak` de cada arquivo sobrescrito.
- **Não toca** em `AGENTS.md`, `CLAUDE.md`, `REGRAS-INEGOCIAVEIS.md`, `settings.local.json`, `.specify/overrides/`.

### 4. Verifique

```bash
npx roldao-method doctor
```

Saída esperada:
```
Total: NN  |  OK: NN  |  FALTA: 0
✓ instalacao OK.
```

Se aparecer `FALTA`: leia o nome do arquivo, instale o que falta (provavelmente um adapter de IDE foi adicionado).

### 5. (Se usa addons) Atualize os addons

```bash
npx roldao-method add fintech-br        # se você usava
npx roldao-method add fiscal-br-completo
# etc.
```

---

## Casos especiais

### "Eu customizei um hook .sh"

Você tinha algo tipo `templates/.claude/hooks/meu-bloqueador.sh` próprio?

**Opção A: portar pra Node** (recomendado a longo prazo). Veja `docs/EXTENDENDO/hook.md` (versão v1.0+ tem skeleton Node).

**Opção B: mover pra overrides** (mantém bash funcionando):
```bash
mkdir -p .specify/overrides/.claude/hooks
mv templates/.claude/hooks/meu-bloqueador.sh .specify/overrides/.claude/hooks/
```
Depois adicione referência em `.claude/settings.local.json` (que não é sobrescrito pelo update):
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "bash \"${CLAUDE_PROJECT_DIR}/.specify/overrides/.claude/hooks/meu-bloqueador.sh\""
      }]
    }]
  }
}
```

### "Meu CI roda `bash _test-runner.sh`"

Atualize pra:
```yaml
- run: npm run test:hooks-node-only
```

### "Meu projeto cliente está em Windows + PowerShell e nada funcionava"

**Esse é exatamente o caso que a v1.0 resolve.** Depois do update, hooks funcionam. Não precisa fazer mais nada.

### "Estou rodando em container Alpine minimal sem bash"

Funciona. Node 18+ é o único requisito.

### "Tem teste de paridade entre o .sh antigo e o .js novo?"

Tinha — 216 cenários verdes em v0.20.0. Removidos na v1.0.0-rc1 (papel cumprido). Pra rodar a comparação histórica:

```bash
git checkout v0.20.0
npm test  # 216 cenários .sh ↔ .js
git checkout main
```

---

## Rollback

Se algo der errado:

```bash
# Voltar pra v0.20.0 nesse projeto
npx roldao-method@0.20.0 install --force
```

Ou via npm install pinado:
```json
{
  "devDependencies": {
    "roldao-method": "0.20.0"
  }
}
```

---

## FAQ

**Quanto tempo leva o update?**
~30s a 2min, dependendo da rede npm e do tamanho do projeto.

**Posso continuar usando os `.sh` velhos como fallback?**
Não — `update` substitui. Se quiser preservar, ANTES do update faça `cp -r templates/.claude/hooks .claude.hooks.backup-v0.20`.

**Vai quebrar meu addon?**
Os 6 oficiais (`fintech-br`, `fiscal-br-completo`, `lgpd-compliance`, `electron-br`, `esocial-completo`, `varejo-pdv-br`) continuam funcionando em v1.0-rc1. Hooks `.sh` próprios desses addons vão ser migrados em v1.0.1.

**E se eu tiver dúvida na hora do update?**
Issue: https://github.com/roldaobatista/roldao-method/issues — marque com label `migracao-v1`.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
