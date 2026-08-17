---
id: ADR-0003
titulo: Adotar SemVer 2.0 estrito com fronteira de API definida por src/index.ts
status: aceita
data-proposta: 2026-01-22
data-aceite: 2026-01-28
depende-de: [ADR-0002]
bloqueia-fase: F-2
superseded-by:
owner: roldao
ultima-conferencia: 2026-05-27
idioma: pt-BR
limite-linhas: 130
proposito: exemplo preenchido do meta-template para referência e comparação
---

# ADR-0003: Adotar SemVer 2.0 estrito com fronteira de API definida por src/index.ts

## Contexto

`@conciliab/csv-parser` é biblioteca pública. Quem instala espera duas garantias:

1. `npm update` (que aplica patch/minor) **nunca quebra** código existente.
2. Bump de major **sempre** vem com migration guide e changelog detalhado.

Sem regra escrita, é fácil escorregar: rename de tipo "só usado internamente" que vaza no `.d.ts` por engano = breaking. Mudar default de uma flag = breaking. Mudar formato de erro lançado = breaking ambíguo.

Precisamos de:
- Definição clara do que é "API pública" (a fronteira do contrato).
- Regra mecânica pra decidir patch vs minor vs major.
- Mecanismo de detecção automática (não dá pra confiar na revisão visual).

## Opções consideradas

### Opção 1: SemVer 2.0 estrito + API fronteira = símbolos exportados de `src/index.ts` + `api-extractor` no CI

- **Prós:** regra binária e auditável; `api-extractor` compara baseline (.d.ts da versão atual no npm) com PR e falha se houver breaking sem bump major; consumidor confia em `^0.x.x` e `^1.x.x` sem medo.
- **Contras:** disciplina exigida — qualquer rename de tipo exportado dispara bump major; risco de versão explodir (chegar em 8.0.0 em 18 meses).
- **Custo:** baixo. ~2h pra configurar api-extractor + baseline inicial.

### Opção 2: SemVer "frouxo" (patch/minor pode mudar tipos internos)

- **Prós:** menos atrito, menos releases major.
- **Contras:** consumidor não pode confiar em `^x.y.z`; quebra silenciosa eventual = perda de reputação; padrão da comunidade JS/TS hoje é SemVer estrito.
- **Custo:** baixo no início, alto quando o primeiro incidente acontece.

### Opção 3: CalVer (calendar versioning, ex: `2026.05.27`)

- **Prós:** transparente sobre idade do release.
- **Contras:** não comunica risco de breaking; ferramentas npm/pnpm assumem SemVer pra resolver dependências; sair do padrão é fricção desnecessária.
- **Custo:** alto (incompatível com ecossistema).

## Decisão

Escolhemos a **Opção 1: SemVer 2.0 estrito + fronteira em `src/index.ts` + api-extractor**.

### Definição de "API pública"

A API pública é exatamente o conjunto de **símbolos exportados de `src/index.ts`** (funções, tipos, classes, enums, constantes). Qualquer outro símbolo é interno e pode mudar livremente em qualquer release.

### Regras de bump

| Mudança | Bump |
|---|---|
| Bug fix em parser sem mudar tipo/comportamento documentado | **patch** |
| Otimização interna invisível pro consumidor | **patch** |
| Adicionar novo símbolo exportado (função, tipo, constante) | **minor** |
| Adicionar parâmetro **opcional** a função exportada existente | **minor** |
| Adicionar nova propriedade **opcional** a tipo exportado | **minor** |
| Remover símbolo exportado | **major** |
| Rename de símbolo exportado | **major** |
| Trocar tipo de parâmetro/retorno de função exportada | **major** |
| Adicionar parâmetro **obrigatório** a função exportada existente | **major** |
| Tornar propriedade opcional em **obrigatória** em tipo exportado | **major** |
| Mudar comportamento documentado de função (mesmo sem mudar tipo) | **major** |
| Bump de Node mínimo no `engines` | **major** |
| Mudar default de flag de opção que altera output | **major** |

### Fase pré-1.0.0

Enquanto a lib está em `0.x.x`, SemVer permite breaking em `minor` (`0.4.x → 0.5.0`). Mesmo assim, **seguimos as regras de major listadas acima** para qualquer breaking — só que aplicado ao slot `minor`. Isso prepara a comunidade pro `1.0.0` e evita maus hábitos.

### Migration guide obrigatório

Todo bump major (ou minor em fase 0.x.x com breaking) exige seção dedicada no CHANGELOG.md:
- O que mudou.
- Por que mudou.
- Diff de código de antes/depois.
- Caminho de migração (script automático se possível).

## Consequências

### Positivas
- Confiança da comunidade no `^x.y.z` — não vão ter surpresa em `npm update`.
- Auditoria automática (`api-extractor`) — humano não precisa revisar manualmente cada PR.
- Migration guides padronizados = adoção mais rápida de novas majors.

### Negativas
- Releases major mais frequentes (provavelmente 2-3 por ano nos primeiros 2 anos).
- Disciplina exigida: qualquer mudança em `src/index.ts` força reflexão sobre bump correto.
- Bump major exige escrita de migration guide = ~2h extras por release breaking.

### Reversibilidade
Baixa. Voltar atrás em SemVer significa quebrar confiança da comunidade; consumidor que já fixou `^1.x.x` ficaria sem patch de segurança se afrouxássemos depois.

## Non-goals

- Política de end-of-life de linhas major (quanto tempo manter `0.x` recebendo patch após sair `1.x`) → registrado em `SECURITY.md`.
- Política de pre-release (`-alpha`, `-beta`, `-rc`) → será decidido em ADR futura quando aproximar do `1.0.0`.

## Como validar (gates)

- [x] `pnpm run api-check` roda em todo PR e compara `src/index.ts` exports com baseline do release anterior.
- [x] Hook `api-extractor` falha o build se houver breaking sem changeset major.
- [x] CHANGELOG.md tem seção "Migration guide" em todo release major (validado por linter custom).
- [ ] Após `1.0.0`, política de EOL (end-of-life — quando uma versão para de receber suporte) revisitada em ADR.

## Referências

- https://semver.org/spec/v2.0.0.html
- https://api-extractor.com/
- https://github.com/changesets/changesets
