---
description: Aponta o ROLDAO num repo legado e gera relatório de violações históricas (LGPD, secrets, fixes sem investigação, débito fiscal). Ferramenta de discovery — não modifica nada.
argument-hint: "[caminho do repo legado | vazio = CWD] [--profile=fiscal|fintech|geral]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(git blame:*), Bash(find:*), Bash(wc:*), Task
model: opus
---

# /auditoria-reversa — diagnóstico de repo legado

Para usar em **repo que você não escreveu** (ou herdou) e quer saber a saúde geral antes de propor mudanças. Discovery puro — **nenhum arquivo é alterado**. Saída: relatório em `docs/auditorias/auditoria-reversa-<data>.md`.

`$ARGUMENTS`:
- Caminho do repo (default: CWD). Aceita relativo ou absoluto.
- `--profile=fiscal` (peso extra em FISCAL-001..007), `--profile=fintech` (peso extra em PIX-001..005 + LGPD), `--profile=geral` (default).

## Como usar

```
/auditoria-reversa
/auditoria-reversa /caminho/do/cliente-x --profile=fiscal
```

## Pipeline

### Etapa 1 — investigador faz inventário (sequencial)

Invoque `investigador` no modo "discovery de repo":

- **Estrutura**: linguagens detectadas (`find . -name "*.{py,js,ts,go,...}" | wc -l` por extensão), tamanho do código, idade do repo (`git log --reverse --format=%ai | head -1`).
- **Hotspots**: arquivos mais modificados (`git log --format= --name-only | sort | uniq -c | sort -rn | head -20`).
- **Histórico de bugs**: commits com "fix", "hotfix", "revert" — quantos % do total.
- **Dados pessoais**: `grep -rE "cpf|cnpj|email|telefone" --include="*.{py,js,ts,go,java,rb}"` — quantos arquivos tocam PII.
- **Fiscal**: presença de NF-e/SEFAZ/cMun/eSocial/REINF no código.
- **Pagamentos**: presença de Pix, Stripe, Pagar.me, gateway.

NÃO ler conteúdo profundo — só catalogar. Detalhe vem dos auditores depois.

### Etapa 2 — 3 auditores em PARALELO

Em UMA ÚNICA MENSAGEM, invocar:

1. `auditor-seguranca` — varredura completa de violações:
   - SEC-001: grep por padrões de secret (`secret_token_patterns()` do `_lib.js`); contar quantos secrets vivos vs comentados; conferir `.env*` versionado.
   - SEC-005: URLs hardcoded de serviço externo (`SEFAZ_HOMOLOG`, `sandbox`, `production` literal).
   - LGPD-001: arquivos que tocam PII sem ADR de base legal próximo (`grep -L "LGPD-001\|base legal" arquivo`).
   - LGPD-004: PII em log sem mascaramento (`console.log.*cpf`, `printf.*chave_pix`).
   - SEC-002: comandos destrutivos no histórico (`git log --all -S "rm -rf"`).
2. `auditor-qualidade` — débito técnico acumulado:
   - TST-001: mascaramentos detectados em testes (skip, xit, `|| true` em comando de teste, `@ts-ignore` sobre teste).
   - TST-003: mocks em integration/e2e.
   - TST-004: CPF/CNPJ/email real em fixture (não-sintético).
   - Cobertura aproximada (arquivos sem `.test.` correspondente).
   - Fixes sem investigação: commits "fix" sem referência a investigação prévia (REGRA #0 violada).
3. `auditor-produto` — coerência com domínio:
   - Profile fiscal: FISCAL-001..007 (CNPJ alfanumérico em VARCHAR, ambiente hardcoded, etc).
   - Profile fintech: PIX-001..005 (TxId, EndToEndId, webhook HMAC).
   - Sempre: presença de AGENTS.md/CLAUDE.md/REGRAS-INEGOCIAVEIS.md.

Cada auditor reporta com **contagem por ID de regra** e **arquivos top-5 mais impactados**.

### Etapa 3 — tech-writer consolida

Invocar `tech-writer` pra gerar `docs/auditorias/auditoria-reversa-AAAA-MM-DD.md` com o template abaixo. Apresentar ao usuário em PT-BR claro (sem stack trace cru, sem nome de framework).

## Template do relatório

```markdown
---
owner: tech-writer
revisado-em: AAAA-MM-DD
status: stable
tipo: auditoria-reversa
escopo: <caminho>
profile: <fiscal|fintech|geral>
---

# Auditoria reversa — <nome do repo> — AAAA-MM-DD

## Resumo executivo (1 parágrafo, PT-BR claro)

<O que esse código é, idade aproximada, linguagens principais, principais riscos.>

## Indicadores

| Indicador | Valor |
|---|---|
| Idade do repo | <N anos / desde AAAA-MM> |
| Linhas de código (estimativa) | <N> |
| Linguagem principal | <X> |
| Commits "fix"/"hotfix" | <N (% do total)> |
| Arquivos com PII | <N> |
| Arquivos com lógica fiscal | <N> |

## Violações por categoria

### 🛡️ Segurança (auditor-seguranca)
| Regra | Ocorrências | Top 3 arquivos |
|---|---|---|
| SEC-001 (secret commitado) | <N> | <arquivos> |
| SEC-005 (URL hardcoded) | <N> | ... |
| LGPD-001 (PII sem base legal) | <N> | ... |
| LGPD-004 (PII em log) | <N> | ... |

### 🧪 Qualidade (auditor-qualidade)
| Regra | Ocorrências | Top 3 arquivos |
|---|---|---|
| TST-001 (teste mascarado) | <N> | ... |
| TST-003 (mock em integration) | <N> | ... |
| TST-004 (dado real em fixture) | <N> | ... |
| Fix sem investigação prévia | <N> | <commits> |

### 🎯 Produto / Domínio (auditor-produto)
| Regra | Ocorrências | Top 3 arquivos |
|---|---|---|
| FISCAL-005 (CNPJ BIGINT) | <N> | ... |
| FISCAL-003 (SEFAZ hardcoded) | <N> | ... |
| PIX-001 (sem idempotência TxId) | <N> | ... |
| Sem AGENTS.md/CLAUDE.md/REGRAS | sim/não | — |

## Top 10 riscos priorizados

1. <descrição em PT-BR claro> — impacto: <legal | financeiro | operacional> — esforço: <baixo | médio | alto>
2. ...
...

## Plano de remediação sugerido (em ordem)

**Fase 1 (urgente, 1 sprint):**
- <ações que removem risco legal/financeiro imediato>

**Fase 2 (1-2 meses):**
- <ações estruturais — instalar ROLDAO, escrever ADRs, refatorar áreas críticas>

**Fase 3 (3-6 meses):**
- <débito técnico não-crítico, modernização>

## O que NÃO foi auditado

- <gaps honestos: ex. "não rodei testes, só catáloguei", "não acessei o banco", "código de frontend não analisado profundamente">

---

_Auditoria gerada por ROLDAO-METHOD. Não substitui auditoria humana — é discovery automático pra orientar próximos passos._
```

## Importante

- **Nenhuma escrita no repo auditado.** Só leitura + relatório em `docs/auditorias/` do projeto que rodou o comando (ROLDAO instalado).
- Repo legado sem ROLDAO instalado é o caso comum — instalar `.claude/` no repo auditado é decisão SEPARADA, depois do relatório.
- Se o repo é grande (>100k linhas), avise o usuário antes de continuar e ofereça `--profile` pra focar.
- Hook `block-confirmation-questions` não bloqueia esse aviso porque é decisão de escopo, não permissão.
- Pra repos privados, exige que o operador rode local (não envia código pra fora).
