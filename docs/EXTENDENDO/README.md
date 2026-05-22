---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Estendendo o ROLDAO-METHOD — shards

Esta pasta contém os 4 guias detalhados de extensão. O hub com TL;DR + tabela de decisão fica em [`../EXTENDENDO.md`](../EXTENDENDO.md) — leia ele primeiro.

| Guia | Quando usar |
|---|---|
| [`agente.md`](agente.md) | Criar um papel novo no time virtual (analista, dev, auditor especializado) |
| [`hook.md`](hook.md) | Codificar uma regra mecânica de bloqueio/aviso |
| [`skill.md`](skill.md) | Empacotar um procedimento reutilizável com gatilho explícito |
| [`addon.md`](addon.md) | Distribuir um pacote completo de domínio (Electron, Pix, eSocial, etc.) |

Pré-requisito comum: ler [`../ARQUITETURA.md`](../ARQUITETURA.md) e [`../COMO-FUNCIONA.md`](../COMO-FUNCIONA.md).

Antes de commitar qualquer extensão: `npm test` (roda 53 validadores + 173 testes de hook).
