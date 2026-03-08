/**
 * db.js — Synchronous-style SQLite database using sql.js (pure WASM, no native bindings)
 * Data is persisted to disk on every write.
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.VERCEL ? '/tmp/hotel.db.bin' : path.join(__dirname, 'hotel.db.bin');

// ─── Sync-style DB wrapper ────────────────────────────────────────────────
// We expose a synchronous interface identical to better-sqlite3 so routes
// don't need to change. sql.js is fully synchronous internally, we just need
// to handle the initialization async once.

let _db = null;

function saveDb() {
  if (!_db) return;
  try {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.warn('Aviso: Não foi possível salvar o banco no disco, rodando apenas em memória.', err.message);
  }
}

function prepare(sql) {
  return {
    get: (...params) => {
      const stmt = _db.prepare(sql);
      stmt.bind(flatten(params));
      const result = stmt.step() ? stmt.getAsObject() : undefined;
      stmt.free();
      return result;
    },
    all: (...params) => {
      const stmt = _db.prepare(sql);
      stmt.bind(flatten(params));
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },
    run: (...params) => {
      _db.run(sql, flatten(params));
      const changes = _db.getRowsModified();
      const idRes = _db.prepare('SELECT last_insert_rowid() as id');
      idRes.step();
      const { id } = idRes.getAsObject();
      idRes.free();
      saveDb();
      return { changes, lastInsertRowid: id };
    },
  };
}

function flatten(params) {
  if (params.length === 0) return [];
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  return params;
}

function exec(sql) {
  // sql.js only handles ONE statement per run() call, so we must split.
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.match(/^--/));
  for (const stmt of stmts) {
    try { _db.run(stmt + ';'); } catch (e) { /* ignore IF NOT EXISTS errors */ }
  }
  saveDb();
}

function pragma(str) {
  _db.run(`PRAGMA ${str};`);
}

const db = {
  get prepare() { return prepare; },
  exec,
  pragma,
};

// ─── Schema ────────────────────────────────────────────────────────────────
const SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    number TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    floor INTEGER NOT NULL,
    price_per_night REAL NOT NULL,
    status TEXT DEFAULT 'available',
    capacity INTEGER DEFAULT 2,
    description TEXT,
    amenities TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cpf TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    nationality TEXT DEFAULT 'Brasileiro',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER NOT NULL,
    room_id INTEGER NOT NULL,
    check_in_date TEXT NOT NULL,
    check_out_date TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed',
    adults INTEGER DEFAULT 1,
    children INTEGER DEFAULT 0,
    total_amount REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (guest_id) REFERENCES guests(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );

  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reservation_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    notes TEXT,
    charged_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    method TEXT NOT NULL,
    notes TEXT,
    paid_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
  );
`;

/**
 * Initialize the db — must be called once at startup (async)
 */
async function initDb() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }
  // Run schema (CREATE TABLE IF NOT EXISTS is idempotent)
  exec(SCHEMA);
  // saveDb() is already called inside exec()
  return db;
}

module.exports = { db, initDb };
