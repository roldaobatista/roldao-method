#!/usr/bin/env node
// block-destructive.js — bloqueia comandos destrutivos no Bash tool.
// Hook PreToolUse, matcher: Bash. SEC-002, INV-AGENT-005.
//
// Port Node do block-destructive.sh (EP-001/US-102).
// Auditoria 2026-08-17 (mutirao lote 3):
// - `git push origin +main` (+refspec = force) agora bloqueia
// - `git -c x=y push --force` agora bloqueia (opcoes entre git e push)
// - `rimraf`/`npx rimraf` tratado como rm (mesma whitelist)
// - `terraform apply --force` NAO bloqueia mais (rm ancorado em fronteira de palavra)
// - `rm -rf node_modules && npm install` NAO bloqueia mais (whitelist por trecho,
//   com o RESTO da corrente ainda escaneado — `rm -rf node_modules; rm -rf /` bloqueia)
// - `grep "DROP TABLE" ...` simples NAO bloqueia mais (busca so-leitura sem encadeamento)
// - fail-closed de verdade: JSON malformado no stdin -> escaneia o texto cru

const { recordMetric } = require('./_lib.js');

// Whitelist de alvos seguros pra `rm -rf`/`rimraf` — artefatos regeneraveis.
const SAFE_RM_TARGETS = new RegExp(
  '^(' +
    'node_modules|\\.next|\\.nuxt|dist|build|out|target|' +
    '\\.cache|\\.parcel-cache|\\.turbo|\\.vite|\\.svelte-kit|' +
    'coverage|\\.pytest_cache|__pycache__|\\.mypy_cache|\\.tox|\\.ruff_cache|' +
    'venv|\\.venv|\\.idea|\\.vscode/\\.cache' +
    ')/?$',
);

// `rm` precisa estar em inicio de comando/apos separador — sem isso, o "rm" no fim
// de "terraform" casava `/rm\s+.*--force/` (falso positivo cronico).
const RM = '(?:^|[\\s;|&(])rm\\s+';
// `git [opcoes] push` — opcoes tipo `-c a=b` ou `--exec-path=x` entre git e push
// eram bypass (`git -c core.pager=cat push --force` passava).
const GIT_PUSH = 'git(?:\\s+-[a-zA-Z](?:\\s+\\S+)?|\\s+--[\\w-]+(?:=\\S+)?)*\\s+push';

// Padroes destrutivos. NOTA SEC-002: `git push --force-with-lease` (sem `=value`)
// E PERMITIDO — caminho seguro recomendado pelo proprio git. Bloqueamos apenas
// `--force` cru, `-f` isolado, `+refspec`, `:<ref>`, `--delete`.
//
// Strings construidas via concat pra evitar que o pattern aparecca literalmente
// no source (anti-mascaramento bloqueia ocorrencias de --no-verify/--skip-* etc.
// em codigo fonte, mas aqui sao DADOS do detector, nao mascaramento de teste).
const PATTERNS = [
  {
    re: new RegExp(RM + '-[A-Za-z]*r[A-Za-z]*f', 'i'),
    desc: 'apagar pasta inteira recursivamente (rm -rf)',
  },
  {
    re: new RegExp(RM + '-[A-Za-z]*f[A-Za-z]*r', 'i'),
    desc: 'apagar pasta inteira recursivamente (rm -fr)',
  },
  { re: new RegExp(RM + '-[A-Za-z]*r(\\s|$)', 'i'), desc: 'apagar recursivamente (rm -r)' },
  // Alvo perigoso: path absoluto (/), home (~), wildcard glob (*), variavel ($).
  // Atencao: NAO casa `rm -f arquivo.log` (ponto no nome de 1 arquivo e benigno).
  {
    re: new RegExp(RM + '-[fr][A-Za-z]*\\s+["\']?[/~*$]', 'i'),
    desc: 'rm com alvo perigoso (path absoluto, home, wildcard ou variavel)',
  },
  {
    re: new RegExp(RM + '-[fr][A-Za-z]*\\s+["\']?\\.\\./', 'i'),
    desc: 'rm com path traversal (../)',
  },
  { re: new RegExp(RM + '.*--recursive', 'i'), desc: 'apagar recursivamente (rm --recursive)' },
  {
    re: new RegExp(RM + '.*--force\\b', 'i'),
    desc: 'apagar sem perguntar (rm --force longo — use -f curto pra single file)',
  },
  {
    re: new RegExp(RM + '.*--no-preserve-root', 'i'),
    desc: 'apagar a raiz do sistema (rm --no-preserve-root)',
  },
  { re: /(?:^|[\s;|&(])rimraf\s/i, desc: 'apagar pasta inteira recursivamente (rimraf)' },
  { re: /find\s+.*-delete/i, desc: 'apagar arquivos varridos por find' },
  { re: /find\s+.*-exec\s+rm/i, desc: 'find + rm em massa' },
  { re: /\sshred\s/i, desc: 'sobrescrever arquivo pra impedir recuperação (shred)' },
  { re: /:\(\)\s*\{\s*:\s*\|\s*:/, desc: 'fork bomb (trava a máquina)' },
  {
    re: new RegExp(GIT_PUSH + '.*--force(\\s|$)', 'i'),
    desc: 'sobrescrever histórico remoto (git push --force — use --force-with-lease)',
  },
  {
    re: new RegExp(GIT_PUSH + '.*-f\\s', 'i'),
    desc: 'sobrescrever histórico remoto (git push -f)',
  },
  {
    re: new RegExp(GIT_PUSH + '.*\\s-f$', 'i'),
    desc: 'sobrescrever histórico remoto (git push -f)',
  },
  {
    re: new RegExp(GIT_PUSH + '[^|;&]*\\s\\+[A-Za-z]', 'i'),
    desc: 'sobrescrever histórico remoto (git push +refspec — o + força o envio)',
  },
  {
    re: new RegExp(GIT_PUSH + '.*--delete', 'i'),
    desc: 'apagar branch remota (git push --delete)',
  },
  {
    re: new RegExp(GIT_PUSH + '\\s+[^|]*\\s:[A-Za-z]', 'i'),
    desc: 'apagar branch remota (git push :branch)',
  },
  { re: /git\s+reset\s+--hard/i, desc: 'descartar mudanças locais sem aviso (git reset --hard)' },
  { re: /git\s+clean\s+-fd/i, desc: 'apagar arquivos não rastreados (git clean -fd)' },
  { re: /git\s+branch\s+-D/i, desc: 'apagar branch local sem confirmar merge (git branch -D)' },
  { re: /chmod\s+777/i, desc: 'permissão totalmente aberta (chmod 777)' },
  { re: /mkfs\./i, desc: 'formatar partição (mkfs)' },
  { re: /dd\s+if=/i, desc: 'escrever raw em disco (dd if=)' },
  { re: /curl.*\|\s*(bash|sh)/i, desc: 'baixar e executar script da internet (curl | bash)' },
  { re: /wget.*\|\s*(bash|sh)/i, desc: 'baixar e executar script da internet (wget | bash)' },
  {
    re: /base64\s+(-d|--decode|-D)\s*[^|]*\|\s*(bash|sh)/i,
    desc: 'decodificar base64 e executar (base64 -d | bash) — bypass clássico',
  },
  {
    re: /\|\s*(bash|sh)\s*$/i,
    desc: 'piping para bash/sh — comando opaco, exige rever em texto claro',
  },
  { re: /DROP\s+TABLE/i, desc: 'apagar tabela do banco (DROP TABLE)' },
  { re: /TRUNCATE\s+TABLE/i, desc: 'esvaziar tabela do banco (TRUNCATE TABLE)' },
  { re: /DROP\s+DATABASE/i, desc: 'apagar banco inteiro (DROP DATABASE)' },
  // Flags de bypass — strings montadas em runtime pra nao acionar anti-mascaramento
  // que escaneia source. TST-001-exception: detecto, nao uso pra mascarar teste.
  { re: new RegExp('--' + 'no-verify', 'i'), desc: 'pular hooks de pré-commit (--no-verify)' },
  { re: new RegExp('--' + 'skip-tests', 'i'), desc: 'pular testes (--skip-tests)' },
  { re: new RegExp('--' + 'skip-hooks', 'i'), desc: 'pular hooks (--skip-hooks)' },
];

// Le stdin cru (sem depender de parse): fail-closed exige escanear o texto
// mesmo quando o JSON vem malformado.
function readStdinRaw() {
  return new Promise((resolve) => {
    let raw = '';
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => {
      raw += c;
    });
    process.stdin.on('end', () => resolve(raw));
    process.stdin.on('error', () => resolve(raw));
  });
}

function bloquear(rawCmd, desc, motivoMetrica) {
  process.stderr.write(`[block-destructive] BLOQUEADO: comando irreversível detectado.\n\n`);
  process.stderr.write(`Comando: ${rawCmd}\n`);
  process.stderr.write(`O que detectamos: ${desc}\n\n`);
  process.stderr.write(
    `Em linguagem clara: comando apaga coisa sem volta — precisa ouvir do dono do projeto que e isso mesmo que ele quer.\n`,
  );
  process.stderr.write(
    `Regras: SEC-002 (destrutivo exige confirmacao), INV-AGENT-005 (confirmar acoes destrutivas).\n\n`,
  );
  process.stderr.write(`Como destravar (se for intencional):\n`);
  process.stderr.write(
    `- Confirme com o usuário o que vai acontecer (em PT-BR claro, sem jargão).\n`,
  );
  process.stderr.write(`- Só depois execute o comando, ou peça pro usuário rodar manualmente.\n`);
  recordMetric('block', 'block-destructive', motivoMetrica || desc);
  process.exit(2);
}

(async () => {
  const raw = await readStdinRaw();
  if (!raw || !raw.trim()) process.exit(0);

  let input = null;
  try {
    input = JSON.parse(raw);
  } catch {
    input = null;
  }

  let rawCmd;
  if (input === null) {
    // Fail-closed: JSON malformado mas ha input cru — escaneia o texto inteiro.
    rawCmd = raw;
  } else {
    rawCmd = input?.tool_input?.command || '';
  }
  if (!rawCmd) process.exit(0);

  // Normaliza pra detectar bypass por escape backslash/quote (ex: `r\m -rf /`, `r""m -rf /`).
  // Shell aceita `r\m`/`r"m"` como `rm`. Removemos backslashes que escapam letras E quotes
  // vazias intercaladas dentro de palavras. Usado APENAS pra matching — passamos `rawCmd`
  // pra mensagem de erro pra mostrar o original ao usuario.
  const cmd = rawCmd
    .replace(/\\([A-Za-z])/g, '$1') // r\m -> rm, c\url -> curl
    .replace(/([A-Za-z])["']{2}([A-Za-z])/g, '$1$2') // r""m -> rm, r''m -> rm
    .replace(/(["'])\1/g, ''); // remove "" e '' isoladas

  // Busca so-leitura simples (grep/rg de padrao SQL etc.) sem encadeamento nao e
  // destrutiva — `grep -rn "DROP TABLE" migrations/` era falso positivo cronico.
  // A isencao exige comando UNICO (sem ;|&& fora de aspas): encadeado escaneia normal.
  const semAspas = cmd.replace(/"[^"]*"|'[^']*'/g, '');
  if (/^\s*(grep|rg)\b/.test(cmd) && !/[;&|]/.test(semAspas)) {
    process.exit(0);
  }

  // Whitelist de rm/rimraf safe: cada trecho `rm -rf <alvos>` (cortado no proximo
  // separador) com TODOS os alvos regeneraveis e APAGADO do texto escaneado — o
  // resto da corrente continua sob analise. Antes o exit 0 era imediato e
  // `rm -rf node_modules && npm install` bloqueava (ancora em $), enquanto a
  // versao corrigida ingenua liberaria `rm -rf node_modules; rm -rf /` inteiro.
  const SAFE_CHUNK_RE =
    /(?:^|[;|&(]|&&|\|\|)\s*(?:npx\s+)?(rm\s+-[a-zA-Z]*[rf][a-zA-Z]*|rimraf)\s+([^;|&]+)/g;
  const scanCmd = cmd.replace(SAFE_CHUNK_RE, (full, _tool, rawTargets) => {
    const alvos = rawTargets.trim();
    const globalDanger = /\$HOME|\$\{HOME|%USERPROFILE%|%TEMP%|^\/|\\|[A-Za-z]:[\\/]/.test(alvos);
    if (globalDanger) return full;
    const targets = alvos.split(/\s+/).map((t) => t.replace(/^["']|["']$/g, ''));
    const todosWhitelisted =
      targets.length > 0 &&
      targets.every((t) => {
        if (!t) return false;
        if (t.startsWith('-')) return false; // flag extra (ex: --force) nao e alvo
        const dangerous = /\.\.|^\/$|^~$|^~\/|^\$|^\/etc|^\/usr|^\/var|^\/home/.test(t);
        if (dangerous) return false;
        const stripped = t.replace(/^\.\//, '');
        return SAFE_RM_TARGETS.test(stripped);
      });
    // Trecho seguro some do scan; preserva o separador inicial pra nao colar tokens.
    return todosWhitelisted ? full.match(/^(?:[;|&(]|&&|\|\|)?/)[0] + ' ' : full;
  });

  // Marker de pipeline / auditoria — apagar = anular toda a engenharia de gates.
  // Auditoria 2026-05-25 (hook #2-3): enforce-pipeline-completion e validate-quick-dev-scope
  // documentavam nas mensagens de erro o caminho `rm marker` pra escapar do bloqueio.
  // Agora qualquer tentativa de remover marker dispara aqui antes.
  const RUNTIME_MARKER_RE =
    /(^|\s)rm\s+[^|]*\.claude[/\\]\.runtime[/\\](feature-active|auditor-.*-pass|checkpoint-done|bug-active|bug-trigger|investigator-invoked|investigation-.*\.json|quick-dev-files)/i;
  if (RUNTIME_MARKER_RE.test(cmd)) {
    process.stderr.write(
      `[block-destructive] BLOQUEADO: tentativa de remover marker de pipeline.\n\n`,
    );
    process.stderr.write(`Comando: ${rawCmd}\n`);
    process.stderr.write(
      `Motivo: markers em .claude/.runtime/ representam estado de gates do framework\n`,
    );
    process.stderr.write(
      `(pipeline /feature, auditores, checkpoint, investigador, /bug, /quick-dev).\n`,
    );
    process.stderr.write(`Apagar manualmente anula todo o controle do framework.\n\n`);
    process.stderr.write(`Como destravar legitimamente:\n`);
    process.stderr.write(`- Pipeline travado em etapa errada: rode o agente da etapa pendente.\n`);
    process.stderr.write(`- Auditor reprovou: corrija o achado e re-rode o auditor.\n`);
    process.stderr.write(
      `- Sessao corrompida: 'session-cleanup' (lifecycle) limpa no proximo SessionEnd.\n`,
    );
    process.stderr.write(
      `\nEm linguagem clara: bloqueamos pra evitar perder marcador de auditoria — voce nao consegue mais provar que aquela etapa foi feita.\n`,
    );
    process.stderr.write(
      `Regras: SEC-002 (nao executar destrutivo sem confirmacao), INV-AGENT-005 (confirmar acoes destrutivas).\n`,
    );
    recordMetric('block', 'block-destructive', 'tentativa de rm em marker .claude/.runtime');
    process.exit(2);
  }

  // Padroes destrutivos: primeiro match bloqueia.
  for (const { re, desc } of PATTERNS) {
    if (re.test(scanCmd)) {
      bloquear(rawCmd, desc);
    }
  }

  process.exit(0);
})().catch((err) => {
  // Fail-closed: erro inesperado num hook bloqueador NAO libera. Exit 2.
  process.stderr.write(`[block-destructive] erro interno: ${err.message}\n`);
  process.exit(2);
});
