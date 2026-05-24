// bin/lib/registry.js — registro global de projetos que tem o framework instalado.
// Permite `npx roldao-method update --all` percorrer todos os projetos.
// Auditoria 10-agentes 3ª passada 2026-05-24: usuario com 5 repos hoje precisa
// rodar update em cada um manualmente; com registry roda 1 vez.
//
// Local: ~/.roldao-method/projects.json
// Formato: [{ path: 'C:/projetos/foo', addedAt: ISO, lastUpdate: ISO }]

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

function registryPath() {
  return path.join(os.homedir(), '.roldao-method', 'projects.json');
}

function readRegistry() {
  const file = registryPath();
  if (!fs.existsSync(file)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeRegistry(list) {
  const file = registryPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(list, null, 2) + '\n', 'utf8');
}

function addProject(cwd) {
  const list = readRegistry();
  const normalized = path.resolve(cwd);
  const existing = list.find((p) => path.resolve(p.path) === normalized);
  if (existing) {
    existing.lastSeen = new Date().toISOString();
  } else {
    list.push({ path: normalized, addedAt: new Date().toISOString(), lastSeen: new Date().toISOString() });
  }
  writeRegistry(list);
}

function markUpdated(cwd) {
  const list = readRegistry();
  const normalized = path.resolve(cwd);
  const existing = list.find((p) => path.resolve(p.path) === normalized);
  if (existing) {
    existing.lastUpdate = new Date().toISOString();
    writeRegistry(list);
  }
}

function listProjects() {
  // Remove entradas cujo path nao existe mais (pasta deletada).
  const list = readRegistry();
  const valid = list.filter((p) => fs.existsSync(p.path));
  if (valid.length !== list.length) writeRegistry(valid);
  return valid;
}

module.exports = { addProject, markUpdated, listProjects, registryPath };
