// bin/lib/spinner.js — spinner Braille sem dep externa.
// Contrato: start(msg) → handle; tick(msg?), succeed(msg?), fail(msg?), stop().
// No-op se !isTTY OU quiet=true OU noUnicode=true (ambiente ASCII-only).
// Substitui silêncio nas operações longas (walkAndCopy, fetch versão remota).

'use strict';

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const FRAMES_ASCII = ['|', '/', '-', '\\'];
const INTERVAL_MS = 80;

function makeSpinner({ stream = process.stdout, isTTY = true, quiet = false, noUnicode = false } = {}) {
  const active = isTTY && !quiet;
  const frames = noUnicode ? FRAMES_ASCII : FRAMES;
  let timer = null;
  let i = 0;
  let label = '';

  function clearLine() {
    if (!active) return;
    stream.write('\r\x1b[2K');
  }

  function render() {
    if (!active) return;
    stream.write(`\r${frames[i % frames.length]} ${label}`);
    i++;
  }

  return {
    start(msg = '') {
      label = msg;
      if (!active) {
        if (msg) stream.write(`${msg}\n`);
        return this;
      }
      if (timer) clearInterval(timer);
      render();
      timer = setInterval(render, INTERVAL_MS);
      return this;
    },
    tick(msg) {
      if (typeof msg === 'string') label = msg;
      return this;
    },
    succeed(msg) {
      if (timer) { clearInterval(timer); timer = null; }
      clearLine();
      const mark = noUnicode ? '[OK]' : '✓';
      if (active) stream.write(`${mark} ${msg || label}\n`);
      else if (msg) stream.write(`${mark} ${msg}\n`);
      return this;
    },
    fail(msg) {
      if (timer) { clearInterval(timer); timer = null; }
      clearLine();
      const mark = noUnicode ? '[X]' : '✗';
      if (active) stream.write(`${mark} ${msg || label}\n`);
      else if (msg) stream.write(`${mark} ${msg}\n`);
      return this;
    },
    stop() {
      if (timer) { clearInterval(timer); timer = null; }
      clearLine();
      return this;
    },
  };
}

module.exports = { makeSpinner };
