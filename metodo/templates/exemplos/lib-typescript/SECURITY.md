---
owner: roldao
ultima-conferencia: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 250
proposito: exemplo preenchido do meta-template para referência e comparação
---

# SECURITY — @conciliab/csv-parser

## Canal de divulgação

Reportar vulnerabilidade por e-mail para **security@conciliab.dev**.

Alternativa preferida: usar o **GitHub Security Advisories** privado no repositório (`Security` → `Report a vulnerability`). Garante embargo automático e rastreabilidade.

NÃO abrir issue pública para falhas exploráveis. NÃO discutir em chat público antes da correção.

Inclua no relato:
- Descrição do problema e impacto observado.
- Passo-a-passo de reprodução (input mínimo que dispara o problema — use dados sintéticos, **nunca extrato real**).
- Versão / commit afetado.
- Se houver, prova de conceito mínima.

## Modelo de ameaças desta lib

`@conciliab/csv-parser` é uma biblioteca **pura**, sem I/O, executada no ambiente de quem instala. Ameaças relevantes:

1. **Entrada maliciosa** — input CSV/OFX/CNAB240 forjado que dispara consumo descontrolado de memória (zip bomb textual, regex backtracking, expansão exponencial) ou crash do runtime do consumidor.
2. **Output enganoso** — parser interpreta input ambíguo de forma que faz o consumidor confiar em um valor errado (ex: vírgula vs ponto decimal silenciosamente trocados; data interpretada em fuso errado sem flag).
3. **Cadeia de suprimentos** — dependência comprometida (typosquatting, account takeover de mantenedor upstream) injeta código malicioso na nossa lib.
4. **Pacote sequestrado** — token `NPM_TOKEN` vazado permite atacante publicar versão maliciosa do nosso pacote.

Ameaças **fora do escopo** (responsabilidade do consumidor):
- Vazamento de dado pessoal por logs do consumidor (a lib não loga nada).
- Persistência insegura do output (a lib não persiste).
- Autorização/autenticação (lib é cliente, não servidor).

## Classificação de severidade

Tabela inspirada no CVSS, simplificada para uso diário.

| Severidade | Critério | Prazo de correção (SLA) |
|---|---|---|
| **CRÍTICO** | Pacote sequestrado / versão maliciosa publicada **ou** execução remota de código via input forjado **ou** vazamento de token de mantenedor | 24 horas |
| **ALTO** | DoS reproduzível com input < 1 MB (regex catastrophic backtracking, memória O(n²) inesperada) **ou** parser produz silenciosamente valor errado em formato documentado como suportado | 7 dias corridos |
| **MÉDIO** | Mensagem de erro vaza caminho interno ou versão de dependência transitiva; parser aceita formato fora da spec sem flag explícita | 30 dias corridos |
| **BAIXO** | Hardening / melhoria de defesa em profundidade, sem caminho de exploração concreto | 90 dias corridos |

> **SLA** = prazo máximo de atendimento entre triagem e correção publicada no npm.

## SLA de resposta inicial

| Etapa | Prazo |
|---|---|
| Acusar recebimento | 72 horas |
| Triagem (severidade + plano) | 7 dias corridos |
| Correção publicada no npm | conforme tabela de severidade acima |

## Chave PGP

Não publicamos chave PGP nesta fase (projeto solo, comunidade pequena). Use GitHub Security Advisories privado para canal cifrado fim-a-fim.

## Versões com suporte ativo

SemVer estrito (ver [ADR-0003](./docs/adr/ADR-0003-versionamento-semver.md)).

| Linha | Status | Recebe correção de segurança? |
|---|---|---|
| 0.x (atual) | beta — em desenvolvimento ativo | sim |
| — | — | — |

Política de suporte após `1.0.0`:
- A linha major atual e a anterior (`N` e `N-1`) recebem correção de segurança.
- Linhas `≤ N-2` ficam end-of-life e migrar é responsabilidade do consumidor.

## Rotação de segredos

Segredos relevantes neste projeto:

| Tipo de segredo | Frequência mínima de rotação | Responsável | Processo |
|---|---|---|---|
| `NPM_TOKEN` (publicação automatizada) | anual ou sob suspeita | roldao | gerar novo token de granular access na conta npm com escopo `@conciliab/*` apenas → atualizar GitHub Actions Secret → revogar antigo após 24h |
| `GITHUB_TOKEN` (release automation) | gerenciado pelo GitHub (efêmero) | — | rotação automática pela própria Action |
| Chave de assinatura de release (se vier a usar `npm publish --provenance`) | anual | roldao | gerar nova chave → publicar fingerprint → revogar antiga |
| Credencial pessoal do mantenedor (conta npm, GitHub) | sob suspeita de comprometimento | o mantenedor | revogar imediatamente, recriar, comunicar comunidade se houve uso indevido |

Segredos são armazenados em **GitHub Actions Secrets** + `.env` local (em `.gitignore`). Nunca em código, nunca em commit.

## Gestão de dependências

- **Dependabot** configurado em `.github/dependabot.yml` para abrir PR automaticamente quando dependência tem atualização de segurança. Frequência: semanal para `npm`, diária para `github-actions`.
- **SBOM** (lista de tudo que a lib usa por dentro): gerado a cada release em `dist/sbom.cdx.json` (formato CycloneDX) via `pnpm cyclonedx`.
- **Revisão de CVE**: revisão semanal manual de novas CVEs nas dependências diretas (são poucas — a lib tem zero deps de runtime). Mensal para devDependencies.
- Dependências sem manutenção há > 12 meses são marcadas como débito técnico e substituídas no próximo ciclo.

**Política zero-runtime-deps:** `package.json` em `dependencies` deve permanecer vazio (`{}`). Toda dep vai em `devDependencies`. Romper esta política exige ADR.

## MFA dos mantenedores

**Obrigatório** para qualquer pessoa com permissão de push direto, merge em branch protegida ou publicação de pacote:

- Autenticação multi-fator (MFA) ativa na conta GitHub.
- MFA ativa na conta npm — **`npm publish` exige OTP** para o escopo `@conciliab/*`.
- Chave SSH protegida por passphrase OU armazenada em hardware (YubiKey, Secure Enclave).

Mantenedor sem MFA tem acesso de push **revogado** até regularizar.

## Secrets scanning no CI

O pipeline de integração contínua roda escaneamento automático de segredos em **todo commit**:

- Ferramenta: `gitleaks` (definido em `.github/workflows/security.yml`).
- Falha o build se detectar padrão de credencial (token npm `npm_*`, GitHub PAT `ghp_*`, chave privada).
- Checklist de configuração inicial:
  - [x] Histórico do repositório varrido com `gitleaks detect --no-banner --redact --log-opts="--all"` antes de tornar público.
  - [x] Pipeline configurado para falhar em commit novo com padrão de credencial.

Em caso de vazamento detectado: rotação **imediata** do segredo, mesmo antes de remover do histórico.

## Política de divulgação coordenada

- **Embargo padrão**: 90 dias entre o aceite do report e a publicação pública da falha **ou** acordo direto com o reporter (o que for mais curto, exceto em caso de exploração ativa no mundo real, quando publicamos imediatamente com correção pronta).
- **Safe-harbor**: não tomamos medida legal contra pesquisador de segurança que reporte de boa-fé, respeite o embargo e não acesse dados além do necessário para demonstrar o problema.
- **CVE**: solicitamos identificador CVE via GitHub Security Advisories quando a falha afeta versão publicada no npm e tem impacto material.
- **Crédito**: o reporter é creditado no aviso público e no CHANGELOG da versão corrigida, exceto se preferir anonimato.

## O que NÃO é considerado vulnerabilidade

- Bug de parsing em formato não documentado (CSV exótico de banco específico não suportado).
- Output divergente do esperado quando o input já está corrompido por outra ferramenta (lib não tenta "adivinhar" arquivo corrompido).
- Performance "lenta" sem caminho de DoS concreto (input de 100 MB demora — isso é esperado, não é vulnerabilidade).
- Ausência de validação de assinatura digital no arquivo OFX (a spec OFX tem assinatura opcional; nossa lib decodifica, validação de assinatura é responsabilidade do consumidor).
- Falhas em dependência transitiva já com CVE público sem caminho de exploração no nosso uso.
- Bug de UX no `README.md`.

Em dúvida, reportar mesmo assim — triagem decide.
