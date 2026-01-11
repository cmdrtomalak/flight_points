import { Pool, type PoolClient } from 'pg';
import type { DatabaseAdapter, AwardResult, SearchRecord } from './adapter';

export class PostgresAdapter implements DatabaseAdapter {
  private pool: Pool;
  private cacheDurationDays: number;

  constructor(connectionConfig: any, cacheDurationDays: number) {
    this.pool = new Pool(connectionConfig);
    this.cacheDurationDays = cacheDurationDays;
  }

  async init(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS searches (
          id SERIAL PRIMARY KEY,
          origin TEXT NOT NULL,
          destination TEXT NOT NULL,
          depart_date TEXT NOT NULL,
          cabin TEXT NOT NULL,
          airlines TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS awards (
          id SERIAL PRIMARY KEY,
          search_id INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
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
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_awards_origin_dest ON awards(origin, destination);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_awards_date ON awards(depart_date);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_searches_created ON searches(created_at);`);

      console.log('PostgreSQL Database initialized');
    } finally {
      client.release();
    }
  }

  async cleanupOldData(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cacheDurationDays);

    const result = await this.pool.query(
      'DELETE FROM searches WHERE created_at < $1',
      [cutoffDate]
    );

    console.log(`Cleaned up ${result.rowCount} old search records (older than ${this.cacheDurationDays} days)`);
    return result.rowCount || 0;
  }

  async createSearch(search: Omit<SearchRecord, 'id' | 'created_at'>): Promise<number> {
    const result = await this.pool.query(
      `INSERT INTO searches (origin, destination, depart_date, cabin, airlines, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        search.origin,
        search.destination,
        search.depart_date,
        search.cabin,
        search.airlines,
        search.status
      ]
    );
    return result.rows[0].id;
  }

  async updateSearchStatus(id: number, status: SearchRecord['status']): Promise<void> {
    await this.pool.query('UPDATE searches SET status = $1 WHERE id = $2', [status, id]);
  }

  async insertAwards(awards: Omit<AwardResult, 'id' | 'created_at'>[]): Promise<void> {
    if (awards.length === 0) return;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const queryText = `
        INSERT INTO awards (search_id, airline, flight_number, origin, destination,
                            depart_date, depart_time, arrive_time, cabin, miles, taxes, available_seats)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      for (const award of awards) {
        await client.query(queryText, [
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
        ]);
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async findCachedResults(
    origin: string,
    destination: string,
    departDate: string,
    cabin: string,
    airlines?: string[]
  ): Promise<AwardResult[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.cacheDurationDays);

    let query = `
      SELECT a.*,
             a.created_at::text as created_at -- Cast to text to match SQLite string format
      FROM awards a
      JOIN searches s ON a.search_id = s.id
      WHERE a.origin = $1
        AND a.destination = $2
        AND a.depart_date = $3
        AND a.cabin = $4
        AND s.status = 'completed'
        AND s.created_at > $5
    `;

    const params: any[] = [origin, destination, departDate, cabin, cutoffDate];

    if (airlines && airlines.length > 0) {
        // Note: Filtering in memory for consistency with SQLite logic or using IN clause
        // Here we can use Postgres ANY($6) if we pass array
        query += ` AND a.airline = ANY($6)`;
        params.push(airlines);
    }

    query += ` ORDER BY a.miles ASC`;

    const result = await this.pool.query(query, params);

    // Postgres returns Date objects for timestamps, but our app expects strings (from SQLite behavior)
    // We casted created_at to text in query, but other fields might need attention if strictly typed.
    // The AwardResult interface has optional string types for most things.
    return result.rows;
  }

  async getRecentSearches(limit = 20): Promise<SearchRecord[]> {
    const result = await this.pool.query(
      `SELECT *, created_at::text as created_at FROM searches ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getAwardsBySearchId(searchId: number): Promise<AwardResult[]> {
    const result = await this.pool.query(
      `SELECT *, created_at::text as created_at FROM awards WHERE search_id = $1 ORDER BY miles ASC`,
      [searchId]
    );
    return result.rows;
  }
}
