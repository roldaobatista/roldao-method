---
description: Gera/audita testes de uma area existente. Use quando a feature já existe mas não tem teste suficiente, ou quando você quer cobertura E2E de um fluxo critico. Foco: lacunas, casos de borda BR, testes regulatorios.
argument-hint: "[area-ou-fluxo]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(npm test:*), Bash(npm run:*), Edit, Write, Task
---

# /qa — auditoria e geracao de testes

Voce vai garantir que a area indicada esta testavel/testada com rigor proporcional ao risco.

Use `$ARGUMENTS` para definir escopo (ex: "checkout", "emissao NF-e", "modulo de relatorio").

## Etapa 1 — Investigador (mapa de testes existentes)

Invoque `investigador`:
1. Liste todos os arquivos de teste tocando `$ARGUMENTS`.
2. Para cada teste: o que cobre, o que NAO cobre.
3. Mede cobertura se houver ferramenta (jest --coverage, pytest-cov).
4. Identifica anti-padroes:
   - mock em integration test (TST-003)
   - teste que so chama funcao sem assert
   - teste vazio (`it.skip`, `it.todo`)
   - asssertion fraca (`expect(result).toBeTruthy()` em vez de igualdade exata)
   - mascaramento (TST-001 — hook bloqueia, mas auditar codigo antigo)
5. Lista 5-10 casos de borda **nao cobertos**.

## Etapa 2 — Auditor de Qualidade (parecer)

Invoque `auditor-qualidade`:
- Le relatorio do investigador.
- Da nota geral de cobertura (alta/media/baixa) por tipo (unit, integration, E2E).
- Aponta os 3 maiores buracos.
- Sugere prioridade de teste (qual escrever primeiro = onde tem mais risco).

## Etapa 3 — Dev Senior (escreve testes)

Invoque `dev-senior`:
- Recebe lista priorizada do auditor.
- Escreve testes em ORDEM (do mais critico pro menos).
- TDD onde aplicavel — mas como o codigo ja existe, o ciclo e: teste vermelho (esperando bug) -> se passar, codigo OK; se falhar, reportar e investigar.
- Cobre casos de borda BR:
  - CPF/CNPJ invalido (digito errado, sequencia, alfanumerico para CNPJ)
  - Moeda: zero, negativa, com centavos exatos, com mais de 2 decimais
  - Data: virada de mes, ano bissexto, fuso (America/Sao_Paulo)
  - CEP: nao existente, formato errado
  - Telefone: sem DDD, com +55, com DDI errado
  - LGPD: rota de exclusao funciona, log de acesso a sensivel grava

## Etapa 4 — Revisor

Invoque `revisor`:
- Confere se os testes adicionados:
  - Falham se o codigo for sabotado (mutation test mental).
  - Tem assertion clara.
  - Nao mockam o que e o objeto do teste.
  - Cobrem o caso feliz E pelo menos 1 caso de erro.

## Saida final

```
QA AUDIT — <area>

Cobertura antes: <X%>
Cobertura depois: <Y%>
Testes adicionados: <N>
Casos de borda cobertos: <lista>
Bugs encontrados durante o QA: <N>

Itens pendentes (precisam decisao):
  - <item 1>
```

## Importante

- **Nao apagar testes existentes** sem motivo claro (anti-padrao real ou redundancia comprovada).
- **Nao mascarar bug encontrado.** Reportar e seguir REGRA #0 (`/bug` se for grave).
- **Foco em risco, nao em cobertura nominal.** 80% cobrindo getters/setters vale menos que 50% cobrindo logica fiscal.
