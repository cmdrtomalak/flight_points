import { Database } from 'bun:sqlite';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import type { DatabaseAdapter, AwardResult, SearchRecord } from './adapter';

export class SqliteAdapter implements DatabaseAdapter {
  private db: Database | null = null;
  private dbPath: string;
  private cacheDurationDays: number;

  constructor(dbPath: string, cacheDurationDays: number) {
    this.dbPath = dbPath;
    this.cacheDurationDays = cacheDurationDays;
  }

  private getDatabase(): Database {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');
    return this.db;
  }

  async init(): Promise<void> {
    if (this.db) return;

    await mkdir(dirname(this.dbPath), { recursive: true });

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

    this.db = new Database(this.dbPath);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec(schema);

    console.log(`SQLite Database initialized at ${this.dbPath}`);
  }

  async cleanupOldData(): Promise<number> {
    const database = this.getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cacheDurationDays);

    const stmt = database.prepare(`
      DELETE FROM searches
      WHERE created_at < datetime(?)
    `);
    const result = stmt.run(cutoffDate.toISOString());

    console.log(`Cleaned up ${result.changes} old search records (older than ${this.cacheDurationDays} days)`);
    return result.changes;
  }

  async createSearch(search: Omit<SearchRecord, 'id' | 'created_at'>): Promise<number> {
    const database = this.getDatabase();
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

  async updateSearchStatus(id: number, status: SearchRecord['status']): Promise<void> {
    const database = this.getDatabase();
    database.prepare('UPDATE searches SET status = ? WHERE id = ?').run(status, id);
  }

  async insertAwards(awards: Omit<AwardResult, 'id' | 'created_at'>[]): Promise<void> {
    const database = this.getDatabase();
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

  async findCachedResults(
    origin: string,
    destination: string,
    departDate: string,
    cabin: string,
    airlines?: string[]
  ): Promise<AwardResult[]> {
    const database = this.getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cacheDurationDays);

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

    if (airlines && airlines.length > 0) {
      results = results.filter(r => airlines.includes(r.airline));
    }

    return results;
  }

  async getRecentSearches(limit = 20): Promise<SearchRecord[]> {
    const database = this.getDatabase();
    const stmt = database.prepare(`
      SELECT * FROM searches
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as SearchRecord[];
  }

  async getAwardsBySearchId(searchId: number): Promise<AwardResult[]> {
    const database = this.getDatabase();
    const stmt = database.prepare(`
      SELECT * FROM awards WHERE search_id = ? ORDER BY miles ASC
    `);
    return stmt.all(searchId) as AwardResult[];
  }
}
