---
owner: tech-writer
revisado-em: 2026-05-24
status: stable
publico-alvo: dono-de-produto-nao-programador
---

# Primeiro dia com o ROLDAO-METHOD

> Você instalou, e agora? Este doc é o passo-a-passo do **primeiro dia**, sem jargão.

---

## Antes de tudo: o que você precisa ter no computador

1. **Node.js 18 ou mais recente.** Pra checar: abra o terminal e digite `node --version`. Se aparecer `v18.x.x`, `v20.x.x` ou `v22.x.x`, está OK. Se não aparecer nada, baixe em [nodejs.org](https://nodejs.org) (botão verde "LTS").
2. **Um assistente de IA configurado.** O framework foi feito pro **Claude Code** (de longe o mais testado), mas também funciona com Cursor, Windsurf, Cline, Roo, Aider, Continue, Gemini CLI e Codex CLI. Se você ainda não tem nenhum, baixe o Claude Code em [claude.ai/code](https://claude.ai/code).

**Não precisa:** Python (só pra algumas validações fiscais avançadas), Git Bash, banco de dados, conta paga em servidor.

---

## Passo 1 — Experimentar sem instalar nada (30 segundos)

```bash
npx roldao-method demo
```

Vai aparecer 3 verificações reais rodando:

```
✓ block-destructive    bloqueou rm -rf /
✓ secrets-scanner      pegou credencial AWS num arquivo
✓ validar-cpf-cnpj     reprovou CPF 111.111.111-11
```

Se você viu esses 3 sucessos, **o framework funciona no seu computador**. Pronto pra instalar de verdade.

---

## Passo 2 — Instalar no seu projeto (1 minuto)

Vá pra pasta do projeto onde quer usar:

```bash
cd /caminho/do/seu/projeto
npx roldao-method install
```

Vai criar duas pastas (`.claude/` e `docs/`) e alguns arquivos na raiz. Pode demorar 10-20 segundos.

**Quando terminar**, o terminal mostra:

```
✓ instalacao concluida.

Proximos passos (do mais simples pro mais avancado):
  1. npx roldao-method tutorial  — 5 perguntas em PT-BR preenchem o AGENTS.md por voce
  2. /inicio (no Claude Code) pra criar a primeira funcionalidade
  3. /brownfield (se ja tem codigo existente)
  4. addons BR: npx roldao-method search

Nao programa? Comece aqui:
  -> docs/PARA-DONO-DE-PRODUTO.md
```

---

## Passo 3 — Responder 5 perguntas (2 minutos)

```bash
npx roldao-method tutorial
```

Vai perguntar **em PT-BR claro**:

1. **Qual o nome do produto?** (ex: "Sistema de boleto Padaria Estrela")
2. **O que ele faz, em uma frase?** (ex: "Emite boleto bancário para clientes mensalistas e envia por WhatsApp")
3. **Que tipo de coisa é?** (escolha: site, app de celular, sistema interno, integração entre sistemas, robô que roda sozinho)
4. **Quem é o usuário?** (ex: "Funcionária do caixa, idade 40-60 anos, pouca paciência com computador")
5. **Qual o diferencial?** (ex: "Não precisa de internet — funciona no caixa offline e sincroniza quando volta a conectar")

Pode digitar respostas em português normal. Não precisa pensar em formato técnico — o tutorial transforma suas respostas no `AGENTS.md` que o assistente vai ler.

---

## Passo 4 — Pedir a primeira coisa pro assistente

Abra o Claude Code (ou seu assistente preferido) **na pasta do projeto** e digite:

```
/inicio
```

O assistente vai:

1. Ler o `AGENTS.md` que você acabou de preencher.
2. Sugerir uma estrutura inicial (sem código ainda, só o esqueleto).
3. Pedir sua aprovação antes de criar arquivos.

A partir daí, é só ir falando em português o que você quer:

- "**Quero uma tela de cadastro de cliente.**"
- "**O boleto saiu errado: o valor do mensalista veio R$ 50 a mais.**"
- "**Preciso integrar com o sistema do banco pra confirmar pagamento por Pix.**"

O agente segue o roteiro automaticamente: investiga antes de mexer, pede confirmação se for ação irreversível, te avisa em PT-BR claro quando termina.

---

## Coisas que vão te assustar (e não deveriam)

| O que aparece | O que significa | O que fazer |
|---|---|---|
| `[BLOQUEIO] [nome-do-hook]` | O framework barrou uma ação perigosa | **Ótimo.** Leia o "Como destravar" abaixo da mensagem. |
| `[AVISO] [nome-do-hook]` | Sinalização, não bloqueio | Só atenção. Não precisa parar. |
| `exit 2` | Sinal técnico de bloqueio | Ignore o número. Leia o texto que vem em PT-BR. |
| Comandos shell (`touch`, `mkdir`) na mensagem | **Instrução PRO AGENTE**, não pra você | Se vier marcado `[INSTRUCAO PRO AGENTE CLAUDE]`, pula. |
| O assistente "demora muito" | Provável: investigando antes de mexer | Tudo certo. É REGRA #0 sendo seguida. |

---

## Quando algo trava

1. **Reinstale**: `npx roldao-method install --force` (preserva seus arquivos pessoais).
2. **Diagnóstico**: `npx roldao-method doctor` (mostra o que está faltando).
3. **Volta versão anterior**: `npx roldao-method rollback` (desfaz o último update).
4. **Pede ajuda**: leia `docs/COMO-PEDIR-AJUDA.md` (próximo doc).

---

## O que você NÃO precisa entender pra começar

- O que é "hook", "agent", "pipeline" — internalia técnica, agente cuida.
- O que cada um dos 28 commands faz — o `/help` te guia.
- Sintaxe de YAML, JSON, regex — assistente cuida.
- Como funciona o Git — assistente cuida, te avisa em PT-BR quando precisa de decisão sua.

---

## Próximos passos depois do primeiro dia

- **Conhecer mais agentes** — leia `.claude/agents/MAPA-VISUAL.md` (mostra quando cada um é acionado).
- **Tabelas de tradução** — `docs/GLOSSARIO.md` (jargão técnico → PT-BR).
- **Casos reais** — `docs/CASOS-DE-USO-BR.md` (exemplos: NF-e, eSocial, Pix, LGPD).
- **Quando você contratar um dev** — passa pra ele o `docs/ARQUITETURA.md`.

---

_Framework: [ROLDAO-METHOD](https://github.com/roldaobatista/roldao-method)._
