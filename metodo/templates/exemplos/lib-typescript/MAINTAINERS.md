---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 100
proposito: declarar mantenedor, sucessao e contato de emergencia do projeto solo
---

# MAINTAINERS — @conciliab/csv-parser

> **Mantenedor** = pessoa com permissao de merge em `main`, publish no npm sob `@conciliab/*` e decisao sobre rumo do projeto. Esta lista e fonte de verdade — quem nao esta aqui nao tem essas permissoes.

## 1. Mantenedores ativos

| Nome | GitHub | Area | Contato | Ativo desde | MFA confirmado |
|---|---|---|---|---|---|
| Roldao | @roldao | owner-geral (codigo + release + segurança) | security@conciliab.dev | 2026-01-15 | sim (GitHub + npm com OTP obrigatorio) |

> Projeto **solo** nesta fase. Bus factor = 1 — risco aceito e mitigado pela seção §3 (sucessao) e §4 (emergência).

## 2. Owner do projeto

| Papel | Nome | Contato | Responsabilidade |
|---|---|---|---|
| Owner | Roldao | security@conciliab.dev | decisao final em impasse, sucessao, mudança de licenca, `npm publish`, mudança de visibilidade do repo |

Owner e tambem unico mantenedor ativo.

## 3. Politica de sucessao (projeto solo)

Sendo projeto solo, sucessao depende de a comunidade reconhecer ausencia. Politica:

1. **Detector**: qualquer pessoa pode abrir issue `SUSPECTED-INACTIVE` no GitHub se nao houver atividade do owner por > 60 dias corridos (sem commit, sem comentario em PR/issue, sem release).
2. **Tentativa de contato**: ate 30 dias por canais conhecidos — e-mail `security@conciliab.dev`, GitHub Issues, contato pessoal (Balança Solution).
3. **Sem retorno apos 90 dias**: assumir saida silenciosa.
4. **Continuidade do pacote no npm**: politica formal de `npm` permite recuperacao de pacote abandonado por terceiro — a comunidade deve seguir o processo do registry (`npm-disputes`).
5. **Fork**: em caso de impossibilidade de recuperar o pacote, comunidade pode forkar sob novo escopo. A licenca MIT permite.
6. **Repositorio GitHub**: organizacao `@conciliab` tem politica de "successor" no GitHub que transfere ownership a contato designado em caso de inatividade > 180 dias.

> **Bus factor alvo apos 2026:** quando atingirmos > 10 contribuidores externos ativos OU > 1000 downloads/semana no npm, abrir processo formal de adicionar 2º mantenedor (gatilho em §5).

## 4. Contato de emergência

| Tipo de emergência | Canal | SLA |
|---|---|---|
| Vulnerabilidade ativa explorada na versão publicada | security@conciliab.dev + GitHub Security Advisory privado | 24h conforme `SECURITY.md` |
| Pacote sequestrado (token `NPM_TOKEN` comprometido) | security@conciliab.dev (PRIORIDADE MAXIMA) + abrir `npm-disputes` no registry | imediato |
| Comprometimento da conta GitHub do owner | abrir ticket `support@github.com` referenciando organizacao `@conciliab` | 24h |
| Inatividade prolongada do owner | issue publica `SUSPECTED-INACTIVE` no repo (ver §3) | 60 dias |

Sem chave PGP publica nesta fase (ver `SECURITY.md` §"Chave PGP"). Use GitHub Security Advisories privado para canal cifrado fim-a-fim.

## 5. Processo de adicao de novo mantenedor

Hoje **fechado** (projeto solo). Gatilhos para abrir:

- > 10 contribuidores externos ativos no repo nos últimos 6 meses, OU
- > 5 PRs externos/mes em media nos últimos 3 meses, OU
- > 1000 downloads/semana no npm, OU
- Decisao do owner (ex: garantir bus factor > 1 antes de evento de saude).

Quando o gatilho disparar, criar processo formal (template `templates/MAINTAINERS.template.md` §3 do método). Sumario do filtro:

| Criterio minimo | Valor |
|---|---|
| Tempo de contribuicao consistente | >= 6 meses |
| PRs aprovados como autor (qualidade consistente) | >= 10 |
| Issues triadas/resolvidas | >= 15 |
| MFA ativo (GitHub + npm) | sim (sem excecao) |
| Recomendacao do owner | sim |
| Periodo de prova com permissoes completas | 60 dias |

Anuncio publico em release notes + `CHANGELOG.md`.

## 6. Sucessao de credenciais ("break the glass")

Recursos cujo acesso o owner controla **sozinho** hoje:

| Recurso | Onde vive | Procedimento de recuperacao |
|---|---|---|
| Conta npm `@conciliab` (OTP via app) | npmjs.com | recuperacao via npm support com prova de identidade da Balança Solution |
| Conta GitHub owner (MFA via hardware key + backup codes) | github.com | backup codes em cofre fisico Balança Solution; sucessor da organizacao configurado no GitHub |
| Dominio `conciliab.dev` | registrar (registro.br ou equivalente) | titularidade Balança Solution; sucessao via inventario |
| Secret `NPM_TOKEN` em GitHub Actions | repo settings | regenerado por novo owner apos recuperar conta npm |

> Apos adicionar 2º mantenedor (gatilho em §5), migrar para procedimento de bus-factor >= 2 com runbook formal em `docs/operacao/runbooks/succession.md`.

## 7. Revisao desta lista

- Revisao anual obrigatoria pelo owner (data em `revisado-em`).
- Revisao **adicional** ao: aceitar 2º mantenedor, comprometimento de credencial, mudanca de organizacao Balança Solution.

## 8. Vinculacao com

- `CONTRIBUTING.md` — fluxo de contribuicao externa (passo anterior a mantenedor).
- `SECURITY.md` — MFA, rotacao de credencial, canal de divulgacao.
- `nao-aplica.md` — registra ausencia de `governanca-comunidade.md` (gatilho: 2º mantenedor).
- ADR-0003 — politica de versionamento que o release segue.
- `docs/operacao/release-process.md` — fluxo executavel de release.
