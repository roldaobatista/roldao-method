---
lang: pt-br
owner: tech-writer
revisado-em: 2026-05-24
status: stable
---

# Pra quem não programa

> Esse documento é pra você que tem a ideia do produto, conhece o cliente, sabe o que precisa — mas não programa. Você não vai escrever código. Vai conversar com o assistente de IA e ele segue o roteiro do framework.

## O que esse framework faz por você

Quando você fala com um assistente de IA (Claude, Cursor, ChatGPT) sem regra nenhuma, ele:
- Inventa decisões diferentes cada vez que você pergunta
- Usa siglas que você não entende
- "Conserta" coisas trocando aparência em vez de achar a causa
- Esquece o que vocês combinaram na conversa anterior

O ROLDAO-METHOD coloca **regras automáticas** no caminho dele. Se ele tentar fazer algo perigoso ou usar jargão com você, o sistema impede na hora.

## Os 5 momentos que você vai viver

### 1. Tem uma ideia nova

Você fala: "Quero que o sistema mande WhatsApp pro cliente 1 dia antes do agendamento."

O assistente vai:
1. Te perguntar coisas pra entender melhor (não chuta nem inventa)
2. Escrever em PT-BR claro o que entendeu
3. Pedir sua confirmação **antes** de começar a programar
4. Quando terminar, te explicar o que mudou e o que o cliente vai notar

Comando: `/feature` ou `/inicio` (se for projeto novo).

### 2. O cliente reclamou de bug

Você fala: "O cliente diz que o boleto está com valor errado."

O assistente é **obrigado** a investigar primeiro:
- Olha no banco de dados qual valor está salvo
- Confere os logs (onde o sistema anota o que fez)
- Só depois propõe a correção
- Te confirma o entendimento se houver dúvida

Comando: `/bug`. Essa é a REGRA #0 do framework — não tem como pular.

### 3. Quer entender o que ele acabou de fazer

Você fala: "Não entendi o que você fez."

Comando: `/explicar-para-cliente`. Ele traduz a última resposta técnica pra linguagem normal.

### 4. Quer saber como está o projeto

Comando: `/status`. Ele te dá um resumo em PT-BR: o que ficou pronto, o que falta, se tem risco.

### 5. Tem que decidir algo importante

Comando: `/clarificar`. Ele faz perguntas, anota suas respostas, e tudo fica salvo num documento — assim mês que vem ninguém esquece o porquê da decisão.

## O que você nunca vai precisar entender

- Como o código funciona por dentro
- Qual linguagem de programação está sendo usada
- Erros técnicos com texto em inglês — se aparecer, peça `/explicar-para-cliente`

## Quando precisa pedir ajuda humana

O framework não substitui:
- **Contador** — questões fiscais sérias (CFOP, regime tributário, opção pelo Simples Nacional). O framework ajuda a estruturar, contador valida.
- **Advogado** — contratos, termos de uso, LGPD na parte legal. O framework lembra das obrigações (RIPD, DPO, base legal), advogado escreve.
- **Especialista do seu setor** — se você abrir uma clínica, o framework tem skills de saúde, mas o médico/enfermeiro valida o fluxo clínico.

## Vocabulário rápido (se precisar)

Glossário completo em [GLOSSARIO.md](GLOSSARIO.md).

| Palavra | Significa |
|---|---|
| Commit / salvar | O assistente "salvou" uma mudança no histórico do projeto. |
| Deploy / subir | A versão nova foi pro servidor que o cliente acessa. |
| Rollback / voltar | Desfez a última subida — voltou pra versão anterior. |
| Bug | Comportamento errado. Algo que o cliente fez e o sistema respondeu diferente do esperado. |
| Feature | Funcionalidade nova ou melhoria. |
| Story / história | Descrição de uma necessidade do cliente em UMA frase. |
| Spec | Documento que descreve o que precisa ser feito antes de fazer. |

## Os comandos que mais importam pra você

| O que você quer | Digite |
|---|---|
| Começar um projeto novo | `/inicio` |
| Adicionar ao projeto que já existe | `/brownfield` |
| Criar funcionalidade nova | `/feature` |
| Reportar problema | `/bug` |
| Ver como está o projeto | `/status` |
| Não entendi o que ele falou | `/explicar-para-cliente` |
| Ver tudo que ele pode fazer | `/help` |

---

_Dúvidas? Abra issue em [github.com/roldaobatista/roldao-method/issues](https://github.com/roldaobatista/roldao-method/issues) — em PT-BR mesmo._
