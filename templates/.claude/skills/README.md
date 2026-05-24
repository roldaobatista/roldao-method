---
owner: framework
revisado-em: 2026-05-23
status: stable
---

# Skills BR do core — ROLDAO-METHOD

13 skills brasileiras carregadas com o framework. Cada skill tem `SKILL.md` com `description`/TRIGGER claro; algumas têm script Python (stdlib, zero dependência) em `scripts/`.

## Catálogo

| Skill | Tipo | Trigger principal |
|---|---|---|
| [`brainstormar-ideia`](brainstormar-ideia/SKILL.md) | prompt | "Ajuda a expandir/refinar uma ideia" — menu de 15 técnicas |
| [`checklist-lgpd`](checklist-lgpd/SKILL.md) | prompt | Antes de implementar coleta/uso de dado pessoal — árvore Art. 7/11 |
| [`gerar-adr-pt-br`](gerar-adr-pt-br/SKILL.md) | prompt | Ao tomar decisão arquitetural não-trivial — template ADR |
| [`gerar-br-code`](gerar-br-code/SKILL.md) | Python | Implementar QR Code Pix (BR Code EMV) — estático ou dinâmico |
| [`gerar-test-fixture-br`](gerar-test-fixture-br/SKILL.md) | Python | Gerar CPF/CNPJ/CEP/telefone sintético válido pra fixtures |
| [`traduzir-jargao`](traduzir-jargao/SKILL.md) | prompt | Antes de mostrar texto técnico a usuário não-programador |
| [`validar-boleto`](validar-boleto/SKILL.md) | Python | Validar código de barras / linha digitável (FEBRABAN + arrecadação) |
| [`validar-cep`](validar-cep/SKILL.md) | Python | Validar CEP (formato + opcional consulta ViaCEP) |
| [`validar-chave-acesso-nfe`](validar-chave-acesso-nfe/SKILL.md) | Python | Validar chave NF-e/NFC-e/CT-e/MDF-e/SAT (44 dígitos, módulo 11) |
| [`validar-codigo-municipio-ibge`](validar-codigo-municipio-ibge/SKILL.md) | Python | Validar código IBGE de município (7 dígitos, DV módulo 10) |
| [`validar-cpf-cnpj`](validar-cpf-cnpj/SKILL.md) | Python | Validar CPF e CNPJ (numérico + alfanumérico pós-jul/2026) |
| [`validar-ie`](validar-ie/SKILL.md) | Python | Validar Inscrição Estadual (DV por UF) |
| [`validar-pix`](validar-pix/SKILL.md) | Python | Validar chave Pix + identificadores (EndToEndId, TxId) |

## Como criar uma skill nova

Ver [`docs/EXTENDENDO/skill.md`](../../docs/EXTENDENDO/skill.md). Regra de 3: só crie skill quando o padrão se repetir 3 vezes.

## Convenção: tipo

- **Python** — skill com algoritmo (validação, geração). Script em `scripts/<nome>.py`, stdlib only.
- **prompt** — skill que orienta o LLM (checklist, template, menu de técnicas). Sem script; tudo no `SKILL.md`.

## Addons trazem skills adicionais

Addons como `fintech-br`, `lgpd-compliance`, `electron-br` instalam skills extras (ex: `validar-webhook-pix`, `gerar-ripd`, `resposta-titular`, `kill-electron-dev`). Veja `npx roldao-method search` pra catálogo.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
