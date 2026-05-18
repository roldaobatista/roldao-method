---
name: validar-webhook-pix
description: Implementa handler de webhook Pix com HMAC, idempotencia e tratamento de status. Use ao receber notificacao do PSP (banco, BaaS) sobre Pix recebido, devolucao ou MED.
---

# validar-webhook-pix

Handler de webhook Pix robusto: assinatura HMAC, idempotência por EndToEndId, lock distribuído, tratamento de status.

## Estrutura padrão

```typescript
import { Request, Response } from 'express';
import crypto from 'crypto';
import { Redis } from 'ioredis';
import { db } from './db';

const redis = new Redis(process.env.REDIS_URL!);

export async function pixWebhookHandler(req: Request, res: Response) {
  // 1. Validar assinatura HMAC — PIX-EXT-002, primeira linha
  if (!validarAssinatura(req)) {
    return res.status(401).send();
  }

  const payload = req.body;
  const e2eId = payload.endToEndId;

  if (!e2eId) {
    return res.status(400).send({ error: 'endToEndId obrigatorio' });
  }

  // 2. Lock distribuido por E2EID
  const lockKey = `pix-webhook:lock:${e2eId}`;
  const lock = await redis.set(lockKey, '1', 'EX', 30, 'NX');
  if (!lock) {
    // outro processo ja esta tratando — retornar 200 (idempotente)
    return res.status(200).send();
  }

  try {
    // 3. Idempotencia: ja processado?
    const existente = await db.pixEvent.findUnique({ where: { e2eId } });
    if (existente?.status === 'processado') {
      return res.status(200).send();
    }

    // 4. Persistir antes de qualquer side effect — PIX-EXT-003
    await db.pixEvent.upsert({
      where: { e2eId },
      create: {
        e2eId,
        txId: payload.txid,
        valor: payload.valor,
        chavePagador: payload.pagador?.cpf || payload.pagador?.cnpj || null,
        nomePagador: payload.pagador?.nome || null,
        recebidoEm: new Date(payload.horario),
        payloadBruto: payload,
        status: 'recebido',
      },
      update: { status: 'recebido', payloadBruto: payload },
    });

    // 5. Processar (atualizar pedido, disparar email, etc.)
    await processarPix(e2eId, payload);

    // 6. Marcar como processado
    await db.pixEvent.update({
      where: { e2eId },
      data: { status: 'processado', processadoEm: new Date() },
    });

    return res.status(200).send();
  } catch (err) {
    // Log com E2EID, sem dado pessoal
    console.error('[pix-webhook] erro', { e2eId, error: (err as Error).message });
    await db.pixEvent.update({
      where: { e2eId },
      data: { status: 'erro', erroMensagem: (err as Error).message },
    });
    return res.status(500).send();
  } finally {
    await redis.del(lockKey);
  }
}

function validarAssinatura(req: Request): boolean {
  // PIX-EXT-002: HMAC ou mTLS dependendo do PSP
  const sig = req.headers['x-pix-signature'] as string;
  if (!sig) return false;

  const secret = process.env.PIX_WEBHOOK_SECRET;
  if (!secret) throw new Error('PIX_WEBHOOK_SECRET nao configurado');

  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  // timing-safe equal
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function processarPix(e2eId: string, payload: any) {
  // matchear com pedido por TxId
  const pedido = await db.pedido.findUnique({ where: { txId: payload.txid } });
  if (!pedido) {
    // Pix recebido sem pedido associado — fluxo de "Pix nao identificado"
    await db.pixNaoIdentificado.create({ data: { e2eId, payload } });
    return;
  }

  if (pedido.status === 'pago') {
    return; // ja pago — idempotencia
  }

  await db.pedido.update({
    where: { id: pedido.id },
    data: {
      status: 'pago',
      pixE2eId: e2eId,
      pagoEm: new Date(payload.horario),
    },
  });

  // disparar pos-processamento async (email, nf-e, etc.)
  await enfileirar('pedido-pago', { pedidoId: pedido.id });
}
```

## Schema do banco recomendado

```sql
CREATE TABLE pix_events (
  e2e_id            VARCHAR(32) PRIMARY KEY,
  tx_id             VARCHAR(35),
  valor             NUMERIC(15, 2) NOT NULL,
  chave_pagador     TEXT,         -- criptografado se LGPD exigir
  nome_pagador      TEXT,
  recebido_em       TIMESTAMPTZ NOT NULL,
  payload_bruto     JSONB NOT NULL,
  status            VARCHAR(20) NOT NULL,  -- recebido | processado | erro
  processado_em     TIMESTAMPTZ,
  erro_mensagem     TEXT,
  criado_em         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pix_events_tx_id ON pix_events(tx_id);
CREATE INDEX idx_pix_events_status ON pix_events(status);
```

## Tratamento de devolução

Webhook de devolução vem com `endToEndIdDevolucao` e referência ao `endToEndIdOriginal`.

```typescript
if (payload.tipo === 'devolucao') {
  const original = await db.pixEvent.findUnique({
    where: { e2eId: payload.endToEndIdOriginal },
  });
  if (!original) {
    // Devolucao de Pix que nao temos registro — investigar
    await db.devolucaoSemOriginal.create({ data: { payload } });
    return;
  }
  // Reverter pedido se status era 'pago'
  if (original.pedidoId) {
    await db.pedido.update({
      where: { id: original.pedidoId },
      data: { status: 'devolvido' },
    });
  }
}
```

## Status comuns

| Status do PSP | Significado | Ação |
|---|---|---|
| `CONCLUIDA` | Pix recebido | Marcar pedido como pago |
| `REMOVIDA_PELO_USUARIO_RECEBEDOR` | Recebedor removeu chave/cob | Cancelar pedido se aplicável |
| `REMOVIDA_PELO_PSP` | PSP removeu | Investigar |
| `DEVOLVIDA` | Pix devolvido (MED ou comum) | Reverter |

## Casos de teste

- [ ] Assinatura inválida → 401, sem persistir nada.
- [ ] Assinatura válida + payload novo → 200, persiste, processa.
- [ ] Mesmo E2EID enviado 2x → 200, processa só 1 vez (idempotência).
- [ ] Mesmo E2EID em paralelo (race) → 1 processa, outro retorna 200.
- [ ] Pix sem TxId associado a pedido → fila de "não identificado".
- [ ] Devolução de Pix conhecido → reverte pedido.
- [ ] Devolução de Pix desconhecido → tabela de exceção.
- [ ] Erro no processamento → status=erro, log estruturado, retry manual possível.

## Anti-padrões

❌ Processar payload **antes** de validar assinatura.
❌ Confiar em IP-only sem assinatura (IP pode mudar).
❌ Não persistir E2EID — perde rastreabilidade pra conciliação.
❌ Log com chave Pix completa.
❌ Lock muito longo (>60s) — segura recursos.
❌ Sem retry no pós-processamento — email/NF-e quebra silenciosamente.
❌ Match por nome+valor em vez de E2EID — falha quando há valores iguais.
