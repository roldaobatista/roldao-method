---
owner: roldao
revisado-em: 2026-05-27
status: stable
origem: auto-observação (dono é o usuário-piloto)
proximo: spec.md (informal — vive nas Issues do GitHub e no README)
idioma: pt-BR
limite-linhas: 100
proposito: exemplo preenchido do meta-template para referência e comparação
---

<!--
arquivo: docs/descoberta/problema.md do projeto-exemplo tempo-cli.
contexto: projeto solo. "Entrevista externa" é o próprio dono observando a dor própria.
-->

# Problema — tempo-cli

## A dor

Trabalhar em várias tarefas pequenas durante o dia (consertar bug A, responder cliente B, refatorar módulo C, almoço, código D) sem ter ideia objetiva de onde o tempo foi parar. No fim do dia, a sensação é "trabalhei o dia todo" mas faltam horas no relatório semanal. No fim do mês, na hora de cobrar cliente por hora, a memória é traiçoeira — chuto "umas 5 horas" e provavelmente erro pra menos.

As alternativas existentes ou são pesadas demais (Toggl, Harvest — exigem conta, cliente web, login, sincronização), ou são leves demais (timer no celular — não registra histórico, não gera relatório).

O atrito ideal seria: estou no terminal mesmo, digito `tempo start "ajustar PDF do cliente X"` em 2 segundos, esqueço, e quando vou pegar café ou trocar de tarefa digito `tempo stop`. No fim do dia, `tempo report --hoje` me mostra onde foi o tempo. Sem login, sem cloud, sem cliente web.

EE-001 (Entrevista Externa = auto-observação documentada): o dono (Roldão) está há ~8 meses tentando registrar tempo com Toggl, mas abandonou 4 vezes — cada vez a fricção do "abrir a aba do Toggl, garantir que está logado, escrever o nome do projeto" vence a vontade de registrar. Solução atual: caderno físico, mas o relatório semanal mostra que ~30% das entradas estão faltando.

## Quem sente

- **Desenvolvedor solo trabalhando no terminal o dia todo** (persona principal): vive em tmux/terminal, tem fricção zero pra digitar um comando, fricção infinita pra trocar de janela.
- **Consultor freelancer que cobra por hora** (persona secundária, mesmo perfil técnico): precisa de relatório por cliente/projeto pra cobrar honestamente, mas não quer pagar Toggl ($10/mês) por algo simples.
- **Não persona:** equipe corporativa com relatório centralizado, RH com timesheet, qualquer cenário que exija sincronização entre múltiplas pessoas — esses ficam com Toggl/Harvest/Clockify.

## Quanto custa hoje

- **Custo em tempo:** ~20 min/semana reconstruindo o que foi feito a partir de commits e mensagens do Slack pra fechar relatório. ~80 min/mês em "pensar no que esqueci de registrar".
- **Custo em dinheiro:** $10/mês de Toggl que paguei sem usar = $120 ao ano jogados fora.
- **Custo em risco:** ~30% de subfaturamento estimado no relatório do cliente atual (5 horas reportadas vs ~7h reais por tarefa típica). Em 1 ano, isso é ~R$ 15.000 a menos no faturamento.

## Por que solução existente não resolve

- **Toggl / Harvest / Clockify:** exigem conta, web/app, sincronização. Atrito alto, abandono em ~3 semanas. Pagos.
- **Timer do celular:** sem histórico estruturado, sem relatório por tag, sem export.
- **Caderno físico:** funciona enquanto dura a disciplina (não dura), e o relatório no fim do mês é trabalho manual.
- **Planilha Excel:** ainda mais atrito que Toggl — abrir Excel, achar a aba certa, formatar célula. Inviável.
- **`bash` + `date` + arquivo CSV manual:** tentei. O parser de CSV vira frankenstein, o relatório vira `awk` ilegível, e migração de schema (adicionar coluna "cliente") é dor.

## Validações pendentes

- **Hipótese H-001:** outro dev na mesma situação (consultor freelance terminal-first) adotaria o CLI se existisse? Validar publicando v0.1 em Rust user forum e contando downloads + estrelas em 30 dias. Critério de validação: ≥50 estrelas e ≥10 downloads únicos no primeiro mês.
- **Hipótese H-002:** a fricção do "lembrar de digitar `tempo stop`" vai matar o produto também? Validar com auto-uso por 30 dias antes de publicar. Critério: ≥70% das sessões registradas têm `stop_at` preenchido (não foram fechadas pela manhã seguinte com timestamp "esqueci").

---

> Termos técnicos: glossário deste projeto é minimal — ver tabela 2.A da [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md). Domínio é trivial.
