---
tipo: bug-vira-teste
projeto: <nome-do-projeto>
data: <AAAA-MM-DD>
severidade: baixa | media | alta | critica
---

# Bug → Teste — <título curto do bug>

> Regra da Fábrica: bug corrigido sem teste de regressão é dívida.
> Este registro fecha o ciclo: o mesmo bug NUNCA volta sem ser detectado.

## Efeito visível (o que o usuário viu)
<Ex: "o PDF do certificado saiu sem a logomarca do cliente". Sem stack trace — o efeito.>

## Causa raiz (o que estava errado de verdade)
<Onde o dado/fluxo nasce errado. Ex: "a flag exibir_logo era gravada como 0 no auto-save,
o template estava certo". Se a causa escrita aqui é um sintoma, a investigação não terminou.>

## Onde foi consertado
- Arquivo(s): <caminho:linha>
- Consertado no PONTO RAIZ? sim/não — <se não, por quê e qual o plano>

## Teste de regressão criado
- Arquivo do teste: <caminho>
- O que ele prova: <1 frase — reproduz o cenário do bug e falha se ele voltar>
- Rodou e passou em: <data> (e FALHAVA antes da correção — confirmar que o teste pega o bug)

## Generalizável? (opcional, mas valioso)
<Esse bug revela um padrão? Ex: "todo caminho de auto-save precisa dos mesmos campos da emissão".
Se sim → virou regra em: <CLAUDE.md do projeto / REGRAS-INEGOCIAVEIS / hook>. Se não, deixar em branco.>
