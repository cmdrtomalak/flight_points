import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { initDatabase, cleanupOldData, getCacheDurationDays } from './db';
import routes from './routes';

// Configuration
const PORT = parseInt(process.env.BACKEND_PORT || '3000', 10);
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '8095', 10);

const app = new Hono();

// Enable CORS for frontend dev server
app.use('/*', cors({
    origin: [`http://localhost:${FRONTEND_PORT}`, 'http://localhost:3000'],
    credentials: true,
}));

// API routes
app.route('/api', routes);

// Serve static frontend files in production
app.use('/*', serveStatic({ root: './frontend/dist' }));

// Fallback to index.html for SPA routing
app.get('*', serveStatic({ path: './frontend/dist/index.html' }));

// Cleanup scheduler - runs daily
function scheduleCleanup() {
    const runCleanup = () => {
        console.log('Running scheduled cleanup...');
        try {
            cleanupOldData();
        } catch (error) {
            console.error('Cleanup failed:', error);
        }
    };

    // Run cleanup on startup
    runCleanup();

    // Schedule daily cleanup (24 hours in ms)
    setInterval(runCleanup, 24 * 60 * 60 * 1000);
}

async function main() {
    console.log('Initializing database...');
    await initDatabase();

    // Start cleanup scheduler
    scheduleCleanup();

    const cacheDays = getCacheDurationDays();

    console.log(`
╔═══════════════════════════════════════════════════════╗
║  Flight Points Search Dashboard                       ║
║                                                       ║
║  API Server:    http://localhost:${PORT}                ║
║  Frontend:      http://localhost:${FRONTEND_PORT}               ║
║  Cache TTL:     ${cacheDays} days                              ║
╚═══════════════════════════════════════════════════════╝
  `);

    Bun.serve({
        port: PORT,
        fetch: app.fetch,
    });
}

main().catch(console.error);
