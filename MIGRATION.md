# SQLite to PostgreSQL Migration Guide

This guide explains how to migrate the Flight Points database from SQLite to PostgreSQL.

## Prerequisites

- PostgreSQL installed on your system.
- `psql` command-line tool.
- [Bun](https://bun.sh/) runtime installed.

## Step 1: Create the PostgreSQL Database

Run the following commands to create a new database and user. You may need to run these as the `postgres` user.

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Run these SQL commands in the psql prompt:
CREATE DATABASE flight_points_db;
CREATE USER flights_admin WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE flight_points_db TO flights_admin;

-- Connect to the new database to grant schema permissions (required for Postgres 15+)
\c flight_points_db
GRANT ALL ON SCHEMA public TO flights_admin;
\q
```

*Note: If you already have a `flights_admin` user with the password `postgres`, you only need to create the database.*

## Step 2: Configure Environment Variables

The application and the migration script use a `DATABASE_URL` to connect to PostgreSQL.

### Bash/Zsh
```bash
export DB_TYPE=postgres
export DATABASE_URL="postgresql://flights_admin:postgres@localhost:5432/flight_points_db"
```

### Fish
```fish
set -x DB_TYPE postgres
set -x DATABASE_URL "postgresql://flights_admin:postgres@localhost:5432/flight_points_db"
```

## Step 3: Run the Migration Script

Ensure you are in the project root directory and run the migration script:

```bash
bun run src/scripts/migrate.ts
```

This script will:
1. Connect to your existing SQLite database (`./data/flights.db` by default).
2. Connect to the new PostgreSQL database.
3. Create the necessary tables and indexes in PostgreSQL.
4. Migrate all search records and award results.

## Step 4: Verify the Migration

After running the script, you can verify the data in PostgreSQL:

```bash
psql $DATABASE_URL -c "SELECT count(*) FROM searches;"
psql $DATABASE_URL -c "SELECT count(*) FROM awards;"
```

## Step 5: Start the Application with PostgreSQL

To run the application using PostgreSQL, ensure `DB_TYPE=postgres` is set in your environment or `.env` file.

```bash
# Start the backend
DB_TYPE=postgres bun run dev
```

## Using a `.env` File

Instead of setting environment variables manually, you can create a `.env` file in the project root:

```text
DB_TYPE=postgres
DATABASE_URL=postgresql://flights_admin:postgres@localhost:5432/flight_points_db
```

The application will automatically load these settings on startup.
