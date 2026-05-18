#!/usr/bin/env bash
# validate-test-pyramid.sh — bloqueia criacao de E2E quando faltam unit tests no mesmo modulo.
# Hook PreToolUse, matcher: Write|Edit.
# TST-001 (anti-mascaramento), TST-002 (causa raiz) — piramide invertida = sintoma.

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

# Detecta se e teste E2E
IS_E2E=""
case "$FILE_PATH" in
  *e2e/*|*e2e-tests/*|*end-to-end/*|*.e2e.*|*playwright/*|*cypress/integration/*|*cypress/e2e/*) IS_E2E=1 ;;
esac
[ -z "$IS_E2E" ] && exit 0

# Identifica modulo / area (ex: src/auth/login.e2e.ts -> src/auth)
MODULE_DIR=$(dirname "$FILE_PATH")
# Sobe um nivel se estamos dentro de e2e/
case "$MODULE_DIR" in
  */e2e|*/e2e-tests|*/end-to-end|*/playwright|*/cypress|*/cypress/e2e|*/cypress/integration)
    MODULE_DIR=$(dirname "$MODULE_DIR")
    ;;
esac

# Sanitizacao defensiva: FILE_PATH vem do JSON do Claude (atacante via prompt
# manipulado pode tentar "../../../etc/passwd.e2e.ts"). Recusa qualquer '..'
# ou caminho absoluto fora do projeto.
case "$MODULE_DIR" in
  *..*|/*|*:\\*) exit 0 ;;
esac

PROJDIR=$(sanitize_projdir) || exit 2

# NÃO depender de o diretório já existir: ao criar o PRIMEIRO E2E o módulo
# ainda não existe — `cd` falharia e o hook nunca bloquearia (era o bug).
# Segurança já garantida acima (sem '..', sem path absoluto), então o destino
# é, por construção, $PROJDIR/$MODULE_DIR dentro do projeto.

# Procura unit tests no mesmo modulo (extensao .test, .spec OR dentro de __tests__/)
UNIT_COUNT=0
if [ -d "$PROJDIR/$MODULE_DIR" ]; then
  UNIT_COUNT=$(find "$PROJDIR/$MODULE_DIR" -type f \( \
    -name '*.test.js' -o -name '*.test.ts' -o -name '*.test.jsx' -o -name '*.test.tsx' -o \
    -name '*.spec.js' -o -name '*.spec.ts' -o -name '*.spec.jsx' -o -name '*.spec.tsx' -o \
    -name 'test_*.py' -o -name '*_test.py' -o -name '*_test.go' \
    \) ! -path '*/e2e/*' ! -path '*/e2e-tests/*' 2>/dev/null | wc -l | tr -d ' ')
fi

# Conta E2Es ja existentes no modulo
E2E_COUNT=0
if [ -d "$PROJDIR/$MODULE_DIR" ]; then
  E2E_COUNT=$(find "$PROJDIR/$MODULE_DIR" -type f \( -name '*.e2e.*' -o -path '*/e2e/*' -o -path '*/cypress/*' -o -path '*/playwright/*' \) 2>/dev/null | wc -l | tr -d ' ')
fi

# Heurística: se modulo nao tem NENHUM unit test e ja temos E2E sendo criado, bloqueia
if [ "$UNIT_COUNT" -eq 0 ] && [ "$E2E_COUNT" -le 5 ]; then
  cat >&2 <<EOF
[validate-test-pyramid] BLOQUEADO: criacao de teste E2E sem unit tests no modulo.

Arquivo: $FILE_PATH
Modulo: $MODULE_DIR
Unit tests no modulo: $UNIT_COUNT
E2E tests no modulo: $E2E_COUNT (sendo criado mais um)

Regra: TST-001 + TST-002. E2E e lento, fragil, caro de manter. Sem unit cobrindo
casos de borda da logica, E2E vira teste de fumaca caro que nao da feedback util.

Pira mide saudavel:
  - Muitos unit tests (rapidos, isolados)
  - Alguns integration tests
  - Poucos E2E (smoke tests do happy path)

Acao recomendada:
  1. Antes de adicionar E2E, escreva unit tests cobrindo logica de borda do modulo.
  2. Se ja tem unit suficiente mas hooks nao detectou, configure pasta esperada
     (este hook procura *.test.ts, *.spec.ts, test_*.py, etc).

Excecao: se este E2E e o primeiro teste do projeto greenfield, autorize criando:
  mkdir -p $PROJDIR/.claude/.runtime && touch $PROJDIR/.claude/.runtime/allow-e2e-first
EOF
  # Permitir override
  if [ -f "$PROJDIR/.claude/.runtime/allow-e2e-first" ]; then
    exit 0
  fi
  exit 2
fi

exit 0
