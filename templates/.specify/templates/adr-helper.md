---
tipo: helper
owner: framework
revisado-em: 2026-05-24
status: stable
---

# Helper — Como preencher ADR (Architecture Decision Record)

> **Companheiro do template de ADR.** Exemplo completo em [`docs/exemplos/ADR-EXEMPLO.md`](../../docs/exemplos/ADR-EXEMPLO.md).

## Quando criar ADR

- Escolha de stack/biblioteca/framework principal.
- Política que vai pesar em decisões futuras (ex: "sem chamada externa em validação").
- Integração com sistema externo (qual gateway, qual PSP, qual provider).
- Decisão arquitetural não-trivial (multi-tenant, escolha de banco, modelo de auth).

**Não crie ADR pra:** mudança de variável, refactor pequeno, escolha de nome.

## Contexto — 3 padrões úteis

**Bom:**
> "A v1 precisa validar CPF. Existem 2 abordagens: algoritmo local (módulo 11) ou API da Receita Federal. Loja vende ~80 cadastros/dia, não pode travar se internet cair, gerente quer mensagem em < 1s."

**Ruim:**
> "Precisamos validar CPF." ← falta contexto, tradeoff, restrição.

**Bom:**
> "Sistema multi-tenant cresceu pra 200 clientes. Queries lentas em horário de pico (relatório do contador às 18h). Existem 2 caminhos: replicar leitura ou particionar dados."

## Decisão — 1-3 frases diretas

| Ruim | Bom |
|---|---|
| "Vamos usar uma combinação de coisas" | "Validar CPF localmente com algoritmo módulo 11. Sem chamada externa." |
| "Decidimos avaliar" | "Particionar dados por tenant_id (sharding lógico no Postgres)." |

## Consequências — 3 categorias obrigatórias

- **Positivas** (o que ganhamos)
- **Negativas (custo aceito)** ← essa categoria é OBRIGATÓRIA. Toda decisão tem custo. Se você não enxerga, você não pensou.
- **Neutras** (efeito colateral sem juízo)

**3 dicas:**
1. **Tradeoff explícito é o ponto.** Sem custo aceito, ADR é teatro.
2. **Não esconda alternativa rejeitada.** Liste a Opção A, B, C e por que cada uma foi descartada.
3. **"Como reabrir":** liste o gatilho que faria você reverter (ex: "se latência subir > 500ms").

## Alternativas consideradas — formato

```
### Opção A — Nome curto
<descrição em 1-2 frases> — **descartada porque** <razão concreta>.
```

## Quando este helper abre

Skill `gerar-adr-pt-br` ou comando que cria ADR encontra `<contexto>`, `<decisão>` ou `<alternativa>` e propõe sugestões dos padrões acima.
