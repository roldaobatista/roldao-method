#!/usr/bin/env node
// require-postmortem-after-hotfix.js — bloqueia commit nao-emergencial quando
// /hotfix passou de 48h sem postmortem documentado.
//
// Hook PreToolUse, matcher: Bash. Olha o comando: se for git commit e existir
// marker .claude/.runtime/needs-postmortem-* com mais de 48h E nao houver
// docs/incidentes/INC-* mais novo que o marker, bloqueia.
//
// Auditoria 2026-05-25 (regra #45): /hotfix declarava obrigacao de postmortem
// em 48h como "disciplinar" — sem hook consumindo. Agora vira mecanico no core.
// Antes da v1.1 isso dependia do addon lgpd-compliance.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, recordMetric } = require('./_lib.js');

const LIMITE_HORAS = 48;
const MS_HORA = 60 * 60 * 1000;
// Tipos de commit que liberados mesmo sob marker (manutencao basica, docs e
// proprio postmortem) — nao bloqueamos quem esta tentando fechar o ciclo.
const ALLOW_PREFIXES_RE = /\b(docs|chore|test|ci|postmortem):/i;

(async () => {
  const input = await readStdinJson();
  const cmd = input?.tool_input?.command || '';
  if (!cmd) process.exit(0);
  if (!cmd.includes('git commit')) process.exit(0);

  // Libera commit de docs/chore/test/ci/postmortem (precisa fechar o ciclo)
  if (ALLOW_PREFIXES_RE.test(cmd)) process.exit(0);

  let projdir;
  try { projdir = sanitizeProjdir(); } catch { process.exit(0); }
  const runtime = path.join(projdir, '.claude', '.runtime');
  if (!fs.existsSync(runtime)) process.exit(0);

  // Acha markers needs-postmortem-* vencidos (> 48h)
  let markers;
  try {
    markers = fs.readdirSync(runtime)
      .filter((n) => n.startsWith('needs-postmortem-'))
      .map((n) => {
        const full = path.join(runtime, n);
        try { return { full, mtime: fs.statSync(full).mtimeMs }; }
        catch { return null; }
      })
      .filter(Boolean);
  } catch { process.exit(0); }

  const agora = Date.now();
  const vencidos = markers.filter((m) => (agora - m.mtime) > (LIMITE_HORAS * MS_HORA));
  if (vencidos.length === 0) process.exit(0);

  // Existe postmortem mais novo que o marker mais antigo? Se sim, considera ciclo fechado.
  const markerMaisAntigo = vencidos.reduce((min, m) => (m.mtime < min ? m.mtime : min), Infinity);
  const incidentesDir = path.join(projdir, 'docs', 'incidentes');
  let postmortemRecente = false;
  if (fs.existsSync(incidentesDir)) {
    try {
      for (const f of fs.readdirSync(incidentesDir)) {
        if (!/^INC-.*\.md$/i.test(f)) continue;
        const stat = fs.statSync(path.join(incidentesDir, f));
        if (stat.mtimeMs > markerMaisAntigo) { postmortemRecente = true; break; }
      }
    } catch { /* skip */ }
  }
  if (postmortemRecente) {
    // Ciclo fechado — limpa markers vencidos pra nao repetir bloqueio
    for (const m of vencidos) { try { fs.unlinkSync(m.full); } catch { /* */ } }
    process.exit(0);
  }

  process.stderr.write(`[require-postmortem-after-hotfix] BLOQUEADO: postmortem pendente apos /hotfix.\n\n`);
  process.stderr.write(`Marcador(es) needs-postmortem-* vencido(s):\n`);
  for (const m of vencidos) {
    const horas = Math.floor((agora - m.mtime) / MS_HORA);
    process.stderr.write(`  - ${path.basename(m.full)} (${horas}h sem postmortem)\n`);
  }
  process.stderr.write(`\nRegra: /hotfix exige rodar /incident-postmortem em ate ${LIMITE_HORAS}h apos o fix.\n`);
  process.stderr.write(`Motivo: LGPD-006 da ate 72h pra notificar ANPD; cobertura do caso que escapou\n`);
  process.stderr.write(`precisa virar teste; acao corretiva precisa de T-NNN rastreavel.\n\n`);
  process.stderr.write(`Como destravar:\n`);
  process.stderr.write(`  1. Rode /incident-postmortem (gera docs/incidentes/INC-NNN-*.md).\n`);
  process.stderr.write(`  2. Comite o postmortem (prefixo postmortem: libera este hook).\n`);
  process.stderr.write(`  3. Apos o INC ser mais novo que o marker, ciclo fecha automaticamente.\n\n`);
  process.stderr.write(`Bypass de emergencia (use so se o postmortem JA foi feito fora do framework):\n`);
  process.stderr.write(`  rm .claude/.runtime/needs-postmortem-* (apos block-destructive permitir)\n`);
  process.stderr.write(`  -> nao recomendado: postmortem fora do framework perde a auditoria.\n\n`);
  process.stderr.write(`Aplica regras: LGPD-006, INV-AGENT-004.\n`);
  recordMetric('block', 'require-postmortem-after-hotfix', `marker vencido > ${LIMITE_HORAS}h sem INC-*`);
  process.exit(2);
})().catch(() => process.exit(2));
