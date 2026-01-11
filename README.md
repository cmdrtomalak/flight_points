# Flight Points Dashboard Walkthrough

The Flight Points Dashboard is now set up! This local application allows you to search for flight award availability across 8 major airlines.

## System Architecture

- **Backend**: Bun + Hono + Native SQLite (default) or PostgreSQL 18
- **Frontend**: SolidJS + Vite (Port 8095)
- **Data Source**: Mock scraper (configurable to use Flightplan)

## Getting Started

To run the application, you need two terminal windows:

### 1. Start the Backend API

```bash
cd /Users/kwaliu/src/tries/flight_points
bun run dev
```
Current Status: **Running in background** (BACKEND_PORT, default 3000)

### 2. Start the Frontend Dashboard

```bash
cd /Users/kwaliu/src/tries/flight_points/frontend
bun run dev
```
Then open **[http://localhost:8095](http://localhost:8095)** in your browser.

## Features

- **Search**: Enter Origin, Destination, and Date to find flights.
- **Filtering**: Filter by Cabin Class (Economy, Business, First) and Airlines.
- **Caching**: Results are cached in the database. The cache duration is configurable in `.env` (default: 5 days).
- **Mock Data**: Currently running with a mock scraper for instant feedback. To enable real scraping with Flightplan:
  1. Uncomment `flightplan-tool` in `package.json` dependencies if needed.
  2. Configure airline credentials in `.env` if required (e.g., for Aeroplan).

## Configuration

You can adjust settings by creating a `.env` file in the project root:

```bash
# Example .env configuration
BACKEND_PORT=3000   # Backend API Port
FRONTEND_PORT=8095  # Frontend Dashboard Port
CACHE_DURATION_DAYS=5

# Database Config
DB_TYPE=sqlite      # Options: sqlite (default), postgres
DB_PATH=./data/flights.db # Path to SQLite file (needed for migration)

# PostgreSQL Config (Only if DB_TYPE=postgres)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=flight_points_db
```

### PostgreSQL Setup (Optional)

To switch from the default SQLite backend to PostgreSQL 18:

1.  **Install PostgreSQL**: Ensure you have PostgreSQL 18 installed and running.
2.  **Create Database**: You need to create the database manually before running the app. You can do this via the command line or a GUI tool.

    **Option A: Command Line (psql)**
    ```bash
    # Connect to default postgres DB
    psql -U postgres

    # Run SQL command
    CREATE DATABASE flight_points_db;
    \q
    ```

    **Option B: Command Line (createdb utility)**
    ```bash
    createdb -U postgres flight_points_db
    ```

    **Option C: GUI Tools (PgAdmin, DBeaver, etc.)**
    - Connect to your server.
    - Right-click "Databases" -> Create -> Database.
    - Name it `flight_points_db`.

3.  **Configure .env**: Update your `.env` file to use Postgres:
    ```bash
    DB_TYPE=postgres
    POSTGRES_HOST=localhost
    POSTGRES_PORT=5432
    POSTGRES_USER=your_username
    POSTGRES_PASSWORD=your_password
    POSTGRES_DB=flight_points_db
    ```
4.  **Restart Backend**: Restart the `bun run dev` process. The application will automatically create the necessary tables (`searches`, `awards`) in the new database on startup.

### Migrating Data (SQLite to PostgreSQL)

If you have existing data in SQLite and want to move it to PostgreSQL, follow these steps. The migration script uses `DB_PATH` as the **source** (SQLite) and the Postgres config variables as the **destination**.

1.  **Keep DB_PATH**: Do not remove `DB_PATH` from your `.env` file. It must point to your existing SQLite file (e.g., `./data/flights.db`).
2.  **Set DB_TYPE**: It doesn't matter if `DB_TYPE` is set to `sqlite` or `postgres` for the migration script itself, but you should have your Postgres credentials configured.
3.  **Run the Script**:
    ```bash
    bun src/scripts/migrate.ts
    ```
    *   The script reads all data from the file at `DB_PATH`.
    *   It inserts it into the database configured by `POSTGRES_...` variables.
    *   It preserves relationships between Searches and Awards.
4.  **Verify**: Start the app with `DB_TYPE=postgres` and check your previous search history.

## Troubleshooting

- **Database**: If you encounter database errors with SQLite, delete `data/flights.db` to let the system recreate it. For Postgres, ensure the database exists and credentials are correct.
- **Dependencies**: Ensure you have installed dependencies in both the root and `frontend` directories using `bun install`.
