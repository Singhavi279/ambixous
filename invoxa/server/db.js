// Database layer: libSQL (Turso in production, a local SQLite file for development and tests).
// Mirrors the small better-sqlite3 surface the app uses, but every call is async.
const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

const SCHEMA = `
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      gstin TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      archived INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price INTEGER DEFAULT 0,          -- paise
      unit TEXT DEFAULT '',
      activity TEXT DEFAULT '',         -- friendly group, e.g. "Advertising"
      archived INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY,
      number TEXT UNIQUE,               -- NULL while draft
      status TEXT NOT NULL DEFAULT 'draft',   -- draft | issued | void
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      issue_date TEXT NOT NULL,
      terms_days INTEGER NOT NULL DEFAULT 10,
      due_date TEXT NOT NULL,
      reference TEXT DEFAULT '',
      period_start TEXT,
      period_end TEXT,
      subtotal INTEGER NOT NULL DEFAULT 0,
      discount INTEGER NOT NULL DEFAULT 0,
      tax_rate REAL NOT NULL DEFAULT 0,
      tax INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      recurring_id INTEGER,
      sent_at TEXT,
      void_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_inv_customer ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_inv_due ON invoices(due_date);

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      position INTEGER NOT NULL DEFAULT 0,
      service_id INTEGER,
      description TEXT NOT NULL,
      activity TEXT DEFAULT '',
      qty REAL NOT NULL DEFAULT 1,
      unit TEXT DEFAULT '',
      rate INTEGER NOT NULL DEFAULT 0,
      amount INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      method TEXT DEFAULT '',
      reference TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS counters (fy TEXT PRIMARY KEY, last INTEGER NOT NULL);

    CREATE TABLE IF NOT EXISTS recurring (
      id INTEGER PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      items TEXT NOT NULL,               -- JSON [{description, qty, unit, rate, activity, service_id}]
      every_months INTEGER NOT NULL DEFAULT 1,
      day_of_month INTEGER NOT NULL DEFAULT 1,   -- 1-31, 0 = last day
      start_date TEXT NOT NULL,
      end_date TEXT,
      next_run TEXT,
      terms_days INTEGER NOT NULL DEFAULT 10,
      reference TEXT DEFAULT '',
      period_mode TEXT NOT NULL DEFAULT 'this',  -- previous | this | next
      auto_send INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      last_run TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY,
      invoice_id INTEGER,
      kind TEXT DEFAULT 'invoice',       -- invoice | reminder | test
      to_addr TEXT,
      subject TEXT,
      status TEXT,                       -- sent | failed | not_set_up
      error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminders_sent (
      invoice_id INTEGER NOT NULL, kind TEXT NOT NULL, at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (invoice_id, kind)
    );

    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY,
      at TEXT DEFAULT CURRENT_TIMESTAMP,
      action TEXT, entity TEXT, entity_id INTEGER, detail TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'ca',     -- admin | ca
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
`;

const plain = (rs) => rs.rows.map((r) => ({ ...r }));

// `runner` is either the client or an open transaction; both expose execute().
function api(runner, begin) {
  const exec = (sql, args) => runner.execute({ sql, args });
  const self = {
    prepare: (sql) => ({
      get: async (...args) => plain(await exec(sql, args))[0],
      all: async (...args) => plain(await exec(sql, args)),
      run: async (...args) => {
        const rs = await exec(sql, args);
        return { changes: rs.rowsAffected, lastInsertRowid: rs.lastInsertRowid == null ? null : Number(rs.lastInsertRowid) };
      },
    }),
    // All-or-nothing. Inside an open transaction it simply joins it.
    transaction: begin ? begin : async (fn) => fn(self),
  };
  return self;
}

async function open(url) {
  const target = url || process.env.INVOXA_DATABASE_URL || (() => {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    return `file:${path.join(DATA_DIR, 'invoicing.db')}`;
  })();
  const client = createClient({ url: target, authToken: process.env.INVOXA_AUTH_TOKEN });
  const begin = async (fn) => {
    const tx = await client.transaction('write');
    try {
      const out = await fn(api(tx));
      await tx.commit();
      return out;
    } catch (e) {
      await tx.rollback();
      throw e;
    } finally {
      tx.close();
    }
  };
  const db = api(client, begin);
  await client.execute('PRAGMA foreign_keys = ON');
  await client.executeMultiple(SCHEMA);
  await client.execute("UPDATE users SET role='super_admin' WHERE role='admin'");
  // Columns added after the first release (checked one by one so reruns are harmless).
  for (const [table, column, ddl] of [
    ['audit', 'by_user', 'TEXT'],
    ['invoice_items', 'details', "TEXT DEFAULT ''"],
    ['invoices', 'signer', "TEXT DEFAULT ''"],
    ['recurring', 'signer', "TEXT DEFAULT ''"],
    ['invoices', 'show_upi', 'INTEGER DEFAULT 0'],
    ['recurring', 'show_upi', 'INTEGER DEFAULT 0'],
  ]) {
    const has = await client.execute({ sql: 'SELECT 1 FROM pragma_table_info(?) WHERE name = ?', args: [table, column] });
    if (!has.rows.length) await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
  return db;
}

module.exports = { open, DATA_DIR };
