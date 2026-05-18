---
description: Faz retrospectiva curta apos release/marco. Captura o que funcionou, o que nao funcionou, o que aprender. Grava em docs/retros/AAAA-MM-DD.md.
argument-hint: "[marco-ou-release]"
disable-model-invocation: true
---

# /retro — retrospectiva apos marco

Voce vai conduzir uma retrospectiva curta (15 min) sobre o ciclo recem-finalizado.

Use `$ARGUMENTS` como referencia do marco (ex: "release 0.3", "sprint 12", "lancamento beta").

## Etapa 1 — Coletar contexto

Sem chamar agente ainda, levante:
- Periodo coberto (data inicio -> data fim).
- Stories entregues (`docs/stories/` com status `entregue` no periodo).
- ADRs aceitos.
- Bugs reportados/resolvidos.
- Auditoria de seguranca/qualidade no periodo (resultados).

Use `git log --since="<inicio>" --until="<fim>" --oneline` pra acelerar.

## Etapa 2 — Perguntas estruturadas (formato 4L)

Pergunte ao usuario, ou responda voce mesmo se o usuario nao tem tempo:

1. **Liked** — o que funcionou bem? (manter)
2. **Learned** — o que aprendemos? (insight pra evitar replanejamento futuro)
3. **Lacked** — o que faltou? (recurso, doc, decisao, pessoa)
4. **Longed for** — o que faria a gente acelerar 2x na proxima? (sonho realista)

## Etapa 3 — Acoes concretas

Cada item Lacked/Longed for vira **1 acao** com dono e prazo:

```
- [ ] criar template de ADR para integracao externa — owner: tech-lead — prazo: proximo /feature
```

## Etapa 4 — Atualizar AGENTS.md secao 10 (pendente)

Adicionar acoes geradas em "10. O que esta pendente" do AGENTS.md.

## Saida — arquivo

Criar `docs/retros/AAAA-MM-DD-marco.md` com frontmatter:

```yaml
---
tipo: retro
data: AAAA-MM-DD
marco: <nome>
owner: <quem-conduziu>
revisado-em: AAAA-MM-DD
status: stable
---

# Retro — <marco>

## Periodo
AAAA-MM-DD -> AAAA-MM-DD

## Entregas
- N stories
- N ADRs
- N bugs corrigidos

## 4L

### Liked
- <item>

### Learned
- <item>

### Lacked
- <item>

### Longed for
- <item>

## Acoes
- [ ] <acao> — owner: <quem> — prazo: <quando>
```

## Saida final

```
RETROSPECTIVA CONCLUIDA

Arquivo: docs/retros/AAAA-MM-DD-marco.md
Acoes geradas: <N>
AGENTS.md secao 10 atualizado: sim

Proximo /retro recomendado: ao fechar proximo marco.
```

## Importante

- **Curto.** 15 minutos. Se virar reuniao de 2h, e auditoria, nao retro.
- **Acao com dono.** Acao sem dono vira nada.
- **Sem culpado.** O foco e o sistema, nao a pessoa.
