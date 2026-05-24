---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Estendendo o ROLDAO-METHOD

> **TL;DR**
> - **Agente:** copie `templates/.claude/agents/dev-senior.md` → ajuste `name`/`description`/`tools`. Detalhes: [`agente.md`](EXTENDENDO/agente.md).
> - **Hook:** esqueleto + registro em `settings.json` + caso de teste. Detalhes: [`hook.md`](EXTENDENDO/hook.md).
> - **Skill:** `SKILL.md` + script Python stdlib. Detalhes: [`skill.md`](EXTENDENDO/skill.md).
> - **Addon:** `addon.yaml` + estrutura `.claude/` espelhada. Detalhes: [`addon.md`](EXTENDENDO/addon.md).
> - **Antes de commitar:** `npm test` (roda validadores + testes).

Pré-requisito: ler [`ARQUITETURA.md`](ARQUITETURA.md) e [`COMO-FUNCIONA.md`](COMO-FUNCIONA.md).

## Decisão: o quê criar

| Quando criar | O quê | Guia |
|---|---|---|
| Papel novo no time virtual | Agente | [`EXTENDENDO/agente.md`](EXTENDENDO/agente.md) |
| Regra mecânica de bloqueio/aviso | Hook | [`EXTENDENDO/hook.md`](EXTENDENDO/hook.md) |
| Procedimento reutilizável com gatilho | Skill | [`EXTENDENDO/skill.md`](EXTENDENDO/skill.md) |
| Pacote completo de domínio (Electron, Pix, eSocial) | Addon | [`EXTENDENDO/addon.md`](EXTENDENDO/addon.md) |

## Quando NÃO criar

- **Agente:** 15 já é o teto razoável. Refine o existente em vez de criar #16.
- **Hook:** cenário que acontece 1x por mês vira regex frágil — não compensa.
- **Skill:** padrão só repetiu 1-2 vezes — espere 3 (regra de 3).
- **Addon:** domínio cabe em 1 skill — addon é overhead.

## Quality gates

```bash
npm test
```

Equivale a: validar templates + rodar hooks + install + skills + addons + adapters. Detalhes em [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
