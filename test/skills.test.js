#!/usr/bin/env node
/**
 * test/skills.test.js — smoke das skills Python core (CPF/CNPJ, Pix, CEP, PIS).
 * Exercita a LÓGICA BR (o diferencial do produto) no `npm test`, não só no CI.
 * Se Python não estiver disponível, faz SKIP claro (não falha — CI tem job dedicado).
 */
const { execFileSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const S = path.join(ROOT, 'templates', '.claude', 'skills');
const PIS = path.join(ROOT, 'addons', 'esocial-completo', '.claude', 'skills', 'validar-pis-pasep');

function pythonBin() {
  for (const bin of ['python3', 'python']) {
    try { execFileSync(bin, ['--version'], { stdio: 'pipe' }); return bin; } catch { /* tenta próximo */ }
  }
  return null;
}

const PY = pythonBin();
if (!PY) {
  console.log('SKIP skills Python: interpretador não encontrado (python3/python). CI tem job dedicado.');
  process.exit(0);
}

let pass = 0;
let fail = 0;
// expectOk=true: deve sair 0 (válido). expectOk=false: deve sair !=0 (inválido).
function run(label, script, arg, expectOk) {
  let ok = true;
  try {
    execFileSync(PY, [script, arg], { stdio: 'pipe' });
  } catch {
    ok = false;
  }
  if (ok === expectOk) { pass++; console.log(`  OK   ${label}`); }
  else { fail++; console.log(`  FAIL ${label} (esperado ${expectOk ? 'válido' : 'inválido'})`); }
}

const cpfCnpj = path.join(S, 'validar-cpf-cnpj', 'scripts', 'validar.py');
const pix = path.join(S, 'validar-pix', 'scripts', 'validar-pix.py');
const cep = path.join(S, 'validar-cep', 'scripts', 'validar-cep.py');
const pisS = path.join(PIS, 'scripts', 'validar-pis.py');

run('CPF válido', cpfCnpj, '111.444.777-35', true);
run('CPF inválido (DV errado)', cpfCnpj, '111.444.777-00', false);
run('CPF sequência repetida', cpfCnpj, '111.111.111-11', false);
run('CNPJ válido', cpfCnpj, '11.222.333/0001-81', true);
run('CNPJ alfanumérico oficial RFB', cpfCnpj, '12.ABC.345/01DE-35', true);
run('CNPJ base repetida (regressão round 7)', cpfCnpj, '11.111.111/1111-80', false);
run('Pix chave aleatória UUID v4', pix, '123e4567-e89b-42d3-a456-426614174000', true);
run('Pix UUID v1 rejeitado', pix, '123e4567-e89b-12d3-a456-426614174000', false);
run('CEP válido', cep, '01310-100', true);
run('PIS válido', pisS, '17033259504', true);
run('PIS inválido (mito 12068306449)', pisS, '12068306449', false);

console.log(`\nskills Python: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
