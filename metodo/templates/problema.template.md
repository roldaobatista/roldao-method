---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 01/17
proximo: docs/descoberta/personas.md
idioma: pt-BR
limite-linhas: 100
proposito: definir a dor real, quem sente, evidências e custo atual antes de qualquer decisão técnica
---

<!--
template: descoberta/problema.md
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C1
tamanho-alvo: 1-3 páginas
-->

# Problema — <NomeDoProjeto>

## A dor
<2-4 parágrafos descrevendo a dor real, com evidências. Cite conversa, e-mail
ou dado concreto. Não invente — se não tem evidência, marque hipótese e mova
para `hipoteses-a-validar.md`.>

EE-<NNN> (Entrevista Externa — conversa registrada com pessoa de fora do time, ex: cliente, parceiro, especialista): <referência a entrevista que sustenta esta dor>.

> **Projeto solo/hobby/pessoal:** se não há entrevista externa, usar `EE-AUTO-NNN` (auto-entrevista do próprio dono) registrada em `descoberta/auto-entrevista.md`. O maestro pode propor o draft dessa auto-entrevista a partir da conversa inicial — sem perda de status. Auditor-doc-quality aceita `EE-AUTO-NNN` como referência válida para `tipo: solo` no frontmatter do projeto.

## Quem sente
- <Persona 1>: <papel, contexto>.
- <Persona 2>: <papel, contexto>.
- <Distinguir usuário ≠ comprador se forem pessoas diferentes>.

## Quanto custa hoje
- <Custo em tempo: X horas/semana>.
- <Custo em dinheiro: R$ Y/mês>.
- <Custo em risco: Z>.

## Por que solução existente não resolve
- <Concorrente A>: <por que não serve>.
- <Concorrente B>: <por que não serve>.
- <Status quo (planilha/caderno/ferramenta interna)>: <limitação>.

## Validações pendentes
- <O que ainda é suposição>.
- <Mover pra `hipoteses-a-validar.md` com critério de validação>.

## Critério para promover de `draft` para `stable`

- [ ] A dor tem ≥1 evidência concreta citada (EE-NNN ou EE-AUTO-NNN), não só suposição.
- [ ] "Quem sente" distingue usuário de comprador quando forem pessoas diferentes.
- [ ] Custo de hoje quantificado em R$, horas ou risco — número concreto, não "muito".
- [ ] Pelo menos 1 alternativa existente analisada com o motivo de não resolver.
- [ ] Toda suposição restante movida para `hipoteses-a-validar.md` com critério de validação.

---
> Termos técnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
