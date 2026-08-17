#!/usr/bin/env bash
# bootstrap-fase-2.sh — fase 2 (pós-descoberta) do meta-template "Modelo Projeto Novo".
#
# Adiciona C5, C6 e C8 ao projeto destino conforme o tipo DEFINITIVO classificado
# após a descoberta (C1) ficar com docs/descoberta/sintese-final.md em status: stable.
#
# Uso:
#   bash bootstrap-fase-2.sh <destino-absoluto> <tipo-definitivo>
#
# Pré-requisitos (validados pelo script):
#   1. <destino> existe e contém docs/descoberta/sintese-final.md.
#   2. sintese-final.md tem status: stable no frontmatter.
#   3. sintese-final.md tem conteúdo de verdade (não só "stable" num arquivo
#      vazio ou só com lembretes a preencher).
#   4. <tipo-definitivo> é um dos valores válidos.
#
# Se algum pré-requisito falhar, o script aborta com mensagem clara.
#
# Tipos válidos (idem à árvore §15 do manual):
#   solo | experimento | cli | lib | oss-lib | interno | saas | saas-regulado |
#   mobile | desktop | ia-ml | pipeline | bot | browser-ext | ide-ext |
#   embedded | jogo | smart-contract | api-microservice
#
# Após esta fase:
#   - C5 kickoff-foundation criado (foundation F-A — auth + multi-tenant + observabilidade).
#   - C6 conformidade criada conforme tipo (LGPD completa para projetos com PII;
#     threat-model + dependency-policy + criptografia/chaves/resposta a incidente
#     para projetos com superfície externa).
#   - C8 operação criada conforme tipo (runbooks/on-call/backup/DR/observabilidade
#     apenas para projetos com produção/usuário externo).
#   - C12 comunidade criada se oss-lib.

set -euo pipefail

# ---------- 1. validação de argumentos ----------

if [[ $# -lt 2 ]]; then
  echo "ERRO: uso: bash bootstrap-fase-2.sh <destino-absoluto> <tipo-definitivo>" >&2
  echo "Tipos: solo|experimento|cli|lib|oss-lib|interno|saas|saas-regulado|mobile|desktop|ia-ml|pipeline|bot|browser-ext|ide-ext|embedded|jogo|smart-contract|api-microservice" >&2
  exit 2
fi

DESTINO="$1"
TIPO="$2"
HOJE="$(date +%Y-%m-%d)"
DONO="${USER:-roldao}"
META_DIR="$(cd "$(dirname "$0")" && pwd)"

case "$TIPO" in
  solo|experimento|cli|lib|oss-lib|interno|saas|saas-regulado|mobile|desktop|ia-ml|pipeline|bot|browser-ext|ide-ext|embedded|jogo|smart-contract|api-microservice) ;;
  a-descobrir)
    echo "ERRO: tipo 'a-descobrir' não é válido na fase-2. Classifique o tipo DEFINITIVO antes." >&2
    exit 2 ;;
  *) echo "ERRO: tipo '$TIPO' inválido." >&2; exit 2 ;;
esac

# ---------- 2. validação do estado do destino ----------

if [[ ! -d "$DESTINO" ]]; then
  echo "ERRO: destino '$DESTINO' não existe. Rode bootstrap.sh (fase-1) primeiro." >&2
  exit 2
fi

SINTESE="$DESTINO/docs/descoberta/sintese-final.md"
if [[ ! -f "$SINTESE" ]]; then
  echo "ERRO: '$SINTESE' não existe. Rode bootstrap.sh (fase-1) primeiro e preencha C1." >&2
  exit 2
fi

STATUS=$(awk '/^---$/{f++; next} f==1 && /^status:/ {gsub(/^status:[[:space:]]*/, ""); print; exit}' "$SINTESE" 2>/dev/null || echo "")
STATUS=$(echo "$STATUS" | tr -d '[:space:]')

if [[ "$STATUS" != "stable" ]]; then
  cat >&2 <<EOF
ERRO: sintese-final.md tem status='${STATUS:-vazio}', esperado 'stable'.

A fase-2 só roda DEPOIS da descoberta ser fechada. Fluxo correto:
  1. Preencher todos os arquivos em docs/descoberta/* (problema → personas → ... → sintese-final).
  2. Mudar status: draft → stable em sintese-final.md (frontmatter).
  3. Rodar de novo este script.

Se quer pular descoberta (projeto micro / experimento ≤2 dias), use:
  - bootstrap.sh com tipo-tentativo='experimento' OU 'solo'
  - criar .claude/.phase-gate-disabled no destino para desligar o gate

Ver QUICKSTART.md e ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3.
EOF
  exit 2
fi

# Confere que a síntese tem CONTEÚDO de verdade, não só "status: stable" num arquivo
# que continua sendo o template em branco. Heurística de linha (descartar #, >, <...>,
# tabelas) NÃO basta: o template tem ~50 linhas de esqueleto (listas "- **Label**: <ph>",
# checklists, tabelas-modelo) que parecem prosa. A medida confiável é DIFERENÇA contra
# o próprio template: conta as linhas que o dono REESCREVEU/ADICIONOU (ausentes, literais,
# no template canônico). Preencher um placeholder muda a linha => conta; deixar o
# esqueleto intacto => não conta. Frontmatter (status/datas) é descartado do cômputo.
TEMPLATE_SINTESE="$META_DIR/templates/sintese-final.template.md"
if [[ -f "$TEMPLATE_SINTESE" ]]; then
  CORPO_REAL=$(grep -Fxv -f "$TEMPLATE_SINTESE" "$SINTESE" 2>/dev/null \
    | grep -vE '^[[:space:]]*$' \
    | grep -vE '^(status|revisado-em|ultima-conferencia|owner|idioma|proposito|limite-linhas|ordem-descoberta|name):' \
    | grep -vE '^[[:space:]]*<!--' \
    | grep -vE 'TODO|TO-?DO|PREENCHER|A DEFINIR|A DESCOBRIR' \
    | grep -cE '.' || echo "0")
else
  # Fallback (template não encontrado): heurística de linha, menos precisa.
  CORPO_REAL=$(awk '
    BEGIN { fm=0; inc=0; n=0 }
    /^---[[:space:]]*$/ { fm++; next }
    fm < 2 { next }
    {
      if (inc) { if ($0 ~ /-->/) inc=0; next }
      if ($0 ~ /<!--/ && $0 !~ /-->/) { inc=1; next }
      if ($0 ~ /<!--.*-->/) next
      if ($0 ~ /^[[:space:]]*$/) next
      if ($0 ~ /^[[:space:]]*#/) next
      if ($0 ~ /^[[:space:]]*>/) next
      if ($0 ~ /TODO|TO-?DO|PREENCHER|A DEFINIR|A DESCOBRIR/) next
      tmp=$0
      gsub(/\|/, "", tmp); gsub(/<[^>]*>/, "", tmp); gsub(/[-[:space:]]/, "", tmp)
      if (tmp == "") next
      n++
    }
    END { print n+0 }
  ' "$SINTESE" 2>/dev/null || echo "0")
fi

if [[ "${CORPO_REAL:-0}" -lt 8 ]]; then
  cat >&2 <<EOF
ERRO: sintese-final.md está marcada como pronta (status: stable), mas o conteúdo
parece vazio ou só com lembretes a preencher (apenas ${CORPO_REAL:-0} linhas de fato escritas).

A fase-2 não pode prosseguir com uma descoberta de fachada. Antes de continuar:
  1. Escreva de verdade a síntese da descoberta em docs/descoberta/sintese-final.md
     (decisão de tipo do produto, principais riscos, o que entra e o que NÃO entra).
  2. Confirme com o dono que o entendimento do produto fechou.
  3. Só então rode de novo este script.

Marcar 'pronta' sem preencher escondia o problema e quebrava as etapas seguintes.
Ver QUICKSTART.md e ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3.
EOF
  exit 2
fi

cd "$DESTINO"
echo "[bootstrap fase-2: pós-descoberta]"
echo "  destino: $DESTINO"
echo "  tipo definitivo: $TIPO"
echo "  sintese-final.md: status=stable ✓"
echo ""

# ---------- 3. helpers ----------

copy_template() {
  local src="$META_DIR/templates/$1"
  local dst="$DESTINO/$2"
  if [[ ! -f "$src" ]]; then
    echo "[skip] template inexistente: $1" >&2
    return 0
  fi
  # Calcula o nome FINAL materializado (após remove_template_suffix) para checar se
  # já existe. Os destinos têm a forma "nome.md.template.md" — o arquivo final é
  # "nome.md". O guard antigo checava "${dst%.template.md}.md" (= "nome.md.md",
  # nunca existe) e "${dst%.template}" (sufixo errado), então NUNCA reconhecia o
  # arquivo já preenchido e o sobrescrevia ao re-rodar a fase-2.
  local final_dst="$dst"
  case "$dst" in
    *.template.md)   final_dst="${dst%.template.md}" ;;
    *.template.sh)   final_dst="${dst%.template.sh}" ;;
    *.template.yaml) final_dst="${dst%.template.yaml}" ;;
    *.template.json) final_dst="${dst%.template.json}" ;;
    *.template)      final_dst="${dst%.template}" ;;
  esac
  if [[ -f "$dst" || -f "$final_dst" ]]; then
    echo "[mantém] $2 já existe — não sobrescreve" >&2
    return 0
  fi
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  echo "[copiado] $1 -> $2"
}

replace_placeholders() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  sed -i \
    -e "s|<NomeDoProjeto>|${PROJECT_NAME:-projeto}|g" \
    -e "s|<YYYY-MM-DD>|${HOJE}|g" \
    -e "s|<quem>|${DONO}|g" \
    -e "s|<dono-do-projeto>|${DONO}|g" \
    -e "s|<modelo>|claude-sonnet-4-6|g" \
    -e "s|<tipo>|${TIPO}|g" \
    "$f"
}

remove_template_suffix() {
  # Os destinos já embutem a extensão final ANTES do marcador .template
  # (ex.: "threat-model.md.template.md"). Removemos APENAS o marcador
  # .template[.ext]; NÃO re-adicionamos a extensão — senão geraríamos
  # extensão dobrada (threat-model.md.md).
  local f="$1"
  [[ -f "$f" ]] || return 0
  local novo
  case "$f" in
    *.template.md)   novo="${f%.template.md}" ;;
    *.template.sh)   novo="${f%.template.sh}" ;;
    *.template.yaml) novo="${f%.template.yaml}" ;;
    *.template.json) novo="${f%.template.json}" ;;
    *.template)      novo="${f%.template}" ;;
    *) return 0 ;;
  esac
  mv "$f" "$novo"
}

# Detecta o nome do projeto a partir do título do AGENTS.md materializado, que é
# "# AGENTS.md — <Nome>". Extrai só o que vem após o travessão; sem isso o nome
# capturado seria a linha inteira ("AGENTS.md — <Nome>") e poluiria os cabeçalhos
# dos docs da fase-2 (ex.: "# Threat Model — AGENTS.md — <Nome>").
PROJECT_NAME=$(awk -F' — ' '/^# / { print $2; exit }' "$DESTINO/AGENTS.md" 2>/dev/null | head -c 80 || echo "projeto")
PROJECT_NAME="${PROJECT_NAME:-projeto}"

# ---------- 4. C5 — faseamento (foundation F-A) ----------

copy_template "kickoff-foundation.template.md" "docs/faseamento/F-A/kickoff.md.template.md"

# ---------- 5. C6 — segurança (quase sempre) ----------

case "$TIPO" in
  experimento|solo) ;; # pula
  *)
    copy_template "threat-model.template.md"      "docs/seguranca/threat-model.md.template.md"
    copy_template "dependency-policy.template.md" "docs/seguranca/dependency-policy.md.template.md"
    copy_template "criptografia-policy.template.md" "docs/seguranca/criptografia-policy.md.template.md"
    copy_template "key-management-policy.template.md" "docs/seguranca/key-management-policy.md.template.md"
    copy_template "resposta-incidente.template.md" "docs/seguranca/resposta-incidente.md.template.md"
    ;;
esac

# ---------- 6. C6 — conformidade LGPD (só se regulado / trata PII) ----------

case "$TIPO" in
  saas-regulado|saas|interno|mobile|bot)
    copy_template "ropa.template.md"           "docs/conformidade/lgpd/ropa.md.template.md"
    copy_template "retencao-dados.template.md" "docs/conformidade/lgpd/retencao-dados.md.template.md"
    copy_template "direitos-do-titular.template.md" "docs/conformidade/lgpd/direitos-do-titular.md.template.md"
    copy_template "dpo-action-plan.template.md" "docs/conformidade/lgpd/dpo-action-plan.md.template.md"
    copy_template "aipd.template.md" "docs/conformidade/lgpd/aipd.md.template.md"
    copy_template "atender-pedido-eliminacao-runbook.template.md" "docs/operacao/runbooks/atender-pedido-eliminacao.md.template.md"
    ;;
esac

# ---------- 7. C8 — operação (só projetos com produção/usuário externo) ----------

case "$TIPO" in
  saas|saas-regulado|api-microservice|mobile|desktop|bot|interno)
    for t in runbook on-call backup disaster-recovery change-management \
             observabilidade release-process deployment-strategy \
             capacity-planning performance-testing slo-sli; do
      copy_template "${t}.template.md" "docs/operacao/${t}.md.template.md"
    done
    ;;
  oss-lib|lib|cli)
    copy_template "release-process.template.md" "docs/operacao/release-process.md.template.md"
    ;;
  ia-ml)
    for t in runbook observabilidade release-process deployment-strategy performance-testing; do
      copy_template "${t}.template.md" "docs/operacao/${t}.md.template.md"
    done
    ;;
  pipeline)
    for t in runbook on-call observabilidade slo-sli backup; do
      copy_template "${t}.template.md" "docs/operacao/${t}.md.template.md"
    done
    ;;
esac

# ---------- 8. C12 — comunidade (oss-lib) ----------

if [[ "$TIPO" == "oss-lib" ]]; then
  copy_template "governanca-comunidade.template.md" "docs/comunidade/governanca.md.template.md"
fi

# ---------- 9. renomeação e substituição ----------

# Só passamos ao find as pastas que de fato foram criadas (variam por tipo).
# Listar uma pasta inexistente faria o find sair com código 1 e, sob
# 'set -euo pipefail', abortaria o script antes do relatório final.
DIRS_FASE2=()
for d in faseamento seguranca conformidade operacao comunidade; do
  [[ -d "$DESTINO/docs/$d" ]] && DIRS_FASE2+=("$DESTINO/docs/$d")
done

# Rede de segurança: se nenhuma pasta foi criada (ex.: C5 algum dia virar
# condicional), `find "${DIRS_FASE2[@]}"` viraria `find` sem path e varreria o cwd
# inteiro (= $DESTINO), renomeando/substituindo arquivos fora do escopo da fase-2.
if [[ ${#DIRS_FASE2[@]} -eq 0 ]]; then
  echo "[bootstrap fase-2] nenhuma pasta da fase-2 criada para este tipo — nada a renomear."
  CONTAGEM_NOVOS=0
else
  echo ""
  echo "[bootstrap fase-2] renomeando arquivos .template..."
  while IFS= read -r -d '' f; do
    remove_template_suffix "$f"
  done < <(find "${DIRS_FASE2[@]}" -type f \( -name "*.template.md" -o -name "*.template" \) -print0)

  echo "[bootstrap fase-2] substituindo placeholders..."
  while IFS= read -r -d '' f; do
    replace_placeholders "$f"
  done < <(find "${DIRS_FASE2[@]}" -type f -name "*.md" -print0)

  CONTAGEM_NOVOS=$(find "${DIRS_FASE2[@]}" -type f -name "*.md" | wc -l | tr -d ' ')
fi

# ---------- 10. relatório final ----------

echo ""
echo "==============================================="
echo "[bootstrap fase-2] CONCLUÍDO"
echo "==============================================="
echo "Destino:           $DESTINO"
echo "Tipo definitivo:   $TIPO"
echo "Arquivos novos:    $CONTAGEM_NOVOS"
echo ""
echo "PRÓXIMOS PASSOS PARA O AGENTE:"
echo "  1. preencher placeholders nos arquivos novos (busque por '<' em .md)"
echo "  2. registrar em docs/nao-aplica.md o que NÃO foi materializado (ex: LGPD se não-PII)"
echo "  3. abrir ADR-0001 (stack) e ADR-0002 (tenancy/storage) em docs/adr/ — agora pode!"
echo "  4. quando ADRs aceitas, atualizar .agent/CURRENT.md apontando para foundation F-A"
echo "  5. começar tasks T-NNN da foundation"
echo ""
echo "O phase-gate.sh continua bloqueando escrita em src/ até ADR-0001 (stack) estar aceita."
echo "Quando ADR-0001 for aceita, agente pode começar a implementar."
