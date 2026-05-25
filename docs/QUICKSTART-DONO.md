---
owner: framework
revisado-em: 2026-05-25
status: stable
publico-alvo: dono-de-produto-nao-programador
---

# Quickstart — pra dono de produto (não-programador)

5 minutos. Sem decorar comando. Sem entender o que cada coisa faz por dentro.

## O que você vai conseguir

Depois desses passos, o assistente de IA do seu projeto (Claude Code) **vai pedir desculpa em PT-BR quando algo der errado**, **vai te perguntar antes de apagar coisa importante**, e **vai recusar mexer em nota fiscal já emitida**. Ou seja: vai virar um colega disciplinado em vez de um aprendiz acelerado.

## Passos

### 1. Abra o terminal

Se você nunca abriu, leia primeiro: [`docs/ABRIR-TERMINAL.md`](ABRIR-TERMINAL.md). Volta aqui depois.

### 2. Entre na pasta do seu projeto

No terminal, digite (substituindo o caminho):

```
cd C:\Users\seu-nome\Documents\meu-projeto
```

### 3. Instale o framework

Digite no terminal:

```
npx roldao-method init
```

Vai aparecer uma mensagem perguntando se pode prosseguir. Digite **`sim`** e dê Enter.

O instalador copia uns arquivos pra dentro do seu projeto. Demora 1 minuto.

### 4. Pronto

Agora abra o seu assistente de IA (Claude Code). Ele vai ler os arquivos novos automaticamente e seguir as regras do framework.

## E agora?

- Pra **começar a usar de verdade**, vá pra [`docs/PRIMEIRO-DIA.md`](PRIMEIRO-DIA.md).
- Pra **entender o que o framework está fazendo** quando você pede algo ao assistente, vá pra [`docs/PARA-DONO-DE-PRODUTO.md`](PARA-DONO-DE-PRODUTO.md).
- Pra **saber o que pedir** ao assistente, vá pra [`docs/COMO-FUNCIONA.md`](COMO-FUNCIONA.md).

## Se algo deu errado

- Comando "não encontrado"? Você precisa do **Node 18 ou mais novo** instalado. Em [nodejs.org](https://nodejs.org) tem o instalador (escolha "LTS").
- Outro erro? Leia [`docs/COMO-PEDIR-AJUDA.md`](COMO-PEDIR-AJUDA.md) — tem o passo-a-passo pra reportar pro dev (ou abrir uma questão no projeto).

---

**Quer mais detalhe técnico** (estrutura de pasta, configurações, addons)? Vá pra [`docs/QUICKSTART-DEV.md`](QUICKSTART-DEV.md).
