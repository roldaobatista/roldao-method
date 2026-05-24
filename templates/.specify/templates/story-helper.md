---
tipo: helper
owner: framework
revisado-em: 2026-05-24
status: stable
---

# Helper — Como preencher User Story

> **Companheiro do `story.md`.** Exemplo completo preenchido vive em [`docs/exemplos/US-EXEMPLO.md`](../../docs/exemplos/US-EXEMPLO.md).

## "Como, quero, para" — 3 padrões

**Bom:**
> **Como** atendente do balcão, **quero** que o sistema avise quando eu digito um CPF inválido **para** não gravar errado e descobrir só na hora da nota.

**Ruim:**
> **Como** usuário, **quero** validar CPF **para** funcionar. ← persona genérica, "para" vazio.

**Bom:**
> **Como** dona da loja, **quero** ver o total de vendas do dia em uma tela só **para** decidir o turno da noite sem precisar pedir relatório pro contador.

## Critérios de aceitação (AC) — formato testável

| Ruim | Bom |
|---|---|
| "CPF deve ser validado" | "Quando o atendente clica em Salvar com CPF `111.111.111-12`, o sistema mostra `CPF digitado não é válido` em < 50ms e mantém o foco no campo." |
| "Mensagem clara" | "A mensagem está em PT-BR sem jargão técnico. Teste: leitor não-programador entende em 3 segundos." |
| "Funcionar offline" | "Validação roda sem rede. Verificação: `grep -rE 'fetch\|axios\|http' src/validacao/cpf.ts` retorna 0." |

**3 dicas:**
1. **AC é testável ou não é AC.** Cada AC vira 1 teste automático.
2. **Inclua o número do AC no nome do teste** (`cpf-AC-042-1.test.ts`) pra rastreabilidade.
3. **Non-goal explícito sempre.** "Esta story NÃO valida CNPJ — vai pra US-043."

## Non-goals — 3 categorias

- **Escopo:** "Não valida CNPJ (US-043)."
- **Integração:** "Não consulta Receita Federal (ADR-0014)."
- **Tecnologia:** "Não usa biblioteca externa — algoritmo local."

## Tasks T-NNN — como decompor

| Task | Tipo | Como saber se terminou |
|---|---|---|
| T-001 | Implementação | função `validarCpf()` existe e exporta |
| T-002 | Teste | 10 casos passam (5 válidos + 5 inválidos) |
| T-003 | Integração | `onSubmit` do form chama o validador |
| T-004 | E2E | Playwright cobre o caminho feliz |

**Dica:** cada T- vira 1 commit atômico citando o ID na mensagem.

## Quando este helper abre

`/historia` ou `/feature` encontra `_(persona)_`, `_(ação concreta)_`, `_(benefício)_` ou AC com `_(...)_` e propõe sugestões dos exemplos acima.
