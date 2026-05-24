---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: mensagens-erro
nota: 7.5/10
---

# Auditoria Mensagens de Erro — 2026-05-24

## Resumo executivo
Nota **7,5/10**. Melhor mensagem: `fiscal-br-validator.js` (traduz cada FISCAL-NNN em PT-BR claro + caminho). Pior mensagem: `paths-frontmatter-validator.js` (uma linha com YAML cru, sem dizer o que é "frontmatter" pra leigo). Padrão geral é bom — PT-BR, formato EFEITO+CAUSA+PRÓXIMO PASSO, regra citada. Falhas pontuais: jargão (`frontmatter`, `upstream`, `merge-base`, `touch`, `mkdir -p`) e instruções de bypass em shell sem explicar.

## Boas mensagens (modelo a seguir)
- **`fiscal-br-validator.js:117-126`** — `"Como destravar (caso a caso): FISCAL-001: NF-e autorizada não pode ser alterada. Cancele ou emita CC-e. FISCAL-002: tire o certificado/senha do código. Coloque em variável de ambiente."` — narrativa por regra, sem jargão, dá ação concreta.
- **`block-destructive.js:89-95`** — estrutura limpa EFEITO/CAUSA/PRÓXIMO.
- **`no-test-data-in-fixtures.js:104-113`** — explica "vazam pra repo, CI, ambiente de dev e por log de teste" + dá 4 alternativas concretas + cita a skill `gerar-test-fixture-br`.
- **`regra-zero-reminder.js:11-27`** — lembrete didático, numerado, sem jargão.

## Mensagens P0 (leigo trava)
- **`paths-frontmatter-validator.js:28-29`** — `"doc em docs/ deve começar com frontmatter. … Formato esperado no topo: --- owner: <responsável> revisado-em: YYYY-MM-DD status: draft | stable | deprecated ---"` — "frontmatter" não está traduzido em lugar nenhum. **Reescrita:** `"BLOQUEADO: documento novo na pasta docs/ precisa de um cabeçalho de identificação. EFEITO: arquivo não foi salvo. CAUSA: faltam 3 linhas no topo dizendo quem é o dono, quando foi revisado e se está em rascunho/estável. PRÓXIMO PASSO: cole isso na linha 1 do arquivo:\n---\nowner: <seu nome>\nrevisado-em: 2026-05-24\nstatus: draft\n---"`

- **`no-amend-after-push.js:50-55`** — `"comando 'git' nao encontrado no PATH. Sem 'git' nao da pra saber se este commit ja foi pushado."` — "PATH", "pushado", "amend" sem tradução. **Reescrita:** `"BLOQUEADO: não consegui verificar se o sistema de controle de versão (Git) está instalado. EFEITO: não posso garantir que sua alteração não vai sobrescrever algo já enviado pro servidor. PRÓXIMO PASSO: baixar Git em https://git-scm.com e tentar de novo."`

- **`require-investigador-before-fix.js:67-68`** — `"Bypass (so se for trivial e o usuario autorizar): echo '{...}' > .claude/.runtime/investigation-bypass.json"` — Roldão NÃO vai colar comando shell. Esse "bypass" só serve pra agente — deveria estar marcado como "instrução pra Claude", não pro humano.

## Mensagens P1 (entende mas falta orientação)
- **`require-readiness-before-feature.js:87-88`** — `"Force liberacao manual (sob sua responsabilidade): mkdir -p \"<runtime>\" && touch \"<markReadiness>\""` — `mkdir`/`touch` é jargão shell.
- **`commit-message-validator.js:100-105`** — `"BLOQUEADO: mensagem de commit nao atende politica. Politica: Primeira linha <= 72 caracteres. 1 prefixo por commit (feat OU fix OU refactor…)"` — "prefixo", "Conventional Commit", "commits atomicos" sem tradução.
- **`block-jargon-pt-br.js:74`** — Ironia: a mensagem do hook que bloqueia jargão usa `commit/push`, `rollback`, `deploy`, `refactor` na tabela — ok no contexto, mas na linha 75 fala `"Excecao: se o usuario E programador (declarado em AGENTS.md), peca pra ajustar a regra."` sem dizer COMO ajustar.

## Jargão escapado (P1)
- **`frontmatter`** → "cabeçalho de identificação do documento"
- **`PATH`** → "lista de programas instalados no computador"
- **`touch`, `mkdir -p`** → comandos shell expostos ao usuário
- **`hardcoded`** → "escrito direto no código"

## Recovery problemático (P1)
- **Markers órfãos:** `bug-trigger-<sess>`, `feature-active-<sess>`, `investigation-*.json`, `bug-active-*` ficam em `.claude/.runtime/` indefinidamente. Não encontrei nenhum hook que faça `unlink`/`rmSync` desses markers. Cenário: Roldão abre `/bug`, hook arma `bug-trigger`, ele fecha a sessão sem rodar fix, volta amanhã pra trabalhar em feature nova — hook `require-investigador-before-fix` ainda dispara porque o marker existe. **Sugestão:** SessionEnd hook deve fazer `rmSync` dos markers `*-trigger-<sess>` e `*-active-<sess>` do session atual.
- **`bug-active-*` sem hash de sessão** (require-investigador linha 49): regex `^bug-active-` casa qualquer sessão — marker de sessão antiga bloqueia sessão nova. Bug de escopo.
- **Falha de parse de stdin** em quase todos os hooks faz fail-closed com `exit 2` + `[hook-name] erro interno: <err.message>` cru — mensagem técnica, leigo trava.

## Severidade visual
Não há distinção visual (cor, símbolo ✓/✗/⚠️). Todos usam `[hook-name] BLOQUEADO:` ou `[hook-name] AVISO:` em texto plano. Auditoria recomenda padronizar:
- `[BLOQUEIO] [hook-name]` para exit 2/decision:block
- `[AVISO] [hook-name]` para soft warning
- `[INFO] [hook-name]` para reminder

## Veredito
**Roldão consegue se desbloquear sozinho em ~70% dos casos.** As mensagens dos hooks fiscais, de secrets e de mascaramento estão muito boas. Mas 4 casos travam o leigo: (1) `paths-frontmatter-validator` exige conceito não traduzido, (2) `no-amend-after-push` quando git ausente despeja jargão técnico, (3) instruções de "bypass" via shell (`touch`, `mkdir -p`, `echo > .json`) aparecem em pelo menos 3 hooks como se fossem pro humano — deveriam estar marcadas como "para o agente Claude executar". Recovery de markers órfãos é o problema sistêmico mais grave: sessão antiga contamina sessão nova porque nada limpa `.claude/.runtime/*-trigger-*`. Sem SessionEnd cleanup, Roldão eventualmente vai ter que apagar a pasta `.runtime/` na mão.
