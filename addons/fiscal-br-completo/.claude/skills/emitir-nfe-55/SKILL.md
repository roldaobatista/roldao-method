---
name: emitir-nfe-55
description: Guia de implementacao para emissao de NF-e modelo 55 (B2B) com checklist FISCAL-001 a FISCAL-007. Use quando o projeto for emitir NF-e pela primeira vez ou ao auditar emissao existente.
owner: fiscal-br-completo
revisado-em: 2026-05-18
status: stable
---

# emitir-nfe-55

Implementação de emissão de NF-e modelo 55 (Nota Fiscal eletrônica — operação entre PJ ou PJ→PF B2B).

## Pré-requisitos

- [ ] CNPJ do emitente cadastrado na SEFAZ da UF.
- [ ] Inscrição Estadual (IE) ativa.
- [ ] Certificado digital A1 (`.pfx`/`.p12`) ou A3 (token) ICP-Brasil válido.
- [ ] Senha do certificado em **cofre** (Vault / AWS Secrets / Azure Key Vault), nunca em texto puro.
- [ ] Empresa **homologada** em ambiente 2 antes de produção.

## Fluxo de emissão

```
[Pedido] → [Montar XML] → [Assinar (XMLDSig)] → [Validar schema XSD]
   ↓
[Enviar SEFAZ (nfeAutorizacao)] → [Consultar (nfeRetAutorizacao)]
   ↓
   cStat=100 → [Persistir XML autorizado imutável + protocolo + hash]
   cStat=outro → [Tratar conforme codigo]
   timeout → [Contingencia SVC-AN]
```

## Checklist de implementação

### Configuração
- [ ] `SEFAZ_AMBIENTE` em env (1 ou 2). FISCAL-003.
- [ ] `SEFAZ_UF` em env (sigla da UF do emitente).
- [ ] URL do webservice por UF (lista oficial SEFAZ).
- [ ] Certificado carregado de cofre. FISCAL-002.

### XML
- [ ] Schema XSD vigente baixado (versão do MOC atual — verificar Portal NF-e).
- [ ] Assinatura XMLDSig com algoritmo `RSA-SHA-256` (padrão MOC 7.00+, NT 2023.001). `RSA-SHA-1` ainda aceito por algumas UFs por retrocompatibilidade, mas `OpenSSL 3.x` exige `legacy` provider — preferir SHA-256.
- [ ] Chave de acesso 44 dígitos gerada corretamente.
- [ ] Dígito verificador da chave calculado (módulo 11).

### Persistência
- [ ] XML autorizado gravado byte-a-byte como recebido. FISCAL-001 / NFE-002.
- [ ] Hash SHA-256 do XML armazenado em coluna separada.
- [ ] Protocolo de autorização (`nProt`) persistido junto.
- [ ] Backup automático (S3 versionado, replicação cross-region opcional).

### Tributos
- [ ] ICMS calculado conforme regime (Simples Nacional? Lucro Presumido? Real?).
- [ ] PIS/COFINS calculados (cumulativo vs não-cumulativo).
- [ ] **Reforma Tributária 2026-2033**: cálculo paralelo de CBS+IBS+IS conforme cronograma. NFE-003.
- [ ] Substituição tributária (ST) tratada quando aplicável.
- [ ] DIFAL interestadual quando destinatário em outra UF.

### Contingência (FISCAL-004)
- [ ] Modo SVC-AN ou SVC-RS configurado.
- [ ] Fila de retransmissão automática quando SEFAZ voltar.
- [ ] Alerta operacional quando contingência for ativada.
- [ ] Limite de 168h respeitado.

### Pós-emissão
- [ ] Cancelamento em até 24h implementado.
- [ ] CC-e (Carta de Correção) suportada, máx 20 por nota.
- [ ] Inutilização de numeração tratada.
- [ ] Status `cStat` mapeado pra ação:
  - `100` Autorizado — sucesso.
  - `101` Cancelado.
  - `135` Evento registrado.
  - `204` Duplicidade — não emitir de novo.
  - `217` Não consta — investigar antes de reemitir.

## Pseudocódigo (Node.js exemplo)

```typescript
import { z } from 'zod';
import { signXML } from './sign';
import { sendToSefaz } from './sefaz-client';
import { calcSha256 } from './crypto';
import { saveXmlAutorizado } from './storage';

const EmissaoSchema = z.object({
  tenantId: z.string().uuid(),
  pedido: z.object({ /* ... */ }),
});

export async function emitirNFe55(payload: unknown) {
  const data = EmissaoSchema.parse(payload);

  const ambiente = process.env.SEFAZ_AMBIENTE;
  if (!['1', '2'].includes(ambiente ?? '')) {
    throw new Error('SEFAZ_AMBIENTE invalido');
  }

  const cert = await loadCertificateForTenant(data.tenantId);  // do cofre
  validarCertificado(cert);  // NFE-001: vencimento + match CNPJ

  const xml = montarXML(data, ambiente);
  const xmlSigned = signXML(xml, cert);
  validarSchema(xmlSigned);  // contra XSD

  const resp = await sendToSefaz(xmlSigned, { uf: process.env.SEFAZ_UF });

  if (resp.cStat === '100') {
    const hash = calcSha256(resp.xmlAutorizado);
    await saveXmlAutorizado({
      tenantId: data.tenantId,
      chaveAcesso: resp.chave,
      xml: resp.xmlAutorizado,  // imutavel
      hash,
      protocolo: resp.nProt,
      cStat: resp.cStat,
    });
    return { sucesso: true, chave: resp.chave };
  }

  return await tratarErroSefaz(resp);
}
```

## Erros comuns

- **Schema desatualizado:** Receita Federal publica novo MOC; verificar trimestralmente.
- **Certificado vencido em produção:** alerta 30 dias antes obrigatório.
- **CNPJ alfanumérico não aceito** (pós-jul/2026): regex `[0-9]{14}` precisa virar `[0-9A-Z]{14}` — FISCAL-005.
- **Timeout sem retry:** SEFAZ instável; implementar retry com backoff exponencial.
- **Duplicidade (cStat=204):** chave já autorizada; consultar antes de reemitir.

## Referências

- Portal NF-e: <https://www.nfe.fazenda.gov.br/>
- MOC atual: baixar do portal (mudança trimestral comum).
- Schemas XSD: portal SEFAZ.
- KB ROLDAO: `templates/.specify/data/kb-fiscal.md`.
