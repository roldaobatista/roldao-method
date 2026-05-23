---
id: ADR-013
titulo: Convenção de hook Node — shebang, bit +x, settings.json
status: aceito
data: 2026-05-23
owner: framework
revisado-em: 2026-05-23
depende: ADR-012
epico: EP-001
---

# ADR-013 — Convenção de arquivo, registro e execução de hook Node

## Contexto

[ADR-012](ADR-012-hooks-node-port.md) decidiu portar os hooks de bash pra Node. Restam decisões concretas que afetam a interface entre o hook e o Claude Code:

1. Como o Claude Code descobre/executa o arquivo? (Claude Code aceita qualquer executável — basta path no `settings.json`.)
2. Que extensão usar? `.js` puro? `.hook.js`? `.mjs`?
3. Onde mora o shebang vs onde fica o handler de erro?
4. Como o `install.js` garante o bit `+x` no Unix?
5. Como migrar `settings.json` da versão `.sh` pra `.js` sem quebrar quem tem `settings.local.json` customizado?

## Decisão

**Convenção do arquivo:**

- **Extensão:** `.js` puro (não `.mjs`, não `.hook.js`). Conserva grep mental ("é o mesmo arquivo, mudou de linguagem"). Sem CommonJS vs ESM dance — Node 18+ aceita ESM com `"type": "module"` no nearest `package.json`, mas hooks ficam em CommonJS pra evitar import gymnastics em scripts curtos.
- **Shebang:** primeira linha `#!/usr/bin/env node`. Em Windows, Git for Windows respeita; em PowerShell puro, `node arquivo.js` é o fallback que o `settings.json` chama.
- **Bit de execução (+x):** `bin/install.js` aplica `fs.chmodSync(dest, 0o755)` em qualquer `.sh` E `.js` sob `.claude/hooks/`. Já existe `ensureExecutable()` — só estender o regex pra incluir `.js`.

**Registro em `settings.json`:**

Hoje:
```json
{
  "matcher": "Bash",
  "hooks": [{ "type": "command", "command": "bash \"${CLAUDE_PROJECT_DIR}/.claude/hooks/block-destructive.sh\"" }]
}
```

Após port:
```json
{
  "matcher": "Bash",
  "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PROJECT_DIR}/.claude/hooks/block-destructive.js\"" }]
}
```

`bash` vira `node`. Path muda extensão. Resto idêntico. **Não usar shebang pra invocar** — sempre `node <arquivo>` explícito, garante funcionar em Windows mesmo sem +x.

**Estrutura interna de cada hook:**

```js
#!/usr/bin/env node
// <nome>.js — <descricao curta>
// Hook <Event>, matcher: <X>. Regra: <ID>.

const { readStdinJson, recordMetric, hookBlockHeader } = require('./_lib.js');

(async () => {
  const input = await readStdinJson();
  // ... lógica do hook ...
  if (violou) {
    hookBlockHeader('nome-hook', 'razão curta');
    process.stderr.write(`Detalhe + remediação.\n`);
    recordMetric('block', 'nome-hook', 'razão');
    process.exit(2);
  }
  process.exit(0);
})().catch((err) => {
  // Fail-closed igual ao .sh — erro inesperado NÃO libera (saí com 2 quando regra é bloqueadora).
  process.stderr.write(`[nome-hook] erro interno: ${err.message}\n`);
  process.exit(2);
});
```

**`_lib.js` espelha `_lib.sh`:** exporta `sanitizeProjdir`, `sanitizeSessionHash`, `safeRuntimeDir`, `safeTmpfile`, `secretTokenPatterns`, `hookBlockHeader`, `recordMetric`, `readStdinJson`. Mesmas funções, equivalência testada em US-108.

**Migração do `settings.json`:**

`bin/install.js` na versão v1.0:
- Detecta `settings.json` existente com `.sh` em `command` → reescreve in-place pra `.js` (faz `.bak` antes).
- Não toca `settings.local.json` (preferência do dev).
- `doctor` warna se ainda houver `.sh` referenciado em `settings.json` no projeto.

## Consequências

**Positivas:**
- Convenção simples — 1 arquivo `.js` por hook, 1 `_lib.js` central.
- Mesma estrutura mental dos `.sh` (1:1 mapping).
- Migração in-place do `settings.json` evita pedir ação manual do cliente.

**Negativas (aceitas):**
- Hooks em CommonJS num ecossistema cada vez mais ESM. Aceitável — arquivos são curtos (~50-150 linhas) e não usam top-level await.
- Shebang fica decorativo em Windows (sempre invocado via `node <arquivo>`). Mantido pra Unix where matters.

## Alternativas descartadas

- **`.mjs` ESM:** descartado pra evitar `import/export` em scripts curtos onde `require` é mais legível.
- **Single bundle hook (1 arquivo dispatcher chamando todos):** descartado por quebrar o modelo "1 hook = 1 arquivo grepável" do Claude Code.
- **Shebang `#!/usr/bin/env -S node`:** descartado por incompatibilidade com macOS antigo (env sem -S).

## Non-goals

- **TypeScript em hooks:** descartado — adiciona build step, mata "zero deps".
- **Helper externo (npm install xxx):** descartado — `_lib.js` é único arquivo zero-dep.
- **Hot reload entre hooks:** desnecessário — cada invocação é nova subprocess.

## Histórico

| Data       | Quem    | Mudança                                  |
|------------|---------|------------------------------------------|
| 2026-05-23 | Roldão  | aceito junto com ADR-012/014 (PRD-001)   |
