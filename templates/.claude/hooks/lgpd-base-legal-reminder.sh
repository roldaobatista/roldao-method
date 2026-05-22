#!/usr/bin/env bash
# lgpd-base-legal-reminder.sh — soft warning quando codigo toca dado pessoal
# sem ADR ou story declarando base legal (LGPD-001 / LGPD-007).
#
# Hook PreToolUse, matcher: Write|Edit.
#
# Por que soft warning (nao bloqueio):
# - Base legal e decisao de PRODUTO/juridico, nao de codigo. Travar Write
#   bloqueia experimentacao legitima.
# - Codigo pode existir antes do ADR (TDD ou prototipo) — bloqueio duro
#   forcaria escrever ADR antes de codigo, invertendo INV-002 (spec gera
#   codigo — mas spec aqui e doutrinaria, nao mecanica).
# - O lembrete e suficiente: agente le e ou (a) adiciona base legal no
#   frontmatter da story, (b) cria ADR-NNNN-base-legal, (c) declara excecao.
#
# Detecta padroes de dado pessoal (LGPD-001) em:
# - declaracao de coluna/campo (cpf, rg, email, telefone, endereco, nascimento)
# - schema/migration (DECIMAL ou VARCHAR proximo dessas palavras)
#
# Considera "documentado" se existe pelo menos 1 dos:
# - docs/decisions/ADR-*lgpd*.md OU docs/decisions/ADR-*base-legal*.md
# - docs/decisions/ADR-*.md contendo "LGPD-001" ou "LGPD-007"
# - docs/stories/US-*.md ATIVA contendo `base-legal:` no frontmatter

set -u

# shellcheck source=_lib.sh
. "$(dirname "$0")/_lib.sh"

INPUT=$(cat)

FILE_PATH=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  print $json->{tool_input}->{file_path} // "";
' 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

# So se aplica a codigo (nao doc, nao test, nao config)
case "$FILE_PATH" in
  *.md|*docs/*|*README*|*CHANGELOG*|*ROADMAP*) exit 0 ;;
  *test/*|*tests/*|*spec/*|*specs/*|*.test.*|*.spec.*) exit 0 ;;
  *.json|*.yaml|*.yml|*.toml|*.ini|*.env*) exit 0 ;;
  *.sh|*.ps1|*.bat) exit 0 ;;
  *.claude/.runtime/*) exit 0 ;;
  *.js|*.jsx|*.ts|*.tsx|*.py|*.go|*.rb|*.java|*.kt|*.cs|*.php|*.rs|*.swift|*.dart|*.sql|*.prisma) ;;
  *) exit 0 ;;
esac

CONTENT=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $c = $json->{tool_input}->{content} // $json->{tool_input}->{new_string} // "";
  print $c;
' 2>/dev/null)

[ -z "$CONTENT" ] && exit 0

# Detecta dado pessoal — palavras isoladas em nome de coluna/campo/variavel.
# Lista propositalmente curta — falso positivo em "telefone_loja" e ruido bem-vindo.
PII_PATTERNS=(
  '\bcpf\b'
  '\bcnpj\b'  # PJ tambem e titular em alguns casos (LGPD aplica a pessoa fisica representante)
  '\brg\b'
  '\bemail\b'
  '\be[-_]mail\b'
  '\btelefone\b'
  '\bcelular\b'
  '\bphone\b'
  '\bendereco\b'
  '\bnascimento\b'
  '\bbirth(date|day)\b'
  '\bnome_(completo|civil)\b'
  '\bgenero\b'
  '\betnia\b'
  '\bbiometria\b'
  '\bsaude\b'
  '\bdiagnostico\b'
)

COMBINED=$(IFS='|'; printf '%s' "${PII_PATTERNS[*]}")
PII_HIT=$(printf '%s' "$CONTENT" | grep -ioE -- "$COMBINED" | head -1 || true)

[ -z "$PII_HIT" ] && exit 0

# Verifica se existe documentacao de base legal
PROJDIR=$(sanitize_projdir 2>/dev/null) || exit 0

DOCUMENTADO=0

# (a) ADR com "lgpd" ou "base-legal" no nome
if find "$PROJDIR/docs/decisions" -maxdepth 2 -name 'ADR-*lgpd*.md' 2>/dev/null | grep -q . ; then
  DOCUMENTADO=1
elif find "$PROJDIR/docs/decisions" -maxdepth 2 -name 'ADR-*base-legal*.md' 2>/dev/null | grep -q . ; then
  DOCUMENTADO=1
fi

# (b) qualquer ADR mencionando LGPD-001 ou LGPD-007
if [ "$DOCUMENTADO" -eq 0 ] && [ -d "$PROJDIR/docs/decisions" ]; then
  if grep -rlE 'LGPD-00[17]' "$PROJDIR/docs/decisions" 2>/dev/null | grep -q . ; then
    DOCUMENTADO=1
  fi
fi

# (c) story ativa com `base-legal:` no frontmatter
if [ "$DOCUMENTADO" -eq 0 ]; then
  SESS=$(sanitize_session_hash)
  FEATURE_MARK="$PROJDIR/.claude/.runtime/feature-active-${SESS}"
  if [ -f "$FEATURE_MARK" ]; then
    US_ID=$(head -1 "$FEATURE_MARK" 2>/dev/null | tr -d '\r\n')
    if [ -n "$US_ID" ]; then
      STORY=$(find "$PROJDIR/docs/stories" -maxdepth 2 -name "${US_ID}-*.md" 2>/dev/null | head -1)
      if [ -n "$STORY" ] && head -50 "$STORY" 2>/dev/null | grep -qiE '^base[-_]legal:'; then
        DOCUMENTADO=1
      fi
    fi
  fi
fi

[ "$DOCUMENTADO" -eq 1 ] && exit 0

# Soft warning em stderr — exit 0 nao bloqueia, so registra no log do agente
cat >&2 <<EOF
[lgpd-base-legal-reminder] AVISO (nao bloqueio):

Arquivo $FILE_PATH menciona "$PII_HIT" — pode ser dado pessoal (LGPD-001).
Nao encontrei ADR de base legal nem campo \`base-legal:\` na story ativa.

Antes de fechar a feature, decida e documente UMA das opcoes:
  (a) ADR-NNNN-base-legal-<contexto>.md citando art. 7 (dados gerais) ou art. 11 (sensiveis).
  (b) Frontmatter da story: \`base-legal: contrato\` (ou consentimento, obrigacao legal, etc.).
  (c) Excecao temporaria com prazo: \`base-legal: a-definir-ate-AAAA-MM-DD\`.

Skill ajuda: \`checklist-lgpd\` tem arvore de decisao das 10 bases legais.

Regras: LGPD-001 (toda coleta exige base legal), LGPD-007 (citar art. 7 ou 11).
Este e aviso doutrinario — auditor-seguranca cobra na auditoria final.
EOF

exit 0
