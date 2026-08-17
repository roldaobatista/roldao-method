---
owner: roldao
revisado-em: 2026-08-17
status: stable
idioma: pt-BR
proposito: Método operacional da Fábrica — do pedido ao aprendizado, tarefa a tarefa, em projeto existente.
---

# FÁBRICA — Operação diária de software com IA

> Origem: destilado do "Blueprint Universal — Fábrica Autônoma de Software v1.0" (ago/2026),
> adaptado à escala de uma operação de 1 dono de produto + agentes IA.
> O que era infraestrutura de empresa grande virou **método + templates**.
> O motor de execução é o harness de IA (Claude Code ou equivalente); esta pasta é o roteiro.

## Onde a Fábrica se encaixa (produto único, 3 camadas)

| Camada | Pasta | Quando entra em ação |
|---|---|---|
| **Guarda-corpos** | raiz deste repositório (`npx roldao-method`) | Sempre — hooks que barram comando destrutivo, senha vazada, CPF inválido, mascaramento |
| **Nascimento** | `metodo/` | Projeto NOVO, do zero — estrutura documental completa antes da primeira linha de código |
| **Operação (esta)** | `fabrica/` | Projeto EXISTENTE, dia a dia — cada pedido de mudança segue o Caminho Padrão abaixo |

## Princípios (não negociáveis)

1. **Evidência > confiança.** Nada é "pronto" sem comando rodado e resultado mostrado.
2. **Investigar antes de mexer.** Ler o estado real (banco, log, payload) antes de editar código.
3. **Causa raiz, nunca sintoma.** Consertar onde o dado nasce errado, não onde ele aparece errado.
4. **Menor mudança que resolve.** Refactor amplo é mudança separada, nunca carona.
5. **Todo bug vira teste.** Bug corrigido sem teste de regressão é dívida (template `bug-vira-teste`).
6. **Aprovação proporcional ao risco.** Ver tabela de tiers abaixo.

## Tiers de risco (decidem quanta cerimônia cada tarefa merece)

| Tier | Exemplos concretos | Autonomia do agente | Templates obrigatórios |
|---|---|---|---|
| **0 — Experimento** | protótipo, estudo, ferramenta descartável | total; sem produção | nenhum |
| **1 — Interno** | script auxiliar, relatório interno, ajuste de doc | executa e reporta | `tarefa` |
| **2 — Padrão** | tela/fluxo comum do app em produção | executa, valida, reporta com evidência | `tarefa` + `evidencia` |
| **3 — Alto** | financeiro, fiscal, dados de cliente, migração de banco | igual ao 2 + `checklist-release` antes de subir; rollback ensaiado | `especificacao-executavel` + `tarefa` + `evidencia` + `checklist-release` |
| **4 — Regulado** | metrologia legal (Inmetro), certificados, LGPD sensível | agente prepara, HUMANO aprova a subida | todos + aprovação explícita do dono |

Regra prática: **na dúvida entre dois tiers, use o maior.**

## Via rápida — cerimônia NUNCA pode custar mais que a tarefa

A Fábrica preza pela agilidade: **uma correção de meia hora continua levando meia hora.**
A cerimônia é proporcional ao risco E ao tamanho:

- **Correção pequena (até ~1h, tier ≤ 2, sem mudança em dados salvos/contratos):**
  executa direto no microciclo. A evidência é o relatório da conversa + teste rodado —
  não precisa preencher template nenhum. Se era bug, só o registro `bug-vira-teste`
  (5 minutos) é obrigatório, porque é ele que impede o bug de voltar.
- **Regra dos 10%:** se preencher template está tomando mais de ~10% do tempo da tarefa,
  corta-se o template, nunca a verificação (teste continua obrigatório).
- **O que NUNCA se corta, mesmo na via rápida:** rodar os testes antes de dizer "pronto"
  e investigar a causa raiz antes de mexer.
- Templates completos são pra quando o custo do erro é maior que o custo do papel:
  tier 3-4, mudança de estrutura de dados, ou funcionalidade nova com regra de negócio.

Sinal de degeneração: se o método estiver deixando as entregas mais lentas sem ter
evitado nenhum erro, o problema é o método — ajustar a régua, não abandonar a verificação.

## Caminho Padrão (do pedido ao aprendizado)

Toda mudança percorre estas 6 etapas. Em tier 0-1 as etapas 2 e 5 podem ser mentais;
de tier 2 pra cima, viram arquivo.

1. **Pedido → entendimento.** O que muda, pra quem, qual o efeito visível, qual tier de risco.
   Ambiguidade real (2 leituras que levam a trabalhos diferentes) = 1 rodada de perguntas ANTES de começar.
2. **Especificação executável** (tier 3+, ou tier 2 quando a regra de negócio é nova).
   Exemplos concretos DADO/QUANDO/ENTÃO que viram testes ANTES do código.
   → `templates/especificacao-executavel.template.md`
3. **Tarefa fechada.** Objetivo verificável, arquivos permitidos e proibidos, testes exigidos,
   critério de pronto. → `templates/tarefa.template.md`
4. **Implementação em microciclo.** Entender → alterar pouco → compilar → testar → integrar.
   Nunca acumular horas de mudança sem verificar se a base ainda funciona.
5. **Evidência + release.** O que rodou, o que passou, risco residual.
   → `templates/evidencia.template.md`. Se vai pro servidor do cliente:
   → `templates/checklist-release.template.md`.
6. **Aprendizado.** Bug encontrado no caminho vira teste de regressão registrado
   (→ `templates/bug-vira-teste.template.md`). Lição generalizável vira regra no
   CLAUDE.md/AGENTS.md do projeto. Texto solto em resumo de conversa é o último recurso.

## O que a Fábrica nunca faz

- Subir pro servidor do cliente direto da resposta de um agente, sem checklist de release (tier 2+).
- Marcar tarefa como pronta com teste falhando "por outro motivo".
- Mascarar verificação pra ficar verde (skip, assertion relaxada, regra desligada).
- Migração de banco irreversível sem backup + plano de volta testado.
- Usar vários agentes em paralelo escrevendo nos mesmos arquivos.

---
> Termos técnicos: ver `metodo/GLOSSARIO-ROLDAO.md`.
