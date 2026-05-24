---
owner: tech-lead
revisado-em: 2026-05-24
status: stable
---

# ADR-018 — Python 3.10+ é requisito real (não opcional) pra 9 skills BR

## Contexto

[ADR-001](ADR-001-zero-runtime-dependencies.md) prometeu "zero dependência runtime" — só Node 18+. Mas auditoria 10-agentes (2026-05-24) descobriu que 9 skills do framework dependem de Python 3 instalado localmente:

- `validar-cpf-cnpj` (com CNPJ alfanumérico jul/2026 — FISCAL-005)
- `validar-chave-acesso-nfe` (44 dígitos, módulo 11)
- `validar-codigo-municipio-ibge` (7 dígitos + DV módulo 10)
- `validar-cep`
- `validar-ie` (27 algoritmos por UF)
- `validar-pix` (chave + EndToEndId + TxId)
- `validar-boleto` (FEBRABAN módulo 10/11)
- `gerar-br-code` (Pix EMV)
- `gerar-test-fixture-br` (CPF/CNPJ válidos por algoritmo)

Promessa do README contradiz a realidade: usuário Windows sem Python instalado vê skill falhar com `python: command not found` e não entende por quê.

## Decisão

**Python 3.10+ vira requisito declarado e visível** pra rodar essas 9 skills. Sem Python local:

1. A skill falha com mensagem clara em PT-BR: "esta skill precisa de Python 3.10+. Instale ou use a versão Node correspondente."
2. O agente IA continua funcionando (não é hook bloqueador).
3. `bin/install.js doctor` detecta ausência e avisa, mas não impede instalação.
4. README declara explicitamente na seção "Requisitos".

### Por que não portar pra Node

- Skill é executada localmente pelo dev, não dentro do agent. Python tem `re` mais previsível pra algoritmos fiscais (DV, módulo 11) escritos em código procedural.
- 9 skills × ~200 linhas = ~1800 linhas de port. Risco alto de quebrar paridade de bit (FISCAL-005 CNPJ alfanumérico exige aritmética cuidadosa).
- Mantenedores BR de Python são mais comuns que de Node em projetos fiscais.

### Por que não dispensar Python pro usuário

- Mock de validação fiscal (FISCAL-005) é proibido em fixture real (TST-004). Sem skill local, dev não consegue gerar CPF/CNPJ válido pra teste.
- Validação em CI não substitui validação local — feedback de 5 minutos vs 5 segundos.

### Plano de futuro (não decidido aqui)

Portar **caso a caso** pra Node quando uma skill virar gargalo concreto. Sem prazo fixo. Cada port = ADR próprio (com paridade testada).

## Consequências

- README perde a frase "zero deps runtime" como diferencial absoluto — vira "zero deps Node-only, Python 3.10+ opcional pra 9 skills BR".
- Usuários Linux/macOS já têm Python — impacto baixo.
- Usuários Windows puro (público-alvo da v1.0) precisam de uma instalação a mais. Aceitável: Python no Windows é `winget install Python.Python.3.10`.
- ADR-001 fica parcialmente revogado nesta dimensão (não há quebra de promessa silenciosa).

## Non-goals (INV-003)

- Não vamos versionar Python (3.10+ é piso, não pin).
- Não vamos suportar Python 2 — fim de vida desde 2020.
- Não vamos exigir libs Python externas (`requests`, `cryptography`) — só stdlib.
- Não vamos rodar `pip install` no `install.js`.

## Alternativas consideradas

- **Portar tudo pra Node agora** — rejeitada por escopo (1800 linhas) e risco fiscal (FISCAL-005 alfanumérico recém-implementado).
- **WASM / Pyodide bundled** — rejeitada por peso (>10MB) e divergência da promessa "zero deps".
- **Manter "opcional" silencioso** — rejeitada pela auditoria. Esconde requisito de quem precisa.

## Aderente a

INV-001, INV-002, INV-003, INV-AGENT-004 (verificar antes de afirmar), FISCAL-005.

## Revoga / atualiza

[ADR-001](ADR-001-zero-runtime-dependencies.md) — parcialmente. Node continua zero deps; Python entra como requisito declarado pra subset de skills.
