import type { DatabaseAdapter, AwardResult, SearchRecord } from './adapter';
import { SqliteAdapter } from './sqlite';
import { PostgresAdapter } from './postgres';

// Re-export types
export type { AwardResult, SearchRecord };

// Configuration
const config = {
  cacheDurationDays: parseInt(process.env.CACHE_DURATION_DAYS || '5', 10),
  dbType: process.env.DB_TYPE || 'sqlite', // 'sqlite' or 'postgres'
  dbPath: process.env.DB_PATH || './data/flights.db',
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'flight_points_db',
  }
};

let adapter: DatabaseAdapter | null = null;

export async function initDatabase(): Promise<void> {
  if (adapter) return;

  if (config.dbType === 'postgres') {
    adapter = new PostgresAdapter(config.postgres, config.cacheDurationDays);
  } else {
    adapter = new SqliteAdapter(config.dbPath, config.cacheDurationDays);
  }

  await adapter.init();
}

function getAdapter(): DatabaseAdapter {
  if (!adapter) throw new Error('Database not initialized. Call initDatabase() first.');
  return adapter;
}

// Exported functions that delegate to the adapter

export function cleanupOldData(): Promise<number> {
  return getAdapter().cleanupOldData();
}

export function createSearch(search: Omit<SearchRecord, 'id' | 'created_at'>): Promise<number> {
  return getAdapter().createSearch(search);
}

export function updateSearchStatus(id: number, status: SearchRecord['status']): Promise<void> {
  return getAdapter().updateSearchStatus(id, status);
}

export function insertAwards(awards: Omit<AwardResult, 'id' | 'created_at'>[]): Promise<void> {
  return getAdapter().insertAwards(awards);
}

export function findCachedResults(
  origin: string,
  destination: string,
  departDate: string,
  cabin: string,
  airlines?: string[]
): Promise<AwardResult[]> {
  return getAdapter().findCachedResults(origin, destination, departDate, cabin, airlines);
}

export function getRecentSearches(limit = 20): Promise<SearchRecord[]> {
  return getAdapter().getRecentSearches(limit);
}

export function getAwardsBySearchId(searchId: number): Promise<AwardResult[]> {
  return getAdapter().getAwardsBySearchId(searchId);
}

export function getCacheDurationDays(): number {
  return config.cacheDurationDays;
}
