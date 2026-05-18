---
owner: addon
revisado-em: 2026-05-18
status: stable
---

# fiscal-br-completo — Addon ROLDAO-METHOD para emissão fiscal BR

Sistema fiscal brasileiro é complexo: NF-e, NFC-e, NFS-e municipal, CT-e, MDF-e — cada um com webservice próprio por UF/município, schemas que mudam, certificado por tenant, contingência quando SEFAZ cai, Reforma Tributária 2026-2033 trocando ICMS+PIS+COFINS+ISS por CBS+IBS+IS. Este addon traz:

- **1 agente:** `nfe-arch` — decide stack fiscal (biblioteca vs SaaS, ambiente, contingência, Reforma).
- **1 hook:** `require-sefaz-env` — barra emissão se `SEFAZ_AMBIENTE` não está em env (FISCAL-003).
- **2 skills:** `emitir-nfe-55` (template + checklist), `validar-cnpj-alfanumerico` (algoritmo módulo 11 com letras pós-jul/2026).
- **3 regras novas:** `NFE-001`, `NFE-002`, `NFE-003`.

## Quando usar

- Sistema emite ou recebe NF-e / NFS-e / NFC-e.
- Sistema calcula tributo (ICMS, PIS, COFINS, ISS, CBS, IBS).
- Sistema precisa estar pronto pra Reforma Tributária 2026-2033.

## Como instalar (manual)

Copie `addons/fiscal-br-completo/.claude/` pro `.claude/` do seu projeto. Mescle `settings.json` adicionando o hook.

## Regras

### NFE-001 — Validar certificado antes de emitir
Antes de cada lote de emissão, validar:
- Certificado não vencido.
- Certificado bate com CNPJ emissor.
- Senha não em texto puro no código (FISCAL-002 vale junto).

### NFE-002 — Persistir XML autorizado por hash
XML autorizado pela SEFAZ tem hash SHA-256 calculado e persistido junto. Auditoria de integridade detecta alteração.

### NFE-003 — Calcular tributo paralelo durante Reforma Tributária (2026-2033)
Durante a transição, NF-e tem ambos:
- Regime atual: ICMS, PIS, COFINS, ISS conforme operação.
- Regime novo: CBS + IBS + IS conforme alíquotas vigentes.

Sistema configura alíquotas por UF e por período.

## Cenários cobertos

- Emissão NF-e mod 55 (B2B) em homologação e produção, com retry exponencial.
- NFC-e mod 65 (varejo) com BR Code de pagamento Pix integrado.
- NFS-e municipal — adapter por ABRASF / Ginfes / Tinus / próprio.
- CT-e (transporte) com referência à NF-e do remetente.
- MDF-e (manifesto) consolidando notas.
- Contingência SVC-AN/SVC-RS/EPEC com fila de retransmissão.
- CC-e (Carta de Correção Eletrônica) — máx 20 por nota.
- Cancelamento dentro de 24h (limite legal).
- Cálculo paralelo ICMS + CBS + IBS na transição da Reforma.
- CNPJ alfanumérico aceito a partir de jul/2026.

## Non-goals

- Geração de XML de Conhecimento de Embarque (BL) e docs aduaneiros (use sistema dedicado).
- IRPF/IRPJ — fora do escopo (usa contábil).
- Homologação automatizada em SEFAZ — precisa intervenção humana (cadastro de empresa).
- Substituição de ERP — este addon entra como camada fiscal, não ERP completo.

## Stack recomendada

| Linguagem | Lib recomendada |
|---|---|
| Node.js | `node-nfe`, `sped-nfe` ou SaaS (PlugNotas, NFE.io) |
| Python | `pynfe` (open-source) ou `erpbrasil-edoc` |
| .NET | `Zeus.Net.NFe.NFCe` |
| Java | `nfe-utils` ou Migrate |
| Go | `gonfe` (limitado, considerar SaaS) |

## Documentação

- Ver `templates/.specify/templates/prd-fiscal.md` (template PRD fiscal).
- Ver `templates/.specify/checklists/fiscal-compliance.md` (checklist).
- Ver `templates/.specify/data/kb-fiscal.md` (knowledge base).
