# Contrato Claude Code — projeto

@AGENTS.md

> Este arquivo é adendo do harness Claude Code. Produto e arquitetura ficam em `AGENTS.md` (importado acima).

---

## Perfil do usuário (CRÍTICO — ler sempre)

_(Se o usuário deste projeto não é programador, ajustar a tabela abaixo com termos do domínio dele.)_

### Linguagem
- **Sem jargão técnico** sem traduzir, quando o usuário não é programador.
- **Tabela de tradução padrão:**
  - "salvei a correção no sistema" em vez de "fiz commit/push"
  - "está funcionando, validei" em vez de "CI verde / testes passando"
  - "tem erro, vou investigar" em vez de "tests failing / build red"
  - "voltar pra versão anterior" em vez de "rollback / revert"
  - "subir pro servidor que o cliente usa" em vez de "deploy em produção"
  - "robô que simula o usuário" em vez de "E2E tests"
  - "reorganizar essa parte (sem mudar o que aparece pro usuário)" em vez de "refactor"
  - "mudança na estrutura dos dados salvos" em vez de "migration"
  - "dados falsos pros testes" em vez de "mock/fixture"

### Pró-atividade
- Ao identificar gap, erro, débito, bug: **resolver imediatamente**, nunca perguntar "quer que eu corrija?".
- Reportar no formato: "fiz X, resolvi Y, já comecei Z".
- **Confirmar antes APENAS para:** deletar dados de produção, drop table, rotação de credenciais, mudanças legais públicas, push --force, reset --hard, rm -rf, migration destrutiva.

### Executar, não passar pro usuário (INV-AGENT-006)
Tudo que o agente PODE fazer (tem a ferramenta, não é destrutivo, não custa dinheiro), o agente DEVE fazer sem perguntar. Empurrar tarefa executável pro usuário não-técnico quebra o fluxo. **Sinal de alerta:** "quer que eu...?", "posso fazer X?", "devo continuar?" → PARE e execute. Reporte só DEPOIS de fazer.

---

## Regra #0 — Investigar antes de mexer em lógica de negócio

Quando o usuário reportar bug em comportamento (tela errada, cálculo errado, dado salvo errado):

1. **NÃO mexer no código antes de entender a causa.**
2. **Primeiro: ler o estado real.** Banco, logs, payload, console, config. O que está salvo lá?
3. **Segundo: rastrear o fluxo.** Onde o dado é gerado? Salvo? Lido? Existem caminhos duplicados?
4. **Terceiro: confirmar entendimento** com o usuário se houver ambiguidade.
5. **Só então: implementar** — e no ponto raiz, não no sintoma.

Esse fluxo é codificado no workflow `/bug` — o agente `investigador` entra primeiro e bloqueia avanço sem investigação.

---

## Idioma

Comunicar em **Português (Brasil)** por padrão.

---

## Princípios universais

### Verificar antes de afirmar
NUNCA dizer "pronto", "implementado" sem rodar comando de verificação e mostrar resultado.

### Causa raiz, nunca sintoma
Teste falhou = problema no sistema. Corrigir código, nunca mascarar (skip, `assertTrue(true)`, `eslint-disable`, `@ts-ignore`, `--quiet`, `|| true`). Hook `anti-mascaramento.sh` bloqueia.

### Commits atômicos
Um propósito por commit. Stage seletivo.

### Perguntar antes de destruir
Operações irreversíveis exigem confirmação. Hook `block-destructive.sh` bloqueia automaticamente.

---

## Estrutura `.claude/`

```
.claude/
├── settings.json          ← permissões + hooks (versionado)
├── settings.local.json    ← pessoal (NÃO versionar)
├── agents/                ← 12 especialistas (com nome + ícone)
├── hooks/                 ← 22 bloqueadores + 4 auxiliares + 2 infra (_lib, _test-runner) = 28 (+5 em addons)
├── output-styles/         ← pt-br-conciso.md
├── commands/              ← 21 slash commands (workflows)
├── skills/                ← 8 skills BR no core (criar quando padrão repetir 3x)
└── rules/                 ← criar com `paths:` frontmatter
```

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
