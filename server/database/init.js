const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || './data/airplanes.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDatabase() {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
      }
    });
  }
  return db;
}

async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    
    // Create aircraft table
    const aircraftTable = `
      CREATE TABLE IF NOT EXISTS aircraft (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        icao24 TEXT UNIQUE,
        callsign TEXT,
        origin_country TEXT,
        time_position INTEGER,
        time_velocity INTEGER,
        longitude REAL,
        latitude REAL,
        altitude REAL,
        on_ground BOOLEAN,
        velocity REAL,
        true_track REAL,
        vertical_rate REAL,
        sensors TEXT,
        geo_altitude REAL,
        squawk TEXT,
        spi BOOLEAN,
        position_source INTEGER,
        category INTEGER,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create user_locations table
    const userLocationsTable = `
      CREATE TABLE IF NOT EXISTS user_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create aircraft_history table for tracking
    const aircraftHistoryTable = `
      CREATE TABLE IF NOT EXISTS aircraft_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        icao24 TEXT,
        callsign TEXT,
        latitude REAL,
        longitude REAL,
        altitude REAL,
        velocity REAL,
        true_track REAL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_aircraft_icao24 ON aircraft(icao24)',
      'CREATE INDEX IF NOT EXISTS idx_aircraft_position ON aircraft(latitude, longitude)',
      'CREATE INDEX IF NOT EXISTS idx_aircraft_updated ON aircraft(last_updated)',
      'CREATE INDEX IF NOT EXISTS idx_history_icao24 ON aircraft_history(icao24)',
      'CREATE INDEX IF NOT EXISTS idx_history_timestamp ON aircraft_history(timestamp)'
    ];
    
    database.serialize(() => {
      // Enable foreign keys
      database.run('PRAGMA foreign_keys = ON');
      
      // Create tables
      database.run(aircraftTable, (err) => {
        if (err) {
          console.error('Error creating aircraft table:', err);
          reject(err);
          return;
        }
        console.log('✅ Aircraft table created/verified');
      });
      
      database.run(userLocationsTable, (err) => {
        if (err) {
          console.error('Error creating user_locations table:', err);
          reject(err);
          return;
        }
        console.log('✅ User locations table created/verified');
      });
      
      database.run(aircraftHistoryTable, (err) => {
        if (err) {
          console.error('Error creating aircraft_history table:', err);
          reject(err);
          return;
        }
        console.log('✅ Aircraft history table created/verified');
      });
      
      // Create indexes
      indexes.forEach((indexSQL, i) => {
        database.run(indexSQL, (err) => {
          if (err) {
            console.error(`Error creating index ${i + 1}:`, err);
          }
        });
      });
      
      // Wait for all operations to complete
      database.wait((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Database initialization completed');
          resolve();
        }
      });
    });
  });
}

function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

module.exports = {
  getDatabase,
  initializeDatabase,
  closeDatabase
};


