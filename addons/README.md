---
owner: framework
revisado-em: 2026-05-17
status: stable
---

# Addons do ROLDAO-METHOD

Pacotes de extensão pra domínios específicos. Cada addon traz agentes, commands, hooks e/ou skills focados num cenário (Electron, NF-e, e-commerce, etc.).

## Estrutura de um addon

```
addons/<nome-do-addon>/
├── addon.yaml                    <- manifesto (obrigatório)
├── README.md                     <- pra que serve, como instalar
├── .claude/
│   ├── agents/                   <- agentes extras (opcional)
│   ├── commands/                 <- commands extras (opcional)
│   ├── hooks/                    <- hooks extras (opcional)
│   └── skills/                   <- skills extras (opcional)
├── .specify/templates/           <- templates extras de spec (opcional)
└── docs/                         <- documentação do addon (opcional)
```

## Manifesto `addon.yaml`

Schema mínimo:

```yaml
nome: <kebab-case>
versao: 0.1.0
descricao: <1 linha em PT-BR>
autor: <nome>
licenca: MIT
compativel-com: roldao-method>=0.3.0
provoca:
  agentes: [lista-de-agentes-criados]
  commands: [lista-de-commands-criados]
  hooks: [lista-de-hooks-criados]
  skills: [lista-de-skills-criados]
  regras: [lista-de-IDs-novos]  # ex: [ELECTRON-001, ELECTRON-002]
requisitos:
  - <pre-requisito 1>  # ex: "projeto Electron com src/main"
non-goals:
  - <o que o addon NÃO faz>
```

## Como instalar um addon

```bash
npx roldao-method add <nome>        # instala addon individual
npx roldao-method list              # mostra IDEs detectadas + addons disponíveis + instalados
```

Exemplos:

```bash
npx roldao-method add electron-br
npx roldao-method add fiscal-br-completo
npx roldao-method add lgpd-compliance
```

Pra desinstalar, remova manualmente a pasta `addons/<nome>/` do seu projeto e desfaça as entradas correspondentes em `.claude/`.

## Como criar um addon

1. Copie a estrutura de `addons/electron-br/` (exemplo de referência).
2. Edite `addon.yaml` com sua descrição.
3. Adicione apenas o que é específico ao domínio. Não duplicar o que já está no framework.
4. Cite IDs novos no manifesto (`provoca.regras`).
5. Adicione README explicando casos de uso.
6. Abra PR ou disponibilize em repositório separado.

## Addons disponíveis

| Addon | Foco |
|---|---|
| `electron-br` | App Electron com IPC seguro + migrações SQLite com backup + LGPD local |
| `fiscal-br-completo` | NF-e mod 55, CNPJ alfanumérico (jul/2026), contingência SEFAZ, base pra Reforma Tributária 2026-2033 |
| `lgpd-compliance` | DPO virtual, RIPD (Art. 38), canal do titular, plano de incidente 72h, respostas padronizadas a direitos (Art. 18) |
| `fintech-br` | Pix completo (5 tipos de chave, BR Code, webhook HMAC, devolução, MED, Pix Automático), Open Finance Brasil (FAPI + mTLS) |
| `esocial-completo` | Eventos S-1000 a S-3000, prazos legais, retificação via S-3000, layout S-1.3 vigente |
| `varejo-pdv-br` | SAT-CF-e (SP), NFC-e (demais UF), TEF, integração com balança e impressora não-fiscal |

## Roadmap de addons (sugestões)

- **`telemedicina`** — LGPD art. 11 + ANS + CFM + receita digital.
- **`saude-br-completo`** — TISS/EDI, CFM, ANS, dado sensível em escala.
- **`govtech-br`** — APIs do Governo (CPF, CNPJ, CNJ), e-Protocolo, assinatura ICP-Brasil.
- **`agro-br`** — CAR (Cadastro Ambiental Rural), nota fiscal de produtor, SISBOV.
- **`logistica-br`** — RNTRC, rastreamento de carga, CT-e + MDF-e.
- **`educacao-br`** — Portarias CNE, ENADE, e-Docente, histórico escolar seguro.

Quer contribuir? Abra issue em https://github.com/roldaobatista/roldao-method/issues.
