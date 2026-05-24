// bin/lib/glyphs.js — caracteres de status com fallback ASCII.
// Contrato: makeGlyphs({ noUnicode }) → { ok, err, warn, info, arrow, bullet }.
// Quando noUnicode=true (flag --ascii ou env ROLDAO_ASCII=1), retorna
// versões ASCII puras pra terminal cp1252, PuTTY antigo, SSH com gateway
// que stripa UTF-8, ou leitor de tela que não anuncia bem glifos.

'use strict';

const UNICODE = {
  ok: '✓',
  err: '✗',
  warn: '⚠',
  info: 'ℹ',
  arrow: '→',
  bullet: '•',
  box: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
};

const ASCII = {
  ok: '[OK]',
  err: '[X]',
  warn: '[!]',
  info: '[i]',
  arrow: '->',
  bullet: '*',
  box: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
};

function makeGlyphs({ noUnicode = false } = {}) {
  return noUnicode ? ASCII : UNICODE;
}

module.exports = { makeGlyphs, UNICODE, ASCII };
