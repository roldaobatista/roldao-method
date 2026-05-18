---
owner: roldao
revisado-em: 2026-05-18
status: stable
---

# Publicar no npm — guia para o Roldão

> Eu (assistente) não posso publicar sozinho — precisa da SUA conta npm e do código 2FA do seu telefone. Mas deixei TUDO pronto. Você só roda os comandos abaixo.

---

## Antes de publicar — só na primeira vez

### 1. Criar conta npm (se ainda não tem)

Abre https://www.npmjs.com/signup. Use o e-mail que você usa pro GitHub.

### 2. Login local

No terminal (Git Bash):

```
npm login
```

Vai pedir usuário, senha, e-mail e o código de 2FA (chega no app autenticador ou e-mail).

Confirma se logou:

```
npm whoami
```

Tem que aparecer seu username. Se aparecer, está logado.

### 3. Confirmar nome disponível

```
npm view roldao-method
```

- Se devolver `404` ou "not found" → nome livre, pode publicar.
- Se devolver dados de pacote existente → o nome está tomado. Avisa que eu ajusto o `package.json` pra `@roldaobatista/roldao-method` (escopo da sua conta).

---

## Publicar

```
cd C:/PROJETOS/roldao-method
npm test
npm publish
```

Vai pedir 2FA outra vez. Mete o código.

**Pronto.** Depois disso:

```
npx roldao-method install
```

já funciona pra qualquer pessoa do mundo.

---

## Conferir que publicou

```
npm view roldao-method
```

Deve mostrar versão `0.8.0`. Também aparece em https://www.npmjs.com/package/roldao-method.

---

## Próxima vez (versão nova)

1. Subir o número em `package.json` (ex: `0.8.0` → `0.8.1`).
2. Rodar `npm test` (tem que dar verde).
3. Rodar `npm publish`.

Não precisa logar de novo enquanto a sessão npm não expirar.

---

## O que estamos publicando

- 290 kB compactado, 805 kB descompactado.
- ~192 arquivos: CLI + 28 hooks (+5 em addons) + 12 agentes + 21 commands + 22 skills (8 core + 14 addons) + 6 addons + docs. Confira o numero exato com `npm pack --dry-run`.
- Zero dependências runtime (só Node + bash + perl no PC do usuário).
- Licença MIT.

---

## Se der erro

| Erro no terminal | O que significa | O que fazer |
|---|---|---|
| `E403 You cannot publish over the previously published versions` | Já existe essa versão | Sobe o número em package.json |
| `EOTP` ou pede código de novo | 2FA expirou | Digita o código atual do app |
| `E404 Not found` em `npm view` | Pacote ainda não existe (primeira publicação) | Normal, segue pro `npm publish` |
| `ENEEDAUTH` | Não está logado | `npm login` de novo |

Qualquer outra coisa, me chama colando o erro inteiro.
