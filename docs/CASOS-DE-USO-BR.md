---
owner: framework
revisado-em: 2026-05-17
status: stable
---

# Casos de uso BR

Exemplos de demanda real do mercado brasileiro tratada com o ROLDAO-METHOD.

## 1. SaaS contábil — emissão de NF-e

**Cenário:** PME contadora quer emitir NF-e direto do sistema do cliente.

**Fluxo:**
```
/feature emitir NF-e modelo 55 para PME do simples nacional
```

- `gerente-produto` levanta requisitos: CNAE, regime tributário, NCM, CFOP.
- `fiscal-br` lista FISCAL-001 a FISCAL-007 aplicáveis, exige certificado A1 isolado por tenant.
- `tech-lead` decide: Postgres pra persistência, biblioteca `nfe-utils-br` (avaliada antes), fila pra retry SEFAZ.
- `dev-senior` implementa com TDD: assinatura XML, contingência SVC-AN.
- `auditor-seguranca` confirma certificado em cofre, não em env var em texto puro.

**Regras citadas em commit:** `FISCAL-001`, `FISCAL-002`, `FISCAL-003`, `FISCAL-004`.

## 2. App de saúde — telemedicina com dado sensível

**Cenário:** plataforma de telemedicina precisa armazenar prontuário do paciente.

**Fluxo:**
```
/prd plataforma de telemedicina com prontuario eletronico
```

- `analista` levanta Lei 14.510/2022 (telemedicina) + ANS + CFM + LGPD art. 11 (dados sensíveis).
- `gerente-produto` escreve PRD-001 citando bases legais.
- `checklist-lgpd` aplica árvore: dado sensível → Art. 11 → base = tutela da saúde.
- `tech-lead` decide criptografia at-rest + RLS no Postgres, hospedagem BR.
- `auditor-seguranca` exige trilha de auditoria LGPD-004 (quem acessou qual prontuário).
- `dev-senior` implementa com testes de retenção e exclusão (LGPD-002).

**Regras citadas:** `LGPD-001` a `LGPD-010` + `SEC-001` (criptografia) + `SEC-004` (menor privilégio por papel).

## 3. Fintech — Pix com idempotência

**Cenário:** carteira digital permite transferência via Pix.

**Fluxo:**
```
/feature transferencia via Pix com retentativa segura
```

- `tech-lead` decide: EndToEndId como chave de idempotência.
- `dev-senior` implementa: tabela `transferencias` com unique constraint em E2EID.
- skill `validar-pix` valida chave do destinatário.
- `auditor-qualidade` exige teste: enviar 2x o mesmo E2EID e confirmar que só processa 1x.

**Regras citadas:** `PIX-001` (idempotência) + `PIX-003` (DICT não-cache) + `LGPD-001` (CPF do beneficiário).

## 4. eSocial — domestica + empregado CLT

**Cenário:** sistema de RH precisa enviar evento S-1200 (remuneração).

**Fluxo:**
```
/feature enviar evento eSocial S-1200 de remuneração mensal
```

- `fiscal-br` lista layout S-1200, validação de rubricas (S-1010), TabFis.
- `gerente-produto` escreve US-NNN com AC: "evento aceito pelo eSocial" + "rejeição rastreável por rubrica".
- `tech-lead` decide: gerar XML, validar contra XSD oficial antes de enviar.
- `dev-senior` implementa com **mock zero em integration test** (TST-003 + hook `block-mock-in-integration` barra) — usa ambiente de homologação eSocial.

**Regras citadas:** `FISCAL-003` (homologação obrigatória) + `FISCAL-007` (obrigação acessória) + `TST-003`.

## 5. E-commerce — checkout com Reforma Tributária

**Cenário:** loja online precisa calcular tributo durante transição CBS/IBS (2026-2033).

**Fluxo:**
```
/prd recalculo de tributos no checkout durante reforma tributaria
```

- `analista` levanta LC 214/2025, calendário de transição.
- `fiscal-br` lista FISCAL-006 e gera plano de cálculo paralelo.
- `tech-lead` escreve ADR-NNN: "calcular ICMS + ISS + PIS + COFINS (regime atual) E CBS + IBS (regime novo) em paralelo. Exibir o regime vigente ao usuário, manter o outro pra auditoria."
- `dev-senior` implementa com TDD: 1 teste por ano da transição (2026 → 2033).

**Regras citadas:** `FISCAL-006` + `INV-002` (spec gera código).

## 6. Plataforma de cursos — LGPD + dados de menor

**Cenário:** plataforma EAD recebe alunos menores de 18 (LGPD art. 14).

**Fluxo:**
```
/feature cadastro de aluno menor de idade com consentimento dos pais
```

- `checklist-lgpd` aponta: menor → Art. 14 → consentimento específico dos responsáveis + interesse superior do menor.
- `gerente-produto` escreve US-NNN com AC: "se idade < 18, exigir e-mail do responsável + token de confirmação por e-mail".
- `auditor-seguranca` exige LGPD-002 (rota de exclusão funcional) + LGPD-004 (log de acesso a dado de menor).

**Regras citadas:** `LGPD-001` + `LGPD-002` + `LGPD-004` + `LGPD-007`.

## 7. App municipal — emissão de NFS-e (cada município é diferente)

**Cenário:** sistema pra dentista precisa emitir NFS-e em vários municípios.

**Fluxo:**
```
/feature emissao de NFS-e nos modelos ABRASF, Tinus e Ginfes
```

- `fiscal-br` aponta a fragmentação: ABRASF (maioria), Tinus, Ginfes, modelos proprietários (SP, RJ, BH).
- `tech-lead` escreve ADR-NNN: padrão Strategy pra abstrair provedor.
- `dev-senior` implementa o adapter ABRASF primeiro, com teste de integração contra ambiente de homologação real.

**Regras citadas:** `FISCAL-003` (homologação) + `FISCAL-007` (obrigação acessória).

## 8. Wallet — Open Finance recebimento de dados

**Cenário:** app financeiro pessoal recebe extrato do banco do cliente via Open Finance.

**Fluxo:**
```
/feature integracao Open Finance fase 2 (extrato bancario)
```

- `analista` levanta normas BACEN (Res. CMN 4.943, IN-BCB 230) + LGPD aplicável.
- `tech-lead` decide: token via OAuth 2 + consent ID + DICT/Diretório do BACEN.
- `auditor-seguranca` exige: consent ID logado, token nunca em log, expiração respeitada.
- `dev-senior` implementa com TDD.

**Regras citadas:** `SEC-003` (validar entrada externa) + `LGPD-001` + `LGPD-007` (base = consentimento do titular).

## Padrão geral

Todo caso BR passa pelo mesmo motor:
1. **`analista`** levanta normas aplicáveis.
2. **`gerente-produto`** escreve story/PRD citando IDs.
3. **`tech-lead`** ou **`fiscal-br`** modelam a solução.
4. **Hooks** barram desvios em runtime.
5. **Auditores** confirmam aderência antes do release.

O diferencial do ROLDAO-METHOD é que **cada regra BR tem ID rastreável até o commit**, e os hooks impedem o agente de "esquecer" no meio do caminho.
