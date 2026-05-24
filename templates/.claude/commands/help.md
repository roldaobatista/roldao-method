---
description: Catálogo dos workflows do ROLDAO-METHOD com códigos curtos e quando usar cada um.
argument-hint: "[codigo opcional: IN | BF | PRD | EP | US | CL | FT | QD | BG | HF | IPM | RF | QA | AU | AR | CN | EC | RT | RP | SP | ST | CK | RL | RD | HP | SH]"
disable-model-invocation: true
allowed-tools: Read, Glob, Grep
model: haiku
---

# /help — catálogo dos 26 workflows

Se `$ARGUMENTS` é vazio, mostre PRIMEIRO a árvore de decisão abaixo, DEPOIS o catálogo. Se `$ARGUMENTS` é um código (ex: `BG`), mostre só detalhes do workflow correspondente (pule a árvore).

## Árvore de decisão (responda mentalmente)

```
Você tem um pedido. Que tipo de pedido é?

  ┌─ É algo que NÃO funciona como deveria?
  │     → /bug        (REGRA #0 — investiga antes de mexer)
  │
  ├─ É algo NOVO que precisa ser construído?
  │   │
  │   ├─ É projeto que ainda nem começou?
  │   │     → /inicio
  │   │
  │   ├─ Vai adotar no projeto que já existe?
  │   │     → /brownfield
  │   │
  │   ├─ É mudança pequena (1 label, 1 texto, ≤3 arquivos)?
  │   │     → /quick-dev
  │   │
  │   ├─ É uma funcionalidade comum (cabe em ~1 semana)?
  │   │     → /feature
  │   │
  │   └─ É iniciativa grande (várias semanas, muita gente)?
  │         → /prd → /epico → /feature (uma story de cada vez)
  │
  ├─ É EMERGÊNCIA em produção (cliente parado AGORA)?
  │     → /hotfix
  │
  ├─ Quer ENTENDER o que está acontecendo?
  │   │
  │   ├─ Não entendi a última resposta técnica  → /explicar-para-cliente
  │   ├─ Como está o projeto, o que falta       → /status
  │   ├─ Vale a pena subir pra produção?        → /checkpoint
  │   └─ Quero ver TUDO que dá pra fazer        → /help (este)
  │
  └─ Quer CONFERIR a saúde do código?
        → /auditoria      (3 auditores em paralelo)
        → /consistencia   (doc bate com o código?)
```

**Regra simples:** se não souber, use `/clarificar` — o agente te ajuda a descobrir qual comando se encaixa.

## Catálogo

| Comando | Pra quê (resultado) | Quando usar (gatilho) |
|---|---|---|
| `/inicio` | Define escopo + escolhe tecnologia + monta esqueleto rodando | Projeto novo do zero |
| `/brownfield` | Adapta o framework ao código que já existe | Adotar em projeto legado |
| `/prd` | Gera documento de produto completo (PRD) | Iniciativa grande (várias semanas) |
| `/epico` | Quebra a iniciativa em user stories filhas | Decompor PRD em pedaços executáveis |
| `/historia` | Cria 1 user story em arquivo rastreável | Criar 1 história isolada |
| `/clarificar` | Fixa critérios de aceitação e o que NÃO entra | Ideia ainda vaga antes de codar |
| `/feature` | Implementa 1 user story com revisão + 3 auditores | Funcionalidade nova (ciclo completo) |
| `/quick-dev` | Aplica mudança trivial sem investigador nem auditores | Trocar 1 label, ≤3 arquivos, ≤50 linhas |
| `/bug` | Investiga estado real (banco, log, payload) antes de corrigir | Algo não funciona como deveria — REGRA #0 |
| `/hotfix` | Caminho rápido pra apagar incêndio em produção | Cliente parado, SEFAZ fora do ar, Pix duplicado |
| `/incident-postmortem` | Gera timeline, ANPD/LGPD-006 se houver vazamento, ação corretiva | Após hotfix, em até 48h |
| `/refactor` | Reorganiza código sem mudar o que o cliente vê | Limpar dívida técnica |
| `/qa` | Gera ou audita testes de uma área | Reforçar cobertura de testes |
| `/auditoria` | Roda 3 auditores em paralelo (segurança, qualidade, produto) | Antes de fechar release |
| `/auditoria-reversa` | Diagnóstico read-only de um repo legado | Entender código que herdou |
| `/consistencia` | Compara documento com código pra achar órfãos | Doc bate com o código? |
| `/explicar-para-cliente` | Traduz último output técnico pra linguagem leiga | Não entendi a resposta anterior |
| `/retro` | Retrospectiva 4L (Liked, Learned, Lacked, Longed for) | Final de marco/sprint |
| `/replanejar` | Atualiza o escopo registrado quando muda no meio | Cliente mudou de ideia, mudança de prioridade |
| `/sprint` | Sequencia as próximas N user stories em ordem | Planejar a semana |
| `/status` | "Como tá indo?" em PT-BR sem jargão | Saber estado do projeto |
| `/checkpoint` | Walkthrough antes de mergear branch | Antes de subir pra produção |
| `/release` | Fecha marco: versão, CHANGELOG, tag | Quando tá pronto pra publicar |
| `/readiness` | Confere se o pacote tá pronto pra começar (sinal verde) | Antes do `/feature` no épico |
| `/help` | Este comando — catálogo dos workflows | Não sei o que rodar |
| `/shard` | Fatia PRD/ARQ longo em pedaços menores | Documento ficou grande demais |

> Detalhe de cada agente envolvido: `.claude/agents/MAPA-VISUAL.md` ou `.claude/agents/<nome>.md`.

## Skills disponíveis (atalhos práticos)

Skills são utilidades curtas que validam ou geram dado brasileiro. Use chamando `Skill <nome>` ou via comando que invoca automaticamente.

| Skill | Pra quê |
|---|---|
| `validar-cpf-cnpj` | Confere se CPF/CNPJ tá matematicamente válido (suporta CNPJ alfanumérico jul/2026) |
| `validar-cep` | Confere CEP + opcionalmente consulta ViaCEP |
| `validar-ie` | Confere Inscrição Estadual por UF |
| `validar-pix` | Confere chave Pix (CPF, CNPJ, email, telefone, aleatória) |
| `validar-boleto` | Confere linha digitável de boleto (módulo 10/11) |
| `validar-chave-acesso-nfe` | Confere chave de acesso de NF-e/NFC-e/CT-e (44 dígitos) |
| `validar-codigo-municipio-ibge` | Confere código IBGE de município |
| `gerar-br-code` | Gera QR Code Pix padrão EMV (estático ou dinâmico) |
| `gerar-test-fixture-br` | Gera CPF/CNPJ/CEP/telefone sintéticos válidos pra fixtures de teste |
| `gerar-adr-pt-br` | Cria ADR (decisão arquitetural) no template PT-BR |
| `traduzir-jargao` | Traduz texto técnico pra linguagem de não-programador |
| `checklist-lgpd` | Aplica checklist LGPD a uma feature ou fluxo |
| `brainstormar-ideia` | Menu de 15 técnicas de brainstorming (Seis Chapéus, SCAMPER, etc.) |

## Addons disponíveis (pacotes de domínio)

Addons adicionam agentes/hooks/skills específicos de um setor. Instala com `npx roldao-method add <nome>`.

| Addon | Pra quê |
|---|---|
| `fintech-br` | Pix, Open Finance, idempotência de cobrança, EndToEndId |
| `fiscal-br-completo` | NF-e/NFS-e completo, SEFAZ, contingência SVC/EPEC, Reforma Tributária |
| `esocial-completo` | eSocial S-1000 a S-3000, REINF |
| `electron-br` | Apps Electron com migrations SQLite e IPC handler |
| `lgpd-compliance` | RIPD, base legal Art. 7/11, DPO, canal do titular |
| `varejo-pdv-br` | PDV físico (SAT-CF-e, cupom, terminal) |
| `healthtech-br` *(beta)* | Prontuário eletrônico, CFM, LGPD dado sensível saúde |

Lista atualizada: `npx roldao-method search`.

## Cenários comuns

### Não sei por onde começar
1. **Projeto novo:** `/inicio`
2. **Adotar em legado:** `/brownfield`

### Ideia ainda vaga, não sei o escopo
1. `/clarificar <ideia>` → tira ambiguidade, fixa AC e non-goals
2. `/historia` ou `/prd` (conforme o tamanho)

### Acabei de fazer brief, quero virar produto
1. `/clarificar <iniciativa>` → afina antes de formalizar
2. `/prd <iniciativa>` → gera PRD
3. `/epico` → quebra em stories
4. `/readiness <EP-NNN>` → confere se tá pronto
5. `/sprint <EP-NNN>` → sequencia
6. `/feature <US-NNN>` (primeira story)

### Bug em produção
1. `/bug <descrição do bug>` → REGRA #0 dispara investigador
2. (não pula etapas, não chuta solução)

### Mudança trivial (ex: trocar label)
- `/quick-dev <descrição>` — sem investigador, sem 3 auditores. Use APENAS se ≤3 arquivos e ≤50 linhas.

### Subir pra produção
1. `/consistencia` → confere se doc e código batem (acha órfãos)
2. `/checkpoint <branch>` → walkthrough → `/release` quando aprovado
3. Se aprovado, mergear
4. `/retro` ao fim do marco

## Se `$ARGUMENTS` é um código

Mostre detalhe do comando correspondente:
- Nome
- Para quando
- Que agentes invoca
- Que artefatos gera
- Tempo médio esperado
- Comando relacionado a rodar antes/depois

Exemplo: `/help BG` mostra detalhe completo de `/bug`.

## Se `$ARGUMENTS` é uma frase em PT-BR (busca)

Quando o usuário digita uma frase ("preciso reportar bug", "quero criar nota fiscal"), invoque o subcomando CLI de busca fuzzy:

```bash
npx roldao-method search "<frase>"
```

A busca cobre **comandos slash + skills + addons** em paralelo. Casa por palavras-chave (ignora artigos e verbos genéricos como "preciso", "quero", "como"). Reporte os 3 melhores resultados em PT-BR e sugira o comando que mais se aproxima.

Exemplos:
- `"preciso reportar bug"` → `/bug` (REGRA #0)
- `"valida cpf"` → skill `validar-cpf-cnpj`
- `"emissão de Pix"` → addon `fintech-br`

## Importante

- Este help cobre só os 26 workflows ROLDAO-METHOD (slash commands do framework). Comandos nativos do Claude Code (`/clear`, `/config`, etc.) ficam fora.
- **Códigos curtos** servem pra falar rápido ("vamos rodar BG agora"), não substituem o comando completo.
