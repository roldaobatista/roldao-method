---
tipo: tarefa-fabrica
projeto: <nome-do-projeto>
tier: <0-4>
criada-em: <AAAA-MM-DD>
status: aberta | em-andamento | pronta
---

# Tarefa — <título curto e imperativo>

## Objetivo verificável
<Uma frase: o que existe/funciona quando esta tarefa terminar. Deve ser binário: dá pra provar que sim ou que não.>

## Efeito visível pro usuário/cliente
<O que muda na tela, no PDF, no relatório, no bolso. "Nada visível" também é resposta válida — dizer o porquê.>

## Escopo de arquivos
- **Permitidos:** <caminhos/pastas onde a mudança pode acontecer>
- **Proibidos:** <o que NÃO tocar nesta tarefa — ex: schema do banco, template do PDF, config de produção>

## Fontes de autoridade
<De onde vem a regra: requisito aprovado, portaria/norma, contrato de API, decisão do dono em (data). Se a fonte é "achismo do agente", a tarefa não está pronta pra começar.>

## Impacto em dados/contratos
<Muda estrutura de dados salvos? Muda formato que outro sistema consome? Se sim: compatibilidade e migração aqui.>

## Testes exigidos
<Quais testes provam o objetivo. Tier 3+: os exemplos DADO/QUANDO/ENTÃO da especificação executável viram testes ANTES do código.>

## Plano de volta (rollback)
<Se der errado depois de integrado: como desfazer. Tier 0-1 pode ser "reverter o commit". Tier 3+ precisa ser específico.>

## Pronto quando (done when)
- [ ] <evidência 1 — ex: teste X passa>
- [ ] <evidência 2 — ex: fluxo Y validado na tela>
- [ ] Nenhum teste que passava antes quebrou
- [ ] Evidência registrada (tier 2+: `evidencia.template.md`)
