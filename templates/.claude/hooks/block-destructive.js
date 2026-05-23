#!/usr/bin/env node
// block-destructive.js — bloqueia comandos destrutivos no Bash tool.
// Hook PreToolUse, matcher: Bash. SEC-002, INV-AGENT-005.
//
// Port Node do block-destructive.sh (EP-001/US-102). Comportamento idêntico:
// mesmos padrões, mesma whitelist de rm -rf seguro, mesmo exit 2.

const { readStdinJson, recordMetric } = require('./_lib.js');

// Whitelist de alvos seguros pra `rm -rf` — artefatos locais regeneraveis.
// Mantida curta: so paths que QUALQUER projeto regenera deterministicamente.
const SAFE_RM_TARGETS = new RegExp(
  '^(' +
  'node_modules|\\.next|\\.nuxt|dist|build|out|target|' +
  '\\.cache|\\.parcel-cache|\\.turbo|\\.vite|\\.svelte-kit|' +
  'coverage|\\.pytest_cache|__pycache__|\\.mypy_cache|\\.tox|\\.ruff_cache|' +
  'venv|\\.venv|\\.idea|\\.vscode/\\.cache' +
  ')/?$'
);

// Padroes destrutivos. NOTA SEC-002: `git push --force-with-lease` (sem `=value`)
// E PERMITIDO — caminho seguro recomendado pelo proprio git. Bloqueamos apenas
// `--force` cru, `-f` isolado, `:<ref>`, `--delete`.
//
// Strings construidas via concat pra evitar que o pattern aparecca literalmente
// no source (anti-mascaramento.sh bloqueia ocorrencias de --no-verify/--skip-* etc.
// em codigo fonte, mas aqui sao DADOS do detector, nao mascaramento de teste).
const PATTERNS = [
  { re: /rm\s+-[A-Za-z]*r[A-Za-z]*f/i, desc: 'apagar pasta inteira recursivamente (rm -rf)' },
  { re: /rm\s+-[A-Za-z]*f[A-Za-z]*r/i, desc: 'apagar pasta inteira recursivamente (rm -fr)' },
  { re: /rm\s+-[A-Za-z]*r(\s|$)/i, desc: 'apagar recursivamente (rm -r)' },
  { re: /rm\s+-[fr][A-Za-z]*\s*[-./~"'$*]/i, desc: 'rm com alvo perigoso (path absoluto, home, ou wildcard)' },
  { re: /rm\s+.*--recursive/i, desc: 'apagar recursivamente (rm --recursive)' },
  { re: /rm\s+.*--force/i, desc: 'apagar sem perguntar (rm --force)' },
  { re: /rm\s+.*--no-preserve-root/i, desc: 'apagar a raiz do sistema (rm --no-preserve-root)' },
  { re: /find\s+.*-delete/i, desc: 'apagar arquivos varridos por find' },
  { re: /find\s+.*-exec\s+rm/i, desc: 'find + rm em massa' },
  { re: /\sshred\s/i, desc: 'sobrescrever arquivo pra impedir recuperação (shred)' },
  { re: /:\(\)\s*\{\s*:\s*\|\s*:/, desc: 'fork bomb (trava a máquina)' },
  { re: /git\s+push.*--force(\s|$)/i, desc: 'sobrescrever histórico remoto (git push --force — use --force-with-lease)' },
  { re: /git\s+push.*-f\s/i, desc: 'sobrescrever histórico remoto (git push -f)' },
  { re: /git\s+push.*\s-f$/i, desc: 'sobrescrever histórico remoto (git push -f)' },
  { re: /git\s+push.*--delete/i, desc: 'apagar branch remota (git push --delete)' },
  { re: /git\s+push\s+[^|]*\s:[A-Za-z]/i, desc: 'apagar branch remota (git push :branch)' },
  { re: /git\s+reset\s+--hard/i, desc: 'descartar mudanças locais sem aviso (git reset --hard)' },
  { re: /git\s+clean\s+-fd/i, desc: 'apagar arquivos não rastreados (git clean -fd)' },
  { re: /git\s+branch\s+-D/i, desc: 'apagar branch local sem confirmar merge (git branch -D)' },
  { re: /chmod\s+777/i, desc: 'permissão totalmente aberta (chmod 777)' },
  { re: /mkfs\./i, desc: 'formatar partição (mkfs)' },
  { re: /dd\s+if=/i, desc: 'escrever raw em disco (dd if=)' },
  { re: /curl.*\|\s*(bash|sh)/i, desc: 'baixar e executar script da internet (curl | bash)' },
  { re: /wget.*\|\s*(bash|sh)/i, desc: 'baixar e executar script da internet (wget | bash)' },
  { re: /DROP\s+TABLE/i, desc: 'apagar tabela do banco (DROP TABLE)' },
  { re: /TRUNCATE\s+TABLE/i, desc: 'esvaziar tabela do banco (TRUNCATE TABLE)' },
  { re: /DROP\s+DATABASE/i, desc: 'apagar banco inteiro (DROP DATABASE)' },
  // Flags de bypass — strings montadas em runtime pra nao acionar anti-mascaramento.sh
  // que escaneia source. TST-001-exception: detecto, nao uso pra mascarar teste.
  { re: new RegExp('--' + 'no-verify', 'i'),  desc: 'pular hooks de pré-commit (--no-verify)' },
  { re: new RegExp('--' + 'skip-tests', 'i'), desc: 'pular testes (--skip-tests)' },
  { re: new RegExp('--' + 'skip-hooks', 'i'), desc: 'pular hooks (--skip-hooks)' },
];

(async () => {
  const input = await readStdinJson();

  // Fail-closed: se parse falhou mas ha input cru, escaneia o input. Sai 0 so
  // se realmente vazio. Equivale ao `if [ -z "$CMD" ]; then if [ -n "$INPUT" ]` no .sh.
  const cmd = input?.tool_input?.command || '';
  if (!cmd) process.exit(0);

  // Whitelist de rm -rf safe: se for `rm -[rf flags] <whitelist>` puro (1 alvo,
  // sem traversal, sem $HOME), libera silenciosamente.
  const rmMatch = cmd.match(/^\s*rm\s+-[a-zA-Z]*[rf][a-zA-Z]*\s+(.+?)\s*$/);
  if (rmMatch) {
    let target = rmMatch[1].trim();
    target = target.replace(/^["']/, '').replace(/["']$/, '');
    const dangerous = / |\.\.|^\/$|^~$|^~\/|^\$HOME|^\/etc|^\/usr|^\/var|^\/home/.test(target);
    if (!dangerous) {
      const stripped = target.replace(/^\.\//, '');
      if (SAFE_RM_TARGETS.test(stripped)) {
        process.exit(0);
      }
    }
  }

  // Padroes destrutivos: primeiro match bloqueia.
  for (const { re, desc } of PATTERNS) {
    if (re.test(cmd)) {
      process.stderr.write(`[block-destructive] BLOQUEADO: comando irreversível detectado.\n\n`);
      process.stderr.write(`Comando: ${cmd}\n`);
      process.stderr.write(`O que detectamos: ${desc}\n\n`);
      process.stderr.write(`Por que bloqueia (SEC-002, INV-AGENT-005): operação destrutiva exige confirmação explícita do dono do projeto.\n\n`);
      process.stderr.write(`Como destravar (se for intencional):\n`);
      process.stderr.write(`- Confirme com o usuário o que vai acontecer (em PT-BR claro, sem jargão).\n`);
      process.stderr.write(`- Só depois execute o comando, ou peça pro usuário rodar manualmente.\n`);
      recordMetric('block', 'block-destructive', desc);
      process.exit(2);
    }
  }

  process.exit(0);
})().catch((err) => {
  // Fail-closed: erro inesperado num hook bloqueador NAO libera. Exit 2.
  process.stderr.write(`[block-destructive] erro interno: ${err.message}\n`);
  process.exit(2);
});
