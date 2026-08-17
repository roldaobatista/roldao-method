---
owner: roldao
revisado-em: 2026-05-27
status: stable
origem: conversas com devs solo brasileiros + uso pessoal do autor
proximo: spec.md
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

# Problema — @conciliab/csv-parser

## A dor

Desenvolvedores brasileiros que precisam **conciliar extratos bancários** dentro de aplicações próprias (ERPs pequenos, ferramentas de freelancer, dashboards financeiros pessoais) gastam de 2 a 5 dias por banco para escrever e estabilizar um parser de extrato — e o pior, **continuam gastando** sempre que o banco troca pequenos detalhes (vírgula vs ponto decimal, codificação `windows-1252` vs `utf-8`, novo campo no CNAB240, fuso horário implícito no OFX).

EE-001 (Entrevista Externa — conversa com Renato S., dev solo de ferramenta de freelancer em SP, em 2025-12-18): "Levei uma semana inteira pra fazer o parser do Itaú funcionar com o do Bradesco. Aí o Inter mudou o formato e eu desisti de incluir." A dor é dupla: **custo de implementação inicial** + **custo de manutenção quando o banco muda silenciosamente**.

EE-002 (Conversa Slack com Mariana A., dev de ERP de microempresa, 2026-01-05): "Eu pago uma API SaaS de R$ 89/mês só pra parser de extrato. Pra uma feature secundária. Sangra."

EE-003 (Issue #3 no repo, primeiro contribuidor externo, 2026-02-10): "Achei o pacote procurando algo que não fosse o `node-ofx-parser` (abandonado em 2019). Faltava algo que cobrisse CNAB240 também."

O autor (Roldão) sofre a mesma dor no app desktop `conciliab-desktop`, que motivou extrair esta lib.

## Quem sente

- **Dev solo** (Renato, Mariana, dezenas como eles): constrói ferramentas pequenas, não pode pagar API SaaS por feature acessória. Conhece TypeScript ou JavaScript. Não quer manter parser de extrato — quer **importar uma lib e seguir**.
- **Time pequeno de produto financeiro** (2-5 devs): tem orçamento, mas detesta dependência de fornecedor SaaS para algo que poderia ser local. Procura lib OSS confiável.
- **Mantenedor do `conciliab-desktop`** (Roldão): primeiro consumidor; usa a lib internamente, dogfooding garante qualidade.

Note: o **comprador** e o **usuário** são a mesma pessoa (o dev que `npm install`a). Sem distinção persona-comprador.

## Quanto custa hoje

- **Em tempo:** 16-40 horas por banco para o primeiro parser. ~2-4h/mês por banco em manutenção quando o banco muda.
- **Em dinheiro:** APIs SaaS de parsing (alternativas pagas) cobram R$ 50 a R$ 200/mês por instância, sendo que devs solo precisam de feature acessória, não de produto.
- **Em risco:** parser custom mal testado produz erro de centavos silencioso na conciliação → financeiro errado no produto do consumidor → cliente irritado, churn.

## Por que solução existente não resolve

- **`node-ofx-parser`** (npm): abandonado em 2019, não suporta OFX 2.x XML-based, sem types TS, sem CJS.
- **`ofx-js`** (npm): suporta só OFX 1.x SGML, sem CNAB240, sem CSV genérico; última release há 2 anos.
- **APIs SaaS (Pluggy, Belvy)**: pagas mensal, vendor-lock, exige internet, LGPD passa pra fornecedor (que recusa em alguns casos).
- **Parser custom in-house**: o status quo — caro, frágil, sem testes.
- **`papaparse`** (npm): só CSV genérico, não normaliza para estrutura de transação bancária, não conhece formatos brasileiros.

## Validações pendentes

- Hipótese (a validar): "devs aceitam função pura — vão ler o arquivo eles mesmos antes de chamar a lib". Confirmado parcialmente em EE-001 (Renato disse "preferi assim mesmo, fica explícito de onde veio o arquivo") e EE-003 (issue não pediu API com FS). Mover pra `hipoteses-validadas.md` quando passar de 5 confirmações.
- Hipótese (a validar): "demanda real por Deno/Bun além de Node". Movida para `hipoteses-a-validar.md` — ADR-0004 decidiu suportar **por baixo custo**, não por demanda comprovada.

---
> Termos técnicos do fluxo OSS: ver `CONTRIBUTING.md §0`.
