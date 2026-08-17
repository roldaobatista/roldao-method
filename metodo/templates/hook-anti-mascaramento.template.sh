#!/usr/bin/env bash
# template: .claude/hooks/anti-mascaramento.sh
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C9b, REGRAS-INEGOCIAVEIS (causa raiz, nunca sintoma)
# orçamento: <300ms
# protocolo: PreToolUse Write|Edit. Detecta padroes de mascaramento de teste/lint.
# severidade: ALTO

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

# CUIDADO: usar `// ""` e NAO `// empty`. Com `// empty`, quando o campo ausente
# vira o stream vazio, a concatenacao `$w + "\n" + $e` colapsa para VAZIO — ou seja,
# todo Write puro (so .content, sem .new_string) passava sem deteccao nenhuma.
# Mesmo bug documentado em hook-secrets-scanner. Com `// ""` a concatenacao preserva
# o conteudo real e o mascaramento volta a ser detectado em Write e Edit.
CONTENT=$(echo "$INPUT" | jq -r '((.tool_input.content // "") + "\n" + (.tool_input.new_string // ""))' 2>/dev/null || echo "")

FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ -z "${CONTENT//[$'\n\r[:space:]']/}" ]]; then
  exit 0
fi

# Ignora docs (.md), CLAUDE/AGENTS/REGRAS — citam os padroes proibidos.
# Ignora workflows de CI, ADRs, RFCs, postmortems, CHANGELOG — citam legitimamente
# (ex: postmortem explica "fizemos --no-verify por isso falhou").
case "$FILE" in
  *.md|*CLAUDE*|*AGENTS*|*REGRAS*|*hook-anti-mascaramento*|*CHANGELOG*)
    exit 0
    ;;
  */adr/*|*/ADR-*|*/rfc/*|*/RFC-*|*/postmortems/*|*/post-mortems/*)
    exit 0
    ;;
  */.github/workflows/*.yml|*/.github/workflows/*.yaml)
    exit 0
    ;;
  *.gitlab-ci.yml|*bitbucket-pipelines.yml|*.circleci/config.yml|*azure-pipelines.yml|*azure-pipelines.yaml)
    exit 0
    ;;
esac

# CATEGORIA A: padroes BLOCK (mascaramento real — sem dois usos legitimos).
# Sao infracoes claras de causa-raiz: assercoes vazias, ignores de lint global, || true em teste.
PATTERNS_BLOCK=(
  'assertTrue(true) — assercao vazia|assertTrue\([[:space:]]*true[[:space:]]*\)'
  'assert(true) — assercao vazia|\bassert\([[:space:]]*true[[:space:]]*\)'
  'expect(true).toBe(true) — assercao vazia|expect\([[:space:]]*true[[:space:]]*\)\.toBe\([[:space:]]*true[[:space:]]*\)'
  'comentario @ts-ignore|@ts-ignore'
  'comentario eslint-disable|eslint-disable'
  'runner de teste mascarado com OR-true (rodar com fallback sempre-verde)|(npm|yarn|pnpm|pytest|jest|vitest|mocha|go[[:space:]]+test|cargo[[:space:]]+test|make|gradle|gradlew|\./gradlew|mvn|bazel|tox|nox|rake|ctest|ginkgo|phpunit|rspec|bundle[[:space:]]+exec|dotnet[[:space:]]+test|gotestsum)[[:space:]].*\|\|[[:space:]]*true'
  'flag --no-verify (pula hook git)|--no-verify\b'
  'flag --skip-tests|--skip-tests\b'
  'flag --ignore-tests|--ignore-tests\b'
  'comentario "assertion relaxada"|assertion[[:space:]]+relaxada'
)

# CATEGORIA B: padroes WARN (uso pode ser legitimo em debug iterativo).
# .skip/xit/.only sao validos durante debug; pre-commit pega antes do push.
# @ts-expect-error e melhor que @ts-ignore (ao menos forca o erro a existir).
PATTERNS_WARN=(
  'teste pulado (.skip)|(describe|it|test|context|fit|fdescribe)\.skip[[:space:]]*\('
  'teste pulado (xit/xdescribe)|\b(xit|xdescribe|xtest)[[:space:]]*\('
  'teste focado (.only) — fura suite se commitado|(describe|it|test|context|fit|fdescribe)\.only[[:space:]]*\('
  'comentario @ts-expect-error|@ts-expect-error'
  'pragma pytest skip ignore|#[[:space:]]*(noqa|type:[[:space:]]*ignore|pragma:[[:space:]]*no[[:space:]]+cover)'
)

HIT=0
for entry in "${PATTERNS_BLOCK[@]}"; do
  label="${entry%%|*}"
  regex="${entry#*|}"
  if echo "$CONTENT" | grep -iE -- "$regex" >/dev/null 2>&1; then
    echo "BLOCKED: mascaramento detectado — $label" >&2
    HIT=1
  fi
done

for entry in "${PATTERNS_WARN[@]}"; do
  label="${entry%%|*}"
  regex="${entry#*|}"
  if echo "$CONTENT" | grep -iE -- "$regex" >/dev/null 2>&1; then
    echo "WARNING: padrao de mascaramento detectado em $FILE — $label" >&2
    echo "  (uso legitimo em debug; pre-commit ira bloquear antes do push se persistir)" >&2
  fi
done

if [[ "$HIT" -eq 1 ]]; then
  echo "" >&2
  echo "REGRA-INEGOCIAVEL: corrija a CAUSA RAIZ. Nao mascare teste/lint." >&2
  echo "Teste falhou = problema no sistema. Conserte o codigo, nao a assercao." >&2
  echo "Se precisar de excecao temporaria justificada, abra ADR e use .claude/.override-reason." >&2
  exit 2
fi

exit 0
