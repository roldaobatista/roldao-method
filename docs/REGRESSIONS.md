---
owner: framework
revisado-em: 2026-05-20
status: stable
---

# REGRESSIONS — testes adicionados por round de auditoria

> Rastreia a **evolução do contador** `_test-runner.sh` e qual round trouxe cada lote. Quando o auditor da próxima rodada vir `npm test` mostrar um número diferente, vem aqui antes de assumir que é regressão.

O invariante `EXPECTED_TOTAL` em `templates/.claude/hooks/_test-runner.sh` falha o build se o número observado divergir do esperado — força essa tabela a ficar atualizada.

## Evolução do contador

| Round | Versão | EXPECTED_TOTAL | Δ | O que entrou |
|---|---|---:|---:|---|
| 5 | v0.10.x | 132 | — | Base após round 5 (P0 + ondas 1/2 da round 6). |
| 6 (ondas 3-6) | v0.12.0 | 147 | +15 | P1/P2 da round 6 — checklist audit-trail + cobertura broader. |
| 7 | v0.13.x | 147 | 0 | REGRA #0 destravada, hash de sessão, CNPJ base repetida (sem testes novos contabilizados, só fix). |
| 8 | v0.14.1 | 155 | +8 | Regressões dos furos da round 8 — cobertura específica do que escapou. |
| 9 | v0.14.3 | 155 | 0 | Varredura final — só fixes, sem testes novos contabilizados. |
| 9.5 (interno) | (entre 0.14.3 e 0.14.4) | 161 | +6 | Cobertura adicional não retomada no `EXPECTED_TOTAL` — a divergência foi achada no round 10. |
| 10 | v0.14.4 | 161 | 0 | **Round 10 só corrigiu o invariante** (155 → 161). Sem testes novos contabilizados; mudanças em segurança/install testadas implicitamente pelos casos existentes. |

## Como atualizar quando adicionar teste novo

1. Adicione o teste em `_test-runner.sh` (case dentro da estrutura existente).
2. Rode `npm test` — vai falhar com `ERRO: rodaram N testes, esperado 161`.
3. Atualize `EXPECTED_TOTAL=N` no fim do `_test-runner.sh`.
4. Adicione 1 linha nesta tabela: round/versão/total/Δ/o-que-entrou.
5. `npm test` deve passar.

## Por que essa tabela existe

A round 9 acumulou 6 testes novos sem atualizar `EXPECTED_TOTAL`. O resultado: `npm test` rodava 161/161 OK mas saía com exit 1 por causa do invariante 155. CI quebrava silenciosamente — desenvolvedor lia "161 OK" e ignorava o exit 1. Round 10 (v0.14.4) corrigiu o número **e** criou esta tabela pra forçar a próxima divergência a ter explicação rastreável.

## Política

- **Toda mudança em `EXPECTED_TOTAL` exige entrada nesta tabela** no mesmo commit.
- **Não baixar o invariante pra "fazer passar"** — se um teste foi removido, justifique aqui o porquê. Remover teste sem justificar mascara regressão.
