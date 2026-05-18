---
owner: addon
revisado-em: 2026-05-18
status: stable
---

# fiscal-br-completo — Addon ROLDAO-METHOD para emissão fiscal BR

Sistema fiscal brasileiro é complexo: NF-e, NFC-e, NFS-e municipal, CT-e, MDF-e — cada um com webservice próprio por UF/município, schemas que mudam, certificado por tenant, contingência quando SEFAZ cai, Reforma Tributária 2026-2033 trocando ICMS+PIS+COFINS+ISS por CBS+IBS+IS. Este addon traz:

- **1 agente:** `nfe-arch` — decide stack fiscal (biblioteca vs SaaS, ambiente, contingência, Reforma).
- **1 hook:** `require-sefaz-env` — barra emissão se `SEFAZ_AMBIENTE` não está em env (FISCAL-003).
- **2 skills:** `emitir-nfe-55` (template + checklist), `migrar-cnpj-alfanumerico` (guia de migração; para validar de fato use a skill core `validar-cpf-cnpj`, que já cobre alfanumérico pós-jul/2026).
- **3 regras novas:** `NFE-001`, `NFE-002`, `NFE-003`.

## Quando usar

- Sistema emite ou recebe NF-e / NFS-e / NFC-e.
- Sistema calcula tributo (ICMS, PIS, COFINS, ISS, CBS, IBS).
- Sistema precisa estar pronto pra Reforma Tributária 2026-2033.

## Como instalar (manual)

Copie `addons/fiscal-br-completo/.claude/` pro `.claude/` do seu projeto. Mescle `settings.json` adicionando o hook.

## Regras

> Fonte de verdade: `addon.yaml`. Esta seção espelha o manifesto.

### NFE-001 — Ambiente SEFAZ via variável
Nunca hardcode produção/homologação. O ambiente (`SEFAZ_AMBIENTE`) vem de env — o hook `require-sefaz-env` barra emissão se não estiver definido. FISCAL-002 (certificado/senha fora do código) vale junto.

### NFE-002 — Suporte CNPJ alfanumérico (jul/2026)
Todo input/output de CNPJ aceita 14 caracteres alfanuméricos. Validador atualizado — use a skill core `validar-cpf-cnpj`.

### NFE-003 — Contingência SVC obrigatória
Se a SEFAZ da UF cair, o sistema faz fallback automático para SVC-RS ou SVC-AN, com fila de retransmissão. Sem contingência, emissão para quando a SEFAZ oscila.

> Boas práticas relacionadas (cobertas por IDs FISCAL-*): validar certificado antes do lote, persistir o XML autorizado com hash SHA-256, e cálculo tributário paralelo (ICMS/PIS/COFINS/ISS + CBS/IBS/IS) durante a transição da Reforma 2026-2033.

## Cenários cobertos

- Emissão NF-e mod 55 (B2B) em homologação e produção, com retry exponencial.
- NFC-e mod 65 (varejo) com BR Code de pagamento Pix integrado.
- NFS-e municipal — adapter por ABRASF / Ginfes / Tinus / próprio.
- CT-e (transporte) com referência à NF-e do remetente.
- MDF-e (manifesto) consolidando notas.
- Contingência SVC-AN/SVC-RS/EPEC com fila de retransmissão.
- CC-e (Carta de Correção Eletrônica) — máx 20 por nota.
- Cancelamento dentro de 24h (prazo padrão sem ônus; extemporâneo é possível em várias UFs em prazo maior, com penalidade — verificar legislação da UF).
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
