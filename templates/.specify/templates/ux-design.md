---
tipo: ux-design
versao: 1.0
owner: _(nome)_
revisado-em: AAAA-MM-DD
status: draft
us-relacionada: US-NNN
---

# UX Design — _(nome da tela/fluxo)_

> Template do agente `ux-designer` (Lia 🎨). Wireframe em ASCII + 5 estados obrigatórios + mensagens em PT-BR humano + acessibilidade.

---

## 1. Jornada

```
[Tela A] → ação → [Tela B] → ação → [Tela C] → fim
              ↓
        [Tela B-erro]
```

## 2. Tela principal — wireframe ASCII

```
┌───────────────────────────────────────────────┐
│ Logo                              Sair  Perfil│
├───────────────────────────────────────────────┤
│                                               │
│  Título da tela                               │
│                                               │
│  ┌─────────────────────────────────────────┐ │
│  │ Campo 1: [______________]                │ │
│  │ Campo 2: [______________]                │ │
│  │                                          │ │
│  │           [ Cancelar ]  [ Confirmar ]   │ │
│  └─────────────────────────────────────────┘ │
│                                               │
└───────────────────────────────────────────────┘
```

## 3. 5 Estados obrigatórios

### Estado 1 — Vazio (primeira vez do usuário)

```
┌───────────────────────────────────────────────┐
│  Você ainda não cadastrou nenhum cliente.     │
│                                               │
│           [ Cadastrar primeiro cliente ]      │
│                                               │
│           ou importe de planilha →            │
└───────────────────────────────────────────────┘
```

**Mensagem:** "Você ainda não cadastrou nenhum cliente."
**Acao primária:** "Cadastrar primeiro cliente"
**Acao secundária:** "Importar de planilha"

### Estado 2 — Carregando

```
┌───────────────────────────────────────────────┐
│            ◐ Carregando clientes...           │
└───────────────────────────────────────────────┘
```

**Mensagem:** "Carregando clientes..."
**Tempo esperado:** < 2s — se passar, mostrar barra de progresso ou mensagem de "demorou mais que o normal".

### Estado 3 — Sucesso (dados carregados)

```
┌───────────────────────────────────────────────┐
│  Clientes (37)        🔍 [buscar...]   [ + ] │
│                                               │
│  • João Silva — joao@example.com — Ativo     │
│  • Maria Costa — maria@... — Inativo         │
│  • Empresa Exemplo Ltda — CNPJ ... — Ativo   │
│  ...                                          │
└───────────────────────────────────────────────┘
```

### Estado 4 — Erro

```
┌───────────────────────────────────────────────┐
│  ⚠ Não conseguimos carregar seus clientes.   │
│                                               │
│  Pode ser uma queda momentânea da nossa rede.│
│                                               │
│           [ Tentar novamente ]                │
│                                               │
│  Se continuar acontecendo, fale com a gente. │
└───────────────────────────────────────────────┘
```

**Mensagem PT-BR humana:** "Não conseguimos carregar seus clientes." (NÃO: "Error 500: Internal Server Error")
**Acao:** botão "Tentar novamente" + canal de suporte.
**Log interno:** registra `request-id` pra suporte rastrear (não mostrar ID cru pro usuário).

### Estado 5 — Restrição (sem permissão / sem dado)

```
┌───────────────────────────────────────────────┐
│  Seu perfil não tem acesso a clientes.       │
│                                               │
│  Peça ao administrador da conta pra liberar. │
└───────────────────────────────────────────────┘
```

## 4. Mensagens (todas em PT-BR)

| Situação | Mensagem |
|---|---|
| Sucesso ao salvar | "Cliente cadastrado com sucesso." |
| Sucesso ao excluir | "Cliente removido." |
| Erro de validação (CPF inválido) | "Esse CPF não parece válido. Confere os números?" |
| Erro de validação (email) | "Email parece incompleto." |
| Erro de duplicata | "Já existe um cliente com esse CPF." |
| Confirmação destrutiva | "Tem certeza que quer excluir? Esta ação não pode ser desfeita." |

## 5. Acessibilidade (WCAG AA mínimo)

- [ ] Contraste mínimo 4.5:1 em texto normal, 3:1 em texto grande
- [ ] Todo input tem `<label>` associado
- [ ] Foco visível em navegação por teclado
- [ ] Erro de formulário é anunciado pra screen reader (`aria-live`)
- [ ] Botão "Cancelar" antes de "Confirmar" (right-handed default)
- [ ] Touch target ≥ 44x44px em mobile

## 6. Padrões BR

- [ ] CPF formatado: `000.000.000-00` (input com máscara)
- [ ] CNPJ formatado: `00.000.000/0000-00` (e aceita alfanumérico jul/2026+)
- [ ] CEP formatado: `00000-000` (auto-busca via ViaCEP se preencher 8 dígitos)
- [ ] Telefone: `(00) 00000-0000`
- [ ] Moeda BRL: `R$ 1.234,56` (separador de milhar `.`, decimal `,`)
- [ ] Data: `DD/MM/AAAA` (input com calendar picker)

## 7. Responsivo

- Mobile (< 768px): _(adaptação descrita)_
- Tablet (768-1024px): _(adaptação)_
- Desktop (> 1024px): wireframe acima

## 8. Anti-padrões a evitar

- Erro genérico ("Algo deu errado") sem ação proposta.
- Loading sem timeout (vira "spinner pra sempre").
- Destrutivo sem confirmação dupla.
- Texto em inglês sem tradução.
- Cor como única forma de comunicar (red/green) — adicionar ícone/texto.

## 9. Pendências

- [ ] _(decisão de design pendente)_

---

_Quando este UX vira código, marcar `status: implementado` e linkar arquivos: `_arquivos: [src/...]`._
