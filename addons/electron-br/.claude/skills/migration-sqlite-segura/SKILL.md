---
name: migration-sqlite-segura
description: Pattern de migracao SQLite com backup automatico antes de aplicar. Use em app Electron com banco local persistente. ELECTRON-003.
---

# migration-sqlite-segura

Migration em app Electron com dado offline do cliente.

## Por que e diferente de migration em servidor

- Servidor: rollback via point-in-time recovery.
- Electron: usuario tem 1 arquivo `.db`. Migration ruim = dado perdido.

## Pattern

```typescript
// main/db/migration-runner.ts
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

const DB_PATH = path.join(app.getPath('userData'), 'app.db');
const BACKUP_DIR = path.join(app.getPath('userData'), 'backups');

export async function runMigration(name: string, sqlUp: string) {
  // 1. Backup ANTES
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(BACKUP_DIR, `${ts}-pre-${name}.db`);
  fs.copyFileSync(DB_PATH, backupPath);

  // 2. Aplicar
  try {
    await db.exec('BEGIN TRANSACTION');
    await db.exec(sqlUp);
    await db.exec('INSERT INTO _migrations (name, applied_at) VALUES (?, ?)',
                  [name, new Date().toISOString()]);
    await db.exec('COMMIT');
  } catch (err) {
    await db.exec('ROLLBACK');
    // 3. Restore se a transacao falhou
    fs.copyFileSync(backupPath, DB_PATH);
    throw err;
  }
}
```

## Tabela de migrations

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);
```

## Regras

- **ELECTRON-003** — Toda migration faz backup em `userData/backups/`.
- Backups antigos limpos automaticamente apos 30 dias (cron interno).
- Migration que altera DADO (UPDATE/DELETE), nao so schema, exige confirmacao do usuario no UI.
- Migration nunca executa em segundo plano sem feedback. Mostrar progresso.

## Anti-padroes

- `DROP TABLE` em migration sem backup.
- Migration que muda PK sem ON CONFLICT plano.
- Migration que apaga coluna com dado pessoal sem aviso ao usuario (LGPD-002 — direito ao esquecimento exige acao do titular, nao automatica).
- Migration sem teste em fixture `.db` real.

## Teste recomendado

```typescript
test('migration adiciona coluna sem perder dado', async () => {
  const fixtureDb = createFixtureDb({ clientes: [{ id: 1, nome: 'X' }] });
  await runMigration('add_email_to_clientes', 'ALTER TABLE clientes ADD COLUMN email TEXT');
  const result = await db.all('SELECT * FROM clientes');
  expect(result).toHaveLength(1);
  expect(result[0].nome).toBe('X');
});
```
