# Como publicar o ROLDAO-METHOD

Guia rápido pro Roldão (ou quem for fazer) publicar no GitHub e npm.

## Passo 1 — Criar repositório no GitHub

1. Vá em https://github.com/new
2. Nome: `roldao-method`
3. Descrição: `Framework de desenvolvimento ágil com IA, em português brasileiro`
4. Público
5. **NÃO marque** "Add README" / ".gitignore" / "license" — já temos local
6. Criar

## Passo 2 — Conectar o repo local ao GitHub

Copie a URL do repo recém-criado (algo como `https://github.com/SEU-USUARIO/roldao-method.git`) e rode:

```bash
cd C:/PROJETOS/roldao-method
git remote add origin https://github.com/SEU-USUARIO/roldao-method.git
git branch -M main
git push -u origin main
```

Vai pedir login do GitHub na primeira vez.

## Passo 3 — Criar conta no npm (se ainda não tem)

1. Vá em https://www.npmjs.com/signup
2. Crie conta com e-mail confiável (vai aparecer no pacote)
3. Confirme o e-mail
4. (Recomendado) Ative 2FA em https://www.npmjs.com/settings/SEU-USUARIO/profile

## Passo 4 — Login no npm pelo terminal

```bash
npm login
```

Vai pedir username, password e e-mail. Depois confirma código via e-mail.

## Passo 5 — Verificar se o nome está disponível

```bash
npm view roldao-method
```

Se aparecer "404 Not Found", o nome está livre. Se aparecer um pacote, escolher outro nome (ou usar escopo: `@roldao/method`).

## Passo 6 — Publicar

```bash
cd C:/PROJETOS/roldao-method
npm publish --access public
```

Se for primeiro publish: vai pedir confirmação de 2FA.

## Passo 7 — Testar

Em outra pasta qualquer:

```bash
mkdir teste-instalacao
cd teste-instalacao
npx roldao-method install
```

Deve copiar todos os arquivos.

## Atualizações futuras

Pra publicar versão nova:

```bash
# Ajuste a versão em package.json (semver: 0.1.0 → 0.1.1 patch, 0.2.0 minor, 1.0.0 major)
npm version patch    # ou minor / major
npm publish
git push --follow-tags
```

## Importante

- **NÃO publicar token / chave / segredo** acidentalmente. O hook `secrets-scanner` ajuda, mas verifique manualmente o conteúdo de `package.json` e arquivos antes de publicar.
- **Versionamento semver:**
  - patch (0.1.0 → 0.1.1): bug fix, sem quebra
  - minor (0.1.0 → 0.2.0): feature nova, sem quebra
  - major (0.1.0 → 1.0.0): mudança que quebra usuários existentes
- **NUNCA `npm publish --force`** — pode sobrescrever versão publicada.
- Pacote publicado **não pode ser deletado** após 72h. Cuidado com primeiro publish.

## Quando estiver pronto

Avise. Posso ajudar a divulgar (criar README com badges, post em comunidades dev BR, etc.).
