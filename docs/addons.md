---
owner: framework
revisado-em: 2026-05-23
status: stable
---

# Addons do ROLDAO-METHOD

Pacotes de extensão pra domínios específicos do mercado brasileiro. Cada addon traz agentes, hooks e skills focados num cenário — você só instala quando precisa, não polui o core.

## Catálogo (6 addons)

| Addon | Cenário | Agente | Hooks | Skills principais |
|---|---|---|---|---|
| [`electron-br`](../addons/electron-br/) | App Electron BR com SQLite local, IPC seguro e armazenamento offline de dado pessoal (LGPD) | `electron-arch` | `block-ipc-without-validation` | `migration-sqlite-segura` |
| [`fiscal-br-completo`](../addons/fiscal-br-completo/) | NF-e modelo 55 com assinatura digital, CNPJ alfanumérico (jul/2026), contingência SEFAZ | `nfe-arch` | `require-sefaz-env` | `emitir-nfe-55`, `calculadora-reforma-paralela` (LC 214/2025) |
| [`lgpd-compliance`](../addons/lgpd-compliance/) | DPO virtual, RIPD automatizado, canal do titular, plano de incidente 72h (LGPD-006/ANPD) | `dpo-virtual` | — | `gerar-ripd` |
| [`fintech-br`](../addons/fintech-br/) | Pix completo (chave, BR Code, cobrança, devolução, Pix Automático) + Open Finance Brasil | `pix-arch` | `validate-webhook-signature` | `gerar-br-code` |
| [`esocial-completo`](../addons/esocial-completo/) | Eventos S-1000 a S-3000, CIPA, NRs, prazos legais, retificação (Layout S-1.3) | `esocial-arch` | `validate-esocial-prazo` | — |
| [`varejo-pdv-br`](../addons/varejo-pdv-br/) | SAT-CF-e (SP), NFC-e (demais UF), MFE (CE), TEF, balança/impressora, contingência offline | `pdv-arch` | `validate-tef-flow` | `emitir-sat-cfe` |

## Como instalar

```bash
npx roldao-method add <nome>          # instala o addon
npx roldao-method remove <nome>       # remove (preserva core)
npx roldao-method search [termo]      # busca addons disponíveis
npx roldao-method list                # lista addons já instalados
```

Exemplo:

```bash
npx roldao-method add fintech-br      # adiciona Pix, BR Code, webhook
npx roldao-method add fiscal-br-completo  # adiciona NF-e 55
```

Os addons compartilham o mesmo idioma do core (PT-BR) e respeitam as mesmas regras inegociáveis. IDs próprios de regra ganham prefixo (ex: `NFE-001`, `PIX-001`, `ELECTRON-001`).

## Por que addon e não core?

- **Core enxuto** — quem não emite NF-e não precisa carregar 5 hooks de SEFAZ.
- **Atualização independente** — addon novo não precisa de release nova do framework.
- **Domínio profundo** — cada addon foi escrito por quem entende o cenário (manual Bacen pro Pix, manual SEFAZ pra NF-e, Portaria 71/2024 pro eSocial).

## Quando instalar cada um

- **Construindo app desktop com dados sensíveis offline** → `electron-br`.
- **Emitindo NF-e ou planejando Reforma Tributária 2026-2033** → `fiscal-br-completo`.
- **PJ que processa dado pessoal em escala** (e-commerce, SaaS B2C, fintech) → `lgpd-compliance` (obrigatório se você opera com risco regulatório).
- **Cobrando via Pix** (qualquer modelo: marketplace, fintech, ERP, vending) → `fintech-br`.
- **Folha de pagamento ou GFIP eSocial** → `esocial-completo`.
- **Loja física com PDV** (SAT, NFC-e, TEF) → `varejo-pdv-br`.

Vários addons podem coexistir — o instalador detecta conflito de regra (IDs duplicados) antes de aplicar.

## Criar seu próprio addon

Estrutura, manifesto `addon.yaml` e schema formal estão em [`addons/README.md`](../addons/README.md). Passo-a-passo prático: [`docs/EXTENDENDO/addon.md`](EXTENDENDO/addon.md).

## Não-confundir com plugin

- **Addon** = pacote vertical com agente + hook + skill juntos pra um cenário BR (este documento).
- **Plugin** = arquivo único `.claude-plugin/plugin.json` que registra o ROLDAO-METHOD pro Claude Code Plugin Marketplace (interno do Claude Code, transparente pro usuário).

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
