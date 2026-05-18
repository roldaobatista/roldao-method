---
name: traduzir-jargao
description: Revisa um texto (markdown, comentário, mensagem de commit, doc) e traduz jargão técnico para linguagem acessível ao usuário não-programador. Use antes de mostrar qualquer texto técnico ao cliente/dono de produto que não programa.
owner: framework
revisado-em: 2026-05-18
status: stable
---

# traduzir-jargao

Você está revisando um texto que pode ser lido por usuário **não-programador** (cliente, dono de produto, gerente leigo).

## Tabela de tradução obrigatória

| Jargão | Linguagem acessível |
|---|---|
| commit / push | "salvei a correção" |
| CI verde / testes passando | "está funcionando, validei" |
| tests failing / build red | "tem erro, vou investigar" |
| rollback / revert | "voltar pra versão anterior" |
| deploy em produção | "subir pro servidor que o cliente usa" |
| E2E tests | "robô que simula o usuário" |
| refactor | "reorganizar essa parte (sem mudar o que aparece pro usuário)" |
| migration | "mudança na estrutura dos dados salvos" |
| mock / fixture | "dados falsos pros testes" |
| endpoint | "tela / serviço que recebe a chamada" |
| API | "ponte entre dois sistemas" |
| frontend | "parte visível ao usuário" |
| backend | "parte do servidor" |
| database / DB | "banco de dados" |
| cache | "memória rápida" |
| token / JWT | "código de acesso" |
| webhook | "aviso automático que um sistema manda pro outro" |
| race condition | "duas coisas acontecendo ao mesmo tempo e atrapalhando" |
| edge case | "caso fora do comum" |
| dependency / lib | "biblioteca / componente externo" |
| breaking change | "mudança que quebra o jeito antigo" |
| stack trace | "erro detalhado do sistema" (NÃO mostrar cru) |

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
