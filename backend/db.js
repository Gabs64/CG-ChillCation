import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supports Railway Persistent Volumes or environment overrides
let dbPath;
if (process.env.DATABASE_PATH) {
  dbPath = process.env.DATABASE_PATH;
} else if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
  dbPath = path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'cg_chillcation.db');
} else if (fs.existsSync('/data')) {
  dbPath = '/data/cg_chillcation.db';
} else {
  dbPath = path.resolve(__dirname, 'cg_chillcation.db');
}

// Ensure parent folder exists
try {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (e) {
  console.warn('Notice ensuring db directory:', e.message);
}

const verboseSqlite = sqlite3.verbose();

export const db = new verboseSqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const initDb = async () => {
  // 1. Rooms Table (with v2.0 fields: is_featured, google_maps_url, updated_at)
  await run(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_name TEXT UNIQUE NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      price_per_night REAL NOT NULL DEFAULT 2500,
      status TEXT NOT NULL DEFAULT 'AVAILABLE',
      is_featured INTEGER NOT NULL DEFAULT 0,
      google_maps_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Room Images Table (Multi-photo support)
  await run(`
    CREATE TABLE IF NOT EXISTS room_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 1,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    )
  `);

  // 3. Room-Specific Payment Methods
  await run(`
    CREATE TABLE IF NOT EXISTS room_payment_methods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    )
  `);

  // 4. Inclusions Configuration Table
  await run(`
    CREATE TABLE IF NOT EXISTS inclusions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0,
      location TEXT NOT NULL DEFAULT 'All',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Rules and Policies Configuration Table
  await run(`
    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 6. Bookings Table
  await run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_number TEXT UNIQUE NOT NULL,
      room_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      guest_count INTEGER NOT NULL,
      contact_number TEXT NOT NULL,
      email TEXT NOT NULL,
      vehicle TEXT NOT NULL,
      age INTEGER NOT NULL,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      booking_status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
      check_in_status TEXT NOT NULL DEFAULT 'NOT_CHECKED_IN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    )
  `);

  // 7. Booking Inclusions Snapshot Table (Preserves price at time of booking)
  await run(`
    CREATE TABLE IF NOT EXISTS booking_inclusions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      inclusion_id INTEGER,
      inclusion_name_snapshot TEXT NOT NULL,
      price_snapshot REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      subtotal REAL NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // 8. Booking Policy Acknowledgements
  await run(`
    CREATE TABLE IF NOT EXISTS booking_policy_acknowledgements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      policy_id INTEGER,
      policy_version TEXT,
      acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // 9. Booking Payment Breakdown Snapshot Table
  await run(`
    CREATE TABLE IF NOT EXISTS booking_payment_breakdown (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE NOT NULL,
      room_rate_snapshot REAL NOT NULL,
      nights INTEGER NOT NULL,
      room_subtotal REAL NOT NULL,
      inclusions_subtotal REAL NOT NULL DEFAULT 0,
      security_deposit REAL NOT NULL DEFAULT 1000,
      other_charges REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      down_payment REAL NOT NULL,
      remaining_balance REAL NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // 10. Payments Table
  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      payment_method TEXT NOT NULL,
      payment_reference TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      paid_at DATETIME,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
  `);

  // 11. Security Deposits Tracking Table
  await run(`
    CREATE TABLE IF NOT EXISTS security_deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE NOT NULL,
      amount REAL NOT NULL DEFAULT 1000,
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      paid_at DATETIME,
      paid_by TEXT,
      refunded_at DATETIME,
      refunded_by TEXT,
      notes TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    )
  `);

  // 12. Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 13. Guest Experiences / Reviews Table (v2.0 Approval Workflow: PENDING, APPROVED, DECLINED)
  await run(`
    CREATE TABLE IF NOT EXISTS guest_experiences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER,
      guest_name TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      review_text TEXT NOT NULL,
      room_name TEXT,
      stay_date TEXT,
      photo_url TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewed_by TEXT
    )
  `);

  // 14. Audit Logs Table
  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target TEXT,
      details TEXT,
      previous_value TEXT,
      new_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 15. System Settings Table
  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 16. Sheets Sync Log Table
  await run(`
    CREATE TABLE IF NOT EXISTS sheets_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_reference TEXT NOT NULL,
      action TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 17. Safe Column Migrations for Existing Tables
  try {
    const roomCols = await all('PRAGMA table_info(rooms)');
    const colNames = roomCols.map((c) => c.name);
    if (!colNames.includes('is_featured')) {
      await run('ALTER TABLE rooms ADD COLUMN is_featured INTEGER NOT NULL DEFAULT 0');
    }
    if (!colNames.includes('google_maps_url')) {
      await run('ALTER TABLE rooms ADD COLUMN google_maps_url TEXT');
    }
    if (!colNames.includes('status')) {
      await run("ALTER TABLE rooms ADD COLUMN status TEXT NOT NULL DEFAULT 'AVAILABLE'");
    }
    if (!colNames.includes('updated_at')) {
      await run('ALTER TABLE rooms ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    }

    const imgCols = await all('PRAGMA table_info(room_images)');
    const imgColNames = imgCols.map((c) => c.name);
    if (!imgColNames.includes('is_primary')) {
      await run('ALTER TABLE room_images ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0');
    }
    if (!imgColNames.includes('created_at')) {
      await run('ALTER TABLE room_images ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    }

    const incCols = await all('PRAGMA table_info(inclusions)');
    const incColNames = incCols.map((c) => c.name);
    if (!incColNames.includes('location')) {
      await run("ALTER TABLE inclusions ADD COLUMN location TEXT NOT NULL DEFAULT 'All'");
    }
  } catch (migErr) {
    console.warn('Migration check notice:', migErr.message);
  }

  console.log('Database v2.0 tables initialized successfully.');
};
