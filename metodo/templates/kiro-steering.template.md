---
owner: <dono-do-projeto>
revisado-em: <YYYY-MM-DD>
status: draft
idioma: pt-BR
limite-linhas: 120
proposito: ponto de entrada do Kiro para o contrato de agentes do projeto
---

<!--
template: Kiro steering
uso: copiar para `.kiro/steering/00-agents.md` na raiz do repositório.
escopo: ponto de entrada do Kiro para o contrato AI do projeto.
referência: matriz-multi-harness.md §Estratégia recomendada
limite: ≤120 linhas.

Kiro lê arquivos em `.kiro/steering/*.md` automaticamente como contexto persistente.
O prefixo `00-` garante que este arquivo seja lido primeiro.
-->

# Kiro steering — agentes IA

> **Hierarquia de precedência (vale para os 4 contratos AI):**
> constitution.md > REGRAS-INEGOCIAVEIS.md > AGENTS.md > .kiro/steering/
> Em qualquer conflito, o documento mais alto vence.

> Este arquivo é o adendo do harness **Kiro**. A fonte canônica é [`AGENTS.md`](../../AGENTS.md). Em conflito, AGENTS.md vence (e acima dele, REGRAS-INEGOCIAVEIS.md e constitution.md).

## 1. Leia primeiro

Antes de qualquer ação, leia obrigatoriamente:

1. [`constitution.md`](../../constitution.md) — princípios fundadores.
2. [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md) — invariantes INV-AGENT-001..011.
3. [`AGENTS.md`](../../AGENTS.md) — contrato canônico do projeto.

Este steering file é o último elo da cadeia. Não duplique conteúdo dos arquivos acima — apenas referencie.

## 2. Regras inegociáveis — resumo

Detalhes completos em [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md). PASS ZERO obrigatório:

- **INV-AGENT-001** — agente IA não deleta dado de produção sem confirmação humana.
- **INV-AGENT-002** — proibido `--no-verify`, `--force`, `--force-with-lease` em `main`. Override exige ADR registrado em `docs/adr/` + aprovação humana em PR dedicado (Kiro não tem `override-ledger.sh` — ledger é hook do Claude Code).
- **INV-AGENT-003** — investigar (banco/log/payload) antes de editar lógica de negócio.
- **INV-AGENT-004** — pró-atividade: executa reversíveis sem perguntar; confirma só destrutivos.
- **INV-AGENT-005** — validar antes de afirmar "pronto"; evidência obrigatória.
- **INV-AGENT-006** — causa raiz, nunca sintoma; proibido mascarar erro.
- **INV-AGENT-007** — commits atômicos; sem `git add .` cego.
- **INV-AGENT-008** — PII nunca em logs/prints; mascarar antes.
- **INV-AGENT-009** — segredos nunca em arquivo versionado.
- **INV-AGENT-010** — linguagem acessível; traduzir jargão na 1ª ocorrência.
- **INV-AGENT-011** — alteração de qualquer INV-AGENT exige PR dedicado + aprovação do dono.

## 3. Defesa real ≠ hook nativo

Kiro Steering **não suporta hook PreToolUse** (ver [`matriz-multi-harness.md`](../../matriz-multi-harness.md)). Steering files atuam como **contexto persistente** que o modelo lê — não como interceptador de chamadas de tool. Isso significa:

- Não há intercepção automática antes do Kiro executar um comando, write ou edit.
- A rede de segurança real do projeto é **pre-commit git + CI**, não steering files.
- Antes de qualquer commit, o framework [`pre-commit`](https://pre-commit.com/) executa os mesmos validadores que o Claude Code roda em PreToolUse:
  - `gitleaks` (segredos)
  - `secrets-scanner` PII brasileira (CPF/CNPJ/telefone)
  - `anti-mascaramento` (proíbe `--no-verify`, `eslint-disable`, `@ts-ignore`, etc.)
  - `block-destructive` (proíbe `git reset --hard`, `drop table`, etc.)
  - `frontmatter-validator` (valida frontmatter de `*.md`)
  - `check-yaml`, `check-json`, `end-of-file-fixer`, `trailing-whitespace`
  - `detect-private-key`

A configuração canônica vive em [`.pre-commit-config.yaml`](../../.pre-commit-config.yaml). Instalar uma vez por clone:

```bash
pip install pre-commit
pre-commit install
```

Se Kiro tentar burlar isso (ex.: `git commit --no-verify`), o **CI** rejeita o push. Defesa em profundidade.

## 4. Subagentes / auditores

Kiro tem **suporte parcial** a subagentes (ver [`matriz-multi-harness.md`](../../matriz-multi-harness.md)). Auditores especialistas (catálogo em [`docs/governanca/catalogo-auditores.md`](../../docs/governanca/catalogo-auditores.md)) devem ser invocados via:

- **Commands manuais** em `.kiro/` (suporte nativo).
- **Scripts** em `scripts/` invocados via Bash.
- **Outros steering files** em `.kiro/steering/` para regras por contexto.

Pre-commit + CI cobre o piso de segurança, mas não substitui auditoria especializada.

## 5. Pró-atividade e linguagem

Ver INV-AGENT-004 (pró-atividade) e INV-AGENT-010 (linguagem acessível) em [`REGRAS-INEGOCIAVEIS.md`](../../REGRAS-INEGOCIAVEIS.md). Não duplicar aqui.

## 6. O que NÃO repetir aqui

- Política de commits → `REGRAS-INEGOCIAVEIS.md` INV-AGENT-002, INV-AGENT-007.
- Stack, comandos canônicos, ADRs → `AGENTS.md §2, §6, §10`.
- Invariantes → `REGRAS-INEGOCIAVEIS.md`.
- Glossário → `docs/glossario.md`.

<!-- Se sentir vontade de copiar conteúdo dos arquivos acima pra cá, PARE.
     Adicione referência, não cópia. Steering files do Kiro falam só do que é específico do harness Kiro. -->
