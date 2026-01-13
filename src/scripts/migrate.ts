import { Database } from 'bun:sqlite';
import { Pool } from 'pg';
import { existsSync } from 'fs';

const sqlitePath = process.env.DB_PATH || './data/flights.db';
const postgresUrl = process.env.DATABASE_URL || 'postgresql://flights_admin:postgres@localhost:5432/flight_points_db';

async function migrate() {
    console.log(`Migrating data from SQLite (${sqlitePath}) to PostgreSQL...`);

    if (!existsSync(sqlitePath)) {
        console.error(`SQLite database file not found at ${sqlitePath}`);
        process.exit(1);
    }

    const sqlite = new Database(sqlitePath);
    const pgPool = new Pool({ connectionString: postgresUrl });

    try {
        // Test Postgres connection
        const client = await pgPool.connect();

        // Ensure tables exist in Postgres (using same schema as adapter)
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

        client.release();

        // 1. Migrate Searches
        console.log('Migrating searches...');
        const searches = sqlite.prepare('SELECT * FROM searches ORDER BY id ASC').all() as any[];

        // We need to map old SQLite IDs to new Postgres IDs if we want to preserve integrity
        // But since we can set the ID in Postgres if we want, or rely on auto-increment.
        // To be safe and simple, let's insert and map the IDs.

        const idMap = new Map<number, number>();

        for (const search of searches) {
            const res = await pgPool.query(
                `INSERT INTO searches (origin, destination, depart_date, cabin, airlines, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [search.origin, search.destination, search.depart_date, search.cabin, search.airlines, search.status, search.created_at]
            );
            idMap.set(search.id, res.rows[0].id);
        }
        console.log(`Migrated ${searches.length} search records.`);

        // 2. Migrate Awards
        console.log('Migrating awards...');
        const awards = sqlite.prepare('SELECT * FROM awards').all() as any[];
        let awardsCount = 0;

        for (const award of awards) {
            const newSearchId = idMap.get(award.search_id);
            if (!newSearchId) {
                console.warn(`Skipping award ${award.id}: Parent search ID ${award.search_id} not found in new mapping.`);
                continue;
            }

            await pgPool.query(
                `INSERT INTO awards (search_id, airline, flight_number, origin, destination,
                                    depart_date, depart_time, arrive_time, cabin, miles, taxes, available_seats, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    newSearchId,
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
                    award.available_seats,
                    award.created_at
                ]
            );
            awardsCount++;
        }
        console.log(`Migrated ${awardsCount} award records.`);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await pgPool.end();
        sqlite.close();
    }
}

migrate();
