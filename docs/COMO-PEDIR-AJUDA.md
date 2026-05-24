---
owner: tech-writer
revisado-em: 2026-05-24
status: stable
publico-alvo: dono-de-produto-nao-programador
---

# Como pedir ajuda

> Algo travou, o assistente fez besteira, ou você não entendeu o que aconteceu. Este doc te ajuda a pedir ajuda **certa** pra **pessoa certa** **rapidamente**.

---

## Primeiro: respira

Antes de abrir issue / pedir ajuda, tenta na ordem:

1. **`npx roldao-method doctor`** — mostra se o framework está instalado certo.
2. **Olhar a mensagem do framework com calma** — quase toda mensagem em PT-BR tem 3 partes:
   - **Efeito:** o que aconteceu (em palavras suas)
   - **Causa:** por que aconteceu
   - **Próximo passo:** o que fazer agora
3. **`/explicar-para-cliente`** (no assistente) — pega a última mensagem técnica e traduz pra PT-BR claro.
4. **`npx roldao-method rollback`** — se o último update quebrou alguma coisa, volta pra versão anterior.

Se nenhum dos 4 resolveu, é hora de pedir ajuda externa.

---

## Onde pedir ajuda

| Tipo de problema | Onde abrir | Tempo esperado de resposta |
|---|---|---|
| "Não entendi o que o framework está fazendo" | [Discord da comunidade](https://discord.gg/roldao-method) — canal `#duvidas-leigo` | minutos a horas |
| "O framework está travando / dando erro" | [GitHub Issues](https://github.com/roldaobatista/roldao-method/issues) — categoria `bug` | 1-3 dias úteis |
| "Quero sugerir um recurso novo" | [GitHub Discussions](https://github.com/roldaobatista/roldao-method/discussions) — categoria `Ideas` | 1 semana |
| "Tem um problema de segurança / vazamento" | Email: **security@roldao-method.dev** (PGP em [SECURITY.md](../SECURITY.md)) | 24h |
| "Algo legal/fiscal me confundiu (LGPD, NF-e, Pix)" | Discord — canal `#br-fiscal-lgpd` | horas a 1 dia |
| "É urgente, cliente parado, sistema fora do ar" | Discord — canal `#emergencia` + email para um maintainer ativo | melhor esforço (não há SLA contratual) |

---

## Como abrir issue **sem dor de cabeça** (mesmo não programando)

Quando for em [GitHub Issues](https://github.com/roldaobatista/roldao-method/issues), o template já guia. Mas se você não souber preencher um campo, **deixe em branco** e use este modelo no campo "descrição":

```markdown
## O que eu fiz
(em uma frase: "Tentei rodar /inicio depois de instalar")

## O que esperava
(o que eu achei que ia acontecer: "Que aparecesse uma tela perguntando o nome do projeto")

## O que aconteceu
(o que aconteceu de verdade — copia e cola a mensagem que apareceu no terminal,
mesmo que seja técnica. Quem for te responder vai traduzir.)

## Versão do framework
(rode `npx roldao-method --version` no terminal e cola o número aqui)

## Sistema operacional
(Windows / Mac / Linux)
```

**Você NÃO precisa:**
- Saber o que é "stack trace"
- Identificar "qual hook" travou
- Saber o que é "PR" ou "issue closing"
- Falar inglês (issues em PT-BR são bem-vindas)

---

## Como reportar bug **sem stack trace**

Se aconteceu algo que parece bug mas você não tem mensagem técnica nenhuma, descreva o **comportamento visível**:

### Modelo:

```
1. Eu estava tentando: [...]
2. Cliquei em / digitei: [...]
3. Esperava ver: [...]
4. Vi (ou aconteceu): [...]
```

Exemplo real:

```
1. Eu estava tentando criar a primeira história usando /historia
2. Digitei "cadastro de cliente com endereço" no Claude Code
3. Esperava ver um arquivo novo em docs/stories/
4. O Claude começou a falar de framework, depois ficou em loop:
   "Posso prosseguir?" → "Não, prossiga" → "Posso prosseguir?" → ...
```

Esse tipo de relato é **excelente** — quem responde consegue reproduzir e investigar.

---

## Quanto tempo demora

| Quem responde | Tempo típico | Quando |
|---|---|---|
| Comunidade no Discord | minutos a horas | dia útil, horário comercial BR |
| Maintainers no GitHub Issues | 1-3 dias úteis | bug confirmado vira ticket |
| Maintainers em pull request | 2-5 dias úteis | depende da complexidade |
| Email security@ | 24h (compromisso) | qualquer dia |

**Não pagamos suporte SLA contratual.** Se você precisa de garantia de tempo de resposta pra seu cliente, contrate um dev / consultoria especializada. O framework é open source e gratuito; o suporte da comunidade é melhor esforço.

---

## Antes de pedir ajuda, vale tentar

- **Buscar issue existente** — alguém já pode ter relatado: [github.com/roldaobatista/roldao-method/issues?q=...](https://github.com/roldaobatista/roldao-method/issues)
- **Buscar no Discord** — `Ctrl+F` no histórico do canal.
- **Ler `docs/TROUBLESHOOTING.md`** — lista de problemas conhecidos.
- **Ler `docs/GLOSSARIO.md`** — se ficou perdido por causa de termo técnico.

---

## O que evitar

- **Não use dado real de cliente** (CPF, telefone, e-mail) na descrição da issue — issue é pública. Use exemplos genéricos.
- **Não cole `.env`, senha, certificado, chave PIX** em issue. Se precisar mostrar, use os exemplos sintéticos da skill `gerar-test-fixture-br`.
- **Não abra 5 issues pra mesmo problema** — uma issue clara serve mais que 5 dispersas.
- **Não use ALL CAPS** — quem responde vai te tratar igual, mas a comunidade não gosta.

---

## Como você pode ajudar a comunidade

Mesmo sem programar:

- **Confirmar bug em sua máquina** — comente "Aconteceu comigo também, Windows 11, Node 20" numa issue aberta. Ajuda muito.
- **Sugerir tradução melhor** — se viu uma mensagem do framework que ficou confusa em PT-BR, abra issue dizendo qual mensagem + sugestão.
- **Compartilhar caso de uso BR** — se você usa o framework pra algo específico do Brasil que não está documentado, conte no Discord.
- **Indicar pra outro dono de produto** — boca-a-boca é como o framework cresce.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
