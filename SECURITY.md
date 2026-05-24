---
owner: framework
revisado-em: 2026-05-18
status: stable
---

# Política de Segurança — ROLDAO-METHOD

Como reportar vulnerabilidades, prazos esperados, escopo coberto.

## Reporte responsável

Encontrou uma vulnerabilidade no ROLDAO-METHOD? **Não abra issue pública.**

Use o canal primário: [Security Advisory privado do GitHub](https://github.com/roldaobatista/roldao-method/security/advisories/new) (relato confidencial, rastreável, sem depender de e-mail).

Inclua:
- Versão afetada (`npx roldao-method version`)
- Descrição do problema
- Passo a passo de reprodução
- Impacto estimado
- Mitigação sugerida (se tiver)
- Se quer ser creditado no fix (sim/não — opcional)

## Prazos esperados

| Severidade | Confirmação | Patch | Disclosure público |
|---|---|---|---|
| Crítica (RCE, secrets leak no installer, hook bypass) | 24h | 7 dias | 30 dias após patch |
| Alta (privilege escalation, supply chain) | 72h | 14 dias | 60 dias após patch |
| Média (parsing issue, comportamento inesperado de hook) | 7 dias | 30 dias | 90 dias após patch |
| Baixa (typo em mensagem, doc desatualizada) | 14 dias | próxima release | imediato |

Se não receber resposta em 14 dias da confirmação, abra issue pública.

## Escopo coberto

✅ **Em escopo:**
- CLI `bin/install.js` (vulnerabilidades de path traversal, escape de comando, leitura de arquivos fora do projeto).
- Hooks em `templates/.claude/hooks/` (bypass, falso negativo, leak de input).
- Skills em `templates/.claude/skills/` (validações que aceitam dado malicioso, RCE em scripts Python).
- Addons em `addons/` (mesma análise dos itens acima).
- Templates em `templates/.specify/` (injection via frontmatter, paths inseguros).
- Dependencies (`package.json`) — embora seja zero deps runtime.

❌ **Fora de escopo:**
- Falhas no Claude Code (reportar à Anthropic em <https://www.anthropic.com/security>).
- Falhas no harness IDE (Cursor, Windsurf — reportar ao fornecedor).
- Vulnerabilidades em projetos que USAM o framework (esse é responsabilidade do projeto).
- Comportamento esperado dos hooks (não é vuln, é design — abrir discussão se quiser mudar).

## Confiança em addons

Addons (`addons/<nome>/`) instalam **código executável** no projeto consumidor: hooks `.js`, scripts em `.claude/skills/`, configurações de `.mcp.json.patch`, regras de `settings.json.patch`. Eles rodam sob a **mesma confiança** do core do framework.

Implicações:

- **Addon oficial (publicado neste repo)** passa pela mesma auditoria do core, vai pra release npm com `provenance` e segue SemVer do framework.
- **Addon de terceiro** (qualquer um fora deste repo, mesmo distribuído por npm com nome parecido) NÃO tem essa garantia. Antes de instalar, audite: leia os `.js` de `hooks/`, verifique se há chamadas de rede, leia o `addon.yaml`, confirme assinatura `npm` do mantenedor.
- O comando `npx roldao-method add <nome>` só aceita addons que ESTÃO no pacote npm oficial (`addons/<nome>/` deste repositório). Não puxa de URL arbitrária. Mas se um terceiro publicar um pacote `roldao-method-addon-X` no npm, é responsabilidade do usuário auditar antes de copiar a mão.
- Comprometimento da release npm oficial é mitigado por: 2FA do mantenedor + `provenance` assinada na pipeline `release.yml`. Se a release `latest` no npm mostrar `provenance: none`, **não instale**.

## O que NÃO consideramos vuln

- Hook bloqueia comando legítimo → ajustar regra ou usar exception documentada.
- Suite de testes não cobre 100% → contribua com PR.
- Performance lenta → otimização, não segurança.
- Falsificação de Co-Authored-By → política de revisão, não tech.

## Comunicação pós-fix

Após patch público:
1. Release nota classifica como `[SECURITY]` no CHANGELOG.
2. GitHub Security Advisory publicado com CVE (se aplicável).
3. Crédito ao reporter (se autorizado).
4. Mensagem no Discord/canais oficiais (sem detalhe técnico que ajude exploit).

## Princípios

- **Verificar antes de afirmar.** Reproduzir antes de publicar fix.
- **Causa raiz, nunca sintoma.** Vuln em parser → consertar parser, não filtrar input.
- **Sem skip em hook** mesmo pra acelerar release.
- **CVE quando aplicável** — não esconder severidade.

## Bug bounty

Não temos programa formal de bug bounty (ainda). Reconhecimento via crédito público + menção em release notes.

---

_Última atualização: 2026-05-18._
