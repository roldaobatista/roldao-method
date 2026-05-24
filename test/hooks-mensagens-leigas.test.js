#!/usr/bin/env node
/**
 * test/hooks-mensagens-leigas.test.js — verifica que mensagens de erro
 * reescritas em T-006/T-007/T-008 (G7/G1/G2) usam linguagem acessivel
 * ao usuario nao-programador e nao reintroduzem jargao tecnico.
 *
 * Decomposicao: PRD-003 → US-111 → T-006/T-007/T-008.
 */

process.env.ROLDAO_SKIP_METRICS = '1';

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

let pass = 0;
let fail = 0;
function check(label, cond, detalhe) {
  if (cond) { pass++; console.log(`  OK   ${label}`); }
  else      { fail++; console.log(`  FAIL ${label}${detalhe ? ` — ${detalhe}` : ''}`); }
}

function runHook(hookName, input) {
  const hookPath = path.join(ROOT, 'templates', '.claude', 'hooks', `${hookName}.js`);
  const r = spawnSync('node', [hookPath], { input: String(input), stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000 });
  return { exit: r.status, stderr: (r.stderr || '').toString() };
}

console.log('\nhooks-mensagens-leigas: linguagem acessivel (T-006 + T-007 + T-008)\n');

// ============================================================================
// T-006 (G7) — helper hookPrefix carregado e funcional
// ============================================================================
{
  const lib = require(path.join(ROOT, 'templates', '.claude', 'hooks', '_lib.js'));
  check('T-006.1: hookPrefix exportado', typeof lib.hookPrefix === 'function');
  check('T-006.2: nivel block default → [BLOQUEIO]', lib.hookPrefix('block', 'x') === '[BLOQUEIO] [x]');
  check('T-006.3: nivel warn → [AVISO]', lib.hookPrefix('warn', 'x') === '[AVISO] [x]');
  check('T-006.4: nivel info → [INFO]', lib.hookPrefix('info', 'x') === '[INFO] [x]');
  check('T-006.5: nivel desconhecido cai pra BLOQUEIO', lib.hookPrefix('???', 'x') === '[BLOQUEIO] [x]');
  check('T-006.6: nome ausente cai pra hook', lib.hookPrefix('block') === '[BLOQUEIO] [hook]');
}

// ============================================================================
// T-007 (G1) — paths-frontmatter-validator usa "cabecalho de identificacao"
// ============================================================================
{
  const input = JSON.stringify({
    tool_input: {
      file_path: '/tmp/docs/teste.md',
      content: '# Sem cabecalho\n\nConteudo qualquer.',
    },
  });
  const r = runHook('paths-frontmatter-validator', input);
  check('T-007.1: sem cabecalho → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('T-007.2: stderr usa "cabecalho de identificacao"', /cabecalho de identificacao/.test(r.stderr),
    `stderr nao usa "cabecalho": ${r.stderr.slice(0, 200)}`);
  // Filtra linha que contem nome do hook (paths-frontmatter-validator) — esse e fixo.
  const stderrSemNomeHook = r.stderr.split('\n').filter(l => !l.includes('paths-frontmatter-validator')).join('\n');
  check('T-007.3: texto principal nao usa "frontmatter" (excluindo nome do hook)',
    !/frontmatter/i.test(stderrSemNomeHook),
    `stderr ainda usa "frontmatter": ${stderrSemNomeHook.match(/.*frontmatter.*/i)?.[0] || ''}`);
  check('T-007.4: stderr usa "Efeito" + "Causa" + "Proximo passo"',
    /Efeito:/.test(r.stderr) && /Causa:/.test(r.stderr) && /Proximo passo/.test(r.stderr),
    'falta estrutura EFEITO/CAUSA/PROXIMO');
  check('T-007.5: stderr usa prefixo [BLOQUEIO]', /\[BLOQUEIO\]/.test(r.stderr), `stderr: ${r.stderr.slice(0, 100)}`);
}

// ============================================================================
// T-007 (G1) — cabecalho presente com campos obrigatorios → pass
// ============================================================================
{
  const input = JSON.stringify({
    tool_input: {
      file_path: '/tmp/docs/x.md',
      content: '---\nowner: roldao\nrevisado-em: 2026-05-24\nstatus: draft\n---\n\n# Doc',
    },
  });
  const r = runHook('paths-frontmatter-validator', input);
  check('T-007.6: cabecalho completo → exit 0', r.exit === 0, `exit=${r.exit}, stderr=${r.stderr.slice(0, 100)}`);
}

// ============================================================================
// T-007 — campo faltando emite mensagem em PT-BR
// ============================================================================
{
  const input = JSON.stringify({
    tool_input: {
      file_path: '/tmp/docs/y.md',
      content: '---\nowner: roldao\nstatus: draft\n---\n\n# Doc',
    },
  });
  const r = runHook('paths-frontmatter-validator', input);
  check('T-007.7: faltando revisado-em → exit 2', r.exit === 2, `exit=${r.exit}`);
  check('T-007.8: stderr menciona campo faltando + dica de adicao',
    /revisado-em/.test(r.stderr) && /Adicione/.test(r.stderr),
    `stderr: ${r.stderr.slice(0, 200)}`);
}

// ============================================================================
// T-008 (G2) — no-amend-after-push: se git ausente, mensagem leiga
// Como nao da pra simular git ausente facilmente, validamos via stderr
// quando comando passa pelo check. Cenario sintetico:
// ============================================================================
{
  // Pedimos um amend com git ausente seria ideal, mas o git esta presente
  // no nosso ambiente — testamos via leitura do source que nao usa
  // jargao no caminho de erro.
  const fs = require('fs');
  const src = fs.readFileSync(path.join(ROOT, 'templates/.claude/hooks/no-amend-after-push.js'), 'utf8');
  check('T-008.1: stderr usa "programa Git instalado" em vez de "git no PATH"',
    /programa Git instalado/.test(src),
    'fonte ainda nao usa "programa Git instalado"');
  check('T-008.2: stderr usa "Efeito" + "Causa" + "Proximo passo"',
    /Efeito:/.test(src) && /Causa:/.test(src) && /Proximo passo/.test(src),
    'fonte sem estrutura EFEITO/CAUSA/PROXIMO');
  // Verifica so as strings que vao pra stderr (process.stderr.write(`...`))
  const stderrStrings = src.match(/process\.stderr\.write\(`([^`]+)`\)/g) || [];
  const stderrTexto = stderrStrings.join('\n');
  check('T-008.3: stderr NAO usa palavra "PATH" cru no caminho de erro',
    !/PATH/.test(stderrTexto),
    `stderr ainda usa "PATH": ${stderrTexto.match(/.*PATH.*/)?.[0] || ''}`);
  check('T-008.4: stderr usa "alteracao" em vez de "amend"',
    /reescrever a ultima gravacao/.test(src) || /reescrever historico/.test(src),
    'fonte sem traducao de "amend"');
  check('T-008.5: stderr usa "enviar ao servidor" em vez de "push"',
    /enviado ao servidor/.test(src) || /enviar ao servidor/.test(src),
    'fonte sem traducao de "push"');
  check('T-008.6: stderr usa prefixo [BLOQUEIO]', /\[BLOQUEIO\]/.test(src), 'fonte sem [BLOQUEIO]');
}

console.log(`\nResultado: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
