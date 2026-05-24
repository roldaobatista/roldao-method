---
owner: auditoria-independente
revisado-em: 2026-05-24
status: stable
auditor: onboarding-leigo
nota: 7.5/10
---

# Auditoria Onboarding Leigo — 2026-05-24

## Resumo executivo
**Nota: 7,5/10.** Onboarding já foi tratado a sério — `demo` offline, `tutorial` interativo de 5 perguntas, PARA-DONO, GLOSSARIO, árvore de decisão no `/help`. **Top blocker:** o README usa muito vocabulário técnico nos primeiros 30 segundos (hook, exit 2, decision:block, PreToolUse) sem o leigo entender, e a frase de abertura promete "manual de operação pro assistente de IA" — o dentista lê e não sabe se isso é pra ele.

## Pontos fortes
- **`npx roldao-method demo` sem instalar nada** (README:10-16) — barreira zero. Excelente.
- **`npx roldao-method tutorial`** (`bin/lib/tutorial.js:96-100`) substitui "preencha 14 campos `_(preencher)_`" por 5 perguntas em PT-BR. Detecta "sim/y/yes/s" como confirmação.
- **`docs/PARA-DONO-DE-PRODUTO.md`** é EXCELENTE pro leigo. Estrutura "5 momentos que você vai viver" e tabela "o que você quer → comando" são didáticas.
- **`docs/GLOSSARIO.md`** completo e claro, com seção "quando você ouvir o assistente dizer algo estranho".
- **`/help` com árvore de decisão** — leigo escolhe por pergunta ("é algo que NÃO funciona como deveria?"), não por jargão.
- **Output pós-install** (install.js:663-670) já aponta passo 1: `tutorial`. Bom.

## Blockers P0 (leigo trava aqui)
- **README.md:3 — frase de abertura ambígua** — `"Manual de operação em português pro seu assistente de IA (Claude, Cursor, etc)."`. Dentista lê "manual pro assistente" e pensa "então é pro programador configurar, não pra mim". **Sugestão:** `"Você descreve em português o que quer no seu sistema (cadastrar cliente, corrigir boleto). O framework garante que o assistente de IA siga um roteiro seguro, sem siglas e respeitando LGPD/Pix/NF-e. Você não precisa programar."`
- **README.md:31, 38, 74 — jargão na vitrine** — `"exit 2"`, `"JSON decision:block"`, `"PreToolUse/PostToolUse/Stop"`, `"sandbox contra agente malicioso"`, `"defesa em profundidade, não garantia criptográfica"`. Leigo trava nos primeiros 60 segundos. **Sugestão:** mover detalhe técnico pra `ARQUITETURA.md` e deixar no README só `"o sistema barra a ação perigosa antes dela acontecer"`.
- **QUICKSTART.md:48-52 — passo "Valide os hooks"** pede `npm run test:hooks-node-only` e fala em "59 cenários" e "EXIT:0". Dentista sem npm no PATH trava. **Sugestão:** trocar por `npx roldao-method doctor` (já existe) e marcar como opcional.
- **Pós-install não linka PARA-DONO** — install.js:670 cita GLOSSARIO mas não cita PARA-DONO-DE-PRODUTO.md. Quem mais precisa dele é o leigo que acabou de instalar. **Sugestão:** adicionar linha `Não programa? Comece em: docs/PARA-DONO-DE-PRODUTO.md`.

## Atritos P1 (leigo não trava mas hesita)
- **README.md:84-91 — tabela de addons em inglês técnico** (`"IPC seguro + SQLite + LGPD local"`, `"webhook HMAC"`). Sugestão: coluna "Pra quem é": `"electron-br → app de desktop que você instala no computador do cliente"`.
- **`/inicio` Etapa 4 e 5 falam em "frontmatter", "gate mecânico", "EP-NNN-status.md"** logo após o leigo rodar o comando pela primeira vez. Sugestão: o agente deve resumir em PT-BR ("registrei que o esqueleto está pronto") em vez de listar etapas internas.
- **CLAUDE.md/AGENTS.md são pra agente, não pro leigo** — está correto, mas o leigo abre por curiosidade e vê `INV-001`, `SEC-005`, `@import`. Sugestão: adicionar bloco curto no topo do AGENTS.md: `"Este arquivo é pro assistente de IA. Se você não programa, leia docs/PARA-DONO-DE-PRODUTO.md."`
- **Templates de spec** (`.specify/templates/*`) — moldes vazios. Quem nunca viu PRD não sabe preencher. Sugestão: 1 exemplo preenchido por template.

## Sugestões pra melhorar onboarding (P2)
- `npx roldao-method` (sem argumento) → mostrar menu de próximos passos.
- Vídeo de 90s ou GIF animado no topo do README mostrando `demo` rodando.
- `/help` aceitar termo em português natural: `/help "como conserto bug?"` → sugerir `/bug`.
- Linkar PARA-DONO no rodapé de todo comando que reporta progresso.

## Veredito
**Parcial.** O Roldão do mundo real (dentista equivalente) consegue rodar `demo` e `tutorial` sozinho — esses dois caminhos estão bem desenhados. Mas se ele abre o README primeiro (caminho mais comum vindo do npm/GitHub), os 60 primeiros segundos jogam jargão técnico e ele pensa "isso aqui é pro programador, não pra mim". Onboarding tem todos os ingredientes certos, mas a **vitrine de entrada (README + pós-install) ainda fala "pra dev"**, não "pra dono de produto". Ajuste de 30 linhas no README e 2 linhas no output do install resolveriam.
