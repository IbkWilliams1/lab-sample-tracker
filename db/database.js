const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'data', 'tracker.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

function ensureColumn(tableName, columnName, columnDefinition) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`Failed to inspect ${tableName}:`, err.message);
      return;
    }

    const exists = columns.some(col => col.name === columnName);

    if (!exists) {
      db.run(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`,
        (alterErr) => {
          if (alterErr) {
            console.error(`Failed to add column ${columnName}:`, alterErr.message);
          } else {
            console.log(`Added column ${columnName} to ${tableName}`);
          }
        }
      );
    }
  });
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      labId TEXT NOT NULL,
      vessel TEXT NOT NULL,
      operationStage TEXT NOT NULL,
      relatedParty TEXT,
      sampleDescription TEXT NOT NULL,
      client TEXT NOT NULL,
      cargo TEXT NOT NULL,
      source TEXT NOT NULL,
      port TEXT NOT NULL,
      sealNumber TEXT,
      dateSampled TEXT NOT NULL,
      dateReceived TEXT NOT NULL,
      sampleVolume TEXT NOT NULL,
      samplingMethod TEXT NOT NULL,
      chemist TEXT NOT NULL,
      surveyor TEXT,
      rack TEXT NOT NULL,
      shelf TEXT NOT NULL,
      position TEXT NOT NULL,
      status TEXT NOT NULL,
      remarks TEXT,
      loggedAt TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_samples_labid_unique
    ON samples(labId)
  `);

  ensureColumn('samples', 'currentQuantity', 'REAL');
  ensureColumn('samples', 'quantityUnit', 'TEXT');
  ensureColumn('samples', 'movementCount', 'INTEGER DEFAULT 0');
  ensureColumn('samples', 'currentLocation', 'TEXT');

  db.run(`
    CREATE TABLE IF NOT EXISTS sample_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sampleId INTEGER NOT NULL,
      movementType TEXT NOT NULL,
      fromLocation TEXT,
      toLocation TEXT,
      quantityMoved REAL,
      quantityReturned REAL,
      remainingQuantity REAL,
      unit TEXT,
      note TEXT,
      movedAt TEXT NOT NULL,
      FOREIGN KEY (sampleId) REFERENCES samples(id)
    )
  `);
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = { db, run, get, all };