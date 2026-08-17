---
owner: roldao
revisado-em: 2026-05-27
status: stable
idioma: pt-BR
limite-linhas: 80
proposito: índice didático dos exemplos preenchidos do meta-template — mostra como o método se materializa em três arquétipos diferentes
---

# Exemplos — índice navegável

Cada pasta aqui dentro é um **snapshot didático** de um projeto fictício preenchido até o ponto em que o time já estaria "pronto pra codar". Servem de modelo concreto pra quando você (ou o agente IA) precisar decidir "como ficaria o método aplicado em um projeto do tipo X?".

Não são produtos reais, não rodam. São referência — para ler, copiar trechos, comparar com o seu projeto novo.

## Os três arquétipos

| Pasta | Tipo arquetípico | Camadas materializadas | Quando usar como modelo |
|---|---|---|---|
| [`cli-rust-solo/`](./cli-rust-solo/) | CLI desktop, 1 dev, código aberto | C0 a C4 enxuto (sem C5 fase formal, sem C6 LGPD, sem C7 catálogo grande, sem C8 operação 24/7, sem C12 governança comunitária) | Ferramenta de terminal pessoal/aberta, sem servidor, sem cliente pagante, sem dado de terceiros |
| [`lib-typescript/`](./lib-typescript/) | Biblioteca npm pura, código aberto, função pura | C0 a C4 + C9 harness IA + C12 mínimo (mantenedor solo) — sem C6 LGPD (lib não trata dado pessoal), sem C8 operação (não é serviço hospedado) | Biblioteca publicada em registro público (npm, crates.io, PyPI) sem persistência nem rede própria |
| [`saas-python-regulado/`](./saas-python-regulado/) | SaaS B2B multi-tenant, time pequeno, regulado por LGPD | C0 a C12 completo — todas as camadas materializadas, incluindo ROPA, runbooks, SLO, on-call, threat-model, auditores customizados | Produto pago, dado de pessoa física, time de 2+ devs, cliente esperando uptime |

## Como usar

1. Identifique o arquétipo mais próximo do seu projeto novo (use a árvore do §15 do `ESTRUTURA-PROJETO-NOVO-DO-ZERO.md`).
2. Abra o `README-EXEMPLO.md` da pasta correspondente — explica as decisões de preenchimento.
3. Compare estrutura, profundidade dos documentos e listagem em `nao-aplica.md` com o que o seu projeto precisa.
4. Copie trechos como ponto de partida — nunca como verdade absoluta. Cada projeto tem contexto próprio.

> Cada pasta é um snapshot do estado final após rodar `bootstrap.sh` + descoberta + `bootstrap-fase-2.sh` para aquele arquétipo.
