---
tipo: especificacao-executavel
projeto: <nome-do-projeto>
capacidade: <nome da capacidade de negócio>
criada-em: <AAAA-MM-DD>
status: rascunho | aprovada
---

# Especificação executável — <capacidade>

> Regra de ouro: cada exemplo abaixo vira um teste automático ANTES do código ser escrito.
> Se um exemplo não dá pra transformar em teste, ele está vago demais — reescrever.

## Capacidade
<Uma frase: o que o sistema passa a saber fazer. Ex: "Transferir estoque entre filiais".>

## Invariantes (o que JAMAIS pode quebrar)
- INV-1: <ex: a soma do estoque global não muda numa transferência>
- INV-2: <ex: nenhum lançamento fiscal sem número sequencial>

## Exemplos concretos (DADO / QUANDO / ENTÃO)

### Exemplo 1 — caminho feliz
- **DADO** <estado inicial concreto, com números: "filial A tem 10 unidades, filial B tem 2">
- **QUANDO** <ação: "transferir 4 unidades de A para B e o recebimento for confirmado">
- **ENTÃO** <resultado verificável: "A=6, B=6, total global=12">
- **E** <trilha: "existe registro de quem solicitou, enviou, recebeu e aprovou">

### Exemplo 2 — entrada inválida
- **DADO** <estado>
- **QUANDO** <ação inválida: "transferir 15 unidades de A que só tem 10">
- **ENTÃO** <erro esperado, com mensagem que o usuário entende>

### Exemplo 3 — caso de borda
- **DADO** <estado limite: quantidade zero, mesmo dia, duplicado, sem conexão...>
- **QUANDO** <ação>
- **ENTÃO** <comportamento definido — borda sem resposta definida = pergunta pro dono ANTES de codar>

## Fora de escopo (esta capacidade NÃO faz)
- <ex: não emite nota fiscal da transferência — isso é outra capacidade>

## Aprovação
- Dono aprovou os exemplos em: <data> <como: conversa/mensagem>
