---
owner: addon
revisado-em: 2026-05-18
status: stable
---

# varejo-pdv-br — Addon ROLDAO-METHOD para varejo / PDV brasileiro

PDV brasileiro é peculiar: SAT-CF-e exclusivo de SP, MFE só CE, NFC-e em todos os outros, TEF com mensagens específicas (CC44, PixPDV), balança eletrônica com protocolos legados (Toledo, Filizola, Urano), impressora não-fiscal com ESC/POS, e operação que **NÃO PODE PARAR** quando SEFAZ cai (contingência). Este addon traz:

- **1 agente:** `pdv-arch` — decide stack PDV (Electron / desktop nativo / mobile), modelo offline-first, TEF, periféricos.
- **1 hook:** `validate-tef-flow` — alerta se código TEF não segue protocolo (sem CONFIRMACAO_PENDENTE / DESFAZIMENTO).
- **3 skills:**
  - `emitir-sat-cfe` — SAT-CF-e modelo 59 (SP).
  - `emitir-nfce` — NFC-e modelo 65 (demais UF) com BR Code Pix integrado.
  - `integrar-balanca-impressora` — balanças Toledo/Filizola/Urano e impressoras ESC/POS.
- **3 regras:** PDV-001 (offline), PDV-002 (TEF sem PAN), PDV-003 (validar periféricos).

## Quando usar

- Loja física (varejo, alimentação, posto, farmácia, padaria).
- Sistema que precisa operar quando internet cai.
- Integração com TEF (Stone, Cielo, Rede, GetNet, PagSeguro, SafraPay).
- Integração com balança eletrônica (peso) ou impressora térmica de cupom.

## Como instalar

```bash
npx roldao-method add varejo-pdv-br
```

## Regras

### PDV-001 — Operação offline obrigatória

Cliente NÃO pode parar de vender porque SEFAZ caiu. Implementação:

1. Detectar offline (timeout / 5xx do webservice).
2. Continuar emissão local (SAT-CF-e funciona offline; NFC-e exige contingência EPEC ou similar).
3. Fila de sincronização quando voltar.
4. Cliente vê banner "modo offline — sincronizando depois", mas continua operando.

**Anti-padrão:** travar tela "aguardando SEFAZ" — perde venda.

### PDV-002 — TEF sem cartão em texto puro

PAN (número do cartão) **nunca** em:
- Log.
- Banco.
- Mensagem de erro.
- Cupom impresso (só últimos 4 dígitos).
- Crash dump.

Use sempre token do gateway (Stone TID, Cielo TID, etc).
Hook `validate-tef-flow` detecta padrão `\d{13,16}` em proximidade de palavras de cartão e bloqueia.

### PDV-003 — Validar periféricos no startup

PDV não inicia se:
- Balança não responde (se loja usa balança).
- Impressora não imprime cupom-teste (se loja usa impressora).
- SAT/MFE não responde ao comando STATUS.

Cliente prefere ver "PDV não pode abrir, ligue suporte" do que tentar vender e descobrir no caixa que impressora não imprime.

## Cenários cobertos

- **SAT-CF-e mod 59 (SP):** emissão local, retransmissão pendentes, regime tributário.
- **NFC-e mod 65 (demais UF):** com QR Code Pix integrado pra pagamento.
- **MFE-CE (Módulo Fiscal Eletrônico, CE):** equivalente regional ao SAT.
- **ECF (legado):** ainda existe em alguns estabelecimentos — addon suporta migração pra SAT/NFC-e.
- **TEF Discado (legado):** mensagens CC44, integração via DLL — suporte limitado, recomendar TEF Dedicado.
- **TEF Dedicado:** Stone, Cielo, Rede, GetNet, SafraPay — protocolo via TCP/HTTP local.
- **PixPDV:** cobrança Pix integrada ao cupom (NFC-e tem campo dedicado).
- **Sangria / Suprimento:** controle de caixa.
- **Pagamento dividido:** parte dinheiro, parte cartão, parte Pix, parte vale-refeição.
- **Vale-refeição/alimentação:** integrações Ticket, Sodexo, Alelo, VR.
- **Devolução / cancelamento:** dentro de 30 min (NFC-e/SAT).
- **Modo offline:** vendas continuam, sync depois.

## Stack recomendada

| Camada | Recomendação |
|---|---|
| Aplicação | Electron (desktop) ou .NET Forms / WPF |
| Banco local | SQLite (vide addon `electron-br` pra padrões) |
| TEF | Lib do gateway oficial (Stone, Cielo, etc) |
| SAT/NFC-e | Lib `sped-nfe` (PHP), `node-nfe` (Node), `pynfe` (Python), `Zeus.Net.NFe.NFCe` (.NET) |
| Balança | Lib serial nativa (RS-232, USB) — protocolo Toledo, Filizola, Urano |
| Impressora | ESC/POS (genérico) — Bematech, Daruma, Epson |
| Contingência | Fila local (BullMQ se Node, ou DB próprio) |

## Stack TEF — escolha

| Gateway | Protocolo | Recomendação |
|---|---|---|
| Stone | API REST local | ✅ Moderno, bem documentado |
| Cielo | TEF Dedicado | ✅ Maduro, ampla aceitação |
| Rede | TEF Dedicado / API | ✅ |
| GetNet | TEF Dedicado / API | ✅ |
| SafraPay | API local | ✅ |
| PagSeguro | API mobile (não PDV físico tradicional) | ⚠️ Mais pra mobile/standalone |

## Non-goals

- Substituir gateway TEF — addon ajuda integrar, não processa pagamento.
- Substituir lib SAT/NFC-e oficial do estado — addon orienta uso, não emite.
- Cobrir ECF legado completamente — recomendar migração pra SAT/NFC-e (mais barato e moderno).

## Documentação

- SAT-CF-e SP: <https://portal.fazenda.sp.gov.br/servicos/sat>
- NFC-e nacional: <https://www.nfe.fazenda.gov.br>
- MFE-CE: <https://www.sefaz.ce.gov.br>
- Documentação TEF: específica do gateway escolhido
- KB relacionada: `templates/.specify/data/kb-fiscal.md` (seção NFC-e/SAT)
