---
name: emitir-nfce
description: Guia de implementação para emissão de NFC-e modelo 65 (Nota Fiscal de Consumidor Eletrônica) — varejo em todas as UF EXCETO SP (que usa SAT) e CE (que usa MFE). Inclui integração com BR Code Pix.
---

# emitir-nfce

NFC-e (mod 65) é o documento fiscal de venda ao consumidor final em **todas as UFs exceto SP (SAT) e CE (MFE)**. Diferente da NF-e (mod 55, B2B), a NFC-e:

- É **online** (autoriza com SEFAZ em tempo real).
- Tem **contingência** quando SEFAZ cai (EPEC ou similar).
- Imprime em impressora não-fiscal com **QR Code obrigatório** pra consumidor consultar.

## Quando usar

- PDV em qualquer UF que NÃO seja SP nem CE.
- Substituição de ECF (legado).
- Venda B2C onde cliente quer comprovante fiscal mas não exige NF-e completa.

## Características

- **Online por design.** Cliente sai com cupom autorizado.
- **Contingência:** EPEC (Evento Prévio Emissão Contingência) ou modo offline próprio da UF.
- **QR Code obrigatório.** Cliente lê com app SEFAZ ou banco pra consultar autenticidade.
- **Pode incluir QR Pix.** Cliente paga Pix vendo o QR no próprio cupom.

## Estrutura mínima do XML NFC-e

Similar à NF-e mod 55, com diferenças:

- `mod = 65` (vs 55 da NF-e)
- `tpNF = 1` (saída)
- `idDest = 1` (operação interna — venda no balcão)
- `indFinal = 1` (consumidor final)
- `indPres = 1` (presencial — balcão)
- Dispensa identificação obrigatória do destinatário (CPF opcional)
- `tpImp = 4` (DANFE NFC-e em impressora não-fiscal) OU `tpImp = 5` (sem impressão — só QR)
- Inclui bloco `infNFeSupl` com `qrCode` (URL gerada conforme manual)

## QR Code da NFC-e

Calculado conforme manual SEFAZ:
```
https://www.sefaz.<UF>.gov.br/nfce/consulta?p=<chaveNFCe>|<versao>|<tpAmb>|<idCSC>|<csc-hash>
```

Onde:
- `chaveNFCe`: 44 chars
- `versao`: 2 (versão atual)
- `tpAmb`: 1=prod, 2=homolog
- `idCSC`: ID do CSC cadastrado no portal SEFAZ
- `csc-hash`: SHA-1 da concatenação chave+CSC

## BR Code Pix integrado

Campo `infPagto.detPag.tPag = 17` (Pix). NFC-e suporta múltiplos pagamentos (dividido).

Para incluir QR Pix dinâmico no cupom:
1. Gerar BR Code Pix usando skill `gerar-br-code` (addon `fintech-br`).
2. TxId determinístico: `NFCe-<nNF>-<cNF>` (35 chars max).
3. Cupom imprime QR Pix + QR NFC-e separados (cliente pode pagar pelo Pix antes de receber o cupom).

## Checklist de implementação

- [ ] CSC (Código de Segurança do Contribuinte) cadastrado em cada UF que vai operar.
- [ ] Webservice da UF correto (cada UF tem URL própria).
- [ ] Contingência EPEC implementada (operação continua se SEFAZ cair).
- [ ] QR Code calculado e impresso corretamente.
- [ ] Modo de pagamento (`tPag`) cobre Pix (17), Cartão Crédito (03), Débito (04), Dinheiro (01), Vale-refeição (10).
- [ ] Cancelamento até 30 min do original (evento de cancelamento).
- [ ] Inutilização de numeração (`nNF` que não foi usada) — limpa pendência.
- [ ] CFOP/NCM/CST corretos por produto.
- [ ] Cálculo de tributos por UF (alíquotas variam).
- [ ] Reforma Tributária 2026-2033 — paralelo CBS+IBS (ver FISCAL-006).
- [ ] Cupom impresso com últimos 4 dígitos do cartão (PDV-002).

## Contingência (EPEC)

Quando SEFAZ não responde em < 5s:
1. PDV continua emitindo (numera localmente).
2. Marca como `tpEmis = 4` (Contingência EPEC).
3. Quando SEFAZ volta: transmite EPEC primeiro (autoriza emergência), depois NF-e formal.
4. Cliente já tem cupom em mãos com QR e ID.

Outros modos: `tpEmis = 9` (Contingência Offline NFC-e — só em alguns estados).

## Anti-padrões

| Errado | Por quê | Certo |
|---|---|---|
| Travar PDV se SEFAZ cair | Perde venda | Contingência EPEC |
| Sem QR Code | NFC-e exige | Calcular conforme manual |
| `tpAmb=1` hardcoded | Vai pra produção em dev | Variável de ambiente (FISCAL-003) |
| CSC commitado em código | Equivalente a senha de produção | Variável de ambiente (FISCAL-002) |
| Sem inutilização de numeração | Vira pendência fiscal | Job diário |
| BR Code Pix com TxId aleatório | Vira difícil rastrear | TxId determinístico (NFCe-nNF-cNF) |

## Stack recomendada

| Linguagem | Lib NFC-e |
|---|---|
| PHP | `sped-nfe` (padrão de mercado) |
| Node.js | `node-nfe` (limitada) ou SaaS (PlugNotas, NFE.io) |
| Python | `pynfe` (open-source) |
| .NET | `Zeus.Net.NFe.NFCe` |
| Java | `nfe-utils` |

## Documentação

- Portal Nacional NFC-e: <https://www.nfe.fazenda.gov.br/portal/principal.aspx>
- Manual de Orientação do Contribuinte NFC-e (NT 2013/005 e atualizações).
- KB: `templates/.specify/data/kb-fiscal.md`
- Skills relacionadas: `emitir-sat-cfe` (SP), `gerar-br-code` (Pix integrado).
