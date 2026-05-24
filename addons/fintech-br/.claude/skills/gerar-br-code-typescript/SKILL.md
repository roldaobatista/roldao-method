---
name: gerar-br-code-typescript
description: Guia de implementação TypeScript pra gerar BR Code (QR Code Pix) padrao EMV. Complementa a skill executável `gerar-br-code` do core (Python) com referência ASCII-strict em TS pra projetos JavaScript/Node. Use quando precisar implementar manualmente no stack TS em vez de invocar a skill Python.
owner: fintech-br
revisado-em: 2026-05-24
status: stable
---

# gerar-br-code-typescript

> **Skill executável vive no core** (`templates/.claude/skills/gerar-br-code/`, Python). Este aqui é **guia de implementação em TypeScript** pra projetos JS/Node que querem incorporar a lógica no próprio bundle em vez de delegar pra skill externa. Foi separado do core na auditoria 10-agentes 2026-05-24 — antes os dois usavam o mesmo slug e colidiam.

BR Code = QR Code Pix no padrão **EMV QR Code Specification** estendido pelo Bacen. Não é "qualquer QR Code" — tem estrutura TLV (Tag-Length-Value) específica.

## Tipos

| Tipo | Quando | Campo 26 |
|---|---|---|
| **Estático** | Mesma chave, valor opcional, sem expiração | Chave Pix direta |
| **Dinâmico** | URL aponta pra payload JWS assinado pelo PSP | URL HTTPS |

## Estrutura TLV (Tag-Length-Value)

Cada campo:
- **Tag**: 2 dígitos.
- **Length**: 2 dígitos (zero-padded).
- **Value**: conteúdo.

Exemplo: `0002BR` = Tag 00, Length 02, Value "BR".

## Campos obrigatórios

| Tag | Nome | Valor |
|---|---|---|
| `00` | Payload Format Indicator | `01` |
| `26` | Merchant Account Info (Pix) | sub-TLV: GUI + chave/URL |
| `52` | Merchant Category Code | MCC ISO 18245 do ramo. Use `0000` apenas pra PF sem categoria. PJ usa o MCC do ramo (ex: `5411` supermercado, `5812` restaurante, `5814` fast-food, `5912` farmácia, `7372` software/SaaS). |
| `53` | Currency | `986` (BRL) |
| `58` | Country Code | `BR` |
| `59` | Merchant Name | até 25 chars, ASCII |
| `60` | Merchant City | até 15 chars |
| `63` | CRC16 | calculado sobre tudo (incluindo `6304`) |

## Campos opcionais

| Tag | Nome | Quando |
|---|---|---|
| `01` | Point of Initiation | `12` = dinâmico |
| `54` | Transaction Amount | quando valor fixo |
| `62` | Additional Data Field | sub-TLV com TxId no `05` |
| `64` | Merchant Information (linguagem) | quando precisa |
| `81` | Unreserved Templates | extensões |

## Sub-TLV do campo 26

```
Tag 26 → Length total → conteúdo:
  Tag 00 → Length → "BR.GOV.BCB.PIX"  (GUI fixo Bacen)
  Tag 01 → Length → chave Pix OU URL (dinâmico)
  Tag 02 → Length → descrição opcional
```

## Sub-TLV do campo 62

```
Tag 62 → Length total → conteúdo:
  Tag 05 → Length → TxId
    - Pix avulso (sem cob/cobv): 1 a 25 chars
    - cob (cobrança imediata): 26 a 35 chars (Manual Pix v2.7+, DICT/SPI-API)
    - cobv (cobrança com vencimento): 26 a 35 chars
```

## Cálculo do CRC16

CRC16/CCITT-FALSE:
- Polinômio: `0x1021`
- Initial value: `0xFFFF`
- Calcula sobre toda a string até e incluindo `"6304"` (tag e length do campo CRC). O valor de 4 dígitos do CRC ainda não existe nesse momento — só é anexado depois.
- Resultado: 4 dígitos hex em maiúsculo.

## Implementação (TypeScript)

```typescript
function tlv(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${tag}${length}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

interface BRCodeInput {
  chavePix: string;        // ou URL dinâmica
  nomeRecebedor: string;   // max 25 ASCII
  cidade: string;          // max 15
  valor?: number;          // BRL, ex 10.50
  txId?: string;           // 1..25 (Pix avulso) ou 26..35 (cob e cobv — exige tamanho mínimo 26)
  mcc?: string;            // Merchant Category Code (4 dígitos ISO 18245); PF sem categoria: '0000'
  descricao?: string;
  dinamico?: boolean;
}

export function gerarBRCode(input: BRCodeInput): string {
  // Escape unicode explicito U+0300-U+036F evita quebra em conversao de encoding
  // (cp1252, copy-paste, JSON transport). Caracteres combinantes literais
  // podem sumir e a string sai com acento, que SEFAZ/PSP rejeita.
  const ascii = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const merchantAccount = [
    tlv('00', 'BR.GOV.BCB.PIX'),
    tlv('01', input.chavePix),
    input.descricao ? tlv('02', input.descricao) : '',
  ].join('');

  const additionalData = input.txId
    ? tlv('05', input.txId)
    : tlv('05', '***');  // padrao quando nao tem

  const payload = [
    tlv('00', '01'),  // payload format
    input.dinamico ? tlv('01', '12') : '',  // point of initiation
    tlv('26', merchantAccount),
    // MCC ISO 18245 — use 0000 só pra PF sem categoria; PJ usa MCC do ramo.
    tlv('52', input.mcc ?? '0000'),
    tlv('53', '986'),
    input.valor ? tlv('54', input.valor.toFixed(2)) : '',
    tlv('58', 'BR'),
    tlv('59', ascii(input.nomeRecebedor).slice(0, 25)),
    tlv('60', ascii(input.cidade).slice(0, 15)),
    tlv('62', additionalData),
  ].join('');

  const withCrcTag = `${payload}6304`;
  const crc = crc16(withCrcTag);

  return `${withCrcTag}${crc}`;
}
```

## Exemplo completo

```typescript
const brCode = gerarBRCode({
  chavePix: 'recebedor@example.com',
  nomeRecebedor: 'Empresa Exemplo Ltda',
  cidade: 'SAO PAULO',
  valor: 99.90,
  txId: 'PEDIDO12345',
});

// Renderize em QR Code (qrcode lib)
import QRCode from 'qrcode';
const qrDataUrl = await QRCode.toDataURL(brCode);
```

## Validações

- [ ] Chave Pix passa pela skill `validar-pix` antes.
- [ ] Nome recebedor em ASCII (sem acentos), max 25 chars.
- [ ] Cidade em ASCII, max 15 chars.
- [ ] Valor com 2 casas decimais, separador `.`.
- [ ] TxId: alfanumérico `[A-Za-z0-9]`. Pix avulso: `{1,25}`. Cobranças `cob` e `cobv`: `{26,35}` (mínimo 26 caracteres — manual Pix v2.7+).
- [ ] CRC16 calculado corretamente.

## Casos de teste

```typescript
test('BR Code básico estático', () => {
  const c = gerarBRCode({
    chavePix: 'recebedor@example.com',
    nomeRecebedor: 'EMPRESA EXEMPLO',
    cidade: 'SAO PAULO',
  });
  expect(c).toMatch(/^00020126/);  // começa com payload format + merchant
  expect(c).toMatch(/5802BR/);     // country code
  expect(c).toMatch(/6304[0-9A-F]{4}$/);  // termina com CRC
});

test('BR Code com valor', () => {
  const c = gerarBRCode({
    chavePix: '12345678909',
    nomeRecebedor: 'TESTE',
    cidade: 'SP',
    valor: 10.5,
  });
  expect(c).toContain('540510.50');  // tag 54 length 05 value 10.50
});
```

## Anti-padrões

❌ Gerar BR Code com nome do recebedor com acento (SEFAZ ASCII strict).
❌ Esquecer CRC16 — QR Code não funciona.
❌ Calcular CRC sem incluir "6304" — Bacen rejeita.
❌ Valor com vírgula (deve ser ponto).
❌ TxId com caractere especial.

## Referências

- Manual BR Code Bacen: <https://www.bcb.gov.br/estabilidadefinanceira/comunicacaodados>
- EMV QR Code Spec: <https://www.emvco.com/emv-technologies/qrcodes/>
- KB: `templates/.specify/data/kb-pix.md`
