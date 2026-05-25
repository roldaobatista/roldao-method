#!/usr/bin/env node
// mcp-validator.js — valida .mcp.json contra allowlist de fornecedores conhecidos.
// Hook SessionStart.

const fs = require('fs');
const path = require('path');
const { sanitizeProjdir } = require('./_lib.js');

const ALLOWLIST = [
  // Oficiais Anthropic/MCP
  'modelcontextprotocol/', 'anthropic-experimental/', '@modelcontextprotocol/',
  '@anthropic/', '@anthropic-ai/', 'github.com/modelcontextprotocol',
  'github.com/anthropics', 'anthropic.com',
  // Test/automation
  '@playwright/', '@vitest/', '@cypress/',
  // Comunicacao
  '@slack/mcp', 'slack-mcp-server', 'linear-mcp', '@linear/mcp',
  // Codigo / SCM
  '@github/mcp', 'github-mcp-server', '@gitlab/mcp',
  // Pesquisa / docs
  '@brave/brave-search-mcp', 'brave-search-mcp', '@perplexity/mcp',
  '@upstash/context7-mcp', 'context7',
  // Produtividade
  '@notion/mcp', 'notion-mcp', '@google/calendar-mcp', '@google/drive-mcp',
  // Banco de dados
  '@postgres/mcp', 'postgres-mcp-server', '@sqlite/mcp', 'mcp-server-sqlite',
  // Cloud / infra
  '@aws/mcp', '@cloudflare/mcp',
  // Filesystem / utilitarios
  '@filesystem/mcp', 'mcp-server-filesystem', '@memory/mcp', 'mcp-server-memory',
  '@fetch/mcp', 'mcp-server-fetch',
  // Fornecedores BR
  '@asaas/', 'asaas-mcp', '@pagarme/', 'pagarme-mcp', '@stone/', 'stone-mcp',
  '@iugu/', '@cielo/', '@gerencianet/', 'gerencianet-mcp', '@focusnfe/', 'focusnfe-mcp',
  '@nfeio/', 'nfe-io-mcp', '@enotas/', '@webmaniabr/', '@omie/', 'omie-mcp',
  '@bling/', 'bling-mcp', '@tiny/', 'tiny-mcp', '@conta-azul/', '@totvs/', 'totvs-mcp',
  '@sankhya/', '@senior/', '@vindi/', '@inter/', 'inter-bank-mcp', '@bb/',
  '@itau/', '@bradesco/', '@santander/', '@nubank/', '@stark/', 'starkbank-mcp',
];

(async () => {
  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(2); }
  const mcpFile = path.join(projdir, '.mcp.json');
  if (!fs.existsSync(mcpFile)) process.exit(0);

  let json;
  try { json = JSON.parse(fs.readFileSync(mcpFile, 'utf8')); }
  catch { process.exit(0); }

  const servers = json.mcpServers || {};
  if (Object.keys(servers).length === 0) process.exit(0);

  const desconhecidos = [];
  for (const [name, cfg] of Object.entries(servers)) {
    const cmd = cfg.command || '';
    const args = (cfg.args || []).join(' ');
    const full = `${cmd} ${args}`.trim();

    let authorized = false;
    for (const allowed of ALLOWLIST) {
      const esc = allowed.replace(/[.[\\*^$/]/g, '\\$&');
      const re = new RegExp(`(^|\\s|@)${esc}(\\s|@|$)`);
      if (re.test(full)) { authorized = true; break; }
    }
    if (!authorized) desconhecidos.push(`${name} -> ${full}`);
  }

  if (desconhecidos.length > 0) {
    process.stderr.write(`[mcp-validator] BLOQUEADO: MCP servers fora da allowlist conhecida.\n\nServers nao reconhecidos:\n`);
    for (const d of desconhecidos) process.stderr.write(`  - ${d}\n`);
    process.stderr.write(`\nRisco: MCP de terceiros recebe prompt completo + chamadas de ferramenta.\n`);
    process.stderr.write(`Antes de continuar, confirme:\n`);
    process.stderr.write(`  1. Voce confia no autor do MCP?\n`);
    process.stderr.write(`  2. O server e oficial / open source verificado?\n`);
    process.stderr.write(`  3. As permissoes necessarias estao OK?\n\n`);
    process.stderr.write(`Pra autorizar mesmo assim (consciente do risco), defina:\n`);
    process.stderr.write(`  ROLDAO_METHOD_MCP_ALLOW_UNKNOWN=1\n\n`);
    process.stderr.write(`Doc: docs/MCP-GUIA-BR.md.\n`);
    if (process.env.ROLDAO_METHOD_MCP_ALLOW_UNKNOWN === '1') {
      process.stderr.write(`[mcp-validator] override ROLDAO_METHOD_MCP_ALLOW_UNKNOWN=1 ativo — prosseguindo.\n`);
      process.exit(0);
    }
    // Tabela em .claude/rules/roldao-method.md promete exit 2 — auditoria
    // 2026-05-25 (hook #1) corrigiu: era exit 0 silencioso. SessionStart com
    // exit 2 impede inicio da sessao no Claude Code.
    process.exit(2);
  }

  process.exit(0);
})().catch(() => process.exit(0));
