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
// validar-pis-pasep foi promovida pro core na v1.1.0 (era do addon esocial-completo).
// Apontar pra templates/.claude/skills/ — o teste vinha falhando no CI porque o
// path antigo nao existe mais.
const PIS = path.join(ROOT, 'templates', '.claude', 'skills', 'validar-pis-pasep');

function pythonBin() {
  // python3/python: Unix + Windows Store/python.org.
  // py: Windows Python Launcher (vem com installer oficial Python no Windows;
  //     resolve a versão preferida automaticamente).
  for (const bin of ['python3', 'python', 'py']) {
    try { execFileSync(bin, ['--version'], { stdio: 'pipe' }); return bin; } catch { /* tenta próximo */ }
  }
  return null;
}

const PY = pythonBin();
if (!PY) {
  console.log('SKIP skills Python: interpretador não encontrado (python3/python/py).');
  console.log('  Instale Python 3.8+ em https://python.org (Windows) ou via gestor da distro (Linux/Mac).');
  console.log('  CI tem job dedicado (validar-skills-python); este skip é só do dev local.');
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
const ie = path.join(S, 'validar-ie', 'scripts', 'validar-ie.py');
const boleto = path.join(S, 'validar-boleto', 'scripts', 'validar-boleto.py');
const brCode = path.join(S, 'gerar-br-code', 'scripts', 'gerar-br-code.py');
const chaveNfe = path.join(S, 'validar-chave-acesso-nfe', 'scripts', 'validar.py');
const pisS = path.join(PIS, 'scripts', 'validar-pis.py');
const munIbge = path.join(S, 'validar-codigo-municipio-ibge', 'scripts', 'validar-codigo-municipio-ibge.py');

// IE precisa de 2 argumentos. Wrapper local pra reusar `run` que assume arg unico.
function runIE(label, uf, valor, expectOk) {
  let ok = true;
  try { execFileSync(PY, [ie, uf, valor], { stdio: 'pipe' }); } catch { ok = false; }
  if (ok === expectOk) { pass++; console.log(`  OK   ${label}`); }
  else { fail++; console.log(`  FAIL ${label} (esperado ${expectOk ? 'valido' : 'invalido'})`); }
}

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

// validar-ie (3 skills BR novas v0.15.2)
runIE('IE SP ISENTO aceito', 'SP', 'ISENTO', true);
runIE('IE SP 12 digitos com DV invalido rejeitado', 'SP', '110042490100', false);
runIE('IE RJ DV invalido rejeitado', 'RJ', '99999999', false);
runIE('IE UF invalida', 'ZZ', '12345', false);
// Auditoria 10-agentes 2026-05-24: UF sem algoritmo retorna valido:false (antes era true,
// confundia operador SEFAZ). Skill avisa pra validar com Sintegra/SEFAZ.
runIE('IE de UF sem algoritmo dedicado (CE) — nao confirma DV, exige Sintegra', 'CE', '12345678', false);

// validar-boleto: linha digitavel real de teste (44 digitos numerico)
// O codigo gera DV correto na hora do calculo; usamos uma string que sabemos invalida
run('boleto tamanho invalido (33 digitos)', boleto, '123456789012345678901234567890123', false);
run('boleto vazio invalido', boleto, '', false);

// validar-chave-acesso-nfe (44 digitos, modulo 11)
// Geramos uma chave valida calculando o DV programaticamente. Resto sao casos invalidos.
function calcDvChave(chave43) {
  const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
  let soma = 0;
  const reversed = chave43.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    soma += parseInt(reversed[i], 10) * pesos[i % 8];
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}
const chave43Sp = '3524061122233300018155001000000000111234567'; // UF35 + AAMM2406 + CNPJ + 55 + 001 + 9 + 1 + cNF
const dvSp = calcDvChave(chave43Sp);
const chaveValidaSp = chave43Sp + dvSp;
run('chave NF-e SP valida (DV calculado)', chaveNfe, chaveValidaSp, true);
run('chave NF-e tamanho invalido (43 digitos)', chaveNfe, chave43Sp, false);
run('chave NF-e UF invalida (99)', chaveNfe, '9924061122233300018155001000000000111234567' + dvSp, false);
run('chave NF-e modelo desconhecido (99)', chaveNfe, '3524061122233300018199001000000000111234567' + dvSp, false);
run('chave NF-e DV errado (forca 0)', chaveNfe, chave43Sp + ((dvSp + 1) % 10), false);
run('chave NF-e CNPJ zerado', chaveNfe, '35240600000000000000550010000000001112345670', false);

// validar-cns-cartao-sus (addon healthtech-br): 15 digitos com modulo 11.
// CNS definitivo: comeca com 1/2 + PIS de 11 digitos + sufixo + DV.
// CNS provisorio: comeca com 7/8/9 + soma ponderada total multiplo de 11.
const cnsSus = path.join(ROOT, 'addons', 'healthtech-br', '.claude', 'skills', 'validar-cns-cartao-sus', 'scripts', 'validar-cns.py');
run('CNS definitivo valido (100000000000007)', cnsSus, '100000000000007', true);
run('CNS provisorio valido (800000000000001)', cnsSus, '800000000000001', true);
run('CNS provisorio valido com 7 (700000000000005)', cnsSus, '700000000000005', true);
run('CNS com mascara aceita (100 0000 0000 0007)', cnsSus, '100 0000 0000 0007', true);
run('CNS DV errado rejeitado (100000000000000)', cnsSus, '100000000000000', false);
run('CNS tamanho invalido (14 digitos)', cnsSus, '10000000000000', false);
run('CNS comeca com 3 (rejeita primeiro digito invalido)', cnsSus, '300000000000000', false);
run('CNS provisorio com DV errado', cnsSus, '800000000000000', false);

// validar-codigo-municipio-ibge: 7 digitos = UF + sequencial + DV modulo 10
run('codigo IBGE Sao Paulo (3550308)', munIbge, '3550308', true);
run('codigo IBGE Rio (3304557)', munIbge, '3304557', true);
run('codigo IBGE Brasilia (5300108)', munIbge, '5300108', true);
run('codigo IBGE Manaus (1302603)', munIbge, '1302603', true);
run('codigo IBGE UF invalida (99)', munIbge, '9999999', false);
run('codigo IBGE DV errado', munIbge, '3550300', false);
run('codigo IBGE tamanho invalido (6 digitos)', munIbge, '355030', false);
run('codigo IBGE tamanho invalido (8 digitos)', munIbge, '35503080', false);

// gerar-br-code: smoke (gera output sem crash) + verificacao do CRC em JS.
// Auditoria 10-agentes 2026-05-24: antes so checava prefixo + presenca de
// 6304XXXX. Agora recalcula CRC16-CCITT em JS e confirma que bate com o do
// script Python — bug silencioso em algum TLV ou offset do CRC quebraria
// o QR sem o teste pegar.
function crc16Ccitt(payload) {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}
try {
  const emv = execFileSync(PY, [brCode, 'estatico', '--chave', 'teste@exemplo.com.br', '--nome', 'TESTE', '--cidade', 'SAO PAULO'], { encoding: 'utf8' }).trim();
  // Prefixo EMV pra Pix estatico: tag 00 (Payload Format = 01) + tag 01
  // (POI Method = 11 estatico / 12 dinamico) + tag 26 (Merchant Account
  // Info — comeca com sub-tag 00 "br.gov.bcb.pix").
  if (emv.startsWith('00020101021126') && emv.length > 40 && /6304[0-9A-F]{4}$/.test(emv)) {
    pass++; console.log('  OK   gerar-br-code estatico gera EMV valido (prefixo + CRC presente)');
  } else {
    fail++; console.log(`  FAIL gerar-br-code formato inesperado: ${emv}`);
  }
  // CRC do EMV gerado: pega tudo MENOS os 4 ultimos chars + recalcula
  const payloadComTagCrc = emv.slice(0, -4);
  const crcEmv = emv.slice(-4);
  const crcEsperado = crc16Ccitt(payloadComTagCrc);
  if (crcEmv === crcEsperado) {
    pass++; console.log(`  OK   gerar-br-code CRC16-CCITT bate (${crcEmv}) — implementacao Python validada contra recalculo JS independente`);
  } else {
    fail++; console.log(`  FAIL gerar-br-code CRC divergente: script=${crcEmv} JS=${crcEsperado}`);
  }
  // Decodifica os principais TLV pra confirmar estrutura
  const temPayloadFormat = emv.includes('000201');         // Tag 00 = "01"
  const temPoiEstatico   = emv.includes('010211');         // Tag 01 = "11" (estatico)
  const temMerchantPix   = emv.includes('0014br.gov.bcb.pix');  // sub-tag 00 do Tag 26
  const temCurrency      = emv.includes('5303986');        // Tag 53 = "986" (BRL)
  const temCountry       = emv.includes('5802BR');         // Tag 58 = "BR"
  const todosOk = temPayloadFormat && temPoiEstatico && temMerchantPix && temCurrency && temCountry;
  if (todosOk) {
    pass++; console.log('  OK   gerar-br-code estrutura TLV (00,01,26,53,58) presente');
  } else {
    fail++; console.log(`  FAIL gerar-br-code TLV faltando: pf=${temPayloadFormat} poi=${temPoiEstatico} pix=${temMerchantPix} curr=${temCurrency} br=${temCountry}`);
  }
} catch (err) {
  fail++; console.log(`  FAIL gerar-br-code crashou: ${err.message}`);
}

// CNH (11 dígitos, mod 11 com dsc — algoritmo Detran).
// CNH válida calculada manualmente: base "123456789" + DV "00".
const cnh = path.join(S, 'validar-cnh', 'scripts', 'validar.py');
run('CNH valida (12345678900)', cnh, '12345678900', true);
run('CNH tamanho invalido (10 digitos)', cnh, '1234567890', false);
run('CNH sequencia repetida', cnh, '11111111111', false);
run('CNH DV errado', cnh, '12345678901', false);

// RENAVAM (11 dígitos, mod 11). Base "1234567890" → DV "0".
const renavam = path.join(S, 'validar-renavam', 'scripts', 'validar.py');
run('RENAVAM valido (12345678900)', renavam, '12345678900', true);
run('RENAVAM sequencia repetida', renavam, '00000000000', false);
run('RENAVAM tamanho invalido (8 digitos)', renavam, '12345678', false);
run('RENAVAM DV errado', renavam, '12345678901', false);

// Titulo eleitor (12 digitos, mod 11, UF 01-28).
// Base seq="12345678", uf="01" (SP) → dv1=9, dv2=1 → "123456780191".
const titulo = path.join(S, 'validar-titulo-eleitor', 'scripts', 'validar.py');
run('Titulo eleitor valido SP (123456780191)', titulo, '123456780191', true);
run('Titulo eleitor UF invalida (29)', titulo, '123456782991', false);
run('Titulo eleitor tamanho invalido (9 digitos)', titulo, '123456789', false);
run('Titulo eleitor DV errado', titulo, '123456780100', false);

// Conta bancaria — formato + DV quando o banco tem algoritmo conhecido.
// BB (001) com mod11_98_to_2: base "1234567" → DV "9".
const conta = path.join(S, 'validar-conta-bancaria', 'scripts', 'validar.py');
function runConta(label, banco, ag, c, expectOk) {
  let ok = true;
  try { execFileSync(PY, [conta, banco, ag, c], { stdio: 'pipe' }); } catch { ok = false; }
  if (ok === expectOk) { pass++; console.log(`  OK   ${label}`); }
  else { fail++; console.log(`  FAIL ${label} (esperado ${expectOk ? 'valido' : 'invalido'})`); }
}
runConta('Conta BB DV correto (mod11_98_to_2)', '001', '1234', '12345679', true);
runConta('Conta BB DV errado', '001', '1234', '12345670', false);
runConta('Conta Nubank sem DV (so formato)', '260', '0001', '12345678', true);
runConta('Conta Nubank conta curta demais', '260', '0001', '12', false);
runConta('Conta banco desconhecido (so formato)', '999', '1234', '12345678', true);

// mascarar-dado-pessoal — funcoes que NAO mudam na Onda 6 (cpf, cnpj, rg, ie,
// cnh, renavam, titulo, cartao, uuid, pix-cpf). Email/telefone ficam pra Onda 6
// junto com a correcao do vazamento.
const mascarar = path.join(S, 'mascarar-dado-pessoal', 'scripts', 'mascarar.py');
function runMascarar(label, tipo, valor, esperado) {
  let out;
  try {
    out = execFileSync(PY, [mascarar, tipo, valor], { encoding: 'utf8' }).trim();
  } catch (err) {
    fail++; console.log(`  FAIL ${label} (crashou: ${err.message})`); return;
  }
  if (out === esperado) { pass++; console.log(`  OK   ${label}`); }
  else { fail++; console.log(`  FAIL ${label} (esperado "${esperado}", recebido "${out}")`); }
}
runMascarar('mascarar CPF preserva so DV', 'cpf', '123.456.789-09', '***.***.***-09');
runMascarar('mascarar CPF invalido vira asterisco', 'cpf', '123', '***.***.***-**');
runMascarar('mascarar CNPJ preserva ordem+DV', 'cnpj', '11.222.333/0001-81', '**.***.***/0001-81');
runMascarar('mascarar CNPJ alfanumerico FISCAL-005', 'cnpj', '12ABC34501DE35', '**.***.***/01DE-35');
runMascarar('mascarar RG preserva ultimos 2', 'rg', '12.345.678-9', '**.***.***8-9');
runMascarar('mascarar IE preserva ultimos 3', 'ie', '110042490114', '*********114');
runMascarar('mascarar CNH preserva 2 ultimos', 'cnh', '12345678900', '*********00');
runMascarar('mascarar RENAVAM preserva 2 ultimos', 'renavam', '12345678900', '*********00');
runMascarar('mascarar titulo eleitor preserva 2 ultimos', 'titulo', '123456780191', '**** **** **91');
runMascarar('mascarar cartao preserva 4 ultimos', 'cartao', '5555555555554444', '**** **** **** 4444');
runMascarar('mascarar UUID preserva inicio+fim', 'uuid', '123e4567-e89b-42d3-a456-426614174000', '123e4567-****-****-****-****14174000');
runMascarar('mascarar pix-CPF 11 digitos sem mascara', 'pix', '12345678909', '***.***.***-09');
// Onda 6 — mascaramento de email e telefone mais agressivo (B3).
runMascarar('mascarar email mascara dominio tambem (B3)', 'email', 'joao.silva@exemplo.com', 'j**@e**.com');
runMascarar('mascarar email com .com.br (B3)', 'email', 'fulano@empresa.com.br', 'f**@e**.br');
runMascarar('mascarar email sem ponto no dominio (fallback)', 'email', 'teste@localhost', 't**@***');
runMascarar('mascarar telefone E.164 preserva so 4 ultimos (B3)', 'telefone', '+5511987654321', '+*********4321');
runMascarar('mascarar telefone sem prefixo preserva so 4 ultimos', 'telefone', '11987654321', '*******4321');
// Bug Onda 6 — pix com CPF/CNPJ com pontuacao (len > 13) cai na rama de telefone
// por causa da heuristica "s[0].isdigit() and len(s) > 13". Idem UUID que comeca
// com digito. Esses casos vao ser cobertos quando a Onda 6 reescrever a heuristica
// (contar so digitos, ou validar formato antes de classificar).

// Regressão cruzada: cada PIS gerado por gerar-test-fixture-br DEVE passar
// no validador-pis-pasep oficial — desalinhamento de algoritmo entre gerador
// e validador deixa fixture com PIS que viola TST-004 silenciosamente.
const fixtureGen = path.join(S, 'gerar-test-fixture-br', 'scripts', 'gerar.py');
try {
  const out = execFileSync(PY, [fixtureGen, 'pis', '5'], { encoding: 'utf8' });
  const pisList = out.trim().split(/\r?\n/);
  for (const p of pisList) {
    run(`PIS sintetico de gerar-test-fixture-br aceito pelo validador (${p})`, pisS, p, true);
  }
} catch (err) {
  fail++; console.log(`  FAIL geracao de PIS: ${err.message}`);
}

console.log(`\nskills Python: ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
