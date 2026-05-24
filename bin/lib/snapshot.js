// bin/lib/snapshot.js — snapshot único antes de update + restore.
// Substitui os 30+ .bak espalhados pela árvore por 1 pasta versionada com
// manifest JSON. Auditoria 10-agentes 3ª passada 2026-05-24: rollback hoje
// é manual (renomear N .bak); com snapshot único o usuário roda 1 comando.
//
// Layout:
//   <cwd>/.roldao-method/snapshots/
//     2026-05-24T15-30-12-from-1.0.2-to-1.0.3/
//       manifest.json   [{ rel, hashBefore, hashAfter, status, userOwned }]
//       files/<rel>     copia do conteudo ANTES do update
//
// Contrato: createSnapshot({ cwd, fromVersion, toVersion }) → snapshotId
//           recordFile(snapshotId, cwd, rel)                  (chamado p/ cada arquivo que vai mudar)
//           listSnapshots(cwd)                                → [{ id, ts, fromVersion, toVersion }]
//           restoreSnapshot(cwd, snapshotId)                  → { restored, errors }

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SNAPSHOT_DIR_NAME = '.roldao-method';

function snapshotsRoot(cwd) {
  return path.join(cwd, SNAPSHOT_DIR_NAME, 'snapshots');
}

function safeHash(filePath) {
  try {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
  } catch {
    return null;
  }
}

function createSnapshot({ cwd, fromVersion = 'unknown', toVersion = 'unknown' } = {}) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, '');
  const id = `${ts}-from-${fromVersion}-to-${toVersion}`;
  const dir = path.join(snapshotsRoot(cwd), id);
  fs.mkdirSync(path.join(dir, 'files'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
    id,
    createdAt: new Date().toISOString(),
    fromVersion,
    toVersion,
    files: [],
  }, null, 2));
  return id;
}

function recordFile(snapshotId, cwd, rel, status = 'updated') {
  const dir = path.join(snapshotsRoot(cwd), snapshotId);
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return;

  const full = path.join(cwd, rel);
  const hashBefore = safeHash(full);
  const exists = fs.existsSync(full);

  // Copia o arquivo atual pro snapshot (só se existe — pra "novo" não há o que salvar).
  if (exists) {
    const dest = path.join(dir, 'files', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    try { fs.copyFileSync(full, dest); } catch { /* best effort */ }
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.files.push({ rel, status, hashBefore, existed: exists });
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

function listSnapshots(cwd) {
  const root = snapshotsRoot(cwd);
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter((d) => fs.existsSync(path.join(root, d, 'manifest.json')))
    .map((id) => {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(root, id, 'manifest.json'), 'utf8'));
        return { id, createdAt: m.createdAt, fromVersion: m.fromVersion, toVersion: m.toVersion, fileCount: (m.files || []).length };
      } catch {
        return { id, createdAt: null, fromVersion: '?', toVersion: '?', fileCount: 0 };
      }
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

function restoreSnapshot(cwd, snapshotId) {
  const dir = path.join(snapshotsRoot(cwd), snapshotId);
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    return { restored: 0, errors: [`snapshot ${snapshotId} nao encontrado`] };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let restored = 0;
  const errors = [];
  for (const entry of manifest.files || []) {
    const dest = path.join(cwd, entry.rel);
    const backup = path.join(dir, 'files', entry.rel);
    try {
      if (entry.existed && fs.existsSync(backup)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(backup, dest);
        restored++;
      } else if (!entry.existed && fs.existsSync(dest)) {
        // Arquivo novo criado pelo update — remover pra voltar ao estado anterior.
        fs.rmSync(dest, { force: true });
        restored++;
      }
    } catch (e) {
      errors.push(`${entry.rel}: ${e.message}`);
    }
  }
  return { restored, errors };
}

module.exports = { createSnapshot, recordFile, listSnapshots, restoreSnapshot, snapshotsRoot };
