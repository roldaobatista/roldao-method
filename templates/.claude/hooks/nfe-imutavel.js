#!/usr/bin/env node
// nfe-imutavel.js — bloqueia UPDATE/DELETE em registro de NF-e emitida.
// Hook PreToolUse, matcher: Write|Edit|Bash. FISCAL-001.
//
// XML de NF-e autorizado pela SEFAZ NAO PODE ser alterado. Correcao exige
// Carta de Correcao Eletronica (CC-e) ou cancelamento dentro do prazo legal.
// Editar o XML armazenado, ou rodar UPDATE em tabela `nfe_emitida`, muda
// estado fiscal sem rastro — incidente garantido em fiscalizacao.
//
// Falsos positivos sao raros e dao pra liberar com `FISCAL-001-exception: <razao>`.

// FISCAL-001-exception: este arquivo IMPLEMENTA a regra FISCAL-001 — referencias
// textuais a "XML" e "NF-e emitida" sao parte da mensagem de erro.

const { readStdinJson, recordMetric, normalizeFilePath } = require('./_lib.js');

const EXCEPTION_RE = /FISCAL-001-exception/;

const SQL_TABELAS = [
  'nfe_?emitidas?',
  'notas?_?fiscais?_?emitidas?',
  'nfse_?emitidas?',
  'nfce_?emitidas?',
  'cte_?emitidos?',
  'mdfe_?emitidas?',
  'sat_?cfe_?emitidos?',
];
const SQL_UPDATE_DELETE_RE = new RegExp(
  '\\b(UPDATE|DELETE\\s+FROM)\\s+(' + SQL_TABELAS.join('|') + ')\\b',
  'i',
);

const XML_EMITIDO_PATH_RE = /(emitidas?|autorizadas?|enviadas?|nfe-?emitida)\b.*\.xml$/i;
const XML_NOME_CHAVE_RE = /\b\d{44}\b.*\.xml$/i;

function bloqueia(motivo, contexto) {
  process.stderr.write(`[nfe-imutavel] BLOQUEADO: ${motivo}\n\n`);
  process.stderr.write(`Contexto: ${contexto}\n\n`);
  process.stderr.write(`Regra: FISCAL-001 — documento fiscal autorizado nao pode ser alterado.\n`);
  process.stderr.write(`Correcao exige: Carta de Correcao Eletronica (CC-e) OU cancelamento dentro do prazo legal.\n`);
  process.stderr.write(`Mudar o documento armazenado, ou rodar UPDATE na tabela do registro emitido, muda estado fiscal sem rastro — incidente em fiscalizacao.\n\n`);
  process.stderr.write(`Como destravar (se for intencional e LEGAL):\n`);
  process.stderr.write(`- Documente a razao em ADR aprovado pelo fiscal/contador.\n`);
  process.stderr.write(`- Adicione marca // FISCAL-001-exception: <ADR-NNN ou razao> na linha.\n`);
  recordMetric('block', 'nfe-imutavel', motivo);
  process.exit(2);
}

(async () => {
  const input = await readStdinJson();
  const toolName = input?.tool_name || '';

  if (toolName === 'Bash') {
    const cmd = input?.tool_input?.command || '';
    if (!cmd) process.exit(0);
    if (EXCEPTION_RE.test(cmd)) process.exit(0);
    if (SQL_UPDATE_DELETE_RE.test(cmd)) {
      bloqueia('UPDATE/DELETE em tabela de documento fiscal emitido', cmd.slice(0, 200));
    }
    process.exit(0);
  }

  if (toolName === 'Write' || toolName === 'Edit') {
    const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
    if (!filePath) process.exit(0);

    const isXmlEmitido =
      XML_EMITIDO_PATH_RE.test(filePath) || XML_NOME_CHAVE_RE.test(filePath);

    if (isXmlEmitido) {
      bloqueia('edicao de arquivo de documento fiscal emitido', filePath);
    }

    const content =
      input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
    if (!content) process.exit(0);

    const lines = String(content).split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (EXCEPTION_RE.test(line)) continue;
      if (SQL_UPDATE_DELETE_RE.test(line)) {
        bloqueia(
          'UPDATE/DELETE em tabela de documento fiscal emitido (codigo SQL)',
          `${filePath} linha ${i + 1}: ${line.slice(0, 120)}`,
        );
      }
    }
  }

  process.exit(0);
})().catch((err) => {
  process.stderr.write(`[nfe-imutavel] erro interno: ${err.message}\n`);
  process.exit(2);
});
