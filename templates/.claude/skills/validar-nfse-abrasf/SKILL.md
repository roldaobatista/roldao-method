---
name: validar-nfse-abrasf
description: GUIA + checklist de validacao de NFS-e padrao nacional ABRASF/RFB (FISCAL-008). Cobre estrutura XML, campos obrigatorios, modelos coexistentes (Ginfes, Tinus, IPM, DSF, ISSNet, etc.) e versao do schema. Para VALIDAR chave de acesso, use a skill core `validar-chave-acesso-nfe` (modelo 57/58/65/67 para servicos transportados; NFS-e municipal nao tem chave de 44 digitos no padrao SEFAZ). Use ao desenhar emissor de NFS-e novo, auditar fluxo existente, ou planejar migracao do schema municipal pra padrao nacional.
allowed-tools: Read, Glob, Grep
owner: framework
revisado-em: 2026-05-27
status: stable
---

# validar-nfse-abrasf

Skill de **orientacao** (nao validador determinístico). NFS-e nao tem schema unico no Brasil — cada municipio pode usar variante propria, e o padrao nacional ABRASF/RFB (vigente progressivamente desde 2023, reforcado pela LC 214/2025) coexiste com legados como Ginfes, Tinus, IPM, DSF, ISSNet, SigISS, e dezenas de outros.

Esta skill nao gera codigo de validacao — orienta como **modelar a feature** corretamente.

## Quando usar

- Emissor de NFS-e novo: schema alvo deve ser o **padrao nacional ABRASF/RFB** (decisao FISCAL-008).
- Auditoria de emissor existente: confirmar que o schema do municipio emissor esta declarado (nao assumido) + versao.
- Recebimento de NFS-e de fornecedor: validar campos minimos independente do schema.
- Migracao planejada de municipio com padrao proprio (ex: Tinus → padrao nacional).

## Padrao nacional ABRASF/RFB — campos minimos

Schema XSD oficial: <https://www.gov.br/nfse/pt-br>.

| Campo | Obrigatorio | Validacao |
|---|---|---|
| `versao` (atributo do nó raiz) | sim | string semver-like, atualmente `1.00` ou `2.04` (LC 214/2025 evoluindo) |
| `tpAmb` | sim | 1=producao, 2=homologacao (FISCAL-003 — homologacao em dev) |
| `cMunPrest` (codigo municipio prestador) | sim | 7 digitos IBGE — usar skill core `validar-codigo-municipio-ibge` |
| `cnpjPrest` ou `cpfPrest` | sim | usar skill core `validar-cpf-cnpj` (alfanumerico FISCAL-005) |
| `cnpjTomador` ou `cpfTomador` | sim (B2B/B2C) | mesma skill |
| `dCompet` | sim | data competencia AAAA-MM-DD |
| `vServ` (valor servicos) | sim | decimal, >0 |
| `vISS` ou `vISSRet` | depende | aliquota * vServ |
| `cMunIncid` (municipio incidencia ISS) | sim em LC 116 | 7 digitos IBGE |
| `discriminacao` | sim | texto descritivo do servico, max 2000 chars |
| `codigoServico` ou `cListServ` | sim | conforme tabela LC 116/2003 anexa |

## Checklist FISCAL-008 (modelar feature)

- [ ] Coluna `municipio_emissor` + `schema_versao` persistidas explicitamente (nunca assumir 1 unico padrao).
- [ ] Adapter por schema: padrao nacional ABRASF/RFB como default, legados (Ginfes, Tinus, IPM, DSF, ISSNet) atrás de feature flag por municipio.
- [ ] Campo `codigo_servico` ou `cListServ` validado contra tabela LC 116/2003 (atualizada por Decreto a cada algumas legislaturas).
- [ ] Aliquota ISS por municipio em tabela versionada (nao hardcoded por municipio).
- [ ] Tratamento de retencao por tomador estabelecido em UF diferente.
- [ ] Estrutura preparada para Reforma Tributaria 2026-2033 (CBS/IBS coexiste com ISS na transicao — FISCAL-006).

## Anti-padroes

1. **Hardcoded "padrao do municipio X"** — modelar 1 schema apenas. Se o cliente expandir pra outra cidade, retrabalho.
2. **Aliquota ISS hardcoded** — varia por municipio + por codigo de servico. Use tabela.
3. **Confiar que NFS-e tem chave de 44 digitos** — padrao nacional usa `numero` + `cMunPrest` + `serie`. NAO existe chave de acesso unica como na NF-e federal.
4. **Pular `tpAmb`** — emitir contra producao em ambiente de dev gera nota fiscal real (incidente).

## Skill complementar

- `validar-codigo-municipio-ibge` — valida `cMunPrest` e `cMunIncid` (7 digitos, DV mod-10).
- `validar-cpf-cnpj` — valida prestador/tomador (CNPJ alfanumerico FISCAL-005 quando aplicavel).
- `emitir-nfe-55` — fluxo de emissao NF-e mod 55 (referencia de checklist).

## Regulamentacao BR

- **LC 116/2003** — lei geral do ISS, lista de servicos anexa.
- **LC 214/2025** — Reforma Tributaria, transicao 2026-2033.
- **CGSN / RFB / ABRASF** — manutencao do schema nacional.
- **FISCAL-008** (REGRAS-INEGOCIAVEIS.md) — emissor novo modela pelo padrao nacional como alvo.

## Limites

- Esta skill NAO valida XSD do XML (cada schema tem seu proprio). Para validar XSD: chamar parser do schema do municipio emissor.
- NAO confirma autorizacao via webservice — apenas estrutura.
- NAO substitui consultoria fiscal/contador.
