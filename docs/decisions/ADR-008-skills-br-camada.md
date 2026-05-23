---
id: ADR-008
titulo: Skills BR como camada operacional separada de agentes e hooks
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-008 — Skills BR como camada operacional

## Contexto

Validacoes BR (CPF, CNPJ alfanumerico, chave NF-e, Pix, CEP, IE, boleto, BR Code Pix, fixture sintetica) sao **algoritmos deterministicos**, nao decisoes contextuais. Misturar essas validacoes dentro dos agentes (prompts) tem 3 problemas: (1) custo de token a cada chamada, (2) risco de o LLM "achar" o resultado em vez de calcular, (3) ausencia de fonte unica — cada agente faria sua propria validacao com nuances diferentes.

Misturar dentro de hooks (bash + perl) cobre o caso "bloqueio mecanico" mas nao serve quando o agente PRECISA do resultado pra prosseguir (ex: gerar BR Code Pix valido pra incluir no fluxo).

## Decisao

**Skills** sao a camada operacional do framework — codigo Python executavel sob `.claude/skills/<nome>/`, descoberto pelo Claude Code via SKILL.md + `allowed-tools`. Cada skill:
- Tem um algoritmo deterministico documentado.
- Roda em Python 3.8+ (lib-padrao apenas — coerente com ADR-001 zero deps).
- E invocavel por qualquer agente ou pelo Claude principal.
- Tem teste de geracao↔validacao quando aplicavel.

12 skills no core: validar-cpf-cnpj, validar-chave-acesso-nfe, validar-pix, validar-cep, validar-ie, validar-boleto, gerar-br-code, gerar-test-fixture-br, gerar-adr-pt-br (template), traduzir-jargao (LLM-assisted), brainstormar-ideia (LLM-assisted), checklist-lgpd (LLM-assisted).

Skills adicionais em addons (15): pix-arch, validar-webhook-pix, emitir-nfe-55, migrar-cnpj-alfanumerico, gerar-canal-dpo, gerar-ripd, responder-incidente-anpd, resposta-titular, estruturar-open-finance, etc.

## Consequencias

**Positivas:**
- LLM nao "calcula" CPF — invoca a skill, que retorna determinístico.
- Fonte unica: validacao no agente, no hook e no codigo cliente vem da mesma skill.
- Skill expoe API uniforme (CLI Python + import) — cliente pode usar fora do agente.
- Teste cruzado gerador↔validador (em `test/skills.test.js`) pega regressao.

**Negativas:**
- Cliente precisa de Python 3.8+ pra skills algoritmicas funcionarem localmente. Mitigado por (a) skip claro em ambiente sem Python, (b) CI tem Python.
- Skill LLM-assisted (gerar-adr, traduzir-jargao) consome tokens. Aceito — sao raras e o resultado e doc, nao codigo executavel.

## Alternativas descartadas

- **Embutir nos agentes:** descartado (risco do LLM "alucinar" resultado, custo de token, fonte multipla).
- **So em hooks:** descartado (hook bloqueia escrita mas nao **gera** dado quando o agente precisa).
- **Biblioteca npm separada:** descartado por enquanto (ADR-001: zero deps runtime).

## Non-goals

- **Não cobre validações de outros países** — escopo deliberado é Brasil (CPF/CNPJ/NFe/Pix/CEP/IE/boleto). Internacional sai escopo.
- **Não substitui validação no backend de produção** — skill é check pra dev/agente, não enforcement runtime.
- **Não trata schemas de dados em runtime** — skills são algoritmos determinísticos, não framework ORM/validator.

## Como aplicar

- Skill nova: criar `templates/.claude/skills/<nome>/` com `SKILL.md` (descricao + trigger), `validar.py` ou similar, `README.md` no addon README.
- Aderencia: criar quando padrao repete 3x ou quando algoritmo BR e citado em ≥ 2 lugares.
- Teste de geracao↔validacao obrigatorio quando ha par (gerar-X + validar-X).

## Relacionado

- [[ADR-001]] zero deps runtime — skills sao Python lib-padrao.
- [[ADR-007]] addons trazem skills verticais.
