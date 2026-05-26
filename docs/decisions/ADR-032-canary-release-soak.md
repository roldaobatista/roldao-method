---
owner: tech-lead
revisado-em: 2026-05-26
status: aceito
decidido-em: 2026-05-26
decidido-por: Roldao Batista
prd: PRD-004
epico: EP-003
story: US-126, US-127
supersedes: []
superseded-by: null
relacionado: [ADR-016]
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Auditoria de fluxo interno (10 agentes) — `docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §10 (P10.7)"
  sintoma-observado: "Hoje todo release vai direto pra latest. Roldao instala em projeto-cobaia e descobre regressao em producao. Usuario do framework e cobaia em producao."
---

# ADR-032 — Canary release via `npm tag next` + 5 dias de soak

> Decisao **aceita** em 2026-05-26 pelo Roldao.

---

## Contexto

A v2.0.0 e versoes anteriores foram publicadas direto em `npm tag latest`. Sem janela de canary. Resultado: cada release que tem regressao chega em todos os projetos clientes simultaneamente.

ADR-016 (Politica de SemVer) ja exige `MIGRATION-vX.md` + pre-release `rc` de 7 dias antes de major bump. Mas:

- Pre-release `rc` na pratica nao foi usado (v2.0.0 saiu sem rc)
- Pre-release vive em tag separada, mas Roldao testa manualmente em projeto-cobaia
- Sem soak formal antes de promover pra `latest`

Auditoria de 2026-05-26 (§10 P10.7) recomendou:

> "Canary release habilitado. `npm publish --tag next` publica `3.0.0-next.0` com `dist-tag = next`. Roldao instala em projeto-cobaia com `npx roldao-method@next install`. 5 dias de soak obrigatorios antes de promover pra `latest`."

Necessario formalizar como processo. v3.0.0 e o primeiro candidato — major bump grande, risco real de regressao em projetos clientes.

## Decisao

**Toda release minor e major do framework passa por canary: `npm publish --tag next` antes de `npm publish --tag latest`. Roldao instala em pelo menos 2 projetos sandbox via `npx roldao-method@next install`. Minimo 5 dias de soak. Hook `enforce-canary-soak.js` (manual, pre-release) verifica idade da tag `next` vs latest commit antes de aceitar `npm dist-tag add` pra latest.**

### Procedimento canonico

```
1. Apos US-127 (Onda 11) entregue, gerar build candidato 3.0.0-next.0
2. Publicar: npm publish --tag next
3. Roldao instala em projeto-sandbox-1: npx roldao-method@next install
4. Roldao instala em projeto-sandbox-2: npx roldao-method@next install
5. Aguardar 5 dias minimos de uso real
6. Se algum bug encontrado: fix → publicar 3.0.0-next.1 → resetar timer 5 dias
7. Apos 5 dias limpos: rodar /explicar-update v2.0.0 v3.0.0 em sandbox-3 (regressao final)
8. Se ok: npm dist-tag add roldao-method@3.0.0 latest
9. Anunciar: gh release create v3.0.0 + tweet/post + email comunidade
```

### Pre-release minors tambem

Mesma regra pra v3.1.0, v3.2.0, etc. Patch (v3.0.1) pula canary se for so fix de bug isolado sem mudanca de regra/hook (decisao do Rafael caso a caso).

### Hook `enforce-canary-soak.js`

Implementado em `tools/release/`. Roda manualmente antes de `npm dist-tag add`:

```
1. Le data de publicacao da versao alvo (npm view roldao-method@<versao> time)
2. Calcula delta vs agora
3. Se < 5 dias E versao e major/minor: exit 2 + mensagem "Aguarde Y dias antes de promover"
4. Se ok: exit 0 + mensagem "Canary completado. OK pra promover."
```

### Sandbox projects (projetos-cobaia)

Roldao mantem pelo menos 2 projetos sandbox dedicados:

- `sandbox-greenfield/` — projeto vazio, testa `/inicio` + onda completa de v3
- `sandbox-brownfield/` — projeto legado v2, testa `/brownfield` + update v2→v3

Pode adicionar mais (sandbox-electron, sandbox-fintech) conforme addons forem maturando.

### Falha de canary (rollback)

Se bug critico encontrado durante soak:

```
1. Roldao para de promover (mantem tag next)
2. Fix em commit + bump pra 3.0.0-next.1
3. Publicar: npm publish --tag next
4. Resetar timer 5 dias
5. Maximo 3 ciclos antes de revisar plano de release (4o ciclo = sinal de PRD com problema)
```

### Compat com workflow `/release` do framework

Workflow `/release` atual (entregue na v2.0.0) ganha modo `--canary`:

```
/release 3.0.0 --canary
```

Faz:
1. Bump `package.json` pra `3.0.0-next.0` (com `-next.<N>` incremental)
2. Atualiza `CHANGELOG.md` com secao `[3.0.0-next.0]`
3. Commit + tag git
4. `npm publish --tag next`
5. NAO faz `gh release create` (so na promocao final)

Versao sem `--canary` (so `/release 3.0.0`):
1. Verifica via `enforce-canary-soak.js` que tag `next` foi promovida
2. Se ok: `npm dist-tag add roldao-method@3.0.0 latest`
3. `gh release create v3.0.0` com release notes em PT-BR (Camila)
4. Atualiza memoria do Roldao com release entregue

### Comunicacao publica do canary

Tweet/post anunciando canary:

```
v3.0.0-next.0 do ROLDAO-METHOD disponivel pra testes.

Instalar: npx roldao-method@next install

5 dias de soak. Ajuda relatando bug em https://github.com/roldaobatista/roldao-method/issues

Vai virar latest em 2026-MM-DD se nao tiver regressao.
```

### Documentacao em MIGRATION-v3.md

Secao "Canary release" no `MIGRATION-v3.md` (PRD-004 US-127 AC-127-1):

```markdown
## Como atualizar antes da release final

`npx roldao-method@next install` baixa a versao em canary.

Ela e estavel mas pode ter bug residual descoberto durante o soak de 5 dias.

Se voce atualizou via @next e encontrou bug:
1. Abra issue: https://github.com/roldaobatista/roldao-method/issues
2. Volte pra latest: npx roldao-method@latest install
3. Aguardamos resolver em 1-2 dias e ressubimos 3.0.0-next.<N+1>
```

## Alternativas consideradas

### Alternativa 1 — Sem canary, ir direto pra latest (recusada)

Vantagem: ciclo de release mais rapido. Desvantagens: regressao chega em todos simultaneamente; dor diagnosticada permanece.

**Recusada.** Risco alto demais pra release major.

### Alternativa 2 — Canary mais longo (10-15 dias) (recusada parcial)

Mais soak. Vantagens: pega mais regressao. Desvantagens: ciclo de release fica lento demais; Roldao perde momentum.

**Recusada por enquanto.** 5 dias e suficiente pra v3.0.0; revisar se 2 ou 3 ciclos de patch acontecerem dentro do soak.

### Alternativa 3 — Canary so pra major (sem minor) (recusada)

Vantagem: minor sai mais rapido. Desvantagens:

- Minor pode ter regressao tambem (US-117 adiciona hook novo que pode ter bug)
- Quebra padrao "todo release passa por gate"

**Recusada.** Minor tambem passa.

### Alternativa 4 — Beta tester program publico (recusada)

Outros usuarios alem do Roldao testam canary. Vantagens: cobertura maior. Desvantagens:

- Framework ainda nao tem comunidade de tamanho pra justificar
- Coordenacao de beta testers e overhead
- Roldao foi explicito: produto sem comunidade publica formalizada ainda

**Recusada por enquanto.** Revisar quando framework tiver >100 instalacoes ativas.

## Consequencias

### Positivas

- Regressao em release major pega em sandbox, nao em producao do cliente
- Roldao deixa de ser cobaia em producao
- Mantenedor de addon ganha janela de 5 dias pra testar contra a versao nova
- Comunicacao publica do canary educa mercado sobre processo
- Hook `enforce-canary-soak.js` evita promocao acidental

### Negativas

- Ciclo de release fica 5 dias mais lento (no minimo)
- Roldao precisa lembrar de instalar em sandboxes (mitigado por comando `/release --canary`)
- Bug encontrado no dia 4 reseta timer — release pode escorregar 10 dias se infeliz
- Manter 2 sandbox projects = mais 2 repos pra Roldao gerenciar
- Tweet/post de canary exige escrever PT-BR claro (Camila ajuda)

### Compativel com

- **ADR-016** (Politica SemVer) — refina pre-release `rc` em `next` tag
- **ADR-031** (Preservacao de capacidade) — canary protege a preservacao na pratica
- **INV-AGENT-005** — promocao pra latest exige autorizacao explicita do Roldao (`npm dist-tag` e mudanca publica)
- **INV-001** — release notes em PT-BR vivem em `docs/releases/`

## Gatilhos de reabertura

- Soak de 5 dias mostrar > 2 regressoes em 3 releases consecutivos → aumentar pra 10 dias
- Hook `enforce-canary-soak.js` causar > 1 falso positivo → revisar logica de tempo
- Comunidade ativa > 100 instalacoes → considerar beta tester program publico (Alternativa 4)
- Sandbox project virar inviavel de manter → reduzir pra 1 + delegar pra usuario voluntario

## Como verificar

- `npm publish --tag next` em build candidato → `npm view roldao-method dist-tags` mostra `next: 3.0.0-next.0`
- `npx roldao-method@next install` em sandbox → instala 3.0.0-next.0, NAO afeta projetos em latest
- `enforce-canary-soak.js` rodando 1h apos publicar `next` → exit 2 "Aguarde 5 dias"
- `enforce-canary-soak.js` rodando 6 dias apos publicar `next` → exit 0 "OK pra promover"
- `npm dist-tag add roldao-method@3.0.0 latest` apos soak → projetos clientes que rodam `npm install roldao-method` (sem `@next`) pegam 3.0.0

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial — aguardando aceite do Roldao |
