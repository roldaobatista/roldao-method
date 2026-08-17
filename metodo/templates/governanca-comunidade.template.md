---
template: governanca-comunidade.template.md
destino: docs/comunidade/governanca.md
owner: <owner-do-projeto>
revisado-em: <YYYY-MM-DD>
status: draft
proposito: definir papeis, processo de decisao e regras de convivencia da comunidade
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §C12
idioma: pt-BR
limite-linhas: 200
---

<!--
Documento publico que define COMO a comunidade do projeto opera. Vale
para projetos com colaboracao externa significativa (open-source,
consorcio, multi-empresa). Para projeto interno de uma so empresa,
use uma versao reduzida ou nem precisa deste template.

Referencias canonicas:
- Apache Software Foundation governance model.
- ASF "lazy consensus" e voting rules.
- TC39 process (RFC -> stage 0..4).
-->

# Governanca da Comunidade — <nome-do-projeto>

## 1. Principios

- <principio 1 — ex: meritocracia: voz proporcional a contribuicao demonstrada>
- <principio 2 — ex: transparencia: decisoes em canal publico>
- <principio 3 — ex: code of conduct sempre vence regra tecnica>
- <principio 4 — ex: bias-to-action: lazy consensus por padrao>

## 2. Papeis

### 2.1 User
- Quem usa o projeto.
- Pode: abrir issue, comentar discussao, propor RFC, sugerir feature.
- NAO pode: aprovar PR, fechar issue de outro, alterar codigo direto.

### 2.2 Contributor
- Teve pelo menos <N> contribuicoes (PR, doc, bug report util) aceitas.
- Pode: tudo de User + ser citado em release notes + acesso a canal interno de discussao.
- NAO pode: aprovar PR, fazer merge.

### 2.3 Committer
- Tem permissao de escrita no repositorio.
- Pode: tudo de Contributor + revisar e aprovar PRs + fazer merge em areas designadas + triagem de issues.
- NAO pode: alterar governanca, adicionar novo committer, fazer release publica.

### 2.4 Maintainer
- Responsavel por uma area/modulo do projeto.
- Pode: tudo de Committer + decidir direcao de sua area + nomear novos committers da sua area (com aprovacao do comite) + fazer release.
- NAO pode: decidir sozinho mudancas que afetam multiplas areas.

### 2.5 Owner / Comite de governanca
- Conjunto de <N> maintainers seniors (ou pessoa fisica/juridica titular do projeto).
- Pode: tudo + alterar governanca + remover papeis + decidir empates + representar o projeto externamente.

## 3. Criterio de promocao entre papeis

| de | para | requisitos | quem decide |
| --- | --- | --- | --- |
| User | Contributor | <N> contribuicoes aceitas em <janela de tempo> | qualquer Committer reconhece |
| Contributor | Committer | <N> PRs aceitos + <M> meses de atividade + indicacao por Committer existente | votacao entre Committers (consenso) |
| Committer | Maintainer | demonstrou ownership em area especifica + indicacao por Maintainer existente | comite de governanca (maioria simples) |
| Maintainer | Owner | criterio definido caso a caso | comite atual + supermaioria (2/3) |

## 4. Processo de decisao

### 4.1 Lazy consensus (padrao)
- Proposta publicada em canal publico (PR, issue, RFC).
- Janela de objecao: <N dias> (sugestao: 72h para PR rotineiro, 7 dias para RFC).
- Sem objecao fundamentada na janela = aprovado.
- Qualquer Committer pode levantar objecao; objecao move o item para "formal vote".

### 4.2 Formal vote
- Acionado por: objecao em lazy consensus | proposta marcada como "needs vote" | mudanca de governanca.
- Quem vota: depende do escopo (ver tabela 4.4).
- Janela: minimo 7 dias.
- Votos: +1 (a favor) | 0 (abstencao) | -1 (contra, com justificativa obrigatoria).
- Resultado: maioria simples (default) | 2/3 (mudancas estruturais) | unanimidade (mudanca de governanca).

### 4.3 Veto
- Apenas Maintainers e Owner podem vetar.
- Veto requer justificativa tecnica ou de governanca por escrito.
- Veto pode ser sobreposto por supermaioria (2/3) do comite de governanca.

### 4.4 Escopo da decisao

| tipo de decisao | quorum | maioria |
| --- | --- | --- |
| PR rotineiro | 1 Committer aprovador | lazy consensus |
| Mudanca em area especifica | Maintainer da area | lazy consensus |
| Mudanca cross-area | 2+ Maintainers | maioria simples |
| Nova feature publica (RFC) | comunidade aberta | lazy consensus em 14 dias |
| Mudanca estrutural | comite de governanca | 2/3 |
| Mudanca de governanca | comite + Owner | unanimidade do comite + aval do Owner |

## 5. Code of Conduct

- Este projeto adota um Code of Conduct publico: ver `CODE_OF_CONDUCT.md` na raiz.
- **CoC vence regra tecnica.** Comportamento que viole o CoC e tratado antes de qualquer discussao tecnica.
- Reportes de violacao: <email | formulario | DM a Owner>.
- Processo de tratamento descrito em `CODE_OF_CONDUCT.md`.

## 6. Conflict resolution

Fluxo escalonado:

1. **Direto:** as partes tentam resolver entre si em canal publico ou privado.
2. **Mediacao:** um Maintainer neutro media a discussao.
3. **Comite:** comite de governanca avalia e decide (maioria simples).
4. **Owner:** decisao final, sem recurso.

Conflitos sobre CoC pulam direto para o passo 3.

## 7. Roadmap

- **Cadencia de publicacao:** trimestral (ou <outra>).
- **Formato:** documento publico em `docs/comunidade/roadmap.md`.
- **Input da comunidade:**
  - Janela de coleta: <N dias antes da publicacao>.
  - Canal de input: <RFC | discussao publica | formulario>.
  - Priorizacao final: comite de governanca.

## 8. Triagem de issues

- **SLA de primeira resposta:** <N dias uteis> para qualquer issue nova.
- **Labels obrigatorios:** `tipo:<bug|feature|doc|pergunta>`, `prioridade:<p0|p1|p2|p3>`, `area:<nome>`.
- **Fechamento por inatividade:** apos <N dias> sem resposta do reportador, marca stale; apos mais <N dias>, fecha.
- **Issue de seguranca:** processo em `SECURITY.md` — NAO abrir publica.

## 9. Processo de RFC

- Template: ver `templates/rfc.template.md`.
- Vida da RFC: draft -> review (periodo de comentarios) -> accepted/rejected/withdrawn.
- Periodo minimo de comentarios: <N dias>.
- Decisao final segue secao 4 desta governanca.
- RFC accepted normalmente vira ADR + tarefas de implementacao.

## 10. Eleicao de Maintainer

- **Frequencia:** sob demanda (vaga aberta ou indicacao).
- **Requisitos do candidato:**
  - Committer ha pelo menos <N> meses.
  - Demonstrou ownership em area especifica.
  - Aderiu publicamente ao CoC.
- **Processo:**
  1. Indicacao por Maintainer existente.
  2. Periodo de comentarios da comunidade: <N dias>.
  3. Votacao do comite de governanca: maioria simples.
  4. Aceite formal do candidato.

## 11. Saida e sucessao

- **Saida voluntaria:** Maintainer/Committer pode renunciar a qualquer momento via PR no `MAINTAINERS.md`.
- **Inatividade:** apos <N meses> sem atividade verificavel, o papel e movido para "emeritus" (mantem credito historico, perde permissoes).
- **Remocao por violacao:** decidida pelo comite de governanca conforme secao 4.4.
- **Sucessao do Owner:**
  - Owner deve nomear sucessor por escrito.
  - Em ausencia de nomeacao, comite de governanca elege sucessor por supermaioria (2/3).
- Lista vigente: ver `MAINTAINERS.md` (template em `templates/MAINTAINERS.template.md`).

## 12. Revisao desta governanca

- Esta governanca e revisada anualmente ou sob demanda.
- Mudancas seguem a regra de "Mudanca de governanca" da secao 4.4.
- Historico de mudancas: ver `CHANGELOG.md` do diretorio `docs/comunidade/`.

## 13. Referencias

- Code of Conduct: `CODE_OF_CONDUCT.md`
- Politica de seguranca: `SECURITY.md`
- Lista de maintainers: `MAINTAINERS.md`
- Template de RFC: `templates/rfc.template.md`
- Roadmap: `docs/comunidade/roadmap.md`

---
> Termos tecnicos: ver `GLOSSARIO-ROLDAO.md` na raiz.
