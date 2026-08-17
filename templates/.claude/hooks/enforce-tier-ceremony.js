#!/usr/bin/env node
// enforce-tier-ceremony.js — cerimonia proporcional ao risco (Fabrica, tiers 3-4).
// Hook PreToolUse, matcher: Bash (grupo pre-bash do _dispatcher).
//
// Fase 2 da Fabrica (decisao do dono, 2026-08-17): /tier grava o marker
// tier-active-<sess> (JSON {tier, pedido, timestamp}). Este vigia so age em
// comando de SUBIDA (git push / deploy) quando o tier da sessao e 3 ou 4:
//   - tier 3+: exige docs/fabrica/checklist-release-*.md mais NOVO que o marker
//   - tier 4:  exige tambem o marker dono-aprovou-<sess> (gravado apos
//     AskUserQuestion explicita — agente nunca se auto-aprova)
// Sem marker de tier (fluxo antigo), o hook nao interfere.

const fs = require('fs');
const path = require('path');
const { readStdinJson, sanitizeProjdir, sanitizeSessionHash, recordMetric } = require('./_lib.js');

// Subida: push pra remoto ou comandos de deploy comuns. Nao inclui commit local.
const PUSH_RE = /git(?:\s+-[a-zA-Z](?:\s+\S+)?|\s+--[\w-]+(?:=\S+)?)*\s+push\b/;
const DEPLOY_RE =
  /\b(vercel|netlify|fly|flyctl|railway|heroku|wrangler)\s+(deploy|publish|up\b)|\bnpx\s+(vercel|netlify|wrangler)\b|\bdocker\s+(push|compose\s+up\s+.*-d)|\bkubectl\s+apply|\bssh\s+\S*@.*\b(deploy|docker|systemctl)\b/i;

// Contrato do _dispatcher (ADR-033): retorna exit code, nunca chama process.exit.
async function runHook(input) {
  const cmd = input?.tool_input?.command || '';
  if (!cmd) return 0;
  if (!PUSH_RE.test(cmd) && !DEPLOY_RE.test(cmd)) return 0;

  let projdir;
  try {
    projdir = sanitizeProjdir();
  } catch {
    return 0; // sem projeto identificavel nao ha marker de tier — nada a exigir
  }
  const sess = sanitizeSessionHash(undefined, projdir);
  const runtime = path.join(projdir, '.claude', '.runtime');
  const tierMark = path.join(runtime, `tier-active-${sess}`);
  if (!fs.existsSync(tierMark)) return 0;

  let tierInfo = null;
  let tierMtime = 0;
  try {
    tierInfo = JSON.parse(fs.readFileSync(tierMark, 'utf8'));
    tierMtime = fs.statSync(tierMark).mtimeMs;
  } catch {
    return 0; // marker ilegivel = sem classificacao valida; /tier regrava
  }
  const tier = Number(tierInfo?.tier);
  if (!Number.isInteger(tier) || tier < 3) return 0;

  const faltas = [];

  // Checklist de release mais novo que a classificacao do tier
  const checklistDir = path.join(projdir, 'docs', 'fabrica');
  let temChecklistNovo = false;
  try {
    for (const f of fs.readdirSync(checklistDir)) {
      if (!/^checklist-release-.*\.md$/i.test(f)) continue;
      if (fs.statSync(path.join(checklistDir, f)).mtimeMs >= tierMtime) {
        temChecklistNovo = true;
        break;
      }
    }
  } catch {
    /* pasta ausente = sem checklist */
  }
  if (!temChecklistNovo) {
    faltas.push(
      `checklist de release preenchido (docs/fabrica/checklist-release-*.md, mais novo que a classificacao) — template: fabrica/templates/checklist-release.template.md`,
    );
  }

  // Tier 4: aprovacao explicita do dono
  if (tier >= 4) {
    const aprov = path.join(runtime, `dono-aprovou-${sess}`);
    let ok = false;
    try {
      const j = JSON.parse(fs.readFileSync(aprov, 'utf8'));
      ok = Boolean(j && j.aprovado_em);
    } catch {
      ok = false;
    }
    if (!ok) {
      faltas.push(
        `aprovacao explicita do dono (marker dono-aprovou-* gravado SO depois de AskUserQuestion respondida — tier 4 nunca sobe por decisao do agente)`,
      );
    }
  }

  if (faltas.length === 0) return 0;

  process.stderr.write(
    `[enforce-tier-ceremony] BLOQUEADO: subida de mudanca tier ${tier} sem a cerimonia da Fabrica.\n\n`,
  );
  process.stderr.write(`Comando: ${cmd}\n`);
  process.stderr.write(`Pedido classificado: ${tierInfo?.pedido || '(sem descricao)'}\n\nFalta:\n`);
  for (const f of faltas) process.stderr.write(`  - ${f}\n`);
  process.stderr.write(
    `\nEm linguagem clara: mudanca de risco alto (financeiro/fiscal/regulado) so sobe\n`,
  );
  process.stderr.write(
    `com o checklist preenchido${tier >= 4 ? ' E o dono aprovando explicitamente' : ''}.\n`,
  );
  process.stderr.write(`Regua: fabrica/FABRICA.md (tiers) + /tier. Regras: INV-AGENT-005.\n`);
  recordMetric('block', 'enforce-tier-ceremony', `tier ${tier} sem cerimonia`);
  return 2;
}

module.exports = { runHook, onErrorExit: 2 };

if (require.main === module) {
  (async () => {
    process.exit(await runHook(await readStdinJson()));
  })().catch((err) => {
    process.stderr.write(`[enforce-tier-ceremony] erro interno: ${err.message}\n`);
    process.exit(2);
  });
}
