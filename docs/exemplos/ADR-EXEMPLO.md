---
owner: tech-lead (Rafael)
revisado-em: 2026-05-24
status: aceito
---

# ADR-0014 — Validar CPF só com algoritmo local (sem chamar Receita Federal)

## Contexto

A v1 do PDV precisa validar CPF no cadastro de cliente. Existem duas abordagens:
1. Algoritmo local (módulo 11 sobre os 9 primeiros dígitos).
2. Chamada à API da Receita Federal pra checar situação cadastral em tempo real.

A loja vende ~80 cadastros/dia e não pode bloquear venda se a internet cair. O cliente quer "uma mensagem rápida" — não esperar resposta de servidor externo.

## Decisão

Validar CPF **apenas localmente** com o algoritmo de dígito verificador (módulo 11). Não chamar API externa nesta fase.

## Consequências

**Positivas:**
- Validação roda em < 1ms — sem latência de rede.
- Sistema funciona offline (REQ-004 do PRD-007).
- Sem custo por chamada (Serpro cobra por consulta).
- Sem ponto de falha externo.

**Negativas (custo aceito):**
- Não detectamos CPF de pessoa falecida ou suspenso.
- Não detectamos CPF sintaticamente válido que não existe na base da RFB.
- Casos de fraude com CPF inventado (mas matematicamente válido) passam.

**Neutras:**
- Skill `validar-cpf-cnpj` do core do framework já tem o algoritmo pronto — reaproveitar.

## Alternativas consideradas

### Opção A — Serpro RFB Síncrona
Chamada HTTPS pra `serpro.gov.br/cpf?numero=...`. **Descartada porque** custa ~R$ 0,20 por consulta, exige certificado A1, e não funciona offline.

### Opção B — Cache de CPFs já consultados
Manter cache local de CPFs verificados, validar online só se não estiver em cache. **Descartada porque** complexidade alta pra ganho marginal — a maioria dos cadastros é cliente novo.

### Opção C — Validação só visual (sem algoritmo)
Aceitar qualquer CPF com 11 dígitos numéricos. **Descartada porque** atendente erra digitação com frequência (auditoria interna detectou 4% de CPFs com dígito errado).

## Non-goals

O que esta decisão NÃO resolve:

- Detecção de fraude por CPF de terceiro (precisa biometria/foto — fora do escopo da v1).
- Validação de menor de idade (regra fiscal específica — abrir ADR separado quando ICMS-ST entrar).
- Integração com Serasa/SPC (avaliação de crédito — fora do escopo da v1).

## Como verificar aderência

- Revisão de código: `grep -rE "fetch|axios|http" src/validacao/cpf.ts` retorna 0 ocorrências.
- Hook `no-hardcoded-env-urls.js` bloqueia URL de API hardcoded na pasta `src/validacao/`.
- Teste unitário `cpf.test.ts` valida 10 CPFs sintéticos (5 OK, 5 inválidos) sem fazer chamada externa.

## Como reabrir

Gatilhos que faria essa decisão ser revista:
- Se a taxa de fraude por CPF inválido ultrapassar 1% das vendas (medir trimestralmente).
- Se um cliente exigir conferência de situação cadastral por requisito contratual.
- Se a Receita Federal abrir API gratuita e estável (acompanhar).

## Referências

- `docs/decisions/ADR-0007.md` — política de não chamar serviços pagos sem ROI documentado.
- US-042 — story que gerou esta decisão.
- Skill `validar-cpf-cnpj` — implementação canônica do algoritmo.
