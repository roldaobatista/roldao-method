#!/usr/bin/env bash
# Template: hook-frontmatter-validator.template.sh
# Destino: .claude/hooks/frontmatter-validator.sh
# Hook evento: PreToolUse
# Matcher: Write|Edit
# referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C9b, CONVENCOES-DOC
# orçamento: <300ms
# protocolo: PreToolUse Write|Edit. Valida frontmatter de *.md ANTES de gravar.
# severidade: ALTO
#
# IMPORTANTE: rodar em PreToolUse (nao PostToolUse). Em PostToolUse, exit 2 sinaliza
# erro mas o arquivo ja foi gravado — nao desfaz a escrita. Aqui lemos o conteudo
# que SERIA escrito a partir do payload (tool_input.content para Write,
# tool_input.new_string para Edit) e bloqueamos antes da gravacao.
#
# STALENESS: documentos criticos (constitution, REGRAS-INEGOCIAVEIS, SECURITY,
# threat-model, AGENTS, CLAUDE, ropa, retencao-dados) com revisado-em mais antigo
# que 365 dias recebem WARNING REFORCADO (nao bloqueiam — ver justificativa na
# secao STALENESS CHECK mais abaixo: bloquear edicao de doc velho cria paradoxo,
# pois o proprio fix passaria a depender de revisar tudo junto). Para nao-criticos,
# WARNING simples. O bloqueio formal e do auditor-doc-quality em pre-merge.
# Datas comparadas em UTC para evitar inconsistencia entre fuso do dev e do CI.
#
# LIMITACAO: bypass trivial via mudar `revisado-em` para data de hoje sem revisar
# de fato. Este hook detecta abandono, nao garante qualidade da revisao. Para
# auditoria real, exigir co-assinatura humana (PR review) em docs criticos.

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
if [[ -z "$FILE" ]]; then
  exit 0
fi

# So valida arquivos .md
case "$FILE" in
  *.md) ;;
  *) exit 0 ;;
esac

# Determina se o arquivo esta em PATH CRITICO. Fora de paths criticos, gera WARN
# em vez de BLOCK — permite NOTES.md, scratch.md, README de subdiretorios pequenos,
# .md legados de terceiros (issue templates upstream, CHANGELOGs externos).
IS_CRITICAL_PATH=0
case "$FILE" in
  */CLAUDE.md|*CLAUDE.md|*/AGENTS.md|*AGENTS.md|*/REGRAS-INEGOCIAVEIS.md|*REGRAS-INEGOCIAVEIS.md|*/constitution.md|*constitution.md)
    IS_CRITICAL_PATH=1
    ;;
  */docs/*|*/.claude/memory/*|*/adr/*|*/ADR-*|*/rfc/*|*/RFC-*)
    IS_CRITICAL_PATH=1
    ;;
  */ROPA.md|*ROPA.md|*/SECURITY.md|*SECURITY.md|*/threat-model.md|*threat-model.md|*/retencao-dados.md|*retencao-dados.md)
    IS_CRITICAL_PATH=1
    ;;
esac

TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Determina o conteudo que SERA escrito apos a operacao.
# Write: tool_input.content e' o arquivo inteiro novo.
# Edit:  tool_input.new_string e' o trecho que substitui old_string — precisamos
#        simular o resultado lendo o arquivo atual (se existir) e aplicando a
#        substituicao para validar o frontmatter final.
CONTENT=""
case "$TOOL" in
  Write)
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
    ;;
  Edit)
    NEW_STRING=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty')
    OLD_STRING=$(echo "$INPUT" | jq -r '.tool_input.old_string // empty')
    if [[ -f "$FILE" ]]; then
      CURRENT=$(cat "$FILE")
      # Se old_string toca as primeiras linhas (frontmatter), simulamos a substituicao
      # usando python para evitar problemas com caracteres especiais no sed.
      if command -v python3 >/dev/null 2>&1; then
        CONTENT=$(CURRENT="$CURRENT" OLD="$OLD_STRING" NEW="$NEW_STRING" python3 -c '
import os
cur = os.environ.get("CURRENT", "")
old = os.environ.get("OLD", "")
new = os.environ.get("NEW", "")
if old and old in cur:
    print(cur.replace(old, new, 1), end="")
else:
    print(cur, end="")
')
      else
        # Fallback: valida frontmatter do arquivo atual + verifica se o new_string
        # contem "---" (pode estar reescrevendo o frontmatter).
        CONTENT="$CURRENT"
      fi
    else
      # Arquivo novo via Edit (raro) — valida o new_string diretamente.
      CONTENT="$NEW_STRING"
    fi
    ;;
  *)
    exit 0
    ;;
esac

if [[ -z "$CONTENT" ]]; then
  exit 0
fi

# Linha 1 precisa ser exatamente "---"
FIRST_LINE=$(echo "$CONTENT" | head -n 1)
if [[ "$FIRST_LINE" != "---" ]]; then
  if [[ "$IS_CRITICAL_PATH" -eq 1 ]]; then
    echo "BLOCKED: $FILE (path critico) nao comecaria com frontmatter '---' na linha 1." >&2
    echo "Adicione bloco YAML no topo. Exemplo:" >&2
    echo "---" >&2
    echo "owner: <responsavel>" >&2
    echo "revisado-em: <YYYY-MM-DD>" >&2
    echo "status: draft" >&2
    echo "---" >&2
    exit 2
  else
    echo "WARNING: $FILE sem frontmatter (path nao-critico, permitido)." >&2
    exit 0
  fi
fi

# Extrai bloco frontmatter (entre o primeiro e o segundo '---')
FM=$(echo "$CONTENT" | awk 'NR==1 && /^---$/ {flag=1; next} flag && /^---$/ {exit} flag {print}')

if [[ -z "$FM" ]]; then
  if [[ "$IS_CRITICAL_PATH" -eq 1 ]]; then
    echo "BLOCKED: $FILE teria '---' mas frontmatter vazio ou sem fechamento." >&2
    exit 2
  fi
  exit 0
fi

# Verifica campos obrigatorios
# ADRs usam taxonomia propria (proposta|aceita|substituida|deprecada).
# Docs vivos de operacao podem usar `ultima-conferencia` em vez de `revisado-em`.
# Detecta ADR por path /adr/ ou basename ADR-*.
case "$FILE" in
  */adr/*|*/ADR-*|ADR-*)
    STATUS_REGEX='^status:[[:space:]]*(proposta|aceita|substituida|deprecada)[[:space:]]*$'
    STATUS_HINT='status (proposta|aceita|substituida|deprecada)'
    DATE_REGEX='^(revisado-em|ultima-conferencia):[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}[[:space:]]*$'
    DATE_HINT='revisado-em ou ultima-conferencia (formato YYYY-MM-DD)'
    ;;
  */docs/operacao/*|templates/backup.template.md|templates/runbook.template.md|templates/on-call.template.md|templates/slo-sli.template.md|templates/change-management.template.md|templates/disaster-recovery.template.md|*/templates/backup.template.md|*/templates/runbook.template.md|*/templates/on-call.template.md|*/templates/slo-sli.template.md|*/templates/change-management.template.md|*/templates/disaster-recovery.template.md)
    STATUS_REGEX='^status:[[:space:]]*(draft|stable|deprecated|superseded)[[:space:]]*$'
    STATUS_HINT='status (draft|stable|deprecated|superseded)'
    DATE_REGEX='^(revisado-em|ultima-conferencia):[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}[[:space:]]*$'
    DATE_HINT='revisado-em ou ultima-conferencia (formato YYYY-MM-DD)'
    ;;
  *)
    STATUS_REGEX='^status:[[:space:]]*(draft|stable|deprecated|superseded)[[:space:]]*$'
    STATUS_HINT='status (draft|stable|deprecated|superseded)'
    DATE_REGEX='^revisado-em:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}[[:space:]]*$'
    DATE_HINT='revisado-em (formato YYYY-MM-DD)'
    ;;
esac

MISSING=()
echo "$FM" | grep -qE "$DATE_REGEX" || MISSING+=("$DATE_HINT")
echo "$FM" | grep -qE "$STATUS_REGEX" || MISSING+=("$STATUS_HINT")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  if [[ "$IS_CRITICAL_PATH" -eq 1 ]]; then
    echo "BLOCKED: frontmatter invalido em $FILE (path critico). Campos faltando/invalidos:" >&2
    for m in "${MISSING[@]}"; do
      echo "  - $m" >&2
    done
    echo "" >&2
    echo "Corrija o frontmatter no topo do arquivo antes de prosseguir." >&2
    exit 2
  else
    echo "WARNING: frontmatter incompleto em $FILE (path nao-critico). Campos faltando:" >&2
    for m in "${MISSING[@]}"; do
      echo "  - $m" >&2
    done
    exit 0
  fi
fi

# ----------------------------------------------------------------------------
# STALENESS CHECK — revisado-em > 365 dias
# ----------------------------------------------------------------------------
# Extrai data do campo revisado-em (ou ultima-conferencia em ADRs/docs vivos). Formato YYYY-MM-DD ja validado acima.
REVISED=$(echo "$FM" | grep -E '^(revisado-em|ultima-conferencia):' | head -n 1 | sed -E 's/^(revisado-em|ultima-conferencia):[[:space:]]*([0-9]{4}-[0-9]{2}-[0-9]{2}).*$/\2/')

if [[ -n "$REVISED" ]]; then
  # Calcula diferenca em dias usando UTC (TZ=UTC garante consistencia).
  # Em Windows/Git Bash, `date -d` esta disponivel (GNU date). Fallback: python3.
  AGE_DAYS=""
  if NOW_TS=$(TZ=UTC date -u +%s 2>/dev/null) && REV_TS=$(TZ=UTC date -u -d "$REVISED" +%s 2>/dev/null); then
    AGE_DAYS=$(( (NOW_TS - REV_TS) / 86400 ))
  elif command -v python3 >/dev/null 2>&1; then
    AGE_DAYS=$(REVISED="$REVISED" python3 -c '
import os, datetime
rev = datetime.datetime.strptime(os.environ["REVISED"], "%Y-%m-%d").replace(tzinfo=datetime.timezone.utc)
now = datetime.datetime.now(datetime.timezone.utc)
print((now - rev).days)
' 2>/dev/null || true)
  fi

  if [[ -z "$AGE_DAYS" ]]; then
    echo "WARNING: nao consegui calcular idade de $FILE; instale GNU date ou python3 para validar staleness." >&2
  elif [[ "$AGE_DAYS" -gt 365 ]]; then
    # Lista de docs criticos (basename sem extensao OU substring no path).
    CRITICAL_PATTERNS=(
      'constitution'
      'REGRAS-INEGOCIAVEIS'
      'SECURITY'
      'threat-model'
      'AGENTS'
      'CLAUDE'
      'ropa'
      'retencao-dados'
      'MAINTAINERS'
    )
    IS_CRITICAL=0
    for pat in "${CRITICAL_PATTERNS[@]}"; do
      # Match case-insensitive na ultima parte do path
      BASENAME=$(basename "$FILE")
      if echo "$BASENAME" | grep -iE -- "$pat" >/dev/null 2>&1; then
        IS_CRITICAL=1
        break
      fi
    done

    # STALENESS: apenas WARNING (nao bloqueia edicao).
    # Bloquear edicao em doc velho cria paradoxo: o proprio fix do typo
    # passa a depender de "atualizar revisado-em junto", e o agente trava
    # em mudanca trivial. Politica: avisa para revisar; o auditor-doc-quality
    # cobra revisao formal em pre-merge, nao no momento da edicao.
    TODAY=$(TZ=UTC date -u +"%Y-%m-%d" 2>/dev/null || python3 -c 'import datetime; print(datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d"))')
    if [[ "$IS_CRITICAL" -eq 1 && "$REVISED" != "$TODAY" ]]; then
      echo "WARNING: $FILE (doc CRITICO) tem revisado-em=$REVISED ($AGE_DAYS dias > 365). Considere atualizar revisado-em para $TODAY na mesma edicao e revisar o conteudo. UTC." >&2
    elif [[ "$IS_CRITICAL" -ne 1 ]]; then
      echo "WARNING: $FILE tem revisado-em=$REVISED ($AGE_DAYS dias) — considere revisar." >&2
    fi
  fi
fi

exit 0
