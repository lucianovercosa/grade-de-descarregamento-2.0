import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to SQLite DB
const dbFile = path.join(dataDir, 'local.db');
export const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Create Roles
    db.run(`CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      permissions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create Users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      name TEXT,
      must_change_password INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create Vehicles
    db.run(`CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      daily_sequence INTEGER,
      plate TEXT,
      driver TEXT,
      driver_phone TEXT,
      transporter TEXT,
      supplier TEXT,
      invoice_number TEXT,
      items TEXT,
      attachments TEXT,
      forklift_user_id TEXT,
      forklift_name TEXT,
      notes TEXT,
      public_token TEXT,
      progress_status TEXT,
      progress_percent INTEGER,
      started_at DATETIME,
      analysis_started_at DATETIME,
      analysis_finished_at DATETIME,
      unload_started_at DATETIME,
      finished_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      images TEXT
    )`);

    // Create Product Catalog
    db.run(`CREATE TABLE IF NOT EXISTS products (
      code TEXT PRIMARY KEY,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create Responsibles
    db.run(`CREATE TABLE IF NOT EXISTS responsibles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )`);

    // Create Chat Messages
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      text TEXT,
      user_id TEXT,
      user_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reply_to TEXT,
      read_by TEXT
    )`);

    // Seed default roles and admin
    db.get('SELECT count(*) as count FROM roles', (err, row: any) => {
      if (row && row.count === 0) {
        const stmt = db.prepare('INSERT INTO roles (id, name, permissions) VALUES (?, ?, ?)');
        stmt.run('admin', 'admin', JSON.stringify(['manage_vehicles', 'manage_products', 'manage_users', 'manage_responsibles', 'manage_roles', 'view_dashboard', 'view_tv']));
        stmt.run('mro', 'mro', JSON.stringify(['manage_vehicles', 'view_dashboard']));
        stmt.run('empilhador', 'empilhador', JSON.stringify(['manage_vehicles', 'view_dashboard']));
        stmt.run('tv', 'tv', JSON.stringify(['view_tv']));
        stmt.finalize();
      }
    });

    db.get('SELECT count(*) as count FROM users', async (err, row: any) => {
      if (row && row.count === 0) {
        const bcrypt = await import('bcryptjs');
        const hash = await bcrypt.hash('123456', 10);
        db.run(
          'INSERT INTO users (uid, email, username, password, role, name, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
          ['admin_uid', 'admin@local.com', 'admin', hash, 'admin', 'Administrador', 1]
        );
      }
    });
  });
}

// Promisify DB methods for easier use in routes
export const dbRun = (sql: string, params: any[] = []): Promise<sqlite3.RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

export const dbGet = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
};

export const dbAll = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
};
