#!/usr/bin/env bash
# Template: hook-secrets-scanner.template.sh
# Destino: .claude/hooks/secrets-scanner.sh
# Hook evento: PreToolUse
# Matcher: Write|Edit
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C9b, INV-AGENT-008 (PII)
# orçamento: <300ms
# protocolo: PreToolUse Write|Edit. Le JSON do stdin, exit 2 se detectar segredo ou PII.
# severidade: CRÍTICO
#
# COBRE:
# 1) Credenciais (AWS, GitHub, OpenAI, Anthropic, Slack, Google, PEM)
# 2) PII brasileira (INV-AGENT-008): CPF, CNPJ, telefone, CEP (warning), email pessoal
#
# LIMITACOES CONHECIDAS:
# - CPF sem mascara (11 digitos) tem falso-positivo alto — exige contexto "cpf"/"documento"
# - Email em codigo: heuristica grosseira, exclui dominios de teste padrao
# - CEP nao bloqueia (sozinho nao e PII) — apenas alerta
# - Ofuscacao (concatenacao de strings, base64) passa

set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "BLOCKED: dependencia 'jq' ausente — instale jq para o hook funcionar." >&2; exit 2; }

if command -v timeout >/dev/null 2>&1; then
  INPUT=$(timeout 1 cat || true)
else
  INPUT=$(cat || true)
fi
if [[ -z "${INPUT:-}" ]]; then
  exit 0
fi

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Isenta fixtures/tests/mocks — testes precisam de PII/credencial sintetica.
# .env nao e isentado: ali segredo tem que estar gitignored, nao em commit.
case "$FILE" in
  */fixtures/*|*/__fixtures__/*|*/tests/*|*/__tests__/*|*/test/*|*/spec/*|*/__mocks__/*|*/mocks/*) exit 0 ;;
  *.test.*|*.spec.*|*_test.*|*_spec.*) exit 0 ;;
esac

# Docs (.md): scaneados, mas com isencao para arquivos cuja FUNCAO declarada e
# documentar formato de credencial (SECURITY.md, threat-model.md, dependency-policy.md).
# Esses 3 explicam regexes literalmente e nao tem segredo real. Demais .md
# (README, AGENTS, runbook, ADR) sao scaneados — segredo em doc tambem vaza.
# Falso-positivo em outros .md e resolvido pelo PLACEHOLDER_ALLOWLIST abaixo
# (< >, ${VAR}, REDACTED, etc).
case "$FILE" in
  */SECURITY.md|*/threat-model.md|*/dependency-policy.md|*/SECURITY.template.md|*/threat-model.template.md|*/dependency-policy.template.md) exit 0 ;;
esac

# Extrai o conteudo que sera gravado/editado.
# Write: tool_input.content
# Edit:  tool_input.new_string (e tambem old_string, mas segredo so importa em new)
# CUIDADO: usar "" em vez de `empty` no fallback do //. Com `empty`, qualquer
# campo ausente faz o stream colapsar e a concatenacao retornar string vazia —
# isso DEIXA PASSAR SEGREDOS silenciosamente (bug pre-existente).
# Guard extra: se `tool_input` inteiro estiver ausente, jq pode emitir o literal
# "null" (string de 4 chars) em vez de string vazia. Tratamos isso explicitamente.
CONTENT=$(echo "$INPUT" | jq -r '((.tool_input.content // "") + "\n" + (.tool_input.new_string // ""))' 2>/dev/null || echo "")
# Normaliza "null" (saida literal do jq quando o campo nao existe) para vazio.
if [[ "$CONTENT" == "null" || "$CONTENT" == $'null\nnull' || "$CONTENT" == $'\n' ]]; then
  CONTENT=""
fi

if [[ -z "$CONTENT" ]]; then
  exit 0
fi

# Remove valores claramente placeholder antes de aplicar deteccoes literais
# (`password = "TODO"`, `apiKey = "<seu-token>"`, `secret = process.env.X` etc).
# Isso evita falso-positivo em codigo legitimo que apenas demonstra o formato.
#
# DUAS classes de allowlist (a separacao importa — ver abaixo):
#  - ESTRUTURAL: marcadores que so existem em placeholder (<...>, ${...}, env). Como
#    substring no match e seguro: chave real nao contem `<` nem `${`.
#  - PALAVRA: tokens de linguagem natural (example/sample/fake/dummy/...). Aplicados
#    como SUBSTRING, deixavam passar chave REAL que por acaso contivesse o token
#    (ex.: `sk-livesamplekeyABCDEFGHIJ123456` era lido como "sample" => liberado).
#    Por isso sao casados com -w (palavra inteira): so contam quando isolados por
#    delimitador (`sk-fake-token`), nao embutidos num token alfanumerico maior.
PLACEHOLDER_STRUCT='(<[^>]+>|\$\{[^}]+\}|process\.env\.[A-Z_]+|os\.environ|getenv\()'
PLACEHOLDER_WORDS='(REDACTED|CHANGEME|CHANGE-ME|CHANGE_ME|TODO|FIXME|XXX|placeholder|example|sample|fake|dummy)'

# Padroes de segredo (cada linha: rotulo|regex-ERE)
PATTERNS=(
  'AWS Access Key|AKIA[0-9A-Z]{16}'
  'GitHub Personal Token|ghp_[A-Za-z0-9]{36}'
  'GitHub OAuth Token|gho_[A-Za-z0-9]{36}'
  'GitHub User-to-Server|ghu_[A-Za-z0-9]{36}'
  'GitHub Server-to-Server|ghs_[A-Za-z0-9]{36}'
  'GitHub Refresh Token|ghr_[A-Za-z0-9]{36}'
  'OpenAI/Generic sk-|sk-[A-Za-z0-9]{20,}'
  'Anthropic key|sk-ant-[A-Za-z0-9_-]{20,}'
  'Slack token|xox[bpsoa]-[A-Za-z0-9-]{10,}'
  'Google API Key|AIza[0-9A-Za-z_-]{35}'
  'Stripe Live key|sk_live_[A-Za-z0-9]{20,}'
  'SendGrid API key|SG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'
  'Mailgun API key|key-[0-9a-fA-F]{32}'
  'HashiCorp Vault token|hvs\.[A-Za-z0-9_-]{20,}'
  'Firebase API key|AIza[0-9A-Za-z_-]{35}'
  'GCP service account private key|-----BEGIN PRIVATE KEY-----'
  'MongoDB Atlas URL com credencial|mongodb(\+srv)?://[^:[:space:]]+:[^@[:space:]]+@'
  'Twilio Account SID|AC[a-f0-9]{32}'
  'Twilio API Key SID|SK[a-f0-9]{32}'
  'JWT compacto (3 segmentos b64)|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
  'URL de conexao DB com credencial|(postgres|postgresql|mysql|mongodb|redis|amqp)://[^:[:space:]]+:[^@[:space:]]+@'
  'Private Key block|-----BEGIN [A-Z ]*PRIVATE KEY-----'
  'Password literal forte|password[[:space:]]*=[[:space:]]*['"'"'"][A-Za-z0-9!@#$%&*_+=.-]{8,}['"'"'"]'
  'Secret literal forte|secret[[:space:]]*=[[:space:]]*['"'"'"][A-Za-z0-9!@#$%&*_+=.-]{8,}['"'"'"]'
  'API key literal forte|api[_-]?key[[:space:]]*=[[:space:]]*['"'"'"][A-Za-z0-9_-]{16,}['"'"'"]'
)

HIT=0
PII_HIT=0
for entry in "${PATTERNS[@]}"; do
  label="${entry%%|*}"
  regex="${entry#*|}"
  # Extrai matches e ignora os que sao placeholders conhecidos.
  MATCHES=$(echo "$CONTENT" | grep -ioE -- "$regex" || true)
  [[ -z "$MATCHES" ]] && continue
  REAL_HIT=0
  while IFS= read -r m; do
    [[ -z "$m" ]] && continue
    if echo "$m" | grep -iE -- "$PLACEHOLDER_STRUCT" >/dev/null 2>&1 \
       || echo "$m" | grep -iwE -- "$PLACEHOLDER_WORDS" >/dev/null 2>&1; then
      continue
    fi
    REAL_HIT=1
    break
  done <<< "$MATCHES"
  if [[ "$REAL_HIT" -eq 1 ]]; then
    echo "BLOCKED: possivel segredo detectado — $label" >&2
    HIT=1
  fi
done

# ----------------------------------------------------------------------------
# PII brasileira — INV-AGENT-008
# ----------------------------------------------------------------------------

# CPF mascarado: 999.999.999-99 — isenta placeholders triviais (todos os digitos iguais ou .00/.99)
CPF_HITS=$(echo "$CONTENT" | grep -oE '\b[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}\b' || true)
if [[ -n "$CPF_HITS" ]]; then
  while IFS= read -r cpf; do
    [[ -z "$cpf" ]] && continue
    # Remove pontos/hifen para checar repeticao trivial (00000000000, 11111111111, etc).
    DIGITS=$(echo "$cpf" | tr -d '.-')
    if echo "$DIGITS" | grep -qE '^(0{11}|1{11}|2{11}|3{11}|4{11}|5{11}|6{11}|7{11}|8{11}|9{11})$'; then
      continue
    fi
    echo "BLOCKED: possivel CPF (mascarado) detectado — viola INV-AGENT-008." >&2
    PII_HIT=1
    break
  done <<< "$CPF_HITS"
fi

# CPF sem mascara (11 digitos) — duas estrategias:
# (a) janela ampla de 200 chars apos "cpf"/"documento"/"documentos"/"cnpj" para pegar listas/arrays.
# (b) fallback: qualquer sequencia isolada de 11 digitos que nao pareca timestamp/build/versao.
if echo "$CONTENT" | grep -iE '(cpf|cpfs|documento|documentos|cnpj)[^A-Za-z0-9]{0,200}\b[0-9]{11}\b' >/dev/null 2>&1; then
  echo "BLOCKED: possivel CPF/documento sem mascara (contexto declarado) — viola INV-AGENT-008." >&2
  PII_HIT=1
fi
# Sequencia isolada de 11 digitos SEM contexto declarado de CPF/documento:
# apenas WARNING. Falso-positivo e alto (IDs de pedido, timestamps de 11 digitos,
# numeros de protocolo, codigos de barras parciais). O bloqueio real esta no
# ramo acima (contexto "cpf|documento|cnpj") e na deteccao mascarada (XXX.XXX.XXX-XX).
ISOLATED_HITS=$(echo "$CONTENT" | grep -oE '\b[0-9]{11}\b' || true)
if [[ -n "$ISOLATED_HITS" ]]; then
  while IFS= read -r num; do
    [[ -z "$num" ]] && continue
    # Repeticao trivial: ignora
    if echo "$num" | grep -qE '^(0{11}|1{11}|2{11}|3{11}|4{11}|5{11}|6{11}|7{11}|8{11}|9{11})$'; then
      continue
    fi
    # Contexto de versao/build/timestamp: ignora silencioso (nem warning)
    if echo "$CONTENT" | grep -iE "(version|build|timestamp|epoch|millis|nanos)[^A-Za-z0-9]{0,30}$num" >/dev/null 2>&1; then
      continue
    fi
    echo "WARNING: sequencia isolada de 11 digitos ($num) em $FILE — se for CPF, mascare (XXX.XXX.XXX-XX) ou renomeie a variavel para sinalizar (cpf_*, documento_*). Nao bloqueia. INV-AGENT-008." >&2
    break
  done <<< "$ISOLATED_HITS"
fi

# CNPJ: 99.999.999/9999-99
if echo "$CONTENT" | grep -E '\b[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}\b' >/dev/null 2>&1; then
  echo "BLOCKED: possivel CNPJ detectado — viola INV-AGENT-008." >&2
  PII_HIT=1
fi

# Telefone BR mascarado: (DD) 9999-9999 ou (DD) 99999-9999
if echo "$CONTENT" | grep -E '\([0-9]{2}\) [0-9]{4,5}-[0-9]{4}' >/dev/null 2>&1; then
  echo "BLOCKED: possivel telefone brasileiro detectado — viola INV-AGENT-008." >&2
  PII_HIT=1
fi

# Telefone BR com prefixo internacional: +55 DD 9999-9999 (com ou sem espacos/hifen)
if echo "$CONTENT" | grep -E '\+55 ?[0-9]{2} ?[0-9]{4,5}-?[0-9]{4}\b' >/dev/null 2>&1; then
  echo "BLOCKED: possivel telefone +55 detectado — viola INV-AGENT-008." >&2
  PII_HIT=1
fi

# CEP: 99999-999 — apenas WARNING, nao bloqueia (CEP sozinho nao e PII).
if echo "$CONTENT" | grep -E '\b[0-9]{5}-[0-9]{3}\b' >/dev/null 2>&1; then
  echo "WARNING: possivel CEP detectado em $FILE — verifique se combinado com nome/endereco vira PII (INV-AGENT-008)." >&2
fi

# Email pessoal em codigo (apenas em arquivos de codigo: py/js/ts/go/rs).
# Exclui dominios de teste comuns (example.com, test.com, localhost, foo.bar).
case "$FILE" in
  *.py|*.js|*.ts|*.tsx|*.jsx|*.go|*.rs|*.mjs|*.cjs)
    EMAILS=$(echo "$CONTENT" | grep -oE '\b[A-Za-z0-9._+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]+\b' || true)
    if [[ -n "$EMAILS" ]]; then
      while IFS= read -r addr; do
        [[ -z "$addr" ]] && continue
        case "$addr" in
          *@example.com|*@example.org|*@example.net|*@test.com|*@test.local|*@localhost|*@foo.bar|noreply@*|*@anthropic.com)
            continue
            ;;
        esac
        echo "BLOCKED: email pessoal '$addr' em arquivo de codigo $FILE — viola INV-AGENT-008." >&2
        PII_HIT=1
      done <<< "$EMAILS"
    fi
    ;;
esac

if [[ "$HIT" -eq 1 ]]; then
  echo "" >&2
  echo "Acao bloqueada para impedir commit/escrita de credencial em arquivo versionado." >&2
  echo "Use variavel de ambiente, .env (gitignored) ou cofre de segredos." >&2
  echo "Se for falso-positivo (ex: doc explicando formato), abra ADR de excecao." >&2
  exit 2
fi

if [[ "$PII_HIT" -eq 1 ]]; then
  echo "" >&2
  echo "Acao bloqueada para impedir vazamento de PII brasileira (CPF/CNPJ/telefone/email)." >&2
  echo "Referencia: INV-AGENT-008 — agentes nao devem persistir PII em codigo/repositorio." >&2
  echo "Use dados sinteticos (gerador de CPF de teste), .env gitignored, ou mascarar parcialmente." >&2
  echo "Se for fixture intencional, mova para arquivo gitignored ou use placeholder (000.000.000-00)." >&2
  exit 2
fi

exit 0
