---
tipo: checklist-release
projeto: <nome-do-projeto>
versao: <numero ou data>
tier: <2-4>
data: <AAAA-MM-DD>
---

# Checklist de subida — <projeto> <versão>

> Usar SEMPRE que a mudança vai pro servidor/máquina que o cliente usa.
> Tier 4 (regulado/metrologia/LGPD sensível): humano aprova ANTES de executar a subida.

## Antes de subir
- [ ] Todos os testes passando (evidência anexada: `evidencia-<tarefa>.md`)
- [ ] Mudança na estrutura dos dados salvos? Se sim: compatível com dados existentes + testada em cópia real/mascarada
- [ ] **Backup feito e VERIFICADO** (abriu o backup e conferiu que tem conteúdo — backup não testado = não existe)
- [ ] Plano de volta escrito: se der errado, o passo a passo pra voltar em < 15 min
- [ ] Cliente precisa ser avisado? (mudança visível, indisponibilidade, treino) → avisado em: <data>
- [ ] Horário de menor uso escolhido (quando indisponibilidade for possível)

## Subida
- [ ] Executada por: <agente/humano> em <data/hora>
- [ ] Comandos/passos registrados: <lista ou link do runbook>

## Logo depois de subir (primeiros 15 minutos)
- [ ] Aplicação abre e loga
- [ ] Fluxo crítico nº 1 funciona: <ex: emitir certificado>
- [ ] Fluxo crítico nº 2 funciona: <ex: lançamento financeiro>
- [ ] Nenhum erro novo nos logs
- [ ] Backup automático continua agendado e funcionando

## Se algo falhou
- [ ] Executar plano de volta IMEDIATAMENTE (não "tentar consertar quente" em produção, salvo correção óbvia de 1 linha)
- [ ] Registrar o incidente → vira `bug-vira-teste` + ajuste deste checklist

## Encerramento
- [ ] Cliente vê diferença? O quê: <resumo em 1 frase>
- [ ] Versão/tag registrada no repositório
