---
description: Replanejamento de iniciativa em curso quando o escopo muda no meio do épico (correct-course). Decide entre atualizar PRD, redesenhar arquitetura, reordenar épico ou recomeçar.
argument-hint: "[motivo-da-mudanca]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Edit, Write, Task
---

# /replanejar — correct-course de iniciativa em curso

Use quando algo MUDOU no meio do trabalho: requisito virou outro, premissa falhou, restrição apareceu, prioridade do negócio mexeu. Não use pra ajustes triviais — use pra mudanças que invalidam parte do PRD/ARQ/épico.

`$ARGUMENTS` = motivo da mudança (1-3 frases).

## Etapa 1 — Diagnóstico (analista + investigador)

Invoque `analista`:
- O que mudou exatamente? (cliente novo, regulação nova, dado novo, prazo encurtado)
- O que continua válido? (não jogue fora o que ainda serve)
- Qual o impacto financeiro/prazo/escopo se mantermos como está?

Invoque `investigador` em paralelo:
- O que já foi implementado vs o que estava planejado?
- O que dá pra reaproveitar? O que precisa ser revertido?

**Saída:** documento `docs/replanejamentos/AAAA-MM-DD-<slug>.md` com diagnóstico.

## Etapa 2 — Quatro caminhos (gerente-produto)

Invoque `gerente-produto` apresentando os 4 caminhos possíveis com tradeoff:

1. **Ajustar PRD** — escopo muda, story plan reordena, ARQ continua válida.
2. **Redesenhar ARQ** — escopo continua, mas premissa técnica caiu (ex: lib não funciona).
3. **Reordenar épico** — escopo+ARQ valem, mas a ordem das stories vai mudar.
4. **Recomeçar** — caso raro: jogar fora e reabrir `/prd`. Justificar por que não dá pra salvar.

Cada caminho deve trazer:
- Esforço estimado (P/M/G)
- Risco residual
- O que vai pro lixo (e por quê)
- Próximo entregável previsto

Decida o caminho de menor risco (preserva mais trabalho + esforço menor) e execute. Reporte qual caminho seguiu e por quê — o usuário reverte se discordar (INV-AGENT-006).

## Etapa 3 — Execução (depende do caminho)

| Caminho | Próximo comando |
|---|---|
| Ajustar PRD | editar `docs/prd/PRD-NNN-*.md` diretamente (via gerente-produto) + redefinir AC das stories |
| Redesenhar ARQ | `tech-lead` produz ADR-NNN-bis com tradeoff, marca ADR antigo como superseded |
| Reordenar épico | reabrir o épico via `/epico` (no épico existente) + atualizar `docs/stories/` |
| Recomeçar | rodar `/prd` do zero, arquivar PRD-NNN-antigo com `status: superseded` |

## Etapa 4 — Comunicação (tech-writer)

Invoque `tech-writer`:
- Escreve nota em PT-BR sem jargão pro cliente/dono de produto sobre o que mudou e por quê.
- Atualiza CHANGELOG.md com seção `### Replanejamento`.
- Marca docs antigos como `status: superseded` apontando pro novo.

## Saída final

```
REPLANEJAMENTO REGISTRADO

Motivo: <1 frase>
Caminho escolhido: <1-4>
Documentos invalidados: <lista>
Documentos atualizados: <lista>
Próximo passo: <comando>
```

## Importante

- **REGRA #0 vale.** Se o motivo é "bug em produção" → use `/bug` primeiro.
- **Não recomendar caminho 4 ("recomeçar") sem ler o que já foi feito** — quase sempre 80% dá pra salvar.
- **Sem jargão** com usuário não-programador.
