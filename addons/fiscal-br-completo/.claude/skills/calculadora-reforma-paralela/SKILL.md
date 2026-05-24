---
name: calculadora-reforma-paralela
description: Guia + estrutura de implementacao do calculo paralelo da Reforma Tributaria (LC 214/2025) — regime atual (ICMS/ISS/PIS/COFINS) vs regime novo (CBS/IBS/IS) durante a transicao 2026-2033. Use ao implementar feature tributaria nova, atualizar calculadora existente, ou auditar feature fiscal apos 2026-01.
owner: fiscal-br-completo
revisado-em: 2026-05-24
status: stable
---

# calculadora-reforma-paralela

Implementacao do **calculo dual** exigido pela LC 214/2025 durante a transicao da Reforma Tributaria Brasileira (FISCAL-006).

## Contexto

Entre **2026-01-01 e 2033-12-31** os tributos sobre consumo no Brasil convivem em DOIS regimes:

| Regime | Tributos | Quem cobra |
|---|---|---|
| Atual (decrescente) | ICMS, ISS, PIS, COFINS, IPI | Estado/Município/União |
| Novo (crescente) | CBS, IBS, IS (seletivo) | União + Estados/Municípios via Comitê Gestor |

A alíquota efetiva do regime novo cresce gradualmente:

| Ano | Regime atual (%) | Regime novo (%) |
|---|---|---|
| 2026 | 100% | **0,9% (teste)** — sem efeito caixa, só prova de conceito |
| 2027 | redução IPI, CBS começa | CBS sob alíquota fechada |
| 2028 | 90% | 10% |
| 2029 | 80% | 20% |
| 2030 | 70% | 30% |
| 2031 | 60% | 40% |
| 2032 | 50% | 50% |
| 2033 | regime atual extinto | 100% — IBS substitui ICMS/ISS, CBS substitui PIS/COFINS |

**Split payment** pode entrar em vigor antes do regime pleno (depende de regulamentacao).

## Quando usar esta skill

- Implementar calculadora de imposto pela primeira vez **depois de 2026-01-01**.
- Auditar calculadora existente — confirmar que ja calcula em paralelo.
- Decidir como apresentar ao cliente os dois valores no documento fiscal.
- Documentar ADR da feature tributaria — qual ano de transicao cobre.

## Estrutura recomendada

```
calculadora-imposto/
  regimes/
    atual.ts        # ICMS/ISS/PIS/COFINS — codigo legado
    novo.ts         # CBS/IBS/IS — novo
  transicao.ts      # roteador: chama os dois, retorna dual
  aliquotas/
    cbs-ibs-2026.json   # alíquotas vigentes por ano + UF/município
    icms-por-uf.json    # icms atual
  README.md         # ADR-linkado documentando o regime de cada feature
```

## Algoritmo dual (pseudocodigo)

```typescript
interface ResultadoTributario {
  regimeAtual: { icms: number; iss: number; pis: number; cofins: number; total: number };
  regimeNovo:  { cbs: number; ibs: number; is: number; total: number };
  totalDevido: number;        // o que efetivamente vai ser cobrado este ano
  anoTransicao: number;       // ano corrente do calculo (input)
  parametros: AliquotaParametros;
}

function calcularDual(operacao: Operacao, ano: number): ResultadoTributario {
  const atual = calcularRegimeAtual(operacao);
  const novo  = calcularRegimeNovo(operacao, ano);
  // Durante a transicao, o "totalDevido" depende do ano:
  // - 2026: regime atual integral + 0,9% CBS teste (nao cobrado)
  // - 2027-2032: mix proporcional
  // - 2033+: so regime novo
  const totalDevido = composicaoPorAno(atual, novo, ano);
  return { regimeAtual: atual, regimeNovo: novo, totalDevido, anoTransicao: ano, parametros: {...} };
}
```

## ADR obrigatorio

Toda feature tributaria nova deve abrir ADR declarando:
1. Qual ano de transicao a feature cobre.
2. Se split payment esta implementado.
3. Como tratar bens/servicos com aliquota especifica do IS (Imposto Seletivo).
4. Como apresentar valor ao cliente no documento (linha do regime atual + linha do regime novo? só total?).
5. Auditoria: quem valida que a soma dos dois regimes bate com o esperado pelo contador.

## Non-goals desta skill

- Nao substitui consultoria contabil-fiscal.
- Nao gera DARF/guia de recolhimento automaticamente — depende do ERP.
- Nao cobre o periodo > 2033 (regime novo pleno) — quando chegar, esta skill vira "calculadora-regime-novo".

## Regras envolvidas

FISCAL-006 (Reforma Tributaria — calculo paralelo 2026-2033), FISCAL-007 (obrigacao acessoria), INV-002 (spec gera codigo — ADR antes da implementacao).

## Referencias

- LC 214/2025 (Lei Complementar da Reforma Tributaria).
- EC 132/2023 (Emenda Constitucional originaria).
- Notas tecnicas do Comite Gestor do IBS quando publicadas.
