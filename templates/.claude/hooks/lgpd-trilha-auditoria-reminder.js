#!/usr/bin/env node
// lgpd-trilha-auditoria-reminder.js — soft warning quando handler/repository
// le ou exibe dado pessoal sensivel sem log de auditoria visivel.
// Hook PostToolUse, matcher: Write|Edit. LGPD-004 (trilha de auditoria).
//
// Heuristica: codigo em pasta de handler/controller/service que faz SELECT
// ou retorna CPF/email/telefone — lembrar que LGPD-004 exige trilha imutavel
// para dado pessoal sensivel (saude, financeiro). Soft warning — exit 0.

const { readStdinJson, normalizeFilePath } = require('./_lib.js');

const TRIGGER_PATHS_RE =
  /(handlers?|controllers?|services?|repositorios?|repositories|usecases?|domain)\//i;
const CODE_EXT_RE = /\.(py|rb|js|jsx|ts|tsx|go|java|kt|cs|php|rs)$/i;

// Sinais de ACESSO a dado pessoal: leitura, retorno, exibicao.
const ACESSO_DADO_RE =
  /(SELECT\s+.*\b(cpf|cnpj|email|telefone|endereco)\b|\.cpf\b|\.email\b|\.telefone\b|user\.\w*personal|cliente\.dados|paciente\.|prontuario|conta_corrente|saldo|extrato)/i;

// Sinais de que JA existe trilha (log estruturado, audit_log, recordAccess etc).
const TRILHA_RE =
  /(audit_?log|audit_?trail|recordAccess|registrar_?acesso|log_?lgpd|trilha_?auditoria|logger\.(info|audit|access).*\b(cpf|email|telefone|paciente|conta))/i;

(async () => {
  const input = await readStdinJson();
  const toolName = input?.tool_name || '';
  if (toolName !== 'Write' && toolName !== 'Edit') process.exit(0);

  const filePath = normalizeFilePath(input?.tool_input?.file_path || '');
  if (!filePath) process.exit(0);
  if (!CODE_EXT_RE.test(filePath)) process.exit(0);
  if (!TRIGGER_PATHS_RE.test(filePath)) process.exit(0);

  const content =
    input?.tool_input?.content ?? input?.tool_input?.new_string ?? '';
  if (!content) process.exit(0);
  if (!ACESSO_DADO_RE.test(content)) process.exit(0);
  if (TRILHA_RE.test(content)) process.exit(0);

  process.stderr.write(
    `[lgpd-trilha-auditoria-reminder] Lembrete LGPD-004 — trilha de auditoria.\n\n` +
      `Arquivo: ${filePath}\n` +
      `Detectado: leitura/exibicao de dado pessoal (CPF/email/telefone/saude/financeiro)\n` +
      `sem chamada visivel a logger de auditoria.\n\n` +
      `LGPD-004 exige trilha IMUTAVEL para acesso a dado pessoal sensivel.\n` +
      `Adicione registro estruturado tipo:\n` +
      `  audit_log.record(actor=user.id, resource='cliente', resource_id=id, action='read')\n\n` +
      `Se este caminho de leitura ja eh logado em camada de cima (middleware,\n` +
      `interceptor, decorator), ignore este lembrete.\n` +
      `Soft warning — nao bloqueia.\n`,
  );
  process.exit(0);
})().catch(() => process.exit(0));
