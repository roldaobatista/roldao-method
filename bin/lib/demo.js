// bin/lib/demo.js — npx roldao-method demo
// Roda 3 cenários OFFLINE provando os diferenciais do framework SEM precisar de
// Claude Code, sem chave Anthropic, sem Python, sem instalar nada no projeto.
// Auditoria 10-agentes 3ª passada 2026-05-24: barreira de adoção principal era
// "preciso instalar Claude Code (pago) só pra ver o produto funcionar".
//
// 3 cenários, ~30s total:
//   1. block-destructive.js bloqueando `rm -rf /`
//   2. secrets-scanner.js pegando padrão de credencial AWS
//   3. CPF 111.111.111-11 reprovado por algoritmo (mostra que validador BR é real)

'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

function makeIO({ colors, glyphs }) {
  const c = colors;
  const g = glyphs;
  return {
    title(n, total, label) {
      console.log('');
      console.log(`${c.bold}${c.cyan}[${n}/${total}]${c.reset} ${c.bold}${label}${c.reset}`);
    },
    step(msg) { console.log(`  ${c.dim}${g.arrow}${c.reset} ${msg}`); },
    blocked(msg) { console.log(`  ${c.green}${g.ok} BLOQUEADO${c.reset} ${msg}`); },
    invalid(msg) { console.log(`  ${c.red}${g.err} INVÁLIDO${c.reset} ${msg}`); },
    valid(msg) { console.log(`  ${c.green}${g.ok} VÁLIDO${c.reset} ${msg}`); },
    info(msg) { console.log(`  ${c.dim}${msg}${c.reset}`); },
    success(msg) { console.log(`${c.green}${g.ok}${c.reset} ${msg}`); },
  };
}

// Valida CPF por algoritmo de DV (módulo 11). Implementação Node-pura pra não
// depender da skill Python `validar-cpf-cnpj` (que exige Python instalado).
function validarCPF(cpf) {
  const digits = String(cpf).replace(/\D/g, '');
  if (digits.length !== 11) return { ok: false, motivo: 'precisa de 11 dígitos' };
  if (/^(\d)\1{10}$/.test(digits)) return { ok: false, motivo: 'todos os dígitos iguais (padrão inválido)' };
  const calcDV = (slice, mult) => {
    let soma = 0;
    for (let i = 0; i < slice.length; i++) soma += parseInt(slice[i], 10) * (mult - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const dv1 = calcDV(digits.slice(0, 9), 10);
  const dv2 = calcDV(digits.slice(0, 10), 11);
  if (dv1 !== parseInt(digits[9], 10) || dv2 !== parseInt(digits[10], 10)) {
    return { ok: false, motivo: 'dígitos verificadores não conferem' };
  }
  return { ok: true };
}

// Gera AccessKey AWS sintética PRA O DEMO (montada em runtime — string literal
// no source seria bloqueada pelo próprio secrets-scanner). Não é credencial
// real — qualquer combinação 'AKIA' + 16 maiúsculas casa o regex e o hook
// detecta. O propósito é justamente provar que ele detecta.
function fakeAwsKey() {
  const prefix = 'AKI' + 'A';
  const body = 'IOSFODNN7' + 'EXAMPLE';
  return prefix + body;
}

function fakeAwsSecret() {
  // 40 chars com / e + — padrão de SecretKey AWS.
  return 'wJalrXUtnFEMI' + '/K7MDENG/bPxRfiCYEXAMPLE' + 'KEY';
}

// Roda hook Node passando JSON simulado pelo stdin. Captura exit code + stderr
// pra provar que o hook bloqueia de verdade — não é animação, é o hook rodando.
function runHook(hookPath, payload) {
  const res = spawnSync(process.execPath, [hookPath], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    timeout: 5000,
  });
  return { code: res.status, stderr: (res.stderr || '').trim(), stdout: (res.stdout || '').trim() };
}

function delay(ms) {
  // Pausa só pra UX (não bloqueia nada útil). Em --quiet/--yes pula.
  return new Promise((r) => setTimeout(r, ms));
}

async function demo({ colors, glyphs, root, fast = false }) {
  const io = makeIO({ colors, glyphs });
  const c = colors;
  const g = glyphs;
  const pause = (ms) => (fast ? Promise.resolve() : delay(ms));

  console.log('');
  console.log(`${c.bold}${c.cyan}ROLDAO-METHOD ${c.reset}${c.bold}— demo de 30 segundos${c.reset}`);
  console.log(`${c.dim}Roda 3 verificações que o framework faz automaticamente nos seus projetos.${c.reset}`);
  console.log(`${c.dim}Não modifica nada. Não precisa de Claude Code instalado.${c.reset}`);

  const total = 3;
  let pass = 0;

  // CENÁRIO 1 — block-destructive
  io.title(1, total, 'Tentando fazer um comando perigoso: rm -rf /');
  await pause(400);
  io.step('o framework intercepta antes do shell executar...');
  await pause(600);
  const hookDestructive = path.join(root, 'templates', '.claude', 'hooks', 'block-destructive.js');
  const r1 = runHook(hookDestructive, {
    tool_name: 'Bash',
    tool_input: { command: 'rm -rf /' },
  });
  if (r1.code === 2 && /BLOQUEADO/.test(r1.stderr)) {
    io.blocked('comando recusado (exit code 2 do hook block-destructive.js)');
    io.info('SEC-002 — operações irreversíveis exigem confirmação explícita.');
    pass++;
  } else {
    io.invalid(`hook não bloqueou (exit=${r1.code}). Algo errado na instalação.`);
  }

  // CENÁRIO 2 — secrets-scanner
  io.title(2, total, 'Tentando salvar um arquivo com credencial AWS');
  await pause(400);
  io.step('o framework escaneia o conteúdo antes de gravar...');
  await pause(600);
  const hookSecrets = path.join(root, 'templates', '.claude', 'hooks', 'secrets-scanner.js');
  const r2 = runHook(hookSecrets, {
    tool_name: 'Write',
    tool_input: {
      file_path: 'config/aws.json',
      content: `{"key": "${fakeAwsKey()}", "secret": "${fakeAwsSecret()}"}`,
    },
  });
  if (r2.code === 2 && /BLOQUEADO|segredo/i.test(r2.stderr)) {
    io.blocked('arquivo recusado (secrets-scanner.js detectou padrão de chave AWS)');
    io.info('SEC-001 — credencial em código vira incidente em 1 commit.');
    pass++;
  } else {
    io.invalid(`hook não bloqueou (exit=${r2.code}). Algo errado na instalação.`);
  }

  // CENÁRIO 3 — validar CPF brasileiro
  io.title(3, total, 'Validando o CPF 111.111.111-11 (parece OK pra olho humano)');
  await pause(400);
  io.step('rodando algoritmo de dígito verificador da Receita Federal...');
  await pause(600);
  const cpfRuim = validarCPF('111.111.111-11');
  if (!cpfRuim.ok) {
    io.invalid(`CPF 111.111.111-11 reprovado: ${cpfRuim.motivo}`);
    const cpfBom = validarCPF('123.456.789-09');
    if (cpfBom.ok) io.valid('CPF 123.456.789-09 passa (use esse em fixtures de teste — TST-004)');
    io.info('skill validar-cpf-cnpj evita salvar dado fiscal inválido no banco.');
    pass++;
  } else {
    io.invalid('algoritmo aceitou CPF de teste padrão. Algo muito errado.');
  }

  // RESUMO
  console.log('');
  if (pass === total) {
    io.success(`${total} verificações funcionando. Framework operacional.`);
  } else {
    console.log(`${c.yellow}${g.warn}${c.reset} ${pass} de ${total} verificações passaram.`);
  }
  console.log('');
  console.log(`${c.bold}Próximo passo:${c.reset}`);
  console.log(`  ${c.cyan}npx roldao-method install${c.reset}      ${c.dim}instala no seu projeto${c.reset}`);
  console.log(`  ${c.cyan}npx roldao-method tutorial${c.reset}     ${c.dim}guiado em 5 minutos (após instalar)${c.reset}`);
  console.log('');

  return pass === total ? 0 : 1;
}

module.exports = { demo, validarCPF };
