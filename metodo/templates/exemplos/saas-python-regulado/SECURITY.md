---
owner: roldao
ultima-conferencia: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 250
proposito: exemplo preenchido do meta-template para referência e comparação
---

# SECURITY — conciliab

## Canal de divulgacao

Reportar vulnerabilidade por e-mail para **security@conciliab.com.br**.

NAO abrir issue publica para falhas exploraveis. NAO discutir em chat publico
antes da correcao.

Inclua no relato:
- Descricao do problema e impacto observado.
- Passo-a-passo de reproducao.
- Versao / commit afetado.
- Se houver, prova de conceito minima.

## Classificacao de severidade

| Severidade | Criterio | SLA de correcao |
|---|---|---|
| **CRITICO** | Vazamento entre tenants (quebra de RLS) **OU** explorable sem auth **OU** ganho de privilegio admin **OU** vazamento de PII em volume (LGPD Art. 5) | 24 horas |
| **ALTO** | Escalada limitada de privilegio dentro do mesmo tenant **OU** DoS **OU** vazamento de PII de poucos titulares | 7 dias corridos |
| **MEDIO** | Vazamento de info tecnica nao-sensivel (versao de biblioteca, caminhos internos, traceback detalhado) | 30 dias corridos |
| **BAIXO** | Hardening / defesa em profundidade, sem caminho de exploracao concreto | 90 dias corridos |

> **SLA** = prazo maximo entre triagem e correcao em producao.

## SLA de resposta inicial

| Etapa | Prazo |
|---|---|
| Acusar recebimento | 72 horas |
| Triagem (severidade + plano) | 7 dias corridos |
| Correcao | conforme tabela acima |

## Versoes com suporte ativo

| Linha | Status | Recebe correcao de seguranca? |
|---|---|---|
| 0.4.x (atual, beta privado) | em producao (beta) | sim |
| 0.3.x | manutencao | sim, ate 2026-08-01 |
| 0.2.x e anteriores | end-of-life | nao |

## Rotacao de segredos

Segredos vivem em **AWS Secrets Manager** (cofre principal). Nunca em codigo,
nunca em `.env` versionado.

| Tipo de segredo | Frequencia minima de rotacao | Responsavel | Processo |
|---|---|---|---|
| Token de API (Sentry, Datadog, Cognito) | 90 dias | dev de plantao do mes | gerar novo no painel → atualizar Secrets Manager → revogar antigo apos 24h |
| Senha do RDS (`conciliab-prod`) | 180 dias | <DEV-1> (owner infra) | rotacao coordenada com janela de manutencao + restart ECS |
| Chave KMS de SSE-S3 | anual | <DEV-1> | rotacao automatica pela AWS, validacao manual |
| Credencial pessoal de mantenedor | sob suspeita de comprometimento | o proprio mantenedor | revogar imediatamente, recriar, comunicar equipe |
| Webhook secret de banco (CSV ingestion) | 90 dias por cliente | dev de plantao | regenerar via painel admin, atualizar com cliente, revogar antigo |

## Gestao de dependencias

- **Dependabot**: ativo no GitHub, abre PR automatico em vulnerabilidade de
  dependencia (cobertura: `pyproject.toml`, `poetry.lock`, GHA workflows).
- **SBOM**: gerado a cada release em `dist/sbom.json` (formato CycloneDX) via
  `cyclonedx-py`.
- **Revisao de CVE**: semanal para diretas (script `scripts/cve_check.py`);
  mensal para transitivas.
- Dependencias sem manutencao ha > 12 meses sao marcadas como debito tecnico
  e substituidas no ciclo seguinte.

## MFA dos mantenedores

**Obrigatorio** para qualquer pessoa com:
- Permissao de push direto em `main` (so Roldao, <DEV-1>, <DEV-2>, <DEV-3>).
- Merge em branch protegida.
- Acesso ao AWS Secrets Manager.

Requisitos:
- MFA ativa no GitHub.
- MFA ativa no console AWS.
- Chave SSH protegida por passphrase OU armazenada em hardware (YubiKey).

Mantenedor sem MFA tem acesso de push **revogado** ate regularizar.

## Secrets scanning no CI

O pipeline GitHub Actions roda em todo commit:

- **gitleaks** (`gitleaks/gitleaks-action@v2`) — falha o build se detectar
  padrao de credencial.
- **bandit** — varredura de seguranca em codigo Python.
- **pip-audit** — vulnerabilidades em dependencias diretas.

Checklist (executado uma vez, antes do beta publico):
- [x] Historico do repositorio varrido com `gitleaks detect --no-banner --redact --log-opts="--all"` em 2026-02-14.
- [x] Vazamentos antigos tratados — 1 ocorrencia em 2026-01-22 (token Sentry de
  dev expirado), rotacionado + reescrito via `git filter-repo`. Documentado em
  ADR-0007 (override do INV-AGENT-002 para essa reescrita unica).
- [x] Pipeline GHA configurado em `.github/workflows/ci.yml` para falhar build
  em commit novo com padrao de credencial.

Em caso de vazamento detectado: rotacao **imediata** do segredo, mesmo antes
de remover do historico.

## Politica de divulgacao coordenada

- **Embargo padrao**: 90 dias entre o aceite do report e a publicacao publica
  da falha **ou** acordo direto com o reporter (o que for mais curto, exceto em
  caso de exploracao ativa no mundo real).
- **Safe-harbor**: nao tomamos medida legal contra pesquisador de seguranca
  que reporte de boa-fe, respeite o embargo e nao acesse dados alem do
  necessario para demonstrar o problema. NAO consideramos boa-fe: tentar acessar
  PII de tenants reais (use a conta de teste do programa).
- **CVE**: solicitamos identificador CVE quando a falha afeta versao publica e
  tem impacto material.
- **Credito**: o reporter e creditado no aviso publico, exceto se preferir
  anonimato.

## Programa de teste para pesquisadores

Conta de teste disponivel sob NDA: contatar `security@conciliab.com.br`.
A conta tem dados sinteticos (PII falsa, contas bancarias ficticias) e RLS
ativa — pode (e deve) ser usada para tentar quebrar isolamento entre tenants.

## O que NAO e considerado vulnerabilidade

- Falhas em dependencia ja com CVE publico sem caminho de exploracao no nosso uso.
- Falta de header de seguranca em endpoint puramente interno / sem dado sensivel.
- Ataques que exigem acesso fisico ao dispositivo do usuario.
- Engenharia social fora do nosso dominio.
- Ausencia de rate-limiting em endpoint publico de leitura sem dado pessoal
  (excecao: `/v1/auth/*` tem rate-limit obrigatorio).
- Bug de UX que nao leva a vazamento, escalada ou perda de dado.

Em duvida, reportar mesmo assim — triagem decide.
