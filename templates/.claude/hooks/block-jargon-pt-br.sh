#!/usr/bin/env bash
# block-jargon-pt-br.sh — bloqueia resposta do agente com jargao tecnico ao usuario nao-programador.
# Hook PostToolUse (no Stop / Notification — depende de configuracao).
# INV-AGENT-001 — sem jargao tecnico sem traduzir, quando o usuario nao programa.
#
# Estrategia: olha a resposta gerada pelo Claude (campo response no input do hook).
# Se houver termos tecnicos sem traducao adjacente, bloqueia (PostToolUse pode retornar decision: block).

set -u

INPUT=$(cat)

# Tenta extrair texto da resposta. Pode vir em campos diferentes dependendo
# do tipo de hook: PostToolUse com tool_response.content, Stop com message,
# Notification com response. Cobre todos.
RESP=$(printf '%s' "$INPUT" | perl -MJSON::PP -e '
  local $/;
  my $json = decode_json(<STDIN>);
  my $r = $json->{response} // $json->{message} // "";
  if (!$r && ref($json->{tool_response}) eq "HASH") {
    $r = $json->{tool_response}->{content} // $json->{tool_response}->{text} // "";
  } elsif (!$r && ref($json->{tool_response}) eq "") {
    $r = $json->{tool_response} // "";
  }
  print ref($r) ? "" : $r;
' 2>/dev/null)

[ -z "$RESP" ] && exit 0

# Termos jargao que devem ser traduzidos (lista nao exaustiva)
# Cada termo: regex case-insensitive
JARGON_TERMS=(
  '\bcommit(s|ar|ed|ado|ei|ou)?\b'
  '\bbranch(es|ar|ado)?\b'
  '\bpush(es|ar|ado|ei|ou)?\b'
  '\bpull(s|ed|ar|ado|ei|ou)?\b'
  '\bmerge(s|ar|ado|ei|ou|ado)?\b'
  '\brebase(s|ar|ado|ei|ou)?\b'
  '\bdeploy(s|ar|ado|ei|ou)?\b'
  '\brollback(s|ar|ado)?\b'
  '\brevert(s|er|ido|i|eu)?\b'
  '\bendpoint(s)?\b'
  '\brefactor(s|ar|ado|ei|ou)?\b'
  '\blint(s|ar|ado)?\b'
  '\bbuild(s|ar|ado)?\b'
  '\bCI\b'
  '\bPR\b'
  '\bMR\b'
  # 'repo' so isolado em ingles — 'repositorio' / 'repositorios' em PT-BR e correto e nao deve ser flagado
  '\brepo(s)?\b'
  '\brepository(\b|ies)'
  '\bcheckout(s|ar|ado)?\b'
  '\bstash(es|ar|ado)?\b'
  '\bcherry-pick(s|ed|ar|ado)?\b'
  '\bbisect(s|ar|ado)?\b'
  # 'hook' NAO entra na lista — e termo central do framework e da configuracao
  # do Claude Code; usuarios precisam falar de hooks normalmente.
  # Termos BR sempre OK (NAO adicionar a JARGON_TERMS): Pix, NF-e, NFC-e, NFS-e,
  # CT-e, MDF-e, LGPD, CPF, CNPJ, SEFAZ, RFB, Bacen, ANPD, eSocial, REINF, SPED,
  # ECF, ECD, CC-e, SAT, MFE, TEF, ECF — sao termos do dominio fiscal/legal BR
  # que nao tem traducao e o usuario nao-programador conhece.
)

# Termos OK quando vem traduzidos OU dentro de bloco de codigo, OU acompanhados de explicacao
# Estrategia simples: detectar se ha pelo menos 1 termo SEM explicacao adjacente

# Remove blocos de codigo (markdown ``` ... ```)
CLEAN=$(printf '%s\n' "$RESP" | perl -0777 -pe 's/```.*?```//gs' | perl -pe 's/`[^`]*`//g')

VIOLATIONS=()
for pat in "${JARGON_TERMS[@]}"; do
  MATCHES=$(printf '%s\n' "$CLEAN" | grep -oiE -- "$pat" | head -n3 || true)
  [ -z "$MATCHES" ] && continue
  # se a linha tem traducao adjacente, ignora
  while IFS= read -r m; do
    [ -z "$m" ] && continue
    # contexto: pega a linha que contem o termo
    CTX=$(printf '%s\n' "$CLEAN" | grep -iE -- "$m" | head -n1 || true)
    # ignora se a linha tem parenteses explicativos ou aspas com termo PT
    if printf '%s\n' "$CTX" | grep -qiE '\(.{0,80}(salv|enviei|atualiz|servidor|cliente|sistema|arquivo|versao|configura).{0,80}\)'; then
      continue
    fi
    if printf '%s\n' "$CTX" | grep -qiE '"[^"]{3,40}"'; then
      continue  # ja tem aspas, provavel explicacao
    fi
    if printf '%s\n' "$CTX" | grep -qiE '\bou seja\b|\bsignific|isso e|isto e|i\.e\.|ex:'; then
      continue
    fi
    VIOLATIONS+=("jargao sem traducao: '$m' em -> $CTX")
  done <<< "$MATCHES"
done

if [ "${#VIOLATIONS[@]}" -gt 0 ]; then
  # PostToolUse bloqueia via JSON {"decision":"block"}. O reason concatena
  # texto que pode conter aspas/newline (VIOLATIONS vem da resposta do agente),
  # entao gera o JSON via perl encode_json — heredoc cru quebra com payload sujo.
  VIOLATIONS_STR=$(printf '  - %s\n' "${VIOLATIONS[@]}")
  REASON_TEXT="[block-jargon-pt-br] resposta usa jargao tecnico sem traduzir (INV-AGENT-001).

Usuario nao-programador. Reescrever em PT-BR claro.

Violacoes:
${VIOLATIONS_STR}

Tabela de traducao:
  - commit/push -> 'salvei a correcao no sistema'
  - CI verde -> 'esta funcionando, validei'
  - rollback -> 'voltar pra versao anterior'
  - deploy -> 'subir pro servidor'
  - refactor -> 'reorganizar (sem mudar o que aparece pro usuario)'
  - migration -> 'mudanca na estrutura dos dados salvos'
  - mock/fixture -> 'dados falsos pros testes'

Excecao: se o usuario E programador (declarado em AGENTS.md), peca pra ajustar a regra."
  printf '%s' "$REASON_TEXT" | perl -MJSON::PP -e '
    local $/;
    my $reason = <STDIN>;
    print encode_json({ decision => "block", reason => $reason });
  '
  exit 0
fi

exit 0
