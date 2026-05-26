---
owner: tech-lead
revisado-em: 2026-05-26
status: aceito
decidido-em: 2026-05-26
decidido-por: Roldao Batista
prd: PRD-004
epico: EP-003
story: US-123
supersedes: []
superseded-by: null
origem:
  data: 2026-05-26
  incidente-ou-feedback: "Analise externa do lionclaw (10 agentes) — `docs/analises/2026-05-26-licoes-do-lionclaw.md` §3, §4, §5"
  sintoma-observado: "AGENTS.md §9 lista addon `electron-br` mas nao tem agentes/skills/templates materializados. Dev BR plugando ROLDAO-METHOD em Electron acaba copiando padrao do lionclaw na unha e replicando god-file 8198 linhas, prompt em migration, zero aria-live."
---

# ADR-030 — Addon `electron-br` como cidadao de primeira classe

> Decisao **aceita** em 2026-05-26 pelo Roldao. **Sera o primeiro addon do framework com estrutura completa (agentes/hooks/skills/templates/rules).**

---

## Contexto

O framework ja menciona addon `electron-br` em `AGENTS.md §9 — Pontos de extensao`. Mas o addon **nao existe materializado** em `addons/electron-br/`. Resultado pratico: dev BR plugando ROLDAO-METHOD em produto Electron (NF-e, Pix, certificado A1, eSocial — combinacao recorrente no mercado BR) tem 2 caminhos:

1. Copiar padrao do lionclaw na unha — herda os anti-padroes que a auditoria de 2026-05-26 catalogou (god-file 8198 linhas, prompt em migration, zero aria-live)
2. Inventar do zero — perde a base que o lionclaw provou em producao (cofre 3-camadas, 15 MCPs locais, IPC tipado por dominio)

A analise externa do lionclaw (`docs/analises/2026-05-26-licoes-do-lionclaw.md`) extraiu **8 padroes bons que viram template** + **5 hooks Electron-especificos** + **2 agentes especialistas** + **7 skills**. Falta empacotar tudo num addon instalavel.

Hoje os addons existentes (`fintech-br`, `fiscal-br-completo`, `lgpd-compliance`) sao **pequenos** — entregam hooks pontuais + 1-2 skills. Nenhum tem agentes proprios nem templates production-ready. `electron-br` sera o primeiro com **estrutura completa**, servindo de referencia pros proximos.

## Decisao

**Criar `addons/electron-br/` como cidadao de primeira classe com: 2 agentes (`electron-architect`, `electron-security`), 5 hooks bloqueadores Electron, 7 skills, 8 templates production-ready, 1 rule com `paths:` frontmatter, 1 README PT-BR, 1 ADDON.json manifest. Instalavel via `npx roldao-method add electron-br`. Detecao automatica no install do framework sugere o addon quando `package.json` tem `electron` em deps.**

### Estrutura

```
addons/electron-br/
├── ADDON.json                              # manifest do addon
├── README.md                               # PT-BR — quando usar + o que entrega
├── agents/
│   ├── electron-architect.md               # decide main/preload/renderer + IPC
│   └── electron-security.md                # auditor de seguranca Electron (especialista de Caio)
├── hooks/
│   ├── block-electron-insecure-webprefs.js
│   ├── require-context-bridge-preload.js
│   ├── block-window-open-without-handler.js
│   ├── require-single-instance-lock.js
│   └── require-csp-meta.js
├── skills/
│   ├── gerar-ipc-handler/SKILL.md + scripts
│   ├── gerar-preload-seguro/SKILL.md
│   ├── validar-csp-electron/SKILL.md
│   ├── gerar-secrets-vault-electron/SKILL.md
│   ├── gerar-migration-sqlite-segura/SKILL.md
│   ├── gerar-mcp-local-electron/SKILL.md
│   └── windows-line-endings-check/SKILL.md
├── templates/
│   ├── electron-builder.yml.example
│   ├── preload-secure.ts.example
│   ├── main-index.ts.example
│   ├── entitlements.mac.plist.example
│   ├── tsconfig-project-references.json
│   ├── package-json-com-gates.json
│   ├── db/migration-template.ts
│   └── db/schema-template-pii.sql
└── rules/
    └── electron-br.md                      # paths: ['**/*.tsx', 'electron/**', 'src/main/**', ...]
```

### ADDON.json manifest

```json
{
  "name": "electron-br",
  "version": "1.0.0",
  "framework_compat": ">=3.0.0",
  "description": "Padroes Electron BR — preload seguro, IPC tipado, cofre de secrets 3-camadas, builder production-ready, MCPs locais, anti-zumbi Windows",
  "instalavel_em": ["projeto-electron"],
  "deteccao_automatica": {
    "package_json_dep": "electron",
    "diretorios_indicativos": ["electron/", "src/main/", "src/preload/"]
  },
  "instala": {
    "agents": 2,
    "hooks": 5,
    "skills": 7,
    "templates": 8,
    "rules": 1
  },
  "conflito_com": [],
  "namespace": "electron-br"
}
```

### Comportamento do install

`npx roldao-method add electron-br`:
1. Le `ADDON.json`, valida `framework_compat` contra versao instalada
2. Copia agentes pra `.claude/agents/_electron-br/` (subpasta namespaced)
3. Copia hooks pra `.claude/hooks/_electron-br/` (subpasta namespaced)
4. Copia skills pra `.claude/skills/_electron-br/`
5. Copia templates pra `templates/_electron-br/` no projeto cliente
6. Atualiza `.claude/rules/` adicionando rule do addon
7. Atualiza `.claude/settings.json` registrando hooks novos
8. Gera entrada em `.claude-addons.json` (registro de addons instalados)
9. Imprime resumo PT-BR: "Addon electron-br instalado. Adicionados: 2 agentes, 5 hooks, 7 skills, 8 templates."

### Deteccao automatica no `npx roldao-method install`

Logica adicional no install do framework core (US-118 AC-118-4):

```
1. Detecta package.json no projeto
2. Se deps inclui "electron": sugere "Instalo addon electron-br junto? (recomendado)"
3. Se sim: instala addon na sequencia
4. Se nao: registra preferencia em .claude/settings.local.json (nao perguntar de novo)
```

### Compativel com framework v2

Addon nao quebra framework v2.x. Manifest declara `framework_compat: ">=3.0.0"` — pra v2.x, mostra erro "Atualize pra v3.0+ pra usar electron-br".

### Princípio aditivo (ADR-031)

Hooks do addon vivem em namespace `_electron-br/`. **Nao colidem com hooks do core.** Hooks customizados pelo usuario em `.claude/hooks/_local/` (US-117) continuam funcionando.

### Anti-padroes do lionclaw que o addon NAO replica

O lionclaw e referencia tecnica mas tambem cobaia de anti-padroes. O addon entrega:

- ❌ Sem god-file de 8000+ linhas — IPC fatiado por dominio (max 200 linhas/arquivo)
- ❌ Sem prompt em migration — `templates/db/migration-template.ts` so DDL
- ❌ Sem zero aria-live — `templates/components/PipelineDashboard.tsx.example` (do PRD-004 US-125) tem aria-live
- ❌ Sem auto-publish silencioso — staging + diff + confirmacao em 4 stages (ja codificado em INV-007)
- ❌ Sem reconcile insert-only que nao propaga — addon documenta padrao `reconcileMode: 'preserve' | 'force-canonical'` por campo

## Alternativas consideradas

### Alternativa 1 — Nao criar addon, deixar usuario copiar do lionclaw (recusada)

Vantagem: zero esforco de manutencao. Desvantagens:

- Lionclaw nao e framework — e produto. Pode mudar sem aviso
- Padroes ruins do lionclaw (god-file) viajam junto com bons
- Sem versionamento — usuario fica preso na foto do lionclaw na hora do copiar
- Roldao perde a oportunidade de servir mercado Electron BR proativamente

**Recusada.** Mercado Electron BR e grande demais (mercado de software desktop BR ainda usa Electron pra produto com NF-e + Pix offline) pra deixar sem suporte.

### Alternativa 2 — Embed direto no core (sem ser addon) (recusada)

Tudo em `.claude/` direto. Vantagens: install mais simples. Desvantagens:

- Inchaco do core (44 hooks + 5 = 49; 17 agentes + 2 = 19; 28 commands)
- Projeto que nao usa Electron carrega tudo
- Quebra principio "core enxuto + addons especializados" do AGENTS.md §9

**Recusada.** Addon e o padrao certo.

### Alternativa 3 — Addon minimal (so 1-2 hooks) (recusada)

Vantagens: barreira baixa pra implementar. Desvantagens:

- Nao resolve a necessidade real (templates + agentes + IPC tipado)
- Dev continua copiando do lionclaw na unha pra restante

**Recusada.** Primeiro addon completo precisa servir de referencia pros proximos.

### Alternativa 4 — Adiar pra v3.1 (recusada)

Lancar v3.0 sem addon, e em v3.1 publicar. Vantagens: v3.0 mais focada. Desvantagens:

- Roldao identificou que a auditoria de 2026-05-26 cobriu Electron com profundidade — perder momentum
- v3.0 ja e major bump; adicionar addon junto faz sentido semanticamente

**Recusada.** Entregar junto.

## Consequencias

### Positivas

- Dev BR em Electron tem caminho oficial em vez de copia adaptada do lionclaw
- Padroes ruins do lionclaw nao se propagam
- Addon serve de **referencia** pros proximos addons completos (futuro: `react-native-br`, `flutter-br`)
- Manifest `ADDON.json` formaliza contrato — projeto cliente sabe o que vai ganhar
- Namespaced (`_electron-br/`) evita colisao com customizacoes do usuario
- Deteccao automatica no install reduz friccao

### Negativas

- Manter addon = mais trabalho (~8h/release por addon)
- Templates Electron envelhecem — Electron 30 vai pedir mudanca em 1-2 anos
- Risco de Roldao acabar nao mantendo (mitigavel: documentar gatilhos de reabertura)
- Addon depende de `core >= 3.0.0` — projeto cliente fica preso a v3+
- Tamanho da release v3.0.0 cresce (mas Roldao confirmou: vale entregar junto)

### Compativel com

- **ADR-001** (Node puro zero-deps) — addon segue mesma regra
- **ADR-015** (Addons importam lib do core) — addon usa `_lib.js` do core
- **ADR-031** (Preservacao de capacidade) — addon e ADICIONAL; nao remove nada
- **AGENTS.md §9** — formaliza o que ja estava previsto como ponto de extensao
- **INV-005** — addon tem AGENTS.md proprio (≤200 linhas)

## Gatilhos de reabertura

- Electron 30 lancar com mudanca em IPC contract → revisar templates
- Lionclaw migrar pra Tauri/outro stack → reavaliar referencia tecnica do addon
- Mais de 10 projetos BR adotarem addon e reportarem mesma dor → criar `electron-br-extended`
- `framework_compat: ">=3.0.0"` virar limitacao real (projeto em v4 quer addon) → bump pra v2.0.0 do addon

## Como verificar

- `npx roldao-method add electron-br` em projeto sandbox vazio → 23 arquivos copiados em < 3s
- Cria `BrowserWindow` com `nodeIntegration: true` em arquivo sandbox → hook `block-electron-insecure-webprefs.js` bloqueia
- `package.json` com `"electron": "*"` em deps + `npx roldao-method install` → pergunta "Instalo addon electron-br?"
- `cat .claude-addons.json` mostra `electron-br: { version: "1.0.0", installed_at: "2026-MM-DD" }`

## Historico

| Data | Quem | Mudanca |
|---|---|---|
| 2026-05-26 | tech-lead (Rafael) | proposta inicial — aguardando aceite do Roldao |
