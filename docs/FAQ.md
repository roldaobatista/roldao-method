---
owner: framework
revisado-em: 2026-05-17
status: stable
---

# FAQ — perguntas frequentes

## Geral

### Preciso saber programar pra usar?
Não. O ROLDAO-METHOD foi feito por e para gente que não programa. Os agentes traduzem qualquer coisa técnica em PT-BR claro. Você dirige o produto; quem mexe no código é o Claude/Cursor com as regras do framework.

### Funciona no Cursor? E no ChatGPT?
- **Claude Code:** suporte nativo (hooks, agents, skills, commands).
- **Cursor:** suporta as regras (AGENTS.md, CLAUDE.md, regras inegociáveis). Hooks não rodam (Cursor não tem PreToolUse). O instalador detecta e copia o que se aplica.
- **ChatGPT/Codex CLI:** segue AGENTS.md como contrato. Sem hooks executáveis — você ganha disciplina por prompt, não bloqueio automático.

### Roda no Windows?
Sim. Hooks são bash (rodam no Git Bash que já vem com o Git Windows). O instalador é Node.js puro.

### Preciso pagar?
Não. MIT, gratis. O custo é do Claude/Cursor que você já paga.

## Instalação

### `npx roldao-method install` não funciona
Possíveis causas:
1. Você está numa pasta sensível (raiz do disco, home) — o instalador recusa. Rode dentro do projeto.
2. Sem internet — `npx` precisa baixar o pacote.
3. Node < 18 — atualize.

### Posso desinstalar?
Sim: `npx roldao-method uninstall`. Remove os arquivos do framework e preserva seus arquivos personalizados (AGENTS.md, CLAUDE.md, REGRAS-INEGOCIAVEIS.md).

### Como atualizo pra versão nova?
`npx roldao-method update`. Sobrescreve arquivos do framework (criando `.bak` ao lado) e preserva seus arquivos personalizados.

### Como confiro se está tudo OK?
`npx roldao-method doctor`. Lista o que está faltando.

## Uso

### Quando uso cada comando?
| Comando | Quando |
|---|---|
| `/inicio` | Projeto novo do zero |
| `/brownfield` | Adotar o framework em projeto que já existe |
| `/prd` | Iniciativa grande (vários meses) |
| `/epico` | Decompor coisa grande em várias histórias |
| `/historia` | 1 funcionalidade — gerar US-NNN em disco |
| `/feature` | Implementar funcionalidade nova |
| `/bug` | Corrigir comportamento errado (investiga antes) |
| `/refactor` | Reorganizar código sem mudar comportamento |
| `/qa` | Gerar/auditar testes de uma área |
| `/auditoria` | Passar pelos 3 auditores |
| `/retro` | Retrospectiva pós-marco |

### O agente sai escrevendo código sozinho?
Não. O `/bug` exige investigação antes (REGRA #0). O `/feature` exige user story estruturada. Os hooks bloqueiam se ele tentar mascarar bug, comitar segredo ou rodar comando destrutivo.

### Posso desligar um hook que está atrapalhando?
Pode, edite `.claude/settings.json` e remova a entrada. Mas pense duas vezes — o hook existe pra evitar um problema real. Se ele bloqueia caso legítimo, melhor adicionar exceção (`TST-001-exception`, `TST-003-exception`).

### O hook bloqueou algo que era legítimo. E agora?
- Se é mascaramento intencional: adicione `// TST-001-exception: <motivo>` na mesma linha.
- Se é mock legítimo em integration test: `// TST-003-exception: <motivo>`.
- Se é destrutivo intencional: rode em ambiente apartado, ou peça autorização explícita do Roldão antes.

## Cobertura BR

### O framework "fala" LGPD de verdade ou é só palavra-chave?
Tem profundidade real: 10 IDs `LGPD-001` a `LGPD-010` rastreáveis em commit, skill `checklist-lgpd` com árvore de decisão de base legal, agent `auditor-seguranca` com checklist específico. Mas: **não substitui advogado**. O framework documenta e orienta; consultoria humana é necessária.

### NF-e, certificado A1, contingência SEFAZ?
Sim, ver agent `fiscal-br` + regras `FISCAL-001` a `FISCAL-007`. Cobre imutabilidade pós-emissão, certificado por tenant, contingência (EPEC/FS-DA/SVC), reforma tributária 2026-2033, CNPJ alfanumérico. **Também não substitui contador**.

### Reforma Tributária 2026?
Sim, FISCAL-006. Período de transição 2026-2033 exige cálculo paralelo (regime atual + CBS/IBS). ADR da feature tributária declara qual período cobre.

### CNPJ alfanumérico (julho/2026)?
Já suportado. A skill `validar-cpf-cnpj` valida o novo formato (`12.ABC.345/01DE-35`). FISCAL-005 inclui checklist de migração (banco `VARCHAR(14)`, regex `[0-9A-Z]{14}`).

### Pix Automático, EndToEndId, MED?
Skill `validar-pix` valida chave (CPF/CNPJ/email/telefone/UUID) e identificadores oficiais (EndToEndId 32 chars, TxId 1-35 alfanumérico). PIX-001 a PIX-005 cobrem idempotência, MED, DICT.

## Performance e custo

### Esses agentes não consomem contexto demais?
Cada agente é enxuto (~80 linhas em média). O `model: haiku` em PM/UX/Analista economiza custo. Reservamos `sonnet` pra tech-lead e revisor, onde o raciocínio importa.

### Posso usar minha própria configuração de modelo?
Pode. Edite o frontmatter do agente: `model: opus-4.7-1m` se quiser pesar mais, ou `model: haiku-4.5` se quiser economizar.

## Contribuir

### Posso sugerir agente novo / regra nova?
Pode. Abra issue ou PR em https://github.com/roldaobatista/roldao-method. Foco em mercado BR e clareza > volume de features.

### Posso traduzir pra outro idioma?
Roadmap aceita. PT-BR é a versão primária e o foco continua sendo Brasil; tradução é responsabilidade do contribuinte.

### Posso usar comercialmente?
Sim. Licença MIT. Atribuir o repo no rodapé do AGENTS.md gerado é boa prática mas não obrigatório.
