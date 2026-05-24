---
name: traduzir-jargao
description: Revisa um texto (markdown, comentário, mensagem de commit, doc) e traduz jargão técnico para linguagem acessível ao usuário não-programador. Use antes de mostrar qualquer texto técnico ao cliente/dono de produto que não programa.
owner: framework
revisado-em: 2026-05-18
status: stable
---

# traduzir-jargao

Você está revisando um texto que pode ser lido por usuário **não-programador** (cliente, dono de produto, gerente leigo).

## Argumentos (args binding)

A skill aceita `args="<texto a traduzir>"`. Se `args` está vazio, peça ao agente chamador o texto (não ao usuário final). Saída: o texto reescrito com jargão substituído pela linguagem acessível da tabela abaixo, em PT-BR.

## Tabela de tradução obrigatória

> **Sincronizada** com a regex de `block-jargon-pt-br.js` (hook). Sempre que adicionar termo aqui, adicione no hook também (e vice-versa). Auditoria: `node tools/auditar-tabela-jargao.js` (US-114 T-010).

### Git / workflow

| Jargão | Linguagem acessível |
|---|---|
| commit / push | "salvei a correção" |
| pull / merge | "trouxe / juntei a mudança" |
| branch | "ramo de trabalho separado" |
| rebase | "reordenei as gravações" |
| revert / rollback | "voltar pra versão anterior" |
| amend | "reescrever a última gravação" |
| diff | "comparação entre versões" |
| checkout / stash / cherry-pick / bisect | "trocar de versão / guardar mudança / pegar gravação específica / caçar quando o bug entrou" |

### CI / deploy

| Jargão | Linguagem acessível |
|---|---|
| CI verde / testes passando | "está funcionando, validei" |
| tests failing / build red | "tem erro, vou investigar" |
| deploy em produção | "subir pro servidor que o cliente usa" |
| build | "monto o pacote pra subir" |
| lint | "passei o pente fino no código" |
| pipeline | "sequência automática de validações" |
| hotfix | "correção urgente" |

### Arquitetura / código

| Jargão | Linguagem acessível |
|---|---|
| endpoint | "tela / serviço que recebe a chamada" |
| API | "ponte entre dois sistemas" |
| frontend | "parte visível ao usuário" |
| backend | "parte do servidor" |
| database / DB | "banco de dados" |
| cache | "memória rápida" |
| token / JWT | "código de acesso" |
| webhook | "aviso automático que um sistema manda pro outro" |
| payload | "pacote de dados enviado / recebido" |
| refactor | "reorganizar essa parte (sem mudar o que aparece pro usuário)" |
| repo / repository | "pasta do projeto versionado" |

### Testes / dados

| Jargão | Linguagem acessível |
|---|---|
| mock / fixture | "dados falsos pros testes" |
| migration | "mudança na estrutura dos dados salvos" |
| E2E tests | "robô que simula o usuário" |
| dependency / lib | "biblioteca / componente externo" |
| breaking change | "mudança que quebra o jeito antigo" |

### Debug

| Jargão | Linguagem acessível |
|---|---|
| stack trace | "erro detalhado do sistema" (NÃO mostrar cru) |
| null pointer | "tentou usar uma coisa que não existe" |
| race condition | "duas coisas acontecendo ao mesmo tempo e atrapalhando" |
| edge case | "caso fora do comum" |
| runbook | "passo a passo de plantão" |
| breakpoint | "parar o código pra investigar" |

## Regras

1. **Stack trace nunca vai cru pro cliente.** Traduzir pra "efeito visível" (ex: "tela do financeiro não carrega").
2. **Termos sem tradução boa (Pix, NF-e, CPF)** ficam como estão.
3. **Manter PT-BR correto:** acentos, "não" e não "nao".
4. **Se o texto já está acessível,** dizer "OK, texto já está bom" e não mexer à toa.

## Saída esperada

Devolver o texto traduzido + lista das mudanças aplicadas:

```
TEXTO REVISADO:

<texto traduzido>

MUDANÇAS:
- linha N: "X" → "Y" (motivo)
- ...
```
