# Contribuindo com o ROLDAO-METHOD

Obrigado por considerar contribuir!

## Princípios

1. **Qualidade > volume.** Prefiro 1 hook bem testado a 5 hooks frágeis.
2. **PT-BR sempre.** Esse é o diferencial. Conteúdo em inglês é rejeitado (exceto metadados npm).
3. **Conciso vence completo.** Doc longa ninguém lê.
4. **Testar é obrigatório.** Hook novo precisa de caso em `_test-runner.sh`. Agente novo precisa passar pelo `tools/validar-templates.js`.
5. **Foco em mercado BR.** LGPD, fiscal, regulação, padrões locais. Conteúdo genérico está sub-priorizado.

## Como rodar localmente sem publicar no npm

```bash
git clone https://github.com/roldaobatista/roldao-method
cd roldao-method
npm link
cd ~/algum-projeto-teste
roldao-method install   # usa sua versão local
```

Para reverter: `npm unlink -g roldao-method`.

## Quality gates antes de abrir PR

Rode tudo:

```bash
npm test
```

Equivale a:

```bash
node tools/validar-templates.js
bash templates/.claude/hooks/_test-runner.sh
node test/install.test.js
```

Se algum falhar, **não abra PR** até estar verde.

## Tipos de contribuição bem-vindos

### Hooks novos
- Padrão BR não previsto (validação Pix, CEP, NF-e).
- Anti-padrão de framework (Electron, Next.js, Django).
- Lint regulatório (logar CPF em texto, gravar PII sem base legal).

Cada hook precisa:
- Shebang `#!/usr/bin/env bash`.
- Tratar stdin vazio.
- Exit 2 pra bloquear, exit 0 pra permitir.
- Mensagem clara em PT-BR com regra citada (ID se houver).
- Caso de teste em `_test-runner.sh`.

### Agentes novos
- Domínios BR (jurídico-LGPD, contábil, RH-eSocial, ANS-saúde).
- Stacks específicas (Electron, Flutter, Rails-BR, Django-BR).

Cada agente precisa:
- Frontmatter completo (`name`, `description`, `tools`, `model`, `color`).
- Princípios numerados.
- Modos operacionais (se aplicável).
- Saída esperada explícita.
- Não pode duplicar agentes existentes.

### Workflows (commands)
- Cenários que não cabem em `/feature`/`/bug`/`/refactor`.

### Skills
- Padrão que vai ser usado em N projetos.
- Algoritmo embutido (sem dependência runtime).
- BR-foco: CPF, CNPJ, Pix, CEP, NF-e, eSocial.

### Addons
- Pacotes de extensão pra domínio específico.
- Ver `addons/README.md` pra estrutura.

### Docs
- Casos de uso BR reais.
- Troubleshooting de erro recorrente.
- Guia de migração de outro framework.

## Convenção de commit

```
<prefixo>: descricao curta no imperativo

corpo opcional explicando o porquê.
```

Prefixos: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `build`, `ci`, `revert`.

**Atômico:** um propósito por commit. Não misture `feat + fix`. Hook `commit-message-validator` barra.

**Primeira linha ≤ 72 caracteres.**

**Cite IDs:**
```
feat: aceita CNPJ alfanumérico (FISCAL-005, US-042)
fix: corrige base legal em cadastro (LGPD-007)
```

## Pull request

1. Fork + branch (`feat/hook-validar-pix`, `fix/install-windows-path`).
2. Faça a mudança em commits atômicos.
3. Rode `npm test`. Verde.
4. Atualize `CHANGELOG.md` na seção `[Unreleased]` (ou crie se não existir).
5. Abra PR com descrição clara em PT-BR contendo:
   - O quê: 1-2 frases.
   - Por quê: motivação real (issue, cliente, regulação).
   - Como testar: passo-a-passo manual.
6. Aguarde revisão. Pode demorar.

## O que NÃO aceito

- Tradução literal de frameworks gringos sem adaptação à realidade BR.
- Hooks que mascaram erro (anti-padrão TST-001).
- Conteúdo em inglês como principal (inglês só em metadados npm).
- Features sem caso de uso claro.
- Conteúdo gerado por IA sem revisão humana visível (resposta literal de chat).
- Dependências runtime (zero `dependencies` no `package.json` é regra).

## Código de conduta

- Respeito acima de tudo. Discordância técnica é bem-vinda; ataque pessoal não.
- Inclusivo: PT-BR claro, sem jargão exclusivo de Big Tech.
- Foco no usuário não-programador: ele é quem o framework atende.

## Suporte

- Dúvida sobre como contribuir: abra issue com label `pergunta`.
- Bug: issue com label `bug`.
- Ideia grande: discussão antes de PR.

---

Obrigado!
