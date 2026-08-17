#!/usr/bin/env bash
# bootstrap.sh — fase 1 (descoberta-first) da camada metodo/ do roldao-method.
#
# Cria APENAS:
#   - C0 raiz (README, AGENTS, CLAUDE, REGRAS, CONTRIBUTING, SECURITY exceto
#     experimento, MAINTAINERS,
#     CHECKLIST, CODEOWNERS, CHANGELOG, LICENSE, .gitignore, .pre-commit-config.yaml).
#   - C1 descoberta completa (16 docs em docs/descoberta + docs/glossario.md:
#     problema, personas, jornadas, BMC, VPC, gtm-pricing, concorrentes,
#     nao-fazer, riscos, restricoes, hipoteses-a-validar, metricas-chave,
#     mercado-regulatorio, dados-existentes, integracoes-externas,
#     sintese-final + glossario).
#   - C9 harness (AGENTS/Claude/Cursor/Windsurf/Kiro + settings.json + hooks
#     + .claude/memory/constitution.md + .agent/CURRENT.md + .claude/agents/maestro.md).
#   - C10 convenções (CONVENCOES-DOC, INDICE, documentos-do-projeto, nao-aplica).
#   - C7 esqueleto (catalogo-auditores).
#   - C2 pasta vazia (docs/adr/).
#
# NÃO cria (deixa para a fase-2, depois de sintese-final.md ficar stable):
#   - C6 conformidade (LGPD / threat-model / dependency-policy).
#   - C8 operação (runbooks, on-call, backup, DR, observabilidade, etc.).
#   - C5 faseamento (kickoff-foundation só é criado quando ADRs forem aceitas).
#
# Por que separar: a CATEGORIA do projeto (SaaS regulado? CLI? lib OSS?) sai da
# descoberta. Materializar templates de C6/C8 antes de C1 fechar é colocar carro
# na frente do boi — pode criar threat-model num projeto que nem trata PII.
#
# Uso:
#   bash bootstrap.sh <destino-absoluto> <nome-do-projeto> [tipo-tentativo]
#
# Exemplos:
#   bash bootstrap.sh "C:/PROJETOS/padaria-saas" "Padaria SaaS"
#   bash bootstrap.sh "C:/PROJETOS/tempo-cli"   "tempo-cli" cli
#
# O argumento <tipo-tentativo> é OPCIONAL — serve só para o agente registrar a
# hipótese inicial em .agent/CURRENT.md. A classificação DEFINITIVA é feita após
# sintese-final.md ficar stable e rodar bootstrap-fase-2.sh.
#
# Após este bootstrap:
#   1. agente preenche C1 (problema → personas → jornadas → ... → sintese-final).
#   2. quando sintese-final.md vira status: stable, agente classifica o tipo.
#   3. agente roda bootstrap-fase-2.sh para materializar C6/C8 conforme tipo.

set -euo pipefail

# ---------- 1. validação de argumentos ----------

if [[ $# -lt 2 ]]; then
  echo "ERRO: uso: bash bootstrap.sh <destino-absoluto> <nome-do-projeto> [tipo-tentativo]" >&2
  echo "Tipos tentativos: solo|experimento|cli|lib|oss-lib|interno|saas|saas-regulado|mobile|desktop|ia-ml|pipeline|bot|browser-ext|ide-ext|embedded|jogo|smart-contract|api-microservice" >&2
  exit 2
fi

DESTINO="$1"
NOME="$2"
TIPO_TENTATIVO="${3:-a-descobrir}"
HOJE="$(date +%Y-%m-%d)"
DONO="${USER:-roldao}"
META_DIR="$(cd "$(dirname "$0")" && pwd)"

case "$TIPO_TENTATIVO" in
  a-descobrir|solo|experimento|cli|lib|oss-lib|interno|saas|saas-regulado|mobile|desktop|ia-ml|pipeline|bot|browser-ext|ide-ext|embedded|jogo|smart-contract|api-microservice) ;;
  *) echo "ERRO: tipo-tentativo '$TIPO_TENTATIVO' inválido." >&2; exit 2 ;;
esac

if [[ "$DESTINO" == "$META_DIR" ]]; then
  echo "ERRO: destino é a própria pasta do meta-template. Escolha outra pasta." >&2
  exit 2
fi

# ---------- 2. criação do destino ----------

if [[ -d "$DESTINO" ]]; then
  if [[ -n "$(ls -A "$DESTINO" 2>/dev/null | grep -v '^\.git$' || true)" ]]; then
    echo "ERRO: destino '$DESTINO' não está vazio (ignorando .git). Aborte ou escolha outro caminho." >&2
    exit 2
  fi
else
  mkdir -p "$DESTINO"
fi

cd "$DESTINO"

echo "[bootstrap fase-1: descoberta-first]"
echo "  destino:        $DESTINO"
echo "  nome:           $NOME"
echo "  tipo tentativo: $TIPO_TENTATIVO (a classificação DEFINITIVA sai da descoberta)"
echo "  meta-template:  $META_DIR"
echo ""

# ---------- 3. helpers ----------

copy_template() {
  local src="$META_DIR/templates/$1"
  local dst="$DESTINO/$2"
  if [[ ! -f "$src" ]]; then
    echo "[skip] template inexistente: $1" >&2
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
    -e "s|<NomeDoProjeto>|${NOME}|g" \
    -e "s|<nome-do-projeto>|${NOME}|g" \
    -e "s|<YYYY-MM-DD>|${HOJE}|g" \
    -e "s|<quem>|${DONO}|g" \
    -e "s|<dono-do-projeto>|${DONO}|g" \
    -e "s|<modelo>|claude-sonnet-4-6|g" \
    -e "s|<tipo>|${TIPO_TENTATIVO}|g" \
    "$f"
}

remove_template_suffix() {
  # Os destinos já embutem a extensão final ANTES do marcador .template
  # (ex.: "problema.md.template.md", "block-destructive.sh.template.sh").
  # Aqui removemos APENAS o marcador .template[.ext]; NÃO re-adicionamos a
  # extensão — senão geraríamos extensão dobrada (problema.md.md).
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

# ---------- 4. C0 — raiz (sempre) ----------

copy_template "README.template.md"                "README.md.template.md"
copy_template "AGENTS.template.md"                "AGENTS.md.template.md"
copy_template "CLAUDE.template.md"                "CLAUDE.md.template.md"
copy_template "REGRAS-INEGOCIAVEIS.template.md"   "REGRAS-INEGOCIAVEIS.md.template.md"
copy_template "CHECKLIST-PRONTO-PRA-CODAR.template.md" "CHECKLIST-PRONTO-PRA-CODAR.md.template.md"
copy_template "CONTRIBUTING.template.md"          "CONTRIBUTING.md.template.md"
copy_template "MAINTAINERS.template.md"           "MAINTAINERS.md.template.md"
if [[ "$TIPO_TENTATIVO" == "experimento" ]]; then
  echo "[pulado] SECURITY.template.md -> SECURITY.md (experimento descartável)"
else
  copy_template "SECURITY.template.md"            "SECURITY.md.template.md"
fi
copy_template "CODEOWNERS.template"               "CODEOWNERS.template"
copy_template "CHANGELOG.template.md"             "CHANGELOG.md.template.md"
copy_template "LICENSE.template"                  "LICENSE.template"
copy_template "gitignore.template"                ".gitignore.template"
copy_template "pre-commit-config.template.yaml"   ".pre-commit-config.yaml.template.yaml"

# ---------- 5. C9 — harness multi-ferramenta (sempre) ----------

copy_template "cursorrules.template"              ".cursorrules.template"
copy_template "windsurfrules.template"            ".windsurfrules.template"
copy_template "kiro-steering.template.md"         ".kiro/steering/00-agents.md.template.md"
copy_template "settings.template.json"            ".claude/settings.json.template.json"
for hook in block-destructive anti-mascaramento frontmatter-validator override-ledger \
            override-consume secrets-scanner doc-line-counter staleness-checker check-deps \
            inject-context phase-gate no-verify-bypass pre-edit-evidence \
            post-claim-evidence auditor-commit-hygiene; do
  copy_template "hook-${hook}.template.sh" ".claude/hooks/${hook}.sh.template.sh"
done
copy_template "constitution.template.md"          ".claude/memory/constitution.md.template.md"
copy_template "CURRENT.template.md"               ".agent/CURRENT.md.template.md"
copy_template "maestro.template.md"               ".claude/agents/maestro.md.template.md"

# ---------- 6. C1 — descoberta COMPLETA (16 arquivos em docs/descoberta/) ----------

copy_template "problema.template.md"              "docs/descoberta/problema.md.template.md"
copy_template "personas.template.md"              "docs/descoberta/personas.md.template.md"
copy_template "jornadas.template.md"              "docs/descoberta/jornadas.md.template.md"
copy_template "business-model-canvas.template.md" "docs/descoberta/business-model-canvas.md.template.md"
copy_template "value-proposition-canvas.template.md" "docs/descoberta/value-proposition-canvas.md.template.md"
copy_template "gtm-pricing.template.md"           "docs/descoberta/gtm-pricing.md.template.md"
copy_template "concorrentes.template.md"          "docs/descoberta/concorrentes.md.template.md"
copy_template "nao-fazer.template.md"             "docs/descoberta/nao-fazer.md.template.md"
copy_template "riscos.template.md"                "docs/descoberta/riscos.md.template.md"
copy_template "restricoes.template.md"            "docs/descoberta/restricoes.md.template.md"
copy_template "hipoteses-a-validar.template.md"   "docs/descoberta/hipoteses-a-validar.md.template.md"
copy_template "metricas-chave.template.md"        "docs/descoberta/metricas-chave.md.template.md"
copy_template "mercado-regulatorio.template.md"   "docs/descoberta/mercado-regulatorio.md.template.md"
copy_template "dados-existentes.template.md"      "docs/descoberta/dados-existentes.md.template.md"
copy_template "integracoes-externas.template.md"  "docs/descoberta/integracoes-externas.md.template.md"
copy_template "sintese-final.template.md"         "docs/descoberta/sintese-final.md.template.md"
copy_template "glossario.template.md"             "docs/glossario.md.template.md"

# ---------- 7. C2 — ADRs (só pasta) ----------

mkdir -p "$DESTINO/docs/adr"

# ---------- 8. C7 — governança (esqueleto) ----------

copy_template "catalogo-auditores.template.md"    "docs/governanca/catalogo-auditores.md.template.md"

# ---------- 9. C10 — convenções e índice (sempre) ----------

copy_template "CONVENCOES-DOC.template.md"        "docs/CONVENCOES-DOC.md.template.md"
copy_template "INDICE.template.md"                "docs/INDICE.md.template.md"
copy_template "documentos-do-projeto.template.md" "docs/documentos-do-projeto.md.template.md"
copy_template "nao-aplica.template.md"            "docs/nao-aplica.md.template.md"

# ---------- 10. remoção de sufixos + substituição de placeholders ----------

echo ""
echo "[bootstrap] renomeando arquivos .template..."
while IFS= read -r -d '' f; do
  remove_template_suffix "$f"
done < <(find "$DESTINO" -type f \( -name "*.template.md" -o -name "*.template.sh" -o -name "*.template.yaml" -o -name "*.template.json" -o -name "*.template" \) -print0)

echo "[bootstrap] substituindo placeholders básicos..."
# NÃO inclui *.sh: hooks são genéricos e não levam placeholder de projeto. Pior:
# hook-frontmatter-validator imprime "<YYYY-MM-DD>" como exemplo de formato numa
# mensagem de ajuda — substituir trocaria o exemplo por uma data fixa e o hook
# deixaria de ensinar o formato. Placeholder é conceito de doc, não de script.
while IFS= read -r -d '' f; do
  replace_placeholders "$f"
done < <(find "$DESTINO" -type f \( -name "*.md" -o -name "*.json" -o -name "*.yaml" \) -print0)

if [[ "$TIPO_TENTATIVO" == "experimento" && -f "$DESTINO/docs/nao-aplica.md" ]]; then
  sed -i "/^<!-- Adicionar uma linha por camada/i | C0 / \`SECURITY.md\` | Experimento descartável de curta duração; sem usuário externo nem canal público de vulnerabilidade. | Tipo tentativo \`experimento\` informado no bootstrap fase-1. | ${DONO} | ${HOJE} | Experimento virar produto, receber usuário externo ou tratar dado de terceiro. |" "$DESTINO/docs/nao-aplica.md"
fi

echo "[bootstrap] dando chmod +x nos hooks..."
if [[ -d "$DESTINO/.claude/hooks" ]]; then
  chmod +x "$DESTINO/.claude/hooks/"*.sh 2>/dev/null || true
fi

# ---------- 11. relatório final ----------

CONTAGEM_MD=$(find "$DESTINO" -type f -name "*.md" | wc -l | tr -d ' ')
CONTAGEM_HOOK=$(find "$DESTINO/.claude/hooks" -type f -name "*.sh" 2>/dev/null | wc -l | tr -d ' ')
C0_DESC="13 arquivos"
if [[ "$TIPO_TENTATIVO" == "experimento" ]]; then
  C0_DESC="12 arquivos (SECURITY.md pulado e registrado em docs/nao-aplica.md)"
fi

echo ""
echo "==============================================="
echo "[bootstrap fase-1] CONCLUÍDO"
echo "==============================================="
echo "Destino:        $DESTINO"
echo "Nome:           $NOME"
echo "Tipo tentativo: $TIPO_TENTATIVO"
echo "Arquivos .md:   $CONTAGEM_MD"
echo "Hooks .sh:      $CONTAGEM_HOOK"
echo ""
echo "O QUE FOI CRIADO:"
echo "  - C0 raiz ($C0_DESC)"
echo "  - C1 descoberta completa (16 esqueletos)"
echo "  - C9 harness multi-ferramenta (Claude/Cursor/Windsurf/Kiro + $CONTAGEM_HOOK hooks)"
echo "  - C7 catálogo de auditores esqueleto"
echo "  - C10 convenções e índice"
echo "  - C2 pasta docs/adr/ vazia"
echo ""
echo "O QUE NÃO FOI CRIADO (sai da descoberta + fase-2):"
echo "  - C6 conformidade (LGPD, threat-model, dependency-policy)"
echo "  - C8 operação (runbooks, on-call, backup, DR, observabilidade, etc.)"
echo "  - C5 kickoff-foundation (criado quando ADR-0001 aceitar a stack)"
echo ""
echo "PRÓXIMOS PASSOS PARA O AGENTE:"
echo "  1. cd \"$DESTINO\""
echo "  2. preencher docs/descoberta/* com o que o briefing já dá (inferência)"
echo "  3. fazer ao dono as perguntas que faltarem para completar problema/personas/jornadas"
echo "  4. quando docs/descoberta/sintese-final.md tiver status: stable, classificar o TIPO definitivo"
echo "  5. rodar:  bash \"$META_DIR/bootstrap-fase-2.sh\" \"$DESTINO\" <tipo-definitivo>"
echo "     (materializa C6 e C8 conforme o tipo)"
echo "  6. ADR-0001 (stack) + ADR-0002 (tenancy/storage) abertas em C2."
echo ""
echo "PARA O DONO:"
echo "  - abra o assistente de IA apontando para a pasta acima (isso liga as"
echo "    verificações automáticas que protegem o projeto)"
echo "  - o assistente vai te perguntar 3-5 coisas para entender o produto"
echo "  - quando o entendimento fechar, ele segue para escolher a tecnologia e o desenho do sistema"
