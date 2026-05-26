---
owner: tech-lead
revisado-em: 2026-05-26
status: aceito
decidido-em: 2026-05-26
decidido-por: Roldao Batista
prd: PRD-004
epico: EP-003
story: US-120
supersedes: []
superseded-by: null
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Auditoria de fluxo interno (10 agentes) — `docs/analises/2026-05-26-melhorias-fluxo-roldao.md` §9 (F3)"
  sintoma-observado: "Escolher prefixo CSS exige o MESMO ritual de escolher banco. Pequenas decisoes viram folclore oral porque ADR e overhead. Em 22 ADRs do framework, ha decisoes triviais (ADR-013 convencao hook node) e estruturais (ADR-001 zero-deps) misturadas — sem gradiente."
---

# ADR-028 — ADR-Lite (DN-NNN) coexiste com ADR completo

> Decisao **aceita** em 2026-05-26 pelo Roldao.

---

## Contexto

O framework hoje exige ADR completo (Contexto + Decisao + 3+ alternativas + Consequencias + Como verificar + Gatilhos de reabertura — ~80-150 linhas) **para qualquer decisao arquitetural nao-trivial**. Em 22 ADRs em disco, ha mistura inadequada:

- ADR-001 (zero-deps) — decisao estrutural fundadora, alto custo de mudar — ADR completo justifica
- ADR-013 (convencao de hook node) — decisao operacional, custo de mudar baixo — ADR completo e overhead

Resultado pratico: decisoes pequenas **viram folclore oral** porque ninguem quer escrever 100 linhas pra escolher prefixo de feature flag. Decisao desaparece, agente da proxima sessao reinventa, drift cresce.

Auditoria de 2026-05-26 (§9 F3):

> "Burocracia uniforme, sem escala de overhead. Escolher prefixo CSS exige o MESMO ritual de escolher banco."

## Decisao

**Conceito novo `Decision Note` (DN-NNN) em `docs/decisions/notas/DN-NNN-*.md`. Template enxuto (≤30 linhas). Coexiste com ADR completo — nao substitui. Skill nova `gerar-decision-note-pt-br` materializa. Comando `/dn <titulo>` chama. Regra de promocao: 3 DNs do mesmo dominio = `meta-cetico` propoe ADR consolidado.**

### Template DN-NNN (≤30 linhas)

```markdown
---
tipo: decision-note
id: DN-NNN
versao: 1
status: aceita
owner: <quem>
revisado-em: AAAA-MM-DD
reversibilidade: alta | media | baixa
custo-de-trocar: <ex: 1h>
quando-virar-adr: <gatilho>
relacionado: [ADR-NNN se houver]
---

# DN-NNN — <titulo curto>

## Contexto (2 linhas)
<por que essa decisao foi tomada agora>

## Decisao (1 linha)
<o que foi decidido>

## Por que nao virou ADR completo
<ex: "reversivel em 1h, custo de troca < 1 dia, sem trade-off arquitetural de longo prazo">

## Como verificar (opcional, 1 linha)
<comando ou file:line se aplicavel>
```

### Quando usar DN vs ADR

| Criterio | ADR | DN |
|---|---|---|
| Reversibilidade | baixa (dificil voltar) | alta (1 dia ou menos) |
| Custo de mudar | alto (sprint+ de trabalho) | baixo (<1 dia) |
| Trade-off de longo prazo | sim | nao |
| Numero de alternativas serias | 3+ | 1-2 |
| Cross-cutting (toca varias areas) | sim | nao (local) |

**Regra pratica:** se a decisao puder ser revertida em 1 dia sem alarme, e DN. Se exige plano de migracao, e ADR.

### Regra de promocao (3 DNs do mesmo dominio = ADR)

Otavio (meta-cetico) le periodicamente `docs/decisions/notas/*.md`. Se 3 DNs marcadas com mesmo dominio (ex: convencao de nomenclatura, prefixo CSS, padrao de log) aparecem em <90 dias, propoe consolidar em ADR formal.

### Comando `/dn <titulo>`

Atalho pra criar DN rapida. Pede 4 campos minimos (titulo, contexto-2-linhas, decisao-1-linha, reversibilidade) e gera arquivo. ~2 min de overhead.

### Numeracao

DNs numerados sequencialmente `DN-001, DN-002...`, separado dos ADRs (ADRs continuam em sua propria sequencia). Em `docs/decisions/notas/`. Visualizacao consolidada via `/adr-mapa` (ADR-025 do PRD-004) — DNs aparecem em secao separada.

### Cycle de vida

```
DN proposta → DN aceita → (opcional) ADR promovido (DN marca status: superseded-by: ADR-NNN)
```

DN com `status: superseded-by:` aponta pra ADR que a substituiu. DN nao desaparece — historia preservada.

## Alternativas consideradas

### Alternativa 1 — Manter so ADR completo (recusada)

Vantagem: simplicidade conceitual. Desvantagens: dor diagnosticada continua; pequenas decisoes viram folclore.

**Recusada.** 22 ADRs misturando trivial e estrutural ja prova o problema.

### Alternativa 2 — Apenas tag `lite: true` no ADR completo (recusada)

Mesmo template, com flag. Vantagens: menos conceito novo. Desvantagens: nao reduz o overhead real de preencher 100 linhas; agente continua tendo que "considerar 3 alternativas" mesmo pra decisao binaria.

**Recusada.** Template enxuto separado tem ROI claro.

### Alternativa 3 — Permitir ADR sem secoes obrigatorias (recusada)

Vantagem: flexibilidade. Desvantagens: rompe contrato do template canonico; cada autor inventa formato; auditoria humana perde estrutura.

**Recusada.** Template firme com 2 tipos (ADR + DN) e melhor que template solto.

### Alternativa 4 — Tweet-sized decision em comentario no codigo (recusada)

Decisao morre em `// decisao: usei X porque Y`. Vantagem: maximo lightweight. Desvantagens: invisivel cross-arquivo; nao versionavel separadamente; nao auditavel.

**Recusada.** Memoria viva no codigo nao serve pra rastreio de decisao.

## Consequencias

### Positivas

- Decisoes pequenas ganham casa formal (sai do folclore)
- Overhead pra "documentar" cai de 100 linhas pra 30
- Comando `/dn` exige 4 campos minimos — barreira baixa
- Otavio detecta padrao (3 DNs mesmo dominio) e sugere consolidacao
- ADR completo continua valido pra decisoes estruturais (preservacao — ADR-031)
- `/adr-mapa` separa ADRs e DNs visualmente

### Negativas

- Mais 1 conceito pra Roldao entender (mitigado pelo template ser auto-explicativo)
- Risco de tudo virar DN e ADR sumir (mitigado por Otavio + tabela "Quando usar")
- DN promovida pra ADR exige refatorar — overhead duplicado nesse caso (mitigado pela frequencia baixa)

### Compativel com

- **ADR-001** (Node puro zero-deps) — Markdown puro, sem dependencia
- **ADR-023** (Framework aprendiz) — Otavio consome DNs pra propor consolidacao
- **ADR-031** (Preservacao de capacidade) — ADR completo continua valido sem mudanca
- **INV-001** — DN e doc versionado
- **INV-005** — ≤30 linhas honra o limite de concisao

## Gatilhos de reabertura

- > 50% das decisoes do projeto viram DN (quase nenhum ADR novo) → criterio "Quando usar" esta liberal demais
- DNs nao promovidas pra ADR mesmo com 5+ DNs do mesmo dominio → Otavio nao esta funcionando OU regra de promocao esta errada
- Roldao reclama de overhead do `/dn` → reduzir campos minimos pra 3

## Como verificar

- Rodar `/dn "Prefixo CSS pra componente de pipeline"` → cria arquivo `DN-001-prefixo-css-pipeline.md` com 4 campos
- Criar 3 DNs em dominio "convencao-de-nomes" → `/auto-auditar-framework` (Otavio) propoe consolidar em ADR
- DN com `reversibilidade: baixa` declarada → `validate-adr-conflict.js` avisa "talvez devesse ser ADR"
- `/adr-mapa` exibe ADRs e DNs em secoes separadas

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial — aguardando aceite do Roldao |
