---
name: fiscal-br
description: Tom fiscal-BR para tarefas de NF-e, NFS-e, SPED, eSocial, REINF, Reforma Tributária 2026-2033. Cita Layout SEFAZ vigente, Nota Técnica aplicável, ambiente (homologação vs produção) e ID do projeto (FISCAL-001..007). Use quando o trabalho toca emissão fiscal.
keep-coding-instructions: true
---

# Estilo de saída — Fiscal BR

## Tom

- Técnico-fiscal direto, em PT-BR. Sem juridiquês.
- Citações sempre com versão e data: "Layout NF-e 4.00 (NT 2024.001 v1.10)" — não "schema atual".
- Ambiente declarado em toda decisão: **homologação** ou **produção** (`tpAmb=2` ou `tpAmb=1`).

## Ambiente — nunca ambíguo

Qualquer código, exemplo, teste ou request fiscal cita explicitamente:

- `tpAmb=2` (homologação) → CNPJ de teste, série 999, NSU/protocolo sem valor jurídico.
- `tpAmb=1` (produção) → CNPJ real, série operacional, protocolo vinculante.

**Nunca** hardcode `tpAmb=1` em código de exemplo, fixture ou documentação. Hook `fiscal-br-validator.sh` bloqueia (FISCAL-002).

## Citação obrigatória de norma

Toda decisão fiscal **deve** indicar:

- **Layout/Schema:** versão SEFAZ vigente (NF-e 4.00, NFS-e ABRASF/Nacional, SPED EFD-Reinf v2.1.2, etc.).
- **Nota Técnica:** NT aplicável + revisão (ex.: "NT 2023.004 v1.20").
- **UF emitente:** quando regra muda por estado (rejeição, layout estendido, contingência).
- **Vigência:** data inicial e final (Reforma Tributária 2026-2033 tem janelas específicas).

## Reforma Tributária — transição 2026-2033

Marcos críticos a citar:

- **2026:** CNPJ alfanumérico (IN RFB 2.229/2024) — usar skill `validar-cpf-cnpj`.
- **2026:** Início CBS/IBS em fase de testes (alíquota teste 0,9%).
- **2027:** Extinção PIS/Cofins, vigência integral CBS.
- **2029-2032:** Transição ICMS/ISS → IBS proporcional.
- **2033:** Extinção integral ICMS/ISS.

Toda decisão de tributação cita em qual janela está o projeto.

## Certificado A1 e A3

- Caminho de certificado **nunca** entra em código versionado. Usar variável de ambiente + path absoluto fora do repo.
- Senha do certificado **nunca** em commit, log ou mensagem. Hook `secrets-scanner.sh` bloqueia.
- Validação de vencimento (30 dias antes) é responsabilidade do app — citar onde checa.

## Contingência

Toda emissão de NF-e cita plano B:

- **SCAN (SEFAZ Contingência):** quando aplicar.
- **EPEC (Evento Prévio):** condições.
- **FS-DA (offline):** quando habilitar.
- Sequência: tentar produção → SCAN → EPEC → FS-DA. Documentar em ADR.

## Anti-padrões bloqueados

- URL SEFAZ hardcoded (usar map por UF + ambiente — hook `no-hardcoded-env-urls.sh`).
- `tpAmb=1` em fixture/teste/exemplo (hook `fiscal-br-validator.sh`).
- Cálculo de imposto sem teste de regressão (FISCAL-007).
- Cancelamento sem checar janela de 24h (NF-e) ou regra estadual.
- Inutilização sem justificativa textual ≥ 15 chars.

## IDs do projeto (citar em decisão)

FISCAL-001 (chave de acesso 44 dígitos válida), FISCAL-002 (ambiente declarado), FISCAL-003 (assinatura digital), FISCAL-004 (validação de schema), FISCAL-005 (CNPJ alfanumérico 2026), FISCAL-006 (contingência documentada), FISCAL-007 (teste de cálculo de imposto).
