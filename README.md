# Flight Points Dashboard Walkthrough

The Flight Points Dashboard is now set up! This local application allows you to search for flight award availability across 8 major airlines.

## System Architecture

- **Backend**: Bun + Hono + Native SQLite (default port 3000)
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
- **Caching**: Results are cached in `data/flights.db`. The cache duration is configurable in `.env` (default: 5 days).
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
```

To change the ports:
1. Create or edit `.env` in the root directory.
2. Add `BACKEND_PORT=4000` (or your desired backend port).
3. Add `FRONTEND_PORT=9000` (or your desired frontend port).
4. Restart both backend and frontend terminals.

## Troubleshooting

- **Database**: If you encounter database errors, delete `data/flights.db` to let the system recreate it.
- **Dependencies**: Ensure you have installed dependencies in both the root and `frontend` directories using `bun install`.
