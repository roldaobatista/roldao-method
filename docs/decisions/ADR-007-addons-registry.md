---
id: ADR-007
titulo: Addons verticais com registry estatico em `addons/profiles.json`
status: aceito
data: 2026-05-22
owner: framework
revisado-em: 2026-05-22
---

# ADR-007 — Addons verticais com registry estatico

## Contexto

O core do framework e generico (LGPD, fiscal basico, REGRA #0, IDs rastreaveis). Verticais profundos (NF-e completo com 7 layouts, Pix com webhook HMAC e devolucao, eSocial S-1000 a S-3000, varejo SAT/MFE-CE, electron com IPC seguro) exigem agente especialista + hooks proprios + skills + templates. Empacotar tudo no core inflaria a instalacao basica (≥ 30s vs <10s atuais) e poluiria projetos que nao precisam.

Outros frameworks resolvem isso com plugin registry externo (npm scope, github org). Isso adiciona: (a) supply chain de plugins de terceiros, (b) versionamento independente, (c) descoberta dinamica via API. Tudo custa complexidade.

## Decisao

Addons sao pastas em `addons/<nome>/` dentro do mesmo repositorio do core, com metadata em `addons/<nome>/addon.yaml` e schema formal em `addons/addon.schema.json`. O registry e `addons/profiles.json` — arquivo JSON estatico mantido na main, listando os addons disponiveis (`fintech-br`, `fiscal-br-completo`, `electron-br`, `esocial-completo`, `lgpd-compliance`, `varejo-pdv-br`).

CLI:
- `npx roldao-method search [termo]` — lista do `profiles.json`.
- `npx roldao-method add <nome>` — copia `addons/<nome>/.claude/**`, `addons/<nome>/templates/**` pro projeto + aplica patch em `settings.json`.
- `npx roldao-method remove <nome>` — remove diretorios + reverte patch.

Nao tem instalacao remota dinamica. Nao tem versao por addon (vivem junto da versao do framework). Nao tem registry de terceiros (a propria estrutura serve de fork-friendly).

## Consequencias

**Positivas:**
- Install do core continua < 10s — addon e opt-in.
- Sem supply chain externa. Tudo auditavel no proprio repositorio (zero CVE delegada).
- `npx roldao-method update` atualiza addons junto com o core (sem drift de versao).
- Fork-friendly: dev cria seu addon copiando `addons/<modelo>/` no fork.

**Negativas:**
- Sem ecossistema de terceiros — addon novo de comunidade exige PR no repo principal. Aceito enquanto comunidade nao escala (revisitar quando houver tracao).
- Registry estatico exige PR pra adicionar/remover addon publico. Tolerado — o universo de verticais BR e pequeno e estavel.

## Alternativas descartadas

- **Registry externo dinamico (npm scope `@roldao-method/`):** descartado por enquanto. Aumentaria superficie de supply chain attack sem ganho proporcional ao tamanho atual da comunidade.
- **Resolucao em runtime via cascata de templates:** ADR-003 ja cobre override estatico sem fork. Cascata dinamica e item futuro (gatilho: comunidade ativa).

## Como aplicar

- Addon novo: criar pasta `addons/<nome>/` com `addon.yaml` (validado contra `addons/addon.schema.json`), `README.md`, e estrutura espelhando `.claude/` + `templates/`.
- Adicionar entrada em `addons/profiles.json`.
- `tools/validar-templates.js` cobre validacao no CI.

## Relacionado

- [[ADR-003]] override sem fork (`.specify/overrides/`).
- [[ADR-008]] skills BR como camada operacional.
