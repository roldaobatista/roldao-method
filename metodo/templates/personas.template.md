---
owner: <quem>
revisado-em: <YYYY-MM-DD>
status: draft
ordem-descoberta: 02/17
proximo: docs/descoberta/jornadas.md
idioma: pt-BR
limite-linhas: 200
proposito: descreve quem usa e quem compra o produto.
---

<!--
template: personas.md
destino: docs/descoberta/personas.md
uso: 2-5 personas, 1-2 páginas por persona. Distinguir USUÁRIO de COMPRADOR se forem pessoas diferentes.
referência: ESTRUTURA-PROJETO-NOVO-DO-ZERO.md §3
limite: ≤200 linhas. Se passar, fatiar em arquivos por persona dentro de docs/descoberta/personas/.
-->

# Personas — <NomeDoProjeto>

> Esqueleto inicial. Cada persona é um arquétipo, não pessoa real. Use nomes fictícios. Marque `(PROVISÓRIO)` quando inferir do briefing.

## P-001 — <Nome fictício> — <papel/cargo>

- **Papel**: <ex.: gerente de operações, balconista, dev sênior>
- **Contexto**: <onde trabalha, equipamento, tempo disponível>
- **Contexto técnico**: <fluência digital — alto/médio/baixo; ferramentas que já usa>
- **Frustrações principais** (as dores que justificam o produto):
  - <dor 1 — concreta, com gatilho>
  - <dor 2>
  - <dor 3>
- **Job to be done** (1 frase): "Quando eu <situação>, eu quero <motivação>, para que <resultado esperado>."
- **Métrica de sucesso pra ela**: <o que ela considera "o produto resolveu meu problema">
- **Comprador?**: <sim/não> — se "não", apontar persona-comprador correspondente.

## P-002 — <Nome fictício> — <papel/cargo>

[mesmo formato]

## P-003 — <Nome fictício> — <papel/cargo>

[mesmo formato]

## Personas-comprador (se distintas dos usuários)

> Em B2B, quem usa é diferente de quem aprova compra. Mapear ambos.

### P-C-001 — <Nome fictício> — <papel de decisão>
- **Papel**: <ex.: CFO, dono da PME, gerente de TI>
- **Critérios de compra** (em ordem): <preço, segurança, integração, prazo de implantação, ...>
- **Objeções típicas**: <"é caro", "já tenho planilha", "vai dar trabalho migrar">
- **Como mede ROI**: <fórmula concreta — "se economiza X horas, vale Y reais/mês">

## Anti-personas (quem NÃO é o público)

> Explicitar evita confusão depois. 1-3 itens.

- <quem é evitar: ex.: "empresas com >500 funcionários — fora do escopo">
- <quem mais>

## Como esta lista foi montada

- Entrevistas: <quantas, com quem — link para `entrevistas/`>
- Observação direta: <quando, onde>
- Inferência do briefing: <quais campos>
- Dados de mercado: <fontes citadas>
- Marcar `(PROVISÓRIO)` em qualquer campo derivado de inferência sem validação.

## Critério para promover de `draft` para `stable`

- [ ] Cada persona validada com pelo menos 1 entrevista real ou observação direta.
- [ ] Comprador e usuário distintos quando aplicável.
- [ ] Anti-personas explícitas.
- [ ] Frustrações citam gatilho concreto (sem "é difícil", "não é prático" — qualificar).
