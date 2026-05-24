// bin/lib/tutorial.js — npx roldao-method tutorial
// Wizard pós-install em PT-BR claro que preenche AGENTS.md §1 (Identidade)
// por 5 perguntas guiadas. Substitui o "preencha 14 campos _(preencher)_ em
// markdown" do install padrão — barreira #1 do leigo (auditoria 10-agentes 3ª passada).
//
// Idempotente: detecta campos já preenchidos e pula. Backup .bak antes de gravar.

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');

function makeAsk(rl) {
  return (q, fallback = '') => new Promise((resolve) => {
    rl.question(q, (a) => {
      const trimmed = (a || '').trim();
      resolve(trimmed || fallback);
    });
  });
}

function isPlaceholder(value) {
  // Considera vazio qualquer campo que ainda tenha o marcador _(preencher)_
  // ou que esteja literalmente em branco.
  if (!value) return true;
  return /\(preencher[^)]*\)/i.test(value);
}

function readField(content, fieldName) {
  // Match linha "- **Nome:** valor" — devolve só o valor (ou '' se não casar).
  const re = new RegExp(`-\\s*\\*\\*${fieldName}:\\*\\*\\s*(.+)`, 'i');
  const m = content.match(re);
  return m ? m[1].trim() : '';
}

function setField(content, fieldName, value) {
  const re = new RegExp(`(-\\s*\\*\\*${fieldName}:\\*\\*\\s*).+`, 'i');
  return content.replace(re, `$1${value}`);
}

async function tutorial({ cwd, colors, glyphs, force = false }) {
  const c = colors;
  const g = glyphs;
  const agentsPath = path.join(cwd, 'AGENTS.md');

  if (!fs.existsSync(agentsPath)) {
    console.error(`${c.red}[tutorial] AGENTS.md nao encontrado em ${cwd}.${c.reset}`);
    console.error(`Rode primeiro: ${c.cyan}npx roldao-method install${c.reset}`);
    return 1;
  }

  if (!process.stdin.isTTY) {
    console.error(`${c.red}[tutorial] precisa de terminal interativo (TTY).${c.reset}`);
    console.error(`Abra um terminal normal (cmd, PowerShell, bash) e rode de novo.`);
    return 2;
  }

  console.log('');
  console.log(`${c.bold}${c.cyan}ROLDAO-METHOD ${c.reset}${c.bold}— tutorial guiado (5 minutos)${c.reset}`);
  console.log(`${c.dim}Vou te fazer 5 perguntas e preencher o AGENTS.md por voce.${c.reset}`);
  console.log(`${c.dim}Pode pressionar Enter pra pular qualquer pergunta — voce edita depois se quiser.${c.reset}`);
  console.log('');

  let content = fs.readFileSync(agentsPath, 'utf8');
  const original = content;

  const nomeAtual = readField(content, 'Nome');
  const escopoAtual = readField(content, 'Escopo');
  const modeloAtual = readField(content, 'Modelo');
  const clienteAtual = readField(content, 'Cliente/usuário');
  const diffAtual = readField(content, 'Diferencial central');

  const todoPreenchido = !force &&
    !isPlaceholder(nomeAtual) &&
    !isPlaceholder(escopoAtual) &&
    !isPlaceholder(modeloAtual) &&
    !isPlaceholder(clienteAtual) &&
    !isPlaceholder(diffAtual);

  if (todoPreenchido) {
    console.log(`${c.green}${g.ok}${c.reset} AGENTS.md ja esta preenchido. Use ${c.cyan}--force${c.reset} pra refazer.`);
    console.log('');
    console.log(`${c.dim}Valores atuais:${c.reset}`);
    console.log(`  Nome: ${nomeAtual}`);
    console.log(`  Escopo: ${escopoAtual}`);
    console.log(`  Modelo: ${modeloAtual}`);
    console.log(`  Cliente: ${clienteAtual}`);
    console.log(`  Diferencial: ${diffAtual}`);
    return 0;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = makeAsk(rl);

  try {
    console.log(`${c.bold}1/5 — Nome do produto${c.reset}`);
    console.log(`${c.dim}Como voce chama esse projeto no dia-a-dia? (ex: "Loja do Joao", "App da Clinica")${c.reset}`);
    const nome = await ask(`${c.cyan}>${c.reset} `, isPlaceholder(nomeAtual) ? '' : nomeAtual);
    if (nome) content = setField(content, 'Nome', nome);
    console.log('');

    console.log(`${c.bold}2/5 — O que ele faz, em UMA frase${c.reset}`);
    console.log(`${c.dim}Pensa no seguinte: se um amigo perguntar "pra que serve esse sistema?", o que voce diria?${c.reset}`);
    const escopo = await ask(`${c.cyan}>${c.reset} `, isPlaceholder(escopoAtual) ? '' : escopoAtual);
    if (escopo) content = setField(content, 'Escopo', escopo);
    console.log('');

    console.log(`${c.bold}3/5 — Que tipo de coisa e?${c.reset}`);
    console.log(`  1. ${c.cyan}Site / sistema na web${c.reset} (cliente acessa pelo navegador)`);
    console.log(`  2. ${c.cyan}App de celular${c.reset} (instala no telefone)`);
    console.log(`  3. ${c.cyan}Programa de computador${c.reset} (instala no Windows/Mac)`);
    console.log(`  4. ${c.cyan}Sistema interno${c.reset} (so a equipe usa, nao tem cliente externo)`);
    console.log(`  5. ${c.cyan}Outro${c.reset}`);
    const tipoResposta = await ask(`${c.cyan}>${c.reset} Escolha [1-5]: `, '1');
    const tipoMap = {
      '1': 'Site/SaaS (web)',
      '2': 'App mobile',
      '3': 'Aplicativo desktop',
      '4': 'Sistema interno',
      '5': isPlaceholder(modeloAtual) ? 'Outro' : modeloAtual,
    };
    const modelo = tipoMap[tipoResposta] || tipoMap['1'];
    content = setField(content, 'Modelo', modelo);
    console.log('');

    console.log(`${c.bold}4/5 — Quem usa?${c.reset}`);
    console.log(`${c.dim}Quem e a pessoa do outro lado? (ex: "donos de loja pequena", "advogados", "pacientes de clinica")${c.reset}`);
    const cliente = await ask(`${c.cyan}>${c.reset} `, isPlaceholder(clienteAtual) ? '' : clienteAtual);
    if (cliente) content = setField(content, 'Cliente/usuário', cliente);
    console.log('');

    console.log(`${c.bold}5/5 — O que ele faz DIFERENTE${c.reset}`);
    console.log(`${c.dim}Se ja existe gente vendendo coisa parecida, o que o seu faz que os outros nao fazem?${c.reset}`);
    console.log(`${c.dim}(Pode ser preco menor, mais simples, atende mercado especifico, atendimento humano — o que for de verdade)${c.reset}`);
    const diff = await ask(`${c.cyan}>${c.reset} `, isPlaceholder(diffAtual) ? '' : diffAtual);
    if (diff) content = setField(content, 'Diferencial central', diff);
    console.log('');
  } finally {
    rl.close();
  }

  if (content === original) {
    console.log(`${c.yellow}${g.warn}${c.reset} nenhuma resposta dada — AGENTS.md nao foi alterado.`);
    return 0;
  }

  const bak = agentsPath + '.bak';
  try { fs.copyFileSync(agentsPath, bak); } catch { /* best effort */ }
  fs.writeFileSync(agentsPath, content, 'utf8');

  console.log(`${c.green}${g.ok}${c.reset} AGENTS.md preenchido. Backup em ${path.basename(bak)}.`);
  console.log('');
  console.log(`${c.bold}Proximos passos:${c.reset}`);
  console.log(`  ${c.cyan}1.${c.reset} abra o Claude Code (ou seu assistente de IA) nesta pasta`);
  console.log(`  ${c.cyan}2.${c.reset} digite ${c.green}/help${c.reset} pra ver os comandos`);
  console.log(`  ${c.cyan}3.${c.reset} ou comece direto com ${c.green}/inicio${c.reset} pra criar a primeira funcionalidade`);
  console.log('');
  return 0;
}

module.exports = { tutorial };
