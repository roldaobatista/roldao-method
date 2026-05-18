---
name: integrar-balanca-impressora
description: Guia de integração com balança eletrônica (Toledo, Filizola, Urano) e impressora não-fiscal ESC/POS (Bematech, Daruma, Epson, Elgin). Cobre RS-232, USB, Ethernet, protocolos legados.
---

# integrar-balanca-impressora

Periféricos de PDV são metade do trabalho. Cada marca/modelo tem protocolo levemente diferente. Esta skill orienta a integração robusta com validação no startup (PDV-003).

## Balanças

### Tipos

| Tipo | Onde se usa | Protocolo |
|---|---|---|
| **Balança computadora** (com display + teclado) | Açougue, padaria, hortifruti, deli | Serial (RS-232) ou USB serial — texto ASCII |
| **Balança de checkout** (sob o caixa) | Supermercado, loja de conveniência | Serial / USB-HID — protocolo numérico |
| **Balança de plataforma** (chão, > 5kg) | Atacado, distribuidor | Serial / Ethernet |
| **Balança de bancada** (≤ 5kg) | Farmácia (gramas) | Serial / USB |

### Protocolos comuns

| Marca | Modelos | Protocolo padrão |
|---|---|---|
| Toledo | Prix III, MGV6, MS, Eclipse | Protocolo Toledo (ASCII) |
| Filizola | CS, ST, BP | Protocolo Filizola (ASCII, similar Toledo) |
| Urano | POP-S, US | Protocolo Urano (ASCII) |
| Magna | classe III | Protocolo próprio |

**Boa prática:** abstrair atrás de interface `Balanca` com método `lerPeso(): {peso, unidade, estavel}`. Adapter por marca.

### Padrão Toledo Prix (mais comum)

```
PC envia: ENQ (0x05)
Balança responde: <STX>P<peso>UN<EOT>
Exemplo: <STX>P12345UN<EOT>  → 12.345 kg estável
       : <STX>P00000UN<EOT>  → 0 (sem produto)
       : <STX>I<EOT>          → instável
       : <STX>N<EOT>          → sobrecarga
```

### Validação no startup (PDV-003)

```javascript
async function startupBalanca() {
  try {
    const peso = await balanca.lerPeso({timeout: 2000});
    return peso !== null;  // qualquer leitura OK serve
  } catch (e) {
    throw new Error('Balança não responde — verificar cabo serial');
  }
}
```

## Impressoras não-fiscais

### Tipos

| Tipo | Onde se usa | Conexão |
|---|---|---|
| **Térmica de cupom** (58mm/80mm) | PDV (cupom curto) | USB / serial / Ethernet |
| **Térmica de etiqueta** | Logística, varejo | USB / Ethernet |
| **Matricial** (impacto) | Comprovantes em via carbono (legado) | Paralela / USB |

### Protocolos

| Marca | Modelos | Protocolo |
|---|---|---|
| Bematech | MP-4200 TH, MP-2800 TH | ESC/POS Bematech (extensão proprietária do ESC/POS) |
| Daruma | DR700, DR800 | ESC/POS Daruma |
| Epson | TM-T20, TM-T88 | ESC/POS Epson (padrão de fato) |
| Elgin | i9, i7 | ESC/POS Elgin |
| Sweda | SI-300 | ESC/POS Sweda |

**Padrão de mercado:** ESC/POS Epson é o "lingua franca". 95% das impressoras térmicas BR aceitam.

### Comandos ESC/POS básicos

```
\x1B@           → init (reset)
\x1Ba\x01       → centralizar texto
\x1Bb\x02       → tamanho 2x
texto
\n
\x1Bd\x05       → feed 5 linhas
\x1DV\x42\x00   → corte parcial
\x1D(L...      → QR Code (com parâmetros)
```

### Validação no startup (PDV-003)

```javascript
async function startupImpressora() {
  try {
    await impressora.imprimir({
      texto: '=== CUPOM-TESTE ===\n',
      corte: false,
    });
    return true;
  } catch (e) {
    throw new Error('Impressora não responde — verificar USB/papel');
  }
}
```

### Imprimir QR Code (cupom NFC-e ou Pix)

ESC/POS tem comando nativo:
```
GS ( L pL pH cn fn [c2 mode]    → seleciona modelo (modelo 2 é o padrão)
GS ( L pL pH cn fn [c2 size]    → tamanho do módulo (1-16)
GS ( L pL pH cn fn [c2 lvl]     → nível de correção de erro (L/M/Q/H)
GS ( L pL pH cn fn [c2 store]   → carrega dados
GS ( L pL pH cn fn [c2 print]   → imprime
```

Recomendado: módulo size 6-8 (legível mesmo com cupom amassado).

## Anti-padrões

| Errado | Por quê | Certo |
|---|---|---|
| Hardcode COM3 / COM1 no código | Cada PDV tem porta diferente | Variável de ambiente ou config UI |
| Sem retry em leitura de balança | Leitura instantânea pode falhar | Retry 2x com timeout 200ms |
| QR Code pequeno (módulo 2-3) | Cliente não consegue ler | Módulo 6-8 |
| Sem cupom-teste no startup | Caixa abre, vende, descobre que não imprime | Validar PDV-003 |
| Driver Windows-only | Mac/Linux não funciona | Lib cross-platform (escpos, etc) |

## Stack recomendada

| Linguagem | Lib |
|---|---|
| Node.js | `node-escpos` (ESC/POS); `serialport` (balança) |
| Python | `python-escpos`; `pyserial` |
| .NET | `EscPosNet`; `System.IO.Ports` (SerialPort) |
| Java | `escpos-coffee`; `jSerialComm` |

## Documentação

- ESC/POS Reference: <https://reference.epson-biz.com/modules/ref_escpos/>
- Manuais de balança: site do fabricante (Toledo, Filizola, Urano)
- KB: `templates/.specify/data/kb-stack-br.md`
