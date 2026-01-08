import { Database } from 'bun:sqlite';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

// Configuration (inline to avoid import issues)
const config = {
  cacheDurationDays: parseInt(process.env.CACHE_DURATION_DAYS || '5', 10),
  dbPath: process.env.DB_PATH || './data/flights.db',
};

let db: Database | null = null;

export interface AwardResult {
  id?: number;
  search_id: number;
  airline: string;
  flight_number: string;
  origin: string;
  destination: string;
  depart_date: string;
  depart_time: string;
  arrive_time: string;
  cabin: string;
  miles: number;
  taxes: number;
  available_seats: number;
  created_at?: string;
}

export interface SearchRecord {
  id?: number;
  origin: string;
  destination: string;
  depart_date: string;
  cabin: string;
  airlines: string;
  status: 'pending' | 'completed' | 'failed';
  created_at?: string;
}

const schema = `
  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    depart_date TEXT NOT NULL,
    cabin TEXT NOT NULL,
    airlines TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS awards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    search_id INTEGER NOT NULL,
    airline TEXT NOT NULL,
    flight_number TEXT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    depart_date TEXT NOT NULL,
    depart_time TEXT,
    arrive_time TEXT,
    cabin TEXT NOT NULL,
    miles INTEGER,
    taxes REAL,
    available_seats INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (search_id) REFERENCES searches(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_awards_origin_dest ON awards(origin, destination);
  CREATE INDEX IF NOT EXISTS idx_awards_date ON awards(depart_date);
  CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at);
`;

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  await mkdir(dirname(config.dbPath), { recursive: true });

  db = new Database(config.dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(schema);

  console.log(`Database initialized at ${config.dbPath}`);
  return db;
}

export function getDatabase(): Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function cleanupOldData(): number {
  const database = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.cacheDurationDays);

  const stmt = database.prepare(`
    DELETE FROM searches 
    WHERE created_at < datetime(?)
  `);
  const result = stmt.run(cutoffDate.toISOString());

  console.log(`Cleaned up ${result.changes} old search records (older than ${config.cacheDurationDays} days)`);
  return result.changes;
}

export function createSearch(search: Omit<SearchRecord, 'id' | 'created_at'>): number {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO searches (origin, destination, depart_date, cabin, airlines, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    search.origin,
    search.destination,
    search.depart_date,
    search.cabin,
    search.airlines,
    search.status
  );
  return Number(result.lastInsertRowid);
}

export function updateSearchStatus(id: number, status: SearchRecord['status']): void {
  const database = getDatabase();
  database.prepare('UPDATE searches SET status = ? WHERE id = ?').run(status, id);
}

export function insertAwards(awards: Omit<AwardResult, 'id' | 'created_at'>[]): void {
  const database = getDatabase();
  const stmt = database.prepare(`
    INSERT INTO awards (search_id, airline, flight_number, origin, destination, 
                        depart_date, depart_time, arrive_time, cabin, miles, taxes, available_seats)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = database.transaction(() => {
    for (const award of awards) {
      stmt.run(
        award.search_id,
        award.airline,
        award.flight_number,
        award.origin,
        award.destination,
        award.depart_date,
        award.depart_time,
        award.arrive_time,
        award.cabin,
        award.miles,
        award.taxes,
        award.available_seats
      );
    }
  });

  insertMany();
}

export function findCachedResults(
  origin: string,
  destination: string,
  departDate: string,
  cabin: string,
  airlines?: string[]
): AwardResult[] {
  const database = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - config.cacheDurationDays);

  let results = database.prepare(`
    SELECT a.* FROM awards a
    JOIN searches s ON a.search_id = s.id
    WHERE a.origin = ? 
      AND a.destination = ?
      AND a.depart_date = ?
      AND a.cabin = ?
      AND s.status = 'completed'
      AND s.created_at > datetime(?)
    ORDER BY a.miles ASC
  `).all(origin, destination, departDate, cabin, cutoffDate.toISOString()) as AwardResult[];

  // Filter by selected airlines if provided
  if (airlines && airlines.length > 0) {
    results = results.filter(r => airlines.includes(r.airline));
  }

  return results;
}

export function getRecentSearches(limit = 20): SearchRecord[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM searches 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  return stmt.all(limit) as SearchRecord[];
}

export function getAwardsBySearchId(searchId: number): AwardResult[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM awards WHERE search_id = ? ORDER BY miles ASC
  `);
  return stmt.all(searchId) as AwardResult[];
}

export function getCacheDurationDays(): number {
  return config.cacheDurationDays;
}
