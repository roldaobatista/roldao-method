// bin/lib/colors.js — helper ANSI sem dep. Extraído de bin/install.js (Sprint 2.4).
// Contrato: makeColors({ noColor, isTTY }) → objeto com {reset,bold,dim,green,yellow,red,blue,cyan,magenta}.
// Quando noColor=true OU isTTY=false, retorna todas as cores como string vazia.
// Windows moderno (Terminal/Git Bash/VS Code) suporta ANSI; isTTY já cobre o caso CMD/PowerShell sem TTY.

'use strict';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function makeColors({ noColor = false, isTTY = false } = {}) {
  const enabled = !noColor && isTTY;
  const out = {};
  for (const key of Object.keys(ANSI)) {
    out[key] = enabled ? ANSI[key] : '';
  }
  return out;
}

module.exports = { makeColors, ANSI };
