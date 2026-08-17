---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 200
proposito: matriz de comportamento esperado do harness Claude Code no projeto-modelo (eventos x matchers x hooks x decisao; permissions; modos). Espelha templates/settings.template.json.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md Camada C9b (§11)
---

<!--
ESTA matriz e o contrato de comportamento do harness Claude Code para o projeto-modelo.
Se voce procura compatibilidade entre Claude Code, Cursor, Windsurf, Codex CLI e Kiro,
consulte `matriz-multi-harness.md` (irmao deste arquivo).
Hierarquia de contratos: constitution > REGRAS-INEGOCIAVEIS > AGENTS > CLAUDE.
-->

# Matriz de comportamento do harness Claude Code

Esta matriz define **o que o harness faz em cada evento**, **quem pode rodar o quê** e **quais modos sao suportados**. E a fonte de verdade do comportamento esperado; `templates/settings.template.json` precisa estar em sincronia com ela.

---

## 0. NUNCA bloquear (lista positiva — sempre allow)

Operações reversíveis ou read-only que o agente executa sem perguntar e sem hook intermediário pesado. Lista existe para remover dúvida de agente cauteloso:

- Tools: `Read`, `Glob`, `Grep`.
- Bash leitura: `ls`, `pwd`, `which`, `cat`, `head`, `tail`, `find`, `echo`, `jq`, `rg`.
- Bash git read-only: `git status`, `git diff`, `git log`, `git show`, `git branch` (sem `-D`), `git fetch`, `git rev-parse`, `git config --get`.
- Bash git seguro: `git add <arquivos-específicos>`, `git commit`, `git push origin <branch>` (fast-forward), `git revert`, `git stash`, `git checkout -- <arquivo>`, `git restore -- <arquivo>` (descarte de unstaged é recuperável via reflog).
- Bash `gh` (todos exceto `gh repo delete` / `gh repo edit --visibility`).
- Bash dev/test/build: `npm`, `pnpm`, `yarn`, `node`, `python`, `python3`, `cargo`, `go`, `make`, `just`, `sqlite3`.

Se um agente hesita em usar qualquer item desta lista, é bug de calibração — corrigir CLAUDE.md ou prompt do maestro.

---

## 1. Eventos x Matchers x Hooks x Decisao

Severidades: CRÍTICO / ALTO / MÉDIO / BAIXO.

**Ordem dos hooks importa** em `PreToolUse/Bash`: `override-ledger.sh` roda PRIMEIRO e apenas **loga** o uso do override (lê `.claude/.override-reason`, **não apaga**). `block-destructive.sh` e `no-verify-bypass.sh` rodam em seguida e leem o **mesmo** arquivo para liberar operações legítimas com override (`--force-with-lease` em branch protegida, `--no-verify`), e ainda podem bloquear padrões críticos (rm -rf /, drop database) independente do override — ledger é log de auditoria, não bypass. O **consumo de uso único** (apagar `.override-reason`) fica no `override-consume.sh` em **PostToolUse/Bash**, que roda DEPOIS de todo o PreToolUse passar e o comando executar. Se o ledger apagasse o arquivo ainda no PreToolUse, os hooks seguintes bloqueariam `--force-with-lease`/`--no-verify` legítimos (bug corrigido em 2026-05-28).

| Evento | Matcher | Hook ativado | Decisao | Severidade | Por que |
|---|---|---|---|---|---|
| PreToolUse | Bash | `override-ledger.sh` (1o) | block se flag de override sem motivo em `.claude/.override-reason`; log + allow se com motivo (arquivo **não** é apagado aqui — só logado; o consumo de uso único fica no `override-consume.sh`/PostToolUse) | ALTO | Toda flag perigosa (`--force` puro, `--force-with-lease`, `--no-verify`, `--no-gpg-sign`, `--skip-tests`, `--allow-empty`, `--allow-dirty`, `--unsafe-perm`) exige justificativa escrita registrada em `.claude/overrides.log`. Le de ARQUIVO porque env var do shell nao e herdada pelo subprocesso do hook. |
| PreToolUse | Bash | `block-destructive.sh` (2o) | block (exit 2) se padrao destrutivo bater; allow caso contrario | CRÍTICO | Impede `rm -rf`, `git push --force` puro, `drop database`, `mkfs`, `dd if=.*of=/dev/`, fork bomb, `sudo`, `npm publish`, `gh repo delete`, etc. Permite `git push --force-with-lease`. **Limitacao:** so pega padroes diretos — ofuscacao trivial (variavel indireta, eval base64, alias) passa. Defesa em profundidade, nao barreira absoluta. |
| PreToolUse | Bash | `no-verify-bypass.sh` | block se comando tenta pular hooks/verificacoes; **allow se houver `.claude/.override-reason` com motivo** | ALTO | Bloqueia `--no-verify` (e `-n`), `--no-gpg-sign`, `-c core.hooksPath=`, `-c commit.gpgsign=false`, `HUSKY=0`, `SKIP=...`, `PRE_COMMIT_ALLOW_NO_CONFIG=` e afins. **Override consciente:** se `.claude/.override-reason` existir com motivo, o hook libera (o `override-ledger.sh` que roda antes apenas **registrou** o uso, sem apagar; o `override-consume.sh` em PostToolUse apaga o arquivo depois — uso único). |
| PreToolUse | Bash | `auditor-commit-hygiene.sh` | warn se stage/commit mistura demais | MÉDIO | Avisa sobre `git add .` cego e commit tocando areas demais. Nao bloqueia projeto solo. |
| PreToolUse | Write | `secrets-scanner.sh` | block se padrao de segredo no conteudo; allow caso contrario | CRÍTICO | Detecta AWS, GitHub, OpenAI/`sk-`, Anthropic `sk-ant-`, Slack, Google/Firebase `AIza`, SendGrid, Mailgun, Vault, MongoDB Atlas com credencial, blocos de chave privada, literais `password=`, `secret=`, `api_key=` e PII brasileira. **Isenta** fixtures/tests/mocks e os docs cuja funcao e documentar formato de credencial: `SECURITY.md`, `threat-model.md` e `dependency-policy.md` (estes citam regexes/exemplos legitimamente, sem segredo real). |
| PreToolUse | Write | `anti-mascaramento.sh` | block se padrao de mascaramento; allow caso contrario | ALTO | Detecta `assertTrue(true)`, `.skip(`, `xit(`, `.only(`, `@ts-ignore`, `eslint-disable`, `\|\| true` em comandos de teste, `--no-verify`, `--skip-tests`, "assertion relaxada". Ignora `*.md`, CLAUDE/AGENTS/REGRAS e workflows de CI (`.github/workflows/*.yml`, `.gitlab-ci.yml`, etc — citam padroes legitimamente). |
| PreToolUse | Write | `frontmatter-validator.sh` | block se `*.md` em paths críticos (CLAUDE.md, AGENTS.md, REGRAS-INEGOCIAVEIS.md, docs/, .claude/memory/, ADRs) sem frontmatter; **warn** para `.md` fora de paths críticos | ALTO | Restringe block aos docs canônicos. NOTES.md, scratch.md e .md de terceiros (issue templates upstream) só geram warning. Le `tool_input.content` (Write) e valida data + `status: draft\|stable\|deprecated\|superseded`. **Sem `python3` na maquina, a checagem de Edit DEGRADA: nao simula a substituicao e valida apenas o frontmatter do arquivo atual em disco — uma edicao que corrige o frontmatter pelo `new_string` pode passar batido. `jq` continua obrigatorio (sem ele, block).** |
| PreToolUse | Write | `doc-line-counter.sh` | block se `*.md` excederia `limite-linhas: N` | MÉDIO | Roda antes de gravar. Bypass trivial = aumentar `limite-linhas`, visível no diff. |
| PreToolUse | Write | `phase-gate.sh` | block se escrita em `src/` antes da Descoberta stable + ADR-0001 aceita | CRÍTICO | Impede código antes de `docs/descoberta/sintese-final.md` virar `status: stable` e `docs/adr/ADR-0001*.md` virar `status: aceita`, salvo `.claude/.phase-gate-disabled`. |
| PreToolUse | Edit | `secrets-scanner.sh` | idem Write | CRÍTICO | Cobre criacao e edicao. |
| PreToolUse | Edit | `anti-mascaramento.sh` | idem Write | ALTO | Bloqueia antes de salvar, para nao deixar arquivo ruim no disco. |
| PreToolUse | Edit | `frontmatter-validator.sh` | block/warn segundo a mesma regra de Write | ALTO | Le `tool_input.old_string`/`new_string` (Edit), simula resultado e valida estado final. **Edição que atualiza a data no mesmo Edit sempre passa**. ADRs aceitam status proprio; docs vivos de operacao podem usar `ultima-conferencia`. |
| PreToolUse | Edit | `doc-line-counter.sh` | idem Write | MÉDIO | Bloqueia antes de salvar se o corpo passaria do limite declarado. |
| PreToolUse | Edit | `phase-gate.sh` | idem Write | CRÍTICO | Mesmo gate de Descoberta para edicao. |
| UserPromptSubmit | (sem matcher) | `inject-context.sh` | allow + injeta lembrete de INV-AGENT-003, 004, 010 | BAIXO | Reforça regras-chave a cada turno (perfil do dono não-técnico, investigar antes de editar, pró-atividade). Custo: ~50 tokens/turno; valor: consistência em sessões longas. |
| SessionStart | (sem matcher) | `check-deps.sh` (1o) | allow + warning via stderr se faltar `jq`, `python3`, `date -d` ou `bash >=4` | BAIXO | Roda na abertura da sessao. Read-only. Expoe ausencia de dependencias dos demais hooks antes que falhem silenciosamente. |
| SessionStart | (sem matcher) | `staleness-checker.sh` (2o) | allow + warning via stderr para docs criticos com `revisado-em > 365 dias` | BAIXO | Read-only. Varre `constitution`, `REGRAS-INEGOCIAVEIS`, `CLAUDE`, `AGENTS`, `SECURITY`, `threat-model`, `ropa`, `retencao-dados`, `MAINTAINERS`. Cache em `.claude/.staleness-cache` (TTL 24h) para boot rápido. NUNCA bloqueia. |
| SessionStart | (sem matcher) | — | (não implementado) | BAIXO | Ponto de extensão FUTURO (sem hook nem entrada em `settings`): `placeholder-detector` daria warn loud se `<comando-de-teste>`/`<comando-de-dev>`/`<NomeDoProjeto>` sobrassem em `settings.json`, avisando de uma vez no início em vez de 10 confirmações até notar. |
| Stop | (sem matcher) | — | allow | BAIXO | Ativar quando: pendência git não commitada > 30min, ou auditor-pro-atividade detectou regressão. |
| SubagentStop | (sem matcher) | — | allow | BAIXO | Ativar quando: subagente reprovou e maestro precisa registrar disputa. |
| Notification | (sem matcher) | — | allow | BAIXO | Ponto de extensão. |
| PostToolUse | Bash | `override-consume.sh` | allow + apaga `.claude/.override-reason` se existir (uso único) | BAIXO | Consome o override DEPOIS que o comando passou por todo o PreToolUse e executou. Centraliza o `rm -f` fora do pipeline de decisão para que ledger/block-destructive/no-verify-bypass leiam o mesmo arquivo. Se algum PreToolUse bloquear (exit 2), o PostToolUse não roda e o override sobrevive — conservador: prefere preservar o motivo a queimá-lo num bloqueio, sem abrir brecha (todo comando seguinte ainda passa pelos blockers). Nunca bloqueia. |
| PreCompact | (sem matcher) | — | allow | BAIXO | Ativar para salvar tarefas/contexto crítico em memória antes de compactar. |

> Regra: se um hook precisar ser adicionado, **atualizar tanto `settings.template.json` quanto esta matriz no mesmo commit**. Divergencia entre os dois e bug de governanca.

### 1.1 Hooks opt-in e copiados

O `bootstrap.sh` copia os 15 hooks. Destes, 13 entram no `settings.template.json` padrão (inclui o `override-consume.sh` em PostToolUse/Bash). `pre-edit-evidence.sh` e `post-claim-evidence.sh` são opt-in: o projeto destino decide se ativa. Documentados aqui para não virarem órfãos.

| Hook | Evento | Matcher | INV ligada | Quando ativar |
|---|---|---|---|---|
| `pre-edit-evidence.sh` | PreToolUse | Edit\|Write | INV-AGENT-003 (investigar antes de editar lógica de negócio) | Projeto com camada de lógica de negócio crítica (SaaS regulado, financeiro). Warn em edição sem leitura prévia. |
| `post-claim-evidence.sh` | Stop | (sem matcher) | INV-AGENT-005 (validar antes de afirmar) | Projeto onde agente costuma declarar "pronto" sem evidência. Exige transcripts em `.claude/transcripts/`. |
| `auditor-commit-hygiene.sh` | PreToolUse | Bash (git add/commit) | INV-AGENT-007 (commits atômicos) | Ativo por padrão desde 2026-05-28. Warn em `git add .` cego. |

Para ativar: adicionar entrada `command` no array de hooks do evento correspondente em `settings.json`. Os 3 arquivos `.sh` já existem em `templates/`.

---

## 2. Permissions por categoria

Decisao por tool: `allow` (executa direto), `deny` (bloqueia antes do hook), `ask` (pede confirmacao ao humano).

> **CRÍTICO — `deny` é prefix-only, defesa real é o hook.**
>
> `Bash(rm -rf:*)` em `deny` so bloqueia comandos que **comecam literalmente** com `rm -rf`. Os seguintes NAO sao pegos pelo deny e dependem 100% do hook `block-destructive.sh`:
> - `cd /tmp && rm -rf x` (rm vem depois de `cd && `)
> - `bash -c 'rm -rf /tmp/x'` (rm dentro de aspas)
> - `git push origin main --force` (deny e `Bash(git push --force:*)`, mas o usuario pode escrever `git push <remote> <branch> --force`)
> - `find . -delete`, `mkfs.ext4 /dev/sda`, `: () { :|:& }; :` (deny nem cita)
>
> **Use deny como atalho UX** (bloqueio rapido, mensagem clara para padroes diretos). **Confie no hook `block-destructive.sh` para a seguranca real** — ele normaliza espacos, cobre flags em qualquer ordem e roda regex sobre o comando inteiro. Mesmo o hook tem limitacoes (ver cabecalho do hook): ofuscacao por variavel/eval/base64 nao e pega. Decisoes criticas exigem 4-eyes humano.

| Categoria | Tools/Comandos | Decisao | Observacao |
|---|---|---|---|
| Leitura (read) | `Read`, `Glob`, `Grep` | allow | Read-only. Sem risco. |
| Escrita doc (write) | `Write`, `Edit` | allow | Hooks `secrets-scanner`, `anti-mascaramento`, `frontmatter-validator`, `doc-line-counter` e `phase-gate` filtram antes. |
| Bash — git seguro | `git status`, `git diff`, `git log`, `git show`, `git branch`, `git stash`, `git fetch`, `git pull`, `git rev-parse`, `git config`, `git add <arquivos>`, `git commit`, `git push origin <branch>`, `git revert`, `git checkout -- <file>`, `git restore -- <file>` | allow | Push fast-forward é seguro. Discard de unstaged é recuperável via reflog. |
| Bash — git destrutivo (hard deny) | `git push --force`/`-f` puro, `git push * --force`/`-f`, `git reset --hard origin/*`, `git clean -fd`, `git branch -D`, `git add .`, `git add -A` | deny | Bloqueia antes do hook. |
| Bash — git destrutivo (ask + ledger) | `git reset --hard <local-ref>`, `git push --force-with-lease` (branch própria) | ask | Pede confirmação. Em `main`/`master`/`release/*`, `--force-with-lease` exige `.claude/.override-reason`. Em branch própria (`feature/*`, `fix/*`), permitido com override-reason via `override-ledger.sh`. |
| Bash — sistema destrutivo | `rm -rf`, `rm -fr`, `rm -Rf` | deny | Bloqueio duplo: permissions + hook. |
| Bash — formatacao disco | `mkfs`, `mkfs.ext4`, `mkfs.xfs`, `dd if=...` | deny | Bloqueia formatacao e overwrite raw de disco. Hook `block-destructive` reforca com `dd if=.../of=/dev/`. |
| Bash — banco destrutivo | `drop database`, `drop table`, `drop schema` | deny | Hook reforça com `truncate table`, `delete from ... ;` sem WHERE, `alter table ... drop column`. |
| Bash — privilegio | `sudo` | deny | Operacao de SO. Nunca via agente. |
| Bash — publicacao | `npm publish`, `yarn publish`, `pnpm publish`, `cargo publish`, `cargo yank`, `gem push`, `pip publish`, `twine upload` | deny | Exige credencial humana + 2FA. Simetria entre ecossistemas para evitar bypass por gerenciador alternativo. |
| Bash — repo destrutivo | `gh repo delete`, `gh repo edit --visibility` | deny | Apagar/mudar visibilidade do repo exige humano + 2FA. `gh release create`/`delete` continua allow (release é revertível). |
| Bash — dev/teste/gh/runtime | `<comando-de-teste>`, `<comando-de-dev>`, `gh:*` (exceto repo delete), `npm`, `pnpm`, `yarn`, `node`, `python`, `python3`, `cargo`, `go`, `make`, `just`, `sqlite3` | allow | Deny vence allow: `npm publish` etc continuam bloqueados. |
| Bash — outros | qualquer outro `Bash(...)` | allow (com hooks como rede) | Default `acceptEdits` + hooks de segurança como rede. `ask` ficou reservado para `git reset --hard` local e `--force-with-lease`. |
| Network | (sem matcher dedicado) | indireto via Bash | `curl`, `wget` em allow; restringir por projeto se houver risco específico. |

> Hierarquia de decisao do harness: `deny` > `ask` > `allow`. Mesmo que `allow` liste, se `deny` casar, bloqueia.

---

## 3. Modos suportados

Modos disponiveis no Claude Code e quando usar cada um neste projeto-modelo:

| Modo | Quando usar | Risco |
|---|---|---|
| `default` | Sessao exploratoria, primeiro contato com codigo, qualquer duvida sobre o que vai ser tocado. | Baixo — toda escrita pede confirmacao. Lento, mas seguro. |
| `acceptEdits` | **Modo padrao deste projeto** (`defaultMode` no settings). Aproveita a pro-atividade declarada no `CLAUDE.md` global do Roldao: agente executa em vez de perguntar. Hooks continuam ativos como rede de seguranca. | Medio — escritas auto-aprovadas, mas `secrets-scanner`, `anti-mascaramento` e `block-destructive` ainda bloqueiam. |
| `plan` | Tarefas de auditoria, design, ADR, qualquer coisa que exige raciocinio antes de tocar arquivo. Agente nao escreve nada — so propoe. | Zero — read-only. |
| `bypassPermissions` | **Proibido neste projeto, salvo override humano explicito com motivo registrado.** Pula permissions (mas hooks PreToolUse ainda rodam). | Alto — perde a camada `deny`. So usar em ambiente descartavel (sandbox, container efemero). |

> A escolha de `defaultMode: acceptEdits` no `settings.template.json` casa com a regra global do Roldao ("execute, nao pergunte permissao"). A rede de seguranca passa a ser os hooks — por isso eles **nao** sao opcionais.

> **Override de regra com motivo registrado:** quando precisar usar uma flag bloqueada (`--force-with-lease`, `--no-verify` etc), crie `.claude/.override-reason` com o motivo ANTES de pedir o comando. O hook `override-ledger.sh` lê, valida e registra em `.claude/overrides.log` (sem apagar); o `override-consume.sh` em PostToolUse apaga o arquivo depois que o comando executa (uso único). Garanta `.claude/.override-reason` no `.gitignore`. NUNCA use env var (`export OVERRIDE_REASON=...`) — o subprocesso do hook nao herda o ambiente do shell do usuario.

---

## 4. Matriz "onde implementar cada tipo de regra"

Decisor binário para o agente escolher camada sem perguntar:

| Tipo de regra | Camada primária | Reforço | Latência alvo |
|---|---|---|---|
| Secrets (token, chave, PII em código) | pre-commit (gitleaks) | hook `secrets-scanner.sh` PreToolUse | sub-segundo no pre-commit; tempo real no hook |
| Mascaramento (assertTrue(true), \|\| true) | pre-commit | hook `anti-mascaramento.sh` PreToolUse (block) + CI gate | sub-segundo no pre-commit |
| Frontmatter de docs canônicos | hook `frontmatter-validator.sh` PreToolUse (block paths críticos, warn demais) | pre-commit (block antes do push) | tempo real |
| Linha-limite de doc | hook `doc-line-counter.sh` PreToolUse (block) | pre-commit (block) | tempo real |
| Override/ledger | hook `override-ledger.sh` PreToolUse (block sem motivo) | log em `.claude/overrides.log` (auditoria) | tempo real |
| Bloqueio de comando destrutivo | permissions deny + hook `block-destructive.sh` PreToolUse | — | tempo real |
| Dependências (jq, python3) | hook `check-deps.sh` SessionStart (warn) | CI matrix de SO | uma vez por sessão |
| Staleness de doc canônico | hook `staleness-checker.sh` SessionStart (warn, cache 24h) | CI semanal | uma vez por dia |
| Convenção de import / lint estrutural | pre-commit | CI | sub-segundo no pre-commit |
| Compatibilidade entre módulos | CI (build matrix) | — | minutos |

Regra geral: o que dá pra detectar em sub-segundo entra em pre-commit; o que precisa de contexto da sessão entra em hook; o que precisa de SO ou time real fica em CI.

---

## 5. Camadas de validação por latência

| Camada | Latência aceitável | O que entra | Falha rompe |
|---|---|---|---|
| Hook PreToolUse (no edit) | <200ms ideal, <1s aceitável | secrets em tempo real, frontmatter canônico, override-ledger, block-destructive | edição/comando individual |
| Hook PostToolUse | até 2s | `override-consume.sh` (consome `.override-reason` de uso único) + hooks opt-in de fim de turno quando ativados | nada (só limpa/avisa) |
| Pre-commit (no `git commit`) | até 5s | linting, formatação, secrets, mascaramento, frontmatter de paths críticos | commit |
| Pre-push | até 30s | testes unitários rápidos do diff | push |
| CI (no push remoto) | minutos | testes completos, build matrix de SO, integração | merge/release |

---

## 6. Windows + Git Bash (ambiente real do dono)

- Hooks shell assumem **bash ≥ 4** — Git for Windows ≥ 2.40 inclui. `check-deps.sh` valida.
- `date -d` (GNU coreutils) está em Git for Windows. BusyBox/macOS antigo cai em fallback `python3` documentado nos hooks.
- Paths sempre em forward-slash (`C:/PROJETOS/...`). `LF` obrigatório via `.gitattributes` (`* text=auto eol=lf`).
- Caminho com espaço (caso real deste repo): **sempre entre aspas duplas** — `settings.json` usa `bash "$CLAUDE_PROJECT_DIR/..."` corretamente; replicar em qualquer comando.
- Configurar Claude Code para usar bash de `C:\Program Files\Git\bin\bash.exe`. Em `settings.json` do harness, definir `CLAUDE_CODE_BASH_PATH` no `env` do usuário (não do projeto — chave global).
- `sudo` não existe em Git Bash padrão; comandos `sudo ...` em deny são proteção contra cópia-cola de tutoriais Linux.

---

## 7. Checklist de sincronia

Quando alterar comportamento de harness, atualizar **na mesma mudanca**:

- [ ] `templates/settings.template.json` — chave `hooks`, `permissions`, `defaultMode`.
- [ ] Hook correspondente em `templates/hook-*.template.sh` (se hook novo).
- [ ] Esta matriz (`matriz-harness.md`) — linha na tabela apropriada.
- [ ] `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md` Camada C9b (§11) — se a mudanca afeta o método.
- [ ] ADR em `docs/adr/ADR-NNNN-<slug>.md` — se a decisao for arquitetural (mudou política de seguranca, adicionou flag de override permitida, etc.).
