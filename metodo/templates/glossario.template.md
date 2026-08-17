---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 16/17
proximo: docs/descoberta/sintese-final.md
idioma: pt-BR
limite-linhas: 300
proposito: glossário de termos do produto e do domínio para manter linguagem comum entre dono, equipe e agente IA
---

<!--
template: glossario.md
destino: docs/glossario.md
uso: glossário de termos do produto/negócio do projeto destino.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C1
-->

# Glossário do Produto — <NomeDoProjeto>

> **Escopo deste glossário:** termos do **domínio do produto** — entidades de negócio, papéis, estados de máquina, abreviações usadas em código.
>
> **Não confundir com `GLOSSARIO-ROLDAO.md` (raiz):** aquele traduz jargão TÉCNICO (PR, commit, lint, deploy, build, CI...) para linguagem de dono não-técnico. Este aqui é jargão de NEGÓCIO/PRODUTO. Não duplicar entradas entre os dois.

> Toda outra doc usa estes termos. Inconsistência de termo = bug.
> Sinônimos NÃO entram. Se faltar termo, adicionar aqui antes de escrever doc/código novo.

## Tabela canônica

| Termo | Definição | Tradução PT↔EN | Evite sinônimos de |
|---|---|---|---|
| cliente | Pessoa física ou jurídica que paga pelo produto. Tem contrato ativo. | customer | usuário, comprador, lead, contratante |
| usuário | Pessoa que opera o sistema. Pode ser do cliente, do nosso time ou anônimo. | user | operador, login, conta, perfil |
| lead | Contato em prospecção, ainda sem contrato. | lead | prospect, interessado, contato, candidato |
| tenant | Unidade lógica de isolamento de dados em sistema multi-cliente (geralmente 1 cliente = 1 tenant). Referenciado por `INV-TENANT-*` (invariantes de isolamento). | tenant | organização, workspace, espaço, conta |
| módulo | Recorte funcional do produto com spec.md, plan.md e tasks.md próprios. | module | feature, área, seção, pacote |

<!-- Mínimo: 20 termos antes de o repositório sair do status "pronto-pra-codar".
     Inclua: entidades de negócio, papéis, estados de máquina, abreviações usadas em código. -->

## Como atualizar

1. Adicionar linha nova respeitando ordem alfabética por termo.
2. Preencher TODAS as colunas. Coluna "Evite sinônimos de" é OBRIGATÓRIA — é o que blinda contra termo solto em outra doc.
3. Bump de `revisado-em` no frontmatter.
4. Se o termo aparece em código, abrir ADR se mudar a tradução PT↔EN (rename custa).

## Critério para promover de `draft` para `stable`

- [ ] ≥20 termos do domínio cadastrados na tabela canônica.
- [ ] Todas as colunas preenchidas em cada linha, inclusive "Evite sinônimos de".
- [ ] Tabela em ordem alfabética por termo.
- [ ] Nenhuma entrada duplica jargão técnico já coberto por `GLOSSARIO-ROLDAO.md`.
- [ ] Termos usados nas outras docs de Descoberta estão todos definidos aqui.
