import { Hono } from 'hono';
import { getCacheDurationDays } from '../db';

// Re-export getCacheDurationDays
export { getCacheDurationDays } from '../db';

import {
    findCachedResults,
    createSearch,
    updateSearchStatus,
    insertAwards,
    getRecentSearches,
    getAwardsBySearchId,
    cleanupOldData,
    type AwardResult,
} from '../db';
import { searchAwards, getAirlines as getAirlineList, type SearchParams } from '../scraper';

const routes = new Hono();

// Get supported airlines
routes.get('/airlines', (c) => {
    const airlines = getAirlineList();
    return c.json({
        airlines: Object.entries(airlines).map(([code, name]) => ({ code, name })),
    });
});

// Get configuration
routes.get('/config', (c) => {
    return c.json({
        cacheDurationDays: getCacheDurationDays(),
        supportedAirlines: Object.keys(getAirlineList()),
    });
});

// Search for award availability
routes.post('/search', async (c) => {
    const body = await c.req.json<SearchParams>();

    if (!body.origin || !body.destination || !body.departDate) {
        return c.json({ error: 'Missing required fields: origin, destination, departDate' }, 400);
    }

    const origin = body.origin.toUpperCase();
    const destination = body.destination.toUpperCase();
    const departDate = body.departDate;
    const cabin = body.cabin || 'economy';
    const airlines = body.airlines || Object.keys(getAirlineList());
    const forceRefresh = body.forceRefresh || false;

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
        const cached = findCachedResults(origin, destination, departDate, cabin, airlines);
        if (cached.length > 0) {
            return c.json({
                source: 'cache',
                results: cached,
                cacheAge: calculateCacheAge(cached[0]),
            });
        }
    }

    // Create search record
    const searchId = createSearch({
        origin,
        destination,
        depart_date: departDate,
        cabin,
        airlines: JSON.stringify(airlines),
        status: 'pending',
    });

    try {
        // Perform search (mock in this version)
        const results = await searchAwards({
            origin,
            destination,
            departDate,
            cabin,
            airlines,
        });

        // Store results
        if (results.length > 0) {
            const awards: Omit<AwardResult, 'id' | 'created_at'>[] = results.map((r) => ({
                search_id: searchId,
                airline: r.airline,
                flight_number: r.flightNumber || '',
                origin: r.origin,
                destination: r.destination,
                depart_date: r.departDate,
                depart_time: r.departTime || '',
                arrive_time: r.arriveTime || '',
                cabin: r.cabin,
                miles: r.miles,
                taxes: r.taxes || 0,
                available_seats: r.availableSeats || 0,
            }));
            insertAwards(awards);
        }

        updateSearchStatus(searchId, 'completed');

        return c.json({
            source: 'live',
            searchId,
            results,
        });
    } catch (error) {
        updateSearchStatus(searchId, 'failed');
        console.error('Search failed:', error);
        return c.json({ error: 'Search failed', details: String(error) }, 500);
    }
});

// Get cached results
routes.get('/results', (c) => {
    const origin = c.req.query('origin')?.toUpperCase();
    const destination = c.req.query('destination')?.toUpperCase();
    const departDate = c.req.query('departDate');
    const cabin = c.req.query('cabin') || 'economy';

    if (!origin || !destination || !departDate) {
        return c.json({ error: 'Missing required query params' }, 400);
    }

    const results = findCachedResults(origin, destination, departDate, cabin);
    return c.json({ results });
});

// Get recent searches
routes.get('/searches', (c) => {
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const searches = getRecentSearches(limit);
    return c.json({ searches });
});

// Get results for a specific search
routes.get('/searches/:id/awards', (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const awards = getAwardsBySearchId(id);
    return c.json({ awards });
});

// Manual cleanup
routes.delete('/cleanup', (c) => {
    const deleted = cleanupOldData();
    const cacheDays = getCacheDurationDays();
    return c.json({
        deleted,
        message: `Removed ${deleted} search records older than ${cacheDays} days`,
    });
});

// Health check
routes.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

function calculateCacheAge(result: AwardResult): string {
    if (!result.created_at) return 'unknown';
    const created = new Date(result.created_at);
    const now = new Date();
    const hours = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'less than 1 hour';
    if (hours < 24) return `${hours} hours`;
    return `${Math.floor(hours / 24)} days`;
}

export default routes;
