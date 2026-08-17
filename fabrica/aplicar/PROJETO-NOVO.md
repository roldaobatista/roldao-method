---
proposito: Roteiro para projeto NOVO, do zero — encadeia as 3 camadas do produto.
idioma: pt-BR
---

# Aplicar a Fábrica em projeto novo (do zero)

Ordem das camadas para um projeto que ainda não existe:

## 1. Nascimento — `metodo/`
Seguir o `metodo/QUICKSTART.md` (o antigo "Modelo Projeto Novo", agora incorporado aqui).
Ele constrói a estrutura documental completa ANTES da primeira linha de código:
constituição, regras inegociáveis, specs, planos, tarefas.

## 2. Guarda-corpos — raiz do repositório
```
npx roldao-method init
```
Hooks mecânicos ativos desde o primeiro commit.

## 3. Operação — `fabrica/`
Quando o projeto sai da fase de estruturação e entra em desenvolvimento contínuo,
as mudanças passam a seguir o Caminho Padrão (`fabrica/FABRICA.md`) e o roteiro
`aplicar/PROJETO-EXISTENTE.md` (passos 1, 2 e 4).

> Resumo: `metodo/` cria o projeto certo; `fabrica/` mantém ele certo; os hooks
> impedem os erros que nenhum dos dois previu.
