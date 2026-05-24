---
tipo: prd
id: PRD-007
versao: 2
status: aprovado
owner: gerente-produto (Sofia)
revisado-em: 2026-05-24
---

# PRD-007 — Cadastro de cliente do balcão (PDV físico)

> **PRD = Product Requirements Document.** Em PT-BR: documento que diz o que vamos construir, pra quem, por quê, e como saberemos que deu certo. Spec-as-source (INV-002): este documento gera as user stories e o código, não o contrário.

---

## 1. Problema

Hoje o atendente cadastra o cliente direto no campo "CPF" do formulário sem validação. Em 4% das vendas (auditoria interna últimos 90 dias) o CPF é gravado errado e descobrimos só no fechamento do dia, quando a nota fiscal rejeita. Resultado: 12 reemissões/mês, retrabalho do contador, cliente esperando no balcão.

A loja vende ~80 cadastros/dia em horário de pico. Não pode bloquear venda se a internet cair (já caiu 3x no último trimestre).

**Evidência:**
- Ticket #1247: "CPF salvo como 123.456.789-09 mas era -08, NF rejeitou"
- Relatório do contador (2026-04-12): 12 reemissões só por CPF inválido em abril.
- Conversa com gerente da loja (2026-04-20): "tem que ser rápido, atendente não pode esperar 5 segundos olhando tela girar".

---

## 2. Personas

| Persona | Quem é | O que quer | Onde sofre hoje |
|---|---|---|---|
| Atendente do balcão | Funcionário CLT, 22-45 anos, pouca paciência com sistema lento | Cadastrar cliente em ≤ 30s e voltar a vender | Sistema não avisa erro até o final do dia |
| Contador da loja | Terceirizado, recebe XMLs no dia seguinte | Receber NF-e sem erro de CPF | Tem que pedir reemissão pro atendente — 12x/mês |
| Dono da loja | Compra o sistema mensalmente | Não perder venda nem ter retrabalho de NF | Vê 4% de retrabalho fiscal |

---

## 3. Hipótese de solução

Vamos validar o CPF no momento que o atendente clica em "Salvar" usando algoritmo local (sem chamar Receita Federal). Se for inválido, mostra mensagem clara em PT-BR e mantém o foco no campo. Sem latência, funciona offline, sem custo por chamada.

---

## 4. User stories (rastreáveis)

### US-042 — Validar CPF no cadastro
**Como** atendente do balcão, **quero** que o sistema avise quando eu digito um CPF inválido **para** não gravar errado e descobrir só na hora da nota.

**Critérios de aceitação:**
- **AC-042-1** — Validar dígitos verificadores antes de gravar.
- **AC-042-2** — Mostrar mensagem PT-BR clara abaixo do campo se inválido.
- **AC-042-3** — Aceitar com e sem máscara.
- **AC-042-4** — Não fazer chamada externa.

### US-043 — Validar CNPJ no cadastro de empresa
**Como** atendente, **quero** a mesma validação pra CNPJ **para** o mesmo benefício quando o cliente é PJ.

**Critérios de aceitação:**
- **AC-043-1** — Validar dígitos verificadores do CNPJ.
- **AC-043-2** — Aceitar CNPJ alfanumérico (FISCAL-005, vigência jul/2026).
- **AC-043-3** — Mensagem PT-BR análoga à US-042.

### US-044 — Telefone como contato secundário
**Como** atendente, **quero** salvar telefone do cliente **para** ligar se a mercadoria atrasar.

**Critérios de aceitação:**
- **AC-044-1** — Aceitar formato (XX) 9XXXX-XXXX.
- **AC-044-2** — Marcar como opcional (não bloquear venda se vazio).

---

## 5. Non-goals (INV-003)

O que NÃO está no escopo desta iniciativa:

- **Não** consulta situação cadastral na Receita Federal (custo + offline).
- **Não** avalia crédito (Serasa/SPC — outro PRD).
- **Não** valida endereço (CEP fica pra PRD-008).
- **Não** integra com CRM externo.
- **Não** muda o layout visual do formulário (UX-005 trata disso).

---

## 6. Métricas de sucesso

| Métrica | Valor atual | Meta | Como medir |
|---|---|---|---|
| % CPFs inválidos gravados | 4% | < 0,5% | Query `SELECT count(*) FROM clientes WHERE cpf_valido = false` diário |
| Reemissões de NF por CPF errado | 12/mês | 0/mês | Relatório do contador (mensal) |
| Tempo médio de cadastro | ~25s | ≤ 30s (não degradar) | Telemetria do PDV, evento `cadastro_concluido` |

---

## 7. Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Atendente reclama da nova mensagem de erro | Alta | Baixo | Mensagem PT-BR clara + treinamento de 5 min |
| Algoritmo módulo 11 com bug em casos extremos | Baixa | Médio | Usar skill `validar-cpf-cnpj` do core (já testada) |
| CPF de pessoa falecida passa | Alta | Baixo | Aceito como non-goal — fora do escopo |

---

## 8. Regulamentação BR aplicável

- **LGPD-001** — Coleta de CPF. Base legal: execução de contrato (compra/venda).
- **LGPD-003** — Minimização. CPF só pra emitir nota fiscal.
- **FISCAL-005** — Coluna `cpf` é VARCHAR(14) pra suportar CNPJ alfanumérico jul/2026 (futuro).
- **INV-006** — Causa raiz. CPF inválido é tratado na origem (no cadastro), não no fechamento do dia.

---

## 9. Histórico de mudanças

| Data | Versão | Autor | Mudança |
|---|---|---|---|
| 2026-04-25 | 1 | Sofia | criação a partir de ticket #1247 |
| 2026-05-24 | 2 | Sofia | adicionado US-043 (CNPJ) e US-044 (telefone), métricas com baseline |

---

## 10. Menu de adaptação por domínio

### 10.F — Varejo PDV (esta iniciativa)

- **Latência de cadastro:** ≤ 50ms da validação (medir no browser).
- **Offline-first:** sim. Validação local, sem rede.
- **Impressora fiscal:** integração no PRD-009 (não toca aqui).
- **Tela do atendente:** monitor 15" 1024x768 — mensagem precisa ser visível sem rolar.
