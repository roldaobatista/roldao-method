---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: ux-terminal
nota: 7.5/10
---

# Auditoria UX Terminal — 2026-05-24

## Resumo executivo
Framework com **UX de terminal acima da média BR** — statusline rica e didática, hooks com mensagens estruturadas (BLOQUEADO + Por que + Como destravar), output styles com tom consistente. Nota subjetiva: **7,5/10**. **Top issue: zero TL;DR no topo dos agentes** — usuário não-programador precisa ler 100-200 linhas antes de entender o que o agente vai entregar.

## O que está BOM (manter)

- **Statusline densa mas legível** (`.claude/statusline.js:159`) — `📍 v1.0.3 · 🤖 Opus · 🌿 main · 📌 US-042 · 📊 75% · 🛡️ 3 · 👤 🔬 Detetive` informa versão, modelo, branch, story, contexto, blocks do dia e agente ativo. Cor escalada por urgência (`statusline.js:137-140`: amarelo ≥50%, vermelho ≥75%, vermelho-bold+`!` ≥90%) é exemplar.
- **Mensagens de hook bloqueador com 4 partes claras** (`block-destructive.js:89-95`): `BLOQUEADO` + `Comando` + `O que detectamos` + `Por que bloqueia (ID-regra)` + `Como destravar`. Padrão replicado em `secrets-scanner.js:59-63` e `anti-mascaramento.js:57-60`. Usuário sabe o que fazer.
- **Árvore de decisão ASCII no `/help`** (`help.md:15-51`) — usuário não-programador encontra workflow correto sem ler tabela inteira. Excelente UX de descoberta.
- **`block-jargon-pt-br.js:79-87`** entrega tabela de tradução PT-BR junto com o bloqueio. Não só diz "errado", diz como escrever certo.
- **Output style `pt-br-conciso`** (`pt-br-conciso.md:27-32`) prescreve estrutura de 3 partes (anúncio → updates → resumo) — disciplina a verbosidade do agente.

## Problemas P0

- **Agentes não têm TL;DR/visão de 3 linhas no topo.** `investigador.md` (121 linhas), `maestro.md` (200 linhas), `fiscal-br.md` (170 linhas) abrem direto em "Princípio absoluto" ou frontmatter denso. Roldão (dono-de-produto não-dev) abrindo `cat investigador.md` no terminal não sabe em 5 segundos "o que esse agente entrega pra mim". **Fix:** após o frontmatter, adicionar bloco `## Em 3 linhas` com: o que faz, quando é acionado, o que devolve.
- **Statusline emite emojis crus sem fallback** (`statusline.js:159`). Terminal sem suporte emoji (CI, log capturado, PowerShell legado, leitor de tela) vê `?` ou `□`. Não há flag `--no-emoji` nem detecção de `TERM=dumb`. **Fix:** checar `process.env.NO_COLOR`/`process.env.TERM === 'dumb'` e fallback pra texto (`[v1.0.3] [Opus] [main] [Detetive]`).
- **Cores ANSI hardcoded sem respeitar `NO_COLOR`** (`statusline.js:91-96`). Padrão `NO_COLOR=1` (https://no-color.org) é honrado por ferramentas modernas. Idem para `FORCE_COLOR=0`. Daltônicos que dependem de tema customizado e usuários em CI ficam com escape sequences brutas no log.

## Problemas P1

- **`/feature.md` (44 linhas) é parede de meta-informação sobre o Maestro** — usuário lendo via `cat` no terminal não vê em momento algum "vai gastar X minutos" ou "vai gerar arquivos Y, Z". Compare com `/bug.md:62-72` que tem bloco "Saída final" exemplar. Replicar esse bloco em todos os 26 commands.
- **README abre com 3 badges + manual** mas linha 38 tem `🛡️ **34 hooks Node puros**...` — densidade alta de número/símbolo numa única frase de marketing. `gh repo view` mostra isso com formatação degradada.
- **Statusline lê transcript inteiro a cada refresh** (`statusline.js:120` `lerUltimosBytes(... 256*1024)`) — em sessão longa pode atrasar prompt. Já está limitado a 256KB, mas vale métrica.
- **Output style `dpo-lgpd` e `fiscal-br` não declaram quando trocar de volta pro `pt-br-conciso`.** Usuário não sabe que escolheu tom errado pra tarefa atual.

## Sugestões opcionais (P2)

- Separador visual (`──────`) entre seções dos hooks bloqueadores.
- `MAPA-VISUAL.md:13-48` poderia virar saída de um comando `/agentes`.
- `--quiet` na statusline pra rodar em headless/CI.
- Personas com nomes próprios (Sofia, Bruno) duplicam carga cognitiva — statusline mostra `📋 Sofia` enquanto `/feature.md` cita `Sofia → Detetive → Rafael` e `MAPA-VISUAL.md` mistura ambos.

## Veredito

**Parcial — respeita o usuário, mas falta acessibilidade.** O framework demonstra cuidado real com UX terminal: hooks explicam como destravar, statusline tem hierarquia de cor inteligente, `/help` tem árvore de decisão, output style prescreve concisão. Onde falha: assume terminal moderno com emoji+cor (sem fallback `NO_COLOR`/`TERM=dumb`), e os agentes não têm TL;DR. Resolvendo os 3 P0 (TL;DR + `NO_COLOR` + fallback emoji) a nota sobe pra 9.
