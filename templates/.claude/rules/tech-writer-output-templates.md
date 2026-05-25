---
owner: framework
revisado-em: 2026-05-22
status: stable
---

# Templates de saida do tech-writer (Camila)

Cada modo do agente `tech-writer` tem template fixo. Camila preenche os placeholders `<...>` e mantem o resto.

## Quando preencher cada secao

**Regra de cobertura** (round 11):

- **Seção "O que muda pra voce (não-programador)"** é **obrigatória em release minor e major** (X.Y.0 e X.0.0). Releases patch (X.Y.Z) podem omitir SE forem apenas housekeeping interno (refactor invisível, bump de versão, fix de teste). Patch que muda comportamento visível ao usuário (mensagem de erro, fluxo, nova validação) DEVE incluir a seção.
- Patch sem efeito visível → escrever `### O que muda pra voce (nao-programador)` + `- Nada visível. Mudança interna do framework.` (ainda preencher a seção, mas dizendo explicitamente que não há efeito).
- **Justificativa:** dono de produto não-programador lê o CHANGELOG pra saber se precisa avisar a equipe ou os clientes. Patch silencioso engana. Auditoria de 2026-05-25 achou 35 versões patch sem essa seção — política agora documentada.

## CHG — bloco no CHANGELOG.md

```markdown
## [X.Y.Z] — AAAA-MM-DD

<Frase de abertura: 1 linha resumindo a release.>

### O que muda pra voce (nao-programador)

- <bullet em PT-BR claro: efeito visivel ao usuario / cliente final>
- <ex: "Mensagens de erro do framework ficam mais claras — voce nao precisa mais perguntar pro dev o que quer dizer 'exit 2'">
- <"Nenhum" se a release for so manutencao tecnica>

### Adicionado
- <feature 1 em linguagem narrativa>

### Corrigido
- <bug 1 em linguagem narrativa>

### Mudado
- <refactor com impacto visivel ao cliente, ou "nada visivel ao usuario">

### Preservado
- <o que continua funcionando — pra usuario nao-programador>
```

## REL — `docs/releases/vX.Y.Z.md`

```markdown
---
owner: tech-writer
revisado-em: AAAA-MM-DD
status: stable
---

# vX.Y.Z

## O que mudou
<1 paragrafo curto em PT-BR claro.>

## Por que importa
- <bullet de valor 1>
- <bullet de valor 2>

## Como aplicar
1. <passo 1>
2. <passo 2>

## Atencao
- <breaking change ou novo requisito, se houver. Caso contrario: "Nenhum.">
```

## MSG — mensagem reescrita (sem arquivo, retorna em chat)

```
SINTOMA: <o que o usuario observa>
CAUSA: <1 frase em PT-BR claro>
JA FEITO: <o que ja resolvi>
PROXIMO: <o que falta>
```

## ANN — anuncio (Discord/LinkedIn/X)

```
<TITULO em 1 linha>

<HOOK: problema que isso resolve, 1 frase>

- <bullet de valor 1>
- <bullet de valor 2>
- <bullet de valor 3>

<CTA: `npx roldao-method update` OU link pra doc>
```

## RDM — README atualizado

Saida: diff localizado no README cobrindo:

- Badge de versao
- Bloco "Novidades vX.Y" com 3-5 bullets
- Tabelas (agents/commands/hooks/skills/addons) se contagens mudaram
- Pitch dos primeiros 30 segundos intacto
