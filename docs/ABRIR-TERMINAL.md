---
owner: framework
revisado-em: 2026-05-25
status: stable
publico-alvo: dono-de-produto-nao-programador
---

# Abrir o terminal — passo zero pra usar o ROLDAO-METHOD

Antes de qualquer outra coisa, você precisa **abrir o terminal**. É a janela preta (ou colorida) onde você digita comandos. Sem terminal aberto, nenhum comando da documentação funciona.

## Por que terminal?

O ROLDAO-METHOD não tem botão pra clicar. Você instala digitando `npx roldao-method init` no terminal. Depois, o assistente de IA (Claude Code, Cursor, etc.) cuida de quase tudo.

**Não precisa decorar comando** — só precisa saber **onde digitar**.

---

## Windows (10 ou 11)

1. Aperte a tecla **Windows** (do logo).
2. Digite **`powershell`** (sem aspas).
3. Clique em **Windows PowerShell**.

Pronto — abriu uma janela azul com texto.

> Alternativa: tecla `Windows` + `R`, digitar `powershell`, Enter.

## Mac

1. Aperte **⌘ Command + barra de espaço** (abre o Spotlight).
2. Digite **`terminal`**.
3. Aperte **Enter**.

Pronto — abriu uma janela com texto.

## Linux (Ubuntu, Mint, Fedora, etc.)

1. Aperte **Ctrl + Alt + T**.

Pronto.

> Se atalho não funcionar: procure por **Terminal** ou **Console** no menu de aplicativos.

---

## Entrando na pasta do seu projeto

Tudo no ROLDAO-METHOD acontece **dentro da pasta do seu projeto**. Pra "entrar" nela pelo terminal:

**Windows:**
```
cd C:\Users\seu-nome\Documents\meu-projeto
```

**Mac e Linux:**
```
cd ~/Documents/meu-projeto
```

> `cd` significa "change directory" — trocar de pasta. Substitua o caminho pelo da sua pasta real.

**Atalho que evita erro de digitação:** no Windows, abra a pasta no Explorer, digite `cmd` na barra de endereço e aperte Enter. Já abre o terminal na pasta certa.

No Mac, arraste a pasta de cima de **Finder** pra cima do app Terminal — abre direto na pasta.

---

## Próximo passo

Com o terminal aberto **dentro da pasta do projeto**, vá pra [`docs/PRIMEIRO-DIA.md`](PRIMEIRO-DIA.md).

Se algum comando der erro, o capítulo [`docs/COMO-PEDIR-AJUDA.md`](COMO-PEDIR-AJUDA.md) ensina o que fazer.
