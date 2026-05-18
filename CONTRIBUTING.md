# Contribuindo com o ROLDAO-METHOD

Obrigado por considerar contribuir!

## Princípios

1. **Qualidade > volume.** Prefiro 1 hook bem testado a 5 hooks frágeis.
2. **PT-BR sempre.** Esse é o diferencial. Conteúdo em inglês é rejeitado.
3. **Conciso vence completo.** Doc longa ninguém lê.
4. **Testar é obrigatório.** Hook novo precisa de caso em `_test-runner.sh`.

## Como contribuir

### Bug ou ideia

Abra issue em https://github.com/roldao/roldao-method/issues descrevendo:
- O que você esperava.
- O que aconteceu.
- Como reproduzir.

### Pull Request

1. Fork + branch.
2. Faça a mudança.
3. Se tocou em hook: adicione caso de teste e rode `bash templates/.claude/hooks/_test-runner.sh` — todos devem passar.
4. Se adicionou agente: siga o formato dos existentes (frontmatter `name`, `description`, `tools` + princípios + roteiro + saída esperada).
5. Abra PR com descrição clara em PT-BR.

## Tipos de contribuição bem-vindos

- **Hooks novos** que cobrem padrões BR não previstos (validação CPF/CNPJ, NF-e, etc.).
- **Agentes novos** especializados em domínios BR (jurídico-LGPD, fiscal-tributário, contábil).
- **Workflows novos** (`/seguranca`, `/release`, `/onboarding`).
- **Addons opcionais** em `addons/` (SaaS multi-tenant, fiscal-BR, e-commerce-BR).
- **Tradução de exemplos** existentes pra padrões mais brasileiros.

## O que NÃO aceito

- Tradução literal de BMAD/outros frameworks gringos.
- Hooks que mascaram erro (anti-padrão TST-001).
- Conteúdo em inglês como principal (inglês só em metadados npm).
- Features sem caso de uso claro.

---

Dúvida? Issue ou e-mail.
