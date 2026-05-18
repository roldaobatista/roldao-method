---
owner: framework
revisado-em: 2026-05-17
status: stable
---

# Exemplo — feature ponta-a-ponta com /feature

Transcrição realista de uma feature passando pelos 6 agentes, da demanda informal até o código entregue.

## Cenário

Você é Roldão, dono de uma SaaS contábil em PT-BR. Cliente reclama: "Não consigo cadastrar PJ na nova versão. Aparece um erro estranho." Você quer adicionar suporte ao **CNPJ alfanumérico** que entra em vigor jul/2026.

## Comando

```
/feature aceitar CNPJ alfanumerico no cadastro de cliente PJ
```

## Etapa 1 — Gerente de Produto

```
[gerente-produto modo C — story]

Antes de continuar, 3 perguntas curtas:
1. O cliente PJ pode ser cadastrado por upload de planilha também,
   ou só pela tela manual?
2. Os CNPJs antigos (só números) continuam funcionando?
3. Quando o cliente colar um CNPJ alfanumérico hoje (antes da feature),
   a tela mostra qual erro?
```

Você responde:
1. Tela manual primeiro, planilha depois.
2. Sim, retrocompat obrigatória.
3. Mostra "CNPJ inválido" sem dar pista de que era letra.

```
Vou gerar US-042 e gravar em docs/stories/US-042-cnpj-alfanumerico.md.

US-042 — Aceitar CNPJ alfanumerico no cadastro

Como  dono de PME contabil
Quero cadastrar cliente PJ usando CNPJ alfanumerico (12.ABC.345/01DE-35)
Para  estar pronto para a vigencia em jul/2026 (FISCAL-005)

Criterios de aceitacao:
  AC-042-1: campo aceita 0-9 e A-Z maiusculas na base; 2 ultimos sao digitos
  AC-042-2: mascara aceita formato XX.AAA.NNN/AANN-NN ou so digitos+letras
  AC-042-3: DV invalido mostra mensagem PT-BR clara (sem stack trace)
  AC-042-4: CNPJ numerico legado continua aceito (retrocompat)
  AC-042-5: banco armazena 14 chars em maiuscula, sem mascara

Non-goals (INV-003):
  - import de planilha (proxima story)
  - integracao com Receita para confirmar existencia (outra feature)
  - troca de UI do formulario (mantem layout atual)

Regulamentacao BR:
  - FISCAL-005 (CNPJ alfanumerico)
  - LGPD-007 (base legal: execucao de contrato)

Confirma? (s/n)
```

Você diz "s". Arquivo `docs/stories/US-042-cnpj-alfanumerico.md` criado.

## Etapa 2 — Investigador

```
[investigador]

Lendo codigo nas areas de cliente PJ...

Achei:
  - src/cliente/CadastroPJ.tsx  (form de cadastro)
  - src/cliente/cnpj-validator.ts  (validacao client-side)
  - src/api/clientes.routes.ts  (POST /clientes)
  - src/db/migrations/0023_clientes.sql  (cnpj BIGINT — VAI QUEBRAR)
  - tests/integration/cadastro-pj.test.ts  (5 casos)

Problemas detectados:
  1. CRITICO — coluna cnpj e BIGINT (numerico). Precisa migrar pra VARCHAR(14).
  2. ALTO — regex no front /^\d{14}$/. Aceita so digitos.
  3. ALTO — funcao isValidCnpj() rejeita letras silenciosamente.
  4. MEDIO — testes nao cobrem alfanumerico.
  5. BAIXO — mensagem de erro generica.

Sem mudancas no codigo nesta etapa. So mapeamento.
```

## Etapa 3 — Tech Lead

```
[tech-lead]

Decisao arquitetural identificada: migracao de coluna.

Opcoes:
  A) ALTER COLUMN cnpj TYPE VARCHAR(14) com cast direto.
     Custo: bloqueio durante migracao. Aceitavel se janela curta.
  B) Coluna nova cnpj_v2 VARCHAR(14), dual-write, switch depois.
     Custo: 2x complexidade no codigo durante transicao.

Recomendo A. Tabela tem ~50k linhas, migracao em ~3 segundos.
Tradeoff aceito: 3s de janela de manutencao agendada.

ADR escrito em docs/adr/ADR-0007-cnpj-alfanumerico.md.

Checklist de readiness:
  [x] PRD/story existe (US-042)
  [x] AC testaveis (5 ACs com dado/quando/entao)
  [x] Non-goals listados
  [x] ADR criado (ADR-0007)
  [x] Regulamentacao BR citada (FISCAL-005)
  [x] Plano de teste minimo proposto

Pronto pra dev.
```

## Etapa 4 — Dev Sênior

```
[dev-senior]

Disciplina TDD (logica critica):

1. Vou comecar pelos testes (red).

   tests/unit/cnpj-validator.test.ts:
     - test('CNPJ numerico legado continua valido')  -> RED
     - test('CNPJ alfanumerico oficial RFB passa')   -> RED
     - test('CNPJ alfanumerico minusculo eh normalizado pra maiusculo')  -> RED
     - test('DV errado em alfanumerico eh rejeitado') -> RED
     - test('mensagem de erro em PT-BR sem stack')   -> RED

2. Implementar minimo (green):
   - cnpj-validator.ts: usar algoritmo ord(c)-48 (compativel)
   - aceitar [0-9A-Z]{12} na base + [0-9]{2} no DV
   - normalizar pra maiusculo no input
   - mensagens em PT-BR

3. Migration:
   - 0042_cnpj_varchar.sql: ALTER COLUMN cnpj TYPE VARCHAR(14)
   - update post-migration: UPPER(cnpj) (garantir consistencia)

4. Refator:
   - extrair _calc_dv() em util reusavel
   - regex unica como constante exportada

5. Rodar suite: 12/12 testes verdes.

Commits atomicos:
  - feat: aceita CNPJ alfanumerico no validator (FISCAL-005, US-042)
  - feat: migra coluna cnpj para VARCHAR(14) (FISCAL-005, T-042-2)
  - feat: ajusta form e regex client-side (US-042, AC-042-2)
  - test: cobre CNPJ alfanumerico em integration (TST-003, US-042)
```

## Etapa 5 — Revisor

```
[revisor]

Aderencia US-042:
  [x] AC-042-1: base [0-9A-Z]{12} aceita
  [x] AC-042-2: mascara aceita formato
  [x] AC-042-3: mensagens em PT-BR
  [x] AC-042-4: retrocompat (teste explicito)
  [x] AC-042-5: banco VARCHAR(14) uppercase

Regras inegociaveis:
  [x] INV-002: spec gera codigo (story existe antes do commit)
  [x] INV-004: IDs rastreaveis nos commits
  [x] TST-001: nenhum mascaramento detectado
  [x] FISCAL-005: comprimento e formato corretos

Anti-padroes:
  [x] sem mock em integration
  [x] sem TODO sem ID
  [x] commits atomicos

APROVADO.
```

## Etapa 6 — Auditores

```
[auditor-seguranca]
  - SQL injection: prepared statement OK.
  - LGPD-007: base legal documentada na story.
  - Mensagem de erro nao vaza estrutura interna.
  APROVADO.

[auditor-qualidade]
  - Cobertura unit: 100% no validator.
  - Cobertura integration: caso feliz + 4 casos de erro.
  - Mutation: assertion forte.
  APROVADO.

[auditor-produto]
  - 5 AC verificados manualmente.
  - Non-goals respeitados (planilha nao entrou).
  APROVADO.
```

## Saída final

```
FEATURE ENTREGUE

US: US-042 — Aceitar CNPJ alfanumerico no cadastro
ADR criado: ADR-0007
Arquivos tocados: 7
Testes adicionados: 5 unit + 3 integration
Migracao: 0042_cnpj_varchar.sql (3s)
Revisor: APROVADO
Auditores: APROVADO

Proximo passo: agendar migracao em janela noturna e fazer release.
```

## O que aconteceu por baixo

- **6 agentes**, cada um com função clara, sem misturar papéis.
- **Story em disco** (`docs/stories/US-042-cnpj-alfanumerico.md`), rastreável.
- **ADR registrado** (`docs/adr/ADR-0007-cnpj-alfanumerico.md`).
- **TDD nos pontos críticos** (validator com 100% cobertura).
- **Hooks bloquearam zero** — não houve tentativa de `--no-verify`, mock em integration, ou TODO sem ID.
- **Citação rastreável** em todo commit (`FISCAL-005`, `US-042`).
- **PT-BR ponta a ponta** — não tem "stakeholder", "spike", "PR" sem traduzir.

Esse é o ciclo esperado. Quando alguma etapa for trivial, o `/feature` permite pular (dev-senior direto) — mas a estrutura de papéis fica clara.
