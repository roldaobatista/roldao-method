---
owner: roldao
revisado-em: 2026-05-20
status: stable
---

# Publicar no npm — guia único pro Roldão

> Eu (assistente) **não publico sozinho** — precisa da SUA conta npm e do código 2FA do seu telefone. Tudo o mais (testes, tag git, release no GitHub) eu faço direto. Você só roda `npm publish`.
>
> Este é o **único** guia de publicação. O antigo `PUBLICAR.md` foi removido na v0.14.5 (estava obsoleto, citava v0.8.0 e instruções de "criar repo" que já não fazem sentido).

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

Deve mostrar a versão atual do `package.json`. Também aparece em https://www.npmjs.com/package/roldao-method.

---

## O que estamos publicando

- Tamanho exato: rode `npm pack --dry-run` antes (o job `empacotamento` no CI também valida que descompactado < 2 MB).
- CLI + 28 hooks core (+5 em addons) + 12 agentes + 22 commands + 22 skills (8 core + 14 addons) + 6 addons + docs.
- Zero dependências runtime (só Node + bash + perl no PC do usuário; Python só pra skills).
- Licença MIT.

## Próxima vez (versão nova)

1. Subir o número em `package.json` (ex.: `0.14.4` → `0.14.5`).
2. Atualizar `templates/.claude-plugin/plugin.json` e `templates/.continue/config.yaml` pra mesma versão (o `validar-templates.js` falha se divergir).
3. Adicionar entrada no `CHANGELOG.md`.
4. Rodar `npm test` (tem que dar verde — 167/167).
5. `git tag v0.X.Y` e `git push --follow-tags` (eu já faço isso direto quando termino release).
6. **Você roda:** `npm publish` (precisa de 2FA seu).

---

## Se der erro

| Erro no terminal | O que significa | O que fazer |
|---|---|---|
| `E403 You cannot publish over the previously published versions` | Já existe essa versão | Sobe o número em package.json |
| `EOTP` ou pede código de novo | 2FA expirou | Digita o código atual do app |
| `E404 Not found` em `npm view` | Pacote ainda não existe (primeira publicação) | Normal, segue pro `npm publish` |
| `ENEEDAUTH` | Não está logado | `npm login` de novo |

Qualquer outra coisa, me chama colando o erro inteiro.
