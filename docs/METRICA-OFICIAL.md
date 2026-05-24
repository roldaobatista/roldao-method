---
owner: gerente-produto (Sofia)
revisado-em: 2026-05-24
status: stable
---

# Métrica oficial do framework ROLDAO-METHOD

## A métrica é: **5 tarefas-tipo que o Roldão executa sozinho, sem ajuda humana técnica**.

Não é "10/10 dos auditores", não é "cobertura de testes", não é "número de hooks". É **uma pessoa específica que não programa fazendo a tarefa do início ao fim sem chamar um dev**.

---

## Por que essa métrica e não outra

Auditor pode dar 10/10 e o Roldão continuar travado. Cobertura de testes pode ser 100% e o cliente continuar sem entender o que aconteceu. Hooks podem barrar tudo e o sistema ficar inutilizável.

A única métrica que importa é: **o dono de produto não-programador consegue operar?**

Se sim, o framework cumpre o propósito.
Se não, qualquer outra métrica é teatro.

---

## As 5 tarefas-tipo (gate do épico EP-002)

| # | Tarefa | Quem executa | Como sabemos que passou |
|---|---|---|---|
| 1 | Iniciar projeto novo do zero (`/inicio`) e completar sem `_(preencher)_` restando | Roldão | `npx roldao-method doctor` retorna zero placeholders no AGENTS.md |
| 2 | Adotar o framework em projeto que já existe (`/brownfield`) | Roldão | `.claude/` instalado + AGENTS.md preenchido sem ajuda |
| 3 | Reportar bug e ver investigador rodar antes do dev (`/bug "tela X errada"`) | Roldão | Hook `require-investigador-before-fix.js` bloqueia se pular |
| 4 | Pedir feature nova (`/feature US-NNN`) e ver pipeline completo até auditores aprovarem | Roldão | Hook `enforce-pipeline-completion.js` valida sequência |
| 5 | Subir release fechada (`/release`) com CHANGELOG em PT-BR claro pro cliente final | Roldão | CHANGELOG ganha bloco "O que muda pra você" sem jargão |

**Validação ao vivo:** Roldão executa cada uma sozinho em sessão registrada em `docs/auditorias/<data>-validacao-5-tarefas-tipo.md`. Cada uma marca "passou/não passou" com SHA do commit gerado.

---

## O que NÃO conta como "passou"

- Roldão chamou o dev pra entender output → não passou.
- Roldão precisou abrir 17 arquivos `.md` pra descobrir o que rodar → não passou.
- Output veio em inglês ou com jargão sem tradução → não passou.
- Hook bloqueou e a mensagem não disse como destravar → não passou.
- Roldão precisou rodar comando que não estava no `/help` ou no `npx roldao-method search` → não passou.

---

## Origem

US-116 T-004 (L4) do PRD-003 / EP-002. Decisão do Roldão registrada em PRD-003 §6 (linhas 199+).

## Referências

- `docs/prd/PRD-003-v2-0-auditoria-10-de-10.md` §6 — origem da métrica
- `docs/epicos/EP-002-v2-0-auditoria-10-de-10.md` — gate do épico
- `docs/stories/US-116-sprint-5-docs-leigo-l1-l4-polimento.md` T-018 — validação ao vivo (pendente)
