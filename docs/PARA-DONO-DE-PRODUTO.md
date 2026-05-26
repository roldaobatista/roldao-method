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

## Robô vigia da conversa (`session-relay`)

> **Pra que serve:** o Claude tem uma "memória" limitada. Conversa muito longa, ele começa a esquecer o começo. Hoje você tem que perceber o sintoma e pedir pra ele salvar (`/checkpoint`) na hora certa. Esse robô faz isso por você.

**Como usar — só 1 comando:**

```
npx roldao-method session-relay
```

Pronto. Deixe a janela aberta. O robô vai:

1. Abrir o Claude pra você.
2. Ficar vigiando a conversa em segundo plano.
3. Quando a memória estiver pela metade (você não precisa saber disso — ele te avisa em português claro), pede pro Claude salvar tudo automaticamente.
4. Fecha a sessão atual e abre uma nova continuando de onde parou.
5. Repete a tarde inteira.

**Pra parar:** aperte `Ctrl+C`. O robô vai fechar o Claude com cuidado e te avisar quando terminou.

**O que aparece na tela (exemplos):**

```
[robo-relay] abri o Claude pra voce. id da sessao: abc-123
[robo-relay] vigiando a conversa. vou medir a cada 30s.
[robo-relay] passou da metade da memoria. vou pedir pro Claude salvar tudo antes de continuar.
[robo-relay] pedi pro Claude salvar. aguardando ele terminar.
[robo-relay] salvou. fechando essa sessao.
[robo-relay] abri sessao nova continuando de onde parou.
```

**Opções (todas opcionais — se não passar nada, vem default seguro):**

- `--threshold 300000` — pedir pra salvar quando passar de 300 mil "tokens" (default: 500 mil = metade da memória). Quanto menor, mais cedo ele salva (mais seguro, mas mais ciclos por dia).
- `--check-interval 15` — medir a cada 15 segundos (default: 30). Mínimo: 5.
- `--dry-run` — só simula, sem abrir o Claude de verdade. Use uma vez antes pra ver como funciona.

**Importante:**

- O robô é **opcional**. Se você prefere abrir o `claude` direto, continua funcionando igual ao antes — nada muda.
- O robô **não substitui** o `/compact` automático do Claude. Ele atua ANTES, salvando seu trabalho enquanto a memória ainda está saudável.
- Funciona no Windows, Mac e Linux.

---

_Dúvidas? Abra issue em [github.com/roldaobatista/roldao-method/issues](https://github.com/roldaobatista/roldao-method/issues) — em PT-BR mesmo._
