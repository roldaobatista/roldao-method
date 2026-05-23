---
tipo: prd
id: PRD-001
versao: 1
status: draft
owner: Roldão (decisão estratégica)
revisado-em: 2026-05-23
---

# PRD-001 — Suporte real a Windows sem Git Bash

> **Pergunta a decidir:** como o ROLDAO deve se comportar em ambientes Windows sem Git Bash (PowerShell, CMD), que representam parte significativa do público dev BR? Reescrever hooks pra rodar em outro shell? Recusar a instalação? Continuar com warning + bloqueio default (v0.20.0)?

---

## 1. Problema

Dev BR Windows costuma usar PowerShell ou CMD direto, sem instalar Git for Windows. Até a v0.19, o ROLDAO **instalava silenciosamente** nesse cenário — o cliente lia "instalado" e achava que estava protegido, mas nenhum dos 26 hooks bloqueadores executava (são `.sh`, exigem bash + perl).

A v0.20.0 elevou o aviso pra banner gigante e bloqueio default no install (precisa `--force` pra prosseguir). Resolve o **falso senso de proteção**, mas **não estende a proteção** pra esse público.

**Evidência:**
- Stack Overflow Developer Survey 2024: 47% dos devs usam Windows como SO primário. Em mercado BR, percepção do mantenedor é maior (PowerShell pré-instalado em todo Windows; Git Bash exige passo manual).
- Suporte no GitHub: 0 issues abertos hoje (porque o framework é novo), mas histórico esperado: "instalei e não vi nada bloquear".
- Pior modo de falha do framework é "silenciosamente desativado" — quebra a promessa central ("impede o erro").

---

## 2. Personas

| Persona | Quem é | O que quer | Onde sofre hoje |
|---|---|---|---|
| **Júlio, dev BR Windows puro** | Dev .NET ou PHP em consultoria, máquina corporativa Windows, PowerShell default. Não tem Git for Windows porque IDE (Visual Studio / Rider) integra git internamente. | Adotar ROLDAO sem virar "DevOps acidental". | v0.20: instala, vê aviso vermelho, ou desiste, ou usa `--force` e fica desprotegido. |
| **Renata, líder de squad multi-OS** | Lidera squad com 4 macs + 2 windows. Quer mesma garantia de hooks em todos. | Paridade entre os 6 devs. | Hoje a Renata teria que padronizar Git Bash via documentação interna — barreira de adoção. |
| **Ana, contadora-CTO de PME** | PME de 8 pessoas, Ana é a única que entende código (pouco), usa PowerShell. | Que o sistema "fiscal-br" funcione sem ela aprender git. | v0.20 trava ela; ela não vai instalar Git for Windows porque "isso é coisa de dev". |

---

## 3. Hipótese de solução (3 caminhos a comparar)

### Caminho A — Port pra Node.js (recomendado pra avaliar)

Reescrever os 26 hooks bash em Node.js puro. Aproveita que `bin/install.js` já é Node, zero-deps. Hook fica `.js`, invocado pelo Claude Code via `node hook.js` (Claude Code aceita qualquer executável).

**Pró:**
- Zero dependência externa de bash/perl/python — roda em Windows, Linux, macOS, container minimal.
- Manutenção única (1 implementação).
- Testes em Vitest/Node native test runner — sem `_test-runner.sh` artesanal.
- Estende paridade IDE: hooks executáveis também em ambientes onde só Node existe.

**Contra:**
- Reescrita grande (~2.500 linhas de bash). 2-3 semanas focadas.
- Performance pode degradar (cold start Node vs `bash` direto). Provavel impacto < 100ms por hook, aceitável.
- Existing addons (`electron-br`, `fintech-br`) também precisam migrar seus hooks `.sh`.

### Caminho B — Port pra PowerShell (paridade bash+ps1)

Manter os 26 `.sh` + criar 26 `.ps1` equivalentes. Instalador detecta o shell e escolhe.

**Pró:**
- Cobre Windows nativo sem força Git for Windows.
- Bash continua sendo a referência (sem reescrever Unix).

**Contra:**
- **2 implementações por hook = drift garantido** (PS e bash divergem com tempo).
- Suite de testes dupla.
- Bug em uma implementação que não está na outra é silencioso.
- Mantenedor solo não escala. Risco alto de virar débito.

### Caminho C — Status quo (v0.20.0) + documentação reforçada

Manter banner + bloqueio. Investir em documentação ("como instalar Git for Windows em 2 minutos"), video curto, e botão `--force` consciente.

**Pró:**
- Zero código novo a manter.
- Garantia técnica preservada (quem instala, sabe que precisa de Git Bash).

**Contra:**
- Fricção de adoção alta no público Windows.
- Não resolve o pior cenário (cliente que usa `--force` por desespero e fica desprotegido).
- Mensagem "framework BR pra dev BR" fica fraca se o dev BR Windows não consegue usar.

---

## 4. User stories candidatas (depende do caminho escolhido)

### Se caminho A (Node port):
- **US-001** — Como Júlio, quero rodar `npx roldao-method install` em PowerShell e ter os 26 hooks funcionando sem instalar nada além de Node.
- **US-002** — Como Renata, quero que CI Linux e dev macOS produzam **exatamente o mesmo resultado** dos hooks (paridade byte-a-byte nos retornos `block`/`exit 2`).
- **US-003** — Como mantenedor, quero `npm test` rodando os 179 cenários de teste em Node, sem `_test-runner.sh`.

### Se caminho B (PowerShell port):
- **US-001** — Como Júlio, quero `npx roldao-method install` detectar PowerShell e instalar `.ps1` no lugar de `.sh`.
- **US-002** — Como mantenedor, quero suite de teste que valida que `.sh` e `.ps1` retornam o MESMO veredito pro mesmo input (anti-drift).

### Se caminho C (status quo):
- **US-001** — Como Júlio, quero o aviso de "sem proteção" vir junto de link direto pro instalador Git for Windows + 3 prints curtos.
- **US-002** — Como Ana, quero um caminho alternativo: "ROLDAO em modo aviso-só" que NÃO bloqueia mas LISTA o que faria. Educacional, sem proteção real.

---

## 5. Non-goals (INV-003)

- Refatorar agentes/skills/commands — só hooks são afetados.
- Suporte a outros shells (fish, zsh customizado) — bash POSIX + Node são suficientes.
- Mudar comportamento dos hooks (regras intactas).
- Reescrever `_test-runner.sh` se caminho B for escolhido — manteria a infra de teste atual.

---

## 6. Métricas de sucesso

- **Taxa de instalação completada** em Windows (antes vs depois) — meta: ≥80% (hoje provavelmente <30% pelo cliente Windows puro).
- **Issues "hooks não bloquearam"** — meta: 0 nos 90 dias após release.
- **Stars/instalações** após anúncio "agora roda em Windows nativo" — proxy de tração no público dev BR.

---

## 7. Trade-off do mantenedor (decisão tua)

| Critério | A (Node) | B (PowerShell) | C (Status quo) |
|---|---|---|---|
| Esforço inicial | 2-3 semanas | 4-6 semanas | 1 dia (já feito) |
| Manutenção/ano | Baixa (1 implementação) | Alta (2 implementações + drift) | Zero |
| Cobertura Windows puro | 100% | 100% | 0% |
| Risco de drift | Baixo | Alto | Zero |
| Performance | -50ms a -100ms cold | Igual ao bash | Igual ao bash |
| "Promessa" do framework | Cumprida | Cumprida | Quebrada em Windows |

**Recomendação:** caminho A. Ataca a raiz (zero shell, zero locale issue), reduz manutenção a longo prazo, e desbloqueia outros ganhos (testes mais rápidos, mais portátil pra container/Lambda futura).

---

## 8. Próximo passo

Sua decisão entre A / B / C. Se A: criar `/epico` decompondo em 5-7 stories (1 por agrupamento de hooks: destrutivos, secrets, mascaramento, fiscal, LGPD, lifecycle, agentes-pipeline). Se B: criar `/epico` com 2 frentes paralelas (port + suite de equivalência). Se C: fechar este PRD como "wontfix por enquanto" e investir em vídeo + doc.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
