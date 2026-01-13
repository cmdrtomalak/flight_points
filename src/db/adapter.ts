import { type Database } from 'bun:sqlite';
import { type Pool } from 'pg';

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

export interface DatabaseAdapter {
  init(): Promise<void>;

  cleanupOldData(): Promise<number>;

  createSearch(search: Omit<SearchRecord, 'id' | 'created_at'>): Promise<number>;

  updateSearchStatus(id: number, status: SearchRecord['status']): Promise<void>;

  insertAwards(awards: Omit<AwardResult, 'id' | 'created_at'>[]): Promise<void>;

  findCachedResults(
    origin: string,
    destination: string,
    departDate: string,
    cabin: string,
    airlines?: string[]
  ): Promise<AwardResult[]>;

  getRecentSearches(limit?: number): Promise<SearchRecord[]>;

  getAwardsBySearchId(searchId: number): Promise<AwardResult[]>;
}
